/**
 * Frontend TypeScript types for AppSec Engineer agent output.
 *
 * These plain interfaces mirror the Zod schemas in appsec-schemas.ts for frontend
 * consumption without a Zod dependency. Use these for component props, React Query
 * return types, and display logic.
 *
 * Source of truth: supabase/functions/_shared/appsec-schemas.ts (Zod schemas)
 */

/** AppSec severity levels */
export type AppSecSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Finding type categories for AppSec */
export type FindingType =
  | 'dependency_vulnerability'
  | 'config_misconfiguration'
  | 'hardcoded_secret'
  | 'deprecated_package';

/** AppSec finding lifecycle status */
export type AppSecFindingStatus =
  | 'open'
  | 'fixed'
  | 'accepted_risk'
  | 'false_positive';

/** A single dependency extracted from a manifest file */
export interface ManifestDependency {
  name: string;
  version: string;
  dep_type: 'runtime' | 'dev';
}

/** A single AppSec finding (dependency vulnerability, config issue, etc.) */
export interface AppSecFinding {
  finding_type: FindingType;
  severity: AppSecSeverity;
  title: string;
  affected_component: string;
  fix_suggestion: string;
  fix_version?: string;
  cve_id?: string;
  cmmc_controls: string[];
}

/** A configuration issue detected by CONFIG_SECURITY_RULES */
export interface ConfigIssue {
  rule_id: string;
  severity: AppSecSeverity;
  description: string;
  file_path: string;
  line_number?: number;
  fix_suggestion: string;
}

/** Aggregated security review report (output of the AppSec agent) */
export interface SecurityReviewReport {
  findings: AppSecFinding[];
  config_issues: ConfigIssue[];
  summary: string;
  risk_score: number;
  remediation_priority: string[];
}

/** AppSec finding database record */
export interface AppSecFindingRecord {
  id: string;
  company_id: string;
  agent_task_id: string | null;
  finding_type: FindingType;
  severity: AppSecSeverity;
  title: string;
  affected_component: string;
  fix_suggestion: string;
  fix_version: string | null;
  cve_id: string | null;
  cmmc_controls: string[];
  status: AppSecFindingStatus;
  created_at: string;
  updated_at: string;
}
