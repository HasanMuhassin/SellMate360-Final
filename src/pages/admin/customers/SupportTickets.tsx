import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const functionsBaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

interface Ticket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  order_number: string | null;
  created_at: string;
  updated_at: string;
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`Ticket status updated to ${newStatus.replace('_', ' ')}`);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket');
    }
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'outline';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tickets.length} Total</Badge>
          <Badge variant="default">{tickets.filter(t => t.status === 'open').length} Open</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ticket number or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
              <p>No support tickets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant={priorityColor(ticket.priority) as any}>{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(ticket.status) as any}>{ticket.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{ticket.order_number || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
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

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ticket: {selectedTicket?.ticket_number}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedTicket.message}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <div><Badge variant={priorityColor(selectedTicket.priority) as any}>{selectedTicket.priority}</Badge></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div><Badge variant={statusColor(selectedTicket.status) as any}>{selectedTicket.status.replace('_', ' ')}</Badge></div>
                </div>
                {selectedTicket.order_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Order</label>
                    <p className="font-mono text-sm">{selectedTicket.order_number}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Update Status</label>
                <div className="flex gap-2 mt-1">
                  {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedTicket.status === s ? 'default' : 'outline'}
                      onClick={() => updateTicketStatus(selectedTicket.id, s)}
                      disabled={selectedTicket.status === s}
                    >
                      {s.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
