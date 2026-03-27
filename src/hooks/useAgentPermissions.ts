/**
 * Agent permission hooks for granular per-agent-type access control.
 *
 * Provides:
 * - useAgentPermissions(agentType): Single agent type permission lookup
 * - useAllAgentPermissions(): All agent type permissions for current user's role
 *
 * Permission matrix (defaults):
 *   admin  = { canConfigure: true,  canApprove: true,  canViewLogs: true  }
 *   issm   = { canConfigure: false, canApprove: true,  canViewLogs: true  }
 *   isso   = { canConfigure: false, canApprove: false, canViewLogs: true  }
 *   viewer = { canConfigure: false, canApprove: false, canViewLogs: false }
 *
 * Safe default on error: all permissions false (deny by default).
 *
 * Usage:
 *   import { useAgentPermissions } from '@/hooks/useAgentPermissions';
 *   const { data: perms } = useAgentPermissions('grc_analyst');
 *   if (perms?.canApprove) { ... }
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface AgentPermissions {
  canConfigure: boolean;
  canApprove: boolean;
  canViewLogs: boolean;
}

const DENY_ALL: AgentPermissions = {
  canConfigure: false,
  canApprove: false,
  canViewLogs: false,
};

/**
 * Fetches permissions for a specific agent type based on the current user's
 * company and role. Returns { canConfigure, canApprove, canViewLogs }.
 *
 * On error or missing row, returns all-false (deny by default).
 */
export function useAgentPermissions(agentType: string) {
  const { data: profile } = useUserProfile();

  return useQuery({
    queryKey: [
      'agent-permissions',
      profile?.company_id,
      profile?.role,
      agentType,
    ],
    queryFn: async (): Promise<AgentPermissions> => {
      const { data, error } = await supabase
        .from('company_agent_permissions')
        .select('can_configure, can_approve, can_view_logs')
        .eq('company_id', profile!.company_id)
        .eq('role', profile!.role)
        .eq('agent_type', agentType)
        .single();

      if (error) return DENY_ALL;

      return {
        canConfigure: data.can_configure,
        canApprove: data.can_approve,
        canViewLogs: data.can_view_logs,
      };
    },
    enabled: !!profile?.company_id && !!profile?.role,
  });
}

/**
 * Fetches all agent type permissions for the current user's company and role.
 * Returns a Map<agentType, AgentPermissions>.
 *
 * Useful for components that need to check permissions across multiple
 * agent types (e.g., ApprovalQueue showing items from different agents).
 */
export function useAllAgentPermissions() {
  const { data: profile } = useUserProfile();

  return useQuery({
    queryKey: [
      'agent-permissions',
      profile?.company_id,
      profile?.role,
      'all',
    ],
    queryFn: async (): Promise<Map<string, AgentPermissions>> => {
      const { data, error } = await supabase
        .from('company_agent_permissions')
        .select('agent_type, can_configure, can_approve, can_view_logs')
        .eq('company_id', profile!.company_id)
        .eq('role', profile!.role);

      if (error || !data) return new Map();

      const map = new Map<string, AgentPermissions>();
      data.forEach(
        (row: {
          agent_type: string;
          can_configure: boolean;
          can_approve: boolean;
          can_view_logs: boolean;
        }) =>
          map.set(row.agent_type, {
            canConfigure: row.can_configure,
            canApprove: row.can_approve,
            canViewLogs: row.can_view_logs,
          })
      );
      return map;
    },
    enabled: !!profile?.company_id && !!profile?.role,
  });
}
