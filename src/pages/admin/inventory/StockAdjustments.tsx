import { useState } from 'react';
import { Plus, Search, Filter, Check, X, Clock, RefreshCw, MoreHorizontal, Eye } from 'lucide-react';
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
import StatusBadge from '@/components/admin/StatusBadge';
import { useStockAdjustments, useStockAdjustmentMutations } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';
import { useCreateAuditLog } from '@/hooks/useSecurity';
import { format } from 'date-fns';

export default function StockAdjustments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<any>(null);
  const [formData, setFormData] = useState({
    product_id: '', type: 'correction', quantity_change: 0, reason: '', notes: '',
  });

  const { data: adjustments = [], isLoading } = useStockAdjustments();
  const { createAdjustment, approveAdjustment, rejectAdjustment } = useStockAdjustmentMutations();
  const { data: products = [] } = useProducts();
  const createAuditLog = useCreateAuditLog();

  const filteredAdjustments = adjustments.filter((adj: any) => {
    const matchesSearch =
      (adj.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (adj.adjustment_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || adj.status === statusFilter;
    const matchesType = typeFilter === 'all' || adj.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: adjustments.length,
    pending: adjustments.filter((a: any) => a.status === 'pending').length,
    approved: adjustments.filter((a: any) => a.status === 'approved').length,
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      add: { label: 'Add', className: 'bg-success/10 text-success border-success/20' },
      remove: { label: 'Remove', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      damage: { label: 'Damage', className: 'bg-warning/10 text-warning border-warning/20' },
      expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
      correction: { label: 'Correction', className: 'bg-primary/10 text-primary border-primary/20' },
    };
    const c = config[type] || { label: type, className: '' };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const handleAddOpen = () => {
    setFormData({ product_id: '', type: 'correction', quantity_change: 0, reason: '', notes: '' });
    setAddDialogOpen(true);
  };

  const handleSave = () => {
    const product = products.find((p: any) => p.id === formData.product_id);
    if (!product) return;

    let actualChange = formData.quantity_change;
    // For reduction types, ensure the change is negative if the user entered a positive number
    if (['remove', 'damage', 'expired'].includes(formData.type) && actualChange > 0) {
      actualChange = -actualChange;
    }
    // For addition types, ensure it's positive
    if (formData.type === 'add' && actualChange < 0) {
      actualChange = Math.abs(actualChange);
    }

    createAdjustment.mutate({
      product_id: formData.product_id,
      product_name: product.name,
      sku: product.sku || '',
      type: formData.type,
      quantity_before: product.stock || 0,
      quantity_change: actualChange,
      quantity_after: (product.stock || 0) + actualChange,
      reason: formData.reason,
      notes: formData.notes || null,
      created_by: 'Admin',
      status: 'pending',
    }, {
      onSuccess: () => {
        // Record stock adjustment creation audit log
        createAuditLog.mutate({
          action: 'create_stock_adjustment',
          resource: 'inventory',
          resource_id: formData.product_id,
          details: { 
            product_name: product.name,
            type: formData.type,
            change: formData.quantity_change
          },
          level: 'info'
        });
        setAddDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Adjustments</h1>
          <p className="text-muted-foreground">Manage inventory corrections and adjustments</p>
        </div>
        <Button size="sm" onClick={handleAddOpen}><Plus className="mr-2 h-4 w-4" />New Adjustment</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-muted"><RefreshCw className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-sm text-muted-foreground">Total Adjustments</p><p className="text-2xl font-bold">{stats.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold text-warning">{stats.pending}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><Check className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-success">{stats.approved}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by product or adjustment #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="remove">Remove</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                <TableHead>Adjustment #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Change</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdjustments.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No adjustments found.</TableCell></TableRow>
              ) : (
                filteredAdjustments.map((adj: any) => (
                  <TableRow key={adj.id}>
                    <TableCell><Badge variant="outline" className="font-mono">{adj.adjustment_number}</Badge></TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(adj.created_at), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(adj.created_at), 'hh:mm a')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{adj.product_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{adj.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(adj.type)}</TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <span className={`font-bold ${adj.quantity_change > 0 ? 'text-success' : 'text-destructive'}`}>
                          {adj.quantity_change > 0 ? '+' : ''}{adj.quantity_change}
                        </span>
                        <p className="text-xs text-muted-foreground">{adj.quantity_before} → {adj.quantity_after}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px]"><p className="text-sm truncate">{adj.reason}</p></TableCell>
                    <TableCell><StatusBadge status={adj.status} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedAdjustment(adj); setViewDialogOpen(true); }}>
                            <Eye className="mr-2 h-4 w-4" />View Details
                          </DropdownMenuItem>
                          {adj.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-success" onClick={() => approveAdjustment.mutate(adj.id)}>
                                <Check className="mr-2 h-4 w-4" />Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => rejectAdjustment.mutate(adj.id)}>
                                <X className="mr-2 h-4 w-4" />Reject
                              </DropdownMenuItem>
                            </>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Stock Adjustment</DialogTitle>
            <DialogDescription>Create a stock adjustment for inventory correction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select value={formData.product_id || 'none'} onValueChange={(v) => setFormData((prev) => ({ ...prev, product_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select product...</SelectItem>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Adjustment Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="remove">Remove Stock</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity Change *</Label>
                <Input type="number" value={formData.quantity_change} onChange={(e) => setFormData((prev) => ({ ...prev, quantity_change: parseInt(e.target.value) || 0 }))} placeholder="e.g., 5 or -3" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input value={formData.reason} onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Brief reason for adjustment" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createAdjustment.isPending}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" />{selectedAdjustment?.adjustment_number}</DialogTitle></DialogHeader>
          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Product</p><p className="font-medium">{selectedAdjustment.product_name}</p><p className="text-xs text-muted-foreground">{selectedAdjustment.sku}</p></div>
                <div><p className="text-sm text-muted-foreground">Type</p>{getTypeBadge(selectedAdjustment.type)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center"><p className="text-sm text-muted-foreground">Before</p><p className="text-xl font-bold">{selectedAdjustment.quantity_before}</p></div>
                <div className="text-center"><p className="text-sm text-muted-foreground">Change</p><p className={`text-xl font-bold ${selectedAdjustment.quantity_change > 0 ? 'text-success' : 'text-destructive'}`}>{selectedAdjustment.quantity_change > 0 ? '+' : ''}{selectedAdjustment.quantity_change}</p></div>
                <div className="text-center"><p className="text-sm text-muted-foreground">After</p><p className="text-xl font-bold">{selectedAdjustment.quantity_after}</p></div>
              </div>
              <div><p className="text-sm text-muted-foreground">Reason</p><p>{selectedAdjustment.reason}</p></div>
              {selectedAdjustment.notes && <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{selectedAdjustment.notes}</p></div>}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm"><p className="text-muted-foreground">Created by</p><p>{selectedAdjustment.created_by}</p></div>
                <StatusBadge status={selectedAdjustment.status} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
