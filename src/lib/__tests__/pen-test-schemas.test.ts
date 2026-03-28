import { describe, it, expect } from 'vitest';

/**
 * Tests for Pen Test agent Zod schemas.
 *
 * Validates:
 * - PenTestFindingTypeSchema: 4 finding types (known_cve, version_mismatch, eol_software, missing_patch)
 * - RiskRatingSchema: 4 risk ratings (critical, high, medium, low)
 * - PenTestFindingSchema: title, affected_technology, matched_cve_ids, exploitability_score, business_impact, remediation, cmmc_controls, status
 * - VulnerabilityReportSchema: findings array, summary, overall_risk_rating, scan_scope, authorization_reference, recommendations
 * - AuthorizationResultSchema: authorized boolean, reason, scope, restrictions
 */
import {
  PenTestFindingTypeSchema,
  RiskRatingSchema,
  FindingStatusSchema,
  ScanScopeSchema,
  PenTestFindingSchema,
  VulnerabilityReportSchema,
  AuthorizationResultSchema,
} from '../pen-test-schemas-frontend';

describe('Pen Test Schemas', () => {
  describe('PenTestFindingTypeSchema', () => {
    const validTypes = ['known_cve', 'version_mismatch', 'eol_software', 'missing_patch'];

    it.each(validTypes)('accepts valid finding type: %s', (type) => {
      expect(PenTestFindingTypeSchema.parse(type)).toBe(type);
    });

    it('rejects invalid finding type', () => {
      expect(() => PenTestFindingTypeSchema.parse('sql_injection')).toThrow();
      expect(() => PenTestFindingTypeSchema.parse('')).toThrow();
      expect(() => PenTestFindingTypeSchema.parse(123)).toThrow();
    });

    it('has exactly 4 enum values', () => {
      expect(PenTestFindingTypeSchema.options).toHaveLength(4);
    });
  });

  describe('RiskRatingSchema', () => {
    it('accepts all risk rating levels', () => {
      for (const rating of ['critical', 'high', 'medium', 'low']) {
        expect(RiskRatingSchema.parse(rating)).toBe(rating);
      }
    });

    it('rejects invalid risk rating', () => {
      expect(() => RiskRatingSchema.parse('extreme')).toThrow();
    });

    it('has exactly 4 values', () => {
      expect(RiskRatingSchema.options).toHaveLength(4);
    });
  });

  describe('FindingStatusSchema', () => {
    const validStatuses = ['open', 'remediated', 'accepted_risk', 'false_positive'];

    it.each(validStatuses)('accepts valid status: %s', (status) => {
      expect(FindingStatusSchema.parse(status)).toBe(status);
    });

    it('rejects invalid status', () => {
      expect(() => FindingStatusSchema.parse('closed')).toThrow();
    });

    it('has exactly 4 values', () => {
      expect(FindingStatusSchema.options).toHaveLength(4);
    });
  });

  describe('ScanScopeSchema', () => {
    it('accepts passive_only', () => {
      expect(ScanScopeSchema.parse('passive_only')).toBe('passive_only');
    });

    it('rejects active scanning scopes', () => {
      expect(() => ScanScopeSchema.parse('active')).toThrow();
      expect(() => ScanScopeSchema.parse('full')).toThrow();
    });
  });

  describe('PenTestFindingSchema', () => {
    const validFinding = {
      finding_type: 'known_cve',
      risk_rating: 'high',
      title: 'Critical vulnerability in Apache HTTP Server',
      affected_technology: 'Apache HTTP Server 2.4.49',
      matched_cve_ids: ['CVE-2021-41773', 'CVE-2021-42013'],
      exploitability_score: 9.8,
      business_impact: 'Remote code execution allowing unauthorized access to server',
      remediation: 'Upgrade Apache HTTP Server to version 2.4.51 or later',
      cmmc_controls: ['3.11.2', '3.11.3'],
      status: 'open',
    };

    it('accepts valid known_cve finding', () => {
      const result = PenTestFindingSchema.parse(validFinding);
      expect(result.finding_type).toBe('known_cve');
      expect(result.matched_cve_ids).toHaveLength(2);
    });

    it('accepts version_mismatch finding', () => {
      const result = PenTestFindingSchema.parse({
        ...validFinding,
        finding_type: 'version_mismatch',
      });
      expect(result.finding_type).toBe('version_mismatch');
    });

    it('accepts eol_software finding', () => {
      const result = PenTestFindingSchema.parse({
        ...validFinding,
        finding_type: 'eol_software',
      });
      expect(result.finding_type).toBe('eol_software');
    });

    it('accepts missing_patch finding', () => {
      const result = PenTestFindingSchema.parse({
        ...validFinding,
        finding_type: 'missing_patch',
      });
      expect(result.finding_type).toBe('missing_patch');
    });

    it('rejects invalid finding type', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, finding_type: 'xss' })
      ).toThrow();
    });

    it('requires title', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, title: undefined })
      ).toThrow();
    });

    it('requires affected_technology', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, affected_technology: undefined })
      ).toThrow();
    });

    it('requires matched_cve_ids as array', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, matched_cve_ids: undefined })
      ).toThrow();
    });

    it('accepts empty matched_cve_ids array', () => {
      const result = PenTestFindingSchema.parse({
        ...validFinding,
        matched_cve_ids: [],
      });
      expect(result.matched_cve_ids).toHaveLength(0);
    });

    it('allows optional exploitability_score', () => {
      const result = PenTestFindingSchema.parse({
        ...validFinding,
        exploitability_score: undefined,
      });
      expect(result.exploitability_score).toBeUndefined();
    });

    it('requires business_impact', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, business_impact: undefined })
      ).toThrow();
    });

    it('requires remediation', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, remediation: undefined })
      ).toThrow();
    });

    it('requires cmmc_controls as array', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, cmmc_controls: undefined })
      ).toThrow();
    });

    it('requires status from enum', () => {
      expect(() =>
        PenTestFindingSchema.parse({ ...validFinding, status: 'closed' })
      ).toThrow();
    });
  });

  describe('VulnerabilityReportSchema', () => {
    const validReport = {
      findings: [
        {
          finding_type: 'known_cve',
          risk_rating: 'high',
          title: 'CVE in Apache',
          affected_technology: 'Apache 2.4.49',
          matched_cve_ids: ['CVE-2021-41773'],
          business_impact: 'Remote code execution',
          remediation: 'Upgrade to 2.4.51',
          cmmc_controls: ['3.11.2'],
          status: 'open',
        },
      ],
      summary: 'Vulnerability scan found 1 critical issue',
      overall_risk_rating: 'high',
      scan_scope: 'passive_only',
      authorization_reference: '550e8400-e29b-41d4-a716-446655440000',
      recommendations: ['Upgrade Apache immediately', 'Enable WAF'],
    };

    it('accepts valid vulnerability report', () => {
      const result = VulnerabilityReportSchema.parse(validReport);
      expect(result.findings).toHaveLength(1);
      expect(result.scan_scope).toBe('passive_only');
    });

    it('requires scan_scope to be passive_only', () => {
      expect(() =>
        VulnerabilityReportSchema.parse({ ...validReport, scan_scope: 'active' })
      ).toThrow();
    });

    it('requires findings array', () => {
      expect(() =>
        VulnerabilityReportSchema.parse({ ...validReport, findings: undefined })
      ).toThrow();
    });

    it('requires summary', () => {
      expect(() =>
        VulnerabilityReportSchema.parse({ ...validReport, summary: undefined })
      ).toThrow();
    });

    it('requires overall_risk_rating', () => {
      expect(() =>
        VulnerabilityReportSchema.parse({ ...validReport, overall_risk_rating: undefined })
      ).toThrow();
    });

    it('requires authorization_reference as string', () => {
      expect(() =>
        VulnerabilityReportSchema.parse({ ...validReport, authorization_reference: undefined })
      ).toThrow();
    });

    it('requires recommendations as string array', () => {
      expect(() =>
        VulnerabilityReportSchema.parse({ ...validReport, recommendations: undefined })
      ).toThrow();
    });

    it('accepts empty arrays for findings and recommendations', () => {
      const result = VulnerabilityReportSchema.parse({
        ...validReport,
        findings: [],
        recommendations: [],
      });
      expect(result.findings).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('AuthorizationResultSchema', () => {
    it('accepts authorized result', () => {
      const result = AuthorizationResultSchema.parse({
        authorized: true,
        scope: 'passive_only',
        restrictions: ['no_active_scanning'],
      });
      expect(result.authorized).toBe(true);
    });

    it('accepts unauthorized result with reason', () => {
      const result = AuthorizationResultSchema.parse({
        authorized: false,
        reason: 'Pen test agent not enabled for this company',
        scope: 'passive_only',
        restrictions: [],
      });
      expect(result.authorized).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('requires authorized boolean', () => {
      expect(() =>
        AuthorizationResultSchema.parse({
          scope: 'passive_only',
          restrictions: [],
        })
      ).toThrow();
    });

    it('allows optional reason', () => {
      const result = AuthorizationResultSchema.parse({
        authorized: true,
        scope: 'passive_only',
        restrictions: [],
      });
      expect(result.reason).toBeUndefined();
    });

    it('requires scope', () => {
      expect(() =>
        AuthorizationResultSchema.parse({
          authorized: true,
          restrictions: [],
        })
      ).toThrow();
    });

    it('requires restrictions as array', () => {
      expect(() =>
        AuthorizationResultSchema.parse({
          authorized: true,
          scope: 'passive_only',
        })
      ).toThrow();
    });
  });
});
