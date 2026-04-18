import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  DollarSign,
  AlertTriangle,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatCard from '@/components/admin/StatCard';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
  }).format(price);
};

interface RefundRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  paymentMethod: 'cod' | 'bank' | 'card' | 'online';
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  processedBy?: string;
  processedAt?: Date;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  notes?: string;
  requestedAt: Date;
}

const mockRefunds: RefundRequest[] = [
  { 
    id: '1', 
    orderNumber: 'ORD-2024-003', 
    customerName: 'Sanjay Kumar', 
    customerEmail: 'sanjay@email.com',
    originalAmount: 12500, 
    refundAmount: 12500, 
    reason: 'Product defective', 
    paymentMethod: 'card',
    status: 'pending', 
    requestedAt: new Date() 
  },
  { 
    id: '2', 
    orderNumber: 'ORD-2024-007', 
    customerName: 'Lakshmi Perera', 
    customerEmail: 'lakshmi@email.com',
    originalAmount: 8500, 
    refundAmount: 8500, 
    reason: 'Wrong item received', 
    paymentMethod: 'bank',
    bankDetails: { bankName: 'BOC', accountNumber: '****5678', accountHolder: 'Lakshmi Perera' },
    status: 'approved', 
    requestedAt: new Date() 
  },
  { 
    id: '3', 
    orderNumber: 'ORD-2024-009', 
    customerName: 'Dilshan Fernando', 
    customerEmail: 'dilshan@email.com',
    originalAmount: 5200, 
    refundAmount: 5200, 
    reason: 'Order cancelled', 
    paymentMethod: 'online',
    status: 'processed', 
    processedBy: 'Admin',
    processedAt: new Date(),
    requestedAt: new Date() 
  },
  { 
    id: '4', 
    orderNumber: 'ORD-2024-012', 
    customerName: 'Amali Silva', 
    customerEmail: 'amali@email.com',
    originalAmount: 15000, 
    refundAmount: 7500, 
    reason: 'Partial return - 1 item', 
    paymentMethod: 'card',
    status: 'pending', 
    requestedAt: new Date() 
  },
  { 
    id: '5', 
    orderNumber: 'ORD-2024-015', 
    customerName: 'Ravi Jayawardena', 
    customerEmail: 'ravi@email.com',
    originalAmount: 3500, 
    refundAmount: 3500, 
    reason: 'Customer changed mind', 
    paymentMethod: 'cod',
    status: 'rejected', 
    notes: 'COD refund not applicable - item was delivered and opened',
    processedBy: 'Manager',
    processedAt: new Date(),
    requestedAt: new Date() 
  },
];

import { usePayments, PaymentRow, useRefundPayment, useUpdatePaymentStatus } from '@/hooks/usePayments';

const getStatusBadge = (status: PaymentRow['status']) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    verified: 'bg-green-500/10 text-green-600 border-green-200',
    processed: 'bg-green-500/10 text-green-600 border-green-200',
    refunded: 'bg-blue-500/10 text-blue-600 border-blue-200',
    rejected: 'bg-red-500/10 text-red-600 border-red-200',
  };
  const labels = {
    pending: 'Pending Review',
    verified: 'Approved',
    processed: 'Refund Processed',
    refunded: 'Refunded',
    rejected: 'Rejected',
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status] || status}
    </Badge>
  );
};

const getMethodLabel = (method: PaymentRow['method']) => {
  const labels = {
    cod: 'Cash',
    bank: 'Bank Transfer',
    card: 'Card Refund',
    online: 'Online Payment',
  };
  return labels[method];
};

export default function Refunds() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRefund, setSelectedRefund] = useState<PaymentRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processNotes, setProcessNotes] = useState('');

  const { data: payments = [], isLoading } = usePayments();
  const updateStatus = useUpdatePaymentStatus();
  const processRefund = useRefundPayment();

  // Filter for potential refunds (e.g. status verified, processing, or already refunded)
  // In a real system, we might have a separate 'refund_requests' table, but here we treat payments as candidates
  const filteredRefunds = payments.filter((ref) => {
    const isRefundCandidate = ['verified', 'refunded', 'rejected', 'pending'].includes(ref.status);
    if (!isRefundCandidate) return false;

    const matchesSearch =
      (ref.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ref.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pendingReview: payments.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.amount), 0),
    pendingCount: payments.filter(r => r.status === 'pending').length,
    approvedAmount: payments.filter(r => r.status === 'verified').reduce((sum, r) => sum + Number(r.amount), 0),
    processedToday: payments.filter(r => r.status === 'refunded').reduce((sum, r) => sum + Number(r.amount), 0),
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    updateStatus.mutate({ 
      id: selectedRefund.id, 
      status: 'verified', 
      orderNumber: selectedRefund.order_number || 'Unknown' 
    });
    setIsApproveOpen(false);
    setIsDetailOpen(false);
  };

  const handleReject = async () => {
    if (!selectedRefund) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    updateStatus.mutate({ 
      id: selectedRefund.id, 
      status: 'rejected', 
      notes: rejectionReason,
      orderNumber: selectedRefund.order_number || 'Unknown' 
    });
    setIsRejectOpen(false);
    setIsDetailOpen(false);
    setRejectionReason('');
  };

  const handleProcess = async () => {
    if (!selectedRefund) return;
    processRefund.mutate({
      id: selectedRefund.id,
      amount: selectedRefund.amount,
      reason: processNotes || 'Generic Refund',
      orderNumber: selectedRefund.order_number || 'Unknown'
    });
    setIsProcessOpen(false);
    setIsDetailOpen(false);
    setProcessNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refunds</h1>
          <p className="text-muted-foreground">Review and process refund requests</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatCard
            title="Pending Review"
            value={formatPrice(stats.pendingReview)}
            icon={Clock}
            iconColor="text-yellow-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="Pending Count"
            value={stats.pendingCount.toString()}
            icon={AlertTriangle}
            iconColor="text-orange-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Approved (Awaiting)"
            value={formatPrice(stats.approvedAmount)}
            icon={DollarSign}
            iconColor="text-blue-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            title="Processed Today"
            value={formatPrice(stats.processedToday)}
            icon={CheckCircle2}
            iconColor="text-green-600"
          />
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-card rounded-lg border p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Refunds Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Refund Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRefunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No refund requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRefunds.map((ref) => (
                <TableRow key={ref.id}>
                  <TableCell className="font-medium">{ref.orderNumber}</TableCell>
                  <TableCell>{ref.customerName}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(ref.refundAmount)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {ref.reason}
                  </TableCell>
                  <TableCell>{getMethodLabel(ref.paymentMethod)}</TableCell>
                  <TableCell>{getStatusBadge(ref.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {ref.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => {
                              setSelectedRefund(ref);
                              setIsApproveOpen(true);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              setSelectedRefund(ref);
                              setIsRejectOpen(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {ref.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => {
                            setSelectedRefund(ref);
                            setIsProcessOpen(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRefund(ref);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refund Request Details</DialogTitle>
            <DialogDescription>
              Detailed information for order {selectedRefund?.orderNumber || 'record'}
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Customer</label>
                  <p className="font-medium">{selectedRefund.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRefund.customerEmail}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Refund Amount</label>
                  <p className="text-lg font-bold">{formatPrice(selectedRefund.refundAmount)}</p>
                  {selectedRefund.originalAmount !== selectedRefund.refundAmount && (
                    <p className="text-sm text-muted-foreground">
                      Original: {formatPrice(selectedRefund.originalAmount)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Payment Method</label>
                  <p className="font-medium">{getMethodLabel(selectedRefund.paymentMethod)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-muted-foreground">Reason</label>
                  <p className="font-medium">{selectedRefund.reason}</p>
                </div>
              </div>

              {selectedRefund.bankDetails && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <label className="text-sm font-medium">Bank Details for Refund</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="ml-2">{selectedRefund.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account:</span>
                      <span className="ml-2 font-mono">{selectedRefund.bankDetails.accountNumber}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Holder:</span>
                      <span className="ml-2">{selectedRefund.bankDetails.accountHolder}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedRefund.notes && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                  <label className="text-sm font-medium text-red-600">Notes</label>
                  <p className="text-sm text-red-600 mt-1">{selectedRefund.notes}</p>
                </div>
              )}

              {selectedRefund.processedBy && (
                <div className="text-sm text-muted-foreground">
                  Processed by {selectedRefund.processedBy} on{' '}
                  {selectedRefund.processedAt && format(selectedRefund.processedAt, 'MMM dd, yyyy HH:mm')}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Refund Request</DialogTitle>
            <DialogDescription>
              Approve this refund request for processing.
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order:</span>
                    <span className="ml-2 font-medium">{selectedRefund.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-2 font-bold">{formatPrice(selectedRefund.refundAmount)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="ml-2">{selectedRefund.customerName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund.
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order:</span>
                    <span className="ml-2 font-medium">{selectedRefund.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-2 font-bold">{formatPrice(selectedRefund.refundAmount)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="Explain why this refund is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Reject Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Mark this refund as processed after completing the payment.
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order:</span>
                    <span className="ml-2 font-medium">{selectedRefund.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-2 font-bold">{formatPrice(selectedRefund.refundAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Method:</span>
                    <span className="ml-2">{getMethodLabel(selectedRefund.paymentMethod)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="ml-2">{selectedRefund.customerName}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Processing Notes (Optional)</label>
                <Textarea
                  placeholder="Add any notes about the refund processing..."
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcess}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Mark as Processed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
