import { useState } from 'react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import {
  Plus, Search, Edit, Trash2, Zap, Clock, Calendar, TrendingUp, DollarSign, Package, MoreHorizontal, Play, Pause, Eye, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/admin/StatCard';
import { toast } from 'sonner';
import { useFlashSales, useFlashSaleMutations } from '@/hooks/usePromotions';

const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

const getFlashSaleStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'ended': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function FlashSales() {
  const { data: flashSales = [], isLoading } = useFlashSales();
  const { createSale, updateSale, deleteSale, cancelSale } = useFlashSaleMutations();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '',
    discountType: 'percentage' as 'percentage' | 'fixed', discountValue: '',
    startsAt: '', endsAt: '', badgeText: '', badgeColor: 'red',
  });

  const filteredSales = flashSales.filter((s: any) => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: flashSales.length,
    active: flashSales.filter((s: any) => s.status === 'active').length,
    scheduled: flashSales.filter((s: any) => s.status === 'scheduled').length,
    totalRevenue: flashSales.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0),
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleOpenDialog = (sale?: any) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        name: sale.name, slug: sale.slug, description: sale.description || '',
        discountType: sale.discount_type, discountValue: sale.discount_value?.toString() || '',
        startsAt: sale.starts_at ? format(new Date(sale.starts_at), "yyyy-MM-dd'T'HH:mm") : '',
        endsAt: sale.ends_at ? format(new Date(sale.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
        badgeText: sale.badge_text || '', badgeColor: sale.badge_color || 'red',
      });
    } else {
      setEditingSale(null);
      setFormData({ name: '', slug: '', description: '', discountType: 'percentage', discountValue: '', startsAt: '', endsAt: '', badgeText: '', badgeColor: 'red' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveSale = () => {
    if (!formData.name || !formData.discountValue || !formData.startsAt || !formData.endsAt) {
      toast.error('Please fill in all required fields'); return;
    }
    const startsAt = new Date(formData.startsAt);
    const endsAt = new Date(formData.endsAt);
    let status = 'scheduled';
    if (isPast(endsAt)) status = 'ended';
    else if (isPast(startsAt) && isFuture(endsAt)) status = 'active';

    const payload: any = {
      name: formData.name, slug: formData.slug || generateSlug(formData.name),
      description: formData.description,
      discount_type: formData.discountType, discount_value: parseFloat(formData.discountValue),
      starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(),
      badge_text: formData.badgeText || `${formData.discountValue}${formData.discountType === 'percentage' ? '%' : ' Rs.'} OFF`,
      badge_color: formData.badgeColor, status,
    };
    if (editingSale) {
      updateSale.mutate({ id: editingSale.id, ...payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      createSale.mutate(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const getTimeInfo = (sale: any) => {
    if (sale.status === 'active') return { label: 'Ends in', value: formatDistanceToNow(new Date(sale.ends_at), { addSuffix: false }), color: 'text-green-600' };
    if (sale.status === 'scheduled') return { label: 'Starts in', value: formatDistanceToNow(new Date(sale.starts_at), { addSuffix: false }), color: 'text-blue-600' };
    if (sale.status === 'ended') return { label: 'Ended', value: formatDistanceToNow(new Date(sale.ends_at), { addSuffix: true }), color: 'text-muted-foreground' };
    return { label: 'Cancelled', value: '-', color: 'text-red-600' };
  };

  const getProgress = (sale: any) => {
    if (sale.status !== 'active') return 0;
    const total = new Date(sale.ends_at).getTime() - new Date(sale.starts_at).getTime();
    const elapsed = Date.now() - new Date(sale.starts_at).getTime();
    return Math.min((elapsed / total) * 100, 100);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flash Sales</h1>
          <p className="text-muted-foreground">Schedule and manage time-limited promotions</p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Create Flash Sale</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Sales" value={stats.total.toString()} icon={Zap} />
        <StatCard title="Active Now" value={stats.active.toString()} icon={Play} />
        <StatCard title="Scheduled" value={stats.scheduled.toString()} icon={Calendar} />
        <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader><CardTitle>All Flash Sales</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search flash sales..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredSales.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">No flash sales found</div>
            ) : filteredSales.map((sale: any) => {
              const timeInfo = getTimeInfo(sale);
              const progress = getProgress(sale);
              return (
                <Card key={sale.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 ${sale.status === 'active' ? 'bg-green-500' : sale.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {sale.status === 'active' && <div className="h-full bg-green-700 transition-all" style={{ width: `${progress}%` }} />}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <CardTitle className="text-lg">{sale.name}</CardTitle>
                        </div>
                        <CardDescription className="line-clamp-2">{sale.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(sale)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {sale.status === 'scheduled' && <DropdownMenuItem onClick={() => cancelSale.mutate(sale.id)}><Pause className="h-4 w-4 mr-2" />Cancel Sale</DropdownMenuItem>}
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteSale.mutate(sale.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge className={getFlashSaleStatusColor(sale.status)}>{sale.status}</Badge>
                      {sale.badge_text && (
                        <Badge variant="secondary" style={{
                          backgroundColor: sale.badge_color === 'red' ? 'rgb(239,68,68)' : sale.badge_color === 'blue' ? 'rgb(59,130,246)' : sale.badge_color === 'green' ? 'rgb(34,197,94)' : 'rgb(249,115,22)',
                          color: 'white',
                        }}>{sale.badge_text}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div><p className="text-muted-foreground">Starts</p><p className="font-medium">{format(new Date(sale.starts_at), 'MMM d, h:mm a')}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div><p className="text-muted-foreground">Ends</p><p className="font-medium">{format(new Date(sale.ends_at), 'MMM d, h:mm a')}</p></div>
                      </div>
                    </div>
                    <div className={`text-sm ${timeInfo.color}`}><span className="font-medium">{timeInfo.label}:</span> {timeInfo.value}</div>
                    {sale.status === 'active' && <Progress value={progress} className="h-2" />}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{sale.products_sold || 0} sold</span></div>
                      <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{formatPrice(sale.revenue || 0)}</span></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</DialogTitle>
            <DialogDescription>Configure your time-limited promotion</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sale Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} placeholder="e.g., Midnight Madness" />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select value={formData.discountType} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, discountType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value *</Label>
                <Input type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts At *</Label>
                <Input type="datetime-local" value={formData.startsAt} onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ends At *</Label>
                <Input type="datetime-local" value={formData.endsAt} onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Badge Text</Label>
                <Input value={formData.badgeText} onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })} placeholder="e.g., 30% OFF" />
              </div>
              <div className="space-y-2">
                <Label>Badge Color</Label>
                <Select value={formData.badgeColor} onValueChange={(v) => setFormData({ ...formData, badgeColor: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSale} disabled={createSale.isPending || updateSale.isPending}>
              {(createSale.isPending || updateSale.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSale ? 'Update Sale' : 'Create Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
