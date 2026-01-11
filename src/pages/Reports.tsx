import { useMemo, useState, Fragment } from 'react';
import { Calendar, Users, TrendingUp, TrendingDown, Wallet, Loader2, ChevronDown, ChevronRight, CheckCircle2, XCircle, Receipt, FileText, Home, AlertCircle, ImageIcon, Search, X, Target } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { useResidents } from '@/hooks/useResidents';
import { usePayments } from '@/hooks/usePayments';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Reports() {
  const { residents, isLoading: residentsLoading } = useResidents();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { fees, isLoading: settingsLoading } = useSettings();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [expandedResidents, setExpandedResidents] = useState<Set<string>>(new Set());

  const isLoading = residentsLoading || paymentsLoading || transactionsLoading || settingsLoading;
  const activeResidents = residents.filter((r) => r.status === 'active');

  const openImageDialog = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageDialogOpen(true);
  };

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

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  const summary = useMemo(() => {
    let periodPayments = payments;
    let periodTransactions = transactions;

    if (selectedMonth !== 'all') {
      const monthKey = `${selectedMonth} ${selectedYear}`;
      periodPayments = payments.filter((p) => p.months.some((m) => m === monthKey));
      periodTransactions = transactions.filter((t) => {
        const date = new Date(t.transaction_date);
        return (
          date.getFullYear() === selectedYear &&
          MONTHS[date.getMonth()] === selectedMonth
        );
      });
    } else {
      periodPayments = payments.filter((p) =>
        p.months.some((m) => m.includes(selectedYear.toString()))
      );
      periodTransactions = transactions.filter((t) => {
        const date = new Date(t.transaction_date);
        return date.getFullYear() === selectedYear;
      });
    }

    const paymentIncome = periodPayments.reduce((sum, p) => {
      if (selectedMonth !== 'all') {
        const monthKey = `${selectedMonth} ${selectedYear}`;
        const monthsInPayment = p.months.filter(m => m === monthKey).length;
        return sum + (Number(p.amount) / p.months.length) * monthsInPayment;
      }
      const monthsInYear = p.months.filter(m => m.includes(selectedYear.toString())).length;
      return sum + (Number(p.amount) / p.months.length) * monthsInYear;
    }, 0);

    const membershipCategories = ['Iuran Bulanan', 'Iuran Warga'];
    
    const otherIncome = periodTransactions
      .filter((t) => t.type === 'income' && !membershipCategories.includes(t.category))
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const totalExpense = periodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const selectedMonthIndex = selectedMonth === 'all' ? 11 : MONTHS.indexOf(selectedMonth);
    
    const allTimeIncome = transactions
      .filter((t) => {
        const date = new Date(t.transaction_date);
        return t.type === 'income' && (
          date.getFullYear() < selectedYear || 
          (date.getFullYear() === selectedYear && date.getMonth() <= selectedMonthIndex)
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeExpense = transactions
      .filter((t) => {
        const date = new Date(t.transaction_date);
        return t.type === 'expense' && (
          date.getFullYear() < selectedYear || 
          (date.getFullYear() === selectedYear && date.getMonth() <= selectedMonthIndex)
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const saldoAkhir = allTimeIncome - allTimeExpense;

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    
    const monthlyTarget = activeResidents.reduce((sum, r) => {
      const propType = (r as any).property_type || 'occupied';
      return sum + (fees[propType as keyof typeof fees] || fees.occupied);
    }, 0);

    let paymentTarget = 0;
    if (selectedMonth !== 'all') {
      paymentTarget = monthlyTarget;
    } else {
      const monthsInTarget = selectedYear === currentYear 
        ? currentMonthIndex + 1 
        : 12;
      paymentTarget = monthlyTarget * monthsInTarget;
    }

    const paymentUnpaid = Math.max(0, paymentTarget - paymentIncome);

    return {
      paymentIncome,
      otherIncome,
      totalIncome: paymentIncome + otherIncome,
      totalExpense,
      balance: saldoAkhir,
      periodNet: paymentIncome + otherIncome - totalExpense,
      paymentCount: periodPayments.length,
      incomeTransactions: periodTransactions.filter((t) => t.type === 'income'),
      expenseTransactions: periodTransactions.filter((t) => t.type === 'expense'),
      paymentSummary: {
        target: paymentTarget,
        realization: paymentIncome,
        unpaid: paymentUnpaid,
      }
    };
  }, [payments, transactions, selectedYear, selectedMonth, activeResidents, fees]);

  const monthlyPaymentStatus = useMemo(() => {
    return MONTHS.map((month) => {
      const monthKey = `${month} ${selectedYear}`;
      
      const paidResidentIds = new Set(
        payments
          .filter((p) => p.months.includes(monthKey))
          .map((p) => p.resident_id)
      );
      
      const paidResidents = activeResidents.filter((r) => paidResidentIds.has(r.id));
      const unpaidResidents = activeResidents.filter((r) => !paidResidentIds.has(r.id));
      
      const paidResidentsWithAmount = paidResidents.map((r) => {
        const payment = payments.find(
          (p) => p.resident_id === r.id && p.months.includes(monthKey)
        );
        return {
          ...r,
          amountPaid: payment ? Number(payment.amount) / payment.months.length : 0,
          paymentDate: payment?.created_at || null,
        };
      });
      
      const expected = activeResidents.reduce((sum, r) => {
        const propType = (r as any).property_type || 'occupied';
        return sum + (fees[propType as keyof typeof fees] || fees.occupied);
      }, 0);
      
      const collected = payments
        .filter((p) => p.months.includes(monthKey))
        .reduce((sum, p) => sum + Number(p.amount) / p.months.length, 0);

      return {
        month,
        monthKey,
        paid: paidResidents.length,
        unpaid: unpaidResidents.length,
        paidResidents: paidResidentsWithAmount,
        unpaidResidents,
        collected,
        expected,
        percentage: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      };
    });
  }, [payments, activeResidents, selectedYear, fees]);

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
                <h1 className="text-sm font-normal text-foreground tracking-tight capitalize">Laporan Keuangan</h1>
                <p className="text-sm font-normal text-muted-foreground mt-2 opacity-60 capitalize">Reporting Center RT Transparan</p>
              </div>
          </div>

        {/* Filters */}
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="h-10 w-full sm:w-28 font-normal rounded-xl border bg-muted/30 focus:ring-1 ring-primary/20 text-sm capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border shadow-2xl">
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-sm font-normal capitalize">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-10 w-full sm:w-44 font-normal rounded-xl border bg-muted/30 focus:ring-1 ring-primary/20 text-sm capitalize">
                      <SelectValue placeholder="Semua Bulan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border shadow-2xl">
                      <SelectItem value="all" className="text-sm font-normal capitalize">Semua Bulan</SelectItem>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month} className="text-sm font-normal capitalize">{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Iuran Cards */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="p-1.5 bg-primary/10 rounded-xl">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
              <h2 className="text-sm font-normal text-foreground capitalize tracking-widest">Iuran Bulanan Periode Ini</h2>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    name: 'Target Pemasukan', 
                    amount: summary.paymentSummary?.target || 0, 
                    color: 'bg-primary/60',
                    lightColor: 'bg-primary/5',
                    textColor: 'text-primary',
                    borderColor: 'border-primary/20',
                    icon: <Target className="h-4 w-4" />
                  },
                  { 
                    name: 'Realisasi Pemasukan', 
                    amount: summary.paymentSummary?.realization || 0, 
                    color: 'bg-success',
                    lightColor: 'bg-success/5',
                    textColor: 'text-success',
                    borderColor: 'border-success/20',
                    icon: <TrendingUp className="h-4 w-4" />
                  },
                  { 
                    name: 'Kekurangan Pembayaran', 
                    amount: summary.paymentSummary?.unpaid || 0, 
                    color: 'bg-destructive',
                    lightColor: 'bg-destructive/5',
                    textColor: 'text-destructive',
                    borderColor: 'border-destructive/20',
                    icon: <AlertCircle className="h-4 w-4" />
                  },
                ].map((item) => (
                  <Card key={item.name} className={cn("rounded-xl border shadow-sm transition-all hover:shadow-md", item.lightColor, item.borderColor)}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-xl text-white shadow-sm", item.color)}>
                          {item.icon}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm text-muted-foreground capitalize tracking-widest font-normal">{item.name}</p>
                          <p className={cn("text-2xl font-bold mt-1", item.textColor)} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{formatCurrency(item.amount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
          </div>

          {/* Kas & Saldo */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="p-1.5 bg-primary/10 rounded-xl">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-normal text-foreground capitalize tracking-widest">Kas & Saldo Kas RT</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Iuran Masuk', value: summary.paymentIncome, icon: <TrendingUp className="h-5 w-5" />, color: 'primary' },
                { label: 'Pemasukan Lain', value: summary.otherIncome, icon: <TrendingUp className="h-5 w-5" />, color: 'success' },
                { label: 'Pengeluaran', value: summary.totalExpense, icon: <TrendingDown className="h-5 w-5" />, color: 'destructive' },
                { label: 'Total Saldo Saat Ini', value: summary.balance, icon: <Wallet className="h-5 w-5" />, color: summary.balance >= 0 ? 'success' : 'destructive' }
              ].map((item) => (
                <Card key={item.label} className="rounded-xl border shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl", item.color === 'primary' ? 'bg-primary/10 text-primary' : item.color === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-normal capitalize tracking-tight">{item.label}</p>
                      <p className="text-base font-bold text-foreground mt-0.5" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{formatCurrency(item.value)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Details Tabs */}
          <Tabs defaultValue="transactions" className="space-y-8">
            <div className="bg-muted/50 p-1.5 rounded-xl w-full max-w-2xl mx-auto">
              <TabsList className="grid grid-cols-3 w-full h-11 bg-transparent p-0 gap-1">
                <TabsTrigger value="transactions" className="rounded-lg font-normal text-sm capitalize tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Transaksi</span>
                </TabsTrigger>
                <TabsTrigger value="residents-list" className="rounded-lg font-normal text-sm capitalize tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Warga</span>
                </TabsTrigger>
                <TabsTrigger value="monthly-status" className="rounded-lg font-normal text-sm capitalize tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulanan</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="transactions" className="space-y-8 animate-fade-in">
              <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="p-5 border-b bg-success/5">
                  <CardTitle className="text-sm font-normal flex items-center gap-2 text-success capitalize tracking-widest">
                    <TrendingUp className="h-4 w-4" />
                    Detail Pemasukan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="w-12 text-center text-sm font-normal capitalize pl-6 tracking-widest">No</TableHead>
                          <TableHead className="text-sm font-normal capitalize tracking-widest">Tanggal</TableHead>
                          <TableHead className="text-sm font-normal capitalize tracking-widest">Keterangan</TableHead>
                          <TableHead className="text-right text-sm font-normal capitalize pr-6 tracking-widest">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {summary.incomeTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground/40 font-normal capitalize text-sm tracking-widest"></TableCell>
                            </TableRow>
                          ) : (
                            summary.incomeTransactions.map((t, index) => (
                              <TableRow key={t.id} className="hover:bg-muted/10 transition-colors">
                                <TableCell className="text-center text-sm font-bold text-muted-foreground/40 pl-6">{index + 1}</TableCell>
                                <TableCell className="text-sm font-bold">{formatDate(t.transaction_date)}</TableCell>
                                <TableCell className="text-sm font-medium">
                                  <div className="flex flex-col">
                                    <span className="capitalize">{t.description}</span>
                                    {t.funding_source && (
                                      <span className="text-sm text-muted-foreground font-normal italic capitalize">Sumber: {t.funding_source}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-success text-sm pr-6">+{formatCurrency(Number(t.amount))}</TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="p-5 border-b bg-destructive/5">
                  <CardTitle className="text-sm font-normal flex items-center gap-2 text-destructive capitalize tracking-widest">
                    <TrendingDown className="h-4 w-4" />
                    Detail Pengeluaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="w-12 text-center text-sm font-normal capitalize pl-6 tracking-widest">No</TableHead>
                          <TableHead className="text-sm font-normal capitalize tracking-widest">Tanggal</TableHead>
                          <TableHead className="text-sm font-normal capitalize tracking-widest">Keterangan</TableHead>
                          <TableHead className="text-right text-sm font-normal capitalize tracking-widest">Jumlah</TableHead>
                          <TableHead className="text-center w-24 text-sm font-normal capitalize pr-6 tracking-widest">Bukti</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {summary.expenseTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground/40 font-normal capitalize text-sm tracking-widest"></TableCell>
                            </TableRow>
                          ) : (
                          summary.expenseTransactions.map((t, index) => (
                            <TableRow key={t.id} className="hover:bg-muted/10 transition-colors">
                              <TableCell className="text-center text-sm font-bold text-muted-foreground/40 pl-6">{index + 1}</TableCell>
                              <TableCell className="text-sm font-bold">{formatDate(t.transaction_date)}</TableCell>
                              <TableCell className="text-sm font-medium capitalize">{t.description}</TableCell>
                              <TableCell className="text-right font-bold text-destructive text-sm">-{formatCurrency(Number(t.amount))}</TableCell>
                              <TableCell className="text-center pr-6">
                                {t.image_url ? (
                                  <button onClick={() => openImageDialog(t.image_url!)} className="w-10 h-10 rounded-xl border border-border/40 overflow-hidden mx-auto shadow-sm">
                                    <img src={t.image_url} alt="Bukti" className="w-full h-full object-cover" />
                                  </button>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl border border-dashed border-border/30 flex items-center justify-center mx-auto bg-muted/10 text-muted-foreground/20">
                                    <ImageIcon className="h-4 w-4" />
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="residents-list" className="animate-fade-in">
              <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="w-16 text-center text-sm font-normal capitalize pl-6 tracking-widest">No</TableHead>
                          <TableHead className="text-sm font-normal capitalize tracking-widest">Nama Warga</TableHead>
                          <TableHead className="text-sm font-normal capitalize hidden md:table-cell tracking-widest">Alamat</TableHead>
                          <TableHead className="text-center text-sm font-normal capitalize tracking-widest">Status</TableHead>
                          <TableHead className="text-right text-sm font-normal capitalize pr-6 tracking-widest">Terkumpul</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeResidents.map((resident, index) => {
                          const isExpanded = expandedResidents.has(resident.id);
                          const residentPayments = payments.filter(p => p.resident_id === resident.id);
                          const totalPaid = residentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                          
                          return (
                            <Fragment key={resident.id}>
                              <TableRow 
                                className={cn("hover:bg-muted/10 transition-all cursor-pointer", isExpanded && "bg-muted/15")}
                                onClick={() => toggleResident(resident.id)}
                              >
                                <TableCell className="text-center text-sm font-bold pl-6">
                                  <div className="flex items-center justify-center gap-2">
                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    {index + 1}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm font-bold capitalize">{resident.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground font-medium hidden md:table-cell capitalize">{resident.address}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-primary/10 text-primary border-none text-sm font-normal capitalize tracking-widest px-3 rounded-lg">Active</Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm font-bold pr-6" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{formatCurrency(totalPaid)}</TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow className="bg-muted/5 border-b border-border/10">
                                  <TableCell colSpan={5} className="p-6">
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                      <h4 className="text-sm font-normal capitalize tracking-widest text-primary mb-4 flex items-center gap-2">
                                        <Receipt className="h-3 w-3" /> Riwayat Pembayaran Iuran
                                      </h4>
                                      <div className="rounded-xl border bg-background overflow-hidden">
                                        <Table>
                                          <TableHeader className="bg-muted/30">
                                            <TableRow>
                                              <TableHead className="text-sm font-normal capitalize tracking-wider">Bulan & Tahun</TableHead>
                                              <TableHead className="text-sm font-normal capitalize tracking-wider">Tanggal Bayar</TableHead>
                                              <TableHead className="text-right text-sm font-normal capitalize tracking-wider">Jumlah</TableHead>
                                              <TableHead className="text-center text-sm font-normal capitalize tracking-wider">Metode</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {residentPayments.length === 0 ? (
                                              <TableRow>
                                                <TableCell colSpan={4} className="h-20 text-center text-muted-foreground/30 text-sm font-normal capitalize">Belum ada riwayat pembayaran</TableCell>
                                              </TableRow>
                                            ) : (
                                              residentPayments.map((p) => (
                                                <TableRow key={p.id} className="hover:bg-muted/5">
                                                  <TableCell className="text-sm font-medium capitalize">{p.months.join(', ')}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                                                  <TableCell className="text-right text-sm font-bold text-success">{formatCurrency(Number(p.amount))}</TableCell>
                                                  <TableCell className="text-center">
                                                    <Badge variant="outline" className="text-sm font-normal capitalize tracking-tighter rounded-md py-0">{p.payment_method}</Badge>
                                                  </TableCell>
                                                </TableRow>
                                              ))
                                            )}
                                          </TableBody>
                                        </Table>
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
                </CardContent>
              </Card>
            </TabsContent>

              <TabsContent value="monthly-status" className="animate-fade-in">
                <Card className="rounded-xl border shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="max-h-[320px] overflow-y-auto overflow-x-auto custom-scrollbar">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                          <TableRow className="bg-muted/20">
                            <TableHead className="w-16 text-center text-sm font-normal capitalize pl-6 tracking-widest">No</TableHead>
                            <TableHead className="text-sm font-normal capitalize tracking-widest">Periode Bulan</TableHead>
                            <TableHead className="text-right text-sm font-normal capitalize tracking-widest">Koleksi (IDR)</TableHead>
                            <TableHead className="text-center text-sm font-normal capitalize tracking-widest">Status Bayar</TableHead>
                            <TableHead className="w-48 text-center text-sm font-normal capitalize tracking-widest">Progress</TableHead>
                            <TableHead className="text-right text-sm font-normal capitalize pr-6 tracking-widest">Opsi</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {monthlyPaymentStatus.map((status, index) => {
                          const isExpanded = expandedMonths.has(status.month);
                          return (
                            <Fragment key={status.month}>
                              <TableRow 
                                className={cn("hover:bg-muted/10 transition-all cursor-pointer", isExpanded && "bg-muted/15")}
                                onClick={() => toggleMonth(status.month)}
                              >
                                <TableCell className="text-center text-sm font-bold pl-6">
                                  <div className="flex items-center justify-center gap-2">
                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    {index + 1}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm font-normal capitalize tracking-tight">{status.month} {selectedYear}</TableCell>
                                <TableCell className="text-right text-sm font-bold" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{formatCurrency(status.collected)}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    <span className="text-sm font-normal text-success flex items-center gap-1 capitalize"><CheckCircle2 className="h-3 w-3" /> {status.paid}</span>
                                    <span className="text-sm font-normal text-destructive flex items-center gap-1 capitalize"><XCircle className="h-3 w-3" /> {status.unpaid}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-sm font-normal">{status.percentage}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden border border-border/5 shadow-inner">
                                      <div 
                                        className={cn("h-full rounded-full transition-all duration-700", status.percentage >= 80 ? "bg-success" : status.percentage >= 40 ? "bg-amber-500" : "bg-destructive")} 
                                        style={{ width: `${status.percentage}%` }} 
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <Button variant="ghost" size="sm" className="h-8 text-sm font-normal capitalize tracking-widest text-primary hover:bg-primary/5">
                                    {isExpanded ? 'Tutup' : 'Detail'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                                {isExpanded && (
                                  <TableRow className="bg-muted/5 border-b border-border/10">
                                    <TableCell colSpan={6} className="p-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-4">
                                        <h4 className="text-sm font-normal capitalize tracking-widest text-success flex items-center gap-2">
                                          <CheckCircle2 className="h-3 w-3" /> Sudah Bayar ({status.paid})
                                        </h4>
                                        <div className="rounded-xl border bg-background overflow-hidden">
                                          <ScrollArea className="h-[250px]">
                                            <Table>
                                              <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                                <TableRow>
                                                  <TableHead className="text-sm font-normal capitalize tracking-wider">Nama</TableHead>
                                                  <TableHead className="text-sm font-normal capitalize tracking-wider">Tanggal</TableHead>
                                                  <TableHead className="text-right text-sm font-normal capitalize tracking-wider">Jumlah</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {status.paidResidents.length === 0 ? (
                                                  <TableRow>
                                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground/30 text-sm font-normal capitalize">Belum ada pembayaran</TableCell>
                                                  </TableRow>
                                                ) : (
                                                  status.paidResidents.map((r) => (
                                                    <TableRow key={r.id} className="hover:bg-muted/5">
                                                      <TableCell className="text-sm font-medium capitalize">{r.name}</TableCell>
                                                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.paymentDate)}</TableCell>
                                                      <TableCell className="text-right text-sm font-bold text-success">{formatCurrency(r.amountPaid)}</TableCell>
                                                    </TableRow>
                                                  ))
                                                )}
                                              </TableBody>
                                            </Table>
                                          </ScrollArea>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <h4 className="text-sm font-normal capitalize tracking-widest text-destructive flex items-center gap-2">
                                          <XCircle className="h-3 w-3" /> Belum Bayar ({status.unpaid})
                                        </h4>
                                        <div className="rounded-xl border bg-background overflow-hidden">
                                          <ScrollArea className="h-[250px]">
                                            <Table>
                                              <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                                <TableRow>
                                                  <TableHead className="text-sm font-normal capitalize tracking-wider">Nama</TableHead>
                                                  <TableHead className="text-sm font-normal capitalize tracking-wider">Alamat</TableHead>
                                                  <TableHead className="text-right text-sm font-normal capitalize tracking-wider">Estimasi</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {status.unpaidResidents.length === 0 ? (
                                                  <TableRow>
                                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground/30 text-sm font-normal capitalize">Semua sudah lunas</TableCell>
                                                  </TableRow>
                                                ) : (
                                                  status.unpaidResidents.map((r) => {
                                                    const propType = (r as any).property_type || 'occupied';
                                                    const estimate = fees[propType as keyof typeof fees] || fees.occupied;
                                                    return (
                                                      <TableRow key={r.id} className="hover:bg-muted/5">
                                                        <TableCell className="text-sm font-medium capitalize">{r.name}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground capitalize">{r.address}</TableCell>
                                                        <TableCell className="text-right text-sm font-bold text-destructive">{formatCurrency(estimate)}</TableCell>
                                                      </TableRow>
                                                    );
                                                  })
                                                )}
                                              </TableBody>
                                            </Table>
                                          </ScrollArea>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
              <div className="p-4 flex items-center justify-between border-b border-border/10 bg-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary"><ImageIcon className="h-5 w-5" /></div>
                  <div>
                    <DialogTitle className="text-sm font-bold capitalize">Bukti Transaksi</DialogTitle>
                    <p className="text-sm text-muted-foreground font-normal capitalize tracking-widest">Audit System RT Transparan</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsImageDialogOpen(false)} className="rounded-full h-8 w-8"><X className="h-4 w-4" /></Button>
              </div>
              <div className="relative flex items-center justify-center p-6 bg-black/5 min-h-[400px]">
                {selectedImageUrl ? <img src={selectedImageUrl} alt="Bukti" className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" /> : <p className="text-sm font-normal opacity-20 capitalize">Gambar tidak tersedia</p>}
              </div>
              <div className="p-5 flex justify-end border-t border-border/10 bg-muted/10">
                <Button onClick={() => setIsImageDialogOpen(false)} className="h-10 px-8 rounded-xl font-normal text-sm shadow-sm bg-primary text-primary-foreground hover:opacity-90 capitalize">Tutup Preview</Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </Layout>
  );
}
