import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, Download, Package, AlertTriangle, TrendingUp, DollarSign, PackageX, Loader2 } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useInventoryReport } from '@/hooks/useReports';

const STATUS_COLORS = {
  in_stock: 'hsl(142 76% 36%)',
  low_stock: 'hsl(25 95% 53%)',
  out_of_stock: 'hsl(0 84% 60%)',
  overstock: 'hsl(221 83% 53%)',
};

export default function InventoryReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { data: inventoryData, isLoading, error } = useInventoryReport();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (error || !inventoryData) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load inventory report.</div>;
  }

  const categories = [...new Set(inventoryData.map((p) => p.category))];

  const filteredInventory = inventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalStockValue = inventoryData.reduce((sum, p) => sum + p.stockValue, 0);
  const totalItems = inventoryData.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockCount = inventoryData.filter((p) => p.status === 'low_stock').length;
  const outOfStockCount = inventoryData.filter((p) => p.status === 'out_of_stock').length;

  const statusData = [
    { name: 'In Stock', value: inventoryData.filter((p) => p.status === 'in_stock').length, color: STATUS_COLORS.in_stock },
    { name: 'Low Stock', value: inventoryData.filter((p) => p.status === 'low_stock').length, color: STATUS_COLORS.low_stock },
    { name: 'Out of Stock', value: inventoryData.filter((p) => p.status === 'out_of_stock').length, color: STATUS_COLORS.out_of_stock },
    { name: 'Overstock', value: inventoryData.filter((p) => p.status === 'overstock').length, color: STATUS_COLORS.overstock },
  ];

  const categoryStockValue = categories.map((category) => ({
    name: category,
    value: inventoryData.filter((p) => p.category === category).reduce((sum, p) => sum + p.stockValue, 0),
  }));

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { in_stock: 'default', low_stock: 'secondary', out_of_stock: 'destructive', overstock: 'outline' };
    const labels: Record<string, string> = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', overstock: 'Overstock' };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Report</h1>
          <p className="text-muted-foreground">Stock levels, valuation, and turnover analysis</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Stock Value" value={formatCurrency(totalStockValue)} icon={DollarSign} description="Inventory valuation" />
        <StatCard title="Total Items" value={totalItems.toLocaleString()} icon={Package} description="Units in stock" />
        <StatCard title="Low Stock Items" value={lowStockCount.toString()} icon={AlertTriangle} description="Needs reorder" />
        <StatCard title="Out of Stock" value={outOfStockCount.toString()} icon={PackageX} description="Unavailable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Stock Status Distribution</CardTitle><CardDescription>Overview of inventory health</CardDescription></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stock Value by Category</CardTitle><CardDescription>Inventory investment distribution</CardDescription></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStockValue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => `Rs.${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><CardTitle>Inventory Details</CardTitle><CardDescription>Stock levels and metrics for each product</CardDescription></div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="overstock">Overstock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
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
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reorder Point</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead className="text-right">Turnover</TableHead>
                <TableHead className="text-right">Days of Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><div><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.sku} • {item.category}</div></div></TableCell>
                  <TableCell className="text-right font-medium">{item.currentStock}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.reservedStock}</TableCell>
                  <TableCell className="text-right">{item.availableStock}</TableCell>
                  <TableCell className="text-right"><span className={item.currentStock <= item.reorderPoint ? 'text-amber-600 font-medium' : ''}>{item.reorderPoint}</span></TableCell>
                  <TableCell className="text-right">{formatCurrency(item.stockValue)}</TableCell>
                  <TableCell className="text-right"><div className="flex items-center justify-end gap-1"><TrendingUp className="h-3 w-3 text-muted-foreground" />{item.turnoverRate}x</div></TableCell>
                  <TableCell className="text-right"><span className={item.daysOfStock === 0 ? 'text-red-600' : item.daysOfStock < 20 ? 'text-amber-600' : ''}>{item.daysOfStock}</span></TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-5 w-5" />Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventoryData.filter((p) => p.status === 'out_of_stock' || p.status === 'low_stock').map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                  <div><span className="font-medium">{item.name}</span><span className="text-muted-foreground ml-2">({item.sku})</span></div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Stock: <strong>{item.currentStock}</strong> / Reorder: <strong>{item.reorderPoint}</strong></span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
