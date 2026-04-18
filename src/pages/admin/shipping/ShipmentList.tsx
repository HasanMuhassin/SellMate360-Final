import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search,
  Download,
  Eye,
  Truck,
  Package,
  Clock,
  CheckCircle,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipments, useCouriers, getShippingStatsFromData } from '@/hooks/useShipping';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
  }).format(amount);
};

type ShipmentStatus = 'pending' | 'picked' | 'in_transit' | 'delivered' | 'returned';

const statusConfig: Record<ShipmentStatus, { label: string; icon: typeof Package; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-orange-100 text-orange-700 border-orange-200' },
  picked: { label: 'Picked Up', icon: Package, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_transit: { label: 'In Transit', icon: Truck, className: 'bg-purple-100 text-purple-700 border-purple-200' },
  delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-700 border-green-200' },
  returned: { label: 'Returned', icon: RotateCcw, className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function ShipmentList() {
  const navigate = useNavigate();
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments();
  const { data: couriers = [] } = useCouriers();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const stats = getShippingStatsFromData(shipments, couriers, []);

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          shipment.orderNumber.toLowerCase().includes(searchLower) ||
          shipment.trackingNumber.toLowerCase().includes(searchLower) ||
          shipment.customerName.toLowerCase().includes(searchLower) ||
          shipment.customerPhone.includes(search);
        if (!matchesSearch) return false;
      }
      if (statusFilter !== 'all' && shipment.status !== statusFilter) return false;
      if (courierFilter !== 'all' && shipment.courier !== courierFilter) return false;
      return true;
    });
  }, [shipments, search, statusFilter, courierFilter]);

  const paginatedShipments = filteredShipments.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredShipments.length / perPage);

  if (shipmentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shipments</h1>
          <p className="text-muted-foreground">Manage and track all shipments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => navigate('/admin/shipping/create')}>
            <Plus className="h-4 w-4" />
            Create Shipment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-orange-500/50" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-purple-500/50" onClick={() => setStatusFilter('in_transit')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold text-purple-600">{stats.inTransit}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50" onClick={() => setStatusFilter('delivered')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500/50" onClick={() => setStatusFilter('returned')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold text-red-600">{stats.returned}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order #, tracking #, or customer..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="picked">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courierFilter} onValueChange={(v) => { setCourierFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Couriers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Couriers</SelectItem>
                {couriers.map(courier => (
                  <SelectItem key={courier.id} value={courier.name}>{courier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'all' || courierFilter !== 'all') && (
            <div className="mt-3 flex flex-wrap gap-2">
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {courierFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Courier: {courierFilter}
                  <button onClick={() => setCourierFilter('all')} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter('all'); setCourierFilter('all'); }}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking #</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>COD Amount</TableHead>
                <TableHead>Est. Delivery</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No shipments found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedShipments.map((shipment) => {
                  const status = statusConfig[shipment.status as ShipmentStatus] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow
                      key={shipment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/shipping/${shipment.id}`)}
                    >
                      <TableCell>
                        <span className="font-mono text-sm font-medium">{shipment.trackingNumber}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{shipment.orderNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{shipment.customerName}</p>
                          <p className="text-sm text-muted-foreground">{shipment.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shipment.courier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('gap-1', status.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {shipment.codAmount ? (
                          <span className="font-medium text-orange-600">{formatCurrency(shipment.codAmount)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {shipment.estimatedDelivery ? (
                          format(new Date(shipment.estimatedDelivery), 'MMM dd, yyyy')
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(shipment.createdAt), 'MMM dd, yyyy')}</p>
                          <p className="text-muted-foreground">{format(new Date(shipment.createdAt), 'HH:mm')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/shipping/${shipment.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredShipments.length)} of{' '}
              {filteredShipments.length} shipments
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
