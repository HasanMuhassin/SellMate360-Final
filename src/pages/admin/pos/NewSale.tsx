import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Search, Plus, Minus, Trash2, Barcode, CreditCard, Banknote, SplitSquareHorizontal,
  Percent, Receipt, UserCircle, Tag, CheckCircle, X, Calculator, Loader2, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { useActiveShift, useOpenShift, useCreatePOSTransaction } from '@/hooks/usePOS';

interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function NewSale() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [discountDialog, setDiscountDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [shiftDialog, setShiftDialog] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [openingBalance, setOpeningBalance] = useState('10000');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Live data hooks
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: activeShift, isLoading: shiftLoading } = useActiveShift();
  const openShift = useOpenShift();
  const createTransaction = useCreatePOSTransaction();

  // Filter products
  const filteredProducts = useMemo(() => {
    const activeProducts = products.filter(p => p.status === 'active');
    if (!searchTerm) return activeProducts;
    const search = searchTerm.toLowerCase();
    return activeProducts.filter(p => 
      p.name.toLowerCase().includes(search) || 
      (p.sku && p.sku.toLowerCase().includes(search))
    );
  }, [searchTerm, products]);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountValue = discountAmount || (subtotal * discountPercent / 100);
  const total = Math.max(0, subtotal - discountValue);
  const change = paymentMethod === 'cash' ? (parseFloat(cashReceived) || 0) - total : 0;

  const addToCart = (product: typeof products[0]) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        sku: product.sku || '', 
        name: product.name, 
        price: product.selling_price, 
        quantity: 1,
        maxStock: product.stock,
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.maxStock) {
          toast.error('Insufficient stock');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setCustomerName('');
    setCustomerPhone('');
  };

  const applyDiscount = (type: 'percent' | 'fixed', value: number) => {
    if (type === 'percent') { setDiscountPercent(value); setDiscountAmount(0); }
    else { setDiscountAmount(value); setDiscountPercent(0); }
    setDiscountDialog(false);
  };

  const handleOpenShift = async () => {
    await openShift.mutateAsync({ openingBalance: parseFloat(openingBalance) || 10000 });
    setShiftDialog(false);
  };

  const processPayment = async () => {
    if (!activeShift) {
      toast.error('Please open a shift first');
      return;
    }

    try {
      const txn = await createTransaction.mutateAsync({
        shiftId: activeShift.id,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        subtotal,
        discount: discountValue,
        discountType: discountPercent > 0 ? 'percent' : discountAmount > 0 ? 'fixed' : undefined,
        discountValue: discountPercent > 0 ? discountPercent : discountAmount > 0 ? discountAmount : undefined,
        total,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : undefined,
        changeGiven: paymentMethod === 'cash' ? Math.max(0, (parseFloat(cashReceived) || 0) - total) : undefined,
        isSplitPayment: paymentMethod === 'split',
        cashAmount: paymentMethod === 'split' ? parseFloat(splitCash) || 0 : paymentMethod === 'cash' ? total : undefined,
        cardAmount: paymentMethod === 'split' ? parseFloat(splitCard) || 0 : paymentMethod === 'card' ? total : undefined,
        items: cart.map(item => ({
          productId: item.id,
          productSku: item.sku,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
      });

      setReceiptNumber(txn.receipt_number);
      setPaymentDialog(false);
      setSuccessDialog(true);
    } catch {
      // Error handled by mutation
    }
  };

  const completeTransaction = () => {
    toast.success('Sale completed successfully!');
    setSuccessDialog(false);
    clearCart();
    setCashReceived('');
    setSplitCash('');
    setSplitCard('');
    setPaymentMethod('cash');
  };

  const quickCashAmounts = [100, 500, 1000, 2000, 5000, 10000];

  // Show shift prompt if no active shift
  if (!shiftLoading && !activeShift) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <CardTitle>No Active Shift</CardTitle>
            <p className="text-muted-foreground">You need to open a shift before making sales</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Opening Cash Balance (Rs.)</Label>
              <Input 
                type="number" 
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="10000"
              />
            </div>
            <Button className="w-full" onClick={handleOpenShift} disabled={openShift.isPending}>
              {openShift.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Open Shift & Start Selling
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">New POS Sale</h1>
            <p className="text-muted-foreground">
              Shift active since {activeShift ? format(new Date(activeShift.opened_at), 'hh:mm a') : '...'}
            </p>
          </div>
          {activeShift && (
            <Badge variant="default" className="bg-success">
              {activeShift.transaction_count} sales · Rs. {activeShift.total_sales.toLocaleString()}
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon"><Barcode className="h-4 w-4" /></Button>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1">
          {productsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${product.stock === 0 ? 'opacity-50' : ''}`}
                  onClick={() => product.stock > 0 && addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">Rs. {product.selling_price.toLocaleString()}</span>
                      <Badge variant={product.stock > 10 ? 'secondary' : product.stock > 0 ? 'outline' : 'destructive'} className="text-xs">
                        {product.stock > 0 ? `${product.stock}` : 'Out'}
                      </Badge>
                    </div>
                    {product.sku && <p className="text-xs text-muted-foreground mt-1">{product.sku}</p>}
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No products found
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: Cart */}
      <Card className="w-[400px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Sale</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setCustomerDialog(true)}>
                <UserCircle className="h-4 w-4 mr-1" />
                {customerName || 'Customer'}
              </Button>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}><X className="h-4 w-4" /></Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-2 opacity-50" />
                <p>No items in cart</p>
                <p className="text-sm">Click products to add</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      {item.sku && <p className="text-xs text-muted-foreground">{item.sku}</p>}
                      <p className="text-sm font-semibold text-primary">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totals */}
          <div className="border-t p-4 space-y-2 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" />Discount {discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
                <span>- Rs. {discountValue.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">Rs. {total.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => setDiscountDialog(true)} disabled={cart.length === 0}>
                <Percent className="h-4 w-4 mr-1" />Discount
              </Button>
              <Button onClick={() => setPaymentDialog(true)} disabled={cart.length === 0} className="bg-success hover:bg-success/90">
                <Calculator className="h-4 w-4 mr-1" />Pay
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <Dialog open={customerDialog} onOpenChange={setCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Add customer info (optional)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter phone number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialog(false)}>Cancel</Button>
            <Button onClick={() => setCustomerDialog(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialog} onOpenChange={setDiscountDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Discount</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(pct => (
                <Button key={pct} variant={discountPercent === pct ? 'default' : 'outline'} onClick={() => applyDiscount('percent', pct)}>
                  {pct}%
                </Button>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Custom Percentage</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="0" max={100} onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)} />
                <Button onClick={() => applyDiscount('percent', discountPercent)}>Apply %</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fixed Amount (Rs.)</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="0" onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 0)} />
                <Button onClick={() => applyDiscount('fixed', discountAmount)}>Apply</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDiscountPercent(0); setDiscountAmount(0); setDiscountDialog(false); }}>Clear Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>Total: Rs. {total.toLocaleString()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} className="flex-col h-20" onClick={() => setPaymentMethod('cash')}>
                <Banknote className="h-6 w-6 mb-1" />Cash
              </Button>
              <Button variant={paymentMethod === 'card' ? 'default' : 'outline'} className="flex-col h-20" onClick={() => setPaymentMethod('card')}>
                <CreditCard className="h-6 w-6 mb-1" />Card
              </Button>
              <Button variant={paymentMethod === 'split' ? 'default' : 'outline'} className="flex-col h-20" onClick={() => setPaymentMethod('split')}>
                <SplitSquareHorizontal className="h-6 w-6 mb-1" />Split
              </Button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Cash Received (Rs.)</Label>
                  <Input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="Enter amount" className="text-lg" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {quickCashAmounts.map(amount => (
                    <Button key={amount} variant="outline" size="sm" onClick={() => setCashReceived(String(amount))}>
                      Rs. {amount.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Button variant="secondary" className="w-full" onClick={() => setCashReceived(String(total))}>Exact Amount</Button>
                {parseFloat(cashReceived) >= total && (
                  <div className="rounded-lg bg-success/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className="text-2xl font-bold text-success">Rs. {(parseFloat(cashReceived) - total).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="rounded-lg bg-muted p-6 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Card payment ready</p>
                <p className="text-2xl font-bold mt-2">Rs. {total.toLocaleString()}</p>
              </div>
            )}

            {paymentMethod === 'split' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Cash Amount (Rs.)</Label>
                  <Input type="number" value={splitCash} onChange={(e) => { setSplitCash(e.target.value); setSplitCard(String(total - (parseFloat(e.target.value) || 0))); }} placeholder="Enter cash amount" />
                </div>
                <div className="space-y-2">
                  <Label>Card Amount (Rs.)</Label>
                  <Input type="number" value={splitCard} onChange={(e) => { setSplitCard(e.target.value); setSplitCash(String(total - (parseFloat(e.target.value) || 0))); }} placeholder="Enter card amount" />
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex justify-between text-sm">
                    <span>Cash + Card</span>
                    <span className={(parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) === total ? 'text-success' : 'text-destructive'}>
                      Rs. {((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>Cancel</Button>
            <Button 
              className="bg-success hover:bg-success/90"
              onClick={processPayment}
              disabled={
                createTransaction.isPending ||
                (paymentMethod === 'cash' && parseFloat(cashReceived) < total) ||
                (paymentMethod === 'split' && (parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) !== total)
              }
            >
              {createTransaction.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-2">Sale Complete!</h2>
            <p className="text-muted-foreground mb-4">Receipt #{receiptNumber}</p>
            <div className="rounded-lg bg-muted p-4 mb-4 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">Rs. {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Payment</span>
                <Badge>{paymentMethod}</Badge>
              </div>
              {paymentMethod === 'cash' && change > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change</span>
                  <span className="text-success font-bold">Rs. {change.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={completeTransaction}>New Sale</Button>
              <Button className="flex-1" onClick={() => { toast.success('Receipt printed!'); completeTransaction(); }}>
                <Receipt className="mr-2 h-4 w-4" />Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
