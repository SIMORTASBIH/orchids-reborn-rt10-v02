import { useState } from "react";
import Layout from "@/components/Layout";
import { useRonda } from "@/hooks/useRonda";
import { RondaMultiStepForm } from "@/components/RondaMultiStepForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar as CalendarIcon, Users, Trash2, ArrowRight, ShieldCheck, ListChecks, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Ronda = () => {
  const [showForm, setShowForm] = useState(false);
  const { groups, isLoadingGroups, schedules, deleteGroup } = useRonda();

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kelompok ini? Semua jadwal terkait juga akan dihapus.")) {
      await deleteGroup.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-primary" />
              Jadwal Ronda
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">Kelola kelompok keamanan dan jadwal ronda warga</p>
          </div>
          {!showForm && (
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 shadow-xl shadow-primary/20"
            >
              <Plus className="w-5 h-5 mr-2" /> Buat Kelompok Baru
            </Button>
          )}
        </div>

        {showForm ? (
          <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 border-2 border-dashed border-primary/20">
            <RondaMultiStepForm 
              onSuccess={() => setShowForm(false)} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        ) : (
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-12 p-1 bg-muted/50">
              <TabsTrigger value="groups" className="data-[state=active]:bg-background font-bold">
                <Users className="w-4 h-4 mr-2" /> Kelompok
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-background font-bold">
                <CalendarRange className="w-4 h-4 mr-2" /> Semua Jadwal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="mt-6">
              {isLoadingGroups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
                </div>
              ) : groups?.length === 0 ? (
                <Card className="border-2 border-dashed flex flex-col items-center justify-center p-20 text-center bg-transparent rounded-3xl">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">Belum ada kelompok ronda</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">Mulai dengan membuat kelompok ronda pertama untuk mengatur keamanan lingkungan.</p>
                  <Button onClick={() => setShowForm(true)} variant="outline" className="mt-6 h-12 px-8 rounded-xl font-bold">
                    <Plus className="w-5 h-5 mr-2" /> Buat Sekarang
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups?.map((group) => (
                    <Card key={group.id} className="group hover:border-primary/50 transition-all duration-300 rounded-3xl shadow-sm hover:shadow-xl overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="p-2 bg-background rounded-xl shadow-sm">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => handleDelete(group.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardTitle className="text-xl font-bold mt-3">{group.name}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {group.year_valid.map(year => (
                            <Badge key={year} variant="secondary" className="font-medium">{year}</Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Periode:</span>
                          <span className="font-bold capitalize">{group.period}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Dibuat pada:</span>
                          <span className="font-medium">{format(new Date(group.created_at), 'd MMM yyyy', { locale: id })}</span>
                        </div>
                        <Button asChild className="w-full mt-2 h-11 font-bold rounded-xl" variant="outline">
                          <Link to={`/ronda/${group.id}`}>
                            Lihat Detail <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card className="rounded-3xl shadow-sm border overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    Daftar Jadwal Mendatang
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {schedules?.map((schedule) => (
                      <div key={schedule.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-muted/20 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center w-14 h-14 bg-background border-2 border-primary/20 rounded-2xl">
                            <span className="text-xs font-bold text-primary uppercase">{format(new Date(schedule.schedule_date), 'MMM')}</span>
                            <span className="text-xl font-black leading-none">{format(new Date(schedule.schedule_date), 'd')}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              {format(new Date(schedule.schedule_date), 'EEEE', { locale: id })}
                            </p>
                            <h4 className="text-lg font-bold">{schedule.group?.name}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="h-8">Sesuai Jadwal</Badge>
                          <Button asChild size="sm" variant="ghost" className="rounded-lg h-8">
                            <Link to={`/ronda/${schedule.group_id}`}>Detail <ArrowRight className="w-3 h-3 ml-2" /></Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {schedules?.length === 0 && (
                      <div className="p-12 text-center text-muted-foreground">
                        Belum ada jadwal yang diatur.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Ronda;