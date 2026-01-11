import { useMemo } from 'react';
import { Users, TrendingUp, TrendingDown, Wallet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { useResidents } from '@/hooks/useResidents';
import { usePayments } from '@/hooks/usePayments';
import { useTransactions } from '@/hooks/useTransactions';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Dashboard() {
  const { residents, isLoading: residentsLoading } = useResidents();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { fees } = useSettings();

  const isLoading = residentsLoading || paymentsLoading || transactionsLoading;

  const summary = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    const membershipCategories = ['Iuran Bulanan', 'Iuran Warga'];
    
    const otherIncome = transactions
      .filter((t) => t.type === 'income' && !membershipCategories.includes(t.category))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const paymentIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const activeResidents = residents.filter((r) => r.status === 'active');
    const paidResidentIds = new Set(
      payments
        .filter((p) => p.months.some((m) => m.includes(currentMonth.split(' ')[0])))
        .map((p) => p.resident_id)
    );

    return {
      totalResidents: activeResidents.length,
      paymentIncome,
      otherIncome,
      totalIncome: otherIncome + paymentIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      paidThisMonth: paidResidentIds.size,
      unpaidThisMonth: activeResidents.length - paidResidentIds.size,
    };
  }, [residents, payments, transactions]);

  const recentPayments = payments.slice(0, 5);
  const recentTransactions = transactions.filter(t => t.type === 'expense').slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Ringkasan Sistem</h1>
              <p className="text-muted-foreground font-medium text-xs mt-1">Dashboard pengelolaan keuangan warga RT.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-primary/20">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Sistem Terkoneksi
              </div>
            </div>
          </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title="Total Warga"
                value={summary.totalResidents}
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                title="Total Saldo Kas"
                value={formatCurrency(summary.balance)}
                icon={<Wallet className="h-5 w-5" />}
                variant="default"
                isMesh={true}
              />
                <StatCard
                  title="Pemasukan Bulan Ini"
                  value={formatCurrency(summary.totalIncome)}
                  icon={<TrendingUp className="h-5 w-5" />}
                  variant="success"
                  isMesh={true}
                />
              <StatCard
                title="Warga Belum Bayar"
                value={summary.unpaidThisMonth}
                icon={<XCircle className="h-5 w-5" />}
                variant="destructive"
                isMesh={true}
              />
            </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  Pembayaran Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  {recentPayments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 gap-3">
                      <CheckCircle className="h-10 w-10 opacity-20" />
                      <p className="text-xs font-medium">Belum ada pembayaran</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {recentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {payment.resident?.name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">{payment.resident?.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{payment.months.join(', ')}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-success">
                              +{formatCurrency(Number(payment.amount))}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(payment.payment_date).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                  Pengeluaran Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  {recentTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 gap-3">
                      <TrendingDown className="h-10 w-10 opacity-20" />
                      <p className="text-xs font-medium">Belum ada pengeluaran</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-destructive/5 flex items-center justify-center font-bold text-xs text-destructive">
                              -
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">{transaction.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter truncate">{transaction.category}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-destructive">
                              -{formatCurrency(Number(transaction.amount))}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(transaction.date).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Config Banner */}
          <Card className="rounded-xl bg-primary/5 border border-primary/10 p-6 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-foreground">Konfigurasi Iuran</h3>
                <p className="text-xs text-muted-foreground max-w-sm">Nominal iuran bulanan disesuaikan berdasarkan kategori hunian.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                {[
                  { label: 'Berpenghuni', value: fees.occupied },
                  { label: 'Rumah Kosong', value: fees.empty_house },
                  { label: 'Lahan Kosong', value: fees.empty_land }
                ].map((item) => (
                  <Card key={item.label} className="p-3 bg-background border border-border/50 rounded-lg text-center shadow-sm min-w-[130px]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-xs font-bold text-primary">{formatCurrency(item.value)}</p>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>

    </Layout>
  );
}
