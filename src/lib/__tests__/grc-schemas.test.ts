import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * GRC Zod Schema validation tests.
 *
 * These tests validate the structured output schemas used by the GRC Analyst
 * agent to produce typed, parseable gap analysis reports. The schemas enforce
 * NIST 800-171A methodology constraints: objective-level findings, evidence
 * categorized by method, remediation options ranked by cost/effort tier, and
 * SSP sections organized by the 14 control families.
 *
 * NOTE: We import the Zod schemas from a frontend-compatible re-export that
 * uses standard npm zod (not Deno npm: specifier). The source of truth is
 * supabase/functions/_shared/grc-schemas.ts -- these re-exports mirror it.
 */
import {
  FindingStatusSchema,
  EvidenceMethodSchema,
  CostEffortTierSchema,
  EvidenceGapSchema,
  RemediationOptionSchema,
  FindingSchema,
  GapAnalysisReportSchema,
  ComplianceSnapshotSchema,
  AuditPackageSectionSchema,
} from '../grc-schemas-frontend';

describe('GRC Zod Schemas', () => {
  describe('GapAnalysisReportSchema', () => {
    it('accepts valid complete report', () => {
      const validReport = {
        assessment_date: '2026-03-26',
        cmmc_level: 2,
        scope_family_id: null,
        sprs_score: 85,
        total_controls: 110,
        met_count: 90,
        not_met_count: 15,
        not_applicable_count: 5,
        findings: [
          {
            control_id: '3.1.1',
            control_title: 'Limit system access to authorized users',
            family_id: 'AC',
            family_name: 'Access Control',
            status: 'NOT_MET',
            failed_objectives: ['3.1.1[a]', '3.1.1[b]'],
            evidence_gaps: [
              { method: 'examine', description: 'Missing access control policy document' },
            ],
            remediation_options: [
              {
                option_id: 'REM-001',
                description: 'Implement Active Directory group policies',
                cost_tier: 'low',
                effort_tier: 'medium',
                timeline_days: 30,
                priority_rank: 1,
              },
            ],
          },
        ],
      };

      const result = GapAnalysisReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });

    it('rejects report missing required fields', () => {
      const invalidReport = {
        cmmc_level: 2,
        // missing assessment_date, sprs_score, counts, findings
      };

      const result = GapAnalysisReportSchema.safeParse(invalidReport);
      expect(result.success).toBe(false);
    });
  });

  describe('FindingSchema', () => {
    it('requires status to be MET, NOT_MET, or NOT_APPLICABLE', () => {
      const validFinding = {
        control_id: '3.1.1',
        control_title: 'Limit system access',
        family_id: 'AC',
        family_name: 'Access Control',
        status: 'MET',
        failed_objectives: [],
        evidence_gaps: [],
        remediation_options: [],
      };

      expect(FindingSchema.safeParse(validFinding).success).toBe(true);
      expect(FindingSchema.safeParse({ ...validFinding, status: 'NOT_MET' }).success).toBe(true);
      expect(FindingSchema.safeParse({ ...validFinding, status: 'NOT_APPLICABLE' }).success).toBe(true);
      expect(FindingSchema.safeParse({ ...validFinding, status: 'PARTIAL' }).success).toBe(false);
      expect(FindingSchema.safeParse({ ...validFinding, status: 'unknown' }).success).toBe(false);
    });
  });

  describe('RemediationOptionSchema', () => {
    it('requires cost_tier and effort_tier to be low/medium/high', () => {
      const validOption = {
        option_id: 'REM-001',
        description: 'Implement MFA',
        cost_tier: 'low',
        effort_tier: 'medium',
        timeline_days: 14,
        priority_rank: 1,
      };

      expect(RemediationOptionSchema.safeParse(validOption).success).toBe(true);
      expect(RemediationOptionSchema.safeParse({ ...validOption, cost_tier: 'high' }).success).toBe(true);
      expect(RemediationOptionSchema.safeParse({ ...validOption, cost_tier: 'extreme' }).success).toBe(false);
      expect(RemediationOptionSchema.safeParse({ ...validOption, effort_tier: 'very_high' }).success).toBe(false);
    });
  });

  describe('EvidenceGapSchema', () => {
    it('requires method to be examine/interview/test', () => {
      expect(EvidenceGapSchema.safeParse({ method: 'examine', description: 'Missing doc' }).success).toBe(true);
      expect(EvidenceGapSchema.safeParse({ method: 'interview', description: 'Need staff interview' }).success).toBe(true);
      expect(EvidenceGapSchema.safeParse({ method: 'test', description: 'Need system test' }).success).toBe(true);
      expect(EvidenceGapSchema.safeParse({ method: 'observe', description: 'Watch process' }).success).toBe(false);
    });
  });

  describe('ComplianceSnapshotSchema', () => {
    it('validates complete snapshot with all fields', () => {
      const validSnapshot = {
        sprs_score: 85,
        total_controls: 110,
        met_count: 90,
        not_met_count: 15,
        not_applicable_count: 5,
        cmmc_level: 2,
        family_scores: { AC: 80, AT: 100, AU: 60 },
        critical_controls_met: true,
        poam_eligible: true,
      };

      const result = ComplianceSnapshotSchema.safeParse(validSnapshot);
      expect(result.success).toBe(true);
    });

    it('rejects snapshot missing required fields', () => {
      const result = ComplianceSnapshotSchema.safeParse({ sprs_score: 50 });
      expect(result.success).toBe(false);
    });
  });

  describe('AuditPackageSectionSchema', () => {
    it('validates family-organized SSP sections', () => {
      const validSection = {
        family_id: 'AC',
        family_name: 'Access Control',
        controls: [
          {
            control_id: '3.1.1',
            title: 'Limit system access to authorized users',
            status: 'MET',
            implementation_statement: 'Active Directory GPOs enforce role-based access.',
            evidence_references: ['POL-AC-001', 'SCR-AC-001'],
          },
        ],
      };

      const result = AuditPackageSectionSchema.safeParse(validSection);
      expect(result.success).toBe(true);
    });

    it('rejects section with invalid control status', () => {
      const invalidSection = {
        family_id: 'AC',
        family_name: 'Access Control',
        controls: [
          {
            control_id: '3.1.1',
            title: 'Limit system access',
            status: 'MAYBE',
            implementation_statement: '',
            evidence_references: [],
          },
        ],
      };

      const result = AuditPackageSectionSchema.safeParse(invalidSection);
      expect(result.success).toBe(false);
    });
  });
});
