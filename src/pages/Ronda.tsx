import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Users, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRonda } from '@/hooks/useRonda';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RondaMultiStepForm } from '@/components/ronda/RondaMultiStepForm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
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

export default function Ronda() {
  const { groups, isLoading, createGroup, deleteGroup } = useRonda();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGroup = async (data: any) => {
    setIsSubmitting(true);
    const result = await createGroup(data.group, data.memberIds, data.schedules);
    setIsSubmitting(false);
    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Kelompok ronda berhasil dibuat',
      });
      setIsFormOpen(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const result = await deleteGroup(id);
    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Kelompok ronda berhasil dihapus',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jadwal Jaga Ronda</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Kelola kelompok dan jadwal ronda warga.</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Buat Kelompok Baru
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Memuat data kelompok...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold text-foreground/60">Belum ada kelompok ronda</p>
            <p className="text-sm">Klik "Buat Kelompok Baru" untuk memulai penjadwalan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {groups.map((group) => (
              <Card key={group.id} className="group hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
                <CardHeader className="pb-4 border-b bg-muted/5 group-hover:bg-primary/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold truncate pr-4">{group.name}</CardTitle>
                    <Badge variant="outline" className="capitalize text-[10px] font-bold tracking-widest bg-background">
                      {group.period_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Tahun Berlaku</p>
                      <p className="font-bold">{group.year}</p>
                    </div>
                  </div>
                  
                  {group.start_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <CalendarIcon className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Rentang Waktu</p>
                        <p className="font-bold">{group.start_date} s/d {group.end_date}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2 group/btn" asChild>
                    <Link to={`/ronda/${group.id}`}>
                      Lihat Detil
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kelompok Ronda?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan menghapus kelompok "{group.name}" beserta seluruh jadwal yang terkait. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteGroup(group.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Hapus Permanen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Buat Kelompok Ronda Baru</DialogTitle>
            </DialogHeader>
            <RondaMultiStepForm 
              onSubmit={handleCreateGroup} 
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
