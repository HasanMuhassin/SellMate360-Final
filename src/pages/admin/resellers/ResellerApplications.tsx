import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/admin/StatCard';
import { 
  useResellerApplications, 
  useApproveReseller, 
  useRejectReseller 
} from '@/hooks/useAdminResellers';
import { toast } from 'sonner';
import type { Reseller, ApprovalStatus } from '@/types/database';

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700',
};

export default function ResellerApplications() {
  const { data: applications, isLoading, error } = useResellerApplications();
  const approveReseller = useApproveReseller();
  const rejectReseller = useRejectReseller();
  
  const [selectedApp, setSelectedApp] = useState<Reseller | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const stats = {
    total: applications?.length ?? 0,
    pending: applications?.filter((a) => a.status === 'pending').length ?? 0,
    approved: applications?.filter((a) => a.status === 'approved').length ?? 0,
    rejected: applications?.filter((a) => a.status === 'rejected').length ?? 0,
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const handleApprove = async (app: Reseller) => {
    try {
      await approveReseller.mutateAsync({ resellerId: app.id });
      toast.success(`Application for ${app.business_name} approved!`);
      setViewDialogOpen(false);
    } catch (err) {
      toast.error('Failed to approve application');
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) return;

    try {
      await rejectReseller.mutateAsync({ 
        resellerId: selectedApp.id, 
        reason: rejectionReason 
      });
      toast.success(`Application for ${selectedApp.business_name} rejected.`);
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason('');
    } catch (err) {
      toast.error('Failed to reject application');
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold">Reseller Applications</h1>
          <p className="text-muted-foreground">Review and process new applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={stats.total.toString()}
          icon={Users}
          description="All time"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending.toString()}
          icon={Clock}
          description="Awaiting decision"
        />
        <StatCard
          title="Approved"
          value={stats.approved.toString()}
          icon={CheckCircle}
          description="Active resellers"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected.toString()}
          icon={XCircle}
          description="Declined"
        />
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              Error loading applications
            </div>
          ) : !applications?.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No applications found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.business_name}</p>
                        {app.business_registration && (
                          <p className="text-xs text-muted-foreground">
                            Reg: {app.business_registration}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.contact_person}</p>
                        <p className="text-sm text-muted-foreground">{app.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status]}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedApp.business_name}
                  <Badge className={statusColors[selectedApp.status]}>
                    {selectedApp.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Submitted on {formatDate(selectedApp.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Person</p>
                      <p className="font-medium">{selectedApp.contact_person || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedApp.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedApp.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedApp.address || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-3">
                  <h4 className="font-medium">Business Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedApp.business_registration && (
                      <div>
                        <p className="text-muted-foreground">Registration</p>
                        <p>{selectedApp.business_registration}</p>
                      </div>
                    )}
                    {selectedApp.tax_id && (
                      <div>
                        <p className="text-muted-foreground">Tax ID</p>
                        <p>{selectedApp.tax_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedApp.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedApp.notes}
                    </p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedApp.status === 'rejected' && selectedApp.blocked_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                    <p className="text-sm text-red-600">{selectedApp.blocked_reason}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedApp.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setRejectDialogOpen(true)}
                      disabled={rejectReseller.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleApprove(selectedApp)}
                      disabled={approveReseller.isPending}
                    >
                      {approveReseller.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectReseller.isPending}
            >
              {rejectReseller.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
