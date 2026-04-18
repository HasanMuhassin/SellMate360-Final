import { useState } from 'react';
import {
  Plus, Search, Edit, Trash2, Image as ImageIcon, ExternalLink, Eye, MousePointer, GripVertical, MoreHorizontal, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import StatCard from '@/components/admin/StatCard';
import { toast } from 'sonner';
import { useAdminBanners, useAdminBannerMutations } from '@/hooks/usePromotions';

export default function Banners() {
  const { data: banners = [], isLoading } = useAdminBanners();
  const { createBanner, updateBanner, deleteBanner, toggleBannerStatus } = useAdminBannerMutations();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '', subtitle: '', image_url: '', link: '', cta: '',
    position: '1', is_active: true,
  });

  const filteredBanners = banners.filter((b: any) => {
    const matchesSearch = b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || b.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? b.is_active : !b.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: banners.length,
    active: banners.filter((b: any) => b.is_active).length,
  };

  const handleOpenDialog = (banner?: any) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title, subtitle: banner.subtitle || '', image_url: banner.image_url || '',
        link: banner.link || '', cta: banner.cta || '',
        position: banner.position?.toString() || '1', is_active: banner.is_active,
      });
    } else {
      setEditingBanner(null);
      setFormData({ title: '', subtitle: '', image_url: '', link: '', cta: '', position: '1', is_active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSaveBanner = () => {
    if (!formData.title) { toast.error('Title is required'); return; }
    const payload: any = {
      title: formData.title, subtitle: formData.subtitle || null,
      image_url: formData.image_url || null, link: formData.link || null, cta: formData.cta || null,
      position: parseInt(formData.position), is_active: formData.is_active,
    };
    if (editingBanner) {
      updateBanner.mutate({ id: editingBanner.id, ...payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      createBanner.mutate(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const getStatusColor = (active: boolean) => active
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banner Management</h1>
          <p className="text-muted-foreground">Manage promotional banners across your store</p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Add Banner</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Total Banners" value={stats.total.toString()} icon={ImageIcon} />
        <StatCard title="Active Banners" value={stats.active.toString()} icon={Eye} />
      </div>

      <Card>
        <CardHeader><CardTitle>All Banners</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search banners..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBanners.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">No banners found</div>
            ) : filteredBanners.map((banner: any) => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="relative aspect-[16/9] bg-muted">
                  <img src={banner.image_url || '/placeholder.svg'} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge className={getStatusColor(banner.is_active)}>{banner.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(banner)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleBannerStatus.mutate(banner.id)}>{banner.is_active ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteBanner.mutate(banner.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{banner.title}</h3>
                      {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm">{banner.position}</span>
                    </div>
                  </div>
                  {banner.link && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <ExternalLink className="h-3 w-3" /><span className="truncate">{banner.link}</span>
                    </div>
                  )}
                  {banner.cta && <p className="text-xs text-primary">{banner.cta}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>Configure your promotional banner</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Summer Sale" /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Link URL</Label><Input value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="/shop or https://..." /></div>
              <div className="space-y-2"><Label>CTA Text</Label><Input value={formData.cta} onChange={(e) => setFormData({ ...formData, cta: e.target.value })} placeholder="Shop Now" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Position</Label><Input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={(v) => setFormData({ ...formData, is_active: v === 'active' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBanner} disabled={createBanner.isPending || updateBanner.isPending}>
              {(createBanner.isPending || updateBanner.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingBanner ? 'Update Banner' : 'Add Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
