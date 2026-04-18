import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, Package, AlertTriangle, Truck, TrendingUp, Plus, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { useDashboardStats, useSalesChart, useRecentOrders, useLowStockProducts } from '@/hooks/useDashboardData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const formatCurrency = (value: number) => `LKR ${value.toLocaleString()}`;

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: salesData, isLoading: chartLoading } = useSalesChart();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { data: lowStockProducts, isLoading: stockLoading } = useLowStockProducts();

  const isLoading = statsLoading || chartLoading || ordersLoading || stockLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/admin/catalog/products/new"><Plus className="mr-2 h-4 w-4" />Add Product</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/shipping/create"><Truck className="mr-2 h-4 w-4" />Create Shipment</Link></Button>
          <Button asChild><Link to="/admin/pos/new-sale"><FileText className="mr-2 h-4 w-4" />New POS Sale</Link></Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={statsLoading ? '...' : formatCurrency(stats?.todaySales ?? 0)}
          icon={DollarSign}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Total Orders"
          value={statsLoading ? '...' : stats?.totalOrders ?? 0}
          icon={ShoppingCart}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Pending Orders"
          value={statsLoading ? '...' : stats?.pendingOrders ?? 0}
          icon={Package}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Low Stock Items"
          value={statsLoading ? '...' : stats?.lowStockProducts ?? 0}
          icon={AlertTriangle}
          iconColor="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-1">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />Sales Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : salesData && salesData.some(d => d.total > 0) ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => format(new Date(d), 'MMM dd')}
                      className="text-xs"
                    />
                    <YAxis tickFormatter={v => `${(v / 1000)}k`} className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={l => format(new Date(l), 'MMM dd, yyyy')}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary)/0.3)"
                      name="Sales"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No sales data for the last 7 days
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <Link
                    key={order.id}
                    to={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{order.shipping_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <StatusBadge status={order.order_status as any} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />Low Stock Alert
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/catalog/products">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stockLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}
                    </div>
                    <div className={`font-bold ${product.stock === 0 ? 'text-destructive' : 'text-warning'}`}>
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">All products are well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
