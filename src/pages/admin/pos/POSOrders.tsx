import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Receipt, Search, Filter, Download, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { Separator } from '@/components/ui/separator';
import { usePOSTransactions, type POSTransaction } from '@/hooks/usePOS';

export default function POSOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<POSTransaction | null>(null);

  const { data: transactions = [], isLoading } = usePOSTransactions({
    status: statusFilter,
    paymentMethod: paymentFilter,
  });

  const filteredOrders = transactions.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return order.receipt_number.toLowerCase().includes(search) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(search));
  });

  const completedOrders = transactions.filter(o => o.status === 'completed');
  const todayStats = {
    totalSales: completedOrders.reduce((sum, o) => sum + Number(o.total), 0),
    totalTransactions: completedOrders.length,
    cashSales: completedOrders.filter(o => o.payment_method === 'cash' && !o.is_split_payment).reduce((sum, o) => sum + Number(o.total), 0)
      + completedOrders.filter(o => o.is_split_payment).reduce((sum, o) => sum + Number(o.cash_amount || 0), 0),
    cardSales: completedOrders.filter(o => o.payment_method === 'card' && !o.is_split_payment).reduce((sum, o) => sum + Number(o.total), 0)
      + completedOrders.filter(o => o.is_split_payment).reduce((sum, o) => sum + Number(o.card_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">POS Orders</h1>
          <p className="text-muted-foreground">Manage point-of-sale transactions</p>
        </div>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Rs. {todayStats.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{todayStats.totalTransactions} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Rs. {todayStats.cashSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">Rs. {todayStats.cardSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {todayStats.totalTransactions > 0 ? Math.round(todayStats.totalSales / todayStats.totalTransactions).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search receipt number, customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="split">Split</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No POS transactions found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.receipt_number}</TableCell>
                    <TableCell>
                      <div className="text-sm">{format(new Date(order.created_at), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'hh:mm a')}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.customer_name || 'Walk-in'}</TableCell>
                    <TableCell>{order.items?.length || 0} items</TableCell>
                    <TableCell className="font-semibold">Rs. {Number(order.total).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={order.payment_method === 'cash' ? 'default' : order.payment_method === 'card' ? 'secondary' : 'outline'}>
                        {order.is_split_payment ? 'Split' : order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={order.status as any} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />{selectedOrder?.receipt_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                {format(new Date(selectedOrder.created_at), 'MMMM dd, yyyy • hh:mm a')}
              </div>
              {selectedOrder.customer_name && (
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Customer: </span>
                  <span className="font-medium">{selectedOrder.customer_name}</span>
                  {selectedOrder.customer_phone && <span className="text-sm text-muted-foreground"> ({selectedOrder.customer_phone})</span>}
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>Rs. {Number(item.total_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rs. {Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>- Rs. {Number(selectedOrder.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>Rs. {Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <Badge>{selectedOrder.is_split_payment ? 'Split' : selectedOrder.payment_method}</Badge>
                </div>
                {selectedOrder.payment_method === 'cash' && selectedOrder.cash_received && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash Received</span>
                      <span>Rs. {Number(selectedOrder.cash_received).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change</span>
                      <span>Rs. {Number(selectedOrder.change_given || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {selectedOrder.is_split_payment && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash</span>
                      <span>Rs. {Number(selectedOrder.cash_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Card</span>
                      <span>Rs. {Number(selectedOrder.card_amount || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1"><Printer className="mr-2 h-4 w-4" />Print Receipt</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
