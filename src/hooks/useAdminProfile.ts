import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { toast } from 'sonner';
import { useCreateAuditLog } from './useSecurity';

export function useAdminProfile() {
  const { user } = useAdminAuth();
  const queryClient = useQueryClient();
  const createAuditLog = useCreateAuditLog();

  const query = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { name?: string; phone?: string; avatar_url?: string }) => {
      if (!user?.id) throw new Error('No active user session');
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);
        
      if (error) throw error;
      return profileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile', user?.id] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('No active user session');
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfileMutation.mutateAsync({ avatar_url: publicUrl });
      
      return publicUrl;
    },
    onError: (error) => {
      toast.error('Failed to upload avatar: ' + error.message);
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      // Log the action
      if (user?.id) {
        createAuditLog.mutate({
          action: 'change_password',
          resource: 'profile',
          resource_id: user.id,
          details: { source: 'admin_dashboard' },
          level: 'warning'
        });
      }
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update password: ' + error.message);
    }
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    updatePassword: updatePasswordMutation.mutate,
    isUpdatingPassword: updatePasswordMutation.isPending,
  };
}
