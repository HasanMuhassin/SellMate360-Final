import { useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Tag, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import StatusBadge from '@/components/admin/StatusBadge';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@/hooks/useBrands';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Brand = Tables<'brands'>;

export default function Brands() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    isActive: true,
  });

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || brand.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: brands.length,
    active: brands.filter((b) => b.status === 'active').length,
    inactive: brands.filter((b) => b.status === 'inactive').length,
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleAddOpen = () => {
    setFormData({ name: '', slug: '', logoUrl: '', isActive: true });
    setAddDialogOpen(true);
  };

  const handleEditOpen = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logo_url || '',
      isActive: brand.status === 'active',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (brand: Brand) => {
    setSelectedBrand(brand);
    setDeleteDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `brands/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('catalog-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('catalog-images').getPublicUrl(path);
      setFormData((prev) => ({ ...prev, logoUrl: publicUrl }));
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) { toast.error('Brand name is required'); return; }
    try {
      await createBrand.mutateAsync({
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: null,
        logo_url: formData.logoUrl || null,
        status: formData.isActive ? 'active' : 'inactive',
      } as any);
      toast.success('Brand created');
      setAddDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create brand');
    }
  };

  const handleUpdate = async () => {
    if (!selectedBrand || !formData.name.trim()) { toast.error('Brand name is required'); return; }
    try {
      await updateBrand.mutateAsync({
        id: selectedBrand.id,
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        logo_url: formData.logoUrl || null,
        status: formData.isActive ? 'active' : 'inactive',
      });
      toast.success('Brand updated');
      setEditDialogOpen(false);
      setSelectedBrand(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update brand');
    }
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;
    try {
      await deleteBrand.mutateAsync(selectedBrand.id);
      toast.success('Brand deleted');
      setDeleteDialogOpen(false);
      setSelectedBrand(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete brand');
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    const newStatus = brand.status === 'active' ? 'inactive' : 'active';
    try {
      await updateBrand.mutateAsync({ id: brand.id, status: newStatus });
      toast.success(`Brand ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update status');
    }
  };

  const brandFormContent = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand-name">Brand Name *</Label>
          <Input id="brand-name" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Apple" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-slug">Slug</Label>
          <Input id="brand-slug" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} placeholder="e.g., apple" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Brand Logo</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        {formData.logoUrl ? (
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 rounded-lg border overflow-hidden group">
              <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Change Logo'}
            </Button>
          </div>
        ) : (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload logo'}</span>
            <span className="text-xs text-muted-foreground">PNG, SVG, JPG (max 5MB)</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="brand-active" checked={formData.isActive} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))} />
        <Label htmlFor="brand-active">Active</Label>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brands</h1>
          <p className="text-muted-foreground">Manage product brands</p>
        </div>
        <Button size="sm" onClick={handleAddOpen}>
          <Plus className="mr-2 h-4 w-4" /> Add Brand
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Brands</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search brands..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
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
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No brands found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                        ) : (
                          <Tag className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{brand.slug}</TableCell>
                    <TableCell><StatusBadge status={brand.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(brand.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditOpen(brand)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(brand)}>
                            {brand.status === 'active' ? 'Set Inactive' : 'Set Active'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteOpen(brand)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Brand</DialogTitle>
            <DialogDescription>Create a new product brand.</DialogDescription>
          </DialogHeader>
          {brandFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createBrand.isPending}>
              {createBrand.isPending ? 'Saving...' : 'Save Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update brand details.</DialogDescription>
          </DialogHeader>
          {brandFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateBrand.isPending}>
              {updateBrand.isPending ? 'Updating...' : 'Update Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBrand?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteBrand.isPending}>
              {deleteBrand.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
