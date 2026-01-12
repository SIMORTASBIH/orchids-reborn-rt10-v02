import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, Users, CalendarDays, Utensils } from "lucide-react";
import RondaMultiStepForm from "@/components/RondaMultiStepForm";
import { useRonda } from "@/hooks/useRonda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Ronda = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { getRondaGroups } = useRonda();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jadwal Jaga Ronda</h1>
            <p className="text-muted-foreground">Kelola kelompok, anggota, dan jadwal ronda warga.</p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-5 w-5" />
                Buat Jadwal Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Sistem Penjadwalan Ronda</DialogTitle>
              </DialogHeader>
              <RondaMultiStepForm onSuccess={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {getRondaGroups.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
            ))}
          </div>
        ) : getRondaGroups.data?.length === 0 ? (
          <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-muted/20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Belum ada jadwal ronda</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">
              Mulai dengan membuat kelompok ronda pertama Anda untuk mengatur keamanan lingkungan.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Sekarang
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getRondaGroups.data?.map((group) => (
              <Card key={group.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-primary/5 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{group.name}</CardTitle>
                    <Badge variant="outline" className="bg-background">
                      {group.ronda_group_members?.length} Anggota
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Anggota</p>
                      <p className="truncate">
                        {group.ronda_group_members?.map((m) => m.residents.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Dibuat pada</p>
                      <p>{format(new Date(group.created_at), "d MMMM yyyy", { locale: id })}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t mt-4">
                    <Button variant="ghost" className="w-full text-xs justify-between group" disabled>
                      Lihat Detail Jadwal Lengkap
                      <ShieldCheck className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Ronda;
