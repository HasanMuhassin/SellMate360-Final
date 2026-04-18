import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus, Search, Download, Copy, Edit, Trash2, Tag, Percent, Users, Clock, MoreHorizontal, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import StatCard from '@/components/admin/StatCard';
import { toast } from 'sonner';
import { useCoupons, useCouponMutations } from '@/hooks/usePromotions';

const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

const getCouponStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Coupons() {
  const { data: coupons = [], isLoading } = useCoupons();
  const { createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus } = useCouponMutations();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '', type: 'percentage' as 'percentage' | 'fixed', value: '',
    minOrder: '', maxDiscount: '', usageLimit: '', usagePerUser: '1',
    validFrom: '', validTo: '', description: '',
    firstOrderOnly: false, resellerOnly: false,
  });

  const filteredCoupons = coupons.filter((c: any) => {
    const matchesSearch = c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter((c: any) => c.status === 'active').length,
    totalUsage: coupons.reduce((sum: number, c: any) => sum + (c.used_count || 0), 0),
    expiringSoon: coupons.filter((c: any) => {
      const days = Math.ceil((new Date(c.valid_to).getTime() - Date.now()) / 86400000);
      return c.status === 'active' && days <= 7 && days > 0;
    }).length,
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied`);
  };

  const handleOpenDialog = (coupon?: any) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code, type: coupon.type, value: coupon.value?.toString() || '',
        minOrder: coupon.min_order_value?.toString() || '', maxDiscount: coupon.max_discount?.toString() || '',
        usageLimit: coupon.usage_limit?.toString() || '', usagePerUser: coupon.usage_per_user?.toString() || '1',
        validFrom: coupon.valid_from ? format(new Date(coupon.valid_from), 'yyyy-MM-dd') : '',
        validTo: coupon.valid_to ? format(new Date(coupon.valid_to), 'yyyy-MM-dd') : '',
        description: coupon.description || '',
        firstOrderOnly: coupon.first_order_only || false, resellerOnly: coupon.reseller_only || false,
      });
    } else {
      setEditingCoupon(null);
      setFormData({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', usageLimit: '', usagePerUser: '1', validFrom: '', validTo: '', description: '', firstOrderOnly: false, resellerOnly: false });
    }
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = () => {
    if (!formData.code || !formData.value || !formData.validFrom || !formData.validTo) {
      toast.error('Please fill in all required fields'); return;
    }
    const payload: any = {
      code: formData.code.toUpperCase(), type: formData.type,
      value: parseFloat(formData.value),
      min_order_value: formData.minOrder ? parseFloat(formData.minOrder) : null,
      max_discount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
      usage_limit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      usage_per_user: parseInt(formData.usagePerUser),
      valid_from: new Date(formData.validFrom).toISOString(),
      valid_to: new Date(formData.validTo).toISOString(),
      description: formData.description,
      first_order_only: formData.firstOrderOnly, reseller_only: formData.resellerOnly,
    };
    if (editingCoupon) {
      updateCoupon.mutate({ id: editingCoupon.id, ...payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      createCoupon.mutate(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button size="sm" onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Create Coupon</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Coupons" value={stats.total.toString()} icon={Tag} />
        <StatCard title="Active Coupons" value={stats.active.toString()} icon={Percent} />
        <StatCard title="Total Usage" value={stats.totalUsage.toString()} icon={Users} />
        <StatCard title="Expiring Soon" value={stats.expiringSoon.toString()} icon={Clock} />
      </div>

      <Card>
        <CardHeader><CardTitle>Coupons</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by code or description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No coupons found</TableCell></TableRow>
                ) : filteredCoupons.map((coupon: any) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{coupon.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyCode(coupon.code)}><Copy className="h-3 w-3" /></Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}</div>
                      {coupon.max_discount && <p className="text-xs text-muted-foreground">Max: {formatPrice(coupon.max_discount)}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {coupon.min_order_value && <p>Min order: {formatPrice(coupon.min_order_value)}</p>}
                        {coupon.first_order_only && <Badge variant="outline" className="text-xs">First order only</Badge>}
                        {coupon.reseller_only && <Badge variant="outline" className="text-xs">Reseller only</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{coupon.used_count || 0}{coupon.usage_limit && ` / ${coupon.usage_limit}`}</div>
                      {coupon.usage_limit && (
                        <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(((coupon.used_count || 0) / coupon.usage_limit) * 100, 100)}%` }} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(coupon.valid_from), 'MMM d, yyyy')}</p>
                        <p className="text-muted-foreground">to {format(new Date(coupon.valid_to), 'MMM d, yyyy')}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={getCouponStatusColor(coupon.status)}>{coupon.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(coupon)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleCouponStatus.mutate(coupon.id)}>{coupon.status === 'active' ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteCoupon.mutate(coupon.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>{editingCoupon ? 'Update the coupon details below' : 'Fill in the details to create a new coupon'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coupon Code *</Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g., SUMMER20" />
              </div>
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select value={formData.type} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder={formData.type === 'percentage' ? '10' : '500'} />
              </div>
              <div className="space-y-2">
                <Label>Min Order Value</Label>
                <Input type="number" value={formData.minOrder} onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })} placeholder="5000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Discount</Label>
                <Input type="number" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} placeholder="1000" />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input type="number" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} placeholder="100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usage Per User</Label>
                <Input type="number" value={formData.usagePerUser} onChange={(e) => setFormData({ ...formData, usagePerUser: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From *</Label>
                <Input type="date" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Valid To *</Label>
                <Input type="date" value={formData.validTo} onChange={(e) => setFormData({ ...formData, validTo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the coupon..." />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formData.firstOrderOnly} onCheckedChange={(v) => setFormData({ ...formData, firstOrderOnly: v })} />
                <Label>First order only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.resellerOnly} onCheckedChange={(v) => setFormData({ ...formData, resellerOnly: v })} />
                <Label>Reseller only</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCoupon} disabled={createCoupon.isPending || updateCoupon.isPending}>
              {(createCoupon.isPending || updateCoupon.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
