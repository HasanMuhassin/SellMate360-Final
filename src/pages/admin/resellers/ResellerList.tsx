import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Award,
  Loader2,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/admin/StatCard';
import { useAdminResellers, useResellerStats } from '@/hooks/useAdminResellers';
import type { ResellerTier, ApprovalStatus } from '@/types/database';

const tierColors: Record<ResellerTier, string> = {
  silver: 'bg-gray-100 text-gray-700 border-gray-300',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  platinum: 'bg-purple-100 text-purple-700 border-purple-300',
};

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ResellerList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<ResellerTier | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');

  const { data: resellers, isLoading, error } = useAdminResellers({
    status: statusFilter,
    tier: tierFilter,
    search: searchQuery || undefined,
  });

  const stats = useResellerStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reseller Management</h1>
          <p className="text-muted-foreground">Manage your reseller network</p>
        </div>
        <Link to="/admin/resellers/applications">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            View Applications
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Resellers"
          value={stats.total.toString()}
          icon={Users}
          description="Registered resellers"
        />
        <StatCard
          title="Active Resellers"
          value={stats.active.toString()}
          icon={CheckCircle}
          trend={{ value: 12, isPositive: true }}
          description="Currently active"
        />
        <StatCard
          title="Blocked"
          value={stats.blocked.toString()}
          icon={Ban}
          description="Suspended accounts"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          trend={{ value: 8.5, isPositive: true }}
          description="All-time revenue"
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
                  placeholder="Search by name, contact, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as ResellerTier | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApprovalStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reseller Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              Error loading resellers: {error.message}
            </div>
          ) : !resellers?.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No resellers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>COD Risk</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers.map((reseller) => (
                  <TableRow key={reseller.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reseller.business_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reseller.contact_person}
                        </p>
                        <p className="text-xs text-muted-foreground">{reseller.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${tierColors[reseller.tier]} capitalize`}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {reseller.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        {reseller.total_orders}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(Number(reseller.total_revenue))}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(Number(reseller.total_profit))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {Number(reseller.cod_rejection_rate) > 10 && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={
                            Number(reseller.cod_rejection_rate) > 10
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                          }
                        >
                          {Number(reseller.cod_rejection_rate).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(Number(reseller.available_balance))}
                        </p>
                        {Number(reseller.pending_balance) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{formatCurrency(Number(reseller.pending_balance))} pending
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[reseller.status]}>
                        {reseller.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/admin/resellers/${reseller.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
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
    </motion.div>
  );
}
