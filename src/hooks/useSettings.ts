import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PropertyType } from './useResidents';

export interface FeeSettings {
  occupied: number;
  empty_house: number;
  empty_land: number;
}

export interface RTInfo {
  name: string;
  address: string;
  contact: string;
}

// Default values - will be overridden by database values
const DEFAULT_FEES: FeeSettings = {
  occupied: 80000,
  empty_house: 50000,
  empty_land: 50000,
};

const DEFAULT_RT_INFO: RTInfo = {
  name: 'RT 001 RW 002',
  address: 'Perumahan Griya Asri, Kel. Sukamaju',
  contact: '081234567890',
};

export function useSettings() {
  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [rtInfo, setRtInfo] = useState<RTInfo>(DEFAULT_RT_INFO);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error) throw error;
      
        if (data && data.length > 0) {
          const newFees: FeeSettings = { ...DEFAULT_FEES };
          const newRtInfo: RTInfo = { ...DEFAULT_RT_INFO };
          
          data.forEach((setting) => {
            // Fee settings
            if (setting.key === 'fee_occupied') {
              newFees.occupied = parseFloat(setting.value);
            } else if (setting.key === 'fee_empty_house') {
              newFees.empty_house = parseFloat(setting.value);
            } else if (setting.key === 'fee_empty_land') {
              newFees.empty_land = parseFloat(setting.value);
            }
            // RT info settings
            else if (setting.key === 'rt_name') {
              newRtInfo.name = setting.value;
            } else if (setting.key === 'rt_address') {
              newRtInfo.address = setting.value;
            } else if (setting.key === 'rt_contact') {
              newRtInfo.contact = setting.value;
            }
          });
          
          setFees(newFees);
          setRtInfo(newRtInfo);
        }
      } catch (error: any) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes for consistent sync
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
        },
        (payload) => {
          const { key, value } = payload.new as { key: string; value: string };
          // Fee updates
          if (key === 'fee_occupied') {
            setFees((prev) => ({ ...prev, occupied: parseFloat(value) }));
          } else if (key === 'fee_empty_house') {
            setFees((prev) => ({ ...prev, empty_house: parseFloat(value) }));
          } else if (key === 'fee_empty_land') {
            setFees((prev) => ({ ...prev, empty_land: parseFloat(value) }));
          }
          // RT info updates
          else if (key === 'rt_name') {
            setRtInfo((prev) => ({ ...prev, name: value }));
          } else if (key === 'rt_address') {
            setRtInfo((prev) => ({ ...prev, address: value }));
          } else if (key === 'rt_contact') {
            setRtInfo((prev) => ({ ...prev, contact: value }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const updateFee = async (type: keyof FeeSettings, fee: number) => {
    const keyMap = {
      occupied: 'fee_occupied',
      empty_house: 'fee_empty_house',
      empty_land: 'fee_empty_land',
    };

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('app_settings')
        .update({ value: fee.toString(), updated_by: userData.user?.id })
        .eq('key', keyMap[type]);

      if (error) throw error;
      setFees((prev) => ({ ...prev, [type]: fee }));
      toast({
        title: 'Berhasil',
        description: 'Nominal iuran berhasil diperbarui',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating fee:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui iuran',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const updateRtInfo = async (field: keyof RTInfo, value: string) => {
    const keyMap = {
      name: 'rt_name',
      address: 'rt_address',
      contact: 'rt_contact',
    };

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('app_settings')
        .update({ value, updated_by: userData.user?.id })
        .eq('key', keyMap[field]);

      if (error) throw error;
      setRtInfo((prev) => ({ ...prev, [field]: value }));
      toast({
        title: 'Berhasil',
        description: 'Informasi RT berhasil diperbarui',
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating RT info:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui informasi RT',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  const getFeeByPropertyType = (propertyType: PropertyType): number => {
    const feeMap: Record<PropertyType, number> = {
      occupied: fees.occupied,
      empty_house: fees.empty_house,
      empty_land: fees.empty_land,
    };
    return feeMap[propertyType];
  };

  return {
    fees,
    rtInfo,
    isLoading,
    updateFee,
    updateRtInfo,
    getFeeByPropertyType,
    refetch: fetchSettings,
  };
}
