import { useState } from 'react';
import { Plus, Banknote, Building2, CreditCard, Wallet, MoreHorizontal, Edit, Settings2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentMethods, PaymentMethod } from '@/hooks/useStoreSettings';

const typeIcons: Record<string, React.ReactNode> = {
  cod: <Banknote className="h-5 w-5" />,
  bank: <Building2 className="h-5 w-5" />,
  card: <CreditCard className="h-5 w-5" />,
  wallet: <Wallet className="h-5 w-5" />,
};

export default function PaymentSettingsPage() {
  const { methods, isLoading, upsertMethod, toggleStatus } = usePaymentMethods();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    name: '', code: '', type: 'cod' as string, instructions: '',
    bank_name: '', account_number: '', account_name: '', bank_branch: '',
    processing_fee: 0, fee_type: 'fixed' as string,
    min_order: '' as string, max_order: '' as string,
  });

  const openCreate = () => {
    setEditingMethod(null);
    setForm({ name: '', code: '', type: 'cod', instructions: '', bank_name: '', account_number: '', account_name: '', bank_branch: '', processing_fee: 0, fee_type: 'fixed', min_order: '', max_order: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditingMethod(m);
    setForm({
      name: m.name, code: m.code, type: m.type, instructions: m.instructions || '',
      bank_name: m.bank_name || '', account_number: m.account_number || '',
      account_name: m.account_name || '', bank_branch: m.bank_branch || '',
      processing_fee: m.processing_fee, fee_type: m.fee_type,
      min_order: m.min_order?.toString() || '', max_order: m.max_order?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await upsertMethod({
      ...(editingMethod ? { id: editingMethod.id } : {}),
      name: form.name, code: form.code, type: form.type as any,
      instructions: form.instructions || null,
      bank_name: form.bank_name || null, account_number: form.account_number || null,
      account_name: form.account_name || null, bank_branch: form.bank_branch || null,
      processing_fee: form.processing_fee, fee_type: form.fee_type as any,
      min_order: form.min_order ? Number(form.min_order) : null,
      max_order: form.max_order ? Number(form.max_order) : null,
    });
    setIsSaving(false);
    if (result) setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Settings</h1>
          <p className="text-muted-foreground">Configure payment methods and processing options</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Method</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (<Card key={i}><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>))}
        </div>
      ) : methods.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No payment methods configured. Add your first method.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {methods.map(method => (
            <Card key={method.id} className={method.status === 'inactive' ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">{typeIcons[method.type] || <CreditCard className="h-5 w-5" />}</div>
                    <div><CardTitle className="text-lg">{method.name}</CardTitle><CardDescription>{method.code.toUpperCase()}</CardDescription></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={method.status === 'active'} onCheckedChange={() => toggleStatus(method.id, method.status === 'active' ? 'inactive' : 'active')} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(method)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {method.instructions && <p className="text-sm text-muted-foreground">{method.instructions}</p>}
                {method.bank_name && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Bank:</span> {method.bank_name}</p>
                    <p><span className="text-muted-foreground">Account:</span> {method.account_number}</p>
                    <p><span className="text-muted-foreground">Name:</span> {method.account_name}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="text-muted-foreground">Fee:</span> {method.processing_fee === 0 ? 'Free' : method.fee_type === 'percentage' ? `${method.processing_fee}%` : `LKR ${method.processing_fee}`}</div>
                  {method.min_order && <div><span className="text-muted-foreground">Min:</span> LKR {method.min_order.toLocaleString()}</div>}
                  {method.max_order && <div><span className="text-muted-foreground">Max:</span> LKR {method.max_order.toLocaleString()}</div>}
                </div>
                <Badge variant={method.status === 'active' ? 'default' : 'secondary'}>{method.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
            <DialogDescription>Configure payment method details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Cash on Delivery" /></div>
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g., cod" /></div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Instructions</Label><Textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} rows={3} /></div>
            {form.type === 'bank' && (
              <div className="space-y-3 p-3 rounded-lg border">
                <Label className="font-medium">Bank Details</Label>
                <div className="space-y-2"><Label className="text-sm">Bank Name</Label><Input value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} /></div>
                <div className="space-y-2"><Label className="text-sm">Account Number</Label><Input value={form.account_number} onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} /></div>
                <div className="space-y-2"><Label className="text-sm">Account Name</Label><Input value={form.account_name} onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} /></div>
                <div className="space-y-2"><Label className="text-sm">Branch</Label><Input value={form.bank_branch} onChange={e => setForm(p => ({ ...p, bank_branch: e.target.value }))} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Processing Fee</Label><Input type="number" value={form.processing_fee} onChange={e => setForm(p => ({ ...p, processing_fee: Number(e.target.value) }))} /></div>
              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Select value={form.fee_type} onValueChange={v => setForm(p => ({ ...p, fee_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="fixed">Fixed (LKR)</SelectItem><SelectItem value="percentage">Percentage (%)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Min Order (Optional)</Label><Input type="number" value={form.min_order} onChange={e => setForm(p => ({ ...p, min_order: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Max Order (Optional)</Label><Input type="number" value={form.max_order} onChange={e => setForm(p => ({ ...p, max_order: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name || !form.code}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMethod ? 'Save Changes' : 'Add Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
