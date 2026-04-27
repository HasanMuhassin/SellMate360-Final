import { useState } from 'react';
import { Search, Filter, Download, Eye, AlertTriangle, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useAuditLogs, useSecurityStats, AuditLogRow } from '@/hooks/useSecurity';
import StatCard from '@/components/admin/StatCard';

const levelConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  critical: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function AuditLogsPage() {
  const { data: logs = [], isLoading } = useAuditLogs();
  const { data: stats } = useSecurityStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const filteredLogs = logs.filter(log => {
    const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '');
    const userName = String(log.user_name || '').toLowerCase();
    const resource = String(log.resource || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      userName.includes(query) ||
      detailsStr.toLowerCase().includes(query) ||
      resource.includes(query);
      
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesLevel && matchesAction;
  });

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Details', 'Level', 'IP Address'].join(','),
      ...filteredLogs.map(log => {
        const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details).replace(/"/g, '""') : String(log.details || '').replace(/"/g, '""');
        return [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'), 
          log.user_name || 'System', 
          log.action, 
          log.resource, 
          `"${detailsStr}"`, 
          log.level, 
          log.ip_address
        ].join(',');
      }),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const renderDetails = (details: any) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    
    if (typeof details === 'object') {
      if (details.note && Object.keys(details).length === 1) return details.note;
      
      // If generated from our trigger with 'new' or 'old' record
      const record = details.new || details.old || details;
      
      const keyFields = [];
      if (record.name || record.product_name) keyFields.push(`Name: ${record.name || record.product_name}`);
      if (record.price || record.selling_price) keyFields.push(`Price: ${record.price || record.selling_price}`);
      if (record.stock !== undefined) keyFields.push(`Stock: ${record.stock}`);
      if (record.status) keyFields.push(`Status: ${record.status}`);
      if (record.order_status) keyFields.push(`Order Status: ${record.order_status}`);

      if (keyFields.length > 0) {
        return keyFields.join(' | ');
      }

      // Fallback: Show a few keys
      const entries = Object.entries(record).slice(0, 3);
      return entries.map(([k, v]) => `${k}: ${v !== null && typeof v === 'object' ? '[Object]' : v}`).join(', ') + 
             (Object.keys(record).length > 3 ? '...' : '');
    }
    
    return String(details);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system actions and changes</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Critical Actions (7d)" value={stats?.criticalActions7d ?? 0} icon={AlertCircle} />
        <StatCard title="Total Actions Today" value={logs.filter(l => format(new Date(l.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length} icon={Info} />
        <StatCard title="Unique Users" value={new Set(logs.map(l => l.user_id)).size} icon={Filter} />
        <StatCard title="Resources Modified" value={new Set(logs.map(l => l.resource)).size} icon={Eye} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search logs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
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
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No audit logs found</TableCell></TableRow>
              ) : filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    <div>{format(new Date(log.created_at), 'MMM d, yyyy')}</div>
                    <div className="text-muted-foreground">{format(new Date(log.created_at), 'h:mm a')}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.user_name || 'System'}</div>
                    <div className="text-xs text-muted-foreground capitalize">{log.user_role || 'service'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={actionColors[log.action] || ''}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="capitalize">{log.resource}</div>
                    {log.resource_id && <div className="text-xs text-muted-foreground font-mono">{log.resource_id}</div>}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{renderDetails(log.details)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`flex items-center gap-1 w-fit ${levelConfig[log.level]?.color || ''}`}>
                      {levelConfig[log.level]?.icon}{log.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Complete information about this action</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Timestamp</p><p className="font-medium">{format(new Date(selectedLog.created_at), 'PPpp')}</p></div>
                <div><p className="text-sm text-muted-foreground">Level</p><Badge variant="secondary" className={levelConfig[selectedLog.level]?.color}>{selectedLog.level}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">User</p><p className="font-medium">{selectedLog.user_name || 'System'}</p><p className="text-xs text-muted-foreground capitalize">{selectedLog.user_role || 'service'}</p></div>
                <div><p className="text-sm text-muted-foreground">Action</p><Badge variant="secondary" className={actionColors[selectedLog.action]}>{selectedLog.action}</Badge></div>
              </div>
              <div><p className="text-sm text-muted-foreground">Resource</p><p className="font-medium capitalize">{selectedLog.resource}</p>{selectedLog.resource_id && <p className="text-sm font-mono text-muted-foreground">{selectedLog.resource_id}</p>}</div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Details</p>
                {typeof selectedLog.details === 'object' && selectedLog.details.old && selectedLog.details.new ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-sm overflow-auto max-h-60 border border-red-100 dark:border-red-900/30">
                      <p className="font-semibold text-red-800 dark:text-red-300 mb-2">Previous State</p>
                      <pre className="whitespace-pre-wrap text-xs font-mono">{JSON.stringify(selectedLog.details.old, null, 2)}</pre>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-sm overflow-auto max-h-60 border border-green-100 dark:border-green-900/30">
                      <p className="font-semibold text-green-800 dark:text-green-300 mb-2">New State</p>
                      <pre className="whitespace-pre-wrap text-xs font-mono">{JSON.stringify(selectedLog.details.new, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm overflow-auto max-h-60">
                    {typeof selectedLog.details === 'object' ? (
                      <pre className="whitespace-pre-wrap text-xs font-mono">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                    ) : (
                      <p>{selectedLog.details}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">IP Address</p><p className="font-mono text-sm">{selectedLog.ip_address}</p></div>
                <div><p className="text-sm text-muted-foreground">User Agent</p><p className="text-xs truncate">{selectedLog.user_agent}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
