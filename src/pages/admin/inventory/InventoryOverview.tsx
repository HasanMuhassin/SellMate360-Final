import { useState } from 'react';
import { exportToCsv } from '@/lib/exportCsv';
import { Package, AlertTriangle, Archive, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/admin/StatCard';
import { useInventoryOverview } from '@/hooks/useInventory';

const formatCurrency = (value: number) => `LKR ${value.toLocaleString()}`;

export default function InventoryOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: inventoryItems = [], isLoading } = useInventoryOverview();

  const filteredItems = inventoryItems.filter((item: any) => {
    const matchesSearch =
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalItems: inventoryItems.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
    totalValue: inventoryItems.reduce((sum: number, i: any) => sum + (i.total_value || 0), 0),
    lowStock: inventoryItems.filter((i: any) => i.status === 'low_stock').length,
    outOfStock: inventoryItems.filter((i: any) => i.status === 'out_of_stock').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-success/10 text-success border-success/20">In Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStockLevel = (item: any) => {
    const percentage = Math.min((item.quantity / (item.reorder_point || 20)) * 50, 100);
    return (
      <Progress
        value={percentage}
        className={`h-2 ${
          item.status === 'out_of_stock'
            ? '[&>div]:bg-destructive'
            : item.status === 'low_stock'
            ? '[&>div]:bg-warning'
            : '[&>div]:bg-success'
        }`}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Overview</h1>
          <p className="text-muted-foreground">Monitor stock levels across all products</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const rows = filteredItems.map((item: any) => ({
            'Product': item.product_name || '',
            'SKU': item.sku || '',
            'Category': item.category || '',
            'Stock': item.quantity || 0,
            'Status': item.status || '',
            'Unit Value (LKR)': item.unit_value || 0,
            'Total Value (LKR)': item.total_value || 0,
            'Reorder Point': item.reorder_point || 0,
          }));
          exportToCsv(`Inventory_Overview_${new Date().toISOString().split('T')[0]}`, rows);
        }}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Stock Units" value={stats.totalItems.toLocaleString()} icon={Package} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Total Inventory Value" value={formatCurrency(stats.totalValue)} icon={TrendingUp} iconColor="bg-success/10 text-success" />
        <StatCard title="Low Stock Items" value={stats.lowStock} icon={AlertTriangle} iconColor="bg-warning/10 text-warning" />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={Archive} iconColor="bg-destructive/10 text-destructive" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by product name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.category_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.sku || '-'}</TableCell>
                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-center font-medium">{item.available_quantity}</TableCell>
                    <TableCell className="w-[120px]">{getStockLevel(item)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total_value)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
