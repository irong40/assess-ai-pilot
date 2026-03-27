/**
 * TanStack Query hooks for compliance snapshot data.
 *
 * Provides:
 * - useComplianceSnapshots: time-series array from compliance_snapshots table
 * - useLatestExecutiveSummary: latest CISO executive summary from agent_tasks
 *
 * Usage:
 *   import { useComplianceSnapshots, useLatestExecutiveSummary } from '@/hooks/useComplianceSnapshots';
 *   const { data: snapshots, isLoading } = useComplianceSnapshots();
 *   const { data: summary } = useLatestExecutiveSummary();
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ComplianceSnapshot } from '@/types/grc-output';
import type { ExecutiveSummary } from '@/lib/ciso-schemas';

export interface SnapshotRow {
  id: string;
  sprs_score: number;
  met_count: number;
  not_met_count: number;
  total_controls: number;
  family_scores: Record<string, number>;
  created_at: string;
  cmmc_level?: number;
  not_applicable_count?: number;
  critical_controls_met?: boolean;
  poam_eligible?: boolean;
}

/**
 * Queries compliance_snapshots table for time-series data.
 *
 * Returns snapshots ordered by created_at ascending (oldest first)
 * so charts display a left-to-right timeline.
 *
 * @param limit - Maximum number of snapshots to fetch (default: 20)
 */
export function useComplianceSnapshots(limit = 20) {
  return useQuery({
    queryKey: ['compliance-snapshots', limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_snapshots')
        .select(
          'id, sprs_score, met_count, not_met_count, total_controls, family_scores, created_at, cmmc_level, not_applicable_count, critical_controls_met, poam_eligible'
        )
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as SnapshotRow[];
    },
  });
}

/**
 * Fetches the latest completed CISO executive summary from agent_tasks.
 *
 * Queries for the most recent completed task where
 * agent_type = 'ciso_orchestrator' and action = 'generate-executive-summary'.
 * Returns the `output` column parsed as ExecutiveSummary.
 */
export function useLatestExecutiveSummary() {
  return useQuery({
    queryKey: ['latest-executive-summary'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('id, output, completed_at')
        .eq('agent_type', 'ciso_orchestrator')
        .eq('action', 'generate-executive-summary')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No rows is a valid state (no summary yet)
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return (data?.output ?? null) as ExecutiveSummary | null;
    },
  });
}
