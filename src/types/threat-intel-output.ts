/**
 * Frontend TypeScript types for Threat Intelligence agent output.
 *
 * These plain interfaces mirror the Zod schemas in threat-intel-schemas.ts for frontend
 * consumption without a Zod dependency. Use these for component props, React Query
 * return types, and display logic.
 *
 * Source of truth: supabase/functions/_shared/threat-intel-schemas.ts (Zod schemas)
 */

/** Indicator types for IOC tracking */
export type IndicatorType = 'ip' | 'domain' | 'hash' | 'url' | 'email';

/** Confidence levels for IOC entries */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Risk levels for affected controls */
export type ThreatRiskLevel = 'critical' | 'high' | 'medium' | 'low';

/** Affected control entry within a threat brief */
export interface AffectedControl {
  control_id: string;
  family_id: string;
  threat_description: string;
  risk_level: ThreatRiskLevel;
}

/** A threat brief summarizing recent threats mapped to CMMC controls */
export interface ThreatBrief {
  title: string;
  executive_summary: string;
  threat_count: number;
  affected_controls: AffectedControl[];
  generated_at: string;
}

/** An indicator of compromise (IOC) entry with confidence and source */
export interface IocEntry {
  indicator_type: IndicatorType;
  indicator_value: string;
  confidence_level: ConfidenceLevel;
  source_cve?: string;
  is_active: boolean;
}

/** An active threat within the attack surface */
export interface ActiveThreat {
  cve_id: string;
  severity: string;
  affected_component: string;
}

/** Attack surface mapping combining tech stack, compliance gaps, and active threats */
export interface AttackSurface {
  tech_stack: string[];
  not_met_controls: string[];
  active_threats: ActiveThreat[];
  risk_score: number;
}

/** Complete threat analysis result produced by the Threat Intel agent */
export interface ThreatAnalysisResult {
  briefs: ThreatBrief[];
  iocs: IocEntry[];
  attack_surface?: AttackSurface;
  analysis_summary: string;
}
