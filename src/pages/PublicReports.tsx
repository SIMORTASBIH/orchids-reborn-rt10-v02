import { useMemo, useState, Fragment, useCallback } from 'react';
import { Calendar, Users, TrendingUp, TrendingDown, Wallet, Loader2, ChevronDown, ChevronRight, CheckCircle2, XCircle, Receipt, FileText, Home, AlertCircle, LogIn, ImageIcon, X, RefreshCw, Search } from 'lucide-react';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { StatCard } from '@/components/StatCard';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePublicReports } from '@/hooks/usePublicReports';
import { PublicCharts } from '@/components/PublicCharts';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  occupied: 'Berpenghuni',
  empty_house: 'Rumah Kosong',
  empty_land: 'Lahan Kosong'
};

  // Transparansi Keuangan Digital - Update Jan 8
export default function PublicReports() {
  const {
    isLoading,
    feesLoaded,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    summary,
    monthlyPaymentStatus,
    residentsWithBilling,
    activeResidents,
    fees,
    refetch
  } = usePublicReports();

  const currentMonthName = useMemo(() => {
    const monthIdx = new Date().getMonth();
    return MONTHS[monthIdx];
  }, []);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set([currentMonthName]));
  const [expandedResidents, setExpandedResidents] = useState<Set<string>>(new Set());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'belum'>('all');

  const filteredResidents = useMemo(() => {
    let result = residentsWithBilling;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }
    
    if (statusFilter === 'lunas') {
      result = result.filter(r => r.displayBill === 0);
    } else if (statusFilter === 'belum') {
      result = result.filter(r => r.displayBill > 0);
    }
    
    return result;
  }, [residentsWithBilling, searchQuery, statusFilter]);

  const handleRefetch = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

    const toggleMonth = (month: string) => {
      const newExpanded = new Set(expandedMonths);
      if (newExpanded.has(month)) {
        newExpanded.delete(month);
      } else {
        newExpanded.add(month);
      }
      setExpandedMonths(newExpanded);
    };

    const toggleResident = (id: string) => {
      const newExpanded = new Set(expandedResidents);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      setExpandedResidents(newExpanded);
    };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-normal text-muted-foreground animate-pulse">Menyiapkan Laporan Transparan...</p>
        </div>
      </div>
    );
  }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 font-sans">
            <main className="max-w-6xl mx-auto px-4 pt-6">
                  <div className="mb-4 flex flex-col items-center text-center sm:items-start sm:text-left">
                    <h1 className="text-xl font-normal tracking-tight text-foreground flex flex-col sm:flex-row sm:gap-1.5">
                      <span>Laporan Monev Keuangan</span>
                      <span>RT 10/23 Blok N</span>
                    </h1>
                    <p className="text-[9px] font-normal text-muted-foreground mt-1 sm:mt-0 opacity-60">
                      Sistem Transparansi Keuangan Digital
                    </p>
                  </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard
                title="Saldo Kas"
                value={formatCurrency(summary.totalBalance)}
                icon={<Wallet className="h-5 w-5" />}
                variant="default"
                isMesh={true}
              />
                <StatCard
                  title="Total Pemasukan"
                  value={formatCurrency(summary.totalIncome)}
                  icon={<TrendingUp className="h-5 w-5" />}
                  variant="success"
                  isMesh={true}
                />
                <StatCard
                  title="Total Pengeluaran"
                  value={formatCurrency(summary.totalExpense)}
                  icon={<TrendingDown className="h-5 w-5" />}
                  variant="destructive"
                  isMesh={true}
                />
              <StatCard
                title="Tunggakan Berjalan"
                value={formatCurrency(summary.paymentSummary.currentMonthUnpaid || 0)}
                icon={<AlertCircle className="h-5 w-5" />}
                variant="destructive"
                isMesh={true}
              />
            </div>

            {/* Period Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4 bg-card border border-border/40 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs font-normal text-muted-foreground uppercase tracking-widest">Filter Laporan</p>
                        <h4 className="text-base font-normal text-foreground">Periode {selectedMonth === 'all' ? 'Januari - Desember' : selectedMonth} {selectedYear}</h4>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-32">
                        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                            <SelectTrigger className="w-full h-10 bg-muted/30 border-border/50 rounded-xl text-base font-normal shadow-none focus:ring-1 focus:ring-primary/20">
                                <SelectValue placeholder="Pilih Tahun" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/10 shadow-2xl">
                                {Array.from({ length: new Date().getFullYear() - 2026 + 2 }, (_, i) => 2026 + i).map(year => (
                                    <SelectItem key={year} value={year.toString()} className="text-base font-normal">{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-44">
                        <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v)}>
                            <SelectTrigger className="w-full h-10 bg-muted/30 border-border/50 rounded-xl text-base font-normal shadow-none focus:ring-1 focus:ring-primary/20">
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/10 shadow-2xl max-h-[300px] overflow-y-auto">
                                <SelectItem value="all" className="text-base font-medium text-primary bg-primary/5">Semua Bulan</SelectItem>
                                {MONTHS.map(month => (
                                    <SelectItem key={month} value={month} className="text-base font-normal">{month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleRefetch}
                        disabled={isRefreshing}
                        className={cn("h-10 w-10 rounded-xl bg-muted/30 border border-border/50 transition-all hover:bg-primary/10 hover:text-primary", isRefreshing && "animate-spin-slow")}
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
          <Tabs defaultValue="warga" className="space-y-8">
            <div className="flex justify-center -mx-4 px-4 overflow-hidden">
              <TabsList className="bg-muted/50 p-1.5 rounded-xl h-auto gap-1 border border-border/50 shadow-sm w-full sm:w-auto grid grid-cols-4 sm:flex sm:justify-center">
                <TabsTrigger value="warga" className="rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-base font-normal data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all whitespace-nowrap gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Daftar Warga</span>
                </TabsTrigger>
                <TabsTrigger value="transaksi" className="rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-base font-normal data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all whitespace-nowrap gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Riwayat Transaksi</span>
                </TabsTrigger>
                <TabsTrigger value="bulan" className="rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-base font-normal data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all whitespace-nowrap gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Laporan Bulanan</span>
                </TabsTrigger>
                <TabsTrigger value="grafik" className="rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-base font-normal data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all whitespace-nowrap gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Visualisasi</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="warga" className="animate-fade-in space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari nama warga atau nomor rumah..." 
                    className="pl-11 h-12 bg-card border-border/50 rounded-xl focus:ring-primary/20 shadow-sm text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                  <Select value={statusFilter} onValueChange={(v: 'all' | 'lunas' | 'belum') => setStatusFilter(v)}>
                  <SelectTrigger className="w-full md:w-[200px] h-12 bg-card border-border/50 rounded-xl shadow-sm font-normal text-base">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/10 shadow-2xl">
                    <SelectItem value="all" className="text-base">Semua Status</SelectItem>
                    <SelectItem value="lunas" className="text-base">Sudah Lunas</SelectItem>
                    <SelectItem value="belum" className="text-base">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="emerald-card overflow-hidden border-border/40 shadow-sm">
                    <ScrollIndicator maxHeight="350px">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                          <TableRow className="bg-muted/30 border-b-border/30">
                            <TableHead className="w-12 sm:w-16 text-center text-xs font-bold uppercase tracking-wider pl-4 sm:pl-6">No</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">Nama Warga</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider hidden md:table-cell">Tipe Properti</TableHead>
                            <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Status</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider pr-4 sm:pr-6 whitespace-nowrap hidden sm:table-cell">Tunggakan</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                      {filteredResidents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-base text-muted-foreground italic">
                            Tidak ada data warga ditemukan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResidents.map((resident, index) => {
                          const isExpanded = expandedResidents.has(resident.id);
                          return (
                            <Fragment key={resident.id}>
                              <TableRow 
                                className={cn("hover:bg-muted/10 transition-all cursor-pointer group border-b-border/10", isExpanded && "bg-muted/15")}
                                onClick={() => toggleResident(resident.id)}
                              >
                                <TableCell className="text-center pl-4 sm:pl-6 text-xs sm:text-base font-bold text-muted-foreground/40">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    {isExpanded ? <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-primary" /> : <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
                                    {index + 1}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 sm:py-4">
                                  <div className="flex flex-col">
                                    <span className="font-normal text-base text-foreground whitespace-nowrap">{resident.name}</span>
                                    <span className="text-xs font-normal text-muted-foreground md:hidden">{PROPERTY_TYPE_LABELS[resident.property_type]}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <span className="text-base font-normal text-muted-foreground">{PROPERTY_TYPE_LABELS[resident.property_type]}</span>
                                </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={resident.displayBill > 0 ? "destructive" : "success"} className="rounded-lg px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-normal uppercase tracking-widest shadow-sm">
                                      {resident.displayStatus}
                                    </Badge>
                                  </TableCell>
                                    <TableCell className="text-right pr-4 sm:pr-6 hidden sm:table-cell">
                                      <span className={cn("text-base font-normal whitespace-nowrap", resident.displayBill > 0 ? "text-destructive" : "text-success")}>
                                        {formatCurrency(resident.displayBill)}
                                      </span>
                                    </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow className="bg-muted/5 border-b border-border/10">
                                  <TableCell colSpan={5} className="p-3 sm:p-6">
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-2 sm:space-y-3">
                                          <h4 className="text-xs font-normal uppercase tracking-widest text-primary flex items-center gap-2">
                                            <AlertCircle className="h-3 w-3" /> Informasi Tunggakan
                                          </h4>
                                          <div className="p-3 sm:p-4 bg-background rounded-xl border border-border/30 flex items-center justify-between shadow-sm">
                                            <div>
                                              <p className="text-xs font-normal text-muted-foreground uppercase">Total Tagihan</p>
                                              <p className="text-base sm:text-lg font-normal text-destructive">{formatCurrency(resident.totalBill)}</p>
                                            </div>
                                            <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 text-xs font-normal uppercase">
                                              {resident.unpaidMonths.length} Bulan
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="space-y-2 sm:space-y-3">
                                          <h4 className="text-xs font-normal uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Receipt className="h-3 w-3" /> Daftar Bulan Tertunggak
                                          </h4>
                                          <div className="p-3 sm:p-4 bg-background/50 rounded-xl border border-border/20">
                                            {resident.unpaidMonths.length > 0 ? (
                                              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                                {resident.unpaidMonths.map((m) => (
                                                  <Badge key={m} variant="outline" className="text-[10px] sm:text-xs font-normal py-1 px-2 bg-destructive/5 text-destructive border-destructive/10">
                                                    {m}
                                                  </Badge>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs sm:text-sm text-success font-normal">Tidak ada tunggakan pembayaran.</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                      </TableBody>
                    </Table>
                  </ScrollIndicator>
                </div>
              </TabsContent>

          <TabsContent value="transaksi" className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pemasukan Column */}
                <div className="emerald-card overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-border/30 bg-success/5 shrink-0">
                      <h3 className="text-base font-normal text-success flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Riwayat Pemasukan
                      </h3>
                    </div>
                    <ScrollIndicator maxHeight="320px">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent border-border/20">
                          <TableHead className="text-xs font-normal uppercase tracking-widest px-4 py-3 bg-background">Tanggal</TableHead>
                          <TableHead className="text-xs font-normal uppercase tracking-widest px-4 py-3 bg-background">Deskripsi</TableHead>
                          <TableHead className="text-xs font-normal uppercase tracking-widest px-4 py-3 text-right bg-background">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {summary.incomeTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground italic">
                            </TableCell>
                          </TableRow>
                      ) : (
                        summary.incomeTransactions.map((t) => (
                          <TableRow key={t.id} className="hover:bg-muted/30 transition-colors border-border/10">
                            <TableCell className="px-4 py-3 text-sm sm:text-base font-normal">
                              {new Date(t.transaction_date || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <p className="text-sm sm:text-base font-normal leading-tight">{t.description}</p>
                              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">{t.category}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm sm:text-base font-normal text-success">
                              {formatCurrency(Number(t.amount))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      </TableBody>
                    </Table>
                  </ScrollIndicator>
                </div>

                {/* Pengeluaran Column */}
                  <div className="emerald-card overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border/30 bg-destructive/5 shrink-0">
                      <h3 className="text-base font-normal text-destructive flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Riwayat Pengeluaran
                      </h3>
                    </div>
                    <ScrollIndicator maxHeight="320px">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent border-border/20">
                          <TableHead className="text-xs font-normal uppercase tracking-widest px-4 py-3 bg-background">Tanggal</TableHead>
                          <TableHead className="text-xs font-normal uppercase tracking-widest px-4 py-3 bg-background">Deskripsi</TableHead>
                          <TableHead className="text-xs font-normal uppercase tracking-widest px-4 py-3 bg-background">Bukti</TableHead>
                          <TableHead className="text-xs font-normal uppercase tracking-widest px-4 py-3 text-right bg-background">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.expenseTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground italic">
                              </TableCell>
                            </TableRow>
                        ) : (
                            summary.expenseTransactions.map((t) => (
                              <TableRow key={t.id} className="hover:bg-muted/30 transition-colors border-border/10">
                                <TableCell className="px-4 py-3 text-sm sm:text-base font-normal">
                                  {new Date(t.transaction_date || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <div>
                                    <p className="text-sm sm:text-base font-normal leading-tight">{t.description}</p>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">{t.category}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  {t.image_url ? (
                                    <div 
                                      className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 cursor-pointer border border-border/50 hover:border-primary/50 transition-colors shadow-sm group/img relative"
                                      onClick={() => {
                                        setSelectedImageUrl(t.image_url);
                                        setIsImageDialogOpen(true);
                                      }}
                                    >
                                      <img src={t.image_url} alt="Proof" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <Search className="h-3 w-3 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground italic">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right text-sm sm:text-base font-normal text-destructive">
                                  {formatCurrency(Number(t.amount))}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                  </ScrollIndicator>
                </div>
              </div>
            </TabsContent>

                  <TabsContent value="bulan" className="animate-fade-in space-y-6">
                    <div className="emerald-card overflow-hidden border-border/40 shadow-sm">
                      <ScrollIndicator maxHeight="320px">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                          <TableRow className="bg-muted/30 border-b-border/30">
                            <TableHead className="w-12 sm:w-16 text-center text-xs font-bold uppercase tracking-wider pl-4 sm:pl-6">No</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">Periode Bulan</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">Koleksi (IDR)</TableHead>
                            <TableHead className="text-center text-xs font-bold uppercase tracking-wider hidden md:table-cell">Status Bayar</TableHead>
                            <TableHead className="w-32 sm:w-48 text-center text-xs font-bold uppercase tracking-wider pr-4 sm:pr-6">Progress</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {monthlyPaymentStatus.map((status, index) => {
                          const isExpanded = expandedMonths.has(status.month);
                          return (
                            <Fragment key={status.month}>
                              <TableRow 
                                className={cn("hover:bg-muted/10 transition-all cursor-pointer group border-b-border/10", isExpanded && "bg-muted/15")}
                                onClick={() => toggleMonth(status.month)}
                              >
                                <TableCell className="text-center pl-4 sm:pl-6 text-xs sm:text-base font-bold text-muted-foreground/40">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    {isExpanded ? <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-primary" /> : <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
                                    {index + 1}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 sm:py-4">
                                  <div className="flex flex-col">
                                    <span className="text-xs sm:text-base font-normal text-foreground uppercase tracking-tight whitespace-nowrap">{status.month} {selectedYear}</span>
                                    <div className="flex items-center gap-2 mt-1 md:hidden">
                                      <span className="text-xs font-normal text-success flex items-center gap-0.5"><CheckCircle2 className="h-2 w-2" /> {status.paid}</span>
                                      <span className="text-xs font-normal text-destructive flex items-center gap-0.5"><XCircle className="h-2 w-2" /> {status.unpaid}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-xs sm:text-base font-normal text-foreground whitespace-nowrap">{formatCurrency(status.collected)}</span>
                                </TableCell>
                                <TableCell className="text-center hidden md:table-cell">
                                  <div className="flex items-center justify-center gap-3">
                                    <span className="text-xs sm:text-base font-normal text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" /> {status.paid}</span>
                                    <span className="text-xs sm:text-base font-normal text-destructive flex items-center gap-1"><XCircle className="h-3 w-3 sm:h-4 sm:w-4" /> {status.unpaid}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="pr-4 sm:pr-6">
                                  <div className="space-y-1 sm:space-y-1.5 max-w-[100px] sm:max-w-[150px] ml-auto">
                                    <div className="flex justify-between items-center px-0.5 sm:px-1">
                                      <span className="text-xs sm:text-base font-normal">{status.percentage}%</span>
                                    </div>
                                    <div className="h-1 sm:h-1.5 w-full bg-muted/40 rounded-full overflow-hidden border border-border/5 shadow-inner">
                                      <div 
                                        className={cn("h-full rounded-full transition-all duration-700", status.percentage >= 80 ? "bg-success" : status.percentage >= 40 ? "bg-amber-500" : "bg-destructive")} 
                                        style={{ width: `${status.percentage}%` }} 
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                               {isExpanded && (
                                 <TableRow className="bg-muted/5 border-b border-border/10">
                                   <TableCell colSpan={5} className="p-3 sm:p-6">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                       <div className="space-y-3 sm:space-y-4">
                                         <h4 className="text-xs font-normal uppercase tracking-widest text-success flex items-center gap-2">
                                           <CheckCircle2 className="h-3 w-3" /> Sudah Bayar ({status.paid})
                                         </h4>
                                         <div className="rounded-xl border bg-background overflow-hidden shadow-sm">
                                           <div className="max-h-[200px] overflow-y-auto overflow-x-auto custom-scrollbar">
                                             <Table>
                                               <TableHeader className="bg-muted/20 sticky top-0 z-10">
                                                 <TableRow className="border-b-border/20">
                                                   <TableHead className="text-xs font-normal uppercase py-2 pl-3 sm:pl-4 bg-muted/20">Nama Warga</TableHead>
                                                   <TableHead className="text-right text-xs font-normal uppercase py-2 pr-3 sm:pr-4 bg-muted/20">Kontribusi</TableHead>
                                                 </TableRow>
                                               </TableHeader>
                                               <TableBody>
                                                 {status.paidResidents.length === 0 ? (
                                                   <TableRow>
                                                     <TableCell colSpan={2} className="h-16 sm:h-20 text-center text-muted-foreground/30 text-xs font-normal uppercase italic">Belum ada pembayaran</TableCell>
                                                   </TableRow>
                                                 ) : (
                                                   status.paidResidents.map((r) => (
                                                     <TableRow key={r.id} className="hover:bg-muted/5 border-b-border/5">
                                                       <TableCell className="py-2 pl-3 sm:pl-4 text-sm font-normal">{r.name}</TableCell>
                                                       <TableCell className="py-2 pr-3 sm:pr-4 text-right text-sm font-normal text-success">{formatCurrency(r.amountPaid)}</TableCell>
                                                     </TableRow>
                                                   ))
                                                 )}
                                               </TableBody>
                                             </Table>
                                           </div>
                                         </div>
                                       </div>
                                       <div className="space-y-3 sm:space-y-4">
                                         <h4 className="text-xs font-normal uppercase tracking-widest text-destructive flex items-center gap-2">
                                           <XCircle className="h-3 w-3" /> Belum Bayar ({status.unpaid})
                                         </h4>
                                         <div className="rounded-xl border bg-background overflow-hidden shadow-sm">
                                           <div className="max-h-[200px] overflow-y-auto overflow-x-auto custom-scrollbar">
                                             <Table>
                                               <TableHeader className="bg-muted/20 sticky top-0 z-10">
                                                 <TableRow className="border-b-border/20">
                                                   <TableHead className="text-xs font-normal uppercase py-2 pl-3 sm:pl-4 bg-muted/20">Nama Warga</TableHead>
                                                   <TableHead className="text-right text-xs font-normal uppercase py-2 pr-3 sm:pr-4 bg-muted/20">Estimasi</TableHead>
                                                 </TableRow>
                                               </TableHeader>
                                               <TableBody>
                                                 {status.unpaidResidents.length === 0 ? (
                                                   <TableRow>
                                                     <TableCell colSpan={2} className="h-16 sm:h-20 text-center text-success/30 text-xs font-normal uppercase italic">Semua warga sudah lunas</TableCell>
                                                   </TableRow>
                                                 ) : (
                                                   status.unpaidResidents.map((r) => {
                                                     const propType = r.property_type || 'occupied';
                                                     const estimate = fees[propType as keyof typeof fees] || fees.occupied;
                                                     return (
                                                       <TableRow key={r.id} className="hover:bg-muted/5 border-b-border/5">
                                                         <TableCell className="py-2 pl-3 sm:pl-4 text-sm font-normal">{r.name}</TableCell>
                                                         <TableCell className="py-2 pr-3 sm:pr-4 text-right text-sm font-normal text-destructive">{formatCurrency(estimate)}</TableCell>
                                                       </TableRow>
                                                     );
                                                   })
                                                 )}
                                               </TableBody>
                                             </Table>
                                           </div>
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
                    </ScrollIndicator>
                </div>
              </TabsContent>

            <TabsContent value="grafik" className="animate-fade-in">
              <div className="emerald-card p-8">
                  <PublicCharts 
                    summary={summary} 
                    monthlyPaymentStatus={monthlyPaymentStatus}
                    incomeTransactions={summary.incomeTransactions}
                    expenseTransactions={summary.expenseTransactions}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                  />

              </div>
            </TabsContent>
          </Tabs>

        </main>

        {/* Standardized Image Viewer Dialog */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-xl">
            <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-normal">Bukti Transaksi</DialogTitle>
                  <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">Sistem Audit Publik</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsImageDialogOpen(false)}
                className="rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative flex items-center justify-center p-6 bg-muted/10 min-h-[400px]">
              {selectedImageUrl ? (
                <img
                  src={selectedImageUrl}
                  alt="Bukti Transaksi"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground/40">
                  <ImageIcon className="h-16 w-16" />
                  <p className="text-sm font-normal">Gambar tidak tersedia</p>
                </div>
              )}
            </div>
            <div className="p-5 flex justify-end items-center border-t border-border/30 bg-card">
              <Button 
                onClick={() => setIsImageDialogOpen(false)}
                className="h-10 px-8 rounded-lg font-normal text-xs shadow-md transition-all active:scale-95"
              >
                Tutup Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
}
