import { useState } from 'react';
import { Search, Download, ArrowRight, UserCog, Shield, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useRoleChanges, useSecurityStats } from '@/hooks/useSecurity';
import StatCard from '@/components/admin/StatCard';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  staff: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cashier: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export default function RoleChangesPage() {
  const { data: changes = [], isLoading } = useRoleChanges();
  const { data: stats } = useSecurityStats();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChanges = changes.filter(
    change =>
      change.target_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.target_user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.changed_by_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const promotions = changes.filter(c => {
    const roleOrder = ['cashier', 'staff', 'manager', 'admin'];
    const prevIndex = c.previous_role ? roleOrder.indexOf(c.previous_role) : -1;
    const newIndex = roleOrder.indexOf(c.new_role);
    return newIndex > prevIndex;
  }).length;

  const newUsers = changes.filter(c => c.previous_role === null).length;

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Previous Role', 'New Role', 'Changed By', 'Reason'].join(','),
      ...filteredChanges.map(c =>
        [format(new Date(c.created_at), 'yyyy-MM-dd HH:mm:ss'), c.target_user_name, c.target_user_email, c.previous_role || 'New User', c.new_role, c.changed_by_user_name, `"${c.reason || ''}"`].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `role-changes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Role Changes</h1>
          <p className="text-muted-foreground">Track user role assignments and permission changes</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Role Changes (30d)" value={stats?.roleChanges30d ?? 0} icon={UserCog} />
        <StatCard title="Promotions" value={promotions} icon={Shield} />
        <StatCard title="New User Roles" value={newUsers} icon={Users} />
        <StatCard title="Admin Changes" value={changes.filter(c => c.new_role === 'admin').length} icon={Shield} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by user name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
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
                <TableHead>Role Change</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChanges.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No role changes found</TableCell></TableRow>
              ) : filteredChanges.map(change => (
                <TableRow key={change.id}>
                  <TableCell className="text-sm">
                    <div>{format(new Date(change.created_at), 'MMM d, yyyy')}</div>
                    <div className="text-muted-foreground">{format(new Date(change.created_at), 'h:mm a')}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{change.target_user_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{change.target_user_name}</div>
                        <div className="text-sm text-muted-foreground">{change.target_user_email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {change.previous_role ? (
                        <Badge variant="secondary" className={roleColors[change.previous_role] || ''}>{change.previous_role}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">New</span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className={roleColors[change.new_role] || ''}>{change.new_role}</Badge>
                    </div>
                  </TableCell>
                  <TableCell><div className="text-sm">{change.changed_by_user_name}</div></TableCell>
                  <TableCell className="max-w-xs"><span className="text-sm text-muted-foreground">{change.reason || '-'}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Hierarchy</CardTitle>
          <CardDescription>Permission levels from lowest to highest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Badge variant="secondary" className={roleColors.cashier}>Cashier</Badge><span className="text-muted-foreground text-sm">POS only</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2"><Badge variant="secondary" className={roleColors.staff}>Staff</Badge><span className="text-muted-foreground text-sm">Basic operations</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2"><Badge variant="secondary" className={roleColors.manager}>Manager</Badge><span className="text-muted-foreground text-sm">Full operations</span></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2"><Badge variant="secondary" className={roleColors.admin}>Admin</Badge><span className="text-muted-foreground text-sm">Full access</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
