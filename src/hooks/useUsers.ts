import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemUser {
  id: string;
  role_id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string;
  role: 'admin' | 'manager' | 'staff' | 'cashier';
  status: 'active' | 'inactive' | 'suspended';
  last_sign_in: string | null;
  created_at: string;
}

const CLOUD_FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

async function callEdgeFunction(action: string, session: any, extra?: Record<string, any>) {
  const response = await fetch(`${CLOUD_FUNCTIONS_URL}/manage-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...extra }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Request failed');
  }
  return response.json();
}

export function useUsers() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await callEdgeFunction('list', session);
      setUsers(result.users || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (data: { email: string; name: string; role: string; phone?: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const result = await callEdgeFunction('create', session, data);
      if (result.success) {
        toast.success(`User created. Temporary password: ${result.temp_password}`, { duration: 15000 });
        await fetchUsers();
        return result;
      }
    } catch (err: any) {
      console.error('Failed to create user:', err);
      toast.error(`Failed to create user: ${err.message}`);
      return null;
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await callEdgeFunction('update_role', session, { user_id: userId, role });
      toast.success('User role updated');
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to update role:', err);
      toast.error('Failed to update role');
    }
  };

  const toggleStatus = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await callEdgeFunction('toggle_status', session, { user_id: userId });
      toast.success('User status updated');
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
    }
  };

  const resetPassword = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await callEdgeFunction('reset_password', session, { user_id: userId });
      if (result.success) {
        toast.success(`Password reset. New temp password: ${result.temp_password}`, { duration: 15000 });
      }
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      toast.error('Failed to reset password');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, isLoading, fetchUsers, createUser, updateRole, toggleStatus, resetPassword };
}
