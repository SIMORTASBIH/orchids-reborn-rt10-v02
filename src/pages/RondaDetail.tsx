import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Users, 
  Pencil, 
  Trash2, 
  Shield, 
  User,
  Coffee,
  Save,
  Plus,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { RondaMultiStepForm } from '@/components/RondaMultiStepForm';
import { useRonda, RondaGroup, RondaGroupMember, RondaSchedule } from '@/hooks/useRonda';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function RondaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getGroupDetails, updateRondaGroup, deleteRondaGroup } = useRonda();
  
  const [data, setData] = useState<{
    group: RondaGroup;
    members: RondaGroupMember[];
    schedules: RondaSchedule[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    const result = await getGroupDetails(id);
    if (result.error) {
      toast({ title: 'Error', description: 'Gagal memuat data detail', variant: 'destructive' });
      navigate('/ronda');
    } else {
      setData({
        group: result.group,
        members: result.members,
        schedules: result.schedules,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (id && confirm('Apakah Anda yakin ingin menghapus kelompok ini?')) {
      const result = await deleteRondaGroup(id);
      if (result.success) {
        toast({ title: 'Berhasil', description: 'Kelompok ronda dihapus' });
        navigate('/ronda');
      }
    }
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

  if (!data) return null;

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ronda')} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-normal tracking-tight">{data.group.name}</h1>
                <Badge className="bg-primary/10 text-primary border-none rounded-lg px-3">Aktif</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 opacity-60 flex items-center gap-2">
                <Shield className="h-3 w-3" />
                ID Kelompok: {data.group.id.split('-')[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(true)} className="rounded-xl h-11 px-6 gap-2 border-primary/20 hover:bg-primary/5">
              <Pencil className="h-4 w-4" />
              <span>Edit Kelompok</span>
            </Button>
            <Button variant="ghost" onClick={handleDelete} className="rounded-xl h-11 px-4 text-destructive hover:bg-destructive/5">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Column */}
          <Card className="rounded-2xl border shadow-sm h-fit">
            <CardHeader className="p-6 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Anggota Kelompok
                </CardTitle>
                <Badge variant="secondary" className="rounded-lg">{data.members.length} Warga</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-auto max-h-[400px]">
                <div className="divide-y">
                  {data.members.map((member) => (
                    <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.resident?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{member.resident?.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Schedules Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="p-6 border-b bg-muted/30 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Jadwal Ronda
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                  <Coffee className="h-3 w-3 text-amber-500" />
                  <span>PJ Snack Tercatat</span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.schedules.map((schedule) => (
                    <div 
                      key={schedule.id} 
                      className="p-4 rounded-2xl border bg-muted/5 hover:bg-muted/20 transition-all flex flex-col gap-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {new Date(schedule.schedule_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <Badge variant="outline" className="bg-background text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50 border-none px-0">
                          {new Date(schedule.schedule_date).toLocaleDateString('id-ID', { weekday: 'long' })}
                        </Badge>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                          <Coffee className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Penanggung Jawab Snack</p>
                          <p className="text-sm font-medium text-amber-900">{schedule.snack_responsible?.name || 'Belum Ditentukan'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {data.schedules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto opacity-10 mb-4" />
                    <p className="text-sm">Belum ada jadwal yang dibuat untuk kelompok ini.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
            <DialogHeader className="p-8 border-b bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Pencil className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-normal">Edit Kelompok Ronda</DialogTitle>
                  <p className="text-xs text-muted-foreground font-normal mt-1 opacity-60">Perbarui data anggota dan jadwal</p>
                </div>
              </div>
            </DialogHeader>
            <div className="p-8">
              <RondaMultiStepForm 
                initialData={data}
                onSuccess={() => {
                  setIsEditOpen(false);
                  fetchData();
                  toast({ title: 'Berhasil', description: 'Kelompok ronda telah diperbarui' });
                }}
                onCancel={() => setIsEditOpen(false)}
                onSubmit={async (formData) => updateRondaGroup(id!, formData.name, formData.residentIds, formData.schedules)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
