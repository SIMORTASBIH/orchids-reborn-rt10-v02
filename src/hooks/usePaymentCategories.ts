import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PaymentCategory {
  id: string;
  name: string;
  amount: number;
  period: 'bulanan' | 'bebas';
  type: 'income' | 'expense';
  funding_sources?: string[];
  created_at?: string;
}

export function usePaymentCategories() {
  const [categories, setCategories] = useState<PaymentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payment_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    const channel = supabase
      .channel('payment_categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_categories',
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategories]);

  const addCategory = async (category: Omit<PaymentCategory, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payment_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Berhasil',
        description: 'Jenis pembayaran berhasil ditambahkan',
      });
      return { success: true, data };
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambahkan jenis pembayaran',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateCategory = async (id: string, updates: Partial<PaymentCategory>) => {
    try {
      const { error } = await supabase
        .from('payment_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Berhasil',
        description: 'Jenis pembayaran berhasil diperbarui',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui jenis pembayaran',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Berhasil',
        description: 'Jenis pembayaran berhasil dihapus',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus jenis pembayaran',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
