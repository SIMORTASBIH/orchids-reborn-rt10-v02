import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRonda } from "@/hooks/useRonda";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const RondaMultiStepForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [snackResponsibles, setSnackResponsibles] = useState<Record<string, string>>({});

  const { getResidents, createRondaModule } = useRonda();

  const handleNext = () => {
    if (step === 1 && !groupName) {
      toast.error("Nama kelompok harus diisi");
      return;
    }
    if (step === 2 && selectedResidents.length === 0) {
      toast.error("Pilih minimal satu warga");
      return;
    }
    if (step === 3 && selectedDates.length === 0) {
      toast.error("Pilih minimal satu tanggal");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    // Validate snack responsibles
    const incomplete = selectedDates.some(date => !snackResponsibles[date.toISOString()]);
    if (incomplete) {
      toast.error("Pilih penanggung jawab snack untuk semua tanggal");
      return;
    }

    try {
      await createRondaModule.mutateAsync({
        name: groupName,
        residentIds: selectedResidents,
        schedules: selectedDates.map(date => ({
          date,
          snackResponsibleId: snackResponsibles[date.toISOString()]
        }))
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleResident = (residentId: string) => {
    setSelectedResidents(prev =>
      prev.includes(residentId)
        ? prev.filter(id => id !== residentId)
        : [...prev, residentId]
    );
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (dates) {
      setSelectedDates(dates);
    }
  };

  const handleSnackChange = (dateIso: string, residentId: string) => {
    setSnackResponsibles(prev => ({
      ...prev,
      [dateIso]: residentId
    }));
  };

  const residentsInGroup = getResidents.data?.filter(r => selectedResidents.includes(r.id)) || [];

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {step === 1 && "Buat Kelompok Ronda"}
          {step === 2 && "Pilih Anggota Kelompok"}
          {step === 3 && "Pilih Jadwal & Snack"}
          {step === 4 && "Ringkasan Jadwal"}
        </CardTitle>
        <div className="flex justify-center gap-2 mt-4">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full ${s === step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <Label htmlFor="groupName">Nama Kelompok Ronda</Label>
            <Input
              id="groupName"
              placeholder="Contoh: Kelompok Melati, Ronda Senin, dsb."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="text-lg"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Pilih Warga (Multi Select)</Label>
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getResidents.data?.map((resident) => (
                  <div key={resident.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg transition-colors">
                    <Checkbox
                      id={`res-${resident.id}`}
                      checked={selectedResidents.includes(resident.id)}
                      onCheckedChange={() => toggleResident(resident.id)}
                    />
                    <label
                      htmlFor={`res-${resident.id}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                    >
                      {resident.name}
                      <span className="block text-xs text-muted-foreground">{resident.address}</span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label>Pilih Tanggal Jaga</Label>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={handleDateSelect}
                className="rounded-md border shadow"
                locale={id}
              />
            </div>
            <div className="space-y-4">
              <Label>Penanggung Jawab Snack</Label>
              <ScrollArea className="h-[280px]">
                {selectedDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Pilih tanggal terlebih dahulu</p>
                ) : (
                  <div className="space-y-4 pr-4">
                    {selectedDates.map((date) => (
                      <div key={date.toISOString()} className="space-y-2 border-b pb-3">
                        <span className="text-xs font-semibold uppercase text-primary">
                          {format(date, "EEEE, d MMMM yyyy", { locale: id })}
                        </span>
                        <Select
                          value={snackResponsibles[date.toISOString()] || ""}
                          onValueChange={(val) => handleSnackChange(date.toISOString(), val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih penanggung jawab snack" />
                          </SelectTrigger>
                          <SelectContent>
                            {residentsInGroup.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">{groupName}</h3>
              <p className="text-sm text-muted-foreground">
                Total Anggota: {selectedResidents.length} | Total Jadwal: {selectedDates.length}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Anggota Kelompok</Label>
                <ul className="text-sm space-y-1">
                  {residentsInGroup.map(r => (
                    <li key={r.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {r.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Jadwal & Snack</Label>
                <ScrollArea className="h-[200px]">
                  <ul className="text-sm space-y-2">
                    {selectedDates.map(date => {
                      const snackId = snackResponsibles[date.toISOString()];
                      const snackRes = residentsInGroup.find(r => r.id === snackId);
                      return (
                        <li key={date.toISOString()} className="border-l-2 border-primary pl-3">
                          <span className="block font-medium">{format(date, "d MMM yyyy", { locale: id })}</span>
                          <span className="text-xs text-muted-foreground">Snack: {snackRes?.name || "-"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-6">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack}>Kembali</Button>
        ) : (
          <div />
        )}
        {step < 4 ? (
          <Button onClick={handleNext}>Lanjut</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createRondaModule.isPending}>
            {createRondaModule.isPending ? "Menyimpan..." : "Simpan Jadwal"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RondaMultiStepForm;
