import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  Image as ImageIcon,
  FileText,
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

interface BankDeposit {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  reference: string;
  slipImage?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  submittedAt: Date;
}

const mockBankDeposits: BankDeposit[] = [
  { id: '1', orderNumber: 'ORD-2024-002', customerName: 'Nimali Silva', amount: 8399, bankName: 'BOC', accountNumber: '****4567', reference: 'REF123456', slipImage: '/placeholder.svg', status: 'pending', submittedAt: new Date() },
  { id: '2', orderNumber: 'ORD-2024-008', customerName: 'Priya Mendis', amount: 15200, bankName: 'Sampath', accountNumber: '****7890', reference: 'REF789012', slipImage: '/placeholder.svg', status: 'verified', verifiedBy: 'Admin', verifiedAt: new Date(), submittedAt: new Date() },
  { id: '3', orderNumber: 'ORD-2024-011', customerName: 'Asanka Perera', amount: 6500, bankName: 'Commercial', accountNumber: '****1234', reference: 'REF345678', status: 'rejected', rejectionReason: 'Amount mismatch in slip', submittedAt: new Date() },
  { id: '4', orderNumber: 'ORD-2024-014', customerName: 'Gayan Fernando', amount: 12800, bankName: 'HNB', accountNumber: '****5678', reference: 'REF901234', slipImage: '/placeholder.svg', status: 'pending', submittedAt: new Date() },
  { id: '5', orderNumber: 'ORD-2024-017', customerName: 'Chamari Silva', amount: 4200, bankName: 'BOC', accountNumber: '****9012', reference: 'REF567890', slipImage: '/placeholder.svg', status: 'verified', verifiedBy: 'Manager', verifiedAt: new Date(), submittedAt: new Date() },
];

import { usePayments, PaymentRow, useUpdatePaymentStatus } from '@/hooks/usePayments';

const getStatusBadge = (status: PaymentRow['status']) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    verified: 'bg-green-500/10 text-green-600 border-green-200',
    rejected: 'bg-red-500/10 text-red-600 border-red-200',
  };
  const labels = {
    pending: 'Pending Verification',
    verified: 'Verified',
    rejected: 'Rejected',
  };
  return (
    <Badge variant="outline" className={styles[status as 'pending' | 'verified' | 'rejected'] || ''}>
      {labels[status as 'pending' | 'verified' | 'rejected'] || status}
    </Badge>
  );
};

export default function BankDeposits() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<PaymentRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: payments = [], isLoading } = usePayments({ method: 'bank' });
  const updateStatus = useUpdatePaymentStatus();

  const filteredDeposits = payments.filter((dep) => {
    const orderNum = (dep.order_number || '').toLowerCase();
    const customer = (dep.customer_name || '').toLowerCase();
    const ref = (dep.reference || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = orderNum.includes(query) || customer.includes(query) || ref.includes(query);
    const matchesStatus = statusFilter === 'all' || dep.status === statusFilter;
    // Bank filtering is tricky if bankName isn't a column yet, but we'll try to guess from notes or keep 'all'
    const matchesBank = bankFilter === 'all' || (dep.notes?.includes(bankFilter));
    
    return matchesSearch && matchesStatus && matchesBank;
  });

  const stats = {
    pendingVerification: payments.filter(d => d.status === 'pending').reduce((sum, d) => sum + Number(d.amount), 0),
    pendingCount: payments.filter(d => d.status === 'pending').length,
    verifiedToday: payments.filter(d => d.status === 'verified').reduce((sum, d) => sum + Number(d.amount), 0),
    rejectedCount: payments.filter(d => d.status === 'rejected').length,
  };

  const handleVerify = async () => {
    if (!selectedDeposit) return;
    updateStatus.mutate({ 
      id: selectedDeposit.id, 
      status: 'verified', 
      orderNumber: selectedDeposit.order_number || 'Unknown' 
    });
    setIsVerifyOpen(false);
    setIsDetailOpen(false);
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    updateStatus.mutate({ 
      id: selectedDeposit.id, 
      status: 'rejected', 
      notes: rejectionReason,
      orderNumber: selectedDeposit.order_number || 'Unknown' 
    });
    setIsRejectOpen(false);
    setIsDetailOpen(false);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Deposits</h1>
          <p className="text-muted-foreground">Verify and manage bank deposit payments</p>
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
            title="Pending Verification"
            value={formatPrice(stats.pendingVerification)}
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
            icon={FileText}
            iconColor="text-blue-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Verified Today"
            value={formatPrice(stats.verifiedToday)}
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
            title="Rejected"
            value={stats.rejectedCount.toString()}
            icon={XCircle}
            iconColor="text-red-600"
          />
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-card rounded-lg border p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order, customer or reference..."
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
            <SelectItem value="pending">Pending Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={bankFilter} onValueChange={setBankFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Bank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Banks</SelectItem>
            <SelectItem value="BOC">BOC</SelectItem>
            <SelectItem value="Sampath">Sampath</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="HNB">HNB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deposits Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Slip</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No bank deposits found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeposits.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-medium">{dep.orderNumber}</TableCell>
                  <TableCell>{dep.customerName}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(dep.amount)}</TableCell>
                  <TableCell>{dep.bankName}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {dep.reference}
                  </TableCell>
                  <TableCell>{getStatusBadge(dep.status)}</TableCell>
                  <TableCell>
                    {dep.slipImage ? (
                      <Button variant="ghost" size="sm">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">No slip</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {dep.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => {
                              setSelectedDeposit(dep);
                              setIsVerifyOpen(true);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              setSelectedDeposit(dep);
                              setIsRejectOpen(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeposit(dep);
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
            <DialogTitle>Bank Deposit Details</DialogTitle>
            <DialogDescription>
              Verification details for order {selectedDeposit?.orderNumber || 'record'}
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Customer</label>
                  <p className="font-medium">{selectedDeposit.customerName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Amount</label>
                  <p className="text-lg font-bold">{formatPrice(selectedDeposit.amount)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Bank</label>
                  <p className="font-medium">{selectedDeposit.bankName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Account</label>
                  <p className="font-mono text-sm">{selectedDeposit.accountNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Reference</label>
                  <p className="font-mono text-sm">{selectedDeposit.reference}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                </div>
              </div>
              
              {selectedDeposit.slipImage && (
                <div>
                  <label className="text-sm text-muted-foreground">Deposit Slip</label>
                  <div className="mt-2 border rounded-lg overflow-hidden bg-muted/50 aspect-video flex items-center justify-center">
                    <img
                      src={selectedDeposit.slipImage}
                      alt="Deposit slip"
                      className="max-h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {selectedDeposit.status === 'rejected' && selectedDeposit.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                  <label className="text-sm font-medium text-red-600">Rejection Reason</label>
                  <p className="text-sm text-red-600 mt-1">{selectedDeposit.rejectionReason}</p>
                </div>
              )}

              {selectedDeposit.status === 'verified' && (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-3">
                  <p className="text-sm text-green-600">
                    Verified by {selectedDeposit.verifiedBy} on{' '}
                    {selectedDeposit.verifiedAt && format(selectedDeposit.verifiedAt, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Bank Deposit</DialogTitle>
            <DialogDescription>
              Confirm that this bank deposit is valid and matches the order amount.
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order:</span>
                    <span className="ml-2 font-medium">{selectedDeposit.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-2 font-bold">{formatPrice(selectedDeposit.amount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="ml-2 font-mono">{selectedDeposit.reference}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="ml-2">{selectedDeposit.bankName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verify Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Bank Deposit</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this deposit.
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order:</span>
                    <span className="ml-2 font-medium">{selectedDeposit.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-2 font-bold">{formatPrice(selectedDeposit.amount)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="Explain why this deposit is being rejected..."
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
              Reject Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
