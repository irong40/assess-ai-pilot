/**
 * Zod schemas for SOC Analyst agent structured output.
 *
 * These schemas enforce SOC triage methodology constraints:
 * - Alert classification with reasoning chains
 * - CVE triage with tech stack relevance scoring
 * - Cross-source correlation linking alerts to findings
 * - Escalation status tracking for CISO routing
 *
 * Used by the SOC Analyst Edge Function for typed, parseable JSON output.
 * Frontend-compatible re-exports live in src/lib/soc-schemas-frontend.ts.
 */
import { z } from "npm:zod@3";

// ---------- Enum schemas ----------

/** Alert severity levels (aligned with CVSS severity ratings) */
export const SocSeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export type SocSeverity = z.infer<typeof SocSeveritySchema>;

/** Alert classification after triage analysis */
export const SocClassificationSchema = z.enum([
  "true_positive",
  "false_positive",
  "unclassified",
  "needs_investigation",
]);
export type SocClassification = z.infer<typeof SocClassificationSchema>;

/** Escalation status for routing through CISO Orchestrator */
export const SocEscalationStatusSchema = z.enum([
  "none",
  "needs_ir_review",
  "escalated_to_ciso",
  "resolved",
]);
export type SocEscalationStatus = z.infer<typeof SocEscalationStatusSchema>;

// ---------- Component schemas ----------

/** A single triaged SOC alert derived from CVE analysis */
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

/** Complete triage result produced by the SOC agent */
export const SocTriageResultSchema = z.object({
  alerts: z.array(SocAlertSchema),
  total_triaged: z.number().int().nonnegative(),
  company_tech_stack: z.array(z.string()),
  triage_summary: z.string().min(1),
});
export type SocTriageResult = z.infer<typeof SocTriageResultSchema>;

/** Cross-source correlation linking an alert to related findings */
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
