import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RondaGroup {
  id: string;
  name: string;
  year_valid: string[];
  period: string;
  created_at: string;
  created_by: string;
}

export interface RondaGroupMember {
  id: string;
  group_id: string;
  resident_id: string;
  resident?: {
    name: string;
    address: string;
  };
}

export interface RondaSchedule {
  id: string;
  group_id: string;
  schedule_date: string;
  notes: string | null;
  group?: RondaGroup;
}

export const useRonda = () => {
  const queryClient = useQueryClient();

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["ronda_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ronda_groups")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as RondaGroup[];
    },
  });

  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["ronda_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ronda_schedules")
        .select("*, group:ronda_groups(*)")
        .order("schedule_date", { ascending: true });
      
      if (error) throw error;
      return data as RondaSchedule[];
    },
  });

  const createGroup = useMutation({
    mutationFn: async (payload: {
      name: string;
      year_valid: string[];
      period: string;
      resident_ids: string[];
      schedule_dates: Date[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      // 1. Create Group
      const { data: group, error: groupError } = await supabase
        .from("ronda_groups")
        .insert({
          name: payload.name,
          year_valid: payload.year_valid,
          period: payload.period,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add Members
      const membersPayload = payload.resident_ids.map((resident_id) => ({
        group_id: group.id,
        resident_id,
      }));

      const { error: membersError } = await supabase
        .from("ronda_group_members")
        .insert(membersPayload);

      if (membersError) throw membersError;

      // 3. Add Schedules
      const schedulesPayload = payload.schedule_dates.map((date) => ({
        group_id: group.id,
        schedule_date: date.toISOString().split("T")[0],
      }));

      const { error: schedulesError } = await supabase
        .from("ronda_schedules")
        .insert(schedulesPayload);

      if (schedulesError) throw schedulesError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ronda_groups"] });
      queryClient.invalidateQueries({ queryKey: ["ronda_schedules"] });
      toast.success("Jadwal Ronda berhasil dibuat");
    },
    onError: (error) => {
      console.error("Error creating ronda group:", error);
      toast.error("Gagal membuat jadwal ronda");
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ronda_groups")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ronda_groups"] });
      queryClient.invalidateQueries({ queryKey: ["ronda_schedules"] });
      toast.success("Jadwal Ronda berhasil dihapus");
    },
  });

  return {
    groups,
    isLoadingGroups,
    schedules,
    isLoadingSchedules,
    createGroup,
    deleteGroup,
  };
};