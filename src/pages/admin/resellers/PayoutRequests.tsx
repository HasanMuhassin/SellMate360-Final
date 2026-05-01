import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Eye,
  Check,
  X,
  Upload,
  Loader2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/admin/StatCard';
import { 
  useAdminPayoutRequests,
  useApprovePayoutRequest,
  useRejectPayoutRequest,
  useProcessPayoutRequest,
} from '@/hooks/useAdminResellers';
import { toast } from 'sonner';
import type { PayoutRequest, PayoutStatus } from '@/types/database';

const statusColors: Record<PayoutStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

interface PayoutWithReseller extends PayoutRequest {
  reseller?: {
    id: string;
    business_name: string;
    email: string;
    phone: string;
  };
}

export default function PayoutRequests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'all'>('all');
  const [selectedPayout, setSelectedPayout] = useState<PayoutWithReseller | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: payouts, isLoading, error } = useAdminPayoutRequests({ status: statusFilter });
  const approvePayoutMutation = useApprovePayoutRequest();
  const rejectPayoutMutation = useRejectPayoutRequest();
  const processPayoutMutation = useProcessPayoutRequest();

  const filteredPayouts = payouts?.filter((payout) => {
    const resellerName = payout.reseller?.business_name?.toLowerCase() ?? '';
    const matchesSearch =
      resellerName.includes(searchQuery.toLowerCase()) ||
      payout.account_number.includes(searchQuery);
    return matchesSearch;
  }) ?? [];

  const stats = {
    total: payouts?.length ?? 0,
    pending: payouts?.filter((p) => p.status === 'pending').length ?? 0,
    approved: payouts?.filter((p) => p.status === 'approved').length ?? 0,
    paid: payouts?.filter((p) => p.status === 'paid').length ?? 0,
    totalPending: payouts
      ?.filter((p) => p.status === 'pending' || p.status === 'approved')
      .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const handleApprove = async (payout: PayoutWithReseller) => {
    try {
      await approvePayoutMutation.mutateAsync({ payoutId: payout.id });
      toast.success(`Payout request approved!`);
      setViewDialogOpen(false);
    } catch (err) {
      toast.error('Failed to approve payout request');
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !rejectionReason.trim()) return;

    try {
      await rejectPayoutMutation.mutateAsync({ 
        payoutId: selectedPayout.id, 
        reason: rejectionReason 
      });
      toast.success(`Payout request rejected.`);
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason('');
    } catch (err) {
      toast.error('Failed to reject payout request');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      toast.error('Please upload an image or PDF file');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedPayout?.id || 'payout'}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `payout-proofs/${fileName}`;

      setUploadProgress(30);
      const { data, error: uploadError } = await supabase.storage
        .from('payout-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(80);
      const { data: { publicUrl } } = supabase.storage
        .from('payout-proofs')
        .getPublicUrl(filePath);

      setUploadedFileUrl(publicUrl);
      setUploadProgress(100);
      toast.success('Evidence uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload evidence');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedPayout || !paymentReference.trim()) return;

    try {
      await processPayoutMutation.mutateAsync({ 
        payoutId: selectedPayout.id, 
        paymentReference,
        paymentProofUrl: uploadedFileUrl || undefined
      });
      toast.success(`Payout processed successfully!`);
      setProcessDialogOpen(false);
      setViewDialogOpen(false);
      setPaymentReference('');
      setUploadedFileUrl(null);
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Payout error:", err);
      toast.error(`Failed: ${err.message || JSON.stringify(err)}`);
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
          <h1 className="text-2xl font-bold">Payout Requests</h1>
          <p className="text-muted-foreground">
            Manage reseller payout requests and payments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests"
          value={stats.pending.toString()}
          icon={Clock}
          description="Awaiting approval"
        />
        <StatCard
          title="Approved"
          value={stats.approved.toString()}
          icon={CheckCircle}
          description="Ready to process"
        />
        <StatCard
          title="Paid"
          value={stats.paid.toString()}
          icon={CreditCard}
          description="Completed"
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(stats.totalPending)}
          icon={DollarSign}
          description="To be paid"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reseller or account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PayoutStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              Error loading payout requests
            </div>
          ) : !filteredPayouts.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No payout requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <Link
                        to={`/admin/resellers/${payout.reseller_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {payout.reseller?.business_name ?? 'Unknown'}
                      </Link>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(Number(payout.amount))}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payout.bank_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payout.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.account_holder}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(payout.created_at)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[payout.status]}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payout.payment_reference || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPayout(payout);
                          setViewDialogOpen(true);
                        }}
                      >
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

      {/* View Payout Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedPayout && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Payout Request
                  <Badge className={statusColors[selectedPayout.status]}>
                    {selectedPayout.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Requested on {formatDate(selectedPayout.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Amount */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(Number(selectedPayout.amount))}
                  </p>
                </div>

                {/* Reseller Info */}
                <div>
                  <h4 className="font-medium mb-2">Reseller</h4>
                  <Link
                    to={`/admin/resellers/${selectedPayout.reseller_id}`}
                    className="text-primary hover:underline"
                  >
                    {selectedPayout.reseller?.business_name ?? 'Unknown'}
                  </Link>
                </div>

                {/* Bank Details */}
                <div>
                  <h4 className="font-medium mb-2">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p>{selectedPayout.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p>{selectedPayout.branch || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-mono">{selectedPayout.account_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Holder</p>
                      <p>{selectedPayout.account_holder}</p>
                    </div>
                  </div>
                </div>

                {/* Status-specific info */}
                {selectedPayout.status === 'paid' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-700">
                        Payment Processed
                      </p>
                      <p className="text-sm text-green-600">
                        Reference: {selectedPayout.payment_reference}
                      </p>
                      {selectedPayout.processed_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Processed on {formatDate(selectedPayout.processed_at)}
                        </p>
                      )}
                    </div>

                    {selectedPayout.payment_proof_url && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Payment Proof</h4>
                        <div className="relative group overflow-hidden rounded-lg border bg-muted aspect-video flex items-center justify-center">
                          {selectedPayout.payment_proof_url.toLowerCase().endsWith('.pdf') ? (
                            <div className="text-center p-4">
                              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                              <p className="text-xs text-muted-foreground font-medium">PDF Document</p>
                            </div>
                          ) : (
                            <img 
                              src={selectedPayout.payment_proof_url} 
                              alt="Payment proof" 
                              className="w-full h-full object-contain transition-transform group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button variant="secondary" size="sm" asChild>
                              <a href={selectedPayout.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-2" />
                                View Full
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedPayout.status === 'rejected' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700">
                      Rejection Reason
                    </p>
                    <p className="text-sm text-red-600">
                      {selectedPayout.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedPayout.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setRejectDialogOpen(true)}
                      disabled={rejectPayoutMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleApprove(selectedPayout)}
                      disabled={approvePayoutMutation.isPending}
                    >
                      {approvePayoutMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </>
                )}
                {selectedPayout.status === 'approved' && (
                  <Button onClick={() => setProcessDialogOpen(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
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
            <DialogTitle>Reject Payout Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payout request.
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
              disabled={!rejectionReason.trim() || rejectPayoutMutation.isPending}
            >
              {rejectPayoutMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payment Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Enter the payment reference number to mark this payout as paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Reference / Transaction ID</Label>
              <Input
                placeholder="e.g., TXN-2024012201"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Proof (Optional)</Label>
              <div className="relative">
                <Input
                  type="file"
                  id="payout-proof"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="payout-proof"
                  className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                    isUploading ? "bg-muted opacity-50 cursor-not-allowed" : "hover:bg-muted/50 border-border hover:border-primary/50",
                    uploadedFileUrl ? "border-success/50 bg-success/5" : ""
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                    </>
                  ) : uploadedFileUrl ? (
                    <>
                      <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-2">
                        <Check className="h-6 w-6 text-success" />
                      </div>
                      <p className="text-sm font-medium text-success">Evidence Uploaded!</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedFile?.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload bank slip</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG or PDF up to 5MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={!paymentReference.trim() || processPayoutMutation.isPending}
            >
              {processPayoutMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <CreditCard className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
