import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface TrackedOrder {
  order_number: string;
  order_status: string;
  total: number;
  created_at: string;
  shipping_name: string;
  shipping_district: string;
  shipping_city: string;
  shipping_street: string;
  items: { product_name: string; quantity: number; unit_price: number }[];
}

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out-for-delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [contactInfo, setContactInfo] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const orderQuery = orderNumber.trim().toUpperCase();
    const contactQuery = contactInfo.trim();
    
    if (!orderQuery || !contactQuery) return;

    setIsSearching(true);
    setNotFound(false);
    setOrder(null);

    try {
      // Secure backend RPC call matching order number AND phone/email
      const { data: foundOrder, error } = await supabase.rpc('get_guest_order_tracking', {
        p_order_number: orderQuery,
        p_contact: contactQuery
      });

      if (error) throw error;

      if (!foundOrder) {
        setNotFound(true);
        return;
      }

      setOrder(foundOrder as TrackedOrder);
    } catch (error) {
      console.error('Track order error:', error);
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search if order number passed via URL
  useEffect(() => {
    if (orderNumber && contactInfo) {
      handleSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIndex = (status: string) => {
    const idx = statusSteps.findIndex((step) => step.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 py-12">
        <div className="container text-center">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order number or phone number to track your delivery
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Search Form */}
        <div className="max-w-md mx-auto mb-12">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g., SM12345678"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="contactInfo">Phone Number or Email</Label>
                <Input
                  id="contactInfo"
                  placeholder="Used during checkout (e.g., 0771234567)"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSearching || !orderNumber || !contactInfo}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Not Found */}
        {notFound && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-8"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Order not found</h3>
            <p className="text-muted-foreground text-sm">
              Please check your order number and try again, or contact support for help.
            </p>
          </motion.div>
        )}

        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            {/* Order Info */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="text-xl font-bold text-primary">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="text-sm text-muted-foreground mb-1">Shipping to</p>
                <p className="font-medium">{order.shipping_name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_street}, {order.shipping_city}, {order.shipping_district}
                </p>
              </div>

              {/* Order Items */}
              {order.items.length > 0 && (
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-6">Delivery Status</h3>

              {order.order_status === 'cancelled' ? (
                <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Order Cancelled</p>
                    <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-5 top-5 w-0.5 h-[calc(100%-40px)] bg-muted">
                    <div
                      className="absolute top-0 left-0 w-full bg-primary transition-all duration-500"
                      style={{
                        height: `${(getStatusIndex(order.order_status) / (statusSteps.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-8">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= getStatusIndex(order.order_status);
                      const isCurrent = step.key === order.order_status;

                      return (
                        <div key={step.key} className="flex items-start gap-4 relative">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors',
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            <step.icon className="h-5 w-5" />
                          </div>
                          <div className={cn('pt-2', isCurrent && 'font-medium')}>
                            <p className={isCompleted ? 'text-foreground' : 'text-muted-foreground'}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-primary mt-1">Current Status</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
