import { useState } from 'react';
import { Plus, Search, ArrowRight, Package, Truck, Check, Clock, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockTransfers, useStockTransferMutations, useBranches } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';

export default function StockTransfers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [formData, setFormData] = useState({ from_branch_name: '', to_branch_name: '', notes: '' });
  const [transferItems, setTransferItems] = useState<{ product_id: string; product_name: string; sku: string; quantity: number }[]>([]);
  const [itemProductId, setItemProductId] = useState('none');
  const [itemQty, setItemQty] = useState(1);
  const [itemSearch, setItemSearch] = useState('');

  const { data: transfers = [], isLoading } = useStockTransfers();
  const { createTransfer, updateTransferStatus } = useStockTransferMutations();
  const { data: branches = [] } = useBranches();
  const { data: allProducts = [] } = useProducts({ status: 'active' });

  const filteredProductOptions = allProducts.filter(p =>
    p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(itemSearch.toLowerCase())
  );

  const addTransferItem = () => {
    if (itemProductId === 'none') return;
    const product = allProducts.find(p => p.id === itemProductId);
    if (!product) return;
    const existing = transferItems.find(i => i.product_id === itemProductId);
    if (existing) {
      setTransferItems(transferItems.map(i =>
        i.product_id === itemProductId ? { ...i, quantity: i.quantity + itemQty } : i
      ));
    } else {
      setTransferItems([...transferItems, {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku || '',
        quantity: itemQty,
      }]);
    }
    setItemProductId('none');
    setItemQty(1);
    setItemSearch('');
  };

  const removeTransferItem = (productId: string) => {
    setTransferItems(transferItems.filter(i => i.product_id !== productId));
  };

  const handleSave = () => {
    if (!formData.from_branch_name || !formData.to_branch_name) return;
    createTransfer.mutate({
      from_branch_name: formData.from_branch_name,
      to_branch_name: formData.to_branch_name,
      items: transferItems,
      notes: formData.notes,
    }, {
      onSuccess: () => {
        setAddDialogOpen(false);
        setTransferItems([]);
        setFormData({ from_branch_name: '', to_branch_name: '', notes: '' });
      }
    });
  };

  const filteredTransfers = transfers.filter((t: any) => {
    const matchesSearch =
      (t.transfer_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.from_branch_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.to_branch_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: transfers.length,
    pending: transfers.filter((t: any) => t.status === 'pending').length,
    inTransit: transfers.filter((t: any) => t.status === 'in_transit').length,
    received: transfers.filter((t: any) => t.status === 'received').length,
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
      in_transit: { label: 'In Transit', className: 'bg-primary/10 text-primary border-primary/20' },
      received: { label: 'Received', className: 'bg-success/10 text-success border-success/20' },
      cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
    };
    const c = config[status] || { label: status, className: '' };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Transfers</h1>
          <p className="text-muted-foreground">Transfer inventory between branches</p>
        </div>
        <Button size="sm" onClick={() => { setFormData({ from_branch_name: '', to_branch_name: '', notes: '' }); setAddDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />New Transfer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-muted"><Package className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-sm text-muted-foreground">Total Transfers</p><p className="text-2xl font-bold">{stats.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-warning">{stats.pending}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Truck className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">In Transit</p><p className="text-2xl font-bold text-primary">{stats.inTransit}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><Check className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Received</p><p className="text-2xl font-bold text-success">{stats.received}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by transfer # or branch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <TableHead>Transfer #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No transfers found.</TableCell></TableRow>
              ) : (
                filteredTransfers.map((transfer: any) => (
                  <TableRow key={transfer.id}>
                    <TableCell><Badge variant="outline" className="font-mono">{transfer.transfer_number}</Badge></TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(transfer.created_at), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(transfer.created_at), 'hh:mm a')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{(transfer.from_branch_name || '').split(' - ')[0]}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{(transfer.to_branch_name || '').split(' - ')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{transfer.total_items || 0} items</Badge></TableCell>
                    <TableCell className="text-sm">{transfer.requested_by || '-'}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedTransfer(transfer); setViewDialogOpen(true); }}>
                            <Eye className="mr-2 h-4 w-4" />View Details
                          </DropdownMenuItem>
                          {transfer.status === 'pending' && (
                            <><DropdownMenuSeparator /><DropdownMenuItem className="text-success" onClick={() => updateTransferStatus.mutate({ id: transfer.id, status: 'in_transit' })}><Truck className="mr-2 h-4 w-4" />Mark as Shipped</DropdownMenuItem></>
                          )}
                          {transfer.status === 'in_transit' && (
                            <><DropdownMenuSeparator /><DropdownMenuItem className="text-success" onClick={() => updateTransferStatus.mutate({ id: transfer.id, status: 'received' })}><Check className="mr-2 h-4 w-4" />Confirm Receipt</DropdownMenuItem></>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle><DialogDescription>Select branches and add products to transfer.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {/* Branch selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From Branch *</Label>
                <Select value={formData.from_branch_name || 'none'} onValueChange={(v) => setFormData((prev) => ({ ...prev, from_branch_name: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select branch...</SelectItem>
                    {branches.map((b: any) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Branch *</Label>
                <Select value={formData.to_branch_name || 'none'} onValueChange={(v) => setFormData((prev) => ({ ...prev, to_branch_name: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select branch...</SelectItem>
                    {branches.filter((b: any) => b.name !== formData.from_branch_name).map((b: any) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product line item picker */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-base font-semibold">Add Products</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or SKU..."
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={itemProductId} onValueChange={setItemProductId}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select product...</SelectItem>
                    {filteredProductOptions.slice(0, 50).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number" min={1} value={itemQty}
                  onChange={e => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20" placeholder="Qty"
                />
                <Button type="button" onClick={addTransferItem} disabled={itemProductId === 'none'}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Item list */}
              {transferItems.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {transferItems.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{item.product_name}</p>
                        {item.sku && <Badge variant="outline" className="text-xs font-mono">{item.sku}</Badge>}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">×{item.quantity}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTransferItem(item.product_id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-right">{transferItems.length} product(s) · {transferItems.reduce((s, i) => s + i.quantity, 0)} total units</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No items added yet. Search and select products above.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Transfer notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); setTransferItems([]); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createTransfer.isPending || !formData.from_branch_name || !formData.to_branch_name}>
              Create Transfer {transferItems.length > 0 ? `(${transferItems.length} items)` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5" />{selectedTransfer?.transfer_number}</DialogTitle></DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="text-center"><p className="text-xs text-muted-foreground">From</p><p className="font-medium">{selectedTransfer.from_branch_name}</p></div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center"><p className="text-xs text-muted-foreground">To</p><p className="font-medium">{selectedTransfer.to_branch_name}</p></div>
              </div>
              {selectedTransfer.items && selectedTransfer.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Items ({selectedTransfer.total_items})</p>
                  <div className="space-y-2">
                    {selectedTransfer.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div><p className="font-medium">{item.productName || item.product_name}</p><p className="text-xs text-muted-foreground">{item.sku}</p></div>
                        <Badge variant="secondary">x{item.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedTransfer.notes && <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{selectedTransfer.notes}</p></div>}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm"><p className="text-muted-foreground">Created</p><p>{format(new Date(selectedTransfer.created_at), 'MMM dd, yyyy hh:mm a')}</p></div>
                {getStatusBadge(selectedTransfer.status)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
