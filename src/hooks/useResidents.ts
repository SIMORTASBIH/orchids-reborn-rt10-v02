import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type PropertyType = 'occupied' | 'empty_house' | 'empty_land';

export interface Resident {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  status: string;
  property_type: PropertyType;
  created_at: string;
}

export function useResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResidents = async () => {
    try {
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResidents((data || []).map(r => ({
        ...r,
        property_type: r.property_type as PropertyType,
      })));
    } catch (error: any) {
      console.error('Error fetching residents:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data warga',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('residents-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'residents',
        },
        () => {
          fetchResidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addResident = async (resident: Omit<Resident, 'id' | 'created_at'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('residents')
        .insert({
          name: resident.name,
          address: resident.address,
          phone: resident.phone,
          status: resident.status,
          property_type: resident.property_type,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setResidents((prev) => [{ ...data, property_type: data.property_type as PropertyType }, ...prev]);
      return { success: true };
    } catch (error: any) {
      console.error('Error adding resident:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambah warga',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateResident = async (id: string, updates: Partial<Resident>) => {
    try {
      const { error } = await supabase
        .from('residents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setResidents((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
      return { success: true };
    } catch (error: any) {
      console.error('Error updating resident:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data warga',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteResident = async (id: string) => {
    try {
      const { error } = await supabase.from('residents').delete().eq('id', id);

      if (error) throw error;
      setResidents((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting resident:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus warga',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const bulkAddResidents = async (
    residentsData: Omit<Resident, 'id' | 'created_at'>[]
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const insertData = residentsData.map((r) => ({
        name: r.name,
        address: r.address,
        phone: r.phone,
        status: r.status,
        property_type: r.property_type,
        created_by: userData.user?.id,
      }));

      const { data, error } = await supabase
        .from('residents')
        .insert(insertData)
        .select();

      if (error) throw error;

      const newResidents = (data || []).map((r) => ({
        ...r,
        property_type: r.property_type as PropertyType,
      }));
      setResidents((prev) => [...newResidents, ...prev]);

      return { success: true, count: newResidents.length };
    } catch (error: any) {
      console.error('Error bulk adding residents:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengimport data warga',
        variant: 'destructive',
      });
      return { success: false, count: 0 };
    }
  };

  return {
    residents,
    isLoading,
    addResident,
    updateResident,
    deleteResident,
    bulkAddResidents,
    refetch: fetchResidents,
  };
}
