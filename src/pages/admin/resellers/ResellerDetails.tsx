import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Ban,
  CheckCircle,
  Building,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/admin/StatCard';
import {
  useAdminResellerById,
  useAdminResellerOrders,
  useAdminResellerLedger,
  useAdminResellerPayouts,
  useBlockReseller,
  useUnblockReseller,
} from '@/hooks/useAdminResellers';
import { toast } from 'sonner';
import type { ResellerTier, ApprovalStatus, PayoutStatus, OrderStatus } from '@/types/database';

const tierColors: Record<ResellerTier, string> = {
  silver: 'bg-gray-100 text-gray-700 border-gray-300',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  platinum: 'bg-purple-100 text-purple-700 border-purple-300',
};

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
};

const orderStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
};

const payoutStatusColors: Record<PayoutStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ResellerDetails() {
  const { id } = useParams();
  const { data: reseller, isLoading, error } = useAdminResellerById(id);
  const { data: resellerOrders } = useAdminResellerOrders(id);
  const { data: resellerLedger } = useAdminResellerLedger(id);
  const { data: resellerPayouts } = useAdminResellerPayouts(id);
  
  const blockReseller = useBlockReseller();
  const unblockReseller = useUnblockReseller();

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

  const handleBlock = async () => {
    if (!reseller) return;
    try {
      await blockReseller.mutateAsync({ resellerId: reseller.id });
      toast.success('Reseller blocked');
    } catch (err) {
      toast.error('Failed to block reseller');
    }
  };

  const handleUnblock = async () => {
    if (!reseller) return;
    try {
      await unblockReseller.mutateAsync(reseller.id);
      toast.success('Reseller unblocked');
    } catch (err) {
      toast.error('Failed to unblock reseller');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !reseller) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Reseller not found</p>
      </div>
    );
  }

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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{reseller.business_name}</h1>
            <Badge
              variant="outline"
              className={`${tierColors[reseller.tier]} capitalize`}
            >
              <Award className="h-3 w-3 mr-1" />
              {reseller.tier}
            </Badge>
            <Badge className={statusColors[reseller.status]}>{reseller.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            Member since {formatDate(reseller.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {reseller.status === 'approved' ? (
            <Button 
              variant="destructive" 
              onClick={handleBlock}
              disabled={blockReseller.isPending}
            >
              {blockReseller.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Block Reseller
            </Button>
          ) : reseller.status === 'blocked' ? (
            <Button 
              variant="default" 
              onClick={handleUnblock}
              disabled={unblockReseller.isPending}
            >
              {unblockReseller.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Unblock
            </Button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={reseller.total_orders.toString()}
          icon={TrendingUp}
          description="Lifetime orders"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(Number(reseller.total_revenue))}
          icon={DollarSign}
          description="Gross sales"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(Number(reseller.total_profit))}
          icon={DollarSign}
          description="Earnings"
        />
        <StatCard
          title="COD Rejection"
          value={`${Number(reseller.cod_rejection_rate).toFixed(1)}%`}
          icon={Number(reseller.cod_rejection_rate) > 10 ? AlertTriangle : CheckCircle}
          description={`${reseller.cod_rejection_count} rejected`}
        />
      </div>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Balance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(reseller.available_balance))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Balance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(Number(reseller.pending_balance))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <p className="text-2xl font-bold">
                {formatCurrency(Number(reseller.total_withdrawn))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="text-2xl font-bold">{reseller.commission_rate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Business Info</TabsTrigger>
          <TabsTrigger value="orders">Orders ({resellerOrders?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="ledger">Ledger ({resellerLedger?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="payouts">Payouts ({resellerPayouts?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Person</p>
                    <p className="font-medium">{reseller.contact_person || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{reseller.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{reseller.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{reseller.address || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Registration Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reseller.business_registration && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Business Registration
                    </p>
                    <p className="font-medium">{reseller.business_registration}</p>
                  </div>
                )}
                {reseller.tax_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tax ID</p>
                    <p className="font-medium">{reseller.tax_id}</p>
                  </div>
                )}
                {reseller.approved_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Date</p>
                    <p className="font-medium">{formatDate(reseller.approved_at)}</p>
                  </div>
                )}
                {reseller.blocked_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700">Block Reason</p>
                    <p className="text-sm text-red-600">{reseller.blocked_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              {!resellerOrders?.length ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  No orders found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Reseller Price</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resellerOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium font-mono text-xs">
                          {order.order_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{formatCurrency(Number(order.reseller_price))}</TableCell>
                        <TableCell>{formatCurrency(Number(order.selling_price))}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(Number(order.profit))}
                        </TableCell>
                        <TableCell>{formatCurrency(Number(order.commission_amount))}</TableCell>
                        <TableCell>
                          <Badge variant={order.is_paid ? 'default' : 'secondary'}>
                            {order.is_paid ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardContent className="p-0">
              {!resellerLedger?.length ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  No ledger entries found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resellerLedger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {entry.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.reference_number || '-'}
                        </TableCell>
                        <TableCell>{entry.description || '-'}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(entry.balance))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardContent className="p-0">
              {!resellerPayouts?.length ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  No payout requests found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resellerPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{formatDate(payout.created_at)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(payout.amount))}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payout.bank_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {payout.account_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={payoutStatusColors[payout.status]}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payout.payment_reference || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
