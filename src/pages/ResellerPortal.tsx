import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  Bell,
  Settings,
  Loader2,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useResellerProducts } from '@/hooks/useProducts';
import { useSession, useSignOut } from '@/hooks/useAuth';
import { useIsApprovedReseller, useResellerOrders, useResellerLedger, usePayoutRequests, useCreatePayoutRequest, usePlaceResellerOrder, useResellerCODStats, useResellerNotifications, useMarkNotificationRead } from '@/hooks/useReseller';
import { useToast } from '@/hooks/use-toast';


const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kurunegala', 'Puttalam',
];

const statusConfig = {
  confirmed: { label: 'Confirmed', className: 'bg-primary/10 text-primary' },
  packed: { label: 'Packed', className: 'bg-warning/10 text-warning' },
  shipped: { label: 'Shipped', className: 'bg-success/10 text-success' },
  delivered: { label: 'Delivered', className: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
};

const payoutStatusConfig = {
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning', icon: Clock },
  approved: { label: 'Approved', className: 'bg-primary/10 text-primary', icon: CheckCircle },
  paid: { label: 'Paid', className: 'bg-success/10 text-success', icon: CheckCircle },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function ResellerPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPlaceOrderOpen, setIsPlaceOrderOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number }[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('');
  const [payoutAccountHolder, setPayoutAccountHolder] = useState('');
  const [payoutBranch, setPayoutBranch] = useState('');

  // Order form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDistrict, setCustomerDistrict] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading: sessionLoading } = useSession();
  const { isApprovedReseller, reseller, isLoading: resellerLoading } = useIsApprovedReseller();
  const signOut = useSignOut();

  // Fetch reseller data from database
  const { data: resellerOrders = [], isLoading: ordersLoading } = useResellerOrders(reseller?.id, { limit: 10 });
  const { data: ledgerEntries = [], isLoading: ledgerLoading } = useResellerLedger(reseller?.id, { limit: 20 });
  const { data: payoutRequests = [], isLoading: payoutsLoading } = usePayoutRequests(reseller?.id);
  const { data: products = [], isLoading: productsLoading } = useResellerProducts();
  const { data: codStats = { pendingCollection: 0, totalCodOrders: 0, successRate: 100 } } = useResellerCODStats(reseller?.id);
  const { data: notifications = [] } = useResellerNotifications(reseller?.id);
  const markNotificationRead = useMarkNotificationRead();
  const createPayoutRequest = useCreatePayoutRequest();
  const placeOrder = usePlaceResellerOrder();
  
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  // Compute stats from real reseller data
  const resellerStats = {
    totalSales: reseller?.total_revenue ?? 0,
    totalProfit: reseller?.total_profit ?? 0,
    pendingPayout: reseller?.available_balance ?? 0,
    totalOrders: reseller?.total_orders ?? 0,
    totalWithdrawn: reseller?.total_withdrawn ?? 0,
    codRejectionRate: reseller?.cod_rejection_rate ?? 0,
    codRejectionCount: reseller?.cod_rejection_count ?? 0,
    pendingBalance: reseller?.pending_balance ?? 0,
    tier: reseller?.tier ?? 'silver',
    discountPercentage: reseller?.tier === 'platinum' ? 20 : reseller?.tier === 'gold' ? 15 : 10,
  };

  // Compute COD warnings
  const computedCodWarnings: { id: string; message: string; severity: 'high' | 'medium' }[] = [];
  if (resellerStats.codRejectionRate > 20) {
    computedCodWarnings.push({
      id: 'high-rejection',
      message: `High COD rejection rate (${resellerStats.codRejectionRate.toFixed(1)}%)`,
      severity: 'high',
    });
  } else if (resellerStats.codRejectionRate > 10) {
    computedCodWarnings.push({
      id: 'med-rejection',
      message: `COD rejection rate at ${resellerStats.codRejectionRate.toFixed(1)}%`,
      severity: 'medium',
    });
  }

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Redirect if not authenticated or not an approved reseller
  useEffect(() => {
    // Wait for everything to load before making a decision
    if (sessionLoading || resellerLoading) return;

    if (!session) {
      // Not logged in at all
      navigate('/reseller/login');
    } else if (session && (!reseller || reseller.status !== 'approved')) {
      // Logged in but not an approved reseller
      navigate('/reseller/login');
    }
  }, [session, sessionLoading, reseller, resellerLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'orders', icon: ShoppingCart, label: 'Place Order' },
    { id: 'profits', icon: Wallet, label: 'My Profits' },
    { id: 'payouts', icon: CreditCard, label: 'Payouts' },
    { id: 'warnings', icon: AlertTriangle, label: 'COD Warnings' },
  ];

  const addProductToOrder = (productId: string) => {
    const existing = selectedProducts.find(p => p.productId === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p =>
        p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { productId, quantity: 1 }]);
    }
  };

  const removeProductFromOrder = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromOrder(productId);
    } else {
      setSelectedProducts(selectedProducts.map(p =>
        p.productId === productId ? { ...p, quantity } : p
      ));
    }
  };

  const getOrderTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.selling_price || 0) * item.quantity;
    }, 0);
  };

  const getResellerTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      const resellerPrice = product?.reseller_price || Math.round((product?.selling_price || 0) * 0.85);
      return total + resellerPrice * item.quantity;
    }, 0);
  };

  const getOrderProfit = () => {
    return getOrderTotal() - getResellerTotal();
  };

  // Show loading while checking auth
  if (sessionLoading || resellerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not approved, don't render (redirect will happen)
  if (!session || !isApprovedReseller) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <span className="font-bold text-foreground">SellMate</span>
              <span className="text-primary font-bold">360</span>
              <p className="text-xs text-muted-foreground">Reseller Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.id === 'warnings' && computedCodWarnings.length > 0 && (
                  <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs">
                    {computedCodWarnings.length}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{reseller?.business_name || 'Reseller'}</p>
              <p className="text-xs text-muted-foreground capitalize">{reseller?.tier || 'silver'} Tier</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={handleSignOut}
            disabled={signOut.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {signOut.isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="lg:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {navItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <h1 className="text-xl font-semibold hidden lg:block">
            {navItems.find(n => n.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadNotificationsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-xs"
                      onClick={() => markNotificationRead.mutate('all')}
                      disabled={markNotificationRead.isPending}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'px-4 py-3 text-sm border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors',
                            !notification.is_read && 'bg-primary/5'
                          )}
                          onClick={() => {
                            if (!notification.is_read) {
                              markNotificationRead.mutate(notification.id);
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                              {notification.type === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                              {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                              {notification.type === 'info' && <Bell className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('font-medium mb-0.5', !notification.is_read ? 'text-foreground' : 'text-muted-foreground')}>
                                {notification.title}
                              </p>
                              <p className="text-muted-foreground text-xs leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-2">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold mt-1">{formatPrice(resellerStats.totalSales)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                      <span>{resellerStats.totalOrders} orders completed</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Profit</p>
                        <p className="text-2xl font-bold mt-1 text-success">{formatPrice(resellerStats.totalProfit)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-success" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                      <span>{formatPrice(resellerStats.pendingBalance)} pending in progress</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Payout</p>
                        <p className="text-2xl font-bold mt-1 text-warning">{formatPrice(resellerStats.pendingPayout)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-warning" />
                      </div>
                    </div>
                    <Button variant="link" size="sm" className="px-0 mt-2" onClick={() => setActiveTab('payouts')}>
                      Request Payout →
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold mt-1">{resellerStats.totalOrders}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <Button variant="link" size="sm" className="px-0 mt-2" onClick={() => setActiveTab('orders')}>
                      Place New Order →
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* COD Warnings */}
              {computedCodWarnings.length > 0 && (
                <Card className="border-warning/50 bg-warning/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-5 w-5" />
                      COD Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {computedCodWarnings.map((warning) => (
                      <div
                        key={warning.id}
                        className={cn(
                          'p-3 rounded-lg text-sm',
                          warning.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                        )}
                      >
                        {warning.message}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Orders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ordersLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ) : resellerOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No orders yet. Place your first order to get started!
                            </TableCell>
                          </TableRow>
                        ) : (
                          resellerOrders.slice(0, 5).map((resellerOrder) => {
                            const order = resellerOrder.order;
                            const orderStatus = order?.order_status ?? 'pending';
                            const status = statusConfig[orderStatus as keyof typeof statusConfig] ?? statusConfig.confirmed;
                            return (
                              <TableRow key={resellerOrder.id}>
                                <TableCell className="font-medium">{order?.order_number ?? '-'}</TableCell>
                                <TableCell>
                                  <div>
                                    <p>{order?.shipping_name ?? 'Customer'}</p>
                                    <p className="text-xs text-muted-foreground">{order?.shipping_phone ?? '-'}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{order?.created_at ? formatDate(order.created_at) : '-'}</TableCell>
                                <TableCell>{formatPrice(resellerOrder.selling_price)}</TableCell>
                                <TableCell className="text-success font-medium">
                                  +{formatPrice(resellerOrder.profit)}
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn('text-xs', status.className)}>
                                    {status.label}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Place Order */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Place Order for Customer</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create orders on behalf of your customers and earn {resellerStats.discountPercentage}% profit
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Product Selection */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Products</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Search products by name or SKU..." 
                            className="pl-9" 
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {productsLoading ? (
                          <div className="col-span-2 flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="col-span-2 text-center py-8 text-muted-foreground">
                            {products.length === 0 ? 'No products available' : 'No matching products found'}
                          </div>
                        ) : (
                          filteredProducts.map((product) => {
                            const selected = selectedProducts.find(p => p.productId === product.id);
                            const resellerPrice = product.reseller_price || Math.round(product.selling_price * 0.85);
                            return (
                              <div
                                key={product.id}
                                className={cn(
                                  'p-4 rounded-lg border transition-colors cursor-pointer',
                                  selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                )}
                                onClick={() => !selected && addProductToOrder(product.id)}
                              >
                                <div className="flex gap-3">
                                  <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                                    {product.image_url && (
                                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm font-semibold text-primary">
                                        {formatPrice(resellerPrice)}
                                      </span>
                                      <span className="text-xs text-muted-foreground line-through">
                                        {formatPrice(product.selling_price)}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className="mt-1 text-xs badge-in-stock">
                                      {product.stock} in stock
                                    </Badge>
                                  </div>
                                </div>
                                {selected && (
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateProductQuantity(product.id, selected.quantity - 1);
                                        }}
                                      >
                                        -
                                      </Button>
                                      <span className="w-8 text-center text-sm font-medium">
                                        {selected.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateProductQuantity(product.id, selected.quantity + 1);
                                        }}
                                      >
                                        +
                                      </Button>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeProductFromOrder(product.id);
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Form */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Customer Name *</Label>
                        <Input
                          placeholder="Full name"
                          className="mt-1"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Phone Number *</Label>
                        <Input
                          placeholder="0771234567"
                          className="mt-1"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>District *</Label>
                        <Select value={customerDistrict} onValueChange={setCustomerDistrict}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Address *</Label>
                        <Textarea
                          placeholder="Full delivery address"
                          className="mt-1"
                          rows={3}
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No products selected
                        </p>
                      ) : (
                        <>
                          {selectedProducts.map((item) => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return null;
                            return (
                              <div key={item.productId} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {product.name} × {item.quantity}
                                </span>
                                <span>{formatPrice(product.selling_price * item.quantity)}</span>
                              </div>
                            );
                          })}
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatPrice(getOrderTotal())}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery</span>
                            <span>Rs. 500</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatPrice(getOrderTotal() + 500)}</span>
                          </div>
                          <div className="flex justify-between text-success font-medium">
                            <span>Your Profit</span>
                            <span>+{formatPrice(getOrderProfit())}</span>
                          </div>
                        </>
                      )}
                      <Button
                        className="w-full mt-4"
                        disabled={selectedProducts.length === 0 || !customerName || !customerPhone || !customerDistrict || !customerAddress || placeOrder.isPending}
                        onClick={async () => {
                          try {
                            const items = selectedProducts.map((item) => {
                              const product = products.find(p => p.id === item.productId);
                              if (!product) throw new Error('Product not found');
                              const resellerPrice = product.reseller_price || Math.round(product.selling_price * 0.85);
                              return {
                                productId: product.id,
                                productSku: product.sku,
                                productName: product.name,
                                productImage: product.image_url,
                                quantity: item.quantity,
                                unitPrice: product.selling_price,
                                resellerPrice,
                              };
                            });

                            const result = await placeOrder.mutateAsync({
                              customerName,
                              customerPhone,
                              customerDistrict,
                              customerCity: customerDistrict,
                              customerAddress,
                              items,
                              deliveryFee: 500,
                            });

                            toast({
                              title: 'Order placed successfully!',
                              description: `Your profit: Rs. ${result.profit.toLocaleString()}`,
                            });

                            // Reset form
                            setSelectedProducts([]);
                            setCustomerName('');
                            setCustomerPhone('');
                            setCustomerDistrict('');
                            setCustomerAddress('');
                          } catch (error: any) {
                            toast({
                              title: 'Failed to place order',
                              description: error.message,
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        {placeOrder.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          'Place Order'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profits */}
          {activeTab === 'profits' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold mt-1 text-success">
                      {formatPrice(resellerStats.totalProfit)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Available for Payout</p>
                    <p className="text-2xl font-bold mt-1 text-warning">
                      {formatPrice(resellerStats.pendingPayout)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Already Paid Out</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatPrice(resellerStats.totalWithdrawn)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profit Ledger</CardTitle>
                  <CardDescription>Complete history of your earnings and payouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledgerLoading ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ) : ledgerEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No transactions yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          ledgerEntries.map((entry) => {
                            const isCredit = entry.credit > 0;
                            const amount = isCredit ? entry.credit : entry.debit;
                            return (
                              <TableRow key={entry.id}>
                                <TableCell>{formatDate(entry.created_at)}</TableCell>
                                <TableCell>{entry.description ?? entry.type}</TableCell>
                                <TableCell className={cn(
                                  'text-right font-medium',
                                  isCredit ? 'text-success' : 'text-destructive'
                                )}>
                                  {isCredit ? '+' : '-'}{formatPrice(amount)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Payouts */}
          {activeTab === 'payouts' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Payout Requests</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Available balance: <span className="font-semibold text-success">{formatPrice(resellerStats.pendingPayout)}</span>
                  </p>
                </div>
                <Dialog open={isPayoutOpen} onOpenChange={(open) => {
                  setIsPayoutOpen(open);
                  if (!open) {
                    setPayoutAmount('');
                    setPayoutBankName('');
                    setPayoutAccountNumber('');
                    setPayoutAccountHolder('');
                    setPayoutBranch('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button disabled={resellerStats.pendingPayout <= 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Payout
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Payout</DialogTitle>
                      <DialogDescription>
                        Available balance: {formatPrice(resellerStats.pendingPayout)}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const amount = parseFloat(payoutAmount);
                      if (!amount || amount <= 0) {
                        toast({ title: 'Invalid amount', variant: 'destructive' });
                        return;
                      }
                      if (amount > resellerStats.pendingPayout) {
                        toast({ title: 'Amount exceeds available balance', variant: 'destructive' });
                        return;
                      }
                      if (!payoutBankName || !payoutAccountNumber || !payoutAccountHolder) {
                        toast({ title: 'Please fill all required fields', variant: 'destructive' });
                        return;
                      }
                      try {
                        await createPayoutRequest.mutateAsync({
                          amount,
                          bank_name: payoutBankName,
                          account_number: payoutAccountNumber,
                          account_holder: payoutAccountHolder,
                          branch: payoutBranch || null,
                        });
                        toast({ title: 'Payout request submitted', description: 'Your request is being processed.' });
                        setIsPayoutOpen(false);
                      } catch (error: any) {
                        toast({ title: 'Failed to submit request', description: error.message, variant: 'destructive' });
                      }
                    }} className="space-y-4 py-4">
                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          className="mt-1"
                          max={resellerStats.pendingPayout}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Bank Name *</Label>
                        <Input
                          placeholder="e.g., Commercial Bank"
                          className="mt-1"
                          value={payoutBankName}
                          onChange={(e) => setPayoutBankName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Account Number *</Label>
                        <Input
                          placeholder="Enter account number"
                          className="mt-1"
                          value={payoutAccountNumber}
                          onChange={(e) => setPayoutAccountNumber(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Account Holder Name *</Label>
                        <Input
                          placeholder="Name on bank account"
                          className="mt-1"
                          value={payoutAccountHolder}
                          onChange={(e) => setPayoutAccountHolder(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Branch (Optional)</Label>
                        <Input
                          placeholder="Branch name"
                          className="mt-1"
                          value={payoutBranch}
                          onChange={(e) => setPayoutBranch(e.target.value)}
                        />
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-sm">
                        <p className="text-muted-foreground">
                          Payouts are processed within 2-3 business days
                        </p>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPayoutOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPayoutRequest.isPending}>
                          {createPayoutRequest.isPending ? 'Submitting...' : 'Submit Request'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {payoutsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : payoutRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payout requests yet
                  </div>
                ) : (
                  payoutRequests.map((payout) => {
                    const status = payoutStatusConfig[payout.status as keyof typeof payoutStatusConfig];
                    const maskedAccount = payout.account_number
                      ? `**** ${payout.account_number.slice(-4)}`
                      : '****';
                    return (
                      <Card key={payout.id}>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">Payout #{payout.id.slice(0, 8).toUpperCase()}</span>
                                <Badge className={cn('text-xs', status.className)}>
                                  <status.icon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(payout.created_at)} • {payout.bank_name}: {maskedAccount}
                              </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="text-xl font-bold">{formatPrice(payout.amount)}</p>
                              {payout.payment_proof_url && (
                                <Button variant="outline" size="xs" className="h-7 text-xs" asChild>
                                  <a href={payout.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Proof
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          {payout.status === 'rejected' && payout.rejection_reason && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-700">
                              <span className="font-semibold block mb-1">Reason for Rejection:</span>
                              {payout.rejection_reason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* COD Warnings */}
          {activeTab === 'warnings' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    COD Performance & Warnings
                  </CardTitle>
                  <CardDescription>
                    Monitor your COD rejection rates and pending collections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* COD Stats */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">COD Success Rate</p>
                      <p className="text-2xl font-bold mt-1">{codStats.successRate}%</p>
                      <Progress value={codStats.successRate} className="mt-2" />
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Pending COD Collection</p>
                      <p className="text-2xl font-bold mt-1 text-warning">{formatPrice(codStats.pendingCollection)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total COD Orders</p>
                      <p className="text-2xl font-bold mt-1">{codStats.totalCodOrders}</p>
                    </div>
                  </div>

                  {/* Warnings List */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Active Warnings</h4>
                    {computedCodWarnings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                        <p>No active warnings. Great job!</p>
                      </div>
                    ) : (
                      computedCodWarnings.map((warning) => (
                        <div
                          key={warning.id}
                          className={cn(
                            'p-4 rounded-lg border flex items-start gap-3',
                            warning.severity === 'high'
                              ? 'border-destructive/50 bg-destructive/5'
                              : 'border-warning/50 bg-warning/5'
                          )}
                        >
                          <AlertTriangle className={cn(
                            'h-5 w-5 mt-0.5',
                            warning.severity === 'high' ? 'text-destructive' : 'text-warning'
                          )} />
                          <div>
                            <p className={warning.severity === 'high' ? 'text-destructive' : 'text-warning'}>
                              {warning.message}
                            </p>
                            <Button variant="link" size="sm" className="px-0 mt-1 h-auto">
                              View Details →
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
