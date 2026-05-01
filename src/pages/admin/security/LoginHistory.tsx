import { useState } from 'react';
import { Search, Download, CheckCircle2, XCircle, MapPin, Monitor, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useLoginHistory, useSecurityStats } from '@/hooks/useSecurity';
import StatCard from '@/components/admin/StatCard';

export default function LoginHistoryPage() {
  const { data: attempts = [], isLoading } = useLoginHistory();
  const { data: stats } = useSecurityStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch =
      attempt.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attempt.ip_address?.includes(searchQuery) ?? false);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'success' && attempt.success) ||
      (statusFilter === 'failed' && !attempt.success);
    return matchesSearch && matchesStatus;
  });

  const suspiciousIPs = new Set(
    attempts
      .filter(a => !a.success)
      .reduce((acc, a) => {
        if (!a.ip_address) return acc;
        const count = attempts.filter(x => x.ip_address === a.ip_address && !x.success).length;
        if (count >= 3) acc.push(a.ip_address);
        return acc;
      }, [] as string[])
  );

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Email', 'Status', 'IP Address', 'Failure Reason'].join(','),
      ...filteredAttempts.map(a =>
        [format(new Date(a.created_at), 'yyyy-MM-dd HH:mm:ss'), a.email, a.success ? 'Success' : 'Failed', a.ip_address || '', a.failure_reason || ''].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `login-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Login History</h1>
          <p className="text-muted-foreground">Monitor authentication attempts and security events</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Logins (24h)" value={stats?.totalLogins24h ?? 0} icon={Shield} />
        <StatCard title="Failed Attempts (24h)" value={stats?.failedLogins24h ?? 0} icon={XCircle} />
        <StatCard title="Suspicious IPs" value={suspiciousIPs.size} icon={AlertTriangle} />
        <StatCard title="Active Users" value={stats?.activeUsers ?? 0} icon={CheckCircle2} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by email, IP, or location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttempts.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No login history found</TableCell></TableRow>
              ) : filteredAttempts.map(attempt => {
                const isSuspicious = suspiciousIPs.has(attempt.ip_address);
                return (
                  <TableRow key={attempt.id} className={isSuspicious ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-sm">
                      <div>{format(new Date(attempt.created_at), 'MMM d, yyyy')}</div>
                      <div className="text-muted-foreground">{format(new Date(attempt.created_at), 'h:mm:ss a')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{attempt.email}</div>
                    </TableCell>
                    <TableCell>
                      {attempt.success ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle2 className="mr-1 h-3 w-3" />Success</Badge>
                      ) : (
                        <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{attempt.ip_address || 'N/A'}</span>
                        {isSuspicious && (
                          <Tooltip><TooltipTrigger><AlertTriangle className="h-4 w-4 text-destructive" /></TooltipTrigger><TooltipContent>Multiple failed attempts from this IP</TooltipContent></Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Monitor className="h-3 w-3" />
                            {attempt.user_agent?.includes('Chrome') ? 'Chrome' : attempt.user_agent?.includes('Safari') ? 'Safari' : attempt.user_agent?.includes('Firefox') ? 'Firefox' : attempt.user_agent?.includes('python') ? 'Bot/Script' : 'Other'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p className="text-xs break-all">{attempt.user_agent}</p></TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {attempt.failure_reason && <span className="text-sm text-destructive">{attempt.failure_reason}</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
