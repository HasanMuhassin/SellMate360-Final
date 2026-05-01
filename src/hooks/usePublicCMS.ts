import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CMSPageRow } from './useContent';

/** Public hook — fetches a single published CMS page by slug (no auth required) */
export function usePublicCMSPage(slug: string) {
  return useQuery<CMSPageRow | null>({
    queryKey: ['cms-page-public', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data as CMSPageRow | null;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}

/** Public hook — fetches all published CMS pages for footer/nav rendering */
export function usePublicCMSPages() {
  return useQuery<Pick<CMSPageRow, 'id' | 'title' | 'slug' | 'show_in_footer' | 'show_in_menu' | 'menu_position'>[]>({
    queryKey: ['cms-pages-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('id, title, slug, show_in_footer, show_in_menu, menu_position')
        .eq('status', 'published')
        .order('menu_position', { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 120_000,
  });
}
