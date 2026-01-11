import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  resident_id: string;
  category_id: string | null;
  funding_source?: string | null;
  months: string[];
  amount: number;
  notes: string | null;
  created_at: string;
  residents?: {
    name: string;
    address: string;
    property_type: string;
  } | null;
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, residents(name, address, property_type)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as Payment[]);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pembayaran',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('payments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

    const addPayment = async (payment: {
      resident_id: string;
      category_id?: string;
      funding_source?: string | null;
      months: string[];
      amount: number;
      notes?: string;
      residentName?: string;
    }) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('payments')
          .insert({
            resident_id: payment.resident_id,
            category_id: payment.category_id || null,
            funding_source: payment.funding_source || null,
            months: payment.months,
            amount: payment.amount,
            notes: payment.notes || null,
            created_by: userData.user?.id,
          })
          .select('*, residents(name, address, property_type)')
          .single();

      if (error) throw error;
      
      return { success: true, payment: data as Payment };
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambah pembayaran',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

    const updatePayment = async (id: string, payment: {
      resident_id: string;
      category_id?: string;
      funding_source?: string | null;
      months: string[];
      amount: number;
      notes?: string;
      residentName?: string;
    }) => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .update({
            resident_id: payment.resident_id,
            category_id: payment.category_id || null,
            funding_source: payment.funding_source || null,
            months: payment.months,
            amount: payment.amount,
            notes: payment.notes || null,
          })
          .eq('id', id)
          .select('*, residents(name, address, property_type)')
          .single();

      if (error) throw error;

      return { success: true, payment: data as Payment };
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui pembayaran',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Transactions will be auto-deleted due to ON DELETE CASCADE
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus pembayaran',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const getPaidMonthsForResident = (residentId: string): string[] => {
    return payments
      .filter((p) => p.resident_id === residentId)
      .flatMap((p) => p.months);
  };

  return {
    payments,
    isLoading,
    addPayment,
    updatePayment,
    deletePayment,
    getPaidMonthsForResident,
    refetch: fetchPayments,
  };
}
