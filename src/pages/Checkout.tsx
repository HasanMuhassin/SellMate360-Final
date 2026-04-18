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

// Fallback payment methods if none configured
const fallbackPaymentMethods = [
  { id: 'cod', name: 'Cash on Delivery', code: 'cod', type: 'cod' as const, instructions: 'Pay when you receive your order', processing_fee: 0, fee_type: 'fixed' as const, bank_name: null, account_number: null, account_name: null, bank_branch: null, min_order: null, max_order: null },
  { id: 'bank', name: 'Bank Deposit', code: 'bank', type: 'bank' as const, instructions: 'Transfer to our bank account', processing_fee: 0, fee_type: 'fixed' as const, bank_name: null, account_number: null, account_name: null, bank_branch: null, min_order: null, max_order: null },
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

  // Update default payment method when live data loads
  useEffect(() => {
    if (livePaymentMethods.length > 0 && !livePaymentMethods.find(m => m.code === formData.paymentMethod)) {
      setFormData(prev => ({ ...prev, paymentMethod: livePaymentMethods[0].code }));
    }
  }, [livePaymentMethods]);

  // Auto-fill from profile and default address
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

  // Calculate tax from active tax configs
  const taxAmount = liveTaxConfigs.reduce((total, tax) => {
    if (tax.type === 'exclusive') {
      return total + (subtotal * tax.rate / 100);
    }
    return total; // Inclusive tax is already in product price
  }, 0);

  // Calculate processing fee for selected payment method
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
      const { data: { user } } = await supabase.auth.getUser();

      let customerId: string;

      if (user) {
        const session = (await supabase.auth.getSession()).data.session;
        const functionsUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-or-create-customer`;
        
        const res = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || user.email || null,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to create customer');
        customerId = data.customer_id;
      } else {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', formData.phone)
          .maybeSingle();
        customerId = existingCustomer?.id;
      }

      const orderPayload = {
        order_number: orderNumber,
        customer_id: customerId || null,
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
        product_sku: '',
        product_name: item.product.name,
        product_image: item.product.images?.[0] || null,
        quantity: item.quantity,
        unit_price: item.product.price,
        discount: 0,
        total: item.product.price * item.quantity,
      }));

      const session = (await supabase.auth.getSession()).data.session;
      const createOrderUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/create-order`;

      const orderRes = await fetch(createOrderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ order: orderPayload, items: itemsPayload }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to create order');
      }

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
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Add some products before checkout</p>
            <Button asChild><Link to="/shop">Browse Products</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
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
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Customer Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} required className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="mt-1" />
                  </div>
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Address
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="district">District *</Label>
                    <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)} required>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} required className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input id="street" value={formData.street} onChange={(e) => handleInputChange('street', e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input id="zipCode" value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} className="mt-1" />
                  </div>
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  className="space-y-3"
                >
                  {activePaymentMethods.map((method) => {
                    const Icon = paymentIcons[method.type] || CreditCard;
                    const feeText = method.processing_fee > 0
                      ? method.fee_type === 'percentage'
                        ? ` (+${method.processing_fee}%)`
                        : ` (+Rs. ${method.processing_fee})`
                      : '';
                    return (
                      <div
                        key={method.code}
                        className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                          formData.paymentMethod === method.code
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <RadioGroupItem value={method.code} id={method.code} />
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <Label htmlFor={method.code} className="font-medium cursor-pointer">
                            {method.name}{feeText}
                          </Label>
                          {method.instructions && (
                            <p className="text-sm text-muted-foreground">{method.instructions}</p>
                          )}
                          {method.type === 'bank' && method.bank_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {method.bank_name} - {method.account_number} ({method.account_name})
                            </p>
                          )}
                        </div>
                        {formData.paymentMethod === method.code && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {state.items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-primary">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code */}
                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          {appliedCoupon.coupon_code} applied
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          You save {formatPrice(appliedCoupon.discount_amount)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700">Remove</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1" />
                      <Button variant="outline" onClick={handleApplyCoupon} disabled={validateCouponMutation.isPending}>
                        {validateCouponMutation.isPending ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>{formData.district ? formatPrice(deliveryFee) : 'Select district'}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatPrice(Math.round(taxAmount))}</span>
                    </div>
                  )}
                  {processingFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span>{formatPrice(Math.round(processingFee))}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon Discount</span>
                      <span>-{formatPrice(Math.round(couponDiscount))}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(Math.round(total))}</span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || !formData.district}
                >
                  {isSubmitting ? 'Processing...' : (
                    <>Place Order<ChevronRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  By placing your order, you agree to our Terms & Conditions
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
