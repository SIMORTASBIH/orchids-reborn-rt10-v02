import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Resident = Tables<'residents'>;
export type Payment = Tables<'payments'>;

export interface FeeSettings {
  occupied: number;
  empty_house: number;
  empty_land: number;
}

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const SYSTEM_START_YEAR = 2026;
export const SYSTEM_START_MONTH_INDEX = 0; // Januari

const DEFAULT_FEES: FeeSettings = {
  occupied: 80000,
  empty_house: 50000,
  empty_land: 50000,
};

export interface BillingStatus {
  status: 'Lunas' | 'Tertunggak' | 'Belum';
  billAmount: number;
  unpaidMonths: string[];
  paidMonths: string[];
  fee: number;
}

export function calculateResidentBilling(
  resident: Resident,
  payments: Payment[],
  fees: FeeSettings,
  selectedMonth: string = 'all',
  selectedYear: number = new Date().getFullYear()
): BillingStatus {
  // Use property type to get correct fee
  const fee = fees[resident.property_type as keyof FeeSettings] || fees.occupied;
  
  // Filter payments for this resident
  const residentPayments = payments.filter((p) => p.resident_id === resident.id);
  const paidMonths = residentPayments.flatMap((p) => p.months);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  
  // Start calculating from system start or resident creation date
  const regDate = new Date(resident.created_at || now);
  const regYear = regDate.getFullYear();
  const regMonth = regDate.getMonth();
  
  const startYear = Math.max(SYSTEM_START_YEAR, regYear);
  const startMonth = startYear === regYear ? Math.max(SYSTEM_START_MONTH_INDEX, regMonth) : SYSTEM_START_MONTH_INDEX;

  const unpaidMonths: string[] = [];
  
  // Calculate all unpaid months up to current month
  for (let y = startYear; y <= currentYear; y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === currentYear ? currentMonthIndex : 11;
    
    for (let m = mStart; m <= mEnd; m++) {
      const monthKey = `${MONTHS[m]} ${y}`;
      if (!paidMonths.includes(monthKey)) {
        unpaidMonths.push(monthKey);
      }
    }
  }

  let status: 'Lunas' | 'Tertunggak' | 'Belum' = 'Lunas';
  let billAmount = 0;

  if (selectedMonth === 'all') {
    billAmount = unpaidMonths.length * fee;
    // Status depends on whether there are any unpaid months in history
    status = unpaidMonths.length > 0 ? 'Tertunggak' : 'Lunas';
  } else {
    const targetMonthKey = `${selectedMonth} ${selectedYear}`;
    const isPaid = paidMonths.includes(targetMonthKey);
    
    const targetMonthIndex = MONTHS.indexOf(selectedMonth);
    const isTargetBeforeStart = selectedYear < startYear || (selectedYear === startYear && targetMonthIndex < startMonth);
    const isPast = selectedYear < currentYear || (selectedYear === currentYear && targetMonthIndex < currentMonthIndex);
    const isCurrent = selectedYear === currentYear && targetMonthIndex === currentMonthIndex;

    if (isTargetBeforeStart) {
      status = 'Lunas'; // Months before registration/system start are not billed
      billAmount = 0;
    } else if (isPaid) {
      status = 'Lunas';
      billAmount = 0;
    } else {
      billAmount = fee;
      status = isPast ? 'Tertunggak' : (isCurrent ? 'Belum' : 'Belum');
      // In Indonesian context, "Belum" for current/future, "Tertunggak" for past
      if (isPast) {
        status = 'Tertunggak';
      } else {
        status = 'Belum';
      }
    }
  }

  return {
    status,
    billAmount,
    unpaidMonths,
    paidMonths,
    fee,
  };
}

export function useBilling(selectedMonth: string = 'all', selectedYear: number = new Date().getFullYear()) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [residentsRes, paymentsRes, settingsRes] = await Promise.all([
        supabase.from('residents').select('*').order('name'),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('app_settings').select('*'),
      ]);

      if (residentsRes.data) setResidents(residentsRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      
      if (settingsRes.data && settingsRes.data.length > 0) {
        const newFees: FeeSettings = { ...DEFAULT_FEES };
        settingsRes.data.forEach((s) => {
          if (s.key === 'fee_occupied') newFees.occupied = parseFloat(s.value) || DEFAULT_FEES.occupied;
          if (s.key === 'fee_empty_house') newFees.empty_house = parseFloat(s.value) || DEFAULT_FEES.empty_house;
          if (s.key === 'fee_empty_land') newFees.empty_land = parseFloat(s.value) || DEFAULT_FEES.empty_land;
        });
        setFees(newFees);
      } else {
        setFees(DEFAULT_FEES);
      }
    } catch (error) {
      console.error('[useBilling] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to all relevant tables to ensure synchronization
    const channel = supabase
      .channel('billing-realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const residentsWithBilling = useMemo(() => {
    return residents.map(r => ({
      ...r,
      billing: calculateResidentBilling(r, payments, fees, selectedMonth, selectedYear)
    }));
  }, [residents, payments, fees, selectedMonth, selectedYear]);

  return {
    residents,
    payments,
    fees,
    isLoading,
    residentsWithBilling,
    refetch: fetchData
  };
}
