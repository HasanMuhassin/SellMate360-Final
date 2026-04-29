import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

// ==================== CMS PAGES ====================
export interface CMSPageRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  show_in_footer: boolean;
  show_in_menu: boolean;
  menu_position: number;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCMSPages() {
  return useQuery<CMSPageRow[]>({
    queryKey: ["cms-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .order('menu_position', { ascending: true });
      if (error) throw error;
      return data as CMSPageRow[];
    },
  });
}

export function useCreateCMSPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<CMSPageRow>) => {
      const { data, error } = await supabase.from('cms_pages').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success('Page created');
    },
  });
}

export function useUpdateCMSPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CMSPageRow> & { id: string }) => {
      const { data, error } = await supabase.from('cms_pages').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success('Page updated');
    },
  });
}

export function useDeleteCMSPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cms_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success('Page deleted');
    },
  });
}

// ==================== ANNOUNCEMENTS ====================
export interface AnnouncementRow {
  id: string;
  message: string;
  link: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  position: string;
  show_close_button: boolean;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
  target_pages: string[];
  created_at: string;
}

export function useAnnouncements() {
  return useQuery<AnnouncementRow[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false });
      if (error) throw error;
      return data as AnnouncementRow[];
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<AnnouncementRow>) => {
      const { data, error } = await supabase.from('announcements').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success('Announcement created');
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AnnouncementRow> & { id: string }) => {
      const { data, error } = await supabase.from('announcements').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success('Announcement updated');
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success('Announcement deleted');
    },
  });
}

// ==================== SEO SETTINGS ====================
export interface SEOSettingRow {
  id: string;
  page_type: string;
  page_name: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical_url: string;
  robots_directive: string;
  structured_data: string;
  updated_at: string;
}

export function useSEOSettings() {
  return useQuery<SEOSettingRow[]>({
    queryKey: ["seo-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from('seo_settings').select('*');
      if (error) throw error;
      return data as SEOSettingRow[];
    },
  });
}

export function useUpdateSEOSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SEOSettingRow> & { id: string }) => {
      const { data, error } = await supabase.from('seo_settings').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-settings"] });
      toast.success('SEO updated');
    },
  });
}

export function useCreateSEOSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<SEOSettingRow>) => {
      const { data, error } = await supabase.from('seo_settings').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo-settings"] });
      toast.success('SEO setting created');
    },
  });
}
