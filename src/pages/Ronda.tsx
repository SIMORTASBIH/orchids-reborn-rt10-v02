import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  Pencil,
  Shield,
  Clock,
  LayoutGrid,
  List
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { RondaMultiStepForm } from '@/components/RondaMultiStepForm';
import { useRonda } from '@/hooks/useRonda';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Ronda() {
  const navigate = useNavigate();
  const { groups, isLoading, createRondaGroup, deleteRondaGroup } = useRonda();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus kelompok ini?')) {
      const result = await deleteRondaGroup(id);
      if (result.success) {
        toast({ title: 'Berhasil', description: 'Kelompok ronda dihapus' });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal tracking-tight">Jadwal Ronda</h1>
            <p className="text-xs text-muted-foreground mt-1 opacity-60">Security & Neighborhood Watch Schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-muted/30 p-1 rounded-xl border flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg", viewMode === 'grid' && "bg-background shadow-sm")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg", viewMode === 'list' && "bg-background shadow-sm")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl h-11 px-6 gap-2">
              <Plus className="h-4 w-4" />
              <span>Buat Kelompok Baru</span>
            </Button>
          </div>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-3 rounded-2xl border shadow-sm">
            <CardContent className="p-2">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Cari kelompok ronda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 border-none bg-transparent focus-visible:ring-0 text-sm"
                />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-sm flex items-center justify-center p-2">
            <Badge variant="secondary" className="bg-primary/5 text-primary border-none h-10 px-4 font-bold rounded-xl flex items-center gap-2 w-full justify-center">
              <Shield className="h-4 w-4" />
              <span>{filteredGroups.length} Kelompok</span>
            </Badge>
          </Card>
        </div>

        {/* Groups Grid/List */}
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 gap-6">
            <Shield className="h-16 w-16 opacity-10" />
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em]">Belum Ada Kelompok</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="link" className="mt-2 text-primary font-bold">
                Buat kelompok ronda pertama
              </Button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card 
                key={group.id} 
                className="group rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                onClick={() => navigate(`/ronda/${group.id}`)}
              >
                <CardHeader className="p-6 bg-muted/30 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => navigate(`/ronda/${group.id}`)} className="gap-2">
                          <Pencil className="h-4 w-4" /> Edit Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDelete(e, group.id)} className="gap-2 text-destructive">
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4">
                    <CardTitle className="text-xl font-medium">{group.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Dibuat pada {new Date(group.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Lihat Jadwal & Anggota</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <div 
                key={group.id}
                onClick={() => navigate(`/ronda/${group.id}`)}
                className="flex items-center justify-between p-4 bg-card border rounded-2xl hover:bg-muted/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Kelompok Keamanan</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-medium">Aktif</span>
                    <span className="text-[10px] text-muted-foreground">Status</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
            <DialogHeader className="p-8 border-b bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-normal">Buat Kelompok Ronda Baru</DialogTitle>
                  <p className="text-xs text-muted-foreground font-normal mt-1 opacity-60">Generate jadwal otomatis untuk warga</p>
                </div>
              </div>
            </DialogHeader>
            <div className="p-8">
              <RondaMultiStepForm 
                onSuccess={() => {
                  setIsCreateOpen(false);
                  toast({ title: 'Berhasil', description: 'Kelompok ronda telah dibuat' });
                }}
                onCancel={() => setIsCreateOpen(false)}
                onSubmit={async (data) => createRondaGroup(data.name, data.residentIds, data.schedules)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
