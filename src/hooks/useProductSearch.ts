import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/store';

function mapSearchResult(row: any): Product {
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

export function useProductSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['product-search', trimmed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products' as any)
        .select('*, categories:category_id(slug), brands:brand_id(name)')
        .eq('status', 'active')
        .ilike('name', `%${trimmed}%`)
        .limit(8);

      if (error) throw error;
      return (data || []).map(mapSearchResult);
    },
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}
