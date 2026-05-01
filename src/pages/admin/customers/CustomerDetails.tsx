import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Shield,
  Ban,
  CheckCircle,
  Clock,
  Package,
  CreditCard,
  MessageSquare,
  Plus,
  Edit,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/admin/StatCard';
import {
  useCustomer,
  useCustomerAddressesByCustomer,
  useCustomerNotes,
  useCustomerOrderHistory,
  useBlockCustomer,
  useAddCustomerNote,
} from '@/hooks/useCustomers';
import { format } from 'date-fns';

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-red-100 text-red-700 border-red-300',
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

const paymentMethodLabels: Record<string, string> = {
  cod: 'Cash on Delivery',
  bank: 'Bank Transfer',
  card: 'Card Payment',
  online: 'Online Payment',
};

export default function CustomerDetails() {
  const { id } = useParams();
  const { data: customer, isLoading } = useCustomer(id || '');
  const { data: addresses = [] } = useCustomerAddressesByCustomer(id || '');
  const { data: notes = [] } = useCustomerNotes(id || '');
  const { data: orders = [] } = useCustomerOrderHistory(id || '');
  const blockCustomer = useBlockCustomer();
  const addNote = useAddCustomerNote();

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<string>('general');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleBlockCustomer = () => {
    blockCustomer.mutate(
      {
        id: customer.id,
        is_blocked: !customer.is_blocked,
        blocked_reason: !customer.is_blocked ? blockReason : undefined,
      },
      {
        onSuccess: () => {
          setBlockDialogOpen(false);
          setBlockReason('');
        },
      }
    );
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote.mutate(
      {
        customer_id: customer.id,
        content: newNote,
        type: noteType,
        created_by: 'Admin',
      },
      {
        onSuccess: () => {
          setNoteDialogOpen(false);
          setNewNote('');
          setNoteType('general');
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-medium text-primary">
                {customer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <Badge variant="outline" className={riskColors[customer.risk_score] || ''}>
                  <Shield className="h-3 w-3 mr-1" />
                  {customer.risk_score} risk
                </Badge>
                {customer.is_blocked && <Badge variant="destructive">Blocked</Badge>}
              </div>
              <p className="text-muted-foreground">
                Customer since {format(new Date(customer.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNoteDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Note
          </Button>
          <Button
            variant={customer.is_blocked ? 'default' : 'destructive'}
            onClick={() => setBlockDialogOpen(true)}
          >
            {customer.is_blocked ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Unblock
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Block
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={(customer.order_count || 0).toString()} icon={ShoppingBag} description="Lifetime orders" />
        <StatCard title="Total Spent" value={formatCurrency(Number(customer.total_spent || 0))} icon={DollarSign} description="Lifetime value" />
        <StatCard title="Avg. Order Value" value={formatCurrency(Number(customer.average_order_value || 0))} icon={CreditCard} description="Per order" />
        <StatCard
          title="COD Rejections"
          value={`${customer.cod_rejection_count || 0} (${Number(customer.cod_rejection_rate || 0).toFixed(0)}%)`}
          icon={Number(customer.cod_rejection_rate || 0) > 20 ? AlertTriangle : Package}
          description="Rejection rate"
        />
      </div>

      {/* Blocked Reason */}
      {customer.is_blocked && customer.blocked_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <Ban className="h-5 w-5" />
              Block Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{customer.blocked_reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="addresses">Addresses ({addresses.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
                {customer.alternate_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Alternate Phone</p>
                      <p className="font-medium">{customer.alternate_phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Preferences & Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Payment</p>
                  <p className="font-medium">
                    {customer.preferred_payment
                      ? paymentMethodLabels[customer.preferred_payment] || customer.preferred_payment
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Order</p>
                  <p className="font-medium">
                    {customer.last_order_date
                      ? format(new Date(customer.last_order_date), 'MMM dd, yyyy')
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No tags</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order History</CardTitle>
              <CardDescription>All orders placed by this customer</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No orders found for this customer
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                        <TableCell>
                          <Badge className={orderStatusColors[order.order_status] || ''}>
                            {order.order_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          {addresses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No addresses found for this customer
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {address.label}
                      </CardTitle>
                      {address.is_default && <Badge variant="secondary">Default</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {address.recipient_name && (
                      <p className="font-medium">{address.recipient_name}</p>
                    )}
                    {address.phone && (
                      <p className="text-sm text-muted-foreground">{address.phone}</p>
                    )}
                    <p className="text-sm">
                      {address.street}
                      <br />
                      {address.city}, {address.district}
                      {address.postal_code && ` - ${address.postal_code}`}
                    </p>
                    {address.delivery_instructions && (
                      <p className="text-xs text-muted-foreground italic">
                        Note: {address.delivery_instructions}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Customer Notes</CardTitle>
                <Button size="sm" onClick={() => setNoteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No notes for this customer
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={
                            note.type === 'complaint'
                              ? 'border-red-300 text-red-700'
                              : note.type === 'internal'
                              ? 'border-purple-300 text-purple-700'
                              : note.type === 'feedback'
                              ? 'border-blue-300 text-blue-700'
                              : ''
                          }
                        >
                          {note.type}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(note.created_at), 'MMM dd, yyyy')} by {note.created_by}
                        </div>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {customer.is_blocked ? 'Unblock Customer' : 'Block Customer'}
            </DialogTitle>
            <DialogDescription>
              {customer.is_blocked
                ? `Are you sure you want to unblock ${customer.name}?`
                : `Are you sure you want to block ${customer.name}? They will not be able to place COD orders.`}
            </DialogDescription>
          </DialogHeader>
          {!customer.is_blocked && (
            <div className="space-y-2">
              <Label>Reason for blocking</Label>
              <Textarea
                placeholder="Enter reason..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={customer.is_blocked ? 'default' : 'destructive'}
              onClick={handleBlockCustomer}
              disabled={blockCustomer.isPending}
            >
              {customer.is_blocked ? 'Unblock' : 'Block Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note to this customer's profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note Content</Label>
              <Textarea
                placeholder="Enter note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!newNote.trim() || addNote.isPending}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
