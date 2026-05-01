import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

// ==================== TYPES ====================
export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  level: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}

export interface LoginHistoryRow {
  id: string;
  email: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface RoleChangeRow {
  id: string;
  target_user_id: string;
  target_user_name: string;
  target_user_email: string;
  previous_role: string | null;
  new_role: string;
  changed_by_user_id: string;
  changed_by_user_name: string;
  reason: string | null;
  created_at: string;
}

export interface SecurityStats {
  totalLogins24h: number;
  failedLogins24h: number;
  suspiciousAttempts: number;
  activeUsers: number;
  criticalActions7d: number;
  roleChanges30d: number;
}

// ==================== HOOKS ====================
export function useAuditLogs() {
  return useQuery<AuditLogRow[]>({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data as AuditLogRow[];
    },
  });
}

export function useCreateAuditLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<AuditLogRow>) => {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          ...log,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit-logs"] }),
  });
}

export function useLoginHistory() {
  return useQuery<LoginHistoryRow[]>({
    queryKey: ["login-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as LoginHistoryRow[];
    },
  });
}

export function useCreateLoginEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { email: string; success: boolean; failure_reason?: string | null }) => {
      // Use a SECURITY DEFINER RPC to bypass RLS — needed for failed/anon logins
      const { error } = await supabase.rpc('record_login_attempt', {
        p_email: entry.email,
        p_success: entry.success,
        p_failure_reason: entry.failure_reason || null,
        p_user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["login-history"] }),
  });
}

export function useRoleChanges() {
  return useQuery<RoleChangeRow[]>({
    queryKey: ["role-changes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_changes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as RoleChangeRow[];
    },
  });
}

export function useCreateRoleChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (change: Partial<RoleChangeRow>) => {
      const { data, error } = await supabase
        .from('role_changes')
        .insert(change)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["role-changes"] }),
  });
}

export function useSecurityStats() {
  return useQuery<SecurityStats>({
    queryKey: ["security-stats"],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalLogins },
        { count: failedLogins },
        { count: criticalActions },
        { count: roleChanges }
      ] = await Promise.all([
        supabase.from('login_attempts').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
        supabase.from('login_attempts').select('*', { count: 'exact', head: true }).gte('created_at', last24h).eq('success', false),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', last7d).eq('level', 'critical'),
        supabase.from('role_changes').select('*', { count: 'exact', head: true }).gte('created_at', last30d),
      ]);

      return {
        totalLogins24h: totalLogins || 0,
        failedLogins24h: failedLogins || 0,
        suspiciousAttempts: (failedLogins || 0) > 10 ? 1 : 0,
        activeUsers: 0, // Placeholder
        criticalActions7d: criticalActions || 0,
        roleChanges30d: roleChanges || 0,
      };
    },
  });
}
