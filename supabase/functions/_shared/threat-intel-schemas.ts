/**
 * Zod schemas for Threat Intelligence agent structured output.
 *
 * These schemas enforce threat analysis methodology constraints:
 * - Threat briefs with affected CMMC controls and risk levels
 * - IOC tracking with indicator types and confidence levels
 * - Attack surface mapping combining tech stack, compliance gaps, and threats
 * - Complete analysis results aggregating briefs, IOCs, and surface mapping
 *
 * Used by the Threat Intel Edge Function for typed, parseable JSON output.
 * Frontend-compatible re-exports live in src/lib/threat-intel-schemas-frontend.ts.
 */
import { z } from "npm:zod@3";

// ---------- Enum schemas ----------

/** Indicator types for IOC tracking */
export const IndicatorTypeSchema = z.enum(["ip", "domain", "hash", "url", "email"]);
export type IndicatorType = z.infer<typeof IndicatorTypeSchema>;

/** Confidence levels for IOC entries */
export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

/** Risk levels for affected controls */
export const ThreatRiskLevelSchema = z.enum(["critical", "high", "medium", "low"]);
export type ThreatRiskLevel = z.infer<typeof ThreatRiskLevelSchema>;

// ---------- Component schemas ----------

/** Affected control entry within a threat brief */
export const AffectedControlSchema = z.object({
  control_id: z.string().min(1),
  family_id: z.string().min(1),
  threat_description: z.string().min(1),
  risk_level: ThreatRiskLevelSchema,
});

/** A threat brief summarizing recent threats mapped to CMMC controls */
export const ThreatBriefSchema = z.object({
  title: z.string().min(1),
  executive_summary: z.string().min(1),
  threat_count: z.number().int().nonnegative(),
  affected_controls: z.array(AffectedControlSchema),
  generated_at: z.string().min(1),
});
export type ThreatBrief = z.infer<typeof ThreatBriefSchema>;

/** An indicator of compromise (IOC) entry with confidence and source */
export const IocEntrySchema = z.object({
  indicator_type: IndicatorTypeSchema,
  indicator_value: z.string().min(1),
  confidence_level: ConfidenceLevelSchema,
  source_cve: z.string().optional(),
  is_active: z.boolean(),
});
export type IocEntry = z.infer<typeof IocEntrySchema>;

/** An active threat within the attack surface */
export const ActiveThreatSchema = z.object({
  cve_id: z.string().min(1),
  severity: z.string().min(1),
  affected_component: z.string().min(1),
});

/** Attack surface mapping combining tech stack, compliance gaps, and active threats */
export const AttackSurfaceSchema = z.object({
  tech_stack: z.array(z.string()),
  not_met_controls: z.array(z.string()),
  active_threats: z.array(ActiveThreatSchema),
  risk_score: z.number().int().min(0).max(100),
});
export type AttackSurface = z.infer<typeof AttackSurfaceSchema>;

// ---------- Top-level output schemas ----------

/** Complete threat analysis result produced by the Threat Intel agent */
export const ThreatAnalysisResultSchema = z.object({
  briefs: z.array(ThreatBriefSchema),
  iocs: z.array(IocEntrySchema),
  attack_surface: AttackSurfaceSchema.optional(),
  analysis_summary: z.string().min(1),
});
export type ThreatAnalysisResult = z.infer<typeof ThreatAnalysisResultSchema>;
