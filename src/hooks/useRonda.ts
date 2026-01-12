import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RondaGroup = {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  members?: { resident_id: string; resident: { name: string; address: string } }[];
};

export type RondaSchedule = {
  id: string;
  group_id: string;
  date: string;
  pj_snack_id: string | null;
  notes: string | null;
  group?: RondaGroup;
  pj_snack?: { name: string };
};

export function useRonda() {
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ['ronda_groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ronda_groups')
        .select(`
          *,
          members:ronda_group_members(
            resident_id,
            resident:residents(name, address)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RondaGroup[];
    },
  });

  const schedulesQuery = useQuery({
    queryKey: ['ronda_schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ronda_schedules')
        .select(`
          *,
          group:ronda_groups(name),
          pj_snack:residents(name)
        `)
        .order('date', { ascending: true });
      if (error) throw error;
      return data as RondaSchedule[];
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description, members, schedules }: { 
      name: string; 
      description: string; 
      members: string[]; 
      schedules: { date: string; pj_snack_id: string | null }[] 
    }) => {
      // 1. Create group
      const { data: group, error: groupError } = await supabase
        .from('ronda_groups')
        .insert({ name, description })
        .select()
        .single();
      if (groupError) throw groupError;

      // 2. Add members
      if (members.length > 0) {
        const { error: membersError } = await supabase
          .from('ronda_group_members')
          .insert(members.map(resident_id => ({ group_id: group.id, resident_id })));
        if (membersError) throw membersError;
      }

      // 3. Add schedules
      if (schedules.length > 0) {
        const { error: schedulesError } = await supabase
          .from('ronda_schedules')
          .insert(schedules.map(s => ({ ...s, group_id: group.id })));
        if (schedulesError) throw schedulesError;
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ronda_groups'] });
      queryClient.invalidateQueries({ queryKey: ['ronda_schedules'] });
    },
  });

  return {
    groups: groupsQuery.data || [],
    schedules: schedulesQuery.data || [],
    isLoading: groupsQuery.isLoading || schedulesQuery.isLoading,
    createGroup: createGroupMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
  };
}
