import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const functionsBaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  order_number: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupportTickets() {
  return useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return [];

      const res = await fetch(`${functionsBaseUrl}/manage-support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'list' }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to fetch tickets');
      return (data.tickets || []) as SupportTicket[];
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: {
      subject: string;
      message: string;
      priority: string;
      order_number?: string;
    }) => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`${functionsBaseUrl}/create-support-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject: ticket.subject,
          message: ticket.message,
          priority: ticket.priority,
          order_number: ticket.order_number || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to create ticket');
      return data.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}
