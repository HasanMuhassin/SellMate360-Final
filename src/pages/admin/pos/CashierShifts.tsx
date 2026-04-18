import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, DollarSign, Users, Play, Square, Eye, Calculator, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/admin/StatusBadge';
import { Separator } from '@/components/ui/separator';
import { useCashierShifts, useOpenShift, useCloseShift, type CashierShift } from '@/hooks/usePOS';

export default function CashierShifts() {
  const { data: shifts = [], isLoading } = useCashierShifts();
  const openShiftMutation = useOpenShift();
  const closeShiftMutation = useCloseShift();

  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CashierShift | null>(null);
  const [openingBalance, setOpeningBalance] = useState('10000');
  const [closingBalance, setClosingBalance] = useState('');

  const activeShifts = shifts.filter(s => s.status === 'open');
  const totals = {
    totalCashSales: shifts.reduce((sum, s) => sum + Number(s.cash_sales), 0),
    totalCardSales: shifts.reduce((sum, s) => sum + Number(s.card_sales), 0),
    totalTransactions: shifts.reduce((sum, s) => sum + s.transaction_count, 0),
    activeShifts: activeShifts.length,
  };

  const handleOpenShift = async () => {
    await openShiftMutation.mutateAsync({ openingBalance: parseFloat(openingBalance) || 10000 });
    setOpenShiftDialog(false);
    setOpeningBalance('10000');
  };

  const handleCloseShift = async () => {
    if (!selectedShift) return;
    await closeShiftMutation.mutateAsync({
      shiftId: selectedShift.id,
      closingBalance: parseFloat(closingBalance) || 0,
    });
    setCloseShiftDialog(false);
    setSelectedShift(null);
    setClosingBalance('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cashier Shifts</h1>
          <p className="text-muted-foreground">Manage shift openings, closings, and reconciliation</p>
        </div>
        <Button onClick={() => setOpenShiftDialog(true)}>
          <Play className="mr-2 h-4 w-4" />Open New Shift
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totals.activeShifts}</div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Rs. {totals.totalCashSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">Rs. {totals.totalCardSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Shifts */}
      {activeShifts.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />Active Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeShifts.map((shift) => (
                <Card key={shift.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Shift</h3>
                        <p className="text-sm text-muted-foreground">Started {format(new Date(shift.opened_at), 'hh:mm a')}</p>
                      </div>
                      <Badge variant="default" className="bg-success">Active</Badge>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round((Date.now() - new Date(shift.opened_at).getTime()) / 3600000)}h
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash Sales</span>
                        <span className="text-success font-medium">Rs. {Number(shift.cash_sales).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Card Sales</span>
                        <span className="text-info font-medium">Rs. {Number(shift.card_sales).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transactions</span>
                        <span>{shift.transaction_count}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedShift(shift)}>
                        <Eye className="mr-1 h-3 w-3" />Details
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => { setSelectedShift(shift); setCloseShiftDialog(true); }}>
                        <Square className="mr-1 h-3 w-3" />Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Shift History</CardTitle>
          <CardDescription>Past shift records and reconciliation</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {shifts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No shifts recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cash Sales</TableHead>
                  <TableHead>Card Sales</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{format(new Date(shift.opened_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {shift.closed_at
                        ? `${Math.round((new Date(shift.closed_at).getTime() - new Date(shift.opened_at).getTime()) / 3600000)}h`
                        : 'Active'}
                    </TableCell>
                    <TableCell className="text-success">Rs. {Number(shift.cash_sales).toLocaleString()}</TableCell>
                    <TableCell className="text-info">Rs. {Number(shift.card_sales).toLocaleString()}</TableCell>
                    <TableCell>{shift.transaction_count}</TableCell>
                    <TableCell>
                      {shift.variance !== null ? (
                        <span className={Number(shift.variance) >= 0 ? 'text-success' : 'text-destructive'}>
                          {Number(shift.variance) >= 0 ? '+' : ''}Rs. {Number(shift.variance).toLocaleString()}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell><StatusBadge status={shift.status as any} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedShift(shift)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Open Shift Dialog */}
      <Dialog open={openShiftDialog} onOpenChange={setOpenShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open New Shift</DialogTitle>
            <DialogDescription>Start a new cashier shift with opening balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opening">Opening Cash Balance (Rs.)</Label>
              <Input id="opening" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Enter opening balance" />
              <p className="text-xs text-muted-foreground">Count the cash in drawer and enter the amount</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenShiftDialog(false)}>Cancel</Button>
            <Button onClick={handleOpenShift} disabled={openShiftMutation.isPending}>
              {openShiftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Start Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={closeShiftDialog} onOpenChange={(open) => { setCloseShiftDialog(open); if (!open) setSelectedShift(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close Shift</DialogTitle>
            <DialogDescription>Complete shift reconciliation</DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Opening Balance</span>
                  <span>Rs. {Number(selectedShift.opening_balance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cash Sales</span>
                  <span className="text-success">+ Rs. {Number(selectedShift.cash_sales).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Refunds</span>
                  <span className="text-destructive">- Rs. {Number(selectedShift.refunds).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Expected Cash</span>
                  <span>Rs. {(Number(selectedShift.opening_balance) + Number(selectedShift.cash_sales) - Number(selectedShift.refunds)).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing">Actual Cash Count (Rs.)</Label>
                <Input id="closing" type="number" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} placeholder="Enter cash drawer amount" />
              </div>
              {closingBalance && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex justify-between">
                    <span>Variance</span>
                    <span className={parseInt(closingBalance) - (Number(selectedShift.opening_balance) + Number(selectedShift.cash_sales) - Number(selectedShift.refunds)) >= 0 ? 'text-success' : 'text-destructive'}>
                      Rs. {(parseInt(closingBalance) - (Number(selectedShift.opening_balance) + Number(selectedShift.cash_sales) - Number(selectedShift.refunds))).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCloseShiftDialog(false); setSelectedShift(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleCloseShift} disabled={closeShiftMutation.isPending}>
              {closeShiftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
              Close Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Details Dialog */}
      <Dialog open={!!selectedShift && !closeShiftDialog} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Shift Details</DialogTitle></DialogHeader>
          {selectedShift && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Shift</h3>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedShift.opened_at), 'MMM dd, yyyy')}</p>
                </div>
                <div className="ml-auto"><StatusBadge status={selectedShift.status as any} /></div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Opened</p>
                  <p className="font-semibold">{format(new Date(selectedShift.opened_at), 'hh:mm a')}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Closed</p>
                  <p className="font-semibold">{selectedShift.closed_at ? format(new Date(selectedShift.closed_at), 'hh:mm a') : 'Still open'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span>Rs. {Number(selectedShift.opening_balance).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cash Sales</span><span className="text-success">Rs. {Number(selectedShift.cash_sales).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Card Sales</span><span className="text-info">Rs. {Number(selectedShift.card_sales).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Refunds</span><span className="text-destructive">Rs. {Number(selectedShift.refunds).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Transactions</span><span>{selectedShift.transaction_count}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Total Sales</span><span>Rs. {Number(selectedShift.total_sales).toLocaleString()}</span></div>
                {selectedShift.closing_balance !== null && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Closing Balance</span><span>Rs. {Number(selectedShift.closing_balance).toLocaleString()}</span></div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variance</span>
                      <span className={Number(selectedShift.variance || 0) >= 0 ? 'text-success' : 'text-destructive'}>
                        {Number(selectedShift.variance || 0) >= 0 ? '+' : ''}Rs. {Number(selectedShift.variance || 0).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
