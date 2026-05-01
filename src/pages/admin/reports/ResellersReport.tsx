import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Search, Download, Users, DollarSign, TrendingUp, Wallet, Award, AlertTriangle, Loader2 } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useResellersReport } from '@/hooks/useReports';
import { exportToPDF } from '@/lib/exportUtils';
import { format } from 'date-fns';

const TIER_COLORS = { platinum: 'hsl(270 76% 50%)', gold: 'hsl(45 93% 47%)', silver: 'hsl(0 0% 60%)' };

export default function ResellersReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const { data: resellerData, isLoading, error } = useResellersReport();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !resellerData) return <div className="text-center py-12 text-muted-foreground">Failed to load resellers report.</div>;

  const filteredResellers = resellerData.filter((r) => {
    const matchesSearch = r.resellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || r.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const totalSales = resellerData.reduce((sum, r) => sum + r.totalSales, 0);
  const totalCommission = resellerData.reduce((sum, r) => sum + r.earnedCommission, 0);
  const pendingCommission = resellerData.reduce((sum, r) => sum + r.pendingCommission, 0);
  const totalOrders = resellerData.reduce((sum, r) => sum + r.totalOrders, 0);

  const tierDistribution = (['platinum', 'gold', 'silver'] as const).map((tier) => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: resellerData.filter((r) => r.tier === tier).length,
    sales: resellerData.filter((r) => r.tier === tier).reduce((sum, r) => sum + r.totalSales, 0),
    color: TIER_COLORS[tier],
  }));

  const resellerPerformance = [...resellerData].sort((a, b) => b.totalSales - a.totalSales).map((r) => ({
    name: r.resellerName.length > 15 ? r.resellerName.substring(0, 15) + '...' : r.resellerName,
    sales: r.totalSales,
    commission: r.earnedCommission,
  }));

  const getTierBadge = (tier: string) => {
    const styles: Record<string, string> = {
      platinum: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      silver: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return <Badge className={styles[tier] || ''} variant="outline">{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6" id="resellers-report-content">
      <div className="flex items-center justify-between" data-html2canvas-ignore="true">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reseller Commission Report</h1>
          <p className="text-muted-foreground">Track reseller performance and commission payouts</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToPDF('resellers-report-content', `Resellers_Report_${format(new Date(), 'yyyyMMdd')}.pdf`)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Reseller Sales" value={formatCurrency(totalSales)} icon={DollarSign} description="This period" />
        <StatCard title="Total Orders" value={totalOrders.toLocaleString()} icon={TrendingUp} description="Via resellers" />
        <StatCard title="Total Commissions" value={formatCurrency(totalCommission)} icon={Wallet} description="Earned this period" />
        <StatCard title="Pending Payouts" value={formatCurrency(pendingCommission)} icon={Users} description="To be paid" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Sales by Tier</CardTitle><CardDescription>Revenue contribution by reseller tier</CardDescription></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="sales" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {tierDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              {tierDistribution.map((tier) => (
                <div key={tier.name}><div className="text-2xl font-bold">{tier.value}</div><div className="text-sm text-muted-foreground">{tier.name} Resellers</div></div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Performing Resellers</CardTitle><CardDescription>Sales and commission comparison</CardDescription></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resellerPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `Rs.${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><CardTitle>Commission Details</CardTitle><CardDescription>Detailed breakdown by reseller</CardDescription></div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search resellers..." className="pl-10 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reseller</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">COD Rejection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResellers.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No reseller data found</TableCell></TableRow>
              ) : filteredResellers.map((reseller) => (
                <TableRow key={reseller.id}>
                  <TableCell><div className="font-medium">{reseller.resellerName}</div><div className="text-xs text-muted-foreground">{reseller.period}</div></TableCell>
                  <TableCell>{getTierBadge(reseller.tier)}</TableCell>
                  <TableCell className="text-right">{reseller.totalOrders}</TableCell>
                  <TableCell className="text-right">{formatCurrency(reseller.totalSales)}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline">{reseller.commissionRate}%</Badge></TableCell>
                  <TableCell className="text-right font-medium text-green-600">{formatCurrency(reseller.earnedCommission)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(reseller.paidCommission)}</TableCell>
                  <TableCell className="text-right"><Badge variant={reseller.pendingCommission > 50000 ? 'secondary' : 'outline'}>{formatCurrency(reseller.pendingCommission)}</Badge></TableCell>
                  <TableCell className="text-right"><span className={reseller.codRejectionRate > 10 ? 'text-red-600 font-medium' : reseller.codRejectionRate > 5 ? 'text-amber-600' : 'text-green-600'}>{reseller.codRejectionRate}%</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {resellerData.some((r) => r.codRejectionRate > 10) && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400"><AlertTriangle className="h-5 w-5" />High COD Rejection Rate Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resellerData.filter((r) => r.codRejectionRate > 10).map((reseller) => (
                <div key={reseller.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div><div className="font-medium">{reseller.resellerName}</div><div className="text-sm text-muted-foreground">{reseller.totalOrders} orders • {formatCurrency(reseller.totalSales)} sales</div></div>
                  </div>
                  <div className="text-right"><div className="text-lg font-bold text-red-600">{reseller.codRejectionRate}%</div><div className="text-xs text-muted-foreground">COD Rejection Rate</div></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
