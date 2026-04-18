import { useState } from 'react';
import { format } from 'date-fns';
import { RotateCcw, Search, Download, Eye, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { Separator } from '@/components/ui/separator';
import { usePOSReturns, usePOSTransactions, useCreatePOSReturn, useProcessPOSReturn, type POSReturn, type POSTransaction } from '@/hooks/usePOS';

export default function POSReturns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<POSReturn | null>(null);
  const [processDialog, setProcessDialog] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  // New return dialog
  const [newReturnDialog, setNewReturnDialog] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [foundTransaction, setFoundTransaction] = useState<POSTransaction | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnMethod, setReturnMethod] = useState('cash');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const { data: returns = [], isLoading } = usePOSReturns({ status: statusFilter });
  const { data: allTransactions = [] } = usePOSTransactions();
  const createReturn = useCreatePOSReturn();
  const processReturn = useProcessPOSReturn();

  const filteredReturns = returns.filter(ret => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return ret.return_number.toLowerCase().includes(search) ||
      ret.original_receipt.toLowerCase().includes(search);
  });

  const stats = {
    pending: returns.filter(r => r.status === 'pending').length,
    completed: returns.filter(r => r.status === 'completed').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    totalRefunded: returns.filter(r => r.status === 'completed').reduce((sum, r) => sum + Number(r.refund_amount), 0),
  };

  const handleSearchReceipt = () => {
    const txn = allTransactions.find(t => t.receipt_number.toLowerCase() === receiptSearch.toLowerCase());
    if (txn) {
      setFoundTransaction(txn);
      // Initialize all items as not selected
      const items: Record<string, number> = {};
      txn.items?.forEach(item => { items[item.id] = 0; });
      setSelectedItems(items);
    }
  };

  const handleCreateReturn = async () => {
    if (!foundTransaction) return;

    const returnItems = foundTransaction.items?.filter(item => (selectedItems[item.id] || 0) > 0) || [];
    if (returnItems.length === 0) return;

    const refundAmount = returnItems.reduce((sum, item) => sum + (item.unit_price * (selectedItems[item.id] || 0)), 0);

    await createReturn.mutateAsync({
      originalTransactionId: foundTransaction.id,
      originalReceipt: foundTransaction.receipt_number,
      shiftId: foundTransaction.shift_id,
      refundAmount,
      reason: returnReason,
      refundMethod: returnMethod,
      items: returnItems.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        originalQuantity: item.quantity,
        returnQuantity: selectedItems[item.id] || 0,
        unitPrice: item.unit_price,
        refundAmount: item.unit_price * (selectedItems[item.id] || 0),
      })),
    });

    setNewReturnDialog(false);
    setFoundTransaction(null);
    setReturnReason('');
    setReceiptSearch('');
    setSelectedItems({});
  };

  const handleProcess = async () => {
    if (!selectedReturn) return;
    await processReturn.mutateAsync({
      returnId: selectedReturn.id,
      action: processAction,
      rejectionReason: processAction === 'reject' ? rejectionReason : undefined,
    });
    setProcessDialog(false);
    setSelectedReturn(null);
    setRejectionReason('');
  };

  const getRefundMethodBadge = (method: string) => {
    switch (method) {
      case 'cash': return <Badge variant="default" className="bg-success">Cash</Badge>;
      case 'card': return <Badge variant="secondary">Card Refund</Badge>;
      case 'store_credit': return <Badge variant="outline">Store Credit</Badge>;
      default: return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">POS Returns & Refunds</h1>
          <p className="text-muted-foreground">Manage return requests and process refunds</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button onClick={() => setNewReturnDialog(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />New Return
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{stats.completed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{stats.rejected}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {stats.totalRefunded.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search return or receipt number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No returns found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Original Receipt</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-medium">{ret.return_number}</TableCell>
                    <TableCell className="text-muted-foreground">{ret.original_receipt}</TableCell>
                    <TableCell className="font-semibold text-destructive">Rs. {Number(ret.refund_amount).toLocaleString()}</TableCell>
                    <TableCell>{getRefundMethodBadge(ret.refund_method)}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate text-muted-foreground" title={ret.reason}>{ret.reason}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{format(new Date(ret.created_at), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(ret.created_at), 'hh:mm a')}</div>
                    </TableCell>
                    <TableCell><StatusBadge status={ret.status as any} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedReturn(ret)}><Eye className="h-4 w-4" /></Button>
                        {ret.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-success" onClick={() => { setSelectedReturn(ret); setProcessAction('approve'); setProcessDialog(true); }}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedReturn(ret); setProcessAction('reject'); setProcessDialog(true); }}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Return Details Dialog */}
      <Dialog open={!!selectedReturn && !processDialog} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />{selectedReturn?.return_number}
            </DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Original Receipt</span>
                <Badge variant="outline">{selectedReturn.original_receipt}</Badge>
              </div>
              <Separator />
              {selectedReturn.items && selectedReturn.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Return Items</h4>
                  {selectedReturn.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div>
                        <p>{item.product_name}</p>
                        <p className="text-muted-foreground">Qty: {item.return_quantity}</p>
                      </div>
                      <span className="text-destructive">Rs. {Number(item.refund_amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Amount</span>
                  <span className="font-bold text-destructive">Rs. {Number(selectedReturn.refund_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Method</span>
                  {getRefundMethodBadge(selectedReturn.refund_method)}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{selectedReturn.reason}</p>
              </div>
              {selectedReturn.rejection_reason && (
                <div className="rounded-lg bg-destructive/10 p-3">
                  <p className="text-xs text-destructive mb-1">Rejection Reason</p>
                  <p className="text-sm">{selectedReturn.rejection_reason}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selectedReturn.status as any} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(selectedReturn.created_at), 'MMM dd, yyyy hh:mm a')}</span>
                </div>
              </div>
              {selectedReturn.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" className="flex-1" onClick={() => { setProcessAction('reject'); setProcessDialog(true); }}>
                    <XCircle className="mr-2 h-4 w-4" />Reject
                  </Button>
                  <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => { setProcessAction('approve'); setProcessDialog(true); }}>
                    <CheckCircle className="mr-2 h-4 w-4" />Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={processDialog} onOpenChange={setProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{processAction === 'approve' ? 'Approve Return' : 'Reject Return'}</DialogTitle>
            <DialogDescription>
              {processAction === 'approve'
                ? `Approve refund of Rs. ${selectedReturn ? Number(selectedReturn.refund_amount).toLocaleString() : 0}? Stock will be restored.`
                : 'Provide a reason for rejecting this return.'}
            </DialogDescription>
          </DialogHeader>
          {processAction === 'reject' && (
            <div className="py-4">
              <Label>Rejection Reason</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter reason for rejection..." className="mt-2" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialog(false)}>Cancel</Button>
            <Button
              variant={processAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleProcess}
              disabled={processReturn.isPending || (processAction === 'reject' && !rejectionReason.trim())}
            >
              {processReturn.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {processAction === 'approve' ? 'Approve & Refund' : 'Reject Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Return Dialog */}
      <Dialog open={newReturnDialog} onOpenChange={(open) => { setNewReturnDialog(open); if (!open) { setFoundTransaction(null); setReceiptSearch(''); setReturnReason(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Return</DialogTitle>
            <DialogDescription>Search by receipt number to start a return</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input value={receiptSearch} onChange={(e) => setReceiptSearch(e.target.value)} placeholder="Enter receipt number (e.g., RCP-20260412-0001)" className="flex-1" />
              <Button onClick={handleSearchReceipt} variant="outline">Search</Button>
            </div>

            {foundTransaction && (
              <>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{foundTransaction.receipt_number}</span>
                    <span className="text-muted-foreground">{format(new Date(foundTransaction.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Select items to return</Label>
                    {foundTransaction.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Purchased: {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Return qty:</Label>
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={selectedItems[item.id] || 0}
                            onChange={(e) => setSelectedItems(prev => ({ ...prev, [item.id]: Math.min(parseInt(e.target.value) || 0, item.quantity) }))}
                            className="w-16 h-8"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason for Return</Label>
                  <Textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Enter reason..." />
                </div>

                <div className="space-y-2">
                  <Label>Refund Method</Label>
                  <Select value={returnMethod} onValueChange={setReturnMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card Refund</SelectItem>
                      <SelectItem value="store_credit">Store Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {Object.values(selectedItems).some(v => v > 0) && (
                  <div className="rounded-lg bg-muted p-3 text-right">
                    <span className="text-muted-foreground">Refund Total: </span>
                    <span className="font-bold text-destructive">
                      Rs. {foundTransaction.items?.reduce((sum, item) => sum + (Number(item.unit_price) * (selectedItems[item.id] || 0)), 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewReturnDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateReturn}
              disabled={createReturn.isPending || !foundTransaction || !returnReason.trim() || !Object.values(selectedItems).some(v => v > 0)}
            >
              {createReturn.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Create Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
