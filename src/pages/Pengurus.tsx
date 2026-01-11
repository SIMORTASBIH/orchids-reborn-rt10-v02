import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, UserCheck, UserX, Phone, MapPin, Calendar, User, Users as UsersIcon, Edit2, MoreVertical, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { usePengurus, Pengurus } from '@/hooks/usePengurus';
import { useResidents } from '@/hooks/useResidents';
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
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const POSITIONS = [
  'Ketua RT',
  'Wakil Ketua RT',
  'Sekretaris',
  'Bendahara',
  'Seksi Keamanan',
  'Seksi Kebersihan',
  'Seksi Sosial',
  'Anggota',
];

export default function PengurusPage() {
  const { pengurus, isLoading, addPengurus, updatePengurus, deletePengurus } = usePengurus();
  const { residents, isLoading: isLoadingResidents } = useResidents();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPengurus, setEditingPengurus] = useState<Pengurus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    resident_id: '',
    position: '',
    start_date: '',
    end_date: '',
    status: 'active',
  });

  const filteredPengurus = pengurus.filter((p) =>
    (p.residents?.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.resident_id || !formData.position.trim()) {
      toast({
        title: 'Error',
        description: 'Warga dan jabatan wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const dataToSubmit = {
      resident_id: formData.resident_id,
      position: formData.position,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      status: formData.status,
    };

    if (editingPengurus) {
      const result = await updatePengurus(editingPengurus.id, dataToSubmit);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Data pengurus berhasil diperbarui',
        });
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const result = await addPengurus(dataToSubmit);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Pengurus baru berhasil ditambahkan',
        });
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setIsSubmitting(false);
  };

  const handleEdit = (item: Pengurus) => {
    setEditingPengurus(item);
    setFormData({
      resident_id: item.resident_id,
      position: item.position,
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pengurus ini?')) {
      const result = await deletePengurus(id);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Data pengurus berhasil dihapus',
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      resident_id: '',
      position: '',
      start_date: '',
      end_date: '',
      status: 'active',
    });
    setEditingPengurus(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-normal text-foreground tracking-tight">Data Pengurus</h1>
              <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-2 opacity-60">Organizational Management System</p>
            </div>
            <Button onClick={openAddDialog} className="gap-2 shadow-sm bg-primary text-white font-normal text-xs sm:text-sm rounded-xl h-11 px-6 hover:shadow-md transition-all">
              <Plus className="h-4 w-4" />
              <span>Tambah Pengurus</span>
            </Button>
          </div>

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Cari nama pengurus atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 border-none bg-transparent focus-visible:ring-0 font-medium"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-[300px] text-[10px] font-normal text-muted-foreground py-5 pl-8">Nama & Jabatan</TableHead>
                <TableHead className="text-[10px] font-normal text-muted-foreground py-5">Kontak & Alamat</TableHead>
                <TableHead className="text-[10px] font-normal text-muted-foreground py-5">Masa Jabatan</TableHead>
                <TableHead className="text-[10px] font-normal text-muted-foreground py-5">Status</TableHead>
                <TableHead className="w-[80px] text-right py-5 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPengurus.length > 0 ? (
                filteredPengurus.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/20 transition-colors border-b last:border-0">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm transition-transform group-hover:scale-105 duration-300">
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-normal">
                            {item.residents ? getInitials(item.residents.name) : <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-normal text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                            {item.residents?.name || 'Warga tidak ditemukan'}
                          </span>
                          <span className="flex items-center gap-1.5 mt-1 text-[10px] font-normal text-muted-foreground">
                            <Shield className="h-2.5 w-2.5 text-primary/40" />
                            {item.position}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-normal text-foreground/80">
                          <Phone className="h-3 w-3 text-muted-foreground/50" />
                          {item.residents?.phone || '-'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate max-w-[200px]">
                          <MapPin className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span className="truncate font-normal">{item.residents?.address || '-'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2 text-[11px] font-normal text-muted-foreground bg-muted/30 w-fit px-2.5 py-1 rounded-lg">
                        <Clock className="h-3 w-3 text-primary/40" />
                        <span>{formatDate(item.start_date)} — {formatDate(item.end_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-none px-3 py-1 rounded-full text-[9px] font-normal transition-all",
                          item.status === 'active' 
                            ? 'bg-success/15 text-success' 
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {item.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 pr-8 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border">
                            <DropdownMenuItem onClick={() => handleEdit(item)} className="rounded-lg gap-2 font-normal text-xs focus:bg-primary/5 focus:text-primary cursor-pointer p-3">
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="rounded-lg gap-2 font-normal text-xs text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer p-3">
                              <Trash2 className="h-3.5 w-3.5" />
                              Hapus Data
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <div className="p-4 bg-muted rounded-full">
                          <UsersIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-normal text-muted-foreground">Tidak ada data ditemukan</p>
                          {search && (
                            <Button variant="link" size="sm" onClick={() => setSearch('')} className="mt-1 h-auto p-0 font-normal text-primary">
                              Reset Pencarian
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl">
              <DialogHeader className="p-6 border-b border-border/10 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    {editingPengurus ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-normal">{editingPengurus ? 'Edit Data Pengurus' : 'Registrasi Pengurus'}</DialogTitle>
                    <p className="text-[10px] text-muted-foreground font-normal">Organizational Structure Management</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2 group">
                  <Label htmlFor="resident_id" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Pilih Warga *</Label>
                  <Select
                    value={formData.resident_id}
                    onValueChange={(value) => setFormData({ ...formData, resident_id: value })}
                    disabled={!!editingPengurus}
                  >
                    <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                      <SelectValue placeholder={isLoadingResidents ? "Memuat warga..." : "Klik untuk mencari warga..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border shadow-xl rounded-xl">
                      {residents.map((r) => (
                        <SelectItem key={r.id} value={r.id} className="text-xs">
                          <div className="flex flex-col">
                            <span className="font-normal">{r.name}</span>
                            <span className="text-[10px] opacity-60 font-normal">{r.address}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground font-normal italic pl-1 opacity-60">
                    Data kontak akan sinkron otomatis dengan data warga
                  </p>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="position" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Jabatan Organisasi *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                      <SelectValue placeholder="Pilih jabatan..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border shadow-xl rounded-xl">
                      {POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos} className="text-xs font-normal">{pos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 group">
                    <Label htmlFor="start_date" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Mulai Jabatan</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-normal"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="end_date" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Selesai Jabatan</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-normal"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="status" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Status Keanggotaan</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border shadow-xl rounded-xl">
                      <SelectItem value="active" className="text-xs font-normal text-success">Aktif</SelectItem>
                      <SelectItem value="inactive" className="text-xs font-normal text-muted-foreground">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="p-5 flex justify-between items-center border-t border-border/10 bg-muted/10">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 rounded-xl font-normal text-xs">
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="h-11 px-10 bg-primary text-white font-normal text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all rounded-xl">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingPengurus ? (
                    'Simpan Perubahan'
                  ) : (
                    'Simpan Pengurus'
                  )}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
