import { useState, useMemo, useRef, Fragment } from 'react';
import { Plus, Search, Calendar, Loader2, Home, Building, Trees, Printer, Edit, Trash2, Download, MessageSquare, Share2, CreditCard as CreditCardIcon, Edit2, AlertCircle, ChevronDown, ChevronRight, CheckCircle2, XCircle, X, ImageIcon } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toPng } from 'html-to-image';
import { Layout } from '@/components/Layout';
import { MonthPicker } from '@/components/MonthPicker';
import { PaymentReceipt } from '@/components/PaymentReceipt';
import { useResidents, PropertyType } from '@/hooks/useResidents';
import { usePayments, Payment } from '@/hooks/usePayments';
import { useSettings } from '@/hooks/useSettings';
import { usePaymentCategories } from '@/hooks/usePaymentCategories';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Payments() {
  const { residents } = useResidents();
  const { payments, isLoading: paymentsLoading, addPayment, updatePayment, deletePayment, getPaidMonthsForResident } = usePayments();
  const { fees, rtInfo, getFeeByPropertyType } = useSettings();
  const { categories, isLoading: categoriesLoading } = usePaymentCategories();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  
    const [selectedResidentId, setSelectedResidentId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('bulanan');
    const [selectedFundingSource, setSelectedFundingSource] = useState<string | null>(null);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [manualAmount, setManualAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const isLoading = paymentsLoading || categoriesLoading;

  const incomeCategories = useMemo(() => {
    return categories.filter(c => c.type === 'income');
  }, [categories]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === 'bulanan') return null;
    return categories.find(c => c.id === selectedCategoryId);
  }, [selectedCategoryId, categories]);

  const activeResidents = residents.filter((r) => r.status === 'active');

  const selectedResident = useMemo(() => {
    return residents.find((r) => r.id === (selectedResidentId || editingPayment?.resident_id));
  }, [selectedResidentId, editingPayment, residents]);

  const monthlyFee = useMemo(() => {
    if (!selectedResident) return fees.occupied;
    return getFeeByPropertyType(selectedResident.property_type);
  }, [selectedResident, fees, getFeeByPropertyType]);

  const totalAmount = useMemo(() => {
    if (selectedCategoryId === 'bulanan') {
      return selectedMonths.length * monthlyFee;
    }
    if (selectedCategory) {
      if (selectedCategory.period === 'bulanan') {
        return selectedMonths.length * (selectedCategory.amount || 0);
      }
      return parseFloat(manualAmount) || selectedCategory.amount || 0;
    }
    return 0;
  }, [selectedCategoryId, selectedCategory, selectedMonths, monthlyFee, manualAmount]);

  const filteredPayments = payments.filter(
    (p) =>
      (p.residents?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      p.months.some((m) => m.toLowerCase().includes(search.toLowerCase()))
  );

  const paidMonths = useMemo(() => {
    const resId = selectedResidentId || editingPayment?.resident_id;
    if (!resId) return [];
    
    let allPaid = getPaidMonthsForResident(resId);
    
    if (editingPayment && editingPayment.resident_id === resId) {
      allPaid = allPaid.filter(m => !editingPayment.months.includes(m));
    }
    
    return allPaid;
  }, [selectedResidentId, editingPayment, getPaidMonthsForResident]);

  const handleOpenAdd = () => {
    setEditingPayment(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setSelectedResidentId(payment.resident_id);
    setSelectedCategoryId(payment.category_id || 'bulanan');
    setSelectedFundingSource(payment.funding_source || null);
    setSelectedMonths(payment.months);
    setNotes(payment.notes || '');
    setManualAmount(payment.amount.toString());
    if (payment.months.length > 0) {
      const yearMatch = payment.months[0].match(/\d{4}/);
      if (yearMatch) setSelectedYear(parseInt(yearMatch[0]));
    }
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPaymentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    
    const result = await deletePayment(paymentToDelete);
    if (result.success) {
      toast({
        title: 'Berhasil',
        description: 'Pembayaran telah dihapus',
      });
    }
    setIsDeleteDialogOpen(false);
    setPaymentToDelete(null);
  };

    const showResidentSelection = useMemo(() => {
      if (selectedCategoryId === 'bulanan') return true;
      if (selectedCategory?.name === 'Bansos Pemkot' || selectedFundingSource === 'Bansos Pemkot') return false;
      
      // If funding source is Iuran Pokok, always show resident
      if (selectedFundingSource === 'Iuran Pokok') return true;
      
      return true;
    }, [selectedCategoryId, selectedCategory, selectedFundingSource]);

    const handleSubmit = async () => {
      if (showResidentSelection && !selectedResidentId && !editingPayment) {
        toast({
          title: 'Error',
          description: 'Pilih warga terlebih dahulu',
          variant: 'destructive',
        });
        return;
      }

      // Validate funding source if category has funding sources
      if (selectedCategory && selectedCategory.funding_sources && selectedCategory.funding_sources.length > 0 && !selectedFundingSource) {
        toast({
          title: 'Error',
          description: 'Pilih sumber dana terlebih dahulu',
          variant: 'destructive',
        });
        return;
      }

      const isBulanan = selectedCategoryId === 'bulanan' || (selectedCategory?.period === 'bulanan');
      if (isBulanan && selectedMonths.length === 0) {
        toast({
          title: 'Error',
          description: 'Pilih minimal satu bulan',
          variant: 'destructive',
        });
        return;
      }

      if (!isBulanan && !totalAmount && !manualAmount) {
        toast({
          title: 'Error',
          description: 'Masukkan jumlah pembayaran',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);

      let result;
      const payload = {
        resident_id: showResidentSelection ? selectedResidentId : undefined,
        category_id: selectedCategoryId === 'bulanan' ? undefined : selectedCategoryId,
        funding_source: selectedFundingSource,
        months: selectedMonths,
        amount: totalAmount,
        notes: notes || undefined,
        residentName: selectedResident?.name,
      };

    if (editingPayment) {
      result = await updatePayment(editingPayment.id, payload);
    } else {
      result = await addPayment(payload);
    }

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: editingPayment 
          ? 'Pembayaran berhasil diperbarui' 
          : `Pembayaran berhasil dicatat dan masuk ke transaksi pemasukan`,
      });
      setIsDialogOpen(false);
      resetForm();
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSelectedResidentId('');
    setSelectedCategoryId('bulanan');
    setSelectedMonths([]);
    setNotes('');
    setManualAmount('');
  };

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Kwitansi-${selectedPaymentForReceipt?.id?.slice(0, 8) || 'payment'}`,
  });

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `Kwitansi-${selectedPaymentForReceipt?.id?.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: 'Berhasil',
        description: 'Kwitansi telah diunduh sebagai gambar',
      });
    } catch (err) {
      console.error('Error generating image:', err);
      toast({
        title: 'Error',
        description: 'Gagal membuat gambar kwitansi',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!selectedPaymentForReceipt) return;
    
    const resident = selectedPaymentForReceipt.residents?.name || '-';
    const amountValue = formatCurrency(Number(selectedPaymentForReceipt.amount));
    const months = selectedPaymentForReceipt.months.join(', ');
    const rtName = rtInfo?.name || 'RT';
    const receiptId = selectedPaymentForReceipt.id.slice(0, 8).toUpperCase();
    
    const text = `*BUKTI PEMBAYARAN IURAN - ${rtName}*\n\n` +
      `Halo Bapak/Ibu *${resident}*,\n` +
      `Berikut adalah bukti pembayaran iuran Anda:\n\n` +
      `📌 *ID:* ${receiptId}\n` +
      `📅 *Bulan:* ${months}\n` +
      `💰 *Total:* ${amountValue}\n` +
      `✅ *Status:* LUNAS\n\n` +
      `Terima kasih atas partisipasinya dalam membangun lingkungan kita.\n\n` +
      `_Pesan otomatis dari Sistem Manajemen RT_`;
    
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const openReceiptDialog = (payment: Payment) => {
    setSelectedPaymentForReceipt(payment);
    setIsReceiptDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPropertyTypeIcon = (type: PropertyType) => {
    const icons: Record<PropertyType, React.ReactNode> = {
      occupied: <Home className="h-3 w-3" />,
      empty_house: <Building className="h-3 w-3" />,
      empty_land: <Trees className="h-3 w-3" />,
    };
    return icons[type];
  };

  const getPropertyTypeLabel = (type: PropertyType) => {
    const labels: Record<PropertyType, string> = {
      occupied: 'Berpenghuni',
      empty_house: 'Rumah Kosong',
      empty_land: 'Lahan Kosong',
    };
    return labels[type];
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight">Pembayaran Iuran</h1>
              <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-1 sm:mt-2 opacity-60">
                Contribution Management System
              </p>
            </div>
            <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 shadow-sm bg-primary text-white font-normal text-xs sm:text-sm rounded-xl h-10 sm:h-11 px-4 sm:px-6 hover:shadow-md transition-all">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Catat Pembayaran</span>
            </Button>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Berpenghuni', value: fees.occupied, icon: <Home className="h-4 w-4 sm:h-5 sm:w-5" />, variant: 'success' },
            { label: 'Rumah Kosong', value: fees.empty_house, icon: <Building className="h-4 w-4 sm:h-5 sm:w-5" />, variant: 'warning' },
            { label: 'Lahan Kosong', value: fees.empty_land, icon: <Trees className="h-4 w-4 sm:h-5 sm:w-5" />, variant: 'default' }
          ].map((fee) => (
            <Card key={fee.label} className="rounded-xl border shadow-sm">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className={cn(
                  "p-1.5 sm:p-2 rounded-lg sm:rounded-xl",
                  fee.variant === 'success' ? "bg-success/10 text-success" : 
                  fee.variant === 'warning' ? "bg-warning/10 text-warning" : "bg-muted/30 text-muted-foreground"
                )}>
                  {fee.icon}
                </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-normal text-muted-foreground opacity-60">{fee.label}</p>
                    <p className="text-sm sm:text-base font-normal text-foreground">{formatCurrency(fee.value)}</p>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-1 sm:p-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Cari nama warga atau bulan pembayaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 sm:pl-12 h-10 sm:h-12 border-none bg-transparent focus-visible:ring-0 font-medium text-xs sm:text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-muted-foreground/30 gap-4 sm:gap-6">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 opacity-10" />
                <div className="text-center">
                  <p className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em]">Riwayat Kosong</p>
                  <Button onClick={handleOpenAdd} variant="link" className="mt-1 sm:mt-2 text-primary font-bold text-xs">
                    Catat pembayaran pertama
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 border-b-border/30">
                        <TableHead className="w-12 sm:w-16 text-center pl-4 sm:pl-6 text-[10px] sm:text-xs font-normal text-muted-foreground">No</TableHead>
                        <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground whitespace-nowrap">Informasi Pembayaran</TableHead>
                        <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground whitespace-nowrap hidden sm:table-cell">Bulan Terbayar</TableHead>
                        <TableHead className="text-right text-[10px] sm:text-xs font-normal text-muted-foreground pr-4 sm:pr-6">Jumlah</TableHead>
                        <TableHead className="text-right pr-4 sm:pr-6 text-[10px] sm:text-xs font-normal text-muted-foreground">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment, index) => (
                        <TableRow key={payment.id} className="hover:bg-muted/10 transition-colors group border-b-border/10">
                          <TableCell className="text-center pl-4 sm:pl-6 text-[10px] sm:text-xs font-normal text-muted-foreground/40">{index + 1}</TableCell>
                          <TableCell className="py-3 sm:py-4">
                            <div className="flex flex-col">
                              <span className="font-normal text-xs sm:text-sm text-foreground whitespace-nowrap">{payment.residents?.name || 'Unknown'}</span>
                              <span className="text-[9px] sm:text-[11px] font-normal text-muted-foreground mt-0.5">{formatDate(payment.created_at)}</span>
                              <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                                {payment.months.slice(0, 2).map((month) => (
                                  <Badge key={month} variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[8px] sm:text-[10px] font-normal px-1.5 py-0 rounded-full">
                                    {month}
                                  </Badge>
                                ))}
                                {payment.months.length > 2 && <span className="text-[8px] text-muted-foreground">+{payment.months.length - 2}</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1.5">
                              {payment.months.map((month) => (
                                <Badge 
                                  key={month} 
                                  variant="outline"
                                  className="bg-primary/5 text-primary border-primary/10 text-[10px] font-normal px-2 py-0.5 rounded-full"
                                >
                                  {month}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-normal text-xs sm:text-sm text-success pr-4 sm:pr-6">
                            {formatCurrency(Number(payment.amount))}
                          </TableCell>
                        <TableCell className="text-right pr-4 sm:pr-6">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openReceiptDialog(payment)}
                              className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(payment)}
                              className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(payment.id)}
                              className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl" aria-describedby={undefined}>
            <DialogHeader className="p-6 border-b border-border/10 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <CreditCardIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-normal">{editingPayment ? 'Edit Record Pembayaran' : 'Input Pembayaran Baru'}</DialogTitle>
                    <p className="text-[10px] text-muted-foreground font-normal mt-1">Financial Transaction System</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2 group">
                  <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Jenis Pembayaran *</Label>
                    <Select value={selectedCategoryId} onValueChange={(v) => {
                      setSelectedCategoryId(v);
                      setSelectedFundingSource(null);
                      const cat = categories.find(c => c.id === v);
                      if (cat && cat.period === 'bebas') {
                        setSelectedMonths([]);
                        setManualAmount(cat.amount.toString());
                      }
                    }}>
                      <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                        <SelectValue placeholder="Pilih kategori..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-xl rounded-xl">
                        <SelectItem value="bulanan" className="text-xs font-normal">Iuran Bulanan (Wajib)</SelectItem>
                        {incomeCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs font-normal">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCategory && selectedCategory.funding_sources && selectedCategory.funding_sources.length > 0 && (
                    <div className="space-y-2 group animate-in slide-in-from-left-2 duration-300">
                      <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Sumber Dana *</Label>
                      <Select value={selectedFundingSource || ''} onValueChange={setSelectedFundingSource}>
                        <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                          <SelectValue placeholder="Pilih sumber dana..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border shadow-xl rounded-xl">
                          {selectedCategory.funding_sources.map((source) => (
                            <SelectItem key={source} value={source} className="text-xs font-normal">
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {showResidentSelection && (
                  <div className="space-y-2 group">
                    <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Pilih Warga Pembayar *</Label>
                    <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                      <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                        <SelectValue placeholder="Klik untuk mencari warga..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-xl rounded-xl">
                        {activeResidents.map((resident) => (
                          <SelectItem key={resident.id} value={resident.id} className="text-xs font-normal">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-muted rounded-md">{getPropertyTypeIcon(resident.property_type)}</div>
                              <div className="flex flex-col">
                                <span className="font-normal">{resident.name}</span>
                                <span className="text-[10px] opacity-60 font-normal">{resident.address}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedResident && selectedCategoryId === 'bulanan' && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        {getPropertyTypeIcon(selectedResident.property_type)}
                      </div>
                      <div>
                        <p className="text-[10px] font-normal text-primary mt-1">{getPropertyTypeLabel(selectedResident.property_type)}</p>
                        <p className="text-sm font-normal text-foreground">{formatCurrency(monthlyFee)} / Bulan</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none font-normal text-[10px]">Terverifikasi</Badge>
                  </div>
                )}

                {selectedResidentId && (
                  <div className="animate-fade-in space-y-6">
                    {(selectedCategoryId === 'bulanan' || selectedCategory?.period === 'bulanan') && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Tahun Pajak/Iuran</Label>
                          <Select
                            value={selectedYear.toString()}
                            onValueChange={(v) => {
                              setSelectedYear(parseInt(v));
                              setSelectedMonths([]);
                            }}
                          >
                            <SelectTrigger className="h-11 rounded-xl border bg-muted/30 font-normal">
                              <SelectValue />
                            </SelectTrigger>
                              <SelectContent className="bg-card border shadow-xl rounded-xl">
                                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                                  <SelectItem key={year} value={year.toString()} className="text-xs font-normal">
                                    Tahun {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-xs font-normal pl-1 text-muted-foreground">Pilih Bulan Pembayaran</Label>
                          <MonthPicker
                            selectedMonths={selectedMonths}
                            onSelect={setSelectedMonths}
                            year={selectedYear}
                            paidMonths={paidMonths}
                          />
                        </div>
                      </>
                    )}

                    {selectedCategory?.period === 'bebas' && (
                      <div className="space-y-2 group">
                        <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Jumlah Pembayaran (IDR)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-normal">Rp</span>
                          <Input
                            type="number"
                            value={manualAmount}
                            onChange={(e) => setManualAmount(e.target.value)}
                            className="pl-9 h-11 rounded-xl border bg-muted/30 font-normal"
                            placeholder="Masukkan nominal..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 group">
                      <Label className="text-xs font-normal pl-1 text-muted-foreground group-focus-within:text-primary">Keterangan Tambahan</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Titipan bapak A, Lunas setahun, dll..."
                        className="rounded-xl border bg-muted/30 font-normal min-h-[80px]"
                      />
                    </div>

                    {totalAmount > 0 && (
                      <Card className="p-6 bg-success/5 border-success/20 shadow-sm animate-scale-in">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-normal text-success mt-1">Estimasi Total</p>
                            <p className="text-xs font-normal text-muted-foreground mt-1">
                              {selectedCategoryId === 'bulanan' || selectedCategory?.period === 'bulanan' 
                                ? `${selectedMonths.length} Bulan × ${formatCurrency(selectedCategory?.amount || monthlyFee)}`
                                : selectedCategory?.name}
                            </p>
                          </div>
                          <p className="text-3xl font-normal text-success tracking-tighter">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="p-5 flex justify-between items-center border-t border-border/10 bg-muted/10">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 rounded-xl font-normal text-xs">
                  Batal
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={totalAmount <= 0 || isSubmitting}
                  className="h-11 px-10 rounded-xl bg-primary text-white font-normal text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Konfirmasi & Simpan'
                  )}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-slate-50/50 p-6 rounded-2xl border-none shadow-2xl" aria-describedby={undefined}>
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Share2 className="h-5 w-5" />
                </div>
                Preview & Bagikan Kwitansi
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-8">
              <div className="bg-white border rounded-2xl shadow-inner p-4 md:p-8 overflow-hidden">
                <div className="overflow-x-auto flex justify-center">
                  {selectedPaymentForReceipt && (
                    <PaymentReceipt ref={receiptRef} payment={selectedPaymentForReceipt} rtInfo={rtInfo} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  onClick={() => handlePrintReceipt()} 
                  variant="outline"
                  className="gap-2 h-12 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  <Printer className="h-4 w-4" />
                  Cetak PDF
                </Button>
                <Button 
                  onClick={handleDownloadImage} 
                  variant="outline"
                  className="gap-2 h-12 rounded-xl font-bold text-xs uppercase tracking-wider"
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Unduh Gambar
                </Button>
                <Button 
                  onClick={handleShareWhatsApp} 
                  className="gap-2 h-12 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white border-none font-bold text-xs uppercase tracking-wider"
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp Chat
                </Button>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Button variant="ghost" size="sm" onClick={() => setIsReceiptDialogOpen(false)} className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                Tutup Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-bold">Hapus Pembayaran?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Menghapus pembayaran juga akan menghapus transaksi pemasukan terkait secara otomatis.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-bold">Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold">
                Hapus Permanen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
