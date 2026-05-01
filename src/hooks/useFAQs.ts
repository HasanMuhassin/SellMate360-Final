import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ===================== TYPES =====================

export interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  category?: FAQCategory;
}

// ===================== ADMIN HOOKS =====================

export function useFAQCategories() {
  return useQuery<FAQCategory[]>({
    queryKey: ['faq-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as FAQCategory[];
    },
  });
}

export function useCreateFAQCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<FAQCategory>) => {
      const { data, error } = await supabase
        .from('faq_categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faq-categories'] });
      qc.invalidateQueries({ queryKey: ['faqs-public'] });
      toast.success('Category created');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateFAQCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FAQCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('faq_categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faq-categories'] });
      qc.invalidateQueries({ queryKey: ['faqs-public'] });
      toast.success('Category updated');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteFAQCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faq_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faq-categories'] });
      qc.invalidateQueries({ queryKey: ['faqs-public'] });
      toast.success('Category deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useFAQs(categoryId?: string) {
  return useQuery<FAQ[]>({
    queryKey: ['faqs', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('faqs')
        .select('*, category:faq_categories(*)')
        .order('sort_order', { ascending: true });
      if (categoryId) query = query.eq('category_id', categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FAQ[];
    },
  });
}

export function useCreateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (faq: Partial<FAQ>) => {
      const { data, error } = await supabase
        .from('faqs')
        .insert(faq)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['faqs', (vars as any).category_id] });
      qc.invalidateQueries({ queryKey: ['faqs-public'] });
      toast.success('FAQ created');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FAQ> & { id: string }) => {
      const { data, error } = await supabase
        .from('faqs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs'] });
      qc.invalidateQueries({ queryKey: ['faqs-public'] });
      toast.success('FAQ updated');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs'] });
      qc.invalidateQueries({ queryKey: ['faqs-public'] });
      toast.success('FAQ deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===================== PUBLIC HOOK =====================

export interface PublicFAQGroup {
  category: FAQCategory;
  faqs: FAQ[];
}

export function usePublicFAQs() {
  return useQuery<PublicFAQGroup[]>({
    queryKey: ['faqs-public'],
    queryFn: async () => {
      const [catRes, faqRes] = await Promise.all([
        supabase
          .from('faq_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('faqs')
          .select('*')
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (faqRes.error) throw faqRes.error;

      const categories = (catRes.data || []) as FAQCategory[];
      const faqs = (faqRes.data || []) as FAQ[];

      return categories
        .map((cat) => ({
          category: cat,
          faqs: faqs.filter((f) => f.category_id === cat.id),
        }))
        .filter((g) => g.faqs.length > 0);
    },
    staleTime: 60_000,
  });
}
