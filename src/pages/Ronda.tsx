import { useState, useMemo } from 'react';
import { Plus, Search, Loader2, CalendarDays, UserCheck, Shield, ChevronRight, Check, AlertTriangle, Calendar as CalendarIcon, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { useRonda, PeriodType } from '@/hooks/useRonda';
import { useResidents, Resident } from '@/hooks/useResidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

export default function Ronda() {
  const { groups, schedules, isLoading, createGroupWithSchedules, deleteGroup } = useRonda();
  const { residents, isLoading: residentsLoading } = useResidents();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [searchResident, setSearchResident] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const filteredResidents = useMemo(() => {
    return residents.filter(r => 
      r.name.toLowerCase().includes(searchResident.toLowerCase()) ||
      r.address.toLowerCase().includes(searchResident.toLowerCase())
    );
  }, [residents, searchResident]);

  const resetForm = () => {
    setName('');
    setPeriodType('weekly');
    setSelectedResidents([]);
    setSearchResident('');
    setSelectedDates([]);
    setStep(1);
  };

  const handleCreateGroup = async () => {
    if (selectedDates.length === 0 && periodType === 'custom') {
      toast({
        title: 'Error',
        description: 'Silakan pilih setidaknya satu tanggal',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    // If not custom, we might need to generate dates based on period
    // For this implementation, we'll focus on the 'custom' multi-date requested
    let finalDates = selectedDates;
    if (periodType !== 'custom' && selectedDates.length === 0) {
      // Default: 4 next occurrences of today's day of week
      const today = new Date();
      for (let i = 0; i < 4; i++) {
        const d = new Date();
        d.setDate(today.getDate() + (i * 7));
        finalDates.push(d);
      }
    }

    const result = await createGroupWithSchedules(name, periodType, selectedResidents, finalDates);
    if (result.success) {
      setStep(4);
    }
    setIsSubmitting(false);
  };

  const toggleResident = (id: string) => {
    setSelectedResidents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-normal text-foreground tracking-tight">Jadwal Ronda</h1>
            <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-2 opacity-60">Security & Neighborhood Watch System</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 shadow-sm bg-primary text-white font-normal text-xs sm:text-sm rounded-xl h-11 px-6 hover:shadow-md transition-all">
            <Plus className="h-4 w-4" />
            <span>Buat Kelompok Ronda Baru</span>
          </Button>
        </div>

        {/* Groups Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Jadwal Mendatang
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {schedules.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-2 flex items-center justify-center py-20 bg-muted/5">
                  <div className="text-center space-y-2 opacity-40">
                    <CalendarDays className="h-10 w-10 mx-auto" />
                    <p className="text-sm">Belum ada jadwal ronda</p>
                  </div>
                </Card>
              ) : (
                schedules.map((schedule) => (
                  <Card key={schedule.id} className="rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{formatDate(schedule.schedule_date)}</p>
                          <h3 className="text-sm font-bold text-foreground mt-1">
                            Petugas: <span className="text-primary">{schedule.residents?.name || 'Belum ditentukan'}</span>
                          </h3>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-muted text-[10px] font-medium rounded-lg px-2 py-1">
                        Siaga
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Kelompok Aktif
            </h2>
            <div className="space-y-4">
              {groups.map((group) => (
                <Card key={group.id} className="rounded-xl border shadow-sm">
                  <CardHeader className="p-4 border-b border-border/10 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold">{group.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase">{group.period_type}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => deleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex -space-x-2 overflow-hidden">
                      {group.members?.map((m) => (
                        <div key={m.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold" title={m.residents?.name}>
                          {m.residents?.name.charAt(0)}
                        </div>
                      ))}
                      {group.members && group.members.length > 5 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold">
                          +{group.members.length - 5}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Create Group Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className={cn(
            "sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl transition-all",
            step === 2 && "sm:max-w-[650px]"
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
              <div className="flex items-center justify-center mb-8 gap-4 px-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      step === i ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : 
                      step > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {step > i ? <Check className="h-5 w-5" /> : i}
                    </div>
                    {i < 4 && <div className={cn("w-12 h-[2px] mx-2 rounded-full", step > i ? "bg-primary/20" : "bg-muted")} />}
                  </div>
                ))}
              </div>

              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2 group">
                    <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Nama Kelompok Ronda *</Label>
                    <Input 
                      placeholder="Contoh: Kelompok Siaga I" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl border-2 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Periode Penjadwalan</Label>
                    <Select value={periodType} onValueChange={(v: PeriodType) => setPeriodType(v)}>
                      <SelectTrigger className="h-12 rounded-xl border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border shadow-xl">
                        <SelectItem value="daily">Harian (Setiap Malam)</SelectItem>
                        <SelectItem value="weekly">Mingguan (Sesuai Hari)</SelectItem>
                        <SelectItem value="monthly">Bulanan (Tanggal Tertentu)</SelectItem>
                        <SelectItem value="custom">Kustom (Pilih Banyak Tanggal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Resident Selection - ENHANCED */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[70vh] flex flex-col">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                    <Input 
                      placeholder="Cari nama warga atau blok..." 
                      className="pl-12 h-12 rounded-xl border-2 focus-visible:ring-primary/20"
                      value={searchResident}
                      onChange={(e) => setSearchResident(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Terpilih: <span className="text-primary">{selectedResidents.length} Warga</span>
                    </p>
                    {selectedResidents.length > 0 && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-destructive font-bold" onClick={() => setSelectedResidents([])}>
                        Hapus Semua
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="flex-1 h-[300px] border rounded-xl bg-muted/5">
                    <div className="p-4 space-y-2">
                      {residentsLoading ? (
                        <div className="flex items-center justify-center py-20">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : filteredResidents.length === 0 ? (
                        <p className="text-center py-10 text-xs text-muted-foreground italic">Warga tidak ditemukan</p>
                      ) : (
                        filteredResidents.map((r) => (
                          <div 
                            key={r.id} 
                            onClick={() => toggleResident(r.id)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                              selectedResidents.includes(r.id) ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "bg-background hover:border-primary/40"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox checked={selectedResidents.includes(r.id)} className="rounded-full h-5 w-5" />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold uppercase">{r.name}</span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase">{r.address}</span>
                              </div>
                            </div>
                            {selectedResidents.includes(r.id) && <Badge className="bg-primary/20 text-primary border-none text-[9px]">Terpilih</Badge>}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Step 3: Dates & Confirmation - ENHANCED */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Pilih Tanggal Ronda</Label>
                      <div className="border rounded-2xl p-2 bg-background shadow-sm overflow-hidden">
                        <Calendar
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={(dates) => setSelectedDates(dates || [])}
                          className="rounded-xl border-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Informasi Tanggal</Label>
                      <ScrollArea className="h-[300px] border rounded-2xl bg-muted/5 p-4">
                        {selectedDates.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                            <Info className="h-8 w-8" />
                            <p className="text-[10px] font-bold uppercase text-center">Belum ada tanggal<br/>yang dipilih</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedDates.sort((a,b) => a.getTime() - b.getTime()).map((date, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-2 bg-background rounded-lg border shadow-sm">
                                <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center text-primary font-bold text-[10px]">
                                  {date.getDate()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold uppercase">{date.toLocaleDateString('id-ID', { weekday: 'short', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-destructive" onClick={() => setSelectedDates(prev => prev.filter(d => d.getTime() !== date.getTime()))}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-bold text-xs uppercase tracking-wider">Perhatian: Readability Alert</AlertTitle>
                    <AlertDescription className="text-amber-700 text-xs mt-1">
                      Pastikan semua data sudah benar sebelum menyimpan. Kelompok dan jadwal akan dibuat sekaligus berdasarkan warga yang Anda pilih di Step 2.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success shadow-xl shadow-success/10">
                    <Check className="h-10 w-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Berhasil Dibuat!</h2>
                    <p className="text-muted-foreground text-sm mt-2">Kelompok <span className="font-bold text-primary">{name}</span> dan jadwal ronda telah aktif.</p>
                  </div>
                  <Button onClick={() => { setIsDialogOpen(false); resetForm(); }} className="h-12 px-10 rounded-xl bg-primary shadow-lg shadow-primary/20">
                    Selesai & Tutup
                  </Button>
                </div>
              )}
            </div>

            {step < 4 && (
              <DialogFooter className="p-5 flex justify-between items-center border-t border-border/10 bg-muted/5">
                <Button 
                  variant="ghost" 
                  onClick={() => step > 1 ? setStep(step - 1) : setIsDialogOpen(false)} 
                  className="h-11 px-6 rounded-xl font-normal text-xs"
                >
                  {step === 1 ? 'Batal' : 'Kembali'}
                </Button>
                
                {step === 1 && (
                  <Button 
                    onClick={() => setStep(2)} 
                    disabled={!name.trim()}
                    className="h-11 px-10 rounded-xl bg-primary text-white font-normal text-xs shadow-lg shadow-primary/20"
                  >
                    Selanjutnya
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {step === 2 && (
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={selectedResidents.length === 0}
                    className="h-11 px-10 rounded-xl bg-primary text-white font-normal text-xs shadow-lg shadow-primary/20"
                  >
                    Selanjutnya
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {step === 3 && (
                  <Button 
                    onClick={handleCreateGroup} 
                    disabled={isSubmitting || (periodType === 'custom' && selectedDates.length === 0)}
                    className="h-11 px-10 rounded-xl bg-primary text-white font-normal text-xs shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Selesaikan & Buat Jadwal'}
                  </Button>
                )}
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
