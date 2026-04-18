import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus, Search, Edit, Trash2, Layers, Package, TrendingUp, Gift, MoreHorizontal, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import StatCard from '@/components/admin/StatCard';
import { toast } from 'sonner';
import { useDiscountRules, useDiscountRuleMutations } from '@/hooks/usePromotions';

const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

type RuleType = 'bulk' | 'bundle' | 'tiered' | 'bogo';

const discountTypeIcons: Record<RuleType, React.ComponentType<{ className?: string }>> = {
  bulk: Layers, bundle: Package, tiered: TrendingUp, bogo: Gift,
};
const discountTypeLabels: Record<RuleType, string> = {
  bulk: 'Bulk Discount', bundle: 'Bundle Deal', tiered: 'Tiered Pricing', bogo: 'Buy One Get One',
};

export default function Discounts() {
  const { data: rules = [], isLoading } = useDiscountRules();
  const { createRule, updateRule, deleteRule, toggleRuleStatus } = useDiscountRuleMutations();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'bulk' as RuleType, description: '',
    minQuantity: '', minAmount: '',
    discountType: 'percentage' as string, discountValue: '', maxDiscount: '',
    stackable: false, priority: '1', validFrom: '', validTo: '',
  });

  const filteredRules = rules.filter((r: any) => {
    const matchesSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: rules.length,
    active: rules.filter((r: any) => r.status === 'active').length,
    totalUsage: rules.reduce((sum: number, r: any) => sum + (r.usage_count || 0), 0),
    stackable: rules.filter((r: any) => r.stackable).length,
  };

  const handleOpenDialog = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      const conditions = rule.conditions || {};
      const discount = rule.discount || {};
      setFormData({
        name: rule.name, type: rule.type, description: rule.description || '',
        minQuantity: conditions.minQuantity?.toString() || '', minAmount: conditions.minAmount?.toString() || '',
        discountType: discount.type || 'percentage', discountValue: discount.value?.toString() || '',
        maxDiscount: discount.maxDiscount?.toString() || '',
        stackable: rule.stackable || false, priority: rule.priority?.toString() || '1',
        validFrom: rule.valid_from ? format(new Date(rule.valid_from), 'yyyy-MM-dd') : '',
        validTo: rule.valid_to ? format(new Date(rule.valid_to), 'yyyy-MM-dd') : '',
      });
    } else {
      setEditingRule(null);
      setFormData({ name: '', type: 'bulk', description: '', minQuantity: '', minAmount: '', discountType: 'percentage', discountValue: '', maxDiscount: '', stackable: false, priority: '1', validFrom: '', validTo: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!formData.name || !formData.discountValue || !formData.validFrom || !formData.validTo) {
      toast.error('Please fill in all required fields'); return;
    }
    const payload: any = {
      name: formData.name, type: formData.type, description: formData.description,
      conditions: {
        ...(formData.minQuantity ? { minQuantity: parseInt(formData.minQuantity) } : {}),
        ...(formData.minAmount ? { minAmount: parseFloat(formData.minAmount) } : {}),
      },
      discount: {
        type: formData.discountType, value: parseFloat(formData.discountValue),
        ...(formData.maxDiscount ? { maxDiscount: parseFloat(formData.maxDiscount) } : {}),
      },
      stackable: formData.stackable, priority: parseInt(formData.priority),
      valid_from: new Date(formData.validFrom).toISOString(),
      valid_to: new Date(formData.validTo).toISOString(),
    };
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      createRule.mutate(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discount Rules</h1>
          <p className="text-muted-foreground">Configure automatic discounts based on cart conditions</p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Create Rule</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Rules" value={stats.total.toString()} icon={Layers} />
        <StatCard title="Active Rules" value={stats.active.toString()} icon={CheckCircle2} />
        <StatCard title="Total Applied" value={stats.totalUsage.toString()} icon={TrendingUp} />
        <StatCard title="Stackable Rules" value={stats.stackable.toString()} icon={Package} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {(Object.keys(discountTypeLabels) as RuleType[]).map((type) => {
          const Icon = discountTypeIcons[type];
          const count = rules.filter((r: any) => r.type === type && r.status === 'active').length;
          return (
            <Card key={type} className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === type ? 'ring-2 ring-primary' : ''}`} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}>
              <CardHeader className="pb-2">
                <Icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-sm">{discountTypeLabels[type]}</CardTitle>
                <CardDescription>{count} active rules</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>All Discount Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search rules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No discount rules found</TableCell></TableRow>
                ) : filteredRules.map((rule: any) => {
                  const Icon = discountTypeIcons[rule.type as RuleType] || Layers;
                  const conditions = rule.conditions || {};
                  const discount = rule.discount || {};
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div className="font-medium">{rule.name}</div>
                        <p className="text-xs text-muted-foreground max-w-xs truncate">{rule.description}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{discountTypeLabels[rule.type as RuleType] || rule.type}</span>
                        </div>
                        {rule.stackable && <Badge variant="outline" className="text-xs mt-1">Stackable</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {conditions.minQuantity && <p>Min qty: {conditions.minQuantity}</p>}
                          {conditions.minAmount && <p>Min amount: {formatPrice(conditions.minAmount)}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {discount.type === 'percentage' ? `${discount.value}% off` : discount.type === 'fixed' ? `${formatPrice(discount.value)} off` : `${discount.value} free item(s)`}
                        </div>
                        {discount.maxDiscount && <p className="text-xs text-muted-foreground">Max: {formatPrice(discount.maxDiscount)}</p>}
                      </TableCell>
                      <TableCell><div className="text-sm">{rule.usage_count || 0} times</div></TableCell>
                      <TableCell><Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>{rule.status}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(rule)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleRuleStatus.mutate(rule.id)}>
                              {rule.status === 'active' ? <><XCircle className="h-4 w-4 mr-2" />Deactivate</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteRule.mutate(rule.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Discount Rule' : 'Create Discount Rule'}</DialogTitle>
            <DialogDescription>Configure automatic discount conditions and values</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Buy 3 Get 10% Off" />
              </div>
              <div className="space-y-2">
                <Label>Rule Type *</Label>
                <Select value={formData.type} onValueChange={(v: RuleType) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bulk">Bulk Discount</SelectItem>
                    <SelectItem value="bundle">Bundle Deal</SelectItem>
                    <SelectItem value="tiered">Tiered Pricing</SelectItem>
                    <SelectItem value="bogo">Buy One Get One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Quantity</Label>
                <Input type="number" value={formData.minQuantity} onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input type="number" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_item">Free Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Discount</Label>
                <Input type="number" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={formData.stackable} onCheckedChange={(v) => setFormData({ ...formData, stackable: v })} />
                <Label>Stackable</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule} disabled={createRule.isPending || updateRule.isPending}>
              {(createRule.isPending || updateRule.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
