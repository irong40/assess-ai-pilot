import { describe, it, expect } from 'vitest';

/**
 * SOC Analyst Zod Schema validation tests.
 *
 * Tests the structured output schemas used by the SOC Analyst agent for
 * CVE triage output, alert classification, and cross-source correlation.
 *
 * NOTE: Imports from the frontend-compatible re-export (standard npm zod).
 * Source of truth: supabase/functions/_shared/soc-schemas.ts (Deno context).
 */
import {
  SocAlertSchema,
  SocTriageResultSchema,
  SocCorrelationSchema,
} from '../soc-schemas-frontend';

describe('SOC Zod Schemas', () => {
  describe('SocAlertSchema', () => {
    const validAlert = {
      external_cve_id: 'CVE-2026-1234',
      title: 'Remote code execution in Apache Struts',
      severity: 'critical',
      cvss_score: 9.8,
      tech_stack_match: true,
      relevance_score: 95,
      classification: 'true_positive',
      classification_reasoning: 'CVE affects Apache Struts which is in company tech stack. No compensating controls. CVSS 9.8 indicates critical remote code execution.',
      escalation_status: 'needs_ir_review',
      affected_controls: ['SI', 'SC'],
    };

    it('accepts valid complete alert', () => {
      const result = SocAlertSchema.safeParse(validAlert);
      expect(result.success).toBe(true);
    });

    it('requires severity to be critical/high/medium/low', () => {
      expect(SocAlertSchema.safeParse({ ...validAlert, severity: 'critical' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, severity: 'high' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, severity: 'medium' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, severity: 'low' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, severity: 'info' }).success).toBe(false);
      expect(SocAlertSchema.safeParse({ ...validAlert, severity: 'CRITICAL' }).success).toBe(false);
    });

    it('requires classification to be true_positive/false_positive/unclassified/needs_investigation', () => {
      expect(SocAlertSchema.safeParse({ ...validAlert, classification: 'true_positive' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, classification: 'false_positive' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, classification: 'unclassified' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, classification: 'needs_investigation' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, classification: 'maybe' }).success).toBe(false);
    });

    it('requires escalation_status to be none/needs_ir_review/escalated_to_ciso/resolved', () => {
      expect(SocAlertSchema.safeParse({ ...validAlert, escalation_status: 'none' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, escalation_status: 'needs_ir_review' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, escalation_status: 'escalated_to_ciso' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, escalation_status: 'resolved' }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, escalation_status: 'pending' }).success).toBe(false);
    });

    it('enforces relevance_score between 0 and 100', () => {
      expect(SocAlertSchema.safeParse({ ...validAlert, relevance_score: 0 }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, relevance_score: 100 }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, relevance_score: 50 }).success).toBe(true);
      expect(SocAlertSchema.safeParse({ ...validAlert, relevance_score: -1 }).success).toBe(false);
      expect(SocAlertSchema.safeParse({ ...validAlert, relevance_score: 101 }).success).toBe(false);
    });

    it('allows null classification_reasoning for unclassified alerts', () => {
      const unclassified = {
        ...validAlert,
        classification: 'unclassified',
        classification_reasoning: null,
      };
      expect(SocAlertSchema.safeParse(unclassified).success).toBe(true);
    });

    it('rejects alert missing required fields', () => {
      const result = SocAlertSchema.safeParse({
        external_cve_id: 'CVE-2026-1234',
        // missing title, severity, etc.
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SocTriageResultSchema', () => {
    it('accepts valid triage result', () => {
      const validResult = {
        alerts: [
          {
            external_cve_id: 'CVE-2026-1234',
            title: 'RCE in Apache Struts',
            severity: 'critical',
            cvss_score: 9.8,
            tech_stack_match: true,
            relevance_score: 95,
            classification: 'true_positive',
            classification_reasoning: 'Matches company tech stack.',
            escalation_status: 'needs_ir_review',
            affected_controls: ['SI'],
          },
        ],
        total_triaged: 1,
        company_tech_stack: ['Apache Struts', 'Java', 'PostgreSQL'],
        triage_summary: 'Triaged 1 alert. 1 critical true positive requiring IR review.',
      };

      const result = SocTriageResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('rejects triage result with invalid alerts', () => {
      const invalidResult = {
        alerts: [{ invalid: true }],
        total_triaged: 1,
        company_tech_stack: [],
        triage_summary: 'Bad data',
      };
      const result = SocTriageResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });

  describe('SocCorrelationSchema', () => {
    it('accepts valid correlation', () => {
      const validCorrelation = {
        alert_id: 'alert-uuid-123',
        correlated_findings: [
          {
            source: 'cve',
            finding_id: 'cve-uuid-456',
            relevance: 'High relevance - same vulnerability family',
          },
          {
            source: 'assessment_gap',
            finding_id: 'gap-uuid-789',
            relevance: 'Related control family (SI) has NOT_MET finding',
          },
        ],
        correlation_summary: 'Alert CVE-2026-1234 correlates with 1 CVE and 1 assessment gap in SI family.',
      };

      const result = SocCorrelationSchema.safeParse(validCorrelation);
      expect(result.success).toBe(true);
    });

    it('requires at least alert_id and correlated_findings', () => {
      const result = SocCorrelationSchema.safeParse({ alert_id: 'test' });
      expect(result.success).toBe(false);
    });
  });
});
