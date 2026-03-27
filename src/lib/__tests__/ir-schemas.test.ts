import { describe, it, expect } from 'vitest';

/**
 * Tests for IR agent Zod schemas.
 *
 * Validates:
 * - IncidentTypeSchema: all 9 types valid, rejects invalid
 * - ContainmentRecommendationSchema: structure, requires_approval=true
 * - PlaybookGuidanceSchema: ordered steps per phase
 * - PostIncidentReportSchema: timeline, compliance_impact, recommendations
 * - IrAnalysisResultSchema: aggregates all output types
 */
import {
  IncidentTypeSchema,
  ContainmentRecommendationSchema,
  PlaybookGuidanceSchema,
  PostIncidentReportSchema,
  IrAnalysisResultSchema,
  IrSeveritySchema,
} from '../ir-schemas-frontend';

describe('IR Schemas', () => {
  describe('IncidentTypeSchema', () => {
    const validTypes = [
      'malware',
      'unauthorized_access',
      'denial_of_service',
      'data_breach',
      'insider_threat',
      'supply_chain',
      'misconfiguration',
      'policy_violation',
      'unknown',
    ];

    it.each(validTypes)('accepts valid incident type: %s', (type) => {
      expect(IncidentTypeSchema.parse(type)).toBe(type);
    });

    it('rejects invalid incident type', () => {
      expect(() => IncidentTypeSchema.parse('phishing')).toThrow();
      expect(() => IncidentTypeSchema.parse('')).toThrow();
      expect(() => IncidentTypeSchema.parse(123)).toThrow();
    });

    it('has exactly 9 enum values', () => {
      expect(IncidentTypeSchema.options).toHaveLength(9);
    });
  });

  describe('IrSeveritySchema', () => {
    it('accepts all severity levels', () => {
      for (const sev of ['critical', 'high', 'medium', 'low']) {
        expect(IrSeveritySchema.parse(sev)).toBe(sev);
      }
    });

    it('rejects invalid severity', () => {
      expect(() => IrSeveritySchema.parse('extreme')).toThrow();
    });
  });

  describe('ContainmentRecommendationSchema', () => {
    const validRecommendation = {
      incident_type: 'malware',
      severity: 'critical',
      containment_strategy: 'both',
      steps: [
        {
          phase: 'detect',
          order: 1,
          action: 'Identify affected systems via network logs',
          rationale: 'Scope the infection boundary before containment',
          requires_approval: true as const,
        },
        {
          phase: 'contain',
          order: 2,
          action: 'Isolate affected network segment',
          rationale: 'Prevent lateral movement',
          requires_approval: true as const,
        },
      ],
      cmmc_controls_affected: ['3.6.1', '3.6.2'],
      compliance_impact: 'Incident may affect IR plan compliance under CMMC 3.6.1',
    };

    it('accepts valid containment recommendation', () => {
      const result = ContainmentRecommendationSchema.parse(validRecommendation);
      expect(result.incident_type).toBe('malware');
      expect(result.steps).toHaveLength(2);
    });

    it('requires incident_type from enum', () => {
      expect(() =>
        ContainmentRecommendationSchema.parse({
          ...validRecommendation,
          incident_type: 'invalid_type',
        })
      ).toThrow();
    });

    it('requires severity from enum', () => {
      expect(() =>
        ContainmentRecommendationSchema.parse({
          ...validRecommendation,
          severity: 'extreme',
        })
      ).toThrow();
    });

    it('requires containment_strategy from enum', () => {
      expect(() =>
        ContainmentRecommendationSchema.parse({
          ...validRecommendation,
          containment_strategy: 'none',
        })
      ).toThrow();
    });

    it('enforces requires_approval is always true', () => {
      expect(() =>
        ContainmentRecommendationSchema.parse({
          ...validRecommendation,
          steps: [
            {
              phase: 'contain',
              order: 1,
              action: 'Do something',
              rationale: 'Because',
              requires_approval: false,
            },
          ],
        })
      ).toThrow();
    });

    it('validates step phase enum (detect/contain/eradicate/recover)', () => {
      expect(() =>
        ContainmentRecommendationSchema.parse({
          ...validRecommendation,
          steps: [
            {
              phase: 'prepare',
              order: 1,
              action: 'Action',
              rationale: 'Reason',
              requires_approval: true,
            },
          ],
        })
      ).toThrow();
    });

    it('accepts optional estimated_time and affected_systems in steps', () => {
      const withOptionals = {
        ...validRecommendation,
        steps: [
          {
            phase: 'contain' as const,
            order: 1,
            action: 'Isolate host',
            rationale: 'Prevent spread',
            requires_approval: true as const,
            estimated_time: '15 minutes',
            affected_systems: ['server-01', 'server-02'],
          },
        ],
      };
      const result = ContainmentRecommendationSchema.parse(withOptionals);
      expect(result.steps[0].estimated_time).toBe('15 minutes');
      expect(result.steps[0].affected_systems).toHaveLength(2);
    });

    it('requires cmmc_controls_affected array', () => {
      expect(() =>
        ContainmentRecommendationSchema.parse({
          ...validRecommendation,
          cmmc_controls_affected: undefined,
        })
      ).toThrow();
    });
  });

  describe('PlaybookGuidanceSchema', () => {
    const validPlaybook = {
      incident_type: 'data_breach',
      title: 'Data Breach Response Playbook',
      phases: [
        {
          phase: 'detect',
          steps: [
            { order: 1, action: 'Review access logs', requires_approval: true as const },
          ],
        },
        {
          phase: 'contain',
          steps: [
            { order: 1, action: 'Revoke compromised credentials', requires_approval: true as const },
          ],
        },
        {
          phase: 'eradicate',
          steps: [
            { order: 1, action: 'Patch vulnerability', requires_approval: true as const },
          ],
        },
        {
          phase: 'recover',
          steps: [
            { order: 1, action: 'Restore from backup', requires_approval: true as const },
          ],
        },
      ],
      estimated_duration: '4-8 hours',
      cmmc_controls: ['3.6.1', '3.6.2', '3.6.3'],
    };

    it('accepts valid playbook with all 4 phases', () => {
      const result = PlaybookGuidanceSchema.parse(validPlaybook);
      expect(result.phases).toHaveLength(4);
    });

    it('requires incident_type from enum', () => {
      expect(() =>
        PlaybookGuidanceSchema.parse({
          ...validPlaybook,
          incident_type: 'invalid',
        })
      ).toThrow();
    });

    it('validates phase names in playbook phases', () => {
      expect(() =>
        PlaybookGuidanceSchema.parse({
          ...validPlaybook,
          phases: [
            {
              phase: 'invalid_phase',
              steps: [{ order: 1, action: 'test', requires_approval: true }],
            },
          ],
        })
      ).toThrow();
    });
  });

  describe('PostIncidentReportSchema', () => {
    const validReport = {
      incident_id: '550e8400-e29b-41d4-a716-446655440000',
      incident_type: 'unauthorized_access',
      severity: 'high',
      timeline: [
        { timestamp: '2026-03-27T10:00:00Z', event: 'Unauthorized login detected', actor: 'system' },
        { timestamp: '2026-03-27T10:05:00Z', event: 'SOC alert created', actor: 'agent' },
      ],
      detection_method: 'Anomalous login pattern from unusual IP range',
      containment_actions: ['Account locked', 'Session terminated'],
      eradication_actions: ['Password reset forced', 'MFA re-enrollment required'],
      recovery_actions: ['Account restored with new credentials', 'Access logs reviewed'],
      root_cause_analysis: 'Credential compromise via phishing email targeting employee',
      lessons_learned: [
        'Implement stricter email filtering',
        'Require MFA for all remote access',
      ],
      compliance_impact: {
        affected_controls: ['3.5.3', '3.6.1', '3.6.2'],
        sprs_impact: -15,
        requires_poam_update: true,
      },
      recommendations: [
        { action: 'Enable MFA for all users', priority: 'immediate', cmmc_control: '3.5.3' },
        { action: 'Review access control policies', priority: 'short_term', cmmc_control: '3.1.1' },
      ],
    };

    it('accepts valid post-incident report', () => {
      const result = PostIncidentReportSchema.parse(validReport);
      expect(result.incident_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('requires incident_id as UUID', () => {
      expect(() =>
        PostIncidentReportSchema.parse({
          ...validReport,
          incident_id: 'not-a-uuid',
        })
      ).toThrow();
    });

    it('validates timeline actor enum', () => {
      expect(() =>
        PostIncidentReportSchema.parse({
          ...validReport,
          timeline: [
            { timestamp: '2026-01-01', event: 'test', actor: 'robot' },
          ],
        })
      ).toThrow();
    });

    it('requires compliance_impact with affected_controls, sprs_impact, requires_poam_update', () => {
      expect(() =>
        PostIncidentReportSchema.parse({
          ...validReport,
          compliance_impact: { affected_controls: ['3.6.1'] },
        })
      ).toThrow();
    });

    it('validates recommendation priority enum', () => {
      expect(() =>
        PostIncidentReportSchema.parse({
          ...validReport,
          recommendations: [
            { action: 'test', priority: 'urgent' },
          ],
        })
      ).toThrow();
    });
  });

  describe('IrAnalysisResultSchema', () => {
    it('accepts result with containment field', () => {
      const result = IrAnalysisResultSchema.parse({
        action: 'analyze-incident',
        incident_id: '550e8400-e29b-41d4-a716-446655440000',
        containment: {
          incident_type: 'malware',
          severity: 'high',
          containment_strategy: 'short_term',
          steps: [{
            phase: 'contain',
            order: 1,
            action: 'Isolate host',
            rationale: 'Prevent spread',
            requires_approval: true as const,
          }],
          cmmc_controls_affected: ['3.6.1'],
          compliance_impact: 'IR plan compliance affected',
        },
      });
      expect(result.action).toBe('analyze-incident');
    });

    it('accepts result with post_incident_report field', () => {
      const result = IrAnalysisResultSchema.parse({
        action: 'create-post-incident-report',
        incident_id: '550e8400-e29b-41d4-a716-446655440000',
        post_incident_report: {
          incident_id: '550e8400-e29b-41d4-a716-446655440000',
          incident_type: 'data_breach',
          severity: 'critical',
          timeline: [{ timestamp: '2026-01-01', event: 'detected', actor: 'system' }],
          detection_method: 'Log analysis',
          containment_actions: ['Isolated server'],
          eradication_actions: ['Patched vuln'],
          recovery_actions: ['Restored backup'],
          root_cause_analysis: 'Unpatched CVE',
          lessons_learned: ['Patch faster'],
          compliance_impact: {
            affected_controls: ['3.6.1'],
            sprs_impact: -10,
            requires_poam_update: true,
          },
          recommendations: [{ action: 'Patch all systems', priority: 'immediate' }],
        },
      });
      expect(result.action).toBe('create-post-incident-report');
    });
  });
});
