/**
 * Frontend-compatible re-export of SOC Zod schemas.
 *
 * The source of truth is supabase/functions/_shared/soc-schemas.ts (Deno context,
 * uses npm:zod@3 specifier). This file mirrors those exact schema definitions
 * using the standard npm zod package for vitest and frontend consumption.
 *
 * Keep in sync: any changes to soc-schemas.ts must be reflected here.
 */
import { z } from 'zod';

// ---------- Enum schemas ----------

export const SocSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type SocSeverity = z.infer<typeof SocSeveritySchema>;

export const SocClassificationSchema = z.enum([
  'true_positive',
  'false_positive',
  'unclassified',
  'needs_investigation',
]);
export type SocClassification = z.infer<typeof SocClassificationSchema>;

export const SocEscalationStatusSchema = z.enum([
  'none',
  'needs_ir_review',
  'escalated_to_ciso',
  'resolved',
]);
export type SocEscalationStatus = z.infer<typeof SocEscalationStatusSchema>;

// ---------- Component schemas ----------

export const SocAlertSchema = z.object({
  external_cve_id: z.string().min(1),
  title: z.string().min(1),
  severity: SocSeveritySchema,
  cvss_score: z.number(),
  tech_stack_match: z.boolean(),
  relevance_score: z.number().int().min(0).max(100),
  classification: SocClassificationSchema,
  classification_reasoning: z.string().nullable(),
  escalation_status: SocEscalationStatusSchema,
  affected_controls: z.array(z.string()),
});
export type SocAlert = z.infer<typeof SocAlertSchema>;

// ---------- Top-level output schemas ----------

export const SocTriageResultSchema = z.object({
  alerts: z.array(SocAlertSchema),
  total_triaged: z.number().int().nonnegative(),
  company_tech_stack: z.array(z.string()),
  triage_summary: z.string().min(1),
});
export type SocTriageResult = z.infer<typeof SocTriageResultSchema>;

export const SocCorrelationSchema = z.object({
  alert_id: z.string().min(1),
  correlated_findings: z.array(
    z.object({
      source: z.string().min(1),
      finding_id: z.string().min(1),
      relevance: z.string().min(1),
    })
  ),
  correlation_summary: z.string().min(1),
});
export type SocCorrelation = z.infer<typeof SocCorrelationSchema>;
