import { useState, Fragment } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, UserCheck, Users as UsersIcon, Home, Building, Trees, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { useResidents, Resident, PropertyType } from '@/hooks/useResidents';
import { useBilling, MONTHS } from '@/hooks/useBilling';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export default function Residents() {
  const { residents, isLoading: residentsLoading, addResident, updateResident, deleteResident } = useResidents();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('id-ID', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { residentsWithBilling, isLoading: billingLoading, fees, payments } = useBilling(selectedMonth, selectedYear);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedResidents, setExpandedResidents] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    status: 'active',
    property_type: 'occupied' as 'occupied' | 'empty_house' | 'empty_land',
  });

  const isLoading = residentsLoading || billingLoading;

  const filteredResidents = residentsWithBilling.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  const toggleResident = (residentId: string) => {
    setExpandedResidents(prev => {
      const next = new Set(prev);
      if (next.has(residentId)) {
        next.delete(residentId);
      } else {
        next.add(residentId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      toast({
        title: 'Error',
        description: 'Nama dan alamat wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    if (editingResident) {
      const result = await updateResident(editingResident.id, formData);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Data warga berhasil diperbarui',
        });
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const result = await addResident(formData);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Warga baru berhasil ditambahkan',
        });
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setIsSubmitting(false);
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      name: resident.name,
      address: resident.address,
      phone: resident.phone || '',
      status: resident.status,
      property_type: resident.property_type,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      const result = await deleteResident(id);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Data warga berhasil dihapus',
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', status: 'active', property_type: 'occupied' });
    setEditingResident(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight">Data Warga</h1>
                <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-1 sm:mt-2 opacity-60">Citizen Management System</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-9 w-[120px] bg-transparent border-none shadow-none focus:ring-0 text-xs font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border shadow-xl">
                      {MONTHS.map(m => (
                        <SelectItem key={m} value={m} className="text-xs font-normal">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="h-9 w-[80px] bg-transparent border-none shadow-none focus:ring-0 text-xs font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border shadow-xl">
                      {Array.from({ length: 5 }, (_, i) => 2024 + i).map(y => (
                        <SelectItem key={y} value={y.toString()} className="text-xs font-normal">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={openAddDialog} className="w-full sm:w-auto gap-2 shadow-sm bg-primary text-white font-normal text-xs sm:text-sm rounded-xl h-10 sm:h-11 px-4 sm:px-6 hover:shadow-md transition-all">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Tambah Warga Baru</span>
                </Button>
              </div>
          </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-3 rounded-xl border shadow-sm">
            <CardContent className="p-1 sm:p-2">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Cari nama, alamat, atau no telepon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 sm:pl-12 h-10 sm:h-12 border-none bg-transparent focus-visible:ring-0 font-medium text-xs sm:text-sm"
                />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-1 sm:p-2 flex items-center justify-center h-full min-h-[50px] sm:min-h-[60px]">
              <Badge variant="secondary" className="bg-primary/5 text-primary border-none h-9 sm:h-10 px-4 font-bold rounded-lg flex items-center gap-2 w-full justify-center text-[10px] sm:text-xs">
                <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{filteredResidents.length} Warga</span>
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Residents Table */}
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {filteredResidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 gap-6">
                <UsersIcon className="h-16 w-16 opacity-10" />
                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Data Tidak Ditemukan</p>
                  <Button onClick={openAddDialog} variant="link" className="mt-2 text-primary font-bold">
                    Tambah warga pertama Anda
                  </Button>
                </div>
              </div>
            ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 border-b-border/30">
                          <TableHead className="w-12 sm:w-16 text-center pl-4 sm:pl-6 text-[10px] sm:text-xs font-normal text-muted-foreground">No</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground whitespace-nowrap">Informasi Warga</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground hidden md:table-cell">Kontak</TableHead>
                            <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground text-center hidden sm:table-cell">Tipe Aset</TableHead>
                            <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground text-center">Status Bayar</TableHead>
                            <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground text-right pr-4 hidden sm:table-cell">Tagihan</TableHead>
                            <TableHead className="text-right pr-4 sm:pr-6 text-[10px] sm:text-xs font-normal text-muted-foreground">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                      <TableBody>
                        {filteredResidents.map((resident, index) => {
                          const isExpanded = expandedResidents.has(resident.id);
                          const { billing } = resident;
                          const { status: displayStatus, billAmount: displayBill, fee } = billing;
                          
                          const residentPayments = payments.filter((p) => p.resident_id === resident.id);
                          
                          const propertyTypeLabels: Record<PropertyType, { label: string; icon: React.ReactNode; className: string }> = {
                            occupied: { label: 'BERPENGHUNI', icon: <Home className="h-3 w-3" />, className: 'bg-primary/10 text-primary' },
                            empty_house: { label: 'RUMAH KOSONG', icon: <Building className="h-3 w-3" />, className: 'bg-amber-100 text-amber-700' },
                            empty_land: { label: 'LAHAN KOSONG', icon: <Trees className="h-3 w-3" />, className: 'bg-muted text-muted-foreground' },
                          };
                          const propType = propertyTypeLabels[resident.property_type as PropertyType] || propertyTypeLabels.occupied;
                          
                          return (
                            <Fragment key={resident.id}>
                              <TableRow 
                                className={cn("hover:bg-muted/10 transition-all cursor-pointer group border-b-border/10", isExpanded && "bg-muted/15")}
                                onClick={() => toggleResident(resident.id)}
                              >
                                  <TableCell className="text-center pl-4 sm:pl-6 text-[10px] sm:text-xs font-normal text-muted-foreground/40">
                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                      {isExpanded ? <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-primary" /> : <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
                                      {index + 1}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 sm:py-4">
                                    <div className="flex flex-col">
                                      <span className="font-normal text-xs sm:text-sm text-foreground whitespace-nowrap">{resident.name}</span>
                                      <span className="text-[9px] sm:text-[11px] font-normal text-muted-foreground mt-0.5 whitespace-nowrap">{resident.address}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <span className="text-xs font-normal text-muted-foreground">{resident.phone || '—'}</span>
                                  </TableCell>
                                  <TableCell className="text-center hidden sm:table-cell">
                                    <div className={cn("inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-normal whitespace-nowrap", propType.className)}>
                                      {propType.icon}
                                      {propType.label}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant="outline"
                                      className={cn(
                                        "border-none px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-normal",
                                        displayStatus === 'Lunas' 
                                          ? 'bg-success/15 text-success' 
                                          : displayStatus === 'Tertunggak'
                                          ? 'bg-destructive/15 text-destructive font-bold'
                                          : 'bg-amber-100 text-amber-700'
                                      )}
                                    >
                                      {displayStatus}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-4 hidden sm:table-cell">
                                    <span className={cn("text-xs font-normal whitespace-nowrap", displayStatus === 'Lunas' ? "text-success" : "text-destructive")}>
                                      {formatCurrency(displayBill)}
                                    </span>
                                  </TableCell>

                              <TableCell className="text-right pr-4 sm:pr-6">
                                <div className="flex items-center justify-end gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(resident)}
                                    className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                  >
                                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(resident.id)}
                                    className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="bg-muted/5 border-b border-border/10">
                                <TableCell colSpan={6} className="p-3 sm:p-6">
                                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                                        <h4 className="text-[10px] sm:text-xs font-normal text-primary flex items-center gap-2">
                                          <Receipt className="h-3 w-3" /> Detail & Riwayat Pembayaran
                                        </h4>
                                        <div className="flex items-center gap-4">
                                          <div className="px-3 py-1 bg-background rounded-lg border text-[10px] sm:text-xs font-normal shadow-sm">
                                            Total Bayar: <span className="text-success">{formatCurrency(residentPayments.reduce((sum, p) => sum + Number(p.amount), 0))}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="rounded-xl border bg-background overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                          <Table>
                                            <TableHeader className="bg-muted/30">
                                              <TableRow className="border-b-border/20">
                                                <TableHead className="text-[9px] sm:text-[10px] font-normal py-2 pl-4">Bulan & Tahun</TableHead>
                                                <TableHead className="text-[9px] sm:text-[10px] font-normal py-2">Tanggal Bayar</TableHead>
                                                <TableHead className="text-right text-[9px] sm:text-[10px] font-normal py-2">Jumlah</TableHead>
                                                <TableHead className="text-center text-[9px] sm:text-[10px] font-normal py-2 pr-4">Metode</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {residentPayments.length === 0 ? (
                                                <TableRow>
                                                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground/30 text-[10px] sm:text-xs font-normal">Belum ada riwayat pembayaran</TableCell>
                                                </TableRow>
                                              ) : (
                                                residentPayments.map((p) => (
                                                  <TableRow key={p.id} className="hover:bg-muted/5 border-b-border/5">
                                                    <TableCell className="text-[10px] sm:text-xs font-normal pl-4">{p.months.join(', ')}</TableCell>
                                                      <TableCell className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                                                    <TableCell className="text-right text-[10px] sm:text-xs font-normal text-success">{formatCurrency(Number(p.amount))}</TableCell>
                                                    <TableCell className="text-center pr-4">
                                                      <Badge variant="outline" className="text-[9px] sm:text-[10px] font-normal rounded-md py-0 bg-muted/20 border-border/10">{p.payment_method}</Badge>
                                                    </TableCell>
                                                  </TableRow>
                                                ))
                                              )}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl">
              <DialogHeader className="p-6 border-b border-border/10 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-normal">
                      {editingResident ? 'Edit Profil Warga' : 'Registrasi Warga Baru'}
                    </DialogTitle>
                    <p className="text-[10px] text-muted-foreground font-normal mt-1">Database Management System</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-6 space-y-5">
                <div className="space-y-2 group">
                  <Label htmlFor="name" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama sesuai KTP"
                    className="h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-normal"
                  />
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="address" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Alamat Lengkap *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Contoh: BLOK N-10"
                    className="h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-normal"
                  />
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="phone" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">No. Telepon WhatsApp</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812XXXXXXXX"
                    className="h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-normal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 group">
                    <Label htmlFor="property_type" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Tipe Aset</Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value: 'occupied' | 'empty_house' | 'empty_land') => setFormData({ ...formData, property_type: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-xl rounded-xl">
                        <SelectItem value="occupied" className="text-xs font-normal">Berpenghuni</SelectItem>
                        <SelectItem value="empty_house" className="text-xs font-normal">Rumah Kosong</SelectItem>
                        <SelectItem value="empty_land" className="text-xs font-normal">Lahan Kosong</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="status" className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Status Aktif</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-xl rounded-xl">
                        <SelectItem value="active" className="text-xs font-normal">Aktif</SelectItem>
                        <SelectItem value="inactive" className="text-xs font-normal">Non-Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-5 flex justify-between items-center border-t border-border/10 bg-muted/10">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-10 px-6 rounded-xl font-normal text-xs">
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="h-10 px-8 rounded-xl bg-primary text-white font-normal text-xs hover:opacity-90 transition-all">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingResident ? (
                    'Simpan Perubahan'
                  ) : (
                    'Daftarkan Warga'
                  )}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
