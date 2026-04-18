import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, ArrowLeftRight, Search, Filter, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockLedger } from '@/hooks/useInventory';
import { format } from 'date-fns';

export default function StockLedger() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { data: stockLedger = [], isLoading } = useStockLedger();

  const filteredLedger = stockLedger
    .filter((entry: any) => {
      const matchesSearch =
        (entry.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.reference || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || entry.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowUpCircle className="h-4 w-4 text-success" />;
      case 'out': return <ArrowDownCircle className="h-4 w-4 text-destructive" />;
      case 'adjustment': return <RefreshCw className="h-4 w-4 text-warning" />;
      case 'transfer': return <ArrowLeftRight className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'in': return <Badge className="bg-success/10 text-success border-success/20">Stock In</Badge>;
      case 'out': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Stock Out</Badge>;
      case 'adjustment': return <Badge className="bg-warning/10 text-warning border-warning/20">Adjustment</Badge>;
      case 'transfer': return <Badge className="bg-primary/10 text-primary border-primary/20">Transfer</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const stats = {
    totalIn: stockLedger.filter((e: any) => e.type === 'in').reduce((sum: number, e: any) => sum + (e.quantity || 0), 0),
    totalOut: stockLedger.filter((e: any) => e.type === 'out').reduce((sum: number, e: any) => sum + Math.abs(e.quantity || 0), 0),
    adjustments: stockLedger.filter((e: any) => e.type === 'adjustment').length,
    transfers: stockLedger.filter((e: any) => e.type === 'transfer').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Ledger</h1>
          <p className="text-muted-foreground">Complete history of stock movements</p>
        </div>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><ArrowUpCircle className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Total Stock In</p><p className="text-2xl font-bold text-success">+{stats.totalIn}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><ArrowDownCircle className="h-5 w-5 text-destructive" /></div><div><p className="text-sm text-muted-foreground">Total Stock Out</p><p className="text-2xl font-bold text-destructive">-{stats.totalOut}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><RefreshCw className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Adjustments</p><p className="text-2xl font-bold">{stats.adjustments}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><ArrowLeftRight className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Transfers</p><p className="text-2xl font-bold">{stats.transfers}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by product or reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
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
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLedger.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No ledger entries found.</TableCell></TableRow>
              ) : (
                filteredLedger.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>{getTypeIcon(entry.type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{format(new Date(entry.created_at), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.created_at), 'hh:mm a')}</p>
                      </div>
                    </TableCell>
                    <TableCell><p className="font-medium">{entry.product_name}</p></TableCell>
                    <TableCell>{getTypeBadge(entry.type)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${entry.quantity > 0 ? 'text-success' : 'text-destructive'}`}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]"><p className="text-sm truncate">{entry.reason}</p></TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{entry.reference || '-'}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{entry.created_by || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredLedger.length} entries</span>
      </div>
    </div>
  );
}
