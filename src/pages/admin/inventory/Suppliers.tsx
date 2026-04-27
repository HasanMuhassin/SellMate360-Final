import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Building2, Phone, Mail, Package, DollarSign, Eye } from 'lucide-react';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/admin/StatusBadge';
import { useSuppliers, useSupplierMutations } from '@/hooks/useInventory';
import { format } from 'date-fns';

const formatCurrency = (value: number) => `LKR ${value.toLocaleString()}`;

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', email: '', phone: '', address: '', contact_person: '', payment_terms: 'Net 30', status: 'active',
  });

  const { data: suppliers = [], isLoading } = useSuppliers();
  const { createSupplier, updateSupplier, deleteSupplier } = useSupplierMutations();

  const filteredSuppliers = suppliers.filter((s: any) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s: any) => s.status === 'active').length,
    totalSpent: suppliers.reduce((sum: number, s: any) => sum + (s.total_spent || 0), 0),
  };

  const handleAddOpen = () => {
    setFormData({ name: '', code: '', email: '', phone: '', address: '', contact_person: '', payment_terms: 'Net 30', status: 'active' });
    setAddDialogOpen(true);
  };

  const handleEditOpen = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name, code: supplier.code, email: supplier.email || '', phone: supplier.phone || '',
      address: supplier.address || '', contact_person: supplier.contact_person || '',
      payment_terms: supplier.payment_terms || 'Net 30', status: supplier.status,
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    createSupplier.mutate(formData, { onSuccess: () => setAddDialogOpen(false) });
  };

  const handleUpdate = () => {
    if (!selectedSupplier) return;
    updateSupplier.mutate({ id: selectedSupplier.id, ...formData }, { onSuccess: () => setEditDialogOpen(false) });
  };

  const handleDelete = () => {
    if (!selectedSupplier) return;
    deleteSupplier.mutate(selectedSupplier.id, { onSuccess: () => { setDeleteDialogOpen(false); setSelectedSupplier(null); } });
  };

  const renderSupplierForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Supplier Name *</Label><Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., TechPro Distributors" /></div>
        <div className="space-y-2"><Label>Supplier Code</Label><Input value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g., SUP-001" /></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label>Contact Person</Label><Input value={formData.contact_person} onChange={(e) => setFormData((p) => ({ ...p, contact_person: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Address</Label><Textarea value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} rows={2} /></div>
      <div className="space-y-2">
        <Label>Payment Terms</Label>
        <Select value={formData.payment_terms} onValueChange={(v) => setFormData((p) => ({ ...p, payment_terms: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="COD">COD</SelectItem>
            <SelectItem value="Net 15">Net 15</SelectItem>
            <SelectItem value="Net 30">Net 30</SelectItem>
            <SelectItem value="Net 45">Net 45</SelectItem>
            <SelectItem value="Net 60">Net 60</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="isActive" checked={formData.status === 'active'} onCheckedChange={(c) => setFormData((p) => ({ ...p, status: c ? 'active' : 'inactive' }))} />
        <Label htmlFor="isActive">Active</Label>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Suppliers</h1><p className="text-muted-foreground">Manage your product suppliers</p></div>
        <Button size="sm" onClick={handleAddOpen}><Plus className="mr-2 h-4 w-4" />Add Supplier</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Suppliers</p><p className="text-2xl font-bold">{stats.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><Building2 className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-success">{stats.active}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Purchased</p><p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalSpent)}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, code, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No suppliers found.</TableCell></TableRow>
              ) : (
                filteredSuppliers.map((supplier: any) => (
                  <TableRow key={supplier.id}>
                    <TableCell><div><p className="font-medium">{supplier.name}</p><p className="text-xs text-muted-foreground font-mono">{supplier.code}</p></div></TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3 text-muted-foreground" />{supplier.email}</div>}
                        {supplier.phone && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3 w-3" />{supplier.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{supplier.payment_terms}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(supplier.total_spent || 0)}</TableCell>
                    <TableCell><StatusBadge status={supplier.status} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedSupplier(supplier); setViewDialogOpen(true); }}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOpen(supplier)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedSupplier(supplier); setDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add Supplier</DialogTitle><DialogDescription>Add a new supplier.</DialogDescription></DialogHeader>{renderSupplierForm()}<DialogFooter><Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={createSupplier.isPending}>Save</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Supplier</DialogTitle><DialogDescription>Update supplier information.</DialogDescription></DialogHeader>{renderSupplierForm()}<DialogFooter><Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button><Button onClick={handleUpdate} disabled={updateSupplier.isPending}>Update</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />{selectedSupplier?.name}</DialogTitle></DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Code</p><p className="font-mono">{selectedSupplier.code}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><StatusBadge status={selectedSupplier.status} /></div>
              </div>
              {selectedSupplier.contact_person && <div><p className="text-sm text-muted-foreground">Contact Person</p><p className="font-medium">{selectedSupplier.contact_person}</p></div>}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Email</p><p>{selectedSupplier.email || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Phone</p><p>{selectedSupplier.phone || '-'}</p></div>
              </div>
              {selectedSupplier.address && <div><p className="text-sm text-muted-foreground">Address</p><p className="text-sm">{selectedSupplier.address}</p></div>}
              <div><p className="text-sm text-muted-foreground">Payment Terms</p><Badge variant="outline">{selectedSupplier.payment_terms}</Badge></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Supplier</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete {selectedSupplier?.name}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
