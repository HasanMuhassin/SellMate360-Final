import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Save, Package, DollarSign, Image, Search, X, Upload, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { useCreateAuditLog } from '@/hooks/useSecurity';
import { toast } from 'sonner';

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  brandId: string;
  status: 'active' | 'inactive';
  costPrice: number;
  sellingPrice: number;
  originalPrice: number;
  resellerPrice: number;
  stock: number;
  imageUrl: string;
  galleryUrls: string[];
  slug: string;
  metaTitle: string;
  metaDescription: string;
  features: string[];
  isNew: boolean;
  isBestseller: boolean;
}

const steps = [
  { id: 1, name: 'Details', icon: Package, description: 'Basic product information' },
  { id: 2, name: 'Pricing', icon: DollarSign, description: 'Cost and selling prices' },
  { id: 3, name: 'Images', icon: Image, description: 'Product photos' },
  { id: 4, name: 'SEO', icon: Search, description: 'Search optimization' },
];

const initialFormData: ProductFormData = {
  name: '', sku: '', description: '', categoryId: '', brandId: '',
  status: 'active', costPrice: 0, sellingPrice: 0, originalPrice: 0, resellerPrice: 0,
  stock: 0, imageUrl: '', galleryUrls: [], slug: '', metaTitle: '', metaDescription: '',
  features: [], isNew: false, isBestseller: false,
};

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingProduct, isLoading: loadingProduct } = useProduct(id || '');
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createAuditLog = useCreateAuditLog();

  const [currentStep, setCurrentStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isEditing && existingProduct && !initialized) {
      setFormData({
        name: existingProduct.name,
        sku: existingProduct.sku || '',
        description: existingProduct.description || '',
        categoryId: existingProduct.category_id || '',
        brandId: existingProduct.brand_id || '',
        status: existingProduct.status as 'active' | 'inactive',
        costPrice: 0,
        sellingPrice: existingProduct.selling_price,
        originalPrice: existingProduct.original_price || 0,
        resellerPrice: 0,
        stock: existingProduct.stock,
        imageUrl: existingProduct.image_url || '',
        galleryUrls: [],
        slug: existingProduct.slug,
        metaTitle: existingProduct.name,
        metaDescription: existingProduct.description?.slice(0, 160) || '',
        features: existingProduct.features || [],
        isNew: existingProduct.is_new,
        isBestseller: existingProduct.is_bestseller,
      });
      setInitialized(true);
    }
  }, [existingProduct, isEditing, initialized]);

  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (name: string) => {
    updateField('name', name);
    if (!formData.slug || formData.slug === generateSlug(formData.name)) {
      updateField('slug', generateSlug(name));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.features.includes(tag)) {
      updateField('features', [...formData.features, tag]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => updateField('features', formData.features.filter(x => x !== t));

  const calculateProfit = () => formData.sellingPrice - (formData.costPrice || 0);
  const calculateMargin = () => {
    if (formData.sellingPrice === 0) return '0';
    return ((calculateProfit() / formData.sellingPrice) * 100).toFixed(0);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Product name is required');
      return;
    }
    try {
      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        sku: formData.sku || null,
        description: formData.description || null,
        selling_price: formData.sellingPrice,
        original_price: formData.originalPrice || null,
        cost_price: formData.costPrice || 0,
        reseller_price: formData.resellerPrice || null,
        stock: formData.stock,
        low_stock_threshold: 10,
        stock_status: formData.stock > 0 ? 'in_stock' : 'out_of_stock',
        status: formData.status,
        category_id: formData.categoryId || null,
        brand_id: formData.brandId || null,
        image_url: formData.imageUrl || null,
        features: formData.features.length > 0 ? formData.features : [],
        is_new: formData.isNew,
        is_bestseller: formData.isBestseller,
        is_featured: false,
        rating: 0,
        review_count: 0,
      };

      if (isEditing && id) {
        await updateProduct.mutateAsync({ id, ...payload });
        
        // Record update audit log
        createAuditLog.mutate({
          action: 'update_product',
          resource: 'catalog',
          resource_id: id,
          details: { name: formData.name, sku: formData.sku, category: formData.category_id },
          level: 'info'
        });

        toast.success('Product updated');
      } else {
        const result = await createProduct.mutateAsync(payload as any);
        
        // Record creation audit log
        createAuditLog.mutate({
          action: 'create_product',
          resource: 'catalog',
          resource_id: result.id,
          details: { name: formData.name, sku: formData.sku, category: formData.category_id },
          level: 'info'
        });

        toast.success('Product created');
      }
      navigate('/admin/catalog/products');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save product');
    }
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;

  if (isEditing && loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Wireless Bluetooth Earbuds" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => updateField('sku', e.target.value.toUpperCase())} placeholder="e.g., ELEC-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Detailed product description..." rows={5} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.categoryId || 'none'} onValueChange={(v) => updateField('categoryId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select category...</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={formData.brandId || 'none'} onValueChange={(v) => updateField('brandId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select brand...</SelectItem>
                    {brands.filter(b => b.status === 'active').map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Features / Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Type and press Enter" />
                <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => updateField('status', v as 'active' | 'inactive')}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost & Pricing</CardTitle>
                  <CardDescription>Set your product prices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Cost Price (LKR) *</Label>
                    <Input type="number" min="0" value={formData.costPrice || ''} onChange={(e) => updateField('costPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    <p className="text-xs text-muted-foreground">Your purchase/manufacturing cost</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Selling Price (LKR) *</Label>
                    <Input type="number" min="0" value={formData.sellingPrice || ''} onChange={(e) => updateField('sellingPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Compare at Price (LKR)</Label>
                    <Input type="number" min="0" value={formData.originalPrice || ''} onChange={(e) => updateField('originalPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    <p className="text-xs text-muted-foreground">Original price (shown as strikethrough)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Reseller Price (LKR)</Label>
                    <Input type="number" min="0" value={formData.resellerPrice || ''} onChange={(e) => updateField('resellerPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    <p className="text-xs text-muted-foreground">Special price for reseller partners</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profit Analysis</CardTitle>
                  <CardDescription>Calculated margins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Cost Price</span>
                    <span className="font-medium">LKR {formData.costPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Selling Price</span>
                    <span className="font-medium">LKR {formData.sellingPrice.toLocaleString()}</span>
                  </div>
                  <div className={cn("flex justify-between items-center p-4 rounded-lg", calculateProfit() >= 0 ? "bg-green-50" : "bg-red-50")}>
                    <span className="font-medium">Profit</span>
                    <span className={cn("font-bold text-lg", calculateProfit() >= 0 ? "text-green-600" : "text-red-600")}>
                      LKR {calculateProfit().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-medium">Profit Margin</span>
                    <span className="font-bold text-lg">{calculateMargin()}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thumbnail Image</CardTitle>
                <CardDescription>Main product image displayed in listings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={formData.imageUrl} onChange={(e) => updateField('imageUrl', e.target.value)} placeholder="Enter thumbnail image URL..." className="flex-1" />
                </div>
                {formData.imageUrl ? (
                  <div className="relative w-48 h-48 rounded-lg border overflow-hidden group">
                    <img src={formData.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    <button onClick={() => updateField('imageUrl', '')} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-xs">No image set</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gallery Images</CardTitle>
                <CardDescription>Additional product photos (drag to reorder)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} placeholder="Enter gallery image URL..." className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (galleryInput.trim()) { updateField('galleryUrls', [...formData.galleryUrls, galleryInput.trim()]); setGalleryInput(''); } } }} />
                  <Button type="button" variant="secondary" onClick={() => { if (galleryInput.trim()) { updateField('galleryUrls', [...formData.galleryUrls, galleryInput.trim()]); setGalleryInput(''); } }}>
                    <Upload className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
                {formData.galleryUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.galleryUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => updateField('galleryUrls', formData.galleryUrls.filter((_, i) => i !== index))} className="bg-destructive text-destructive-foreground rounded-full p-1.5">
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <GripVertical className="h-4 w-4 text-white" />
                        </div>
                        <Badge className="absolute bottom-1 left-1 text-xs" variant="secondary">{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No gallery images added yet</p>
                    <p className="text-xs">Add image URLs above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meta Information</CardTitle>
                <CardDescription>Optimize for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input id="metaTitle" value={formData.metaTitle} onChange={(e) => updateField('metaTitle', e.target.value)} placeholder="Product title for search engines" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Recommended: 30-60 characters</span>
                    <span className={formData.metaTitle.length > 60 ? 'text-destructive' : ''}>{formData.metaTitle.length}/60</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDesc">Meta Description</Label>
                  <Textarea id="metaDesc" value={formData.metaDescription} onChange={(e) => updateField('metaDescription', e.target.value)} placeholder="Brief description for search results" rows={3} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Recommended: 120-160 characters</span>
                    <span className={formData.metaDescription.length > 160 ? 'text-destructive' : ''}>{formData.metaDescription.length}/160</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">URL Slug</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/product/</span>
                  <Input value={formData.slug} onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} placeholder="product-url-slug" className="flex-1" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Preview</CardTitle>
                <CardDescription>How this product will appear in Google results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg space-y-1">
                  <p className="text-primary text-lg hover:underline cursor-pointer">{formData.metaTitle || formData.name || 'Product Title'}</p>
                  <p className="text-sm text-green-700">sellmate360.com/product/{formData.slug || 'product-slug'}</p>
                  <p className="text-sm text-muted-foreground">{formData.metaDescription || formData.description?.slice(0, 160) || 'Add a description...'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/catalog/products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="text-muted-foreground">{isEditing ? `Editing: ${existingProduct?.name}` : 'Create a new product listing'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="py-4">
          <nav>
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => (
                <li key={step.id} className={cn("flex items-center", index !== steps.length - 1 && "flex-1")}>
                  <button onClick={() => setCurrentStep(step.id)} className="flex items-center gap-3 group">
                    <span className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      currentStep === step.id ? "border-primary bg-primary text-primary-foreground"
                        : currentStep > step.id ? "border-primary bg-primary/10 text-primary"
                        : "border-muted-foreground/25 text-muted-foreground group-hover:border-muted-foreground"
                    )}>
                      {currentStep > step.id ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                    </span>
                    <span className="hidden md:block">
                      <span className={cn("block text-sm font-medium", currentStep >= step.id ? "text-foreground" : "text-muted-foreground")}>{step.name}</span>
                      <span className="text-xs text-muted-foreground">{step.description}</span>
                    </span>
                  </button>
                  {index !== steps.length - 1 && <div className={cn("hidden md:block flex-1 h-0.5 mx-4", currentStep > step.id ? "bg-primary" : "bg-muted")} />}
                </li>
              ))}
            </ol>
          </nav>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const I = steps[currentStep - 1].icon; return <I className="h-5 w-5" />; })()}
            {steps[currentStep - 1].name}
          </CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="flex items-center gap-2">
          {currentStep < steps.length ? (
            <Button onClick={() => setCurrentStep(s => Math.min(steps.length, s + 1))}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
