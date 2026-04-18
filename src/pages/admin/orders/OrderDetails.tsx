import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  Send,
  Edit,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdminOrders';
import { useCreateAuditLog } from '@/hooks/useSecurity';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const orderStatuses = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-orange-500' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-500' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'text-indigo-500' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'text-purple-500' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-500' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
];

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useAdminOrder(id || '');
  const updateStatus = useUpdateOrderStatus();
  const createAuditLog = useCreateAuditLog();

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatus.mutate(
      { id: order.id, status: selectedStatus },
      { 
        onSuccess: () => {
          // Record status update audit log
          createAuditLog.mutate({
            action: 'update_order_status',
            resource: 'orders',
            resource_id: order.id,
            details: { 
              order_number: order.order_number,
              previous_status: order.order_status,
              new_status: selectedStatus 
            },
            level: 'info'
          });
          setIsStatusDialogOpen(false);
        }
      }
    );
  };

  const handleCancelOrder = () => {
    updateStatus.mutate(
      { id: order.id, status: 'cancelled' },
      { 
        onSuccess: () => {
          // Record cancellation audit log
          createAuditLog.mutate({
            action: 'cancel_order',
            resource: 'orders',
            resource_id: order.id,
            details: { 
              order_number: order.order_number,
              previous_status: order.order_status
            },
            level: 'warning'
          });
          navigate('/admin/orders');
        }
      }
    );
  };

  const currentStatusIndex = orderStatuses.findIndex(s => s.value === order.order_status);
  const itemsTotal = order.items?.reduce((sum, item) => sum + item.total_price, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.order_number}</h1>
              <StatusBadge status={order.order_status as any} />
            </div>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy')} at {format(new Date(order.created_at), 'HH:mm')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Send Update
          </Button>
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={() => setSelectedStatus(order.order_status)}>
                <Edit className="h-4 w-4" />
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogDescription>
                  Change the status of order {order.order_number}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <status.icon className={cn('h-4 w-4', status.color)} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate} disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {orderStatuses.slice(0, -1).map((status, index) => {
              const isActive = index <= currentStatusIndex;
              const isCurrent = status.value === order.order_status;
              const StatusIcon = status.icon;

              return (
                <div key={status.value} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-sm font-medium',
                        isCurrent ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  {index < orderStatuses.length - 2 && (
                    <div
                      className={cn(
                        'h-1 flex-1 mx-2',
                        index < currentStatusIndex ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items Total</span>
                  <span>{formatCurrency(itemsTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer / Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{order.shipping_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${order.shipping_phone}`} className="hover:underline">
                  {order.shipping_phone}
                </a>
              </div>
              {order.shipping_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${order.shipping_email}`} className="hover:underline">
                    {order.shipping_email}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>
                  {order.shipping_street}, {order.shipping_city}, {order.shipping_district}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Order Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={order.order_status as any} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-sm">{format(new Date(order.updated_at), 'MMM dd, HH:mm')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-2">
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel order {order.order_number}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Order</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
