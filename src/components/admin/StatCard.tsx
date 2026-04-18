import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  change,
  trend,
  description,
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
  className,
}: StatCardProps) {
  // Support both 'change' and 'trend' prop formats
  const trendData = change || (trend ? { value: trend.value, trend: trend.isPositive ? 'up' as const : 'down' as const } : null);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {trendData && (
            <p
              className={cn(
                'mt-2 flex items-center text-sm font-medium',
                trendData.trend === 'up' ? 'text-success' : 'text-destructive'
              )}
            >
              {trendData.trend === 'up' ? '↑' : '↓'} {Math.abs(trendData.value)}%
              <span className="ml-1 text-muted-foreground">vs yesterday</span>
            </p>
          )}
          {description && !trendData && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
