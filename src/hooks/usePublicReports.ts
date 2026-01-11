import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { calculateResidentBilling, FeeSettings, MONTHS, SYSTEM_START_YEAR, SYSTEM_START_MONTH_INDEX } from './useBilling';

type Resident = Tables<'residents'>;
type Payment = Tables<'payments'>;
type Transaction = Tables<'transactions'>;

const DEFAULT_FEES: FeeSettings = {
  occupied: 80000,
  empty_house: 50000,
  empty_land: 50000,
};

export function usePublicReports() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [feesLoaded, setFeesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [residentsRes, paymentsRes, transactionsRes, settingsRes] = await Promise.all([
        supabase.from('residents').select('*').order('name'),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('app_settings').select('*'),
      ]);

      if (residentsRes.data) setResidents(residentsRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      
      if (settingsRes.data && settingsRes.data.length > 0) {
        const newFees: FeeSettings = { ...DEFAULT_FEES };
        settingsRes.data.forEach((s) => {
          if (s.key === 'fee_occupied') newFees.occupied = parseFloat(s.value) || DEFAULT_FEES.occupied;
          if (s.key === 'fee_empty_house') newFees.empty_house = parseFloat(s.value) || DEFAULT_FEES.empty_house;
          if (s.key === 'fee_empty_land') newFees.empty_land = parseFloat(s.value) || DEFAULT_FEES.empty_land;
        });
        setFees(newFees);
        setFeesLoaded(true);
      } else {
        setFees(DEFAULT_FEES);
        setFeesLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('public-reports-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const activeResidents = useMemo(() => residents.filter((r) => r.status === 'active'), [residents]);

  const residentsWithBilling = useMemo(() => {
    return activeResidents.map((resident) => {
      const billing = calculateResidentBilling(resident, payments, fees, selectedMonth, selectedYear);
      return {
        ...resident,
        ...billing,
        displayStatus: billing.status,
        displayBill: billing.billAmount,
        totalBill: billing.unpaidMonths.length * billing.fee
      };
    });
  }, [activeResidents, payments, fees, selectedMonth, selectedYear]);

  const summary = useMemo(() => {
    let periodTransactions = transactions;
    if (selectedMonth !== 'all') {
      const selectedMonthIndex = MONTHS.indexOf(selectedMonth);
      periodTransactions = transactions.filter((t) => {
        const date = new Date(t.transaction_date || t.created_at);
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonthIndex;
      });
    } else {
      periodTransactions = transactions.filter((t) => {
        const date = new Date(t.transaction_date || t.created_at);
        return date.getFullYear() === selectedYear;
      });
    }

    const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
    const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate total balance across all time up to current selection
    const allTimeTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date || t.created_at);
      const monthIdx = selectedMonth === 'all' ? 11 : MONTHS.indexOf(selectedMonth);
      const targetDate = new Date(selectedYear, monthIdx, 31);
      return date <= targetDate;
    });

    const totalBalance = allTimeTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    }, 0);

    const totalUnpaidBalance = residentsWithBilling.reduce((sum, r) => sum + (r.displayBill), 0);
    
    // Improved Target, Realization, and Unpaid calculation synchronized with Filter
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    const targetMonthIndices: number[] = [];
    if (selectedMonth === 'all') {
      // If 'all', use all 12 months (0-11) as requested: "maka dikalikan 12 bulan"
      for (let i = 0; i < 12; i++) {
        targetMonthIndices.push(i);
      }
    } else {
      targetMonthIndices.push(MONTHS.indexOf(selectedMonth));
    }

    let calculatedTarget = 0;
    let calculatedRealization = 0;

    targetMonthIndices.forEach(mIdx => {
      const monthName = MONTHS[mIdx];
      const monthKey = `${monthName} ${selectedYear}`;
      
      activeResidents.forEach(resident => {
        const fee = fees[resident.property_type as keyof FeeSettings] || fees.occupied;
        const regDate = new Date(resident.created_at || now);
        const regYear = regDate.getFullYear();
        const regMonth = regDate.getMonth();

        // System boundaries
        const isBeforeSystemStart = selectedYear < SYSTEM_START_YEAR || (selectedYear === SYSTEM_START_YEAR && mIdx < SYSTEM_START_MONTH_INDEX);
        // Resident is only billed if they were registered on or before this month/year
        const isRegistered = selectedYear > regYear || (selectedYear === regYear && mIdx >= regMonth);
        
        if (isRegistered && !isBeforeSystemStart) {
          calculatedTarget += fee;
          
          // Check for actual payments for this specific month
          const monthPayments = payments.filter(p => p.resident_id === resident.id && p.months.includes(monthKey));
          const paidAmountForMonth = monthPayments.reduce((sum, p) => sum + (Number(p.amount) / p.months.length), 0);
          calculatedRealization += paidAmountForMonth;
        }
      });
    });

    const unpaid = Math.max(0, calculatedTarget - calculatedRealization);

    return {
      totalIncome,
      totalExpense,
      totalBalance,
      balance: totalBalance,
      incomeTransactions,
      expenseTransactions,
      paymentSummary: {
        target: calculatedTarget,
        realization: calculatedRealization,
        unpaid: unpaid,
        currentMonthUnpaid: unpaid
      }
    };
  }, [transactions, selectedYear, selectedMonth, residentsWithBilling, activeResidents, fees, payments]);

  const monthlyPaymentStatus = useMemo(() => {
    const now = new Date();
    return MONTHS.map((month, mIdx) => {
      const monthKey = `${month} ${selectedYear}`;
      
      const paidResidents = activeResidents.filter(r => {
        const rp = payments.filter(p => p.resident_id === r.id);
        return rp.some(p => p.months.includes(monthKey));
      });

      const unpaidResidents = activeResidents.filter(r => {
        const regDate = new Date(r.created_at || now);
        const regYear = regDate.getFullYear();
        const regMonth = regDate.getMonth();
        
        const isBeforeSystemStart = selectedYear < SYSTEM_START_YEAR || (selectedYear === SYSTEM_START_YEAR && mIdx < SYSTEM_START_MONTH_INDEX);
        const isRegistered = selectedYear > regYear || (selectedYear === regYear && mIdx >= regMonth);
        
        return isRegistered && !isBeforeSystemStart && !paidResidents.find(pr => pr.id === r.id);
      });

      const collected = activeResidents.reduce((sum, r) => {
        const monthPayments = payments.filter(p => p.resident_id === r.id && p.months.includes(monthKey));
        return sum + monthPayments.reduce((pSum, p) => pSum + (Number(p.amount) / p.months.length), 0);
      }, 0);

      const expected = activeResidents.reduce((sum, r) => {
        const regDate = new Date(r.created_at || now);
        const regYear = regDate.getFullYear();
        const regMonth = regDate.getMonth();
        
        const isBeforeSystemStart = selectedYear < SYSTEM_START_YEAR || (selectedYear === SYSTEM_START_YEAR && mIdx < SYSTEM_START_MONTH_INDEX);
        const isRegistered = selectedYear > regYear || (selectedYear === regYear && mIdx >= regMonth);
        
        if (!isRegistered || isBeforeSystemStart) return sum;
        return sum + (fees[r.property_type as keyof FeeSettings] || fees.occupied);
      }, 0);

      return {
        month,
        paid: paidResidents.length,
        unpaid: unpaidResidents.length,
        paidResidents: paidResidents.map(r => ({ ...r, amountPaid: (fees[r.property_type as keyof FeeSettings] || fees.occupied) })),
        unpaidResidents,
        collected,
        expected,
        percentage: expected > 0 ? Math.round((collected / expected) * 100) : 0
      };
    });
  }, [activeResidents, payments, fees, selectedYear]);

  return {
    residents,
    activeResidents,
    payments,
    transactions,
    fees,
    feesLoaded,
    isLoading,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    summary,
    monthlyPaymentStatus,
    residentsWithBilling,
    refetch: fetchData,
  };
}
