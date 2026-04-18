import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function callContent(action: string, payload: Record<string, any> = {}) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/manage-content`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || apiKey}`,
        apikey: apiKey,
      },
      body: JSON.stringify({ action, ...payload }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Content API error ${res.status}`);
  }
  return res.json();
}

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
    queryFn: () => callContent("list_pages"),
  });
}

export function useCreateCMSPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<CMSPageRow>) => callContent("create_page", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-pages"] }),
  });
}

export function useUpdateCMSPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<CMSPageRow> & { id: string }) => callContent("update_page", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-pages"] }),
  });
}

export function useDeleteCMSPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callContent("delete_page", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms-pages"] }),
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
    queryFn: () => callContent("list_announcements"),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<AnnouncementRow>) => callContent("create_announcement", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<AnnouncementRow> & { id: string }) => callContent("update_announcement", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callContent("delete_announcement", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
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
    queryFn: () => callContent("list_seo_settings"),
  });
}

export function useUpdateSEOSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<SEOSettingRow> & { id: string }) => callContent("update_seo_setting", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seo-settings"] }),
  });
}

export function useCreateSEOSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<SEOSettingRow>) => callContent("create_seo_setting", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seo-settings"] }),
  });
}
