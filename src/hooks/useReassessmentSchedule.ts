/**
 * TanStack Query hooks for reassessment schedule management.
 *
 * Provides:
 * - useReassessmentSchedule: fetches current company's schedule
 * - useUpdateReassessmentSchedule: upserts schedule configuration
 *
 * Usage:
 *   import { useReassessmentSchedule, useUpdateReassessmentSchedule } from '@/hooks/useReassessmentSchedule';
 *   const { data: schedule } = useReassessmentSchedule();
 *   const { mutate: updateSchedule } = useUpdateReassessmentSchedule();
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReassessmentSchedule {
  id: string;
  company_id?: string;
  cmmc_level: number;
  cron_expression: string;
  frequency_label: string;
  enabled: boolean;
  last_run_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleUpdatePayload {
  cmmc_level: number;
  cron_expression: string;
  frequency_label: string;
  enabled: boolean;
}

/**
 * Fetches the reassessment schedule for the current user's company.
 * Returns a single schedule row or null if none configured.
 */
export function useReassessmentSchedule() {
  return useQuery({
    queryKey: ['reassessment-schedule'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reassessment_schedules')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        // No rows is valid -- company has no schedule yet
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as ReassessmentSchedule;
    },
  });
}

/**
 * Upserts the reassessment schedule for the current company.
 *
 * On success: invalidates ['reassessment-schedule'] query.
 * On error: shows toast with error message.
 */
export function useUpdateReassessmentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ScheduleUpdatePayload) => {
      const { data, error } = await supabase
        .from('reassessment_schedules')
        .upsert(
          {
            cmmc_level: payload.cmmc_level,
            cron_expression: payload.cron_expression,
            frequency_label: payload.frequency_label,
            enabled: payload.enabled,
          },
          { onConflict: 'company_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as ReassessmentSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reassessment-schedule'] });
      toast.success('Reassessment schedule updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });
}
