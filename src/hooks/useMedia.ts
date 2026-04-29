import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  url: string;
  thumbnail_url: string | null;
  size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  folder_id: string | null;
  tags: string[];
  alt_text: string | null;
  uploaded_by: string;
  created_at: string;
}

// ==================== MEDIA FOLDERS ====================
export function useMediaFolders() {
  return useQuery({
    queryKey: ['media_folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_folders')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as MediaFolder[];
    },
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string | null }) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const { data, error } = await supabase
        .from('media_folders')
        .insert({ name, slug, parent_id: parentId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_folders'] });
      toast.success('Folder created successfully');
    },
  });
}

// ==================== MEDIA ITEMS ====================
export function useMediaLibrary(folderId?: string | null) {
  return useQuery({
    queryKey: ['media_items', folderId],
    queryFn: async () => {
      let query = supabase.from('media_items').select('*').order('created_at', { ascending: false });
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as MediaItem[];
    },
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      file, 
      folderId, 
      tags = [], 
      altText 
    }: { 
      file: File; 
      folderId?: string | null; 
      tags?: string[]; 
      altText?: string 
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = folderId ? `${folderId}/${fileName}` : fileName;

      // 1. Upload to Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // 3. Save to DB
      const { data, error } = await supabase
        .from('media_items')
        .insert({
          filename: fileName,
          original_filename: file.name,
          url: publicUrl,
          size: file.size,
          mime_type: file.type,
          folder_id: folderId,
          tags,
          alt_text: altText,
          uploaded_by: 'Admin'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_items'] });
      toast.success('File uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    }
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: MediaItem[]) => {
      for (const item of items) {
        // 1. Delete from Storage (need to parse path from URL)
        const path = item.url.split('/storage/v1/object/public/media/')[1];
        if (path) {
          await supabase.storage.from('media').remove([path]);
        }

        // 2. Delete from DB
        await supabase.from('media_items').delete().eq('id', item.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_items'] });
      toast.success('Media deleted successfully');
    },
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MediaItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('media_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media_items'] });
      toast.success('Media updated successfully');
    },
  });
}
