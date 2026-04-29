import { useState, useEffect } from 'react';
import { useValidateCoupon } from '@/hooks/usePromotions';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  CreditCard,
  Building,
  Banknote,
  Truck,
  Check,
  ShoppingBag,
  Wallet,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCustomerAddresses } from '@/hooks/useCustomerAddresses';
import { useSession, useProfile } from '@/hooks/useAuth';
import { usePublicPaymentMethods, usePublicTaxConfigs } from '@/hooks/usePublicStoreSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Mullaitivu', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];

const paymentIcons: Record<string, any> = {
  cod: Banknote,
  bank: Building,
  card: CreditCard,
  wallet: Wallet,
};

const fallbackPaymentMethods = [
  { id: 'cod', name: 'Cash on Delivery', code: 'cod', type: 'cod' as const, instructions: 'Pay when you receive your order', processing_fee: 0, fee_type: 'fixed' as const },
  { id: 'bank', name: 'Bank Deposit', code: 'bank', type: 'bank' as const, instructions: 'Transfer to our bank account', processing_fee: 0, fee_type: 'fixed' as const },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { state, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: addresses = [] } = useCustomerAddresses();
  const { methods: livePaymentMethods } = usePublicPaymentMethods();
  const { taxes: liveTaxConfigs } = usePublicTaxConfigs();
  const validateCouponMutation = useValidateCoupon();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon_id: string; discount_amount: number; coupon_code: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePaymentMethods = livePaymentMethods.length > 0 ? livePaymentMethods : fallbackPaymentMethods;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    district: '',
    city: '',
    street: '',
    zipCode: '',
    paymentMethod: activePaymentMethods[0]?.code || 'cod',
  });

  useEffect(() => {
    if (livePaymentMethods.length > 0 && !livePaymentMethods.find(m => m.code === formData.paymentMethod)) {
      setFormData(prev => ({ ...prev, paymentMethod: livePaymentMethods[0].code }));
    }
  }, [livePaymentMethods]);

  useEffect(() => {
    const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
    setFormData((prev) => ({
      ...prev,
      name: prev.name || profile?.name || user?.user_metadata?.name || '',
      phone: prev.phone || profile?.phone || '',
      email: prev.email || user?.email || '',
      district: prev.district || defaultAddr?.district || '',
      city: prev.city || defaultAddr?.city || '',
      street: prev.street || defaultAddr?.street || '',
      zipCode: prev.zipCode || defaultAddr?.zip_code || '',
    }));
  }, [profile, user, addresses]);

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

  const deliveryFee =
    formData.district === 'Colombo' || formData.district === 'Gampaha'
      ? 350
      : formData.district
      ? 500
      : 0;

  const taxAmount = liveTaxConfigs.reduce((total, tax) => {
    if (tax.type === 'exclusive') {
      return total + (subtotal * tax.rate / 100);
    }
    return total;
  }, 0);

  const selectedMethod = activePaymentMethods.find(m => m.code === formData.paymentMethod);
  const processingFee = selectedMethod
    ? selectedMethod.fee_type === 'percentage'
      ? subtotal * (selectedMethod.processing_fee / 100)
      : selectedMethod.processing_fee
    : 0;

  const couponDiscount = appliedCoupon?.discount_amount || 0;
  const total = subtotal + deliveryFee + taxAmount + processingFee - couponDiscount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    validateCouponMutation.mutate(
      { code: couponCode, order_total: subtotal },
      {
        onSuccess: (data) => {
          if (data.is_valid) {
            setAppliedCoupon({ coupon_id: data.coupon_id, discount_amount: data.discount_amount, coupon_code: data.coupon_code });
            toast({ title: 'Coupon applied!', description: `You saved Rs. ${data.discount_amount.toLocaleString()}` });
          } else {
            setCouponError(data.error_message || 'Invalid coupon');
          }
        },
        onError: () => setCouponError('Failed to validate coupon'),
      }
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderNumber = 'SM' + Date.now().toString().slice(-8);
      
      // 1. Get or Create Customer (Direct DB)
      let customerId: string | null = null;
      if (user) {
        // Check if customer exists
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          customerId = existing.id;
        } else {
          // Create new customer
          const { data: newCust, error: custErr } = await supabase
            .from('customers')
            .insert({
              user_id: user.id,
              name: formData.name,
              phone: formData.phone,
              email: formData.email || user.email,
            })
            .select('id')
            .single();
          if (custErr) throw custErr;
          customerId = newCust.id;
        }
      } else {
        // Guest: Check by phone
        const { data: byPhone } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', formData.phone)
          .maybeSingle();
        
        if (byPhone) {
          customerId = byPhone.id;
        } else {
          // Create guest customer
          const { data: guestCust, error: guestErr } = await supabase
            .from('customers')
            .insert({
              name: formData.name,
              phone: formData.phone,
              email: formData.email,
            })
            .select('id')
            .single();
          if (guestErr) throw guestErr;
          customerId = guestCust.id;
        }
      }

      // 2. Prepare Payload
      const orderPayload = {
        order_number: orderNumber,
        customer_id: customerId,
        order_status: 'pending',
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        discount: couponDiscount,
        tax: taxAmount,
        total: total,
        payment_method: formData.paymentMethod,
        payment_status: 'pending',
        channel: 'online',
        shipping_name: formData.name,
        shipping_phone: formData.phone,
        shipping_email: formData.email || null,
        shipping_district: formData.district,
        shipping_city: formData.city,
        shipping_street: formData.street,
        shipping_zip_code: formData.zipCode || null,
      };

      const itemsPayload = state.items.map((item) => ({
        product_id: item.product.id,
        product_sku: item.product.sku || '',
        product_name: item.product.name,
        product_image: item.product.images?.[0] || null,
        quantity: item.quantity,
        unit_price: item.product.price,
        discount: 0,
        total: item.product.price * item.quantity,
      }));

      // 3. Place Order via Atomic RPC
      const { data: result, error: orderErr } = await supabase.rpc('create_order_v2', {
        p_order: orderPayload,
        p_items: itemsPayload
      });

      if (orderErr) throw orderErr;

      toast({ title: 'Order placed!', description: `Order #${orderNumber} has been created.` });
      clearCart();
      navigate(`/order-confirmation/${orderNumber}`);
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: 'Order failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <Button asChild><Link to="/shop">Browse Products</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/50 py-4">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/cart" className="hover:text-primary transition-colors">Cart</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Customer Info */}
              <div className="bg-card rounded-xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold">Customer Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} required />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card rounded-xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Address
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)} required>
                      <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} required />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input id="street" value={formData.street} onChange={(e) => handleInputChange('street', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input id="zipCode" value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold">Payment Method</h2>
                <RadioGroup value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)} className="space-y-3">
                  {activePaymentMethods.map((method) => {
                    const Icon = paymentIcons[method.code] || CreditCard;
                    return (
                      <div key={method.code} className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${formData.paymentMethod === method.code ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <RadioGroupItem value={method.code} id={method.code} />
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <Label htmlFor={method.code} className="font-medium cursor-pointer">{method.name}</Label>
                          {method.instructions && <p className="text-sm text-muted-foreground">{method.instructions}</p>}
                        </div>
                        {formData.paymentMethod === method.code && <Check className="h-5 w-5 text-primary" />}
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-xl border p-6 space-y-6">
                <h2 className="text-lg font-bold">Order Summary</h2>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {state.items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery</span>
                    <span>{formData.district ? formatPrice(deliveryFee) : '—'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total</span>
                    <span>{formatPrice(Math.round(total))}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isSubmitting || !formData.district}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Placing Order...</> : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
