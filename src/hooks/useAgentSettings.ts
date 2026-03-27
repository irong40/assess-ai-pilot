/**
 * TanStack Query hooks for agent settings management.
 *
 * Provides:
 * - useAgentSettings(): Fetch current company's agent settings
 * - useUpdateAgentSettings(): Upsert agent settings (INSERT ON CONFLICT UPDATE)
 *
 * Settings shape:
 *   {
 *     notifications: { approval_needed: boolean, drift_alert: boolean, task_complete: boolean },
 *     auto_approve_threshold: 'low' | 'medium' | 'none'
 *   }
 *
 * Usage:
 *   import { useAgentSettings, useUpdateAgentSettings } from '@/hooks/useAgentSettings';
 *   const { data: settings } = useAgentSettings();
 *   const updateSettings = useUpdateAgentSettings();
 *   updateSettings.mutate({ agentType: 'global', settings: { ... } });
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/hooks/use-toast';

export interface AgentNotificationSettings {
  approval_needed: boolean;
  drift_alert: boolean;
  task_complete: boolean;
}

export type AutoApproveThreshold = 'low' | 'medium' | 'none';

export interface AgentSettingsData {
  notifications: AgentNotificationSettings;
  auto_approve_threshold: AutoApproveThreshold;
}

export interface AgentSettingsRow {
  id: string;
  company_id: string;
  agent_type: string;
  settings: AgentSettingsData;
  updated_at: string;
  created_at: string;
}

const DEFAULT_SETTINGS: AgentSettingsData = {
  notifications: {
    approval_needed: true,
    drift_alert: true,
    task_complete: false,
  },
  auto_approve_threshold: 'low',
};

/**
 * Fetches agent settings for the current user's company.
 * Defaults to 'global' agent type for company-wide settings.
 */
export function useAgentSettings(agentType: string = 'global') {
  const { data: profile } = useUserProfile();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ['agent-settings', companyId, agentType] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_settings')
        .select('*')
        .eq('company_id', companyId!)
        .eq('agent_type', agentType)
        .single();

      if (error) {
        // If no settings row exists yet, return defaults
        if (error.code === 'PGRST116') {
          return {
            id: null,
            company_id: companyId!,
            agent_type: agentType,
            settings: DEFAULT_SETTINGS,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          } as unknown as AgentSettingsRow;
        }
        throw error;
      }
      return data as AgentSettingsRow;
    },
    enabled: !!companyId,
  });
}

interface UpdateSettingsInput {
  agentType?: string;
  settings: AgentSettingsData;
}

/**
 * Upserts agent settings for the current user's company.
 * Uses INSERT ON CONFLICT UPDATE via Supabase upsert.
 */
export function useUpdateAgentSettings() {
  const queryClient = useQueryClient();
  const { data: profile } = useUserProfile();

  return useMutation({
    mutationFn: async ({ agentType = 'global', settings }: UpdateSettingsInput) => {
      const companyId = profile?.company_id;
      if (!companyId) throw new Error('No company context');

      const { data, error } = await supabase
        .from('agent_settings')
        .upsert(
          {
            company_id: companyId,
            agent_type: agentType,
            settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'company_id,agent_type' }
        );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-settings'] });
      toast({
        title: 'Settings saved',
        description: 'Agent settings have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save agent settings.',
        variant: 'destructive',
      });
    },
  });
}
