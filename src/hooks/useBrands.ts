import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Brand } from '@/types/database';

// =====================================================
// QUERIES
// =====================================================

export function useBrands(options?: { status?: 'active' | 'inactive' }) {
  return useQuery({
    queryKey: ['brands', options],
    queryFn: async () => {
      let query = supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Brand[];
    },
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ['brand', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Brand | null;
    },
    enabled: !!id,
  });
}

export function useBrandBySlug(slug: string) {
  return useQuery({
    queryKey: ['brand', 'slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Brand | null;
    },
    enabled: !!slug,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('brands')
        .insert(brand)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...brand }: Partial<Brand> & { id: string }) => {
      const { data, error } = await supabase
        .from('brands')
        .update(brand)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['brand', data.id] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}
