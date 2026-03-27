/**
 * Frontend-compatible re-export of Threat Intel Zod schemas.
 *
 * The source of truth is supabase/functions/_shared/threat-intel-schemas.ts (Deno context,
 * uses npm:zod@3 specifier). This file mirrors those exact schema definitions
 * using the standard npm zod package for vitest and frontend consumption.
 *
 * Keep in sync: any changes to threat-intel-schemas.ts must be reflected here.
 */
import { z } from 'zod';

// ---------- Enum schemas ----------

export const IndicatorTypeSchema = z.enum(['ip', 'domain', 'hash', 'url', 'email']);
export type IndicatorType = z.infer<typeof IndicatorTypeSchema>;

export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const ThreatRiskLevelSchema = z.enum(['critical', 'high', 'medium', 'low']);
export type ThreatRiskLevel = z.infer<typeof ThreatRiskLevelSchema>;

// ---------- Component schemas ----------

export const AffectedControlSchema = z.object({
  control_id: z.string().min(1),
  family_id: z.string().min(1),
  threat_description: z.string().min(1),
  risk_level: ThreatRiskLevelSchema,
});

export const ThreatBriefSchema = z.object({
  title: z.string().min(1),
  executive_summary: z.string().min(1),
  threat_count: z.number().int().nonnegative(),
  affected_controls: z.array(AffectedControlSchema),
  generated_at: z.string().min(1),
});
export type ThreatBrief = z.infer<typeof ThreatBriefSchema>;

export const IocEntrySchema = z.object({
  indicator_type: IndicatorTypeSchema,
  indicator_value: z.string().min(1),
  confidence_level: ConfidenceLevelSchema,
  source_cve: z.string().optional(),
  is_active: z.boolean(),
});
export type IocEntry = z.infer<typeof IocEntrySchema>;

export const ActiveThreatSchema = z.object({
  cve_id: z.string().min(1),
  severity: z.string().min(1),
  affected_component: z.string().min(1),
});

export const AttackSurfaceSchema = z.object({
  tech_stack: z.array(z.string()),
  not_met_controls: z.array(z.string()),
  active_threats: z.array(ActiveThreatSchema),
  risk_score: z.number().int().min(0).max(100),
});
export type AttackSurface = z.infer<typeof AttackSurfaceSchema>;

// ---------- Top-level output schemas ----------

export const ThreatAnalysisResultSchema = z.object({
  briefs: z.array(ThreatBriefSchema),
  iocs: z.array(IocEntrySchema),
  attack_surface: AttackSurfaceSchema.optional(),
  analysis_summary: z.string().min(1),
});
export type ThreatAnalysisResult = z.infer<typeof ThreatAnalysisResultSchema>;
