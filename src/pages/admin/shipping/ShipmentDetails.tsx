import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  RotateCcw,
  Printer,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useShipmentDetail, useUpdateShipmentStatus } from '@/hooks/useShipping';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount);
};

type ShipmentStatus = 'pending' | 'picked' | 'in_transit' | 'delivered' | 'returned';

const statusConfig: Record<ShipmentStatus, { label: string; icon: typeof Package; color: string }> = {
  pending: { label: 'Pending Pickup', icon: Clock, color: 'text-orange-500' },
  picked: { label: 'Picked Up', icon: Package, color: 'text-blue-500' },
  in_transit: { label: 'In Transit', icon: Truck, color: 'text-purple-500' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-500' },
  returned: { label: 'Returned', icon: RotateCcw, color: 'text-red-500' },
};

const statusOrder: ShipmentStatus[] = ['pending', 'picked', 'in_transit', 'delivered'];

export default function ShipmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: shipment, isLoading } = useShipmentDetail(id);
  const updateStatus = useUpdateShipmentStatus();

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus>('pending');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Truck className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Shipment Not Found</h2>
        <p className="text-muted-foreground mb-4">The shipment you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/admin/shipping')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shipments
        </Button>
      </div>
    );
  }

  const currentStatus = statusConfig[shipment.status as ShipmentStatus] || statusConfig.pending;
  const CurrentStatusIcon = currentStatus.icon;
  const currentStatusIndex = statusOrder.indexOf(shipment.status as ShipmentStatus);

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(shipment.trackingNumber);
    toast.success('Tracking number copied to clipboard');
  };

  const handleStatusUpdate = () => {
    updateStatus.mutate({ id: shipment.id, status: selectedStatus });
    setIsStatusDialogOpen(false);
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Label - ${shipment.trackingNumber}</title>
          <style>
            @page { size: 100mm 150mm; margin: 0; }
            body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 10mm; color: #000; }
            .label-box { border: 2px solid #000; padding: 5mm; height: calc(150mm - 20mm - 10mm); display: flex; flex-direction: column; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 3mm; margin-bottom: 5mm; }
            .logo { font-size: 20pt; font-weight: 900; letter-spacing: -1px; }
            .courier-badge { background: #000; color: #fff; padding: 1mm 3mm; font-weight: bold; border-radius: 1mm; }
            
            .tracking-section { text-align: center; margin: 5mm 0; padding: 5mm; border: 1px dashed #000; }
            .tracking-number { font-size: 18pt; font-weight: bold; font-family: monospace; letter-spacing: 2px; }
            .barcode-placeholder { height: 15mm; background: linear-gradient(90deg, #000 2px, transparent 2px); background-size: 4px 100%; margin-top: 2mm; }
            
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 5mm; }
            .info-group { margin-bottom: 4mm; }
            .label { font-size: 8pt; text-transform: uppercase; font-weight: bold; color: #666; margin-bottom: 1mm; }
            .value { font-size: 11pt; font-weight: bold; line-height: 1.2; }
            
            .address-box { border-top: 1px solid #000; padding-top: 4mm; margin-top: auto; }
            .cod-box { background: #000; color: #fff; padding: 4mm; text-align: center; margin-top: 5mm; border-radius: 1mm; }
            .cod-label { font-size: 9pt; text-transform: uppercase; }
            .cod-value { font-size: 22pt; font-weight: 900; }
            
            .footer { margin-top: 5mm; font-size: 7pt; text-align: center; color: #999; }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="header">
              <div class="logo">SELLMATE360</div>
              <div class="courier-badge">${shipment.courier.toUpperCase()}</div>
            </div>

            <div class="info-grid">
              <div class="info-group">
                <div class="label">Order Number</div>
                <div class="value">#${shipment.orderNumber}</div>
              </div>
              <div class="info-group">
                <div class="label">Date</div>
                <div class="value">${format(new Date(shipment.createdAt), 'dd MMM yyyy')}</div>
              </div>
            </div>

            <div class="tracking-section">
              <div class="label">Tracking Number</div>
              <div class="tracking-number">${shipment.trackingNumber}</div>
              <div class="barcode-placeholder"></div>
            </div>

            <div class="info-group">
              <div class="label">Ship To</div>
              <div class="value" style="font-size: 14pt;">${shipment.customerName}</div>
              <div class="value">${shipment.customerPhone}</div>
            </div>

            <div class="address-box">
              <div class="label">Delivery Address</div>
              <div class="value">${shipment.customerAddress}</div>
            </div>

            ${shipment.codAmount && shipment.codAmount > 0 ? `
              <div class="cod-box">
                <div class="cod-label">Cash on Delivery (COD)</div>
                <div class="cod-value">LKR ${shipment.codAmount.toLocaleString()}</div>
              </div>
            ` : `
              <div class="cod-box" style="background: #eee; color: #000; border: 1px solid #000;">
                <div class="cod-label">Payment Status</div>
                <div class="cod-value" style="font-size: 16pt;">PREPAID / NO COD</div>
              </div>
            `}

            <div class="footer">
              Generated by SellMate360 Logistics - ${new Date().toLocaleString()}
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(labelHtml);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/shipping')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground font-mono">{shipment.trackingNumber}</h1>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyTracking}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              Order {shipment.orderNumber} • Created {format(new Date(shipment.createdAt), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Tracking
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrintLabel}>
            <Printer className="h-4 w-4" />
            Print Label
          </Button>
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={() => setSelectedStatus(shipment.status as ShipmentStatus)}>
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Shipment Status</DialogTitle>
                <DialogDescription>Manually update the status of this shipment</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ShipmentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn('h-4 w-4', config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStatusUpdate} disabled={updateStatus.isPending}>Update Status</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Progress */}
      {shipment.status !== 'returned' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {statusOrder.map((status, index) => {
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                const isActive = index <= currentStatusIndex;
                const isCurrent = status === shipment.status;
                return (
                  <div key={status} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2', isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground')}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <span className={cn('mt-2 text-sm font-medium', isCurrent ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground')}>
                        {config.label}
                      </span>
                    </div>
                    {index < statusOrder.length - 1 && (
                      <div className={cn('h-1 flex-1 mx-2', index < currentStatusIndex ? 'bg-primary' : 'bg-muted')} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {shipment.status === 'returned' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-red-700">Shipment Returned</p>
                <p className="text-sm text-red-600">This shipment has been returned to sender</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Tracking History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Tracking History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.trackingHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tracking events yet</p>
              ) : (
                <div className="relative space-y-4">
                  {shipment.trackingHistory.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="relative flex flex-col items-center">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', index === shipment.trackingHistory.length - 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        {index < shipment.trackingHistory.length - 1 && (
                          <div className="h-full w-0.5 bg-border absolute top-8" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{event.status.replace('_', ' ')}</p>
                          {event.location && <Badge variant="outline" className="text-xs">{event.location}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Current Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-full bg-muted', currentStatus.color)}>
                  <CurrentStatusIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{currentStatus.label}</p>
                  {shipment.estimatedDelivery && shipment.status !== 'delivered' && (
                    <p className="text-sm text-muted-foreground">
                      Est. delivery: {format(new Date(shipment.estimatedDelivery), 'MMM dd, yyyy')}
                    </p>
                  )}
                  {shipment.actualDelivery && (
                    <p className="text-sm text-green-600">
                      Delivered: {format(new Date(shipment.actualDelivery), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Courier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner</span>
                <Badge variant="outline">{shipment.courier}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tracking #</span>
                <span className="font-mono text-sm">{shipment.trackingNumber}</span>
              </div>
              {shipment.weight && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span>{shipment.weight} kg</span>
                </div>
              )}
              <Separator />
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Track on {shipment.courier}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Delivery Address</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium">{shipment.customerName}</p>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${shipment.customerPhone}`} className="hover:underline">{shipment.customerPhone}</a>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{shipment.customerAddress}</span>
              </div>
            </CardContent>
          </Card>

          {shipment.codAmount && shipment.codAmount > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader><CardTitle className="text-orange-700">Cash on Delivery</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(shipment.codAmount)}</p>
                <p className="text-sm text-orange-600 mt-1">
                  {shipment.status === 'delivered' ? 'Collected' : 'To be collected'}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => navigate(`/admin/orders/${shipment.orderId}`)}>
                View Order Details
              </Button>
              <Button variant="outline" className="w-full">Contact Courier</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
