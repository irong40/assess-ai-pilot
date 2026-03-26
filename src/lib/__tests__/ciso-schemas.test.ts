import { describe, it, expect } from 'vitest';

/**
 * Tests for CISO Orchestrator Zod schemas.
 * These schemas validate structured output from the CISO agent.
 *
 * NOTE: Schemas use npm:zod@3 in Deno Edge Functions.
 * For vitest, we re-export testable schema definitions from a shared location.
 * We import the schema shapes directly and validate them with local Zod.
 */
import { z } from 'zod';
import {
  ExecutiveSummarySchema,
  DelegationPlanSchema,
  RiskPostureSchema,
} from '../ciso-schemas';

describe('CISO Schemas', () => {
  describe('ExecutiveSummarySchema', () => {
    const validSummary = {
      overall_posture: 'at_risk',
      sprs_score: 75,
      sprs_trend: 'improving',
      critical_findings: [
        {
          control_id: '3.5.3',
          title: 'Multi-factor Authentication',
          impact: 'Critical control for CUI protection not implemented',
          urgency: 'immediate',
        },
      ],
      risk_areas: [
        {
          domain: 'Access Control',
          risk_level: 'high',
          finding_count: 5,
        },
      ],
      recommendations: [
        {
          priority: 1,
          description: 'Implement MFA for all CUI-accessing users',
          estimated_effort: 'medium',
        },
      ],
      next_steps: ['Deploy MFA solution', 'Conduct follow-up assessment'],
    };

    it('validates complete summary with all required fields', () => {
      const result = ExecutiveSummarySchema.safeParse(validSummary);
      expect(result.success).toBe(true);
    });

    it('rejects missing overall_posture', () => {
      const { overall_posture, ...incomplete } = validSummary;
      const result = ExecutiveSummarySchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects invalid posture enum value', () => {
      const result = ExecutiveSummarySchema.safeParse({
        ...validSummary,
        overall_posture: 'unknown',
      });
      expect(result.success).toBe(false);
    });

    it('validates all posture enum values', () => {
      for (const posture of ['critical', 'at_risk', 'progressing', 'compliant']) {
        const result = ExecutiveSummarySchema.safeParse({
          ...validSummary,
          overall_posture: posture,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('DelegationPlanSchema', () => {
    const validPlan = {
      planned_tasks: [
        {
          agent_type: 'grc-analyst',
          action: 'gap-analysis',
          scope: { control_family: 'AC', cmmc_level: 2 },
          priority: 'critical',
        },
      ],
      reasoning: 'Starting with Access Control family due to highest SPRS weight',
      estimated_completion_minutes: 30,
    };

    it('validates plan with tasks and reasoning', () => {
      const result = DelegationPlanSchema.safeParse(validPlan);
      expect(result.success).toBe(true);
    });

    it('validates all priority enum values', () => {
      for (const priority of ['critical', 'high', 'medium', 'low']) {
        const result = DelegationPlanSchema.safeParse({
          ...validPlan,
          planned_tasks: [{ ...validPlan.planned_tasks[0], priority }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects plan without reasoning', () => {
      const { reasoning, ...incomplete } = validPlan;
      const result = DelegationPlanSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  describe('RiskPostureSchema', () => {
    const validPosture = {
      overall_risk_level: 'medium',
      sprs_score: 85,
      poam_eligible: true,
      domain_risks: [
        {
          family_id: 'AC',
          family_name: 'Access Control',
          risk_level: 'high',
          not_met_count: 3,
        },
      ],
      top_findings: [
        {
          control_id: '3.1.1',
          title: 'Authorized Access Control',
          sprs_weight: 5,
          impact: 'Users may access CUI without proper authorization',
        },
      ],
      trend: 'improving',
    };

    it('validates posture with domain risks and trend', () => {
      const result = RiskPostureSchema.safeParse(validPosture);
      expect(result.success).toBe(true);
    });

    it('validates all trend enum values', () => {
      for (const trend of ['improving', 'stable', 'declining']) {
        const result = RiskPostureSchema.safeParse({
          ...validPosture,
          trend,
        });
        expect(result.success).toBe(true);
      }
    });

    it('validates all risk level enum values', () => {
      for (const level of ['critical', 'high', 'medium', 'low']) {
        const result = RiskPostureSchema.safeParse({
          ...validPosture,
          overall_risk_level: level,
        });
        expect(result.success).toBe(true);
      }
    });
  });
});
