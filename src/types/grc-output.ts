/**
 * Frontend TypeScript types for GRC Analyst agent output.
 *
 * These plain interfaces mirror the Zod schemas in grc-schemas.ts for frontend
 * consumption without a Zod dependency. Use these for component props, React Query
 * return types, and display logic.
 *
 * Source of truth: supabase/functions/_shared/grc-schemas.ts (Zod schemas)
 */

/** Finding status per NIST 800-171A */
export type FindingStatus = 'MET' | 'NOT_MET' | 'NOT_APPLICABLE';

/** Evidence collection method per NIST 800-171A */
export type EvidenceMethod = 'examine' | 'interview' | 'test';

/** Cost and effort tier for remediation ranking */
export type CostEffortTier = 'low' | 'medium' | 'high';

/** An evidence gap identified during assessment */
export interface EvidenceGap {
  method: EvidenceMethod;
  description: string;
}

/** A remediation option with cost/effort ranking */
export interface RemediationOption {
  option_id: string;
  description: string;
  cost_tier: CostEffortTier;
  effort_tier: CostEffortTier;
  timeline_days: number;
  priority_rank: number;
}

/** A finding for a single NIST 800-171 control */
export interface GapAnalysisFinding {
  control_id: string;
  control_title: string;
  family_id: string;
  family_name: string;
  status: FindingStatus;
  failed_objectives: string[];
  evidence_gaps: EvidenceGap[];
  remediation_options: RemediationOption[];
}

/** Complete gap analysis report produced by the GRC agent */
export interface GapAnalysisReport {
  assessment_date: string;
  cmmc_level: number;
  scope_family_id: string | null;
  sprs_score: number;
  total_controls: number;
  met_count: number;
  not_met_count: number;
  not_applicable_count: number;
  findings: GapAnalysisFinding[];
}

/** Point-in-time compliance snapshot for time-series tracking */
export interface ComplianceSnapshot {
  sprs_score: number;
  total_controls: number;
  met_count: number;
  not_met_count: number;
  not_applicable_count: number;
  cmmc_level: number;
  family_scores: Record<string, number>;
  critical_controls_met: boolean;
  poam_eligible: boolean;
}

/** SSP section for a single NIST 800-171 control family */
export interface AuditPackageSection {
  family_id: string;
  family_name: string;
  controls: Array<{
    control_id: string;
    title: string;
    status: FindingStatus;
    implementation_statement: string;
    evidence_references: string[];
  }>;
}
