/**
 * Frontend-compatible re-export of GRC Zod schemas.
 *
 * The source of truth is supabase/functions/_shared/grc-schemas.ts (Deno context,
 * uses npm:zod@3 specifier). This file mirrors those exact schema definitions
 * using the standard npm zod package for vitest and frontend consumption.
 *
 * Keep in sync: any changes to grc-schemas.ts must be reflected here.
 */
import { z } from 'zod';

// ---------- Enum schemas ----------

export const FindingStatusSchema = z.enum(['MET', 'NOT_MET', 'NOT_APPLICABLE']);
export type FindingStatus = z.infer<typeof FindingStatusSchema>;

export const EvidenceMethodSchema = z.enum(['examine', 'interview', 'test']);
export type EvidenceMethod = z.infer<typeof EvidenceMethodSchema>;

export const CostEffortTierSchema = z.enum(['low', 'medium', 'high']);
export type CostEffortTier = z.infer<typeof CostEffortTierSchema>;

// ---------- Component schemas ----------

export const EvidenceGapSchema = z.object({
  method: EvidenceMethodSchema,
  description: z.string().min(1),
});
export type EvidenceGap = z.infer<typeof EvidenceGapSchema>;

export const RemediationOptionSchema = z.object({
  option_id: z.string().min(1),
  description: z.string().min(1),
  cost_tier: CostEffortTierSchema,
  effort_tier: CostEffortTierSchema,
  timeline_days: z.number().int().positive(),
  priority_rank: z.number().int().positive(),
});
export type RemediationOption = z.infer<typeof RemediationOptionSchema>;

export const FindingSchema = z.object({
  control_id: z.string().min(1),
  control_title: z.string().min(1),
  family_id: z.string().min(1),
  family_name: z.string().min(1),
  status: FindingStatusSchema,
  failed_objectives: z.array(z.string()),
  evidence_gaps: z.array(EvidenceGapSchema),
  remediation_options: z.array(RemediationOptionSchema),
});
export type Finding = z.infer<typeof FindingSchema>;

// ---------- Top-level output schemas ----------

export const GapAnalysisReportSchema = z.object({
  assessment_date: z.string().min(1),
  cmmc_level: z.number().int().min(1).max(2),
  scope_family_id: z.string().nullable(),
  sprs_score: z.number().int(),
  total_controls: z.number().int().nonnegative(),
  met_count: z.number().int().nonnegative(),
  not_met_count: z.number().int().nonnegative(),
  not_applicable_count: z.number().int().nonnegative(),
  findings: z.array(FindingSchema),
});
export type GapAnalysisReport = z.infer<typeof GapAnalysisReportSchema>;

export const ComplianceSnapshotSchema = z.object({
  sprs_score: z.number().int(),
  total_controls: z.number().int().nonnegative(),
  met_count: z.number().int().nonnegative(),
  not_met_count: z.number().int().nonnegative(),
  not_applicable_count: z.number().int().nonnegative(),
  cmmc_level: z.number().int().min(1).max(2),
  family_scores: z.record(z.string(), z.number()),
  critical_controls_met: z.boolean(),
  poam_eligible: z.boolean(),
});
export type ComplianceSnapshot = z.infer<typeof ComplianceSnapshotSchema>;

export const AuditPackageSectionSchema = z.object({
  family_id: z.string().min(1),
  family_name: z.string().min(1),
  controls: z.array(
    z.object({
      control_id: z.string().min(1),
      title: z.string().min(1),
      status: FindingStatusSchema,
      implementation_statement: z.string(),
      evidence_references: z.array(z.string()),
    })
  ),
});
export type AuditPackageSection = z.infer<typeof AuditPackageSectionSchema>;

export const ExecutiveSummaryInputSchema = z.array(
  z.object({
    task_id: z.string().uuid(),
    action: z.string().min(1),
    output: z.unknown(),
    completed_at: z.string(),
  })
);
export type ExecutiveSummaryInput = z.infer<typeof ExecutiveSummaryInputSchema>;
