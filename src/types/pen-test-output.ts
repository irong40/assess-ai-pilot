/**
 * Frontend TypeScript types for Pen Test agent output.
 *
 * These plain interfaces mirror the Zod schemas in pen-test-schemas.ts for frontend
 * consumption without a Zod dependency. Use these for component props, React Query
 * return types, and display logic.
 *
 * Source of truth: supabase/functions/_shared/pen-test-schemas.ts (Zod schemas)
 */

/** Pen Test finding type categories */
export type PenTestFindingType =
  | 'known_cve'
  | 'version_mismatch'
  | 'eol_software'
  | 'missing_patch';

/** Risk rating levels */
export type RiskRating = 'critical' | 'high' | 'medium' | 'low';

/** Finding lifecycle status */
export type FindingStatus =
  | 'open'
  | 'remediated'
  | 'accepted_risk'
  | 'false_positive';

/** Scan scope (always passive_only for Pen Test agent) */
export type ScanScope = 'passive_only';

/** A single Pen Test finding */
export interface PenTestFinding {
  finding_type: PenTestFindingType;
  risk_rating: RiskRating;
  title: string;
  affected_technology: string;
  matched_cve_ids: string[];
  exploitability_score?: number;
  business_impact: string;
  remediation: string;
  cmmc_controls: string[];
  status: FindingStatus;
}

/** Aggregated vulnerability report (output of the Pen Test agent) */
export interface VulnerabilityReport {
  findings: PenTestFinding[];
  summary: string;
  overall_risk_rating: RiskRating;
  scan_scope: ScanScope;
  authorization_reference: string;
  recommendations: string[];
}

/** Result of the checkScanAuthorization gate */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  scope: string;
  restrictions: string[];
}

/** Pen Test finding database record */
export interface PenTestFindingRecord {
  id: string;
  company_id: string;
  agent_task_id: string | null;
  finding_type: PenTestFindingType;
  risk_rating: RiskRating;
  title: string;
  affected_technology: string;
  matched_cve_ids: string[];
  exploitability_score: number | null;
  business_impact: string;
  remediation: string;
  cmmc_controls: string[];
  scan_authorization_id: string | null;
  status: FindingStatus;
  created_at: string;
  updated_at: string;
}
