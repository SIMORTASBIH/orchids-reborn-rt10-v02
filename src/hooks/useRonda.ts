import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RondaGroup {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export interface RondaSchedule {
  id: string;
  group_id: string;
  schedule_date: string;
  snack_responsible_id: string;
  created_at: string;
}

export interface RondaGroupMember {
  resident_id: string;
  residents: {
    name: string;
  };
}

export interface RondaGroupWithMembers extends RondaGroup {
  ronda_group_members: RondaGroupMember[];
}

export const useRonda = () => {
  const queryClient = useQueryClient();

  const getResidents = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const getRondaGroups = useQuery<RondaGroupWithMembers[]>({
    queryKey: ["ronda_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ronda_groups")
        .select(`
          *,
          ronda_group_members (
            resident_id,
            residents (name)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const createRondaModule = useMutation({
    mutationFn: async ({
      name,
      residentIds,
      schedules,
    }: {
      name: string;
      residentIds: string[];
      schedules: { date: Date; snackResponsibleId: string }[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Unauthorized");

      // 1. Create Group
      const { data: group, error: groupError } = await supabase
        .from("ronda_groups")
        .insert({ name, created_by: userData.user.id })
        .select()
        .single();
      if (groupError) throw groupError;

      // 2. Add Members
      const members = residentIds.map((id) => ({
        group_id: group.id,
        resident_id: id,
      }));
      const { error: membersError } = await supabase
        .from("ronda_group_members")
        .insert(members);
      if (membersError) throw membersError;

      // 3. Add Schedules
      const scheduleInserts = schedules.map((s) => ({
        group_id: group.id,
        schedule_date: s.date.toISOString().split("T")[0],
        snack_responsible_id: s.snackResponsibleId,
      }));
      const { error: schedulesError } = await supabase
        .from("ronda_schedules")
        .insert(scheduleInserts);
      if (schedulesError) throw schedulesError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ronda_groups"] });
      toast.success("Jadwal Ronda berhasil dibuat!");
    },
    onError: (error: Error) => {
      toast.error("Gagal membuat jadwal: " + error.message);
    },
  });

  return {
    getResidents,
    getRondaGroups,
    createRondaModule,
  };
};
