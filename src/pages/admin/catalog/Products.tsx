import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Search, Filter, Edit, Trash2, Eye, Copy, MoreHorizontal, Package, AlertTriangle, TrendingUp, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { useProducts, useUpdateProduct, useDeleteProduct, useCreateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { toast } from 'sonner';

const formatCurrency = (value: number) => `LKR ${value.toLocaleString()}`;

export default function Products() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const duplicateProduct = useCreateProduct();

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b.name]));

  const filteredProducts = products.filter((product) => {
    const matchesSearch = !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    const matchesBrand = brandFilter === 'all' || product.brand_id === brandFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'in_stock' && product.stock > 10) ||
      (stockFilter === 'low_stock' && product.stock > 0 && product.stock <= 10) ||
      (stockFilter === 'out_of_stock' && product.stock === 0);
    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesStock;
  });

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  };

  const toggleSelectAll = () => {
    setSelectedProducts(prev =>
      prev.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id)
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeleteClick = (product: { id: string; name: string }) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      const result = await deleteProduct.mutateAsync(productToDelete.id);
      if (result?.softDeleted) {
        toast.success(`"${productToDelete.name}" has been deactivated (it's referenced by existing transactions)`);
      } else {
        toast.success(`"${productToDelete.name}" deleted`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete product');
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleBulkStatus = async (status: string) => {
    try {
      await Promise.all(selectedProducts.map(id =>
        updateProduct.mutateAsync({ id, status } as any)
      ));
      toast.success(`${selectedProducts.length} product(s) set to ${status}`);
      setSelectedProducts([]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update products');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map(id => deleteProduct.mutateAsync(id)));
      toast.success(`${selectedProducts.length} product(s) deleted`);
      setSelectedProducts([]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete products');
    }
    setBulkDeleteOpen(false);
  };

  const handleDuplicate = async (product: any) => {
    try {
      await duplicateProduct.mutateAsync({
        name: `${product.name} (Copy)`,
        slug: `${product.slug}-copy-${Date.now()}`,
        sku: product.sku ? `${product.sku}-COPY` : null,
        description: product.description,
        selling_price: product.selling_price,
        original_price: product.original_price,
        cost_price: product.cost_price || 0,
        reseller_price: product.reseller_price || null,
        stock: 0,
        low_stock_threshold: product.low_stock_threshold || 10,
        stock_status: 'out_of_stock',
        status: 'inactive',
        category_id: product.category_id,
        brand_id: product.brand_id,
        image_url: product.image_url,
        features: product.features,
        is_new: false,
        is_bestseller: false,
        is_featured: false,
        rating: 0,
        review_count: 0,
      });
      toast.success('Product duplicated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to duplicate');
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'SKU', 'Category', 'Brand', 'Selling Price', 'Stock', 'Status'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.sku || '',
      categoryMap[p.category_id || ''] || '',
      brandMap[p.brand_id || ''] || '',
      p.selling_price,
      p.stock,
      p.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Products exported');
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stock <= 10) return <Badge variant="outline" className="border-warning text-warning">Low Stock ({stock})</Badge>;
    return <span className="text-muted-foreground">{stock}</span>;
  };

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
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/catalog/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} iconColor="bg-primary/10 text-primary" />
        <StatCard title="Active Products" value={stats.activeProducts} icon={TrendingUp} iconColor="bg-success/10 text-success" />
        <StatCard title="Low Stock" value={stats.lowStock} icon={AlertTriangle} iconColor="bg-warning/10 text-warning" />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={Archive} iconColor="bg-destructive/10 text-destructive" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Stock" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedProducts.length} product(s) selected</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatus('active')}>Set Active</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatus('inactive')}>Set Inactive</Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete Selected</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No products found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox checked={selectedProducts.includes(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="h-12 w-12 rounded-md border bg-muted overflow-hidden">
                        <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.description?.slice(0, 60)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku || '—'}</TableCell>
                    <TableCell><span className="text-sm">{categoryMap[product.category_id || ''] || '—'}</span></TableCell>
                    <TableCell><span className="text-sm">{brandMap[product.brand_id || ''] || '—'}</span></TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium">{formatCurrency(product.selling_price)}</p>
                        {product.original_price && (
                          <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.original_price)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{getStockBadge(product.stock)}</TableCell>
                    <TableCell><StatusBadge status={product.status} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/catalog/products/${product.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick({ id: product.id, name: product.name })}>
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredProducts.length} of {products.length} products</span>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteProduct.isPending}>
              {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedProducts.length} Products</DialogTitle>
            <DialogDescription>Are you sure you want to delete {selectedProducts.length} selected product(s)? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
