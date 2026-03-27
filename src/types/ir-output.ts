/**
 * Frontend TypeScript types for Incident Response agent output.
 *
 * These plain interfaces mirror the Zod schemas in ir-schemas.ts for frontend
 * consumption without a Zod dependency. Use these for component props, React Query
 * return types, and display logic.
 *
 * Source of truth: supabase/functions/_shared/ir-schemas.ts (Zod schemas)
 */

/** Incident type categories from NIST SP 800-61r2 */
export type IncidentType =
  | 'malware'
  | 'unauthorized_access'
  | 'denial_of_service'
  | 'data_breach'
  | 'insider_threat'
  | 'supply_chain'
  | 'misconfiguration'
  | 'policy_violation'
  | 'unknown';

/** IR severity levels */
export type IrSeverity = 'critical' | 'high' | 'medium' | 'low';

/** IR incident lifecycle status */
export type IrIncidentStatus =
  | 'open'
  | 'investigating'
  | 'contained'
  | 'eradicated'
  | 'recovered'
  | 'closed';

/** A single step in a containment recommendation */
export interface ContainmentStep {
  phase: 'detect' | 'contain' | 'eradicate' | 'recover';
  order: number;
  action: string;
  rationale: string;
  requires_approval: true;
  estimated_time?: string;
  affected_systems?: string[];
}

/** Containment recommendation produced by the IR agent */
export interface ContainmentRecommendation {
  incident_type: IncidentType;
  severity: IrSeverity;
  containment_strategy: 'short_term' | 'long_term' | 'both';
  steps: ContainmentStep[];
  cmmc_controls_affected: string[];
  compliance_impact: string;
}

/** Playbook guidance with ordered steps per NIST phase */
export interface PlaybookGuidance {
  incident_type: IncidentType;
  title: string;
  phases: Array<{
    phase: 'detect' | 'contain' | 'eradicate' | 'recover';
    steps: Array<{
      order: number;
      action: string;
      requires_approval: true;
    }>;
  }>;
  estimated_duration?: string;
  cmmc_controls: string[];
}

/** Timeline event in a post-incident report */
export interface TimelineEvent {
  timestamp: string;
  event: string;
  actor: 'system' | 'agent' | 'human';
}

/** Compliance impact assessment from an incident */
export interface ComplianceImpact {
  affected_controls: string[];
  sprs_impact: number;
  requires_poam_update: boolean;
}

/** Recommendation from post-incident analysis */
export interface IrRecommendation {
  action: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  cmmc_control?: string;
}

/** Post-incident report with timeline, root cause, and compliance impact */
export interface PostIncidentReport {
  incident_id: string;
  incident_type: IncidentType;
  severity: IrSeverity;
  timeline: TimelineEvent[];
  detection_method: string;
  containment_actions: string[];
  eradication_actions: string[];
  recovery_actions: string[];
  root_cause_analysis: string;
  lessons_learned: string[];
  compliance_impact: ComplianceImpact;
  recommendations: IrRecommendation[];
}

/** IR incident database record */
export interface IrIncident {
  id: string;
  company_id: string;
  agent_task_id: string | null;
  soc_alert_id: string | null;
  incident_type: IncidentType;
  severity: IrSeverity;
  title: string;
  description: string | null;
  status: IrIncidentStatus;
  containment_plan: ContainmentRecommendation | null;
  playbook: PlaybookGuidance | null;
  post_incident_report: PostIncidentReport | null;
  compliance_impact: ComplianceImpact | null;
  created_at: string;
  updated_at: string;
}

/** Aggregated IR analysis result (output of the IR agent) */
export interface IrAnalysisResult {
  action: string;
  incident_id?: string;
  containment?: ContainmentRecommendation;
  playbook?: PlaybookGuidance;
  post_incident_report?: PostIncidentReport;
}
