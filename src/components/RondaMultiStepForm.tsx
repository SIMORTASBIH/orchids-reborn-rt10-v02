import { useState, useMemo } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Calendar as CalendarIcon, 
  User, 
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useResidents } from '@/hooks/useResidents';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RondaMultiStepFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  onSubmit: (data: any) => Promise<{ success: boolean; error?: any }>;
}

export const RondaMultiStepForm = ({ onSuccess, onCancel, initialData, onSubmit }: RondaMultiStepFormProps) => {
  const [step, setStep] = useState(1);
  const { residents } = useResidents();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    memberIds: initialData?.members?.map((m: any) => m.resident_id) || [] as string[],
    periodType: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'custom',
    selectedDays: [] as number[], // 0-6 for Sun-Sat
    customDates: [] as string[],
    year: new Date().getFullYear(),
    schedules: [] as { date: string; snack_responsible_id: string }[],
  });

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMembers = residents.filter(r => formData.memberIds.includes(r.id));

  const toggleMember = (id: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id) 
        ? prev.memberIds.filter(mid => mid !== id) 
        : [...prev.memberIds, id]
    }));
  };

  const generateSchedules = () => {
    const schedules: { date: string; snack_responsible_id: string }[] = [];
    const startDate = new Date(formData.year, 0, 1);
    const endDate = new Date(formData.year, 11, 31);
    
    let current = new Date(startDate);
    
    while (current <= endDate) {
      let shouldAdd = false;
      
      if (formData.periodType === 'daily') {
        shouldAdd = true;
      } else if (formData.periodType === 'weekly') {
        if (formData.selectedDays.includes(current.getDay())) {
          shouldAdd = true;
        }
      } else if (formData.periodType === 'monthly') {
        if (current.getDate() === 1) { // Example: 1st of every month
          shouldAdd = true;
        }
      }
      
      if (shouldAdd) {
        schedules.push({
          date: current.toISOString().split('T')[0],
          snack_responsible_id: formData.memberIds[schedules.length % formData.memberIds.length] || '',
        });
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    setFormData(prev => ({ ...prev, schedules }));
  };

  const handleNext = () => {
    if (step === 3 && formData.schedules.length === 0) {
      generateSchedules();
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const isStepValid = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.memberIds.length > 0;
    if (step === 3) return true; // Selection criteria
    return true;
  };

  const handleSubmit = async () => {
    const result = await onSubmit({
      name: formData.name,
      residentIds: formData.memberIds,
      schedules: formData.schedules,
    });
    if (result.success) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}>
              {s}
            </div>
            {s < 4 && (
              <div className={cn(
                "w-12 h-1 mx-2 rounded-full",
                step > s ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nama Kelompok Ronda</Label>
            <Input 
              id="groupName" 
              placeholder="Contoh: Kelompok Elang" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 text-lg"
            />
          </div>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Berikan nama yang unik untuk memudahkan identifikasi kelompok jadwal ronda di lingkungan Anda.
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari warga..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          <ScrollArea className="h-[300px] border rounded-xl p-2">
            <div className="space-y-1">
              {filteredResidents.map(resident => (
                <div 
                  key={resident.id}
                  onClick={() => toggleMember(resident.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                    formData.memberIds.includes(resident.id) ? "bg-primary/5 border-primary/20" : "hover:bg-muted"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{resident.name}</span>
                    <span className="text-xs text-muted-foreground">{resident.address}</span>
                  </div>
                  <Checkbox checked={formData.memberIds.includes(resident.id)} />
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map(m => (
              <Badge key={m.id} variant="secondary" className="px-3 py-1">
                {m.name}
                <button 
                  onClick={() => toggleMember(m.id)}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tahun Berlaku</Label>
              <Select 
                value={formData.year.toString()} 
                onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periode Jaga</Label>
              <Select 
                value={formData.periodType} 
                onValueChange={(v: any) => setFormData({ ...formData, periodType: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="custom">Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.periodType === 'weekly' && (
            <div className="space-y-3">
              <Label>Pilih Hari</Label>
              <div className="flex flex-wrap gap-2">
                {['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, i) => (
                  <Button
                    key={day}
                    variant={formData.selectedDays.includes(i) ? "default" : "outline"}
                    className="h-10 w-12 text-xs p-0"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      selectedDays: prev.selectedDays.includes(i)
                        ? prev.selectedDays.filter(d => d !== i)
                        : [...prev.selectedDays, i]
                    }))}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Alert Confirmation Text - Improved Readability */}
          <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-2xl p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="bg-amber-100 p-2 rounded-xl h-fit">
                <Info className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <AlertTitle className="text-sm font-bold tracking-tight">Penting untuk Diperhatikan</AlertTitle>
                <AlertDescription className="text-xs font-medium leading-relaxed opacity-80">
                  Pastikan semua data sudah benar sebelum menyimpan. 
                  <span className="block mt-1 font-bold text-amber-700">
                    Kelompok dan jadwal akan dibuat sekaligus pada langkah berikutnya.
                  </span>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl border space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Nama Kelompok</span>
                <span className="font-bold">{formData.name}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Total Anggota</span>
                <span className="font-bold">{formData.memberIds.length} Warga</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Total Jadwal</span>
                <span className="font-bold">{formData.schedules.length} Tanggal</span>
              </div>
            </div>

            <ScrollArea className="h-[200px] border rounded-xl p-4">
              <div className="space-y-3">
                {formData.schedules.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded-lg">
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">PJ Snack:</span>
                      <Select 
                        value={s.snack_responsible_id}
                        onValueChange={(v) => {
                          const newSchedules = [...formData.schedules];
                          newSchedules[i].snack_responsible_id = v;
                          setFormData({ ...formData, schedules: newSchedules });
                        }}
                      >
                        <SelectTrigger className="h-7 w-[150px] text-[10px]">
                          <SelectValue placeholder="Pilih PJ" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedMembers.map(m => (
                            <SelectItem key={m.id} value={m.id} className="text-[10px]">{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t">
        <Button 
          variant="ghost" 
          onClick={step === 1 ? onCancel : handleBack}
          className="rounded-xl px-6"
        >
          {step === 1 ? 'Batal' : 'Kembali'}
        </Button>
        <Button 
          onClick={step === 4 ? handleSubmit : handleNext}
          disabled={!isStepValid()}
          className="rounded-xl px-8 bg-primary"
        >
          {step === 4 ? 'Simpan Kelompok' : 'Lanjut'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
