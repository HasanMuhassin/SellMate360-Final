import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function callSecurity(action: string, payload: Record<string, unknown> = {}) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/manage-security`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || apiKey}`,
        apikey: apiKey,
      },
      body: JSON.stringify({ 
        action, 
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
        ...payload 
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Security API error ${res.status}`);
  }
  return res.json();
}

// ==================== TYPES ====================
export interface AuditLogRow {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  resource: string;
  resource_id: string | null;
  details: any;
  ip_address: string;
  user_agent: string;
  level: string;
  created_at: string;
}

export interface LoginHistoryRow {
  id: string;
  email: string;
  user_name: string | null;
  success: boolean;
  ip_address: string;
  user_agent: string;
  location: string | null;
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
    mutationFn: (p: Partial<AuditLogRow>) => callSecurity("create_audit_log", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit-logs"] }),
  });
}

export function useLoginHistory() {
  return useQuery<LoginHistoryRow[]>({
    queryKey: ["login-history"],
    queryFn: () => callSecurity("list_login_history"),
  });
}

export function useCreateLoginEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<LoginHistoryRow>) => callSecurity("create_login_entry", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["login-history"] }),
  });
}

export function useRoleChanges() {
  return useQuery<RoleChangeRow[]>({
    queryKey: ["role-changes"],
    queryFn: () => callSecurity("list_role_changes"),
  });
}

export function useCreateRoleChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<RoleChangeRow>) => callSecurity("create_role_change", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["role-changes"] }),
  });
}

export function useSecurityStats() {
  return useQuery<SecurityStats>({
    queryKey: ["security-stats"],
    queryFn: () => callSecurity("security_stats"),
  });
}
