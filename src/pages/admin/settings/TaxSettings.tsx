import { useState } from 'react';
import { Plus, Percent, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaxConfigs, TaxConfig } from '@/hooks/useStoreSettings';

export default function TaxSettingsPage() {
  const { taxes, isLoading, upsertTax, toggleStatus, deleteTax } = useTaxConfigs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfig | null>(null);
  const [priceDisplay, setPriceDisplay] = useState<'inclusive' | 'exclusive'>('inclusive');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRate, setFormRate] = useState(0);
  const [formType, setFormType] = useState<string>('inclusive');
  const [formApplyTo, setFormApplyTo] = useState<string>('all');

  const openCreate = () => {
    setEditingTax(null);
    setFormName(''); setFormRate(0); setFormType('inclusive'); setFormApplyTo('all');
    setIsDialogOpen(true);
  };

  const openEdit = (t: TaxConfig) => {
    setEditingTax(t);
    setFormName(t.name); setFormRate(t.rate); setFormType(t.type); setFormApplyTo(t.apply_to);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await upsertTax({
      ...(editingTax ? { id: editingTax.id } : {}),
      name: formName, rate: formRate,
      type: formType as 'inclusive' | 'exclusive',
      apply_to: formApplyTo as 'all' | 'specific',
    });
    setIsSaving(false);
    if (result) setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tax & VAT Settings</h1>
          <p className="text-muted-foreground">Configure tax rates and VAT settings</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Tax Rate</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Tax Settings</CardTitle>
          <CardDescription>Configure how prices are displayed to customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Price Display</Label>
            <RadioGroup value={priceDisplay} onValueChange={(v: 'inclusive' | 'exclusive') => setPriceDisplay(v)} className="flex gap-6">
              <div className="flex items-center space-x-2"><RadioGroupItem value="inclusive" id="inclusive" /><Label htmlFor="inclusive" className="font-normal cursor-pointer">Prices include tax</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="exclusive" id="exclusive" /><Label htmlFor="exclusive" className="font-normal cursor-pointer">Add tax at checkout</Label></div>
            </RadioGroup>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div><Label>Show Tax Breakdown on Invoice</Label><p className="text-sm text-muted-foreground">Display itemized tax on invoices</p></div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" />Tax Rates</CardTitle>
          <CardDescription>Manage tax rates for different product categories</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Rate</TableHead><TableHead>Type</TableHead><TableHead>Applied To</TableHead><TableHead>Status</TableHead><TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-6 w-16" /></TableCell>))}</TableRow>
                ))
              ) : taxes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tax configurations found</TableCell></TableRow>
              ) : (
                taxes.map(tax => (
                  <TableRow key={tax.id}>
                    <TableCell className="font-medium">{tax.name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono">{tax.rate}%</Badge></TableCell>
                    <TableCell className="capitalize">{tax.type}</TableCell>
                    <TableCell>
                      {tax.apply_to === 'all' ? <span className="text-muted-foreground">All Products</span> : (
                        <div className="flex flex-wrap gap-1">{tax.categories?.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div>
                      )}
                    </TableCell>
                    <TableCell><Switch checked={tax.status === 'active'} onCheckedChange={() => toggleStatus(tax.id, tax.status === 'active' ? 'inactive' : 'active')} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(tax)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteTax(tax.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
            <DialogDescription>Configure tax rate details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Standard VAT" /></div>
            <div className="space-y-2"><Label>Rate (%)</Label><Input type="number" step="0.01" value={formRate} onChange={e => setFormRate(Number(e.target.value))} /></div>
            <div className="space-y-2">
              <Label>Tax Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inclusive">Inclusive</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Apply To</Label>
              <Select value={formApplyTo} onValueChange={setFormApplyTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="specific">Specific Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !formName}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTax ? 'Save Changes' : 'Add Tax Rate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
