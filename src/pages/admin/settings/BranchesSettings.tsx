import { useState } from 'react';
import { Plus, Search, MapPin, Phone, Clock, Store, Warehouse, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { useBranches, Branch } from '@/hooks/useStoreSettings';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function BranchesSettingsPage() {
  const { branches, isLoading, upsertBranch, toggleStatus, deleteBranch } = useBranches();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', code: '', type: 'store' as string, address: '', city: '', district: '',
    phone: '', email: '', manager: '', is_pickup_location: true, accepts_returns: true,
    opening_hours: {} as Record<string, { open: string; close: string; closed?: boolean }>,
  });

  const filteredBranches = branches.filter(
    b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setEditingBranch(null);
    const defaultHours: Record<string, { open: string; close: string; closed?: boolean }> = {};
    days.forEach(d => { defaultHours[d] = { open: '09:00', close: '18:00' }; });
    setForm({ name: '', code: '', type: 'store', address: '', city: '', district: '', phone: '', email: '', manager: '', is_pickup_location: true, accepts_returns: true, opening_hours: defaultHours });
    setIsDialogOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditingBranch(b);
    setForm({
      name: b.name, code: b.code, type: b.type, address: b.address, city: b.city, district: b.district,
      phone: b.phone, email: b.email, manager: b.manager, is_pickup_location: b.is_pickup_location,
      accepts_returns: b.accepts_returns, opening_hours: b.opening_hours || {},
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await upsertBranch({
      ...(editingBranch ? { id: editingBranch.id } : {}),
      ...form,
      type: form.type as 'store' | 'warehouse',
    });
    setIsSaving(false);
    if (result) setIsDialogOpen(false);
  };

  const formatOpeningHours = (hours: Record<string, { open: string; close: string; closed?: boolean }>) => {
    const weekdays = hours?.monday;
    if (!weekdays || weekdays.closed) return 'Closed';
    return `${weekdays.open} - ${weekdays.close}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branches</h1>
          <p className="text-muted-foreground">Manage store locations and warehouses</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Branch</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search branches..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.length === 0 ? (
            <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No branches found. Add your first branch.</CardContent></Card>
          ) : (
            filteredBranches.map(branch => (
              <Card key={branch.id} className={branch.status === 'inactive' ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {branch.type === 'store' ? <Store className="h-5 w-5 text-primary" /> : <Warehouse className="h-5 w-5 text-orange-500" />}
                      <div>
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <CardDescription>{branch.code}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(branch)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(branch.id, branch.status === 'active' ? 'inactive' : 'active')}>
                          {branch.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteBranch(branch.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div><p>{branch.address}</p><p className="text-muted-foreground">{branch.city}, {branch.district}</p></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{branch.phone}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>Weekdays: {formatOpeningHours(branch.opening_hours)}</span></div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>{branch.status}</Badge>
                    {branch.is_pickup_location && <Badge variant="outline">Pickup</Badge>}
                    {branch.accepts_returns && <Badge variant="outline">Returns</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
            <DialogDescription>{editingBranch ? 'Update branch details' : 'Add a new store location or warehouse'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Main Store - Colombo" /></div>
              <div className="space-y-2"><Label>Branch Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g., COL-01" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="store">Store</SelectItem><SelectItem value="warehouse">Warehouse</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Manager</Label><Input value={form.manager} onChange={e => setForm(p => ({ ...p, manager: e.target.value }))} placeholder="Manager name" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="space-y-2"><Label>District</Label><Input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="branch@example.com" /></div>
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_pickup_location} onCheckedChange={v => setForm(p => ({ ...p, is_pickup_location: v }))} /><Label>Pickup Location</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.accepts_returns} onCheckedChange={v => setForm(p => ({ ...p, accepts_returns: v }))} /><Label>Accept Returns</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBranch ? 'Save Changes' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
