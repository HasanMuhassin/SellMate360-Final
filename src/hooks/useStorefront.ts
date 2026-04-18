import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types/store';

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta: string | null;
  link: string | null;
  image_url: string | null;
}

// Map DB row to Product type used by components
function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    price: Number(row.selling_price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    images: row.image_url ? [row.image_url] : ['/placeholder.svg'],
    category: row.categories?.slug || '',
    brand: row.brands?.name || '',
    stock: row.stock,
    stockStatus: (row.stock_status || 'in-stock').replace(/_/g, '-') as Product['stockStatus'],
    rating: Number(row.rating),
    reviewCount: row.review_count,
    features: row.features || [],
    isBestSeller: row.is_bestseller,
    isNew: row.is_new,
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image_url || '',
    productCount: row.product_count?.[0]?.count || 0,
  };
}

export function useStorefrontProducts(options?: {
  bestseller?: boolean;
  isNew?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['storefront-products', options],
    queryFn: async () => {
      let query = supabase
        .from('products' as any)
        .select('*, categories:category_id(slug), brands:brand_id(name)')
        .eq('status', 'active');

      if (options?.bestseller) query = query.eq('is_bestseller', true);
      if (options?.isNew) query = query.eq('is_new', true);
      if (options?.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapProduct);
    },
  });
}

export function useStorefrontCategories() {
  return useQuery({
    queryKey: ['storefront-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories' as any)
        .select('*')
        .eq('status', 'active')
        .order('position');

      if (error) throw error;

      // Get product counts per category
      const { data: products } = await supabase
        .from('products' as any)
        .select('category_id')
        .eq('status', 'active');

      const counts: Record<string, number> = {};
      (products || []).forEach((p: any) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });

      return (data || []).map((row: any): Category => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        image: row.image_url || '',
        productCount: counts[row.id] || 0,
      }));
    },
  });
}

export function useStorefrontBanners() {
  return useQuery({
    queryKey: ['storefront-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners' as any)
        .select('*')
        .order('position');

      if (error) throw error;
      // Filter active banners client-side to handle different DB schemas
      const banners = (data || []).filter((b: any) => 
        b.is_active === true || b.is_active === undefined || b.status === 'active'
      );
      return banners as Banner[];
    },
  });
}

export function useStorefrontProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['storefront-product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products' as any)
        .select('*, categories:category_id(slug, name), brands:brand_id(name), images:product_images(*)')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const product = mapProduct(data);
      // Add extra images from product_images table
      const extraImages = (data.images || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((img: any) => img.url);
      if (extraImages.length > 0) {
        product.images = extraImages;
      }
      return product;
    },
    enabled: !!slug,
  });
}

export function useStorefrontRelatedProducts(categorySlug: string, excludeId: string) {
  return useQuery({
    queryKey: ['storefront-related', categorySlug, excludeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products' as any)
        .select('*, categories:category_id(slug), brands:brand_id(name)')
        .eq('status', 'active')
        .neq('id', excludeId)
        .limit(4);

      if (error) throw error;
      const all = (data || []).map(mapProduct);
      // Prefer same category, fall back to any
      const sameCategory = all.filter((p: Product) => p.category === categorySlug);
      return sameCategory.length > 0 ? sameCategory.slice(0, 4) : all.slice(0, 4);
    },
    enabled: !!categorySlug && !!excludeId,
  });
}
