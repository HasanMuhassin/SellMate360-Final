import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/database';
import { withTimeout } from '@/context/adminAuth/withTimeout';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  avatar?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (requiredRoles: AppRole[]) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const userRef = useRef<AdminUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Keep ref in sync with state
  const setUserAndRef = useCallback((value: AdminUser | null | ((prev: AdminUser | null) => AdminUser | null)) => {
    if (typeof value === 'function') {
      setUser(prev => {
        const next = value(prev);
        userRef.current = next;
        return next;
      });
    } else {
      userRef.current = value;
      setUser(value);
    }
  }, []);

  // Check if user has admin/staff role
  const checkAdminRole = useCallback(async (userId: string, userEmail: string, userName: string) => {
    const roleResult = await withTimeout<any>(
      supabase.from('user_roles').select('role').eq('user_id', userId),
      10_000,
      'Role lookup'
    );

    const roles = roleResult?.data as Array<{ role: AppRole }> | null;
    const error = roleResult?.error as { message?: string } | null;

    if (error) {
      console.error('Error fetching roles:', error);
      return null;
    }

    // Check for admin roles (admin, manager, staff, cashier)
    const adminRoles: AppRole[] = ['admin', 'manager', 'staff', 'cashier'];
    const userRole = roles?.find(r => adminRoles.includes(r.role as AppRole));

    if (userRole) {
      return {
        id: userId,
        email: userEmail,
        name: userName,
        role: userRole.role as AppRole,
      };
    }

    return null;
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const adminUser = await checkAdminRole(
          session.user.id,
          session.user.email || '',
          profile.data?.name || session.user.email || ''
        );
        setUserAndRef(adminUser);
      }
      
      setIsInitializing(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AdminAuth] Auth state changed:', event);
        if (event === 'SIGNED_OUT') {
          setUserAndRef(null);
        } else if (session?.user && event === 'SIGNED_IN') {
          // Skip if we already have this user authenticated to avoid unnecessary re-renders
          // that cause input fields to lose focus across the admin panel
          if (userRef.current?.id === session.user.id) {
            return;
          }
          // Defer the async operations to avoid blocking
          setTimeout(async () => {
            try {
              const profile = await withTimeout<any>(
                supabase
                  .from('profiles')
                  .select('name')
                  .eq('user_id', session.user.id)
                  .maybeSingle(),
                10_000,
                'Profile lookup'
              );

              const adminUser = await checkAdminRole(
                session.user.id,
                session.user.email || '',
                profile?.data?.name || session.user.email || ''
              );

              setUserAndRef(prev => {
                if (prev?.id === adminUser?.id && prev?.role === adminUser?.role) return prev;
                return adminUser;
              });
            } catch (err) {
              console.error('[AdminAuth] Post-sign-in admin verification failed:', err);
              setUserAndRef(prev => prev === null ? prev : null);
            }
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[AdminAuth] Starting login for:', email);
    setIsLoggingIn(true);
    
    try {
      const signInResult = await withTimeout<any>(
        supabase.auth.signInWithPassword({ email, password }),
        15_000,
        'Sign in'
      );

      const data = signInResult?.data;
      const error = signInResult?.error;

      console.log('[AdminAuth] Sign in result:', { hasData: !!data, hasError: !!error, error: error?.message });

      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'Login failed' };

      // Fetch profile (best-effort)
      let profileName = data.user.email || '';
      try {
        const profileResult = await withTimeout<any>(
          supabase
            .from('profiles')
            .select('name')
            .eq('user_id', data.user.id)
            .maybeSingle(),
          10_000,
          'Profile lookup'
        );

        if (profileResult?.data?.name) profileName = profileResult.data.name;
      } catch (profileErr) {
        console.warn('[AdminAuth] Profile fetch failed, using email as name:', profileErr);
      }

      // Verify admin role (must succeed)
      const adminUser = (await withTimeout<any>(
        checkAdminRole(data.user.id, data.user.email || '', profileName),
        10_000,
        'Admin role verification'
      )) as AdminUser | null;

      if (!adminUser) {
        await supabase.auth.signOut();
        return { success: false, error: 'You do not have admin access. Please contact your administrator.' };
      }

      setUserAndRef(adminUser);
      return { success: true };
    } catch (err) {
      console.error('[AdminAuth] Login error:', err);
      // Ensure we never leave the UI hanging in a partially-authenticated state.
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      return { success: false, error: 'Login did not complete. Please try again.' };
    } finally {
      setIsLoggingIn(false);
    }
  }, [checkAdminRole]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUserAndRef(null);
  }, []);

  const hasPermission = useCallback((requiredRoles: AppRole[]) => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }, [user]);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isInitializing,
        isLoggingIn,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
