import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, Download, TrendingUp, TrendingDown, Minus, Package, DollarSign, Award, ArrowUpDown, Loader2 } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useProductsReport } from '@/hooks/useReports';
import { exportToPDF } from '@/lib/exportUtils';
import { format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(221 83% 53%)', 'hsl(25 95% 53%)', 'hsl(270 76% 50%)'];

export default function ProductsReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('revenue');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { data: productData, isLoading, error } = useProductsReport();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !productData) return <div className="text-center py-12 text-muted-foreground">Failed to load products report.</div>;

  const categories = [...new Set(productData.map((p) => p.category))];

  const filteredProducts = productData
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue': return b.revenue - a.revenue;
        case 'units': return b.unitsSold - a.unitsSold;
        case 'profit': return b.profit - a.profit;
        case 'margin': return b.profitMargin - a.profitMargin;
        default: return 0;
      }
    });

  const totalRevenue = productData.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnits = productData.reduce((sum, p) => sum + p.unitsSold, 0);
  const totalProfit = productData.reduce((sum, p) => sum + p.profit, 0);
  const avgMargin = productData.length > 0 ? Math.round(productData.reduce((sum, p) => sum + p.profitMargin, 0) / productData.length) : 0;

  const topProducts = [...productData].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((p) => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    revenue: p.revenue,
  }));

  const categoryRevenue = categories.map((category) => ({
    name: category,
    value: productData.filter((p) => p.category === category).reduce((sum, p) => sum + p.revenue, 0),
  }));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6" id="products-report-content">
      <div className="flex items-center justify-between" data-html2canvas-ignore="true">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Performance</h1>
          <p className="text-muted-foreground">Analyze product sales, profitability, and trends</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToPDF('products-report-content', `Products_Report_${format(new Date(), 'yyyyMMdd')}.pdf`)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} description="From all products" />
        <StatCard title="Units Sold" value={totalUnits.toLocaleString()} icon={Package} description="Total units" />
        <StatCard title="Gross Profit" value={formatCurrency(totalProfit)} icon={TrendingUp} description="Total profit" />
        <StatCard title="Avg Profit Margin" value={`${avgMargin}%`} icon={Award} description="Across products" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Products by Revenue</CardTitle><CardDescription>Best performing products this period</CardDescription></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `Rs.${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by Category</CardTitle><CardDescription>Sales distribution across categories</CardDescription></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryRevenue} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryRevenue.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><CardTitle>Product Details</CardTitle><CardDescription>Detailed performance metrics for each product</CardDescription></div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36"><ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">By Revenue</SelectItem>
                  <SelectItem value="units">By Units</SelectItem>
                  <SelectItem value="profit">By Profit</SelectItem>
                  <SelectItem value="margin">By Margin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Return Rate</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No product data for this period</TableCell></TableRow>
              ) : filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell><div><div className="font-medium">{product.name}</div><div className="text-xs text-muted-foreground">{product.sku} • {product.category}</div></div></TableCell>
                  <TableCell className="text-right font-medium">{product.unitsSold.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(product.profit)}</TableCell>
                  <TableCell className="text-right"><Badge variant={product.profitMargin >= 25 ? 'default' : 'secondary'}>{product.profitMargin}%</Badge></TableCell>
                  <TableCell className="text-right"><span className={product.returnRate > 3 ? 'text-red-600' : product.returnRate > 2 ? 'text-amber-600' : 'text-green-600'}>{product.returnRate}%</span></TableCell>
                  <TableCell className="text-center">{getTrendIcon(product.trend)}</TableCell>
                  <TableCell className="text-right"><Badge variant={product.stockLevel < 20 ? 'destructive' : product.stockLevel < 50 ? 'secondary' : 'outline'}>{product.stockLevel}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
