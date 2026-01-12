import { useState } from "react";
import { useResidents } from "@/hooks/useResidents";
import { useRonda } from "@/hooks/useRonda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Users, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RondaMultiStepFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RondaMultiStepForm = ({ onSuccess, onCancel }: RondaMultiStepFormProps) => {
  const [step, setStep] = useState(1);
  const { residents, isLoading: isLoadingResidents } = useResidents();
  const { createGroup } = useRonda();

  // Form State
  const [name, setName] = useState("");
  const [years, setYears] = useState<string[]>([new Date().getFullYear().toString()]);
  const [period, setPeriod] = useState("custom");
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleResident = (id: string) => {
    setSelectedResidents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(prev => prev.filter(d => d.getTime() !== dateToRemove.getTime()));
  };

  const handleSubmit = async () => {
    await createGroup.mutateAsync({
      name,
      year_valid: years,
      period,
      resident_ids: selectedResidents,
      schedule_dates: selectedDates,
    });
    if (onSuccess) onSuccess();
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
            step === i ? "bg-primary text-primary-foreground shadow-lg scale-110" : 
            step > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {step > i ? <CheckCircle2 className="w-6 h-6" /> : i}
          </div>
          {i < 4 && <div className={cn("w-12 h-1 mx-2 rounded-full", step > i ? "bg-primary/20" : "bg-muted")} />}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Buat Kelompok Ronda Baru</CardTitle>
            <p className="text-muted-foreground">Generate jadwal otomatis untuk warga</p>
          </div>
        </div>
        {renderStepIndicator()}
      </CardHeader>

      <CardContent className="px-0">
        <div className="min-h-[400px]">
          {/* Step 1: Info Dasar */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Nama Kelompok Ronda *</Label>
                <Input 
                  placeholder="Contoh: Kelompok Merpati / RT 01" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Tahun Berlaku (Multi Tahun) *</Label>
                <ToggleGroup 
                  type="multiple" 
                  value={years} 
                  onValueChange={(val) => val.length > 0 && setYears(val)}
                  className="justify-start gap-2"
                >
                  {["2024", "2025", "2026", "2027"].map(year => (
                    <ToggleGroupItem 
                      key={year} 
                      value={year}
                      className="h-12 px-6 text-base data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border-2"
                    >
                      {year}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Periode Penjadwalan *</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Pilih Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Mingguan (Hari yang Sama)</SelectItem>
                    <SelectItem value="monthly">Bulanan (Tanggal Tertentu)</SelectItem>
                    <SelectItem value="custom">Kustom (Pilih Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Pilih Warga */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari nama atau alamat warga..." 
                    className="pl-10 h-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Badge variant="outline" className="h-11 px-4 text-sm font-medium">
                  {selectedResidents.length} Warga Terpilih
                </Badge>
              </div>

              <ScrollArea className="h-[400px] border rounded-xl bg-background/50">
                <div className="p-4 space-y-2">
                  {isLoadingResidents ? (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-muted-foreground animate-pulse">Memuat data warga...</p>
                    </div>
                  ) : filteredResidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Users className="w-12 h-12 mb-2 opacity-20" />
                      <p>Warga tidak ditemukan</p>
                    </div>
                  ) : (
                    filteredResidents.map((r) => (
                      <div 
                        key={r.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/50",
                          selectedResidents.includes(r.id) ? "bg-primary/5 border-primary shadow-sm" : "bg-card"
                        )}
                        onClick={() => toggleResident(r.id)}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox 
                            checked={selectedResidents.includes(r.id)}
                            onCheckedChange={() => toggleResident(r.id)}
                            className="w-5 h-5"
                          />
                          <div>
                            <p className="font-semibold leading-none mb-1">{r.name}</p>
                            <p className="text-sm text-muted-foreground">{r.address}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 3: Pilih Tanggal */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <Label className="text-base font-semibold block">Pilih Tanggal Ronda</Label>
                <div className="border rounded-xl p-4 bg-card shadow-sm">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    locale={id}
                    className="w-full"
                    numberOfMonths={1}
                    showOutsideDays={false}
                    disabled={(date) => date < new Date()}
                  />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  * Klik tanggal pada kalendar untuk memilih/menghapus. Mendukung pemilihan banyak tanggal termasuk hari Sabtu.
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  Informasi Tanggal
                  <Badge variant="secondary" className="ml-2">{selectedDates.length}</Badge>
                </Label>
                <ScrollArea className="h-[350px] border rounded-xl bg-background/50 p-4">
                  {selectedDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <CalendarIcon className="w-12 h-12 mb-2 opacity-20" />
                      <p>Belum ada tanggal dipilih</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {[...selectedDates].sort((a, b) => a.getTime() - b.getTime()).map((date, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-card rounded-lg border shadow-sm group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {format(date, 'd')}
                            </div>
                            <div>
                              <p className="font-semibold text-sm uppercase">
                                {format(date, 'MMM yyyy EEE', { locale: id })}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => removeDate(date)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="md:col-span-2">
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <AlertTitle className="font-bold">PERHATIAN: KONFIRMASI DATA</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Pastikan semua data sudah benar sebelum menyimpan. Kelompok dan jadwal akan dibuat sekaligus berdasarkan warga yang Anda pilih di Step 2.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Step 4: Ringkasan & Selesai */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Ringkasan Kelompok Ronda</h3>
                <p className="text-muted-foreground">Periksa kembali detail sebelum menyimpan</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-6 bg-card rounded-2xl border shadow-sm">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <Users className="w-5 h-5" /> Informasi Kelompok
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Nama Kelompok</span>
                      <span className="font-semibold">{name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Tahun Berlaku</span>
                      <div className="flex gap-1">
                        {years.map(y => <Badge key={y} variant="outline">{y}</Badge>)}
                      </div>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Periode</span>
                      <span className="font-semibold capitalize">{period}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-card rounded-2xl border shadow-sm">
                  <h4 className="font-bold flex items-center gap-2 text-primary">
                    <CalendarIcon className="w-5 h-5" /> Statistik
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Total Warga</span>
                      <span className="font-bold text-lg">{selectedResidents.length} Orang</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Total Jadwal</span>
                      <span className="font-bold text-lg">{selectedDates.length} Tanggal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-0 pt-6 flex justify-between gap-4 border-t">
        {step > 1 ? (
          <Button variant="outline" onClick={prevStep} className="h-12 px-6">
            <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
        ) : (
          <Button variant="ghost" onClick={onCancel} className="h-12 px-6 text-muted-foreground">
            Batal
          </Button>
        )}

        {step < 4 ? (
          <Button 
            onClick={nextStep} 
            disabled={
              (step === 1 && !name) || 
              (step === 2 && selectedResidents.length === 0) ||
              (step === 3 && selectedDates.length === 0)
            }
            className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            Selanjutnya <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={createGroup.isPending}
            className="h-12 px-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold"
          >
            {createGroup.isPending ? "Menyimpan..." : "Selesaikan & Buat Jadwal"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};