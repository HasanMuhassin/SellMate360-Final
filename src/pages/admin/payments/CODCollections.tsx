import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Banknote,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
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

interface CODCollection {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  courier: string;
  trackingNumber: string;
  status: 'pending' | 'collected' | 'remitted' | 'rejected';
  deliveredAt?: Date;
  collectedAt?: Date;
  remittedAt?: Date;
  notes?: string;
  createdAt: Date;
}

const mockCODCollections: CODCollection[] = [
  { id: '1', orderNumber: 'ORD-2024-001', customerName: 'Kasun Perera', amount: 5348, courier: 'DomEx', trackingNumber: 'DX123456789', status: 'pending', createdAt: new Date() },
  { id: '2', orderNumber: 'ORD-2024-005', customerName: 'Sunil Bandara', amount: 7800, courier: 'Pronto', trackingNumber: 'PR987654321', status: 'collected', deliveredAt: new Date(), createdAt: new Date() },
  { id: '3', orderNumber: 'ORD-2024-010', customerName: 'Malini Fernando', amount: 3450, courier: 'DomEx', trackingNumber: 'DX111222333', status: 'remitted', deliveredAt: new Date(), collectedAt: new Date(), remittedAt: new Date(), createdAt: new Date() },
  { id: '4', orderNumber: 'ORD-2024-012', customerName: 'Amal Silva', amount: 9200, courier: 'Pronto', trackingNumber: 'PR444555666', status: 'rejected', notes: 'Customer refused delivery', createdAt: new Date() },
  { id: '5', orderNumber: 'ORD-2024-015', customerName: 'Kumari Dias', amount: 4500, courier: 'DomEx', trackingNumber: 'DX777888999', status: 'collected', deliveredAt: new Date(), createdAt: new Date() },
  { id: '6', orderNumber: 'ORD-2024-018', customerName: 'Ruwan Jayasekara', amount: 6750, courier: 'Speed Post', trackingNumber: 'SP123123123', status: 'pending', createdAt: new Date() },
];

import { usePayments, PaymentRow, useUpdatePaymentStatus } from '@/hooks/usePayments';

const getStatusBadge = (status: PaymentRow['status']) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    collected: 'bg-blue-500/10 text-blue-600 border-blue-200',
    remitted: 'bg-green-500/10 text-green-600 border-green-200',
    rejected: 'bg-red-500/10 text-red-600 border-red-200',
  };
  const labels = {
    pending: 'Pending Delivery',
    collected: 'Cash Collected',
    remitted: 'Remitted',
    rejected: 'Rejected',
  };
  return (
    <Badge variant="outline" className={styles[status as 'pending' | 'collected' | 'remitted'] || ''}>
      {labels[status as 'pending' | 'collected' | 'remitted'] || status}
    </Badge>
  );
};

export default function CODCollections() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<PaymentRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'collected' | 'remitted' | null>(null);
  const [processNotes, setProcessNotes] = useState('');

  const { data: payments = [], isLoading } = usePayments({ method: 'cod' });
  const updateStatus = useUpdatePaymentStatus();

  const filteredCollections = payments.filter((col) => {
    const orderNum = (col.order_number || '').toLowerCase();
    const customer = (col.customer_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = orderNum.includes(query) || customer.includes(query);
    const matchesStatus = statusFilter === 'all' || col.status === statusFilter;
    // Courier filter - we can try to find it in notes for now
    const matchesCourier = courierFilter === 'all' || (col.notes?.includes(courierFilter));
    
    return matchesSearch && matchesStatus && matchesCourier;
  });

  const stats = {
    pendingDelivery: payments.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0),
    awaitingRemittance: payments.filter(c => c.status === 'collected').reduce((sum, c) => sum + Number(c.amount), 0),
    totalRemitted: payments.filter(c => c.status === 'remitted').reduce((sum, c) => sum + Number(c.amount), 0),
    rejectedCount: payments.filter(c => c.status === 'rejected').length,
  };

  const handleConfirmAction = async () => {
    if (selectedCollection && confirmAction) {
      updateStatus.mutate({
        id: selectedCollection.id,
        status: confirmAction,
        notes: processNotes,
        orderNumber: selectedCollection.order_number || 'Unknown'
      });
      setIsConfirmOpen(false);
      setIsDetailOpen(false);
      setProcessNotes('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">COD Collections</h1>
          <p className="text-muted-foreground">Track and manage Cash on Delivery payments</p>
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
            title="Pending Delivery"
            value={formatPrice(stats.pendingDelivery)}
            icon={Truck}
            iconColor="text-yellow-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="Awaiting Remittance"
            value={formatPrice(stats.awaitingRemittance)}
            icon={Banknote}
            iconColor="text-blue-600"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Total Remitted"
            value={formatPrice(stats.totalRemitted)}
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
            title="Rejected Orders"
            value={stats.rejectedCount.toString()}
            icon={AlertTriangle}
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
              placeholder="Search by order, customer or tracking..."
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
            <SelectItem value="pending">Pending Delivery</SelectItem>
            <SelectItem value="collected">Cash Collected</SelectItem>
            <SelectItem value="remitted">Remitted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={courierFilter} onValueChange={setCourierFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Courier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Couriers</SelectItem>
            <SelectItem value="DomEx">DomEx</SelectItem>
            <SelectItem value="Pronto">Pronto</SelectItem>
            <SelectItem value="Speed Post">Speed Post</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Collections Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No COD collections found
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.map((col) => (
                <TableRow key={col.id}>
                  <TableCell className="font-medium">{col.orderNumber}</TableCell>
                  <TableCell>{col.customerName}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(col.amount)}</TableCell>
                  <TableCell>{col.courier}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {col.trackingNumber}
                  </TableCell>
                  <TableCell>{getStatusBadge(col.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {col.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600"
                          onClick={() => {
                            setSelectedCollection(col);
                            setConfirmAction('collected');
                            setIsConfirmOpen(true);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {col.status === 'collected' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => {
                            setSelectedCollection(col);
                            setConfirmAction('remitted');
                            setIsConfirmOpen(true);
                          }}
                        >
                          <Banknote className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCollection(col);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>COD Collection Details</DialogTitle>
            <DialogDescription>
              Collection status for order {selectedCollection?.orderNumber || 'record'}
            </DialogDescription>
          </DialogHeader>
          {selectedCollection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Customer</label>
                  <p className="font-medium">{selectedCollection.customerName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Amount</label>
                  <p className="text-lg font-bold">{formatPrice(selectedCollection.amount)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Courier</label>
                  <p className="font-medium">{selectedCollection.courier}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tracking</label>
                  <p className="font-mono text-sm">{selectedCollection.trackingNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedCollection.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Created</label>
                  <p className="font-medium">
                    {format(selectedCollection.createdAt, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              {selectedCollection.notes && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <label className="text-sm text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1">{selectedCollection.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'collected' ? 'Confirm Cash Collection' : 'Confirm Remittance'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'collected'
                ? 'Mark this COD order as cash collected from courier?'
                : 'Mark this amount as remitted to your bank account?'}
            </DialogDescription>
          </DialogHeader>
          {selectedCollection && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">{formatPrice(selectedCollection.amount)}</p>
              </div>
              <Textarea placeholder="Add notes (optional)" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
