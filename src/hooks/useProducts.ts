import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductImage } from '@/types/database';

const BROADCAST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-new-product`;

// =====================================================
// QUERIES
// =====================================================

export function useProducts(options?: {
  status?: 'active' | 'inactive';
  category_id?: string;
  brand_id?: string;
  is_bestseller?: boolean;
  is_new?: boolean;
  is_featured?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.category_id) {
        query = query.eq('category_id', options.category_id);
      }
      if (options?.brand_id) {
        query = query.eq('brand_id', options.brand_id);
      }
      if (options?.is_bestseller !== undefined) {
        query = query.eq('is_bestseller', options.is_bestseller);
      }
      if (options?.is_new !== undefined) {
        query = query.eq('is_new', options.is_new);
      }
      if (options?.is_featured !== undefined) {
        query = query.eq('is_featured', options.is_featured);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

// For reseller portal - only active products with stock
export function useResellerProducts() {
  return useQuery({
    queryKey: ['reseller-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .gt('stock', 0)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          images:product_images(*)
        `)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!slug,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'brand' | 'images'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Fire-and-forget: notify WhatsApp customers about the new product.
      // We do NOT await this — the admin UI is never delayed by the broadcast.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        fetch(BROADCAST_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ product: data }),
        }).catch((err) => console.warn('[WA Broadcast] Failed to trigger new-product notify:', err));
      } catch (err) {
        console.warn('[WA Broadcast] Could not get session for new-product notify:', err);
      }
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Try hard delete first; if FK constraint blocks it, soft-delete
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.message?.includes('foreign key constraint')) {
          // Soft delete – mark as inactive instead
          const { error: updateError } = await supabase
            .from('products')
            .update({ status: 'inactive' })
            .eq('id', id);
          if (updateError) throw updateError;
          return { softDeleted: true };
        }
        throw error;
      }
      return { softDeleted: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// =====================================================
// PRODUCT IMAGES
// =====================================================

export function useAddProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: Omit<ProductImage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('product_images')
        .insert(image)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product', data.product_id] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return product_id;
    },
    onSuccess: (product_id) => {
      queryClient.invalidateQueries({ queryKey: ['product', product_id] });
    },
  });
}
