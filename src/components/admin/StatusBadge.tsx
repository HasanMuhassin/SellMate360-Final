import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Status =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'paid'
  | 'refunded'
  | 'approved'
  | 'blocked'
  | 'rejected'
  | 'open'
  | 'closed'
  | 'in_transit'
  | 'picked'
  | 'returned'
  | 'completed'
  | 'failed'
  | 'published'
  | 'draft'
  | 'expired'
  | 'low'
  | 'medium'
  | 'high'
  | 'silver'
  | 'gold'
  | 'platinum';

const statusConfig: Record<Status, { label: string; className: string }> = {
  // General
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border' },
  
  // Orders
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  confirmed: { label: 'Confirmed', className: 'bg-primary/10 text-primary border-primary/20' },
  processing: { label: 'Processing', className: 'bg-primary/10 text-primary border-primary/20' },
  shipped: { label: 'Shipped', className: 'bg-info/10 text-info border-info/20' },
  delivered: { label: 'Delivered', className: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // Payments
  paid: { label: 'Paid', className: 'bg-success/10 text-success border-success/20' },
  refunded: { label: 'Refunded', className: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // Resellers
  approved: { label: 'Approved', className: 'bg-success/10 text-success border-success/20' },
  blocked: { label: 'Blocked', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // Shifts
  open: { label: 'Open', className: 'bg-success/10 text-success border-success/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
  
  // Shipments
  in_transit: { label: 'In Transit', className: 'bg-primary/10 text-primary border-primary/20' },
  picked: { label: 'Picked', className: 'bg-primary/10 text-primary border-primary/20' },
  returned: { label: 'Returned', className: 'bg-warning/10 text-warning border-warning/20' },
  
  // Content
  published: { label: 'Published', className: 'bg-success/10 text-success border-success/20' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground border-border' },
  
  // Risk levels
  low: { label: 'Low', className: 'bg-success/10 text-success border-success/20' },
  medium: { label: 'Medium', className: 'bg-warning/10 text-warning border-warning/20' },
  high: { label: 'High', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // Tiers
  silver: { label: 'Silver', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  gold: { label: 'Gold', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  platinum: { label: 'Platinum', className: 'bg-violet-100 text-violet-700 border-violet-200' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: '' };
  
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export default StatusBadge;
