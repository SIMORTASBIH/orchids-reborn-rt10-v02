import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Calendar as CalendarIcon, 
  Users as UsersIcon, 
  AlertCircle,
  ChevronRight,
  Check,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { useRonda } from '@/hooks/useRonda';
import { useResidents } from '@/hooks/useResidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function Ronda() {
  const { groups, schedules, isLoading, createGroup } = useRonda();
  const { residents } = useResidents();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [period, setPeriod] = useState('Harian');
  const [customDates, setCustomDates] = useState<Date[]>([]);

  const resetForm = () => {
    setGroupName('');
    setGroupDesc('');
    setSelectedResidents([]);
    setYear(new Date().getFullYear().toString());
    setPeriod('Harian');
    setCustomDates([]);
    setStep(1);
  };

  const handleCreateGroup = async () => {
    setIsSubmitting(true);
    try {
      const generatedSchedules = customDates.map((date, idx) => ({
        date: format(date, 'yyyy-MM-dd'),
        pj_snack_id: selectedResidents[idx % selectedResidents.length] || null,
      }));

      await createGroup({
        name: groupName,
        description: groupDesc,
        members: selectedResidents,
        schedules: generatedSchedules,
      });

      toast({
        title: 'Berhasil',
        description: 'Kelompok Ronda berhasil dibuat',
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat kelompok ronda',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleResident = (id: string) => {
    setSelectedResidents(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight">Jadwal Ronda</h1>
            <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-1 opacity-60">Security & Neighborhood Watch System</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 rounded-xl h-11 px-6">
            <Plus className="h-4 w-4" />
            <span>Buat Kelompok Ronda Baru</span>
          </Button>
        </div>

        {/* Dashboard Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Kelompok</p>
                  <p className="text-2xl font-bold">{groups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Add more stats if needed */}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className={cn(
            "sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl transition-all duration-300",
            step === 2 && "sm:max-w-[600px] h-[70vh]"
          )}>
            <DialogHeader className="p-6 border-b border-border/10 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-normal">Buat Kelompok Ronda Baru</DialogTitle>
                  <p className="text-[10px] text-muted-foreground font-normal mt-1">Generate jadwal otomatis untuk warga</p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6">
              {/* Stepper */}
              <div className="flex items-center justify-between mb-8 px-4">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < 4 && (
                      <div className={cn(
                        "h-[2px] w-8 mx-2",
                        step > s ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <Label>Nama Kelompok</Label>
                    <Input 
                      placeholder="Contoh: Kelompok Singa" 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keterangan (Opsional)</Label>
                    <Input 
                      placeholder="Keterangan tambahan..." 
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-right-4 overflow-hidden">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cari warga..." className="pl-10 rounded-xl h-10" />
                  </div>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-2">
                      {residents.map((r) => (
                        <div 
                          key={r.id} 
                          onClick={() => toggleResident(r.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:bg-muted/50",
                            selectedResidents.includes(r.id) ? "border-primary bg-primary/5" : "border-border/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                              selectedResidents.includes(r.id) ? "bg-primary border-primary text-white" : "bg-white border-muted-foreground/30"
                            )}>
                              {selectedResidents.includes(r.id) && <Check className="h-3 w-3" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{r.name}</p>
                              <p className="text-[10px] text-muted-foreground">{r.address}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <p className="text-[10px] text-muted-foreground px-1">{selectedResidents.length} warga terpilih</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tahun Berlaku</Label>
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2025, 2026, 2027].map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Periode Jaga</Label>
                      <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Harian', 'Mingguan', 'Bulanan', 'Kustom'].map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {period === 'Kustom' && (
                    <div className="space-y-4">
                      <Label>Pilih Tanggal (Multi-Select)</Label>
                      <div className="border rounded-2xl p-2 bg-muted/5">
                        <Calendar
                          mode="multiple"
                          selected={customDates}
                          onSelect={(dates) => setCustomDates(dates || [])}
                          className="rounded-xl"
                          locale={id}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                        {customDates.map((date, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] rounded-lg">
                            {format(date, 'd MMM yyyy', { locale: id })}
                          </Badge>
                        ))}
                        {customDates.length === 0 && <p className="text-[10px] text-muted-foreground italic">Belum ada tanggal dipilih</p>}
                      </div>
                    </div>
                  )}

                  <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 text-xs font-bold">Penting untuk Diperhatikan</AlertTitle>
                    <AlertDescription className="text-amber-700 text-[10px] leading-relaxed">
                      Pastikan semua data sudah benar sebelum menyimpan. Kelompok dan jadwal akan dibuat sekaligus pada langkah berikutnya.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="p-4 bg-muted/30 rounded-2xl border space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <p className="text-xs text-muted-foreground">Nama Kelompok</p>
                      <p className="text-sm font-bold text-primary">{groupName}</p>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <p className="text-xs text-muted-foreground">Total Anggota</p>
                      <p className="text-sm font-bold">{selectedResidents.length} Orang</p>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <p className="text-xs text-muted-foreground">Periode & Tahun</p>
                      <p className="text-sm font-bold">{period} - {year}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">Total Jadwal</p>
                      <p className="text-sm font-bold">{customDates.length} Hari</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 border-t border-border/10 bg-muted/5 flex justify-between sm:justify-between items-center">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="rounded-xl">
                  Kembali
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  Batal
                </Button>
              )}
              
              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  disabled={(step === 1 && !groupName) || (step === 2 && selectedResidents.length === 0)}
                  className="gap-2 rounded-xl bg-primary px-8"
                >
                  <span>Lanjut</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleCreateGroup} disabled={isSubmitting} className="gap-2 rounded-xl bg-primary px-8">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Simpan & Selesai</span>
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
