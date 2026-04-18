import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatCard from '@/components/admin/StatCard';
import { usePayments, PaymentRow } from '@/hooks/usePayments';

const getMethodBadge = (method: PaymentRow['method']) => {
  const styles = {
    cod: 'bg-orange-500/10 text-orange-600 border-orange-200',
    bank: 'bg-blue-500/10 text-blue-600 border-blue-200',
    card: 'bg-purple-500/10 text-purple-600 border-purple-200',
    online: 'bg-green-500/10 text-green-600 border-green-200',
  };
  const labels = {
    cod: 'Cash on Delivery',
    bank: 'Bank Deposit',
    card: 'Card Payment',
    online: 'Online Payment',
  };
  return (
    <Badge variant="outline" className={styles[method]}>
      {labels[method]}
    </Badge>
  );
};

const getStatusBadge = (status: PaymentRow['status']) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    verified: 'bg-green-500/10 text-green-600 border-green-200',
    collected: 'bg-blue-500/10 text-blue-600 border-blue-200',
    remitted: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    failed: 'bg-red-500/10 text-red-600 border-red-200',
    refunded: 'bg-gray-500/10 text-gray-600 border-gray-200',
    rejected: 'bg-red-500/10 text-red-600 border-red-200',
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: payments = [], isLoading } = usePayments({
    status: statusFilter,
    method: methodFilter
  });

  const filteredTransactions = payments.filter((txn) => {
    const orderNum = String(txn.order_number || '').toLowerCase();
    const ref = String(txn.reference || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return orderNum.includes(query) || ref.includes(query);
  });

  const stats = {
    totalRevenue: payments.filter(t => ['verified', 'collected', 'remitted'].includes(t.status)).reduce((sum, t) => sum + Number(t.amount), 0),
    pendingAmount: payments.filter(t => t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0),
    completedCount: payments.filter(t => ['verified', 'collected', 'remitted'].includes(t.status)).length,
    refundedAmount: payments.filter(t => t.status === 'refunded').reduce((sum, t) => sum + Number(t.amount), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Transactions</h1>
          <p className="text-muted-foreground">View and manage all payment transactions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatCard
            title="Total Revenue"
            value={formatPrice(stats.totalRevenue)}
            icon={DollarSign}
            change={{ value: 12, trend: 'up' }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="Pending Amount"
            value={formatPrice(stats.pendingAmount)}
            icon={Clock}
            iconColor="text-yellow-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Completed Payments"
            value={stats.completedCount.toString()}
            icon={CheckCircle2}
            iconColor="text-green-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            title="Total Refunded"
            value={formatPrice(stats.refundedAmount)}
            icon={RefreshCw}
            iconColor="text-gray-600"
          />
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-card rounded-lg border p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cod">Cash on Delivery</SelectItem>
            <SelectItem value="bank">Bank Deposit</SelectItem>
            <SelectItem value="card">Card Payment</SelectItem>
            <SelectItem value="online">Online Payment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.orderNumber}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(txn.amount)}</TableCell>
                  <TableCell>{getMethodBadge(txn.method)}</TableCell>
                  <TableCell>{getStatusBadge(txn.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {txn.reference || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(txn.createdAt, 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(txn);
                        setIsDetailOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Details for order {selectedTransaction?.orderNumber || 'Information'}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Amount</label>
                  <p className="text-lg font-bold">{formatPrice(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Payment Method</label>
                  <div className="mt-1">{getMethodBadge(selectedTransaction.method)}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Reference</label>
                  <p className="font-medium">{selectedTransaction.reference || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Created At</label>
                  <p className="font-medium">
                    {format(selectedTransaction.createdAt, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                {selectedTransaction.verifiedAt && (
                  <div>
                    <label className="text-sm text-muted-foreground">Verified</label>
                    <p className="font-medium">
                      {format(selectedTransaction.verifiedAt, 'MMM dd, yyyy HH:mm')} by {selectedTransaction.verifiedBy}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                <Button className="flex-1">
                  View Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
