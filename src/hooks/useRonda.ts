import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RondaGroup {
  id: string;
  name: string;
  period_type: PeriodType;
  year: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  created_by: string | null;
}

export interface RondaMember {
  id: string;
  group_id: string;
  resident_id: string;
  resident?: {
    id: string;
    name: string;
  };
}

export interface RondaSchedule {
  id: string;
  group_id: string;
  schedule_date: string;
  snack_responsible_id: string | null;
  snack_responsible?: {
    id: string;
    name: string;
  };
}

export function useRonda() {
  const [groups, setGroups] = useState<RondaGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ronda_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      console.error('Error fetching ronda groups:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data kelompok ronda',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupDetail = async (id: string) => {
    try {
      const { data: group, error: groupError } = await supabase
        .from('ronda_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;

      const { data: members, error: membersError } = await supabase
        .from('ronda_group_members')
        .select('*, resident:residents(id, name)')
        .eq('group_id', id);

      if (membersError) throw membersError;

      const { data: schedules, error: schedulesError } = await supabase
        .from('ronda_schedules')
        .select('*, snack_responsible:residents(id, name)')
        .eq('group_id', id)
        .order('schedule_date', { ascending: true });

      if (schedulesError) throw schedulesError;

      return { group, members, schedules };
    } catch (error: any) {
      console.error('Error fetching ronda detail:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat detail kelompok ronda',
        variant: 'destructive',
      });
      return null;
    }
  };

  const createGroup = async (
    groupData: Omit<RondaGroup, 'id' | 'created_at' | 'created_by'>,
    memberIds: string[],
    schedules: { schedule_date: string; snack_responsible_id: string | null }[]
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // 1. Create Group
      const { data: group, error: groupError } = await supabase
        .from('ronda_groups')
        .insert({
          ...groupData,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Create Members
      if (memberIds.length > 0) {
        const { error: membersError } = await supabase
          .from('ronda_group_members')
          .insert(memberIds.map(residentId => ({
            group_id: group.id,
            resident_id: residentId,
          })));

        if (membersError) throw membersError;
      }

      // 3. Create Schedules
      if (schedules.length > 0) {
        const { error: schedulesError } = await supabase
          .from('ronda_schedules')
          .insert(schedules.map(s => ({
            group_id: group.id,
            schedule_date: s.schedule_date,
            snack_responsible_id: s.snack_responsible_id,
          })));

        if (schedulesError) throw schedulesError;
      }

      await fetchGroups();
      return { success: true, data: group };
    } catch (error: any) {
      console.error('Error creating ronda group:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat kelompok ronda',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateGroup = async (
    id: string,
    groupData: Partial<RondaGroup>,
    memberIds?: string[],
    schedules?: { schedule_date: string; snack_responsible_id: string | null }[]
  ) => {
    try {
      // 1. Update Group
      const { error: groupError } = await supabase
        .from('ronda_groups')
        .update(groupData)
        .eq('id', id);

      if (groupError) throw groupError;

      // 2. Update Members (if provided, replace all)
      if (memberIds) {
        await supabase.from('ronda_group_members').delete().eq('group_id', id);
        if (memberIds.length > 0) {
          const { error: membersError } = await supabase
            .from('ronda_group_members')
            .insert(memberIds.map(residentId => ({
              group_id: id,
              resident_id: residentId,
            })));
          if (membersError) throw membersError;
        }
      }

      // 3. Update Schedules (if provided, replace all)
      if (schedules) {
        await supabase.from('ronda_schedules').delete().eq('group_id', id);
        if (schedules.length > 0) {
          const { error: schedulesError } = await supabase
            .from('ronda_schedules')
            .insert(schedules.map(s => ({
              group_id: id,
              schedule_date: s.schedule_date,
              snack_responsible_id: s.snack_responsible_id,
            })));
          if (schedulesError) throw schedulesError;
        }
      }

      await fetchGroups();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating ronda group:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui kelompok ronda',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase.from('ronda_groups').delete().eq('id', id);
      if (error) throw error;
      setGroups(prev => prev.filter(g => g.id !== id));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting ronda group:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus kelompok ronda',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    isLoading,
    fetchGroups,
    fetchGroupDetail,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
