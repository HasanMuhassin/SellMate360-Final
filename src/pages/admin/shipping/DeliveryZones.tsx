import { useState } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  CreditCard,
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
import { useDeliveryZones, useCreateDeliveryZone, useUpdateDeliveryZone, useDeleteDeliveryZone } from '@/hooks/useShipping';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount);
};

interface ZoneFormData {
  name: string;
  districts: string;
  baseRate: string;
  perKgRate: string;
  estimatedDays: string;
  codAvailable: boolean;
  status: 'active' | 'inactive';
}

const initialFormData: ZoneFormData = { name: '', districts: '', baseRate: '', perKgRate: '', estimatedDays: '', codAvailable: true, status: 'active' };

export default function DeliveryZones() {
  const { data: zones = [], isLoading } = useDeliveryZones();
  const createZone = useCreateDeliveryZone();
  const updateZone = useUpdateDeliveryZone();
  const deleteZone = useDeleteDeliveryZone();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>(initialFormData);

  const filteredZones = zones.filter(zone => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return zone.name.toLowerCase().includes(searchLower) || zone.districts.some(d => d.toLowerCase().includes(searchLower));
  });

  const handleOpenDialog = (zoneId?: string) => {
    if (zoneId) {
      const zone = zones.find(z => z.id === zoneId);
      if (zone) {
        setFormData({
          name: zone.name,
          districts: zone.districts.join(', '),
          baseRate: zone.baseRate.toString(),
          perKgRate: zone.perKgRate.toString(),
          estimatedDays: zone.estimatedDays.toString(),
          codAvailable: zone.codAvailable,
          status: zone.status as 'active' | 'inactive',
        });
        setEditingId(zoneId);
      }
    } else {
      setFormData(initialFormData);
      setEditingId(null);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.baseRate) return;

    const districts = formData.districts.split(',').map(d => d.trim()).filter(Boolean);

    if (editingId) {
      updateZone.mutate({
        id: editingId,
        name: formData.name,
        districts,
        base_rate: parseFloat(formData.baseRate),
        per_kg_rate: parseFloat(formData.perKgRate) || 0,
        estimated_days: parseInt(formData.estimatedDays) || 3,
        status: formData.status,
      });
    } else {
      createZone.mutate({
        name: formData.name,
        districts,
        base_rate: parseFloat(formData.baseRate),
        per_kg_rate: parseFloat(formData.perKgRate) || 0,
        estimated_days: parseInt(formData.estimatedDays) || 3,
        status: formData.status,
      });
    }
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleDelete = (zoneId: string) => {
    deleteZone.mutate(zoneId);
  };

  const activeZones = zones.filter(z => z.status === 'active').length;
  const codEnabledZones = zones.filter(z => z.codAvailable).length;
  const avgBaseRate = zones.length > 0 ? Math.round(zones.reduce((sum, z) => sum + z.baseRate, 0) / zones.length) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Zones</h1>
          <p className="text-muted-foreground">Manage delivery areas and shipping rates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Zone' : 'Add Delivery Zone'}</DialogTitle>
              <DialogDescription>{editingId ? 'Update delivery zone details' : 'Create a new delivery zone with pricing'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Zone Name *</Label>
                <Input placeholder="e.g., Colombo Metro" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Districts/Areas</Label>
                <Textarea placeholder="Enter areas separated by commas" value={formData.districts} onChange={(e) => setFormData(d => ({ ...d, districts: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Rate (LKR) *</Label>
                  <Input type="number" placeholder="e.g., 350" value={formData.baseRate} onChange={(e) => setFormData(d => ({ ...d, baseRate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Per Kg Rate (LKR)</Label>
                  <Input type="number" placeholder="e.g., 50" value={formData.perKgRate} onChange={(e) => setFormData(d => ({ ...d, perKgRate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estimated Delivery Days</Label>
                <Input type="number" placeholder="e.g., 2" value={formData.estimatedDays} onChange={(e) => setFormData(d => ({ ...d, estimatedDays: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>COD Available</Label>
                  <p className="text-xs text-muted-foreground">Allow cash on delivery for this zone</p>
                </div>
                <Switch checked={formData.codAvailable} onCheckedChange={(checked) => setFormData(d => ({ ...d, codAvailable: checked }))} />
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
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Add'} Zone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Zones</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Zones</p>
                <p className="text-2xl font-bold text-green-600">{activeZones}</p>
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
                <p className="text-sm text-muted-foreground">COD Enabled</p>
                <p className="text-2xl font-bold text-orange-600">{codEnabledZones}</p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Base Rate</p>
                <p className="text-2xl font-bold">{formatCurrency(avgBaseRate)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search zones or districts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Districts</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Per Kg</TableHead>
                <TableHead>Est. Days</TableHead>
                <TableHead>COD</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredZones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No delivery zones found.</TableCell>
                </TableRow>
              ) : (
                filteredZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{zone.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {zone.districts.slice(0, 2).map(district => (
                          <Badge key={district} variant="secondary" className="text-xs">{district}</Badge>
                        ))}
                        {zone.districts.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{zone.districts.length - 2} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><span className="font-medium">{formatCurrency(zone.baseRate)}</span></TableCell>
                    <TableCell><span className="text-muted-foreground">{formatCurrency(zone.perKgRate)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{zone.estimatedDays} day{zone.estimatedDays > 1 ? 's' : ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {zone.codAvailable ? (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">Available</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not Available</Badge>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={zone.status as 'active' | 'inactive'} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(zone.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)}>
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
