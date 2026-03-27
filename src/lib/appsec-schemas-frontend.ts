/**
 * Frontend-compatible re-export of AppSec Zod schemas.
 *
 * The source of truth is supabase/functions/_shared/appsec-schemas.ts (Deno context,
 * uses npm:zod@3 specifier). This file mirrors those exact schema definitions
 * using the standard npm zod package for vitest and frontend consumption.
 *
 * Keep in sync: any changes to appsec-schemas.ts must be reflected here.
 */
import { z } from 'zod';

// ---------- Enum schemas ----------

/** AppSec severity levels */
export const AppSecSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type AppSecSeverity = z.infer<typeof AppSecSeveritySchema>;

/** Finding type categories for AppSec */
export const FindingTypeSchema = z.enum([
  'dependency_vulnerability',
  'config_misconfiguration',
  'hardcoded_secret',
  'deprecated_package',
]);
export type FindingType = z.infer<typeof FindingTypeSchema>;

// ---------- Component schemas ----------

/** A single dependency extracted from a manifest file */
export const ManifestDependencySchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  dep_type: z.enum(['runtime', 'dev']),
});
export type ManifestDependency = z.infer<typeof ManifestDependencySchema>;

/** A single AppSec finding (dependency vulnerability, config issue, etc.) */
export const AppSecFindingSchema = z.object({
  finding_type: FindingTypeSchema,
  severity: AppSecSeveritySchema,
  title: z.string().min(1),
  affected_component: z.string().min(1),
  fix_suggestion: z.string().min(1),
  fix_version: z.string().optional(),
  cve_id: z.string().optional(),
  cmmc_controls: z.array(z.string()),
});
export type AppSecFinding = z.infer<typeof AppSecFindingSchema>;

/** A configuration issue detected by CONFIG_SECURITY_RULES */
export const ConfigIssueSchema = z.object({
  rule_id: z.string().min(1),
  severity: AppSecSeveritySchema,
  description: z.string().min(1),
  file_path: z.string().min(1),
  line_number: z.number().int().optional(),
  fix_suggestion: z.string().min(1),
});
export type ConfigIssue = z.infer<typeof ConfigIssueSchema>;

// ---------- Top-level output schema ----------

/** Aggregated security review report (output of the AppSec agent) */
export const SecurityReviewReportSchema = z.object({
  findings: z.array(AppSecFindingSchema),
  config_issues: z.array(ConfigIssueSchema),
  summary: z.string().min(1),
  risk_score: z.number(),
  remediation_priority: z.array(z.string()),
});
export type SecurityReviewReport = z.infer<typeof SecurityReviewReportSchema>;
