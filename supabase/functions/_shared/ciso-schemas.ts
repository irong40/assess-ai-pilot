/**
 * Zod schemas for CISO Orchestrator structured output.
 * Used in Supabase Edge Functions for runtime validation of CISO agent data.
 *
 * These schemas mirror the Node-compatible versions in src/lib/ciso-schemas.ts
 * but use Deno's npm: specifier for Zod.
 *
 * Schemas validate:
 * - ExecutiveSummary: overall compliance posture, findings, recommendations
 * - DelegationPlan: planned tasks for specialist agents
 * - RiskPosture: domain-level risk assessment with trends
 */
import { z } from "npm:zod@3";

// --------------------------------------------------------------------------
// ExecutiveSummarySchema
// --------------------------------------------------------------------------
export const ExecutiveSummarySchema = z.object({
  overall_posture: z.enum([
    "critical",
    "at_risk",
    "progressing",
    "compliant",
  ]),
  sprs_score: z.number(),
  sprs_trend: z.enum(["improving", "stable", "declining"]),
  critical_findings: z.array(
    z.object({
      control_id: z.string(),
      title: z.string(),
      impact: z.string(),
      urgency: z.enum(["immediate", "short_term", "medium_term"]),
    })
  ),
  risk_areas: z.array(
    z.object({
      domain: z.string(),
      risk_level: z.enum(["critical", "high", "medium", "low"]),
      finding_count: z.number().int().min(0),
    })
  ),
  recommendations: z.array(
    z.object({
      priority: z.number().int().min(1),
      description: z.string(),
      estimated_effort: z.enum(["low", "medium", "high"]),
    })
  ),
  next_steps: z.array(z.string()),
});
export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>;

// --------------------------------------------------------------------------
// DelegationPlanSchema
// --------------------------------------------------------------------------
export const DelegationPlanSchema = z.object({
  planned_tasks: z.array(
    z.object({
      agent_type: z.string(),
      action: z.string(),
      scope: z.record(z.unknown()),
      priority: z.enum(["critical", "high", "medium", "low"]),
    })
  ),
  reasoning: z.string(),
  estimated_completion_minutes: z.number().min(0),
});
export type DelegationPlan = z.infer<typeof DelegationPlanSchema>;

// --------------------------------------------------------------------------
// RiskPostureSchema
// --------------------------------------------------------------------------
export const RiskPostureSchema = z.object({
  overall_risk_level: z.enum(["critical", "high", "medium", "low"]),
  sprs_score: z.number(),
  poam_eligible: z.boolean(),
  domain_risks: z.array(
    z.object({
      family_id: z.string(),
      family_name: z.string(),
      risk_level: z.enum(["critical", "high", "medium", "low"]),
      not_met_count: z.number().int().min(0),
    })
  ),
  top_findings: z.array(
    z.object({
      control_id: z.string(),
      title: z.string(),
      sprs_weight: z.number(),
      impact: z.string(),
    })
  ),
  trend: z.enum(["improving", "stable", "declining"]),
});
export type RiskPosture = z.infer<typeof RiskPostureSchema>;
