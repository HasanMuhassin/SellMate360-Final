import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, UserRole, AppRole } from '@/types/database';
import { useSessionContext } from '@/context/SessionContext';

const customerSyncUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-or-create-customer`;

async function syncCustomerRecord(session: Session | null) {
  if (!session?.access_token) return;

  const { user } = session;

  try {
    const response = await fetch(customerSyncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
        phone: typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '',
        email: user.email || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Customer sync failed:', errorText);
    }
  } catch (error) {
    console.warn('Customer sync failed:', error);
  }
}

// =====================================================
// AUTH STATE
// =====================================================

export function useSession() {
  return useSessionContext();
}

export function useUser() {
  const { user, loading } = useSessionContext();
  return { user, loading };
}

// =====================================================
// PROFILE
// =====================================================

export function useProfile() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: async (profile: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

// =====================================================
// USER ROLES
// =====================================================

export function useUserRoles() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });
}

export function useHasRole(role: AppRole) {
  const { data: roles, isLoading } = useUserRoles();
  return {
    hasRole: roles?.some(r => r.role === role) ?? false,
    isLoading,
  };
}

export function useIsStaff() {
  const { data: roles, isLoading } = useUserRoles();
  return {
    isStaff: (roles?.length ?? 0) > 0,
    isLoading,
  };
}

export function useIsAdminOrManager() {
  const { data: roles, isLoading } = useUserRoles();
  return {
    isAdminOrManager: roles?.some(r => r.role === 'admin' || r.role === 'manager') ?? false,
    isLoading,
  };
}

// =====================================================
// AUTH MUTATIONS
// =====================================================

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      await syncCustomerRecord(data.session);
      return data;
    },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      name,
      phone,
    }: { 
      email: string; 
      password: string; 
      name: string;
      phone?: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone: phone || '' },
        },
      });
      
      if (error) throw error;
      await syncCustomerRecord(data.session);
      return data;
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
  });
}
