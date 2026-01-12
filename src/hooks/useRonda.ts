import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RondaGroup {
  id: string;
  name: string;
  period_type: PeriodType;
  valid_year: number;
  created_at: string;
  members?: RondaGroupMember[];
}

export interface RondaGroupMember {
  id: string;
  group_id: string;
  resident_id: string;
  residents?: {
    name: string;
    address: string;
  };
}

export interface RondaSchedule {
  id: string;
  group_id: string;
  schedule_date: string;
  officer_in_charge_id: string | null;
  notes: string | null;
  residents?: {
    name: string;
  };
}

export function useRonda() {
  const [groups, setGroups] = useState<RondaGroup[]>([]);
  const [schedules, setSchedules] = useState<RondaSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('ronda_groups')
        .select(`
          *,
          members:ronda_group_members(
            *,
            residents:residents(name, address)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      console.error('Error fetching ronda groups:', error);
    }
  };

  const fetchSchedules = async (month?: number, year?: number) => {
    try {
      let query = supabase
        .from('ronda_schedules')
        .select(`
          *,
          residents:residents(name)
        `)
        .order('schedule_date', { ascending: true });

      if (month && year) {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0).toISOString();
        query = query.gte('schedule_date', startDate).lte('schedule_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      console.error('Error fetching ronda schedules:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchGroups(), fetchSchedules()]);
      setIsLoading(false);
    };
    init();

    const channel = supabase
      .channel('ronda-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ronda_groups' }, fetchGroups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ronda_group_members' }, fetchGroups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ronda_schedules' }, () => fetchSchedules())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createGroupWithSchedules = async (
    name: string,
    periodType: PeriodType,
    memberIds: string[],
    dates: Date[]
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // 1. Create Group
      const { data: group, error: groupError } = await supabase
        .from('ronda_groups')
        .insert({
          name,
          period_type: periodType,
          created_by: userData.user?.id,
          valid_year: new Date().getFullYear()
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add Members
      const membersToInsert = memberIds.map(resId => ({
        group_id: group.id,
        resident_id: resId
      }));

      const { error: membersError } = await supabase
        .from('ronda_group_members')
        .insert(membersToInsert);

      if (membersError) throw membersError;

      // 3. Create Schedules
      // Assign officers in rotation
      const schedulesToInsert = dates.map((date, index) => ({
        group_id: group.id,
        schedule_date: date.toISOString().split('T')[0],
        officer_in_charge_id: memberIds[index % memberIds.length]
      }));

      const { error: schedulesError } = await supabase
        .from('ronda_schedules')
        .insert(schedulesToInsert);

      if (schedulesError) throw schedulesError;

      toast({
        title: 'Berhasil',
        description: 'Kelompok ronda dan jadwal berhasil dibuat',
      });
      return { success: true, groupId: group.id };
    } catch (error: any) {
      console.error('Error creating ronda group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal membuat kelompok ronda',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase.from('ronda_groups').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: 'Berhasil',
        description: 'Kelompok ronda berhasil dihapus',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting ronda group:', error);
      return { success: false };
    }
  };

  return {
    groups,
    schedules,
    isLoading,
    createGroupWithSchedules,
    deleteGroup,
    refetch: () => Promise.all([fetchGroups(), fetchSchedules()])
  };
}
