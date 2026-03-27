/**
 * Frontend TypeScript types for SOC Analyst agent output.
 *
 * These plain interfaces mirror the Zod schemas in soc-schemas.ts for frontend
 * consumption without a Zod dependency. Use these for component props, React Query
 * return types, and display logic.
 *
 * Source of truth: supabase/functions/_shared/soc-schemas.ts (Zod schemas)
 */

/** Alert severity levels (aligned with CVSS severity ratings) */
export type SocSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Alert classification after triage analysis */
export type SocClassification =
  | 'true_positive'
  | 'false_positive'
  | 'unclassified'
  | 'needs_investigation';

/** Escalation status for routing through CISO Orchestrator */
export type SocEscalationStatus =
  | 'none'
  | 'needs_ir_review'
  | 'escalated_to_ciso'
  | 'resolved';

/** A single triaged SOC alert derived from CVE analysis */
export interface SocAlert {
  external_cve_id: string;
  title: string;
  severity: SocSeverity;
  cvss_score: number;
  tech_stack_match: boolean;
  relevance_score: number;
  classification: SocClassification;
  classification_reasoning: string | null;
  escalation_status: SocEscalationStatus;
  affected_controls: string[];
}

/** Complete triage result produced by the SOC agent */
export interface SocTriageResult {
  alerts: SocAlert[];
  total_triaged: number;
  company_tech_stack: string[];
  triage_summary: string;
}

/** Cross-source correlation linking an alert to related findings */
export interface SocCorrelation {
  alert_id: string;
  correlated_findings: Array<{
    source: string;
    finding_id: string;
    relevance: string;
  }>;
  correlation_summary: string;
}
