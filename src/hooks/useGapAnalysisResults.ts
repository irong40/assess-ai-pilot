/**
 * TanStack Query hook for fetching the latest gap analysis results.
 *
 * Provides:
 * - useLatestGapAnalysis: returns the most recent GapAnalysisReport from gap_analysis_results
 *
 * Used by SSP and POA&M exporters to generate audit-ready documents.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GapAnalysisReport } from '@/types/grc-output';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useLatestGapAnalysis() {
  const { data: profile } = useUserProfile();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ['latest-gap-analysis', companyId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_analysis_results')
        .select('id, company_id, report, created_at')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No rows is valid (no analysis run yet)
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return (data?.report ?? null) as GapAnalysisReport | null;
    },
    enabled: !!companyId,
  });
}
