/**
 * Zod schemas for GRC Analyst agent structured output.
 *
 * These schemas enforce NIST 800-171A methodology constraints:
 * - Assessment at the OBJECTIVE level (single failed objective = NOT MET)
 * - Evidence categorized by method (examine/interview/test)
 * - Remediation options ranked by cost_tier and effort_tier
 * - SSP sections organized by the 14 NIST 800-171 control families
 * - Compliance snapshots for time-series compliance tracking
 *
 * Used by the GRC Analyst Edge Function for typed, parseable JSON output.
 * Frontend-compatible re-exports live in src/lib/grc-schemas-frontend.ts.
 */
import { z } from "npm:zod@3";

// ---------- Enum schemas ----------

/** Finding status per NIST 800-171A: a control is fully MET, NOT_MET (any failed objective), or NOT_APPLICABLE */
export const FindingStatusSchema = z.enum(["MET", "NOT_MET", "NOT_APPLICABLE"]);
export type FindingStatus = z.infer<typeof FindingStatusSchema>;

/** Evidence collection method per 800-171A: examine docs, interview staff, test systems */
export const EvidenceMethodSchema = z.enum(["examine", "interview", "test"]);
export type EvidenceMethod = z.infer<typeof EvidenceMethodSchema>;

/** Cost and effort tiers for remediation option ranking */
export const CostEffortTierSchema = z.enum(["low", "medium", "high"]);
export type CostEffortTier = z.infer<typeof CostEffortTierSchema>;

// ---------- Component schemas ----------

/** An evidence gap identified during assessment */
export const EvidenceGapSchema = z.object({
  method: EvidenceMethodSchema,
  description: z.string().min(1),
});
export type EvidenceGap = z.infer<typeof EvidenceGapSchema>;

/** A remediation option with cost/effort ranking */
export const RemediationOptionSchema = z.object({
  option_id: z.string().min(1),
  description: z.string().min(1),
  cost_tier: CostEffortTierSchema,
  effort_tier: CostEffortTierSchema,
  timeline_days: z.number().int().positive(),
  priority_rank: z.number().int().positive(),
});
export type RemediationOption = z.infer<typeof RemediationOptionSchema>;

/** A finding for a single NIST 800-171 control */
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

/** Complete gap analysis report produced by the GRC agent */
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

/** Point-in-time compliance snapshot for time-series tracking */
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

/** SSP section for a single NIST 800-171 control family */
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

/** Input schema for executive summary generation (CISO consumption) */
export const ExecutiveSummaryInputSchema = z.array(
  z.object({
    task_id: z.string().uuid(),
    action: z.string().min(1),
    output: z.unknown(),
    completed_at: z.string(),
  })
);
export type ExecutiveSummaryInput = z.infer<typeof ExecutiveSummaryInputSchema>;
