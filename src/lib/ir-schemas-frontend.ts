/**
 * Frontend-compatible re-export of IR Zod schemas.
 *
 * The source of truth is supabase/functions/_shared/ir-schemas.ts (Deno context,
 * uses npm:zod@3 specifier). This file mirrors those exact schema definitions
 * using the standard npm zod package for vitest and frontend consumption.
 *
 * Keep in sync: any changes to ir-schemas.ts must be reflected here.
 */
import { z } from 'zod';

// ---------- Enum schemas ----------

/** Incident type categories from NIST SP 800-61r2 */
export const IncidentTypeSchema = z.enum([
  'malware',
  'unauthorized_access',
  'denial_of_service',
  'data_breach',
  'insider_threat',
  'supply_chain',
  'misconfiguration',
  'policy_violation',
  'unknown',
]);
export type IncidentType = z.infer<typeof IncidentTypeSchema>;

/** IR severity levels */
export const IrSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type IrSeverity = z.infer<typeof IrSeveritySchema>;

// ---------- Component schemas ----------

/** A single containment recommendation with mandatory approval */
export const ContainmentRecommendationSchema = z.object({
  incident_type: IncidentTypeSchema,
  severity: IrSeveritySchema,
  containment_strategy: z.enum(['short_term', 'long_term', 'both']),
  steps: z.array(
    z.object({
      phase: z.enum(['detect', 'contain', 'eradicate', 'recover']),
      order: z.number().int().min(1),
      action: z.string().min(1),
      rationale: z.string().min(1),
      requires_approval: z.literal(true), // Always true for IR
      estimated_time: z.string().optional(),
      affected_systems: z.array(z.string()).optional(),
    })
  ),
  cmmc_controls_affected: z.array(z.string()),
  compliance_impact: z.string(),
});
export type ContainmentRecommendation = z.infer<typeof ContainmentRecommendationSchema>;

/** Playbook guidance with ordered steps per NIST phase */
export const PlaybookGuidanceSchema = z.object({
  incident_type: IncidentTypeSchema,
  title: z.string().min(1),
  phases: z.array(
    z.object({
      phase: z.enum(['detect', 'contain', 'eradicate', 'recover']),
      steps: z.array(
        z.object({
          order: z.number().int().min(1),
          action: z.string().min(1),
          requires_approval: z.literal(true),
        })
      ),
    })
  ),
  estimated_duration: z.string().optional(),
  cmmc_controls: z.array(z.string()),
});
export type PlaybookGuidance = z.infer<typeof PlaybookGuidanceSchema>;

/** Post-incident report with timeline, root cause, and compliance impact */
export const PostIncidentReportSchema = z.object({
  incident_id: z.string().uuid(),
  incident_type: IncidentTypeSchema,
  severity: IrSeveritySchema,
  timeline: z.array(
    z.object({
      timestamp: z.string(),
      event: z.string(),
      actor: z.enum(['system', 'agent', 'human']),
    })
  ),
  detection_method: z.string(),
  containment_actions: z.array(z.string()),
  eradication_actions: z.array(z.string()),
  recovery_actions: z.array(z.string()),
  root_cause_analysis: z.string(),
  lessons_learned: z.array(z.string()),
  compliance_impact: z.object({
    affected_controls: z.array(z.string()),
    sprs_impact: z.number().int(),
    requires_poam_update: z.boolean(),
  }),
  recommendations: z.array(
    z.object({
      action: z.string(),
      priority: z.enum(['immediate', 'short_term', 'long_term']),
      cmmc_control: z.string().optional(),
    })
  ),
});
export type PostIncidentReport = z.infer<typeof PostIncidentReportSchema>;

// ---------- Top-level output schema ----------

/** Aggregated IR analysis result (output of the IR agent) */
export const IrAnalysisResultSchema = z.object({
  action: z.string(),
  incident_id: z.string().optional(),
  containment: ContainmentRecommendationSchema.optional(),
  playbook: PlaybookGuidanceSchema.optional(),
  post_incident_report: PostIncidentReportSchema.optional(),
});
export type IrAnalysisResult = z.infer<typeof IrAnalysisResultSchema>;
