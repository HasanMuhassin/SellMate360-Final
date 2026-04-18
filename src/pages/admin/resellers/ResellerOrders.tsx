import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import StatCard from '@/components/admin/StatCard';
import { useAdminResellers } from '@/hooks/useAdminResellers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const orderStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
};

interface ResellerOrderWithDetails {
  id: string;
  reseller_id: string;
  order_id: string;
  reseller_price: number;
  selling_price: number;
  profit: number;
  commission_amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  reseller?: {
    id: string;
    business_name: string;
  };
  order?: {
    id: string;
    order_number: string;
    order_status: string;
    shipping_name: string;
    shipping_phone: string;
    payment_status: string;
    created_at: string;
  };
}

function useAllResellerOrders(filters?: { status?: string; resellerId?: string }) {
  return useQuery({
    queryKey: ['all-reseller-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('reseller_orders')
        .select(`
          *,
          reseller:resellers(id, business_name),
          order:orders(id, order_number, order_status, shipping_name, shipping_phone, payment_status, created_at)
        `)
        .order('created_at', { ascending: false });

      if (filters?.resellerId && filters.resellerId !== 'all') {
        query = query.eq('reseller_id', filters.resellerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by order status if needed
      let result = data as ResellerOrderWithDetails[];
      if (filters?.status && filters.status !== 'all') {
        result = result.filter(ro => ro.order?.order_status === filters.status);
      }
      
      return result;
    },
  });
}

export default function ResellerOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resellerFilter, setResellerFilter] = useState<string>('all');

  const { data: resellers } = useAdminResellers({ status: 'approved' });
  const { data: resellerOrders, isLoading, error } = useAllResellerOrders({
    status: statusFilter,
    resellerId: resellerFilter,
  });

  const filteredOrders = resellerOrders?.filter((order) => {
    const orderNumber = order.order?.order_number?.toLowerCase() ?? '';
    const customerName = order.order?.shipping_name?.toLowerCase() ?? '';
    const resellerName = order.reseller?.business_name?.toLowerCase() ?? '';
    
    return (
      orderNumber.includes(searchQuery.toLowerCase()) ||
      customerName.includes(searchQuery.toLowerCase()) ||
      resellerName.includes(searchQuery.toLowerCase())
    );
  }) ?? [];

  const stats = {
    total: resellerOrders?.length ?? 0,
    totalRevenue: resellerOrders?.reduce((sum, o) => sum + Number(o.selling_price), 0) ?? 0,
    totalProfit: resellerOrders?.reduce((sum, o) => sum + Number(o.profit), 0) ?? 0,
    totalCommission: resellerOrders?.reduce((sum, o) => sum + Number(o.commission_amount), 0) ?? 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/resellers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Reseller Orders</h1>
          <p className="text-muted-foreground">
            Track and manage orders placed by resellers
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats.total.toString()}
          icon={ShoppingCart}
          description="All reseller orders"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description="Gross sales"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={TrendingUp}
          description="Reseller earnings"
        />
        <StatCard
          title="Total Commission"
          value={formatCurrency(stats.totalCommission)}
          icon={DollarSign}
          description="Platform earnings"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order, customer, or reseller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resellerFilter} onValueChange={setResellerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Reseller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resellers</SelectItem>
                {resellers?.map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              Error loading orders
            </div>
          ) : !filteredOrders.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No reseller orders found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reseller Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((resellerOrder) => {
                  const order = resellerOrder.order;
                  const orderStatus = order?.order_status ?? 'pending';
                  const paymentStatus = order?.payment_status ?? 'pending';
                  
                  return (
                    <TableRow key={resellerOrder.id}>
                      <TableCell className="font-medium">
                        {order?.order_number ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/admin/resellers/${resellerOrder.reseller_id}`}
                          className="text-primary hover:underline"
                        >
                          {resellerOrder.reseller?.business_name ?? 'Unknown'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order?.shipping_name ?? '-'}</p>
                          <p className="text-sm text-muted-foreground">
                            {order?.shipping_phone ?? '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(resellerOrder.reseller_price))}</TableCell>
                      <TableCell>{formatCurrency(Number(resellerOrder.selling_price))}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(Number(resellerOrder.profit))}
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        {formatCurrency(Number(resellerOrder.commission_amount))}
                      </TableCell>
                      <TableCell>
                        <Badge className={orderStatusColors[orderStatus] ?? 'bg-gray-100 text-gray-700'}>
                          {orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order?.created_at ? formatDate(order.created_at) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
