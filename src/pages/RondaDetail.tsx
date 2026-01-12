import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useRonda } from "@/hooks/useRonda";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Users, Calendar as CalendarIcon, ShieldCheck, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RondaDetail = () => {
  const { id: groupId } = useParams();
  const { groups } = useRonda();
  
  const group = groups?.find(g => g.id === groupId);

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["ronda_members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ronda_group_members")
        .select("*, resident:residents(*)")
        .eq("group_id", groupId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const { data: groupSchedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["ronda_group_schedules", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ronda_schedules")
        .select("*")
        .eq("group_id", groupId)
        .order("schedule_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  if (!group && !isLoadingMembers) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-2xl font-bold">Kelompok tidak ditemukan</h2>
          <Button asChild className="mt-4">
            <Link to="/ronda">Kembali ke Daftar</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link to="/ronda"><ChevronLeft className="w-6 h-6" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              {group?.name || <Skeleton className="h-10 w-48" />}
            </h1>
            <div className="flex gap-2 mt-2">
              {group?.year_valid.map(year => (
                <Badge key={year} variant="secondary">{year}</Badge>
              ))}
              <Badge variant="outline" className="capitalize">{group?.period}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-3xl shadow-sm border overflow-hidden">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Anggota Kelompok
                </CardTitle>
                <Badge className="bg-primary text-white">{members?.length || 0} Orang</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {isLoadingMembers ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)
                  ) : (
                    members?.map((m) => (
                      <div key={m.id} className="p-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{m.resident?.name}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {m.resident?.address}
                              </span>
                              {m.resident?.phone && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {m.resident?.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedules for this group */}
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm border overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Jadwal Kelompok
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {isLoadingSchedules ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)
                  ) : (
                    groupSchedules?.map((s) => (
                      <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-background border rounded-xl">
                          <span className="text-[10px] font-bold text-primary uppercase">{format(new Date(s.schedule_date), 'MMM')}</span>
                          <span className="text-lg font-black leading-none">{format(new Date(s.schedule_date), 'd')}</span>
                        </div>
                        <div>
                          <p className="font-bold">{format(new Date(s.schedule_date), 'EEEE', { locale: id })}</p>
                          <p className="text-xs text-muted-foreground italic">Pukul 21:00 - Selesai</p>
                        </div>
                      </div>
                    ))
                  )}
                  {groupSchedules?.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      Belum ada jadwal yang diatur untuk kelompok ini.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-2xl">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <AlertTitle className="font-bold">Info Keamanan</AlertTitle>
              <AlertDescription className="text-blue-700 text-xs">
                Petugas ronda diharapkan hadir 15 menit sebelum waktu yang ditentukan. Koordinasi dilakukan melalui grup WhatsApp masing-masing kelompok.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RondaDetail;