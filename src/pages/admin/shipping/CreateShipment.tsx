import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Package,
  Truck,
  Calculator,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCouriers, useShippableOrders, useCreateShipment } from '@/hooks/useShipping';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount);
};

export default function CreateShipment() {
  const navigate = useNavigate();
  const { data: couriers = [], isLoading: couriersLoading } = useCouriers();
  const { data: shippableOrders = [], isLoading: ordersLoading } = useShippableOrders();
  const createShipment = useCreateShipment();

  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);

  const filteredOrders = shippableOrders.filter(order => {
    if (!orderSearch) return true;
    const searchLower = orderSearch.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower)
    );
  });

  const selectedOrder = selectedOrderId ? shippableOrders.find(o => o.id === selectedOrderId) : null;
  const activeCouriers = couriers.filter(c => c.status === 'active');

  const calculateShippingCost = () => {
    if (!weight || !selectedCourier) return 0;
    const courier = couriers.find(c => c.id === selectedCourier);
    const baseRate = courier?.baseRate || 350;
    const perKgRate = courier?.perKgRate || 75;
    return baseRate + (parseFloat(weight) * perKgRate);
  };

  const shippingCost = calculateShippingCost();

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setStep(2);
  };

  const handleCreateShipment = () => {
    if (!selectedOrder || !selectedCourier || !weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    const dims = dimensions.length && dimensions.width && dimensions.height
      ? { length: parseFloat(dimensions.length), width: parseFloat(dimensions.width), height: parseFloat(dimensions.height) }
      : undefined;

    createShipment.mutate({
      order_id: selectedOrder.id,
      courier_id: selectedCourier,
      weight: parseFloat(weight),
      dimensions: dims,
      notes: notes || undefined,
      cod_amount: selectedOrder.total, // Assume COD for now
    }, {
      onSuccess: () => navigate('/admin/shipping'),
    });
  };

  const isLoading = couriersLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/shipping')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Shipment</h1>
          <p className="text-muted-foreground">Create a new shipment for an order</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[
          { num: 1, label: 'Select Order' },
          { num: 2, label: 'Courier & Details' },
          { num: 3, label: 'Confirm' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium', step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
              </div>
              <span className={cn('text-sm', step >= s.num ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
            </div>
            {i < 2 && <div className={cn('h-0.5 w-12 mx-2', step > s.num ? 'bg-primary' : 'bg-muted')} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Order</CardTitle>
            <CardDescription>Choose an order to create a shipment for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by order number or customer name..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="pl-10" />
            </div>
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No orders ready for shipping</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className={cn('flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors', selectedOrderId === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
                    onClick={() => handleSelectOrder(order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <Badge variant="outline" className="text-xs">COD</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && selectedOrder && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Order Details
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Change</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedOrder.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(selectedOrder.total)}</p>
                    <Badge className="bg-orange-500">COD: {formatCurrency(selectedOrder.total)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Courier</CardTitle>
                <CardDescription>Choose a courier partner for delivery</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedCourier} onValueChange={setSelectedCourier}>
                  <div className="space-y-3">
                    {activeCouriers.map(courier => (
                      <div key={courier.id} className={cn('flex items-center justify-between rounded-lg border p-4', selectedCourier === courier.id && 'border-primary bg-primary/5')}>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={courier.id} id={courier.id} />
                          <Label htmlFor={courier.id} className="cursor-pointer">
                            <p className="font-medium">{courier.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Zones: {courier.deliveryZones.slice(0, 3).join(', ')}
                              {courier.deliveryZones.length > 3 && ` +${courier.deliveryZones.length - 3} more`}
                            </p>
                          </Label>
                        </div>
                        <Truck className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package Details</CardTitle>
                <CardDescription>Enter package weight and dimensions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input id="weight" type="number" step="0.1" placeholder="e.g., 1.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Length (cm)</Label>
                    <Input type="number" placeholder="Length" value={dimensions.length} onChange={(e) => setDimensions(d => ({ ...d, length: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Width (cm)</Label>
                    <Input type="number" placeholder="Width" value={dimensions.width} onChange={(e) => setDimensions(d => ({ ...d, width: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="Height" value={dimensions.height} onChange={(e) => setDimensions(d => ({ ...d, height: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Special Instructions</Label>
                  <Textarea placeholder="Any special handling instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Shipping Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Rate</span>
                    <span>{formatCurrency(couriers.find(c => c.id === selectedCourier)?.baseRate || 350)}</span>
                  </div>
                  {weight && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weight ({weight} kg)</span>
                      <span>{formatCurrency(parseFloat(weight) * (couriers.find(c => c.id === selectedCourier)?.perKgRate || 75))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total Cost</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                </div>
                <Separator />
                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-sm font-medium text-orange-700">COD Amount</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(selectedOrder.total)}</p>
                </div>
              </CardContent>
            </Card>
            <Button className="w-full" size="lg" onClick={() => setStep(3)} disabled={!selectedCourier || !weight}>
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && selectedOrder && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Review Shipment</CardTitle>
              <CardDescription>Confirm the shipment details before creating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-medium">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courier</span>
                  <span>{couriers.find(c => c.id === selectedCourier)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span>{weight} kg</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping Cost</span>
                  <span className="font-medium">{formatCurrency(shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Amount</span>
                  <span className="font-medium text-orange-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Delivery Address</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{selectedOrder.customerName}</p>
              <p className="text-muted-foreground">{selectedOrder.customerPhone}</p>
              <p className="text-muted-foreground">{selectedOrder.customerAddress}</p>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1 gap-2" onClick={handleCreateShipment} disabled={createShipment.isPending}>
                  <Truck className="h-4 w-4" />
                  {createShipment.isPending ? 'Creating...' : 'Create Shipment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
