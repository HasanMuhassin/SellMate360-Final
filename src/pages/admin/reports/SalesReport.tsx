import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  Download,
  Calendar,
  Filter,
  Loader2,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useSalesReport } from '@/hooks/useReports';
import { format } from 'date-fns';
import { exportToPDF } from '@/lib/exportUtils';

const COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(221 83% 53%)', 'hsl(25 95% 53%)'];

const DAYS_MAP: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

export default function SalesReport() {
  const [dateRange, setDateRange] = useState('30d');
  const [channel, setChannel] = useState('all');
  const days = DAYS_MAP[dateRange] || 30;
  const { data, isLoading, error } = useSalesReport(days);

  const formatCurrency = (value: number) => `Rs.${(value / 1000).toFixed(0)}K`;
  const formatFullCurrency = (value: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load sales report.</div>;
  }

  const { dailyData, paymentReports, summary } = data;

  const totalSales = dailyData.reduce((sum, d) => sum + d.totalSales, 0);
  const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const onlineSales = dailyData.reduce((sum, d) => sum + d.onlineSales, 0);
  const posSales = dailyData.reduce((sum, d) => sum + d.posSales, 0);

  const channelData = [
    { name: 'Online', value: onlineSales, color: COLORS[0] },
    { name: 'POS', value: posSales, color: COLORS[1] },
  ];

  const weeklyData = dailyData.slice(-7).map((d) => ({
    ...d,
    day: format(new Date(d.date), 'EEE'),
  }));

  return (
    <div className="space-y-6" id="sales-report-content">
      <div className="flex items-center justify-between" data-html2canvas-ignore="true">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Report</h1>
          <p className="text-muted-foreground">Comprehensive sales analytics and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportToPDF('sales-report-content', `Sales_Report_${format(new Date(), 'yyyyMMdd')}.pdf`)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatFullCurrency(totalSales)} icon={DollarSign} description={`Last ${days} days`} />
        <StatCard title="Total Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} description={`Last ${days} days`} />
        <StatCard title="Avg Order Value" value={formatFullCurrency(avgOrderValue)} icon={TrendingUp} description="Per order" />
        <StatCard title="Gross Profit" value={formatFullCurrency(summary.grossProfit)} icon={ArrowUpRight} description={`~${summary.profitMargin}% margin`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily revenue breakdown by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData.slice(-14)}>
                  <defs>
                    <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPOS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'MMM dd')} className="text-xs" />
                  <YAxis tickFormatter={formatCurrency} className="text-xs" />
                  <Tooltip formatter={(v: number) => formatFullCurrency(v)} labelFormatter={(l) => format(new Date(l), 'MMM dd, yyyy')} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="onlineSales" name="Online" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorOnline)" />
                  <Area type="monotone" dataKey="posSales" name="POS" stroke="hsl(142 76% 36%)" fillOpacity={1} fill="url(#colorPOS)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Channel</CardTitle>
            <CardDescription>Revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatFullCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {channelData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatFullCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Last 7 days comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis tickFormatter={formatCurrency} className="text-xs" />
                  <Tooltip formatter={(v: number) => formatFullCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="onlineSales" name="Online" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="posSales" name="POS" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Transaction breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentReports.map((payment) => (
                <div key={payment.method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{payment.method}</span>
                    <span className="text-muted-foreground">{payment.transactions} txns • {formatFullCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${payment.percentage}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10">{payment.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Avg: {formatFullCurrency(payment.avgTransaction)}</span>
                    <span>Success: {payment.successRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{summary.profitMargin}%</div>
              <div className="text-sm text-muted-foreground">Profit Margin</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{summary.newCustomers}</div>
              <div className="text-sm text-muted-foreground">New Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{summary.returningCustomers}</div>
              <div className="text-sm text-muted-foreground">Returning Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{summary.returnRate}%</div>
              <div className="text-sm text-muted-foreground">Return Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{summary.topCategory}</div>
              <div className="text-sm text-muted-foreground">Top Category</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
