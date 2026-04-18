import { useState } from 'react';
import {
  Plus,
  Search,
  Truck,
  Edit,
  Trash2,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useCouriers, useCreateCourier, useUpdateCourier, useDeleteCourier } from '@/hooks/useShipping';

interface CourierFormData {
  name: string;
  code: string;
  apiKey: string;
  deliveryZones: string;
  status: 'active' | 'inactive';
}

const initialFormData: CourierFormData = { name: '', code: '', apiKey: '', deliveryZones: '', status: 'active' };

export default function CourierPartners() {
  const { data: couriers = [], isLoading } = useCouriers();
  const createCourier = useCreateCourier();
  const updateCourier = useUpdateCourier();
  const deleteCourier = useDeleteCourier();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourierFormData>(initialFormData);

  const filteredCouriers = couriers.filter(courier => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return courier.name.toLowerCase().includes(searchLower) || courier.code.toLowerCase().includes(searchLower);
  });

  const handleOpenDialog = (courierId?: string) => {
    if (courierId) {
      const courier = couriers.find(c => c.id === courierId);
      if (courier) {
        setFormData({
          name: courier.name,
          code: courier.code,
          apiKey: '',
          deliveryZones: courier.deliveryZones.join(', '),
          status: courier.status as 'active' | 'inactive',
        });
        setEditingId(courierId);
      }
    } else {
      setFormData(initialFormData);
      setEditingId(null);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;

    const zones = formData.deliveryZones.split(',').map(z => z.trim()).filter(Boolean);

    if (editingId) {
      updateCourier.mutate({
        id: editingId,
        name: formData.name,
        code: formData.code,
        delivery_zones: zones,
        status: formData.status,
        ...(formData.apiKey ? { api_key: formData.apiKey } : {}),
      });
    } else {
      createCourier.mutate({
        name: formData.name,
        code: formData.code,
        delivery_zones: zones,
        status: formData.status,
        ...(formData.apiKey ? { api_key: formData.apiKey } : {}),
      });
    }
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleDelete = (courierId: string) => {
    deleteCourier.mutate(courierId);
  };

  const handleToggleStatus = (courierId: string) => {
    const courier = couriers.find(c => c.id === courierId);
    if (courier) {
      updateCourier.mutate({
        id: courierId,
        status: courier.status === 'active' ? 'inactive' : 'active',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courier Partners</h1>
          <p className="text-muted-foreground">Manage delivery courier integrations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Add Courier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Courier' : 'Add Courier Partner'}</DialogTitle>
              <DialogDescription>{editingId ? 'Update courier partner details' : 'Add a new courier integration'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Courier Name *</Label>
                <Input placeholder="e.g., DomEx" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Courier Code *</Label>
                <Input placeholder="e.g., DOMEX" value={formData.code} onChange={(e) => setFormData(d => ({ ...d, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="Enter API key for integration" value={formData.apiKey} onChange={(e) => setFormData(d => ({ ...d, apiKey: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Required for automated tracking updates</p>
              </div>
              <div className="space-y-2">
                <Label>Delivery Zones</Label>
                <Textarea placeholder="Enter zones separated by commas" value={formData.deliveryZones} onChange={(e) => setFormData(d => ({ ...d, deliveryZones: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: 'active' | 'inactive') => setFormData(d => ({ ...d, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Add'} Courier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Partners</p>
                <p className="text-2xl font-bold">{couriers.length}</p>
              </div>
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{couriers.filter(c => c.status === 'active').length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With API Integration</p>
                <p className="text-2xl font-bold text-blue-600">{couriers.filter(c => c.hasApiKey).length}</p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search couriers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Courier</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Delivery Zones</TableHead>
                <TableHead>API Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCouriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No courier partners found.</TableCell>
                </TableRow>
              ) : (
                filteredCouriers.map((courier) => (
                  <TableRow key={courier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Truck className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{courier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-mono">{courier.code}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {courier.deliveryZones.slice(0, 3).map(zone => (
                          <Badge key={zone} variant="secondary" className="text-xs">{zone}</Badge>
                        ))}
                        {courier.deliveryZones.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{courier.deliveryZones.length - 3} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {courier.hasApiKey ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Key className="h-3 w-3 mr-1" />Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not Configured</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={courier.status === 'active'} onCheckedChange={() => handleToggleStatus(courier.id)} />
                        <StatusBadge status={courier.status as 'active' | 'inactive'} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(courier.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(courier.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
