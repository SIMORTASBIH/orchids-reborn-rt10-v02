import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Pengurus {
  id: string;
  resident_id: string;
  position: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string | null;
  residents?: {
    name: string;
    phone: string | null;
    address: string | null;
  };
}

export function usePengurus() {
  const [pengurus, setPengurus] = useState<Pengurus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPengurus = async () => {
    try {
      const { data, error } = await supabase
        .from('pengurus')
        .select(`
          *,
          residents (
            name,
            phone,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPengurus(data || []);
    } catch (error: any) {
      console.error('Error fetching pengurus:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pengurus',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengurus();
  }, []);

  const addPengurus = async (data: Omit<Pengurus, 'id' | 'created_at' | 'residents'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: newPengurus, error } = await supabase
        .from('pengurus')
        .insert({
          resident_id: data.resident_id,
          position: data.position,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status,
          created_by: userData.user?.id,
        })
        .select(`
          *,
          residents (
            name,
            phone,
            address
          )
        `)
        .single();

      if (error) throw error;
      setPengurus((prev) => [newPengurus, ...prev]);
      return { success: true };
    } catch (error: any) {
      console.error('Error adding pengurus:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambah pengurus',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updatePengurus = async (id: string, updates: Partial<Pengurus>) => {
    try {
      const { resident_id, position, start_date, end_date, status } = updates;
      const { error } = await supabase
        .from('pengurus')
        .update({
          resident_id,
          position,
          start_date,
          end_date,
          status
        })
        .eq('id', id);

      if (error) throw error;
      
      // Refetch to get updated resident data if resident_id changed
      await fetchPengurus();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating pengurus:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data pengurus',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deletePengurus = async (id: string) => {
    try {
      const { error } = await supabase.from('pengurus').delete().eq('id', id);

      if (error) throw error;
      setPengurus((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pengurus:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus pengurus',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  return {
    pengurus,
    isLoading,
    addPengurus,
    updatePengurus,
    deletePengurus,
    refetch: fetchPengurus,
  };
}
