import { useState, useEffect } from 'react';
import { Save, Database, Loader2, Home, Building, Trees, MapPin, Phone, Users, Plus, Trash2, Edit2, TrendingUp, TrendingDown, Clock, Calendar, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useSettings } from '@/hooks/useSettings';
import { usePaymentCategories, PaymentCategory } from '@/hooks/usePaymentCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { fees, rtInfo, isLoading: settingsLoading, updateFee, updateRtInfo } = useSettings();
  const { categories, isLoading: categoriesLoading, addCategory, updateCategory, deleteCategory } = usePaymentCategories();
  
  const [feeInputs, setFeeInputs] = useState({
    occupied: '',
    empty_house: '',
    empty_land: '',
  });
  const [rtInputs, setRtInputs] = useState({
    name: '',
    address: '',
    contact: '',
  });
  const [savingState, setSavingState] = useState({
    occupied: false,
    empty_house: false,
    empty_land: false,
    rt_name: false,
    rt_address: false,
    rt_contact: false,
  });

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PaymentCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState({
      name: '',
      amount: '',
      period: 'bulanan' as 'bulanan' | 'bebas',
      type: 'income' as 'income' | 'expense',
      funding_sources: [] as string[],
    });
    const [newFundingSource, setNewFundingSource] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  useEffect(() => {
    if (!settingsLoading) {
      setFeeInputs({
        occupied: fees.occupied.toString(),
        empty_house: fees.empty_house.toString(),
        empty_land: fees.empty_land.toString(),
      });
      setRtInputs({
        name: rtInfo.name,
        address: rtInfo.address,
        contact: rtInfo.contact,
      });
    }
  }, [fees, rtInfo, settingsLoading]);

  const handleSaveFee = async (type: 'occupied' | 'empty_house' | 'empty_land') => {
    const fee = parseFloat(feeInputs[type]);
    if (isNaN(fee) || fee <= 0) {
      return;
    }
    setSavingState((prev) => ({ ...prev, [type]: true }));
    await updateFee(type, fee);
    setSavingState((prev) => ({ ...prev, [type]: false }));
  };

  const handleSaveRtInfo = async (field: 'name' | 'address' | 'contact') => {
    const value = rtInputs[field].trim();
    if (!value) return;
    
    const stateKey = `rt_${field}` as keyof typeof savingState;
    setSavingState((prev) => ({ ...prev, [stateKey]: true }));
    await updateRtInfo(field, value);
    setSavingState((prev) => ({ ...prev, [stateKey]: false }));
  };

    const handleCategorySubmit = async () => {
      if (!categoryForm.name) return;
      
      setIsSubmittingCategory(true);
      const amount = parseFloat(categoryForm.amount) || 0;
      
      const payload = {
        name: categoryForm.name,
        amount,
        period: categoryForm.period,
        type: categoryForm.type,
        funding_sources: categoryForm.funding_sources,
      };

    let result;
    if (editingCategory) {
      result = await updateCategory(editingCategory.id, payload);
    } else {
      result = await addCategory(payload);
    }

    if (result.success) {
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    }
    setIsSubmittingCategory(false);
  };

    const resetCategoryForm = () => {
      setCategoryForm({
        name: '',
        amount: '',
        period: 'bulanan',
        type: 'income',
        funding_sources: [],
      });
      setNewFundingSource('');
      setEditingCategory(null);
    };
  
    const openEditCategory = (category: PaymentCategory) => {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        amount: category.amount.toString(),
        period: category.period,
        type: category.type,
        funding_sources: category.funding_sources || [],
      });
      setIsCategoryDialogOpen(true);
    };

    const addFundingSource = () => {
      if (!newFundingSource.trim()) return;
      if (categoryForm.funding_sources.includes(newFundingSource.trim())) return;
      setCategoryForm({
        ...categoryForm,
        funding_sources: [...categoryForm.funding_sources, newFundingSource.trim()],
      });
      setNewFundingSource('');
    };

    const removeFundingSource = (source: string) => {
      setCategoryForm({
        ...categoryForm,
        funding_sources: categoryForm.funding_sources.filter(s => s !== source),
      });
    };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = settingsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const feeConfigs = [
    {
      type: 'occupied' as const,
      label: 'Rumah Berpenghuni',
      icon: Home,
      description: 'Iuran utama untuk rumah yang dihuni warga',
      color: 'text-success',
    },
    {
      type: 'empty_house' as const,
      label: 'Rumah Kosong',
      icon: Building,
      description: 'Iuran untuk rumah yang tidak dihuni',
      color: 'text-warning',
    },
    {
      type: 'empty_land' as const,
      label: 'Lahan Kosong',
      icon: Trees,
      description: 'Iuran untuk lahan atau tanah kosong',
      color: 'text-muted-foreground',
    },
  ];

  const rtInfoConfigs = [
    {
      field: 'name' as const,
      label: 'Nama RT/RW',
      icon: Users,
      placeholder: 'Contoh: RT 001 RW 002',
      stateKey: 'rt_name' as const,
    },
    {
      field: 'address' as const,
      label: 'Alamat',
      icon: MapPin,
      placeholder: 'Contoh: Perumahan Griya Asri, Kel. Sukamaju',
      stateKey: 'rt_address' as const,
    },
    {
      field: 'contact' as const,
      label: 'Kontak',
      icon: Phone,
      placeholder: 'Contoh: 081234567890',
      stateKey: 'rt_contact' as const,
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Pengaturan</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mt-2 opacity-60">System Configuration & Master Data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-8">
            {/* RT Info Settings */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b bg-primary/5">
                <CardTitle className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Informasi RT
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {rtInfoConfigs.map((config) => (
                  <div key={config.field} className="space-y-2 group">
                    <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">
                      {config.label}
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <config.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          value={rtInputs[config.field]}
                          onChange={(e) =>
                            setRtInputs((prev) => ({ ...prev, [config.field]: e.target.value }))
                          }
                          className="pl-10 h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-medium"
                          placeholder={config.placeholder}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleSaveRtInfo(config.field)}
                        disabled={savingState[config.stateKey]}
                        className="h-11 w-11 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        {savingState[config.stateKey] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Core Fee Settings */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b bg-success/5">
                <CardTitle className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider text-success">
                  <div className="p-2 bg-success/10 rounded-xl">
                    <Database className="h-4 w-4" />
                  </div>
                  Iuran Pokok
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {feeConfigs.map((config) => (
                  <div key={config.type} className="space-y-2 group">
                    <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">
                      {config.label}
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">Rp</span>
                        <Input
                          type="number"
                          className="pl-9 h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-bold"
                          value={feeInputs[config.type]}
                          onChange={(e) =>
                            setFeeInputs((prev) => ({ ...prev, [config.type]: e.target.value }))
                          }
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleSaveFee(config.type)}
                        disabled={savingState[config.type]}
                        className="h-11 w-11 rounded-xl bg-success/10 text-success hover:bg-success hover:text-white transition-all shadow-sm"
                      >
                        {savingState[config.type] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Payment Categories Management */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    Kategori & Master Data
                  </CardTitle>
                  <CardDescription className="text-[10px] pl-11 font-medium">Pengaturan jenis iuran dan pengeluaran</CardDescription>
                </div>
                <Button onClick={() => { resetCategoryForm(); setIsCategoryDialogOpen(true); }} className="gap-2 bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-sm rounded-xl h-10 px-5">
                  <Plus className="h-4 w-4" />
                  Tambah Kategori
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider">Kategori</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Jenis</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Periode</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Nominal</TableHead>
                        <TableHead className="w-20 text-center pr-6 text-[10px] font-bold uppercase tracking-wider">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id} className="hover:bg-muted/10 transition-colors group">
                          <TableCell className="pl-6 font-bold text-sm text-foreground">{category.name}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "border-none text-[9px] font-bold px-2 py-0.5 rounded-full",
                                category.type === 'income'
                                  ? 'bg-success/15 text-success'
                                  : 'bg-destructive/15 text-destructive'
                              )}
                            >
                              {category.type === 'income' ? 'MASUK' : 'KELUAR'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-bold gap-1 rounded-full px-2 py-0.5">
                              {category.period === 'bulanan' ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                              {category.period.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            {category.amount > 0 ? formatCurrency(category.amount) : '—'}
                          </TableCell>
                          <TableCell className="pr-6">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditCategory(category)}
                                className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteCategory(category.id)}
                                className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Sync Info */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10 shadow-sm rounded-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Database className="h-24 w-24" />
              </div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-primary/10 rounded-xl text-primary shadow-sm">
                  <Database className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">Informasi Sinkronisasi</h4>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-xl">
                    Data <strong className="text-primary font-bold">Jenis Pembayaran</strong> di atas akan muncul otomatis sebagai pilihan kategori saat mencatat transaksi baru. 
                    Jika nominal diatur, aplikasi akan otomatis mengisi jumlah pembayaran saat kategori tersebut dipilih untuk memudahkan operasional.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl">
          <DialogHeader className="p-6 border-b border-border/10 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                {editingCategory ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{editingCategory ? 'Edit Jenis Pembayaran' : 'Kategori Baru'}</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Accounting Master Data</p>
              </div>
            </div>
          </DialogHeader>
            <div className="p-6 space-y-6">
              <div className="space-y-2 group">
                <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">Nama Pembayaran / Kategori *</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-medium"
                  placeholder="Contoh: Iuran Keamanan, Donasi, dll"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 group">
                  <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">Tipe Transaksi</Label>
                  <Select
                    value={categoryForm.type}
                    onValueChange={(v: any) => setCategoryForm({ ...categoryForm, type: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border shadow-xl rounded-xl">
                      <SelectItem value="income" className="text-xs font-bold text-success">Pemasukan (+)</SelectItem>
                      <SelectItem value="expense" className="text-xs font-bold text-destructive">Pengeluaran (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 group">
                  <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">Periode</Label>
                  <Select
                    value={categoryForm.period}
                    onValueChange={(v: any) => setCategoryForm({ ...categoryForm, period: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border shadow-xl rounded-xl">
                      <SelectItem value="bulanan" className="text-xs font-bold">Bulanan</SelectItem>
                      <SelectItem value="bebas" className="text-xs font-bold">Bebas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 group">
                <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">Sumber Dana (Opsi)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFundingSource}
                    onChange={(e) => setNewFundingSource(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFundingSource()}
                    className="h-10 rounded-xl border bg-muted/30 font-medium"
                    placeholder="Contoh: Iuran Pokok, Bansos Pemkot"
                  />
                  <Button type="button" onClick={addFundingSource} variant="secondary" className="h-10 rounded-xl">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categoryForm.funding_sources.map((source) => (
                    <Badge key={source} variant="secondary" className="px-3 py-1 rounded-full flex items-center gap-2 bg-primary/10 text-primary border-none">
                      {source}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeFundingSource(source)} />
                    </Badge>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground font-semibold italic pl-1 uppercase opacity-60">Gunakan "Iuran Pokok" untuk memunculkan opsi warga pembayar</p>
              </div>

              <div className="space-y-2 group">
                <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">Nominal Default (IDR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">Rp</span>
                  <Input
                    type="number"
                    className="pl-9 h-11 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-bold"
                    value={categoryForm.amount}
                    onChange={(e) => setCategoryForm({ ...categoryForm, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground font-semibold italic pl-1 uppercase opacity-60">Kosongkan jika nominal tidak tetap</p>
              </div>
            </div>
          <DialogFooter className="p-5 flex justify-between items-center border-t border-border/10 bg-muted/10">
            <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)} className="h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider">
              Batal
            </Button>
            <Button onClick={handleCategorySubmit} disabled={isSubmittingCategory || !categoryForm.name} className="h-11 px-10 bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-all rounded-xl">
              {isSubmittingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCategory ? 'Update Master Data' : 'Simpan Kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
