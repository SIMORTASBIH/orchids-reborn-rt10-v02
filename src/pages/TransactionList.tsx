import { useState, useRef, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, Trash2, Search, Loader2, X, ImageIcon, Calendar, Clock, Pencil, AlertCircle, FileText, CreditCard, Home, Building, Trees, Printer, Share2, Download, MessageSquare } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toPng } from 'html-to-image';
import { Layout } from '@/components/Layout';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { usePaymentCategories } from '@/hooks/usePaymentCategories';
import { useResidents } from '@/hooks/useResidents';
import { usePayments, Payment } from '@/hooks/usePayments';
import { useSettings } from '@/hooks/useSettings';
import { MonthPicker } from '@/components/MonthPicker';
import { PaymentReceipt } from '@/components/PaymentReceipt';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn, formatCurrency, formatNumber, parseNumber } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function Transactions() {
  const { transactions, isLoading: transactionsLoading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { categories, isLoading: categoriesLoading } = usePaymentCategories();
  const { residents } = useResidents();
  const { addPayment, getPaidMonthsForResident } = usePayments();
  const { fees, rtInfo, getFeeByPropertyType } = useSettings();
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  // New states for unified flow
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedFundingSource, setSelectedFundingSource] = useState<string | null>(null);
  
  // Receipt states
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const openImageDialog = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageDialogOpen(true);
  };

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
  });

  const incomeCategories = useMemo(() => 
    categories.filter(c => c.type === 'income'), 
  [categories]);
  
  const expenseCategories = useMemo(() => 
    categories.filter(c => c.type === 'expense'), 
  [categories]);

  const activeCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const selectedCategory = useMemo(() => {
    if (formData.category === 'Iuran Pokok (Bulanan)') return null;
    return categories.find(c => c.name === formData.category);
  }, [formData.category, categories]);

    const isResidentPayment = useMemo(() => {
      if (formData.type !== 'income') return false;
      
      // If a funding source is selected, check if it's "Iuran Pokok"
      if (selectedFundingSource === 'Iuran Pokok') return true;
      
      // Explicitly exclude Bansos Pemkot from resident selection
      if (formData.category === 'Bansos Pemkot' || selectedFundingSource === 'Bansos Pemkot') return false;
      
      // Only show resident payer for Monthly categories (Bulanan)
      return formData.category === 'Iuran Pokok (Bulanan)' || selectedCategory?.period === 'bulanan';
    }, [formData.type, formData.category, selectedCategory, selectedFundingSource]);

  const activeResidents = residents.filter((r) => r.status === 'active');
  const selectedResident = residents.find(r => r.id === (selectedResidentId || editingTransaction?.payments?.resident_id));
  
  const monthlyFee = useMemo(() => {
    if (!selectedResident) return 0;
    if (selectedCategory && selectedCategory.period === 'bulanan') {
      return selectedCategory.amount;
    }
    return getFeeByPropertyType(selectedResident.property_type);
  }, [selectedResident, selectedCategory, getFeeByPropertyType]);

  const calculatedAmount = useMemo(() => {
    if (formData.category === 'Iuran Pokok (Bulanan)' || (selectedCategory?.period === 'bulanan')) {
      const fee = isResidentPayment ? monthlyFee : (selectedCategory?.amount || 0);
      return selectedMonths.length * fee;
    }
    if (isResidentPayment) {
      return selectedCategory?.amount || parseNumber(formData.amount);
    }
    return 0;
  }, [isResidentPayment, formData.category, selectedCategory, selectedMonths, monthlyFee, formData.amount]);

  const paidMonths = useMemo(() => {
    if (!selectedResidentId) return [];
    return getPaidMonthsForResident(selectedResidentId);
  }, [selectedResidentId, getPaidMonthsForResident]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = 
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        (t.payments?.residents?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, filterType]);

    const handleCategoryChange = (categoryName: string) => {
      const selectedCat = activeCategories.find(c => c.name === categoryName);
      
      setFormData(prev => ({
        ...prev,
        category: categoryName,
        amount: selectedCat && selectedCat.amount > 0 ? formatNumber(selectedCat.amount) : prev.amount,
        description: categoryName === 'Iuran Pokok (Bulanan)' ? '' : prev.description
      }));
      
      setSelectedFundingSource(null);

      if (categoryName !== 'Iuran Pokok (Bulanan)' && !selectedCat) {
        setSelectedResidentId('');
        setSelectedMonths([]);
      }
      
      if (selectedCat) {
        setSelectedCategoryId(selectedCat.id);
      } else if (categoryName === 'Iuran Pokok (Bulanan)') {
        setSelectedCategoryId('bulanan');
      } else {
        setSelectedCategoryId('');
      }
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

  const openReceiptDialog = (transaction: Transaction) => {
    if (transaction.payments) {
      const payment: Payment = {
        id: transaction.payment_id!,
        resident_id: transaction.payments.id, // This is actually payment id in the interface join, wait
        category_id: null,
        months: transaction.payments.months,
        amount: transaction.payments.amount,
        notes: transaction.payments.notes,
        created_at: transaction.created_at,
        residents: transaction.payments.residents
      };
      setSelectedPaymentForReceipt(payment);
      setIsReceiptDialogOpen(true);
    }
  };

    const handleSubmit = async () => {
      if (!formData.category || (!isResidentPayment && !formData.description) || (!isResidentPayment && !formData.amount)) {
        toast({
          title: 'Error',
          description: 'Semua field wajib diisi',
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

      if (isResidentPayment) {
      if (!selectedResidentId) {
        toast({ title: 'Error', description: 'Pilih warga terlebih dahulu', variant: 'destructive' });
        return;
      }
      const isBulanan = formData.category === 'Iuran Pokok (Bulanan)' || selectedCategory?.period === 'bulanan';
      if (isBulanan && selectedMonths.length === 0) {
        toast({ title: 'Error', description: 'Pilih minimal satu bulan', variant: 'destructive' });
        return;
      }
    }

    const amount = isResidentPayment ? calculatedAmount : parseNumber(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Jumlah harus berupa angka positif',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    let result;
      if (isResidentPayment) {
        result = await addPayment({
          resident_id: selectedResidentId,
          category_id: selectedCategoryId === 'bulanan' ? undefined : selectedCategoryId,
          funding_source: selectedFundingSource,
          months: selectedMonths,
          amount: amount,
          notes: formData.description || `${formData.category}${selectedFundingSource ? ` (${selectedFundingSource})` : ''} - ${selectedResident?.name}`,
          residentName: selectedResident?.name,
        });
        } else {
          let imageUrl = editingTransaction?.image_url || null;
          if (selectedImage && formData.type === 'expense') {
            setIsUploading(true);
            imageUrl = await uploadImage(selectedImage);
            setIsUploading(false);
          }

          let description = formData.description;
          if (selectedCategory?.period === 'bulanan' && selectedMonths.length > 0) {
            const monthsStr = selectedMonths.join(', ');
            description = `${description ? `${description} ` : ''}(Bulan: ${monthsStr})`;
          }

          const transactionData = {
            type: formData.type,
            category: formData.category,
            funding_source: selectedFundingSource,
            description: description,
            amount,
            image_url: imageUrl,
          };

      if (editingTransaction) {
        result = await updateTransaction(editingTransaction.id, transactionData);
      } else {
        result = await addTransaction(transactionData);
      }
    }

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: isResidentPayment 
          ? `Pembayaran ${formData.category} ${selectedResident?.name} berhasil dicatat`
          : `Transaksi ${formData.type === 'income' ? 'pemasukan' : 'pengeluaran'} berhasil ${editingTransaction ? 'diperbarui' : 'dicatat'}`,
      });
      setIsDialogOpen(false);
      resetForm();
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      category: '',
      description: '',
      amount: '',
    });
    setSelectedResidentId('');
    setSelectedFundingSource(null);
    setSelectedMonths([]);
    clearImage();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      description: transaction.description,
      amount: formatNumber(transaction.amount),
    });
    setSelectedFundingSource(transaction.funding_source || null);
    setImagePreview(transaction.image_url);
    setIsDialogOpen(true);
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'occupied': return <Home className="h-3 w-3" />;
      case 'empty_house': return <Building className="h-3 w-3" />;
      case 'empty_land': return <Trees className="h-3 w-3" />;
      default: return <Home className="h-3 w-3" />;
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Hanya file gambar yang diperbolehkan',
          variant: 'destructive',
        });
        return;
      }
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file maksimal 5MB',
        variant: 'destructive',
      });
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error } = await supabase.storage
      .from('transaction-receipts')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('transaction-receipts')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseNumber(value);
    if (isNaN(numericValue) && value !== '') return;
    
    setFormData(prev => ({
      ...prev,
      amount: value === '' ? '' : formatNumber(numericValue)
    }));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      const result = await deleteTransaction(id);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Transaksi berhasil dihapus',
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isLoading = transactionsLoading || categoriesLoading;

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
              <h1 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight">Transaksi</h1>
              <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-1 sm:mt-2 opacity-60">Financial Transaction Journal</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="w-full sm:w-auto gap-2 shadow-sm bg-primary text-white font-normal text-xs sm:text-sm rounded-xl h-10 sm:h-11 px-4 sm:px-6 hover:shadow-md transition-all">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Tambah Transaksi</span>
              </Button>
            </div>
          </div>

        {/* Filter Section */}
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Cari deskripsi atau kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 sm:pl-12 h-10 sm:h-12 border-none bg-muted/50 focus-visible:ring-0 font-medium text-xs sm:text-sm"
                />
              </div>
                <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'Semua', icon: <FileText className="h-3 w-3" /> },
                    { id: 'income', label: 'Masuk', icon: <TrendingUp className="h-3 w-3" /> },
                    { id: 'expense', label: 'Keluar', icon: <TrendingDown className="h-3 w-3" /> }
                  ].map((tab) => (
                      <Button
                        key={tab.id}
                        variant={filterType === tab.id ? 'secondary' : 'ghost'}
                        onClick={() => setFilterType(tab.id as 'all' | 'income' | 'expense')}
                        size="sm"
                        className={cn(
                        "h-9 sm:h-10 px-3 sm:px-4 text-[10px] font-normal gap-1.5 sm:gap-2 flex-1 md:flex-none rounded-lg transition-all whitespace-nowrap",
                        filterType === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </Button>
                  ))}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-muted-foreground/30 gap-4 sm:gap-6">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 opacity-10" />
                  <div className="text-center">
                    <p className="text-[10px] sm:text-sm font-normal tracking-[0.2em]">Jurnal Kosong</p>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} variant="link" className="mt-1 sm:mt-2 text-primary font-normal text-xs">
                      Catat transaksi pertama
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 border-b-border/30">
                        <TableHead className="w-12 sm:w-16 text-center pl-4 sm:pl-6 text-[10px] sm:text-xs font-normal text-muted-foreground">No</TableHead>
                        <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground hidden sm:table-cell">Tanggal</TableHead>
                        <TableHead className="text-[10px] sm:text-xs font-normal text-muted-foreground whitespace-nowrap">Informasi Transaksi</TableHead>
                        <TableHead className="text-right text-[10px] sm:text-xs font-normal text-muted-foreground whitespace-nowrap">Jumlah</TableHead>
                        <TableHead className="text-center w-16 sm:w-24 text-[10px] sm:text-xs font-normal text-muted-foreground">Bukti</TableHead>
                        <TableHead className="text-right pr-4 sm:pr-6 text-[10px] sm:text-xs font-normal text-muted-foreground">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction, index) => (
                        <TableRow key={transaction.id} className="hover:bg-muted/10 transition-colors group border-b-border/10">
                          <TableCell className="text-center pl-4 sm:pl-6 text-[10px] sm:text-xs font-normal text-muted-foreground/40">{index + 1}</TableCell>
                          <TableCell className="text-[10px] sm:text-xs font-normal hidden sm:table-cell">{formatDate(transaction.transaction_date)}</TableCell>
                          <TableCell className="py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <div className={cn(
                                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] font-normal shadow-sm flex-shrink-0",
                                transaction.type === 'income' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                              )}>
                                {transaction.type === 'income' ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-normal text-xs sm:text-sm text-foreground truncate max-w-[120px] sm:max-w-none">{transaction.description}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] sm:text-[10px] font-normal text-muted-foreground tracking-tight truncate">{transaction.category}</span>
                                  <span className="text-[8px] font-normal text-muted-foreground sm:hidden">• {formatDate(transaction.transaction_date)}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell 
                            className={cn(
                              'text-right font-normal text-xs sm:text-sm whitespace-nowrap',
                              transaction.type === 'income' ? 'text-success' : 'text-destructive'
                            )}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(Number(transaction.amount))}
                          </TableCell>
                        <TableCell className="text-center">
                          {transaction.image_url ? (
                            <button
                              onClick={() => openImageDialog(transaction.image_url!)}
                              className="group relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-border/20 overflow-hidden bg-muted hover:ring-2 hover:ring-primary/30 transition-all mx-auto shadow-sm"
                            >
                              <img src={transaction.image_url} alt="Bukti" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Search className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-dashed border-border/30 flex items-center justify-center mx-auto bg-muted/10 text-muted-foreground/20">
                              <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                          )}
                        </TableCell>
                          <TableCell className="text-right pr-4 sm:pr-6">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              {transaction.payment_id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openReceiptDialog(transaction)}
                                  className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-primary"
                                >
                                  <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(transaction)}
                                className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(transaction.id)}
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

            {/* Transaction Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl">
                  <DialogHeader className="p-4 border-b border-border/10 bg-primary/5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        {editingTransaction ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </div>
                      <div>
                        <DialogTitle className="text-base font-normal">{editingTransaction ? 'Edit Jurnal Transaksi' : 'Catat Transaksi Baru'}</DialogTitle>
                        <p className="text-[9px] text-muted-foreground font-normal opacity-60">Accounting Information System</p>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/10 max-h-[calc(85vh-100px)] overflow-y-auto no-scrollbar">
                      {/* Left Column: Basic Info */}
                      <div className="p-5 md:w-[40%] space-y-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-normal pl-1 text-muted-foreground uppercase tracking-widest">Jenis Transaksi</Label>
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/50 rounded-xl">
                            <Button
                              variant={formData.type === 'income' ? 'secondary' : 'ghost'}
                              onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                              className={cn("h-9 text-[10px] font-normal gap-2 rounded-lg transition-all", formData.type === 'income' ? "bg-background shadow-sm text-success" : "text-muted-foreground")}
                            >
                              <TrendingUp className="h-3.5 w-3.5" />
                              Pemasukan
                            </Button>
                            <Button
                              variant={formData.type === 'expense' ? 'secondary' : 'ghost'}
                              onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                              className={cn("h-9 text-[10px] font-normal gap-2 rounded-lg transition-all", formData.type === 'expense' ? "bg-background shadow-sm text-destructive" : "text-muted-foreground")}
                            >
                              <TrendingDown className="h-3.5 w-3.5" />
                              Pengeluaran
                            </Button>
                          </div>
                        </div>
    
                          <div className="space-y-2 group">
                            <Label className="text-[10px] font-normal pl-1 text-muted-foreground group-focus-within:text-primary uppercase tracking-widest">Kategori Transaksi *</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                              <SelectTrigger className="h-10 rounded-xl border bg-muted/30 font-normal text-xs">
                                <SelectValue placeholder="Pilih kategori..." />
                              </SelectTrigger>
                              <SelectContent className="bg-card border shadow-xl rounded-xl">
                                {formData.type === 'income' && (
                                  <SelectItem value="Iuran Pokok (Bulanan)" className="text-xs font-normal">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 bg-primary/10 rounded-md flex items-center justify-center">
                                        <CreditCard className="h-3 w-3 text-primary" />
                                      </div>
                                      <span>Iuran Pokok (Bulanan)</span>
                                    </div>
                                  </SelectItem>
                                )}
                                {activeCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name} className="text-xs font-normal">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                                          <FileText className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <span className="font-normal">{cat.name}</span>
                                      </div>
                                      {cat.amount > 0 && <span className="ml-4 opacity-60 font-normal text-[10px]">{formatCurrency(cat.amount)}</span>}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedCategory && selectedCategory.funding_sources && selectedCategory.funding_sources.length > 0 && (
                            <div className="space-y-2 group animate-in slide-in-from-left-2 duration-300">
                              <Label className="text-[10px] font-normal pl-1 text-muted-foreground group-focus-within:text-primary uppercase tracking-widest">Sumber Dana *</Label>
                              <Select value={selectedFundingSource || ''} onValueChange={setSelectedFundingSource}>
                                <SelectTrigger className="h-10 rounded-xl border bg-muted/30 font-normal text-xs">
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
    
                        {isResidentPayment && (
                          <div className="space-y-2 group animate-in slide-in-from-left-2 duration-300">
                            <Label className="text-[10px] font-normal pl-1 text-muted-foreground group-focus-within:text-primary uppercase tracking-widest">Warga Pembayar *</Label>
                            <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                              <SelectTrigger className="h-10 rounded-xl border bg-muted/30 font-normal text-xs">
                                <SelectValue placeholder="Pilih warga pembayar..." />
                              </SelectTrigger>
                              <SelectContent className="bg-card border shadow-xl rounded-xl max-h-[250px]">
                                {activeResidents.map((resident) => (
                                  <SelectItem key={resident.id} value={resident.id} className="text-xs font-normal">
                                    <div className="flex items-center gap-2.5">
                                      <div className="p-1.5 bg-muted rounded-lg text-muted-foreground">{getPropertyTypeIcon(resident.property_type)}</div>
                                      <div className="flex flex-col">
                                        <span className="font-normal text-xs">{resident.name}</span>
                                        <span className="text-[9px] opacity-60 font-normal">{resident.address}</span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
    
                      {/* Right Column: Contextual Details */}
                      <div className="p-5 md:w-[60%] bg-muted/5 space-y-5">
                        <div className="flex flex-col h-full gap-5">
                          {isResidentPayment ? (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                              {(formData.category === 'Iuran Pokok (Bulanan)' || selectedCategory?.period === 'bulanan') && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-normal pl-1 text-muted-foreground uppercase tracking-widest">Tahun & Bulan Iuran</Label>
                                    <Select
                                      value={selectedYear.toString()}
                                      onValueChange={(v) => {
                                        setSelectedYear(parseInt(v));
                                        setSelectedMonths([]);
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-28 rounded-xl border bg-background font-normal text-[10px] shadow-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-card border shadow-xl rounded-xl">
                                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                                          <SelectItem key={year} value={year.toString()} className="text-[10px] font-normal">
                                            Tahun Anggaran {year}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
      
                                  <div className="bg-background rounded-2xl p-4 border border-border/20 shadow-sm">
                                    <MonthPicker
                                      selectedMonths={selectedMonths}
                                      onSelect={setSelectedMonths}
                                      year={selectedYear}
                                      paidMonths={paidMonths}
                                    />
                                  </div>
                                </div>
                              )}
    
                              <div className="space-y-2 group">
                                <Label className="text-[10px] font-normal pl-1 text-muted-foreground group-focus-within:text-primary uppercase tracking-widest">Keterangan / Catatan</Label>
                                <Textarea
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  placeholder="Contoh: Pembayaran iuran keamanan 3 bulan..."
                                  className="rounded-xl border bg-muted/30 font-normal min-h-[80px] text-xs resize-none focus-visible:ring-primary/20"
                                />
                              </div>
    
                              {calculatedAmount > 0 && (
                                <Card className="p-4 bg-success/5 border-success/20 shadow-md animate-in zoom-in-95 duration-300 border-l-4 border-l-success">
                                  <div className="flex justify-between items-center">
                                    <div className="space-y-0.5">
                                      <p className="text-[9px] font-normal text-success uppercase tracking-[0.2em]">Ringkasan Total</p>
                                      <p className="text-[11px] text-muted-foreground font-normal opacity-80">
                                        {(formData.category === 'Iuran Pokok (Bulanan)' || selectedCategory?.period === 'bulanan')
                                          ? `${selectedMonths.length} Bulan × ${formatCurrency(monthlyFee)}`
                                          : selectedCategory?.name}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-normal text-success tracking-tighter">
                                        {formatCurrency(calculatedAmount)}
                                      </p>
                                    </div>
                                  </div>
                                </Card>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                              <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2 group">
                                  <Label className="text-[10px] font-normal pl-1 text-muted-foreground group-focus-within:text-primary uppercase tracking-widest">Jumlah Transaksi (IDR) *</Label>
                                  <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-normal pointer-events-none">Rp</div>
                                    <Input
                                      type="text"
                                      value={formData.amount}
                                      onChange={handleAmountChange}
                                      className="h-11 pl-10 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 text-lg font-normal tracking-tight"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
    
                                <div className="space-y-2 group">
                                  <Label className="text-[10px] font-normal pl-1 text-muted-foreground group-focus-within:text-primary uppercase tracking-widest">Keterangan / Deskripsi *</Label>
                                  <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Jelaskan rincian transaksi ini..."
                                    className="rounded-xl border bg-muted/30 font-normal min-h-[100px] text-xs resize-none focus-visible:ring-primary/20"
                                  />
                                </div>
                              </div>
    
                              {formData.type === 'expense' && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                  <Label className="text-[10px] font-normal pl-1 text-muted-foreground uppercase tracking-widest">Lampiran Bukti / Nota</Label>
                                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                  {imagePreview ? (
                                    <div className="relative w-full rounded-2xl overflow-hidden border border-border/20 shadow-lg aspect-[16/9] bg-muted/20 group">
                                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 gap-2 font-normal text-[10px] rounded-lg">
                                          <ImageIcon className="h-3.5 w-3.5" /> Ganti Foto
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={clearImage} className="h-8 gap-2 font-normal text-[10px] rounded-lg">
                                          <X className="h-3.5 w-3.5" /> Hapus
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onDragOver={handleDragOver}
                                      onDragLeave={handleDragLeave}
                                      onDrop={handleDrop}
                                      onClick={() => fileInputRef.current?.click()}
                                      className={cn(
                                        "w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
                                        isDragging ? "border-primary bg-primary/5 shadow-inner" : "border-border/40 bg-muted/10 hover:border-primary/30 hover:bg-muted/20 hover:shadow-sm"
                                      )}
                                    >
                                      <div className="p-3 bg-background rounded-2xl shadow-sm text-muted-foreground group-hover:text-primary transition-colors">
                                        <ImageIcon className="h-5 w-5" />
                                      </div>
                                      <div className="text-center">
                                        <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Klik atau Seret Bukti Foto</p>
                                        <p className="text-[8px] text-muted-foreground/40 mt-1 font-normal">Maksimal 5MB (JPG, PNG)</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {formData.type === 'income' && (
                                <>
                                  {selectedCategory?.period === 'bulanan' ? (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-[10px] font-normal pl-1 text-muted-foreground uppercase tracking-widest">Tahun & Bulan Pemasukan</Label>
                                          <Select
                                            value={selectedYear.toString()}
                                            onValueChange={(v) => {
                                              setSelectedYear(parseInt(v));
                                              setSelectedMonths([]);
                                            }}
                                          >
                                            <SelectTrigger className="h-8 w-28 rounded-xl border bg-background font-normal text-[10px] shadow-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border shadow-xl rounded-xl">
                                              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                                                <SelectItem key={year} value={year.toString()} className="text-[10px] font-normal">
                                                  Tahun Anggaran {year}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="bg-background rounded-2xl p-4 border border-border/20 shadow-sm">
                                          <MonthPicker
                                            selectedMonths={selectedMonths}
                                            onSelect={setSelectedMonths}
                                            year={selectedYear}
                                            paidMonths={[]}
                                          />
                                        </div>
                                      </div>

                                      {calculatedAmount > 0 && (
                                        <Card className="p-4 bg-success/5 border-success/20 shadow-md animate-in zoom-in-95 duration-300 border-l-4 border-l-success">
                                          <div className="flex justify-between items-center">
                                            <div className="space-y-0.5">
                                              <p className="text-[9px] font-normal text-success uppercase tracking-[0.2em]">Ringkasan Total</p>
                                              <p className="text-[11px] text-muted-foreground font-normal opacity-80">
                                                {selectedMonths.length} Bulan × {formatCurrency(selectedCategory?.amount || 0)}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-2xl font-normal text-success tracking-tighter">
                                                {formatCurrency(calculatedAmount)}
                                              </p>
                                            </div>
                                          </div>
                                        </Card>
                                      )}

                                      <div className="space-y-2 group">
                                        <Label className="text-[10px] font-normal pl-1 text-muted-foreground group-focus-within:text-primary uppercase tracking-widest">Keterangan / Deskripsi *</Label>
                                        <Textarea
                                          value={formData.description}
                                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                          placeholder="Jelaskan rincian pemasukan ini..."
                                          className="rounded-xl border bg-muted/30 font-normal min-h-[100px] text-xs resize-none focus-visible:ring-primary/20"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-2xl border-border/20 bg-muted/5 opacity-40">
                                      <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
                                        <TrendingUp className="h-6 w-6 text-success" />
                                      </div>
                                      <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Pemasukan Non-Iuran</p>
                                      <p className="text-[9px] text-muted-foreground/60 mt-2 max-w-[200px] leading-relaxed">Gunakan kategori ini untuk donasi atau pemasukan lain di luar iuran bulanan warga.</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
    
                    <DialogFooter className="p-3 flex justify-between items-center border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 px-4 rounded-xl font-normal text-[10px] uppercase tracking-wider">
                      Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || isUploading} className="h-9 px-8 rounded-xl bg-primary text-white font-normal text-[10px] uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-primary/10">
                      {isSubmitting || isUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : editingTransaction ? (
                        'Simpan Perubahan'
                      ) : (
                        'Catat Transaksi'
                      )}
                    </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>

          {/* Standardized Image Viewer Dialog */}
          <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-card rounded-2xl">
              <div className="p-4 flex items-center justify-between border-b border-border/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-normal">Bukti Transaksi</DialogTitle>
                    <p className="text-[10px] text-muted-foreground font-normal mt-1">Financial Audit System</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsImageDialogOpen(false)} className="rounded-full h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative flex items-center justify-center p-6 bg-black/5 min-h-[400px]">
                {selectedImageUrl ? (
                  <img src={selectedImageUrl} alt="Bukti Transaksi" className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform hover:scale-[1.01] duration-500" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground/40">
                    <ImageIcon className="h-16 w-16" />
                    <p className="text-sm font-normal">Gambar tidak tersedia</p>
                  </div>
                )}
                </div>
                <div className="p-5 flex justify-between items-center border-t border-border/10 bg-muted/10">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-[10px] font-normal">Sistem Audit Terverifikasi</p>
                  </div>
                  <Button onClick={() => setIsImageDialogOpen(false)} className="h-10 px-8 rounded-xl font-normal text-xs shadow-sm">
                    Tutup Preview
                  </Button>
                </div>
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
        </div>
      </Layout>
    );
  }
