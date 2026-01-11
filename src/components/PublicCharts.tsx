import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  Sector
} from 'recharts';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';

interface PaymentSummary {
  target: number;
  realization: number;
  unpaid: number;
}

interface Summary {
  paymentSummary: PaymentSummary;
}

interface MonthlyStatus {
  month: string;
  collected: number;
  expected?: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  category: string;
  transaction_date: string | null;
}

interface PublicChartsProps {
  summary: Summary;
  monthlyPaymentStatus: MonthlyStatus[];
  incomeTransactions: Transaction[];
  expenseTransactions: Transaction[];
  selectedYear: number;
  selectedMonth: string;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function PublicCharts({ summary, monthlyPaymentStatus, incomeTransactions, expenseTransactions, selectedYear, selectedMonth }: PublicChartsProps) {
  const getShortMonth = (m: string) => m.substring(0, 3);
  const subTitle = selectedMonth === 'all'
    ? `Data Kumulatif (Jan - Des ${selectedYear})`
    : selectedMonth === 'Januari'
      ? `Data Kumulatif (Januari ${selectedYear})`
      : `Data Kumulatif (Jan - ${getShortMonth(selectedMonth)} ${selectedYear})`;

  // Data for Overview Chart (Donut Chart)
  const donutOverviewData = [
    { name: 'realization', value: summary.paymentSummary.realization, fill: 'var(--color-realization)' },
    { name: 'unpaid', value: summary.paymentSummary.unpaid, fill: 'var(--color-unpaid)' },
  ];

  const realizationPercentage = summary.paymentSummary.target > 0 
    ? Math.round((summary.paymentSummary.realization / summary.paymentSummary.target) * 100) 
    : 0;

  const overviewConfig: ChartConfig = {
    amount: {
      label: "Jumlah",
    },
    target: {
      label: "Target Pemasukan",
      color: "#0ea5e9",
    },
    realization: {
      label: "Realisasi Pemasukan",
      color: "#10b981",
    },
    unpaid: {
      label: "Kekurangan",
      color: "#ef4444",
    },
  };

  // Prepare Income Donut Data
  const incomeDonutData = React.useMemo(() => {
    const data: { name: string; value: number }[] = [];
    
    // Add Iuran Warga
    if (summary.paymentSummary.realization > 0) {
      data.push({ name: 'Iuran Warga', value: summary.paymentSummary.realization });
    }

    // Add other income by category
    const categories: Record<string, number> = {};
    incomeTransactions.forEach(t => {
      if (!['Iuran Bulanan', 'Iuran Warga'].includes(t.category)) {
        categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
      }
    });

    Object.entries(categories).forEach(([name, value]) => {
      data.push({ name, value });
    });

    return data;
  }, [summary.paymentSummary.realization, incomeTransactions]);

  // Prepare Expense Donut Data
  const expenseDonutData = React.useMemo(() => {
    const categories: Record<string, number> = {};
    expenseTransactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [expenseTransactions]);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Bar Chart Card */}
      <Card className="shadow-sm border-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-normal">Ringkasan Pembayaran Bulanan</CardTitle>
          <CardDescription className="text-xs font-medium text-primary">
            {subTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2 h-[300px] relative">
            <ChartContainer config={overviewConfig} className="h-full w-full">
              <PieChart>
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      className="bg-background/95 backdrop-blur-sm border-muted/50 shadow-xl"
                      formatter={(value, name) => (
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="text-muted-foreground">{overviewConfig[name as keyof typeof overviewConfig]?.label || name}</span>
                          <span className="font-normal tabular-nums">{formatCurrency(Number(value))}</span>
                        </div>
                      )}
                    />
                  } 
                />
                <Pie
                  data={donutOverviewData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutOverviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-primary">{realizationPercentage}%</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tercapai</span>
            </div>
          </div>
            <div className="w-full md:w-1/2 grid grid-cols-1 gap-3">
                {[
                    { 
                      name: 'Target Pemasukan', 
                      amount: summary.paymentSummary.target, 
                      color: 'bg-sky-500',
                      lightColor: 'bg-sky-500/10',
                      textColor: 'text-sky-600',
                      borderColor: 'border-sky-500/20',
                      icon: <Target className="h-4 w-4" />
                    },
                    { 
                      name: 'Realisasi Pemasukan', 
                      amount: summary.paymentSummary.realization, 
                      color: 'bg-emerald-500',
                      lightColor: 'bg-emerald-500/10',
                      textColor: 'text-emerald-600',
                      borderColor: 'border-emerald-500/20',
                      icon: <TrendingUp className="h-4 w-4" />
                    },
                    { 
                      name: 'Kekurangan Pembayaran', 
                      amount: summary.paymentSummary.unpaid, 
                      color: 'bg-red-500',
                      lightColor: 'bg-red-500/10',
                      textColor: 'text-red-600',
                      borderColor: 'border-red-500/20',
                      icon: <AlertCircle className="h-4 w-4" />
                    },
                ].map((item) => (
                  <div key={item.name} className={`flex items-center justify-between p-4 rounded-xl ${item.lightColor} border ${item.borderColor} transition-all hover:shadow-md`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${item.color} text-white shadow-sm`}>
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.name}</span>
                        <span className={`text-sm font-bold mt-0.5 ${item.textColor}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
        </CardContent>
      </Card>

      {/* Donut Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Donut */}
        <Card className="shadow-sm border-muted/20 flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-normal">Proporsi Pemasukan</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider">{selectedMonth === 'all' ? selectedYear : `${selectedMonth} ${selectedYear}`}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Pie
                    data={incomeDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    activeShape={renderActiveShape}
                  >
                    {incomeDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-[10px] font-medium text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {incomeDonutData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Donut */}
        <Card className="shadow-sm border-muted/20 flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-normal">Proporsi Pengeluaran</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider">{selectedMonth === 'all' ? selectedYear : `${selectedMonth} ${selectedYear}`}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Pie
                    data={expenseDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    activeShape={renderActiveShape}
                  >
                    {expenseDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-[10px] font-medium text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {expenseDonutData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
