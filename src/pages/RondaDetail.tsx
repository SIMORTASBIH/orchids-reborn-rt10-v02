import { Layout } from '@/components/Layout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRonda, RondaGroup, RondaMember, RondaSchedule } from '@/hooks/useRonda';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Trash2, Calendar as CalendarIcon, Users, Check, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RondaMultiStepForm } from '@/components/ronda/RondaMultiStepForm';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RondaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchGroupDetail, updateGroup, deleteGroup } = useRonda();
  
  const [data, setData] = useState<{
    group: RondaGroup;
    members: RondaMember[];
    schedules: RondaSchedule[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    const result = await fetchGroupDetail(id);
    setData(result);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdate = async (updateData: any) => {
    if (!id) return;
    setIsSubmitting(true);
    const result = await updateGroup(id, updateData.group, updateData.memberIds, updateData.schedules);
    setIsSubmitting(false);
    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Kelompok ronda berhasil diperbarui',
      });
      setIsEditOpen(false);
      loadData();
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await deleteGroup(id);
    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Kelompok ronda berhasil dihapus',
      });
      navigate('/ronda');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Memuat detail kelompok...</p>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-destructive font-bold text-lg">Data tidak ditemukan</p>
          <Button variant="link" asChild>
            <Link to="/ronda">Kembali ke Daftar Ronda</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const { group, members, schedules } = data;

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="rounded-full">
              <Link to="/ronda">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                <Badge className="capitalize bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  {group.period_type}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm font-medium">Tahun {group.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4" />
              Edit Kelompok
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Kelompok Ronda?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus kelompok "{group.name}" beserta seluruh jadwalnya. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Hapus Permanen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border-primary/10 shadow-lg shadow-primary/5">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Anggota Kelompok
                </CardTitle>
                <CardDescription className="text-xs">{members.length} Warga Terdaftar</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y divide-border/40">
                    {members.map((member) => (
                      <div key={member.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {member.resident?.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{member.resident?.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Anggota Ronda</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl h-12">
                <TabsTrigger value="list" className="flex-1 lg:flex-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                  <Clock className="h-4 w-4" />
                  Jadwal Lengkap
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex-1 lg:flex-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                  <Check className="h-4 w-4" />
                  Tanggung Jawab Snack
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="mt-6">
                <Card className="border-none shadow-none bg-transparent">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 gap-4">
                      {schedules.map((sched) => (
                        <div key={sched.id} className="flex items-center justify-between p-5 bg-background border border-border/60 rounded-xl hover:border-primary/40 transition-all hover:shadow-md hover:shadow-primary/5 group">
                          <div className="flex items-center gap-5">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-muted/30 rounded-lg group-hover:bg-primary/5 transition-colors border border-transparent group-hover:border-primary/20">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground">{format(new Date(sched.schedule_date), 'MMM')}</p>
                              <p className="text-xl font-black text-foreground">{format(new Date(sched.schedule_date), 'dd')}</p>
                            </div>
                            <div>
                              <p className="font-bold text-base">{format(new Date(sched.schedule_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Waktu Jaga Malam</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {sched.snack_responsible ? (
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">PJ Snack</p>
                                <Badge variant="secondary" className="gap-2 px-3 py-1 font-bold text-xs bg-success/10 text-success-foreground border-success/20">
                                  <User className="h-3 w-3" />
                                  {sched.snack_responsible.name}
                                </Badge>
                              </div>
                            ) : (
                              <p className="text-xs font-medium text-muted-foreground italic">PJ Snack Belum Ada</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {schedules.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
                          <CalendarIcon className="h-10 w-10 mx-auto mb-4 opacity-20" />
                          <p className="font-bold">Tidak ada jadwal</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-6">
                <Card className="bg-muted/10 border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Distribusi Tanggung Jawab Snack</CardTitle>
                    <CardDescription>Ringkasan berapa kali setiap anggota bertugas menyiapkan snack.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {members.map(member => {
                        const count = schedules.filter(s => s.snack_responsible_id === member.resident_id).length;
                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-background border rounded-lg shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                {member.resident?.name[0]}
                              </div>
                              <p className="font-bold text-sm">{member.resident?.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-black text-lg h-10 w-10 justify-center rounded-lg bg-primary/5 text-primary border-primary/20">
                                {count}
                              </Badge>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Kali</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Kelompok Ronda</DialogTitle>
            </DialogHeader>
            <RondaMultiStepForm 
              initialData={data}
              onSubmit={handleUpdate} 
              onCancel={() => setIsEditOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
