import React, { useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, FolderTree, ChevronRight, GripVertical, ImageIcon, Upload, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import StatusBadge from '@/components/admin/StatusBadge';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/types/database';

export default function Categories() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const parentCategories = filteredCategories.filter((c) => !c.parent_id);
  const childCategories = filteredCategories.filter((c) => c.parent_id);
  const allParentCategories = categories.filter((c) => !c.parent_id);

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.status === 'active').length,
    inactive: categories.filter((c) => c.status === 'inactive').length,
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleAddOpen = () => {
    setFormData({ name: '', slug: '', parentId: '', description: '', imageUrl: '', isActive: true });
    setAddDialogOpen(true);
  };

  const handleEditOpen = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parent_id || '',
      description: category.description || '',
      imageUrl: category.image_url || '',
      isActive: category.status === 'active',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) { toast.error('Category name is required'); return; }
    try {
      await createCategory.mutateAsync({
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        parent_id: formData.parentId || null,
        description: formData.description || null,
        status: formData.isActive ? 'active' : 'inactive',
        position: categories.length,
        image_url: formData.imageUrl || null,
      });
      toast.success('Category created');
      setAddDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create category');
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory || !formData.name.trim()) { toast.error('Category name is required'); return; }
    try {
      await updateCategory.mutateAsync({
        id: selectedCategory.id,
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        parent_id: formData.parentId || null,
        description: formData.description || null,
        image_url: formData.imageUrl || null,
        status: formData.isActive ? 'active' : 'inactive',
      });
      toast.success('Category updated');
      setEditDialogOpen(false);
      setSelectedCategory(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
      toast.success('Category deleted');
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (category: Category) => {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    try {
      await updateCategory.mutateAsync({ id: category.id, status: newStatus });
      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update status');
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    return categories.find((c) => c.id === parentId)?.name || null;
  };

  const renderCategoryRow = (category: Category, isChild = false) => (
    <TableRow key={category.id}>
      <TableCell className="w-[50px]">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      </TableCell>
      <TableCell>
        <div className={`flex items-center gap-3 ${isChild ? 'pl-6' : ''}`}>
          {isChild && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {category.image_url ? (
            <img src={category.image_url} alt={category.name} className="h-8 w-8 rounded object-cover border" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
          ) : (
            <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{category.name}</span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">{category.slug}</TableCell>
      <TableCell>
        {getParentName(category.parent_id) ? (
          <span className="text-sm">{getParentName(category.parent_id)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={category.status} />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditOpen(category)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(category)}>
              {category.status === 'active' ? 'Set Inactive' : 'Set Active'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteOpen(category)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  const categoryFormContent = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cat-name">Category Name *</Label>
          <Input id="cat-name" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Electronics" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input id="cat-slug" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} placeholder="e.g., electronics" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-parent">Parent Category</Label>
        <Select value={formData.parentId || 'none'} onValueChange={(v) => setFormData((prev) => ({ ...prev, parentId: v === 'none' ? '' : v }))}>
          <SelectTrigger><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Top Level)</SelectItem>
            {allParentCategories
              .filter((c) => c.id !== selectedCategory?.id)
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-desc">Description</Label>
        <Textarea id="cat-desc" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Category description..." rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Category Image</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
            setUploading(true);
            try {
              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
              const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
              const { error } = await supabase.storage.from('catalog-images').upload(path, file, { upsert: true });
              if (error) throw error;
              const { data: { publicUrl } } = supabase.storage.from('catalog-images').getPublicUrl(path);
              setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
              toast.success('Image uploaded');
            } catch (err: any) {
              toast.error(err.message || 'Upload failed');
            } finally {
              setUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
        />
        {formData.imageUrl ? (
          <div className="flex items-start gap-3">
            <div className="relative w-20 h-20 rounded-lg border overflow-hidden group">
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Change Image'}
            </Button>
          </div>
        ) : (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP (max 5MB)</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="cat-active" checked={formData.isActive} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))} />
        <Label htmlFor="cat-active">Active</Label>
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
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">Organize your products with categories</p>
        </div>
        <Button size="sm" onClick={handleAddOpen}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Categories</CardTitle>
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
              <Input placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
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

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {parentCategories.map((parent) => (
                    <React.Fragment key={parent.id}>
                      {renderCategoryRow(parent)}
                      {childCategories
                        .filter((c) => c.parent_id === parent.id)
                        .map((child) => renderCategoryRow(child, true))}
                    </React.Fragment>
                  ))}
                  {/* Show orphaned children (parent filtered out) */}
                  {childCategories
                    .filter((c) => !parentCategories.some((p) => p.id === c.parent_id))
                    .map((child) => renderCategoryRow(child, true))}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new product category.</DialogDescription>
          </DialogHeader>
          {categoryFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details.</DialogDescription>
          </DialogHeader>
          {categoryFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Updating...' : 'Update Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCategory.isPending}>
              {deleteCategory.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
