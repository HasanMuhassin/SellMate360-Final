import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SEOSettingRow } from './useContent';

/** Fetches SEO settings for a specific page type. Public, no auth required. */
export function usePageSEO(pageType: string) {
  return useQuery<SEOSettingRow | null>({
    queryKey: ['seo', pageType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('page_type', pageType)
        .maybeSingle();
      if (error) throw error;
      return data as SEOSettingRow | null;
    },
    staleTime: 300_000, // 5 min — SEO rarely changes
    enabled: !!pageType,
  });
}
