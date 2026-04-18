import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Calendar, CreditCard, Wallet, Banknote, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { usePaymentsReport } from '@/hooks/useReports';

const COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(221 83% 53%)', 'hsl(25 95% 53%)'];
const DAYS_MAP: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

export default function PaymentsReport() {
  const [dateRange, setDateRange] = useState('30d');
  const days = DAYS_MAP[dateRange] || 30;
  const { data, isLoading, error } = usePaymentsReport(days);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !data) return <div className="text-center py-12 text-muted-foreground">Failed to load payments report.</div>;

  const { paymentReports, dailyPayments } = data;

  const totalAmount = paymentReports.reduce((sum, p) => sum + p.amount, 0);
  const totalTransactions = paymentReports.reduce((sum, p) => sum + p.transactions, 0);
  const avgTransaction = totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0;
  const overallSuccessRate = totalTransactions > 0
    ? paymentReports.reduce((sum, p) => sum + p.successRate * p.transactions, 0) / totalTransactions
    : 0;

  const paymentMethodData = paymentReports.map((p, index) => ({
    name: p.method,
    value: p.amount,
    transactions: p.transactions,
    color: COLORS[index % COLORS.length],
  }));

  const getMethodIcon = (method: string) => {
    if (method.toLowerCase().includes('cash')) return <Banknote className="h-5 w-5" />;
    if (method.toLowerCase().includes('card')) return <CreditCard className="h-5 w-5" />;
    return <Wallet className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments Report</h1>
          <p className="text-muted-foreground">Payment method analysis and settlement tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Processed" value={formatCurrency(totalAmount)} icon={CreditCard} description="All payment methods" />
        <StatCard title="Transactions" value={totalTransactions.toLocaleString()} icon={TrendingUp} description="Total count" />
        <StatCard title="Avg Transaction" value={formatCurrency(avgTransaction)} icon={Wallet} description="Per transaction" />
        <StatCard title="Success Rate" value={`${overallSuccessRate.toFixed(1)}%`} icon={CheckCircle} description="Overall" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {paymentReports.map((payment, index) => (
          <Card key={payment.method}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}>
                  {getMethodIcon(payment.method)}
                </div>
                <div>
                  <div className="font-medium text-sm">{payment.method}</div>
                  <div className="text-xs text-muted-foreground">{payment.transactions} transactions</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(payment.amount)}</span>
                  <Badge variant="outline">{payment.percentage}%</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg:</span>
                  <span>{formatCurrency(payment.avgTransaction)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success:</span>
                  <span className={payment.successRate >= 98 ? 'text-green-600' : payment.successRate >= 95 ? 'text-amber-600' : 'text-red-600'}>{payment.successRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Payment Method Trend</CardTitle><CardDescription>Daily breakdown by payment type</CardDescription></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPayments}>
                  <defs>
                    <linearGradient id="colorCOD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorCard" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[2]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[2]} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} className="text-xs" />
                  <YAxis tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}K`} className="text-xs" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="cod" name="COD" stackId="1" stroke={COLORS[0]} fill="url(#colorCOD)" />
                  <Area type="monotone" dataKey="card" name="Card" stackId="1" stroke={COLORS[1]} fill="url(#colorCard)" />
                  <Area type="monotone" dataKey="bank" name="Bank" stackId="1" stroke={COLORS[2]} fill="url(#colorBank)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment Distribution</CardTitle><CardDescription>Revenue share by payment method</CardDescription></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {paymentMethodData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {paymentMethodData.map((method) => (
                <div key={method.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                    <span>{method.name}</span>
                  </div>
                  <span className="text-muted-foreground">{method.transactions} txns</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Success Rate Analysis</CardTitle><CardDescription>Payment success rates by method</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentReports.map((payment, index) => (
              <div key={payment.method} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{payment.method}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{payment.transactions} transactions</span>
                    <span className={payment.successRate >= 98 ? 'text-green-600 font-medium' : payment.successRate >= 95 ? 'text-amber-600 font-medium' : 'text-red-600 font-medium'}>{payment.successRate}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${payment.successRate}%`, backgroundColor: payment.successRate >= 98 ? 'hsl(142 76% 36%)' : payment.successRate >= 95 ? 'hsl(25 95% 53%)' : 'hsl(0 84% 60%)' }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
