/**
 * TanStack Query hooks for evidence management CRUD and completeness tracking.
 *
 * Provides:
 * - useControlEvidence: list evidence records, optionally filtered by control_id
 * - useAddControlEvidence: insert a control_evidence row (ON CONFLICT DO NOTHING)
 * - useRemoveControlEvidence: delete evidence by id
 * - useEvidenceCompleteness: per-family completeness ratio
 * - useControlEvidenceMatrix: flat evidence array for matrix table/export
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/hooks/use-toast';
import { NIST_FAMILIES } from '@/lib/compliance-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ControlEvidenceRow {
  id: string;
  company_id: string;
  control_id: string;
  document_id: string;
  document_name: string;
  evidence_type: 'examine' | 'interview' | 'test';
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface EvidenceCompletenessRow {
  familyId: string;
  familyName: string;
  controlsWithEvidence: number;
  totalControls: number;
  percentage: number;
}

export interface EvidenceMatrixRow {
  control_id: string;
  control_title: string;
  family_id: string;
  document_name: string;
  evidence_type: string;
  uploaded_at: string;
  notes: string | null;
}

export interface AddEvidenceInput {
  company_id: string;
  control_id: string;
  document_id: string;
  document_name: string;
  evidence_type: 'examine' | 'interview' | 'test';
  notes?: string;
  uploaded_by?: string;
}

// ---------------------------------------------------------------------------
// useControlEvidence -- list evidence, optionally filtered by control
// ---------------------------------------------------------------------------
export function useControlEvidence(controlId?: string) {
  const { data: profile } = useUserProfile();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ['control-evidence', companyId, controlId] as const,
    queryFn: async () => {
      let query = supabase
        .from('control_evidence' as string)
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });

      if (controlId) {
        query = query.eq('control_id', controlId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ControlEvidenceRow[];
    },
    enabled: !!companyId,
  });
}

// ---------------------------------------------------------------------------
// useAddControlEvidence -- insert with ON CONFLICT DO NOTHING semantics
// ---------------------------------------------------------------------------
export function useAddControlEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddEvidenceInput) => {
      const { data, error } = await supabase
        .from('control_evidence' as string)
        .insert({
          company_id: input.company_id,
          control_id: input.control_id,
          document_id: input.document_id,
          document_name: input.document_name,
          evidence_type: input.evidence_type,
          notes: input.notes ?? null,
          uploaded_by: input.uploaded_by ?? null,
        } as Record<string, unknown>)
        .select()
        .single();

      if (error) {
        // UNIQUE violation = duplicate, treat as no-op
        if (error.code === '23505') return null;
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-evidence'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-completeness'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-matrix'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to add evidence',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useRemoveControlEvidence -- delete by id
// ---------------------------------------------------------------------------
export function useRemoveControlEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evidenceId: string) => {
      const { error } = await supabase
        .from('control_evidence' as string)
        .delete()
        .eq('id', evidenceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-evidence'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-completeness'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-matrix'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to remove evidence',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useEvidenceCompleteness -- per-family completeness ratio
// ---------------------------------------------------------------------------
export function useEvidenceCompleteness() {
  const { data: profile } = useUserProfile();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ['evidence-completeness', companyId] as const,
    queryFn: async () => {
      // Fetch all controls
      const { data: controls, error: controlsErr } = await supabase
        .from('controls')
        .select('control_id, title, family');

      if (controlsErr) throw controlsErr;

      // Fetch all evidence for the company
      const { data: evidence, error: evidenceErr } = await supabase
        .from('control_evidence' as string)
        .select('control_id')
        .eq('company_id', companyId!);

      if (evidenceErr) throw evidenceErr;

      // Build set of controls that have evidence
      const controlsWithEvidenceSet = new Set(
        ((evidence ?? []) as Array<{ control_id: string }>).map((e) => e.control_id)
      );

      // Compute per-family completeness
      const controlsList = (controls ?? []) as Array<{
        control_id: string;
        title: string;
        family: string;
      }>;

      return NIST_FAMILIES.map((family) => {
        const familyControls = controlsList.filter(
          (c) => c.family === family.id
        );
        const withEvidence = familyControls.filter((c) =>
          controlsWithEvidenceSet.has(c.control_id)
        );
        const total = familyControls.length;
        const covered = withEvidence.length;
        return {
          familyId: family.id,
          familyName: family.name,
          controlsWithEvidence: covered,
          totalControls: total,
          percentage: total > 0 ? Math.round((covered / total) * 100) : 0,
        } as EvidenceCompletenessRow;
      });
    },
    enabled: !!companyId,
  });
}

// ---------------------------------------------------------------------------
// useControlEvidenceMatrix -- flat array for matrix table and export
// ---------------------------------------------------------------------------
export function useControlEvidenceMatrix() {
  const { data: profile } = useUserProfile();
  const companyId = profile?.company_id;

  return useQuery({
    queryKey: ['evidence-matrix', companyId] as const,
    queryFn: async () => {
      // Fetch evidence records
      const { data: evidence, error: evidenceErr } = await supabase
        .from('control_evidence' as string)
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });

      if (evidenceErr) throw evidenceErr;

      // Fetch controls for title and family lookup
      const { data: controls, error: controlsErr } = await supabase
        .from('controls')
        .select('control_id, title, family');

      if (controlsErr) throw controlsErr;

      const controlMap = new Map(
        ((controls ?? []) as Array<{
          control_id: string;
          title: string;
          family: string;
        }>).map((c) => [c.control_id, c])
      );

      return ((evidence ?? []) as unknown as ControlEvidenceRow[]).map(
        (ev) => {
          const ctrl = controlMap.get(ev.control_id);
          return {
            control_id: ev.control_id,
            control_title: ctrl?.title ?? 'Unknown Control',
            family_id: ctrl?.family ?? '',
            document_name: ev.document_name,
            evidence_type: ev.evidence_type,
            uploaded_at: ev.created_at.split('T')[0],
            notes: ev.notes,
          } as EvidenceMatrixRow;
        }
      );
    },
    enabled: !!companyId,
  });
}
