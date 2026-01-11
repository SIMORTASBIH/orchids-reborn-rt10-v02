import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface MonthPickerProps {
  selectedMonths: string[];
  onSelect: (months: string[]) => void;
  year?: number;
  paidMonths?: string[];
}

export function MonthPicker({ selectedMonths, onSelect, year = new Date().getFullYear(), paidMonths = [] }: MonthPickerProps) {
  const toggleMonth = (month: string) => {
    const monthKey = `${month} ${year}`;
    if (paidMonths.includes(monthKey)) return;
    
    if (selectedMonths.includes(monthKey)) {
      onSelect(selectedMonths.filter((m) => m !== monthKey));
    } else {
      onSelect([...selectedMonths, monthKey]);
    }
  };

  const selectAll = () => {
    const allMonths = MONTHS.map(m => `${m} ${year}`).filter(m => !paidMonths.includes(m));
    onSelect(allMonths);
  };

  const clearAll = () => {
    onSelect([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Pilih Bulan ({year})</h4>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-[10px] font-normal px-2">
            Pilih Semua
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-[10px] font-normal px-2">
            Reset
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((month) => {
          const monthKey = `${month} ${year}`;
          const isSelected = selectedMonths.includes(monthKey);
          const isPaid = paidMonths.includes(monthKey);
          
          return (
            <button
              key={month}
              onClick={() => toggleMonth(month)}
              disabled={isPaid}
              className={cn(
                "relative px-2 py-1.5 rounded-lg text-[10px] font-normal transition-all",
                isPaid
                  ? "bg-success/10 text-success cursor-not-allowed opacity-50"
                  : isSelected
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {month}
              {isPaid && (
                <Check className="absolute top-0.5 right-0.5 h-2 w-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
