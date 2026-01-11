import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  type: string;
  category: string;
  funding_source?: string | null;
  description: string;
  amount: number;
  transaction_date: string;
  created_at: string;
  image_url: string | null;
  payment_id: string | null;
  payments?: {
    id: string;
    resident_id: string;
    months: string[];
    amount: number;
    notes: string | null;
    residents?: {
      name: string;
      address: string;
      property_type: string;
    } | null;
  } | null;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, payments(*, residents(name, address, property_type))')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data transaksi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

    useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('public:transactions')
      .on(
        'postgres_changes',
        { event: '*', table: 'transactions', schema: 'public' },
        (payload) => {
          console.log('Realtime transaction update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newTransaction = payload.new as Transaction;
            setTransactions((prev) => {
              // Avoid duplicates
              if (prev.some(t => t.id === newTransaction.id)) return prev;
              const updated = [newTransaction, ...prev];
              return updated.sort((a, b) => 
                new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTransaction = payload.new as Transaction;
            setTransactions((prev) => 
              prev.map((t) => (t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTransactions((prev) => prev.filter((t) => t.id !== deletedId));
          } else {
            fetchTransactions();
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to transaction changes');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTransaction = async (transaction: {
    type: string;
    category: string;
    funding_source?: string | null;
    description: string;
    amount: number;
    image_url?: string | null;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            type: transaction.type,
            category: transaction.category,
            funding_source: transaction.funding_source || null,
            description: transaction.description,
            amount: transaction.amount,
            transaction_date: new Date().toISOString().split('T')[0],
            image_url: transaction.image_url || null,
            created_by: userData.user?.id,
          })
        .select()
        .single();

      if (error) throw error;
      // setTransactions((prev) => [data, ...prev]); // Handled by realtime
      return { success: true };
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambah transaksi',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateTransaction = async (
    id: string,
    transaction: {
      type: string;
      category: string;
      funding_source?: string | null;
      description: string;
      amount: number;
      image_url?: string | null;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          type: transaction.type,
          category: transaction.category,
          funding_source: transaction.funding_source || null,
          description: transaction.description,
          amount: transaction.amount,
          image_url: transaction.image_url,
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui transaksi',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);

      if (error) throw error;
      // setTransactions((prev) => prev.filter((t) => t.id !== id)); // Handled by realtime
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const bulkAddTransactions = async (
    transactionsData: {
      type: string;
      category: string;
      description: string;
      amount: number;
    }[]
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const insertData = transactionsData.map((t) => ({
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount,
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: userData.user?.id,
      }));

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertData)
        .select();

      if (error) throw error;

      // setTransactions((prev) => [...(data || []), ...prev]); // Handled by realtime
      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Error bulk adding transactions:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengimport transaksi',
        variant: 'destructive',
      });
      return { success: false, count: 0 };
    }
  };

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    bulkAddTransactions,
    refetch: fetchTransactions,
  };
}
