import { useState, useMemo } from 'react';
import { useResidents } from '@/hooks/useResidents';
import { PeriodType, RondaGroup, RondaMember, RondaSchedule } from '@/hooks/useRonda';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight, Check, X, Plus, Trash2 } from 'lucide-react';
import { format, addDays, eachDayOfInterval, isSameDay, startOfYear, endOfYear, getDay, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RondaMultiStepFormProps {
  initialData?: {
    group: RondaGroup;
    members: RondaMember[];
    schedules: RondaSchedule[];
  };
  onSubmit: (data: {
    group: Omit<RondaGroup, 'id' | 'created_at' | 'created_by'>;
    memberIds: string[];
    schedules: { schedule_date: string; snack_responsible_id: string | null }[];
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RondaMultiStepForm({ initialData, onSubmit, onCancel, isSubmitting }: RondaMultiStepFormProps) {
  const [step, setStep] = useState(1);
  const { residents } = useResidents();

  // Step 1: Basic Info
  const [name, setName] = useState(initialData?.group.name || '');
  const [year, setYear] = useState(initialData?.group.year || new Date().getFullYear());
  const [periodType, setPeriodType] = useState<PeriodType>(initialData?.group.period_type || 'custom');
  
  // Period Specific States
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: initialData?.group.start_date ? new Date(initialData?.group.start_date) : undefined,
    to: initialData?.group.end_date ? new Date(initialData?.group.end_date) : undefined,
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0-6 for Sun-Sat
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // 0-11
  const [customDates, setCustomDates] = useState<Date[]>(
    initialData?.schedules.map(s => new Date(s.schedule_date)) || []
  );

  // Step 2: Members
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialData?.members.map(m => m.resident_id) || []
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Step 3: Schedules & Snack
  const [generatedSchedules, setGeneratedSchedules] = useState<{ 
    schedule_date: string; 
    snack_responsible_id: string | null 
  }[]>(
    initialData?.schedules.map(s => ({
      schedule_date: s.schedule_date,
      snack_responsible_id: s.snack_responsible_id
    })) || []
  );

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedResidents = residents.filter(r => selectedMemberIds.includes(r.id));

  const generateDates = () => {
    let dates: Date[] = [];
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 11, 31));

    if (periodType === 'daily') {
      if (dateRange.from && dateRange.to) {
        dates = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      }
    } else if (periodType === 'weekly') {
      if (dateRange.from && dateRange.to && selectedDays.length > 0) {
        dates = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
          .filter(date => selectedDays.includes(getDay(date)));
      }
    } else if (periodType === 'monthly') {
      if (selectedMonths.length > 0) {
        selectedMonths.forEach(m => {
          const monthStart = startOfMonth(new Date(year, m, 1));
          const monthEnd = endOfMonth(new Date(year, m, 1));
          dates = [...dates, ...eachDayOfInterval({ start: monthStart, end: monthEnd })];
        });
      }
    } else {
      dates = customDates;
    }

    // Sort dates
    dates.sort((a, b) => a.getTime() - b.getTime());

    // Create schedule objects, preserving existing snack info if dates match
    const newSchedules = dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = generatedSchedules.find(s => s.schedule_date === dateStr);
      return {
        schedule_date: dateStr,
        snack_responsible_id: existing?.snack_responsible_id || null
      };
    });

    setGeneratedSchedules(newSchedules);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name) return;
      setStep(2);
    } else if (step === 2) {
      if (selectedMemberIds.length === 0) return;
      generateDates();
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    await onSubmit({
      group: {
        name,
        period_type: periodType,
        year,
        start_date: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
        end_date: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
      },
      memberIds: selectedMemberIds,
      schedules: generatedSchedules,
    });
  };

  const daysOfWeek = [
    { label: 'Min', value: 0 },
    { label: 'Sen', value: 1 },
    { label: 'Sel', value: 2 },
    { label: 'Rab', value: 3 },
    { label: 'Kam', value: 4 },
    { label: 'Jum', value: 5 },
    { label: 'Sab', value: 6 },
  ];

  const monthsOfYear = eachMonthOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 1)
  }).map((date, i) => ({
    label: format(date, 'MMMM', { locale: localeId }),
    value: i
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
              step === s ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
              step > s ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            )}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && <div className={cn("w-12 h-0.5 mx-2", step > s ? "bg-success" : "bg-muted")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kelompok Ronda</Label>
              <Input 
                id="name" 
                placeholder="Misal: Kelompok Merak / RW 01" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahun Berlaku</Label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipe Periode</Label>
                <Select value={periodType} onValueChange={(v: PeriodType) => setPeriodType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="custom">Kustom (Pilih Tanggal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(periodType === 'daily' || periodType === 'weekly') && (
              <div className="space-y-2">
                <Label>Rentang Tanggal</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, 'dd MMM yyyy') : 'Mulai'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, 'dd MMM yyyy') : 'Selesai'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(d) => setDateRange(prev => ({ ...prev, to: d }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {periodType === 'weekly' && (
              <div className="space-y-2">
                <Label>Hari Terpilih</Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <Button
                      key={day.value}
                      variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedDays(prev => 
                          prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value]
                        );
                      }}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {periodType === 'monthly' && (
              <div className="space-y-2">
                <Label>Bulan Terpilih</Label>
                <div className="grid grid-cols-3 gap-2">
                  {monthsOfYear.map(month => (
                    <Button
                      key={month.value}
                      variant={selectedMonths.includes(month.value) ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setSelectedMonths(prev => 
                          prev.includes(month.value) ? prev.filter(m => m !== month.value) : [...prev, month.value]
                        );
                      }}
                    >
                      {month.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {periodType === 'custom' && (
              <div className="space-y-2">
                <Label>Pilih Tanggal</Label>
                <div className="flex justify-center border rounded-lg p-2 bg-muted/20">
                  <Calendar
                    mode="multiple"
                    selected={customDates}
                    onSelect={(dates) => setCustomDates(dates || [])}
                    className="rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Warga (Anggota Kelompok)</Label>
              <Input 
                placeholder="Cari nama warga..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              <div className="space-y-3">
                {filteredResidents.map(resident => (
                  <div key={resident.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                    <Checkbox 
                      id={`res-${resident.id}`}
                      checked={selectedMemberIds.includes(resident.id)}
                      onCheckedChange={(checked) => {
                        setSelectedMemberIds(prev => 
                          checked ? [...prev, resident.id] : prev.filter(id => id !== resident.id)
                        );
                      }}
                    />
                    <Label htmlFor={`res-${resident.id}`} className="flex-1 cursor-pointer font-medium">
                      {resident.name}
                      <p className="text-[10px] text-muted-foreground font-normal">{resident.address}</p>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex flex-wrap gap-2">
              {selectedResidents.map(r => (
                <Badge key={r.id} variant="secondary" className="gap-1 pr-1">
                  {r.name}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 hover:bg-transparent" 
                    onClick={() => setSelectedMemberIds(prev => prev.filter(id => id !== r.id))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Jadwal & Penanggung Jawab Snack</Label>
              <Badge variant="outline">{generatedSchedules.length} Tanggal</Badge>
            </div>
            
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="divide-y divide-border">
                {generatedSchedules.map((sched, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">{format(new Date(sched.schedule_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Jadwal Ronda</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs shrink-0 whitespace-nowrap">PJ Snack:</Label>
                      <Select 
                        value={sched.snack_responsible_id || 'none'} 
                        onValueChange={(val) => {
                          const newScheds = [...generatedSchedules];
                          newScheds[idx].snack_responsible_id = val === 'none' ? null : val;
                          setGeneratedSchedules(newScheds);
                        }}
                      >
                        <SelectTrigger className="w-[180px] h-9">
                          <SelectValue placeholder="Pilih Warga" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Belum Ditentukan</SelectItem>
                          {selectedResidents.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                {generatedSchedules.length === 0 && (
                  <div className="py-20 text-center text-muted-foreground">
                    Tidak ada tanggal yang digenerate. Periksa kembali periode di Step 1.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Nama Kelompok</h4>
                  <p className="text-lg font-bold">{name}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Periode & Tahun</h4>
                  <p className="font-medium">{periodType.charAt(0).toUpperCase() + periodType.slice(1)} - {year}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Anggota ({selectedMemberIds.length})</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedResidents.map(r => (
                      <Badge key={r.id} variant="outline" className="text-[10px]">{r.name}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Jadwal</h4>
                  <p className="text-2xl font-bold">{generatedSchedules.length} Tanggal</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">PJ Snack Terisi</h4>
                  <p className="font-medium">
                    {generatedSchedules.filter(s => s.snack_responsible_id).length} dari {generatedSchedules.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 border border-warning/20 bg-warning/10 rounded-lg text-xs font-medium text-warning-foreground flex items-center gap-3">
            <Check className="h-4 w-4 shrink-0" />
            Pastikan semua data sudah benar sebelum menyimpan. Kelompok dan jadwal akan dibuat sekaligus.
          </div>
        </div>
      )}

      <div className="flex justify-between gap-3 pt-6 border-t">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={handleNext} disabled={!name || (step === 2 && selectedMemberIds.length === 0)}>
              Lanjut
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-success hover:bg-success/90">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kelompok Ronda'}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
