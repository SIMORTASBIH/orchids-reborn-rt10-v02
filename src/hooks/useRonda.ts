import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RondaGroup {
  id: string;
  name: string;
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
  snack_responsible_id: string;
  created_at: string;
  snack_responsible?: {
    name: string;
  };
}

export const useRonda = () => {
  const [groups, setGroups] = useState<RondaGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('ronda_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data kelompok ronda',
        variant: 'destructive',
      });
    } else {
      setGroups(data || []);
    }
    setIsLoading(false);
  };

  const getGroupDetails = async (groupId: string) => {
    const groupPromise = supabase.from('ronda_groups').select('*').eq('id', groupId).single();
    const membersPromise = supabase
      .from('ronda_group_members')
      .select('*, resident:residents(name, address)')
      .eq('group_id', groupId);
    const schedulesPromise = supabase
      .from('ronda_schedules')
      .select('*, snack_responsible:residents(name)')
      .eq('group_id', groupId)
      .order('schedule_date', { ascending: true });

    const [groupRes, membersRes, schedulesRes] = await Promise.all([
      groupPromise,
      membersPromise,
      schedulesPromise,
    ]);

    return {
      group: groupRes.data as RondaGroup,
      members: membersRes.data as RondaGroupMember[],
      schedules: schedulesRes.data as RondaSchedule[],
      error: groupRes.error || membersRes.error || schedulesRes.error,
    };
  };

  const createRondaGroup = async (
    name: string,
    residentIds: string[],
    schedules: { date: string; snack_responsible_id: string }[]
  ) => {
    // Start a "transaction" via sequence of calls
    const { data: group, error: groupError } = await supabase
      .from('ronda_groups')
      .insert({ name })
      .select()
      .single();

    if (groupError) return { success: false, error: groupError };

    const membersToInsert = residentIds.map((rid) => ({
      group_id: group.id,
      resident_id: rid,
    }));

    const { error: membersError } = await supabase
      .from('ronda_group_members')
      .insert(membersToInsert);

    if (membersError) return { success: false, error: membersError };

    if (schedules.length > 0) {
      const schedulesToInsert = schedules.map((s) => ({
        group_id: group.id,
        schedule_date: s.date,
        snack_responsible_id: s.snack_responsible_id,
      }));

      const { error: schedulesError } = await supabase
        .from('ronda_schedules')
        .insert(schedulesToInsert);

      if (schedulesError) return { success: false, error: schedulesError };
    }

    await fetchGroups();
    return { success: true, group };
  };

  const updateRondaGroup = async (
    groupId: string,
    name: string,
    residentIds: string[],
    schedules: { date: string; snack_responsible_id: string }[]
  ) => {
    // Update name
    const { error: groupError } = await supabase
      .from('ronda_groups')
      .update({ name })
      .eq('id', groupId);

    if (groupError) return { success: false, error: groupError };

    // Update members: delete and re-insert
    await supabase.from('ronda_group_members').delete().eq('group_id', groupId);
    const membersToInsert = residentIds.map((rid) => ({
      group_id: groupId,
      resident_id: rid,
    }));
    await supabase.from('ronda_group_members').insert(membersToInsert);

    // Update schedules: delete and re-insert
    await supabase.from('ronda_schedules').delete().eq('group_id', groupId);
    if (schedules.length > 0) {
      const schedulesToInsert = schedules.map((s) => ({
        group_id: groupId,
        schedule_date: s.date,
        snack_responsible_id: s.snack_responsible_id,
      }));
      await supabase.from('ronda_schedules').insert(schedulesToInsert);
    }

    await fetchGroups();
    return { success: true };
  };

  const deleteRondaGroup = async (groupId: string) => {
    const { error } = await supabase.from('ronda_groups').delete().eq('id', groupId);
    if (error) return { success: false, error };
    await fetchGroups();
    return { success: true };
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    isLoading,
    fetchGroups,
    getGroupDetails,
    createRondaGroup,
    updateRondaGroup,
    deleteRondaGroup,
  };
};
