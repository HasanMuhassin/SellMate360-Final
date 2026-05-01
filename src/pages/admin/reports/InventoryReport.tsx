import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, Download, Package, AlertTriangle, TrendingUp, DollarSign, PackageX, Loader2, ArrowUpDown, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { useInventoryReport } from '@/hooks/useReports';
import { exportToPDF } from '@/lib/exportUtils';
import { format } from 'date-fns';

const STATUS_COLORS = {
  in_stock: 'hsl(142 76% 36%)', // Green
  low_stock: 'hsl(25 95% 53%)', // Orange
  out_of_stock: 'hsl(0 84% 60%)', // Red
  overstock: 'hsl(270 76% 50%)', // Purple
};

type SortField = 'name' | 'currentStock' | 'turnoverRate' | 'daysOfStock';
type SortDirection = 'asc' | 'desc';

export default function InventoryReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [sortField, setSortField] = useState<SortField>('currentStock');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: inventoryData, isLoading, error } = useInventoryReport();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(value);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (error || !inventoryData) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load inventory report.</div>;
  }

  const categories = [...new Set(inventoryData.map((p) => p.category))];

  // Filtering
  const filteredInventory = inventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sorting
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    const numA = Number(aValue);
    const numB = Number(bValue);
    return sortDirection === 'asc' ? numA - numB : numB - numA;
  });

  // Pagination
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const paginatedInventory = sortedInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Metrics
  const totalStockValue = inventoryData.reduce((sum, p) => sum + p.stockValue, 0);
  const totalItems = inventoryData.reduce((sum, p) => sum + p.currentStock, 0);
  const lowStockCount = inventoryData.filter((p) => p.status === 'low_stock').length;
  const outOfStockCount = inventoryData.filter((p) => p.status === 'out_of_stock').length;

  const statusData = [
    { name: 'In Stock', value: inventoryData.filter((p) => p.status === 'in_stock').length, color: STATUS_COLORS.in_stock },
    { name: 'Low Stock', value: inventoryData.filter((p) => p.status === 'low_stock').length, color: STATUS_COLORS.low_stock },
    { name: 'Out of Stock', value: inventoryData.filter((p) => p.status === 'out_of_stock').length, color: STATUS_COLORS.out_of_stock },
    { name: 'Overstock', value: inventoryData.filter((p) => p.status === 'overstock').length, color: STATUS_COLORS.overstock },
  ].filter(s => s.value > 0);

  const categoryStockValue = categories.map((category) => ({
    name: category.length > 15 ? category.substring(0, 15) + '...' : category,
    value: inventoryData.filter((p) => p.category === category).reduce((sum, p) => sum + p.stockValue, 0),
  })).filter(c => c.value > 0);

  // Insights Data
  const fastMoving = [...inventoryData].sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 3);
  const slowMoving = [...inventoryData].filter(p => p.turnoverRate > 0).sort((a, b) => a.turnoverRate - b.turnoverRate).slice(0, 3);
  const deadStock = inventoryData.filter(p => p.isDeadStock);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      in_stock: 'bg-green-100 text-green-700 hover:bg-green-100',
      low_stock: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
      out_of_stock: 'bg-red-100 text-red-700 hover:bg-red-100',
      overstock: 'bg-purple-100 text-purple-700 hover:bg-purple-100'
    };
    const labels: Record<string, string> = { 
      in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', overstock: 'Overstock' 
    };
    return <Badge className={styles[status]} variant="secondary">{labels[status]}</Badge>;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  const activeFiltersCount = (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6 bg-background" id="inventory-report-content" style={{ padding: '20px' }}>
      
      {/* Header (Exported in PDF) */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Report</h1>
          <p className="text-muted-foreground">Generated on {format(new Date(), 'MMM dd, yyyy')}</p>
        </div>
        <Button data-html2canvas-ignore="true" variant="outline" size="sm" onClick={() => exportToPDF('inventory-report-content', `Inventory_Report_${format(new Date(), 'yyyyMMdd')}.pdf`)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 avoid-break">
        <StatCard title="Total Stock Value" value={formatCurrency(totalStockValue)} icon={DollarSign} description="Inventory valuation" />
        <StatCard title="Total Items" value={totalItems.toLocaleString()} icon={Package} description="Units in stock" />
        <StatCard title="Low Stock Items" value={lowStockCount.toString()} icon={AlertTriangle} description="Needs reorder" />
        <StatCard title="Out of Stock" value={outOfStockCount.toString()} icon={PackageX} description="Unavailable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 avoid-break">
        <Card>
          <CardHeader><CardTitle>Stock Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stock Value by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryStockValue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStockValue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}K`} className="text-xs" />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 avoid-break">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-green-600">
              <TrendingUp className="h-4 w-4 mr-2" /> Fast Moving Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fastMoving.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="truncate w-3/4">{item.name}</span>
                  <span className="font-bold">{item.turnoverRate}x</span>
                </div>
              ))}
              {fastMoving.length === 0 && <div className="text-xs text-muted-foreground">No data available</div>}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-amber-600">
              <Clock className="h-4 w-4 mr-2" /> Slow Moving Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slowMoving.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="truncate w-3/4">{item.name}</span>
                  <span className="font-bold">{item.turnoverRate}x</span>
                </div>
              ))}
              {slowMoving.length === 0 && <div className="text-xs text-muted-foreground">No data available</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-red-600">
              <PackageX className="h-4 w-4 mr-2" /> Dead Stock (90 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deadStock.slice(0,3).map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="truncate w-3/4">{item.name}</span>
                  <span className="font-bold text-muted-foreground">{item.currentStock} in stock</span>
                </div>
              ))}
              {deadStock.length > 3 && <div className="text-xs text-muted-foreground">+{deadStock.length - 3} more items</div>}
              {deadStock.length === 0 && <div className="text-xs text-muted-foreground">No dead stock found</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="avoid-break">
        <CardHeader data-html2canvas-ignore="true">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Inventory Details</CardTitle>
              <CardDescription>Stock levels and metrics for each product</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-10 w-48" value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} />
              </div>
              <Select value={statusFilter} onValueChange={(v) => {setStatusFilter(v); setCurrentPage(1);}}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="overstock">Overstock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v) => {setCategoryFilter(v); setCurrentPage(1);}}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active Filters:</span>
              <Badge variant="secondary" className="cursor-pointer" onClick={clearFilters}>
                Clear All <X className="h-3 w-3 ml-1" />
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('currentStock')}>
                  Current {sortField === 'currentStock' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                </TableHead>
                <TableHead className="text-right">Reorder</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('turnoverRate')}>
                  Turnover {sortField === 'turnoverRate' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('daysOfStock')}>
                  Days of Stock {sortField === 'daysOfStock' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.sku} • {item.category}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.currentStock}</TableCell>
                    <TableCell className="text-right"><span className={item.currentStock <= item.reorderPoint ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>{item.reorderPoint}</span></TableCell>
                    <TableCell className="text-right">{formatCurrency(item.stockValue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        {item.turnoverRate}x
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.daysOfStock < 0 ? 'text-muted-foreground' : item.daysOfStock < 20 ? 'text-amber-600 font-medium' : ''}>
                        {item.daysOfStock < 0 ? 'N/A' : item.daysOfStock}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls (Hidden in PDF) */}
          <div className="flex items-center justify-between px-4 py-4 border-t" data-html2canvas-ignore="true">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedInventory.length)} to {Math.min(currentPage * itemsPerPage, sortedInventory.length)} of {sortedInventory.length} products
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium px-2">Page {currentPage} of {Math.max(totalPages, 1)}</div>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
