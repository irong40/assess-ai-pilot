/**
 * Supabase Realtime subscription for agent task status changes.
 *
 * Subscribes to postgres_changes on the agent_tasks table and
 * invalidates TanStack Query caches when changes are detected.
 *
 * IMPORTANT: Requires Realtime to be enabled on the agent_tasks table
 * in the Supabase Dashboard (Database > Replication > agent_tasks).
 *
 * Usage:
 *   import { useRealtimeAgentStatus } from '@/hooks/useRealtimeAgentStatus';
 *   // Call at page level (e.g., AgentDashboard)
 *   useRealtimeAgentStatus();
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeAgentStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('agent-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_tasks',
        },
        () => {
          // Invalidate all agent-related query caches so UI refreshes
          queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['ciso-task-queue'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
