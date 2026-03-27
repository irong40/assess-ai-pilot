import { describe, it, expect } from 'vitest';

/**
 * Threat Intelligence Zod Schema validation tests.
 *
 * Tests the structured output schemas used by the Threat Intel agent for
 * threat briefs, IOC tracking, attack surface mapping, and analysis results.
 *
 * NOTE: Imports from the frontend-compatible re-export (standard npm zod).
 * Source of truth: supabase/functions/_shared/threat-intel-schemas.ts (Deno context).
 */
import {
  ThreatBriefSchema,
  IocEntrySchema,
  AttackSurfaceSchema,
  ThreatAnalysisResultSchema,
} from '../threat-intel-schemas-frontend';

describe('Threat Intel Zod Schemas', () => {
  describe('ThreatBriefSchema', () => {
    const validBrief = {
      title: 'Weekly Threat Brief: Critical Apache Vulnerabilities',
      executive_summary:
        'Three critical CVEs affecting Apache components detected this week, two relevant to company tech stack.',
      threat_count: 3,
      affected_controls: [
        {
          control_id: '3.14.1',
          family_id: 'SI',
          threat_description: 'CVE-2026-1234 exploits unpatched Apache Struts',
          risk_level: 'critical',
        },
        {
          control_id: '3.13.11',
          family_id: 'SC',
          threat_description: 'CVE-2026-5678 targets weak TLS configurations',
          risk_level: 'high',
        },
      ],
      generated_at: '2026-03-27T12:00:00Z',
    };

    it('accepts valid complete threat brief', () => {
      const result = ThreatBriefSchema.safeParse(validBrief);
      expect(result.success).toBe(true);
    });

    it('requires title to be non-empty string', () => {
      expect(ThreatBriefSchema.safeParse({ ...validBrief, title: '' }).success).toBe(false);
      expect(ThreatBriefSchema.safeParse({ ...validBrief, title: 123 }).success).toBe(false);
    });

    it('requires executive_summary to be non-empty string', () => {
      expect(
        ThreatBriefSchema.safeParse({ ...validBrief, executive_summary: '' }).success
      ).toBe(false);
    });

    it('requires threat_count to be a non-negative integer', () => {
      expect(ThreatBriefSchema.safeParse({ ...validBrief, threat_count: 0 }).success).toBe(true);
      expect(ThreatBriefSchema.safeParse({ ...validBrief, threat_count: -1 }).success).toBe(false);
      expect(ThreatBriefSchema.safeParse({ ...validBrief, threat_count: 1.5 }).success).toBe(
        false
      );
    });

    it('enforces risk_level enum in affected_controls', () => {
      const withBadRisk = {
        ...validBrief,
        affected_controls: [
          {
            control_id: '3.14.1',
            family_id: 'SI',
            threat_description: 'test',
            risk_level: 'extreme',
          },
        ],
      };
      expect(ThreatBriefSchema.safeParse(withBadRisk).success).toBe(false);

      // All valid risk levels
      for (const level of ['critical', 'high', 'medium', 'low']) {
        const withLevel = {
          ...validBrief,
          affected_controls: [
            {
              control_id: '3.14.1',
              family_id: 'SI',
              threat_description: 'test',
              risk_level: level,
            },
          ],
        };
        expect(ThreatBriefSchema.safeParse(withLevel).success).toBe(true);
      }
    });

    it('allows empty affected_controls array', () => {
      const result = ThreatBriefSchema.safeParse({
        ...validBrief,
        affected_controls: [],
      });
      expect(result.success).toBe(true);
    });

    it('rejects brief missing required fields', () => {
      const result = ThreatBriefSchema.safeParse({
        title: 'Partial brief',
        // missing executive_summary, threat_count, affected_controls, generated_at
      });
      expect(result.success).toBe(false);
    });
  });

  describe('IocEntrySchema', () => {
    const validIoc = {
      indicator_type: 'ip',
      indicator_value: '192.168.1.100',
      confidence_level: 'high',
      source_cve: 'CVE-2026-1234',
      is_active: true,
    };

    it('accepts valid IOC entry', () => {
      const result = IocEntrySchema.safeParse(validIoc);
      expect(result.success).toBe(true);
    });

    it('requires indicator_type to be ip/domain/hash/url/email', () => {
      for (const type of ['ip', 'domain', 'hash', 'url', 'email']) {
        expect(IocEntrySchema.safeParse({ ...validIoc, indicator_type: type }).success).toBe(true);
      }
      expect(IocEntrySchema.safeParse({ ...validIoc, indicator_type: 'file' }).success).toBe(
        false
      );
      expect(IocEntrySchema.safeParse({ ...validIoc, indicator_type: 'IP' }).success).toBe(false);
    });

    it('requires confidence_level to be high/medium/low', () => {
      for (const level of ['high', 'medium', 'low']) {
        expect(
          IocEntrySchema.safeParse({ ...validIoc, confidence_level: level }).success
        ).toBe(true);
      }
      expect(
        IocEntrySchema.safeParse({ ...validIoc, confidence_level: 'critical' }).success
      ).toBe(false);
    });

    it('allows optional source_cve', () => {
      const { source_cve, ...withoutCve } = validIoc;
      expect(IocEntrySchema.safeParse(withoutCve).success).toBe(true);
    });

    it('requires is_active to be boolean', () => {
      expect(IocEntrySchema.safeParse({ ...validIoc, is_active: false }).success).toBe(true);
      expect(IocEntrySchema.safeParse({ ...validIoc, is_active: 'yes' }).success).toBe(false);
    });

    it('rejects IOC missing required fields', () => {
      const result = IocEntrySchema.safeParse({ indicator_type: 'ip' });
      expect(result.success).toBe(false);
    });
  });

  describe('AttackSurfaceSchema', () => {
    const validSurface = {
      tech_stack: ['Apache Struts', 'Java', 'PostgreSQL'],
      not_met_controls: ['3.14.1', '3.13.11'],
      active_threats: [
        {
          cve_id: 'CVE-2026-1234',
          severity: 'critical',
          affected_component: 'Apache Struts',
        },
      ],
      risk_score: 78,
    };

    it('accepts valid attack surface', () => {
      const result = AttackSurfaceSchema.safeParse(validSurface);
      expect(result.success).toBe(true);
    });

    it('enforces risk_score between 0 and 100', () => {
      expect(AttackSurfaceSchema.safeParse({ ...validSurface, risk_score: 0 }).success).toBe(true);
      expect(AttackSurfaceSchema.safeParse({ ...validSurface, risk_score: 100 }).success).toBe(
        true
      );
      expect(AttackSurfaceSchema.safeParse({ ...validSurface, risk_score: -1 }).success).toBe(
        false
      );
      expect(AttackSurfaceSchema.safeParse({ ...validSurface, risk_score: 101 }).success).toBe(
        false
      );
    });

    it('allows empty arrays for tech_stack, not_met_controls, active_threats', () => {
      const empty = {
        tech_stack: [],
        not_met_controls: [],
        active_threats: [],
        risk_score: 0,
      };
      expect(AttackSurfaceSchema.safeParse(empty).success).toBe(true);
    });

    it('rejects surface missing required fields', () => {
      const result = AttackSurfaceSchema.safeParse({ tech_stack: ['Java'] });
      expect(result.success).toBe(false);
    });
  });

  describe('ThreatAnalysisResultSchema', () => {
    it('accepts valid analysis result', () => {
      const validResult = {
        briefs: [
          {
            title: 'Weekly Brief',
            executive_summary: 'Summary of weekly threats.',
            threat_count: 2,
            affected_controls: [],
            generated_at: '2026-03-27T12:00:00Z',
          },
        ],
        iocs: [
          {
            indicator_type: 'ip',
            indicator_value: '10.0.0.1',
            confidence_level: 'medium',
            is_active: true,
          },
        ],
        attack_surface: {
          tech_stack: ['Node.js'],
          not_met_controls: ['3.5.3'],
          active_threats: [],
          risk_score: 45,
        },
        analysis_summary: 'Analysis identified 2 threats with 1 IOC.',
      };

      const result = ThreatAnalysisResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('allows optional attack_surface', () => {
      const withoutSurface = {
        briefs: [],
        iocs: [],
        analysis_summary: 'No threats found.',
      };
      expect(ThreatAnalysisResultSchema.safeParse(withoutSurface).success).toBe(true);
    });

    it('rejects result with invalid briefs', () => {
      const invalid = {
        briefs: [{ invalid: true }],
        iocs: [],
        analysis_summary: 'Bad data',
      };
      expect(ThreatAnalysisResultSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects result missing analysis_summary', () => {
      const result = ThreatAnalysisResultSchema.safeParse({
        briefs: [],
        iocs: [],
      });
      expect(result.success).toBe(false);
    });
  });
});
