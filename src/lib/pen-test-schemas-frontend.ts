/**
 * Frontend-compatible re-export of Pen Test Zod schemas.
 *
 * The source of truth is supabase/functions/_shared/pen-test-schemas.ts (Deno context,
 * uses npm:zod@3 specifier). This file mirrors those exact schema definitions
 * using the standard npm zod package for vitest and frontend consumption.
 *
 * Keep in sync: any changes to pen-test-schemas.ts must be reflected here.
 */
import { z } from 'zod';

// ---------- Enum schemas ----------

/** Pen Test finding type categories */
export const PenTestFindingTypeSchema = z.enum([
  'known_cve',
  'version_mismatch',
  'eol_software',
  'missing_patch',
]);
export type PenTestFindingType = z.infer<typeof PenTestFindingTypeSchema>;

/** Risk rating levels */
export const RiskRatingSchema = z.enum(['critical', 'high', 'medium', 'low']);
export type RiskRating = z.infer<typeof RiskRatingSchema>;

/** Finding lifecycle status */
export const FindingStatusSchema = z.enum([
  'open',
  'remediated',
  'accepted_risk',
  'false_positive',
]);
export type FindingStatus = z.infer<typeof FindingStatusSchema>;

/** Scan scope (always passive_only for this agent) */
export const ScanScopeSchema = z.enum(['passive_only']);
export type ScanScope = z.infer<typeof ScanScopeSchema>;

// ---------- Component schemas ----------

/** A single Pen Test finding */
export const PenTestFindingSchema = z.object({
  finding_type: PenTestFindingTypeSchema,
  risk_rating: RiskRatingSchema,
  title: z.string().min(1),
  affected_technology: z.string().min(1),
  matched_cve_ids: z.array(z.string()),
  exploitability_score: z.number().optional(),
  business_impact: z.string().min(1),
  remediation: z.string().min(1),
  cmmc_controls: z.array(z.string()),
  status: FindingStatusSchema,
});
export type PenTestFinding = z.infer<typeof PenTestFindingSchema>;

// ---------- Top-level output schema ----------

/** Aggregated vulnerability report (output of the Pen Test agent) */
export const VulnerabilityReportSchema = z.object({
  findings: z.array(PenTestFindingSchema),
  summary: z.string().min(1),
  overall_risk_rating: RiskRatingSchema,
  scan_scope: ScanScopeSchema,
  authorization_reference: z.string().min(1),
  recommendations: z.array(z.string()),
});
export type VulnerabilityReport = z.infer<typeof VulnerabilityReportSchema>;

// ---------- Authorization schema ----------

/** Result of the checkScanAuthorization gate */
export const AuthorizationResultSchema = z.object({
  authorized: z.boolean(),
  reason: z.string().optional(),
  scope: z.string().min(1),
  restrictions: z.array(z.string()),
});
export type AuthorizationResult = z.infer<typeof AuthorizationResultSchema>;
