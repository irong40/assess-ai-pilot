import { describe, it, expect } from 'vitest';

/**
 * Tests for AppSec agent Zod schemas.
 *
 * Validates:
 * - ManifestDependencySchema: name, version, dep_type enum
 * - AppSecFindingSchema: finding_type enum (4 values), severity, title, affected_component, fix fields, cve_id, cmmc_controls
 * - ConfigIssueSchema: rule_id, severity, description, file_path, line_number, fix_suggestion
 * - SecurityReviewReportSchema: aggregates findings + config_issues + summary + risk_score + remediation_priority
 */
import {
  ManifestDependencySchema,
  AppSecFindingSchema,
  ConfigIssueSchema,
  SecurityReviewReportSchema,
  AppSecSeveritySchema,
  FindingTypeSchema,
} from '../appsec-schemas-frontend';

describe('AppSec Schemas', () => {
  describe('AppSecSeveritySchema', () => {
    it('accepts all severity levels', () => {
      for (const sev of ['critical', 'high', 'medium', 'low']) {
        expect(AppSecSeveritySchema.parse(sev)).toBe(sev);
      }
    });

    it('rejects invalid severity', () => {
      expect(() => AppSecSeveritySchema.parse('extreme')).toThrow();
    });

    it('has exactly 4 values', () => {
      expect(AppSecSeveritySchema.options).toHaveLength(4);
    });
  });

  describe('FindingTypeSchema', () => {
    const validTypes = [
      'dependency_vulnerability',
      'config_misconfiguration',
      'hardcoded_secret',
      'deprecated_package',
    ];

    it.each(validTypes)('accepts valid finding type: %s', (type) => {
      expect(FindingTypeSchema.parse(type)).toBe(type);
    });

    it('rejects invalid finding type', () => {
      expect(() => FindingTypeSchema.parse('sql_injection')).toThrow();
      expect(() => FindingTypeSchema.parse('')).toThrow();
      expect(() => FindingTypeSchema.parse(123)).toThrow();
    });

    it('has exactly 4 enum values', () => {
      expect(FindingTypeSchema.options).toHaveLength(4);
    });
  });

  describe('ManifestDependencySchema', () => {
    it('accepts valid dependency', () => {
      const result = ManifestDependencySchema.parse({
        name: 'lodash',
        version: '4.17.21',
        dep_type: 'runtime',
      });
      expect(result.name).toBe('lodash');
      expect(result.version).toBe('4.17.21');
      expect(result.dep_type).toBe('runtime');
    });

    it('accepts dev dependency', () => {
      const result = ManifestDependencySchema.parse({
        name: 'vitest',
        version: '1.0.0',
        dep_type: 'dev',
      });
      expect(result.dep_type).toBe('dev');
    });

    it('requires name as string', () => {
      expect(() =>
        ManifestDependencySchema.parse({
          version: '1.0.0',
          dep_type: 'runtime',
        })
      ).toThrow();
    });

    it('requires version as string', () => {
      expect(() =>
        ManifestDependencySchema.parse({
          name: 'lodash',
          dep_type: 'runtime',
        })
      ).toThrow();
    });

    it('requires dep_type from enum (runtime or dev)', () => {
      expect(() =>
        ManifestDependencySchema.parse({
          name: 'lodash',
          version: '1.0.0',
          dep_type: 'optional',
        })
      ).toThrow();
    });
  });

  describe('AppSecFindingSchema', () => {
    const validFinding = {
      finding_type: 'dependency_vulnerability',
      severity: 'high',
      title: 'Known vulnerability in lodash',
      affected_component: 'lodash@4.17.15',
      fix_suggestion: 'Upgrade lodash to 4.17.21',
      fix_version: '4.17.21',
      cve_id: 'CVE-2020-8203',
      cmmc_controls: ['3.14.1', '3.4.1'],
    };

    it('accepts valid dependency_vulnerability finding', () => {
      const result = AppSecFindingSchema.parse(validFinding);
      expect(result.finding_type).toBe('dependency_vulnerability');
      expect(result.cve_id).toBe('CVE-2020-8203');
    });

    it('accepts config_misconfiguration finding', () => {
      const result = AppSecFindingSchema.parse({
        ...validFinding,
        finding_type: 'config_misconfiguration',
        cve_id: undefined,
        fix_version: undefined,
      });
      expect(result.finding_type).toBe('config_misconfiguration');
    });

    it('accepts hardcoded_secret finding', () => {
      const result = AppSecFindingSchema.parse({
        ...validFinding,
        finding_type: 'hardcoded_secret',
      });
      expect(result.finding_type).toBe('hardcoded_secret');
    });

    it('accepts deprecated_package finding', () => {
      const result = AppSecFindingSchema.parse({
        ...validFinding,
        finding_type: 'deprecated_package',
      });
      expect(result.finding_type).toBe('deprecated_package');
    });

    it('rejects invalid finding type', () => {
      expect(() =>
        AppSecFindingSchema.parse({
          ...validFinding,
          finding_type: 'xss_attack',
        })
      ).toThrow();
    });

    it('requires title', () => {
      expect(() =>
        AppSecFindingSchema.parse({
          ...validFinding,
          title: undefined,
        })
      ).toThrow();
    });

    it('requires affected_component', () => {
      expect(() =>
        AppSecFindingSchema.parse({
          ...validFinding,
          affected_component: undefined,
        })
      ).toThrow();
    });

    it('requires fix_suggestion', () => {
      expect(() =>
        AppSecFindingSchema.parse({
          ...validFinding,
          fix_suggestion: undefined,
        })
      ).toThrow();
    });

    it('allows optional cve_id', () => {
      const result = AppSecFindingSchema.parse({
        ...validFinding,
        cve_id: undefined,
      });
      expect(result.cve_id).toBeUndefined();
    });

    it('allows optional fix_version', () => {
      const result = AppSecFindingSchema.parse({
        ...validFinding,
        fix_version: undefined,
      });
      expect(result.fix_version).toBeUndefined();
    });

    it('requires cmmc_controls as array', () => {
      expect(() =>
        AppSecFindingSchema.parse({
          ...validFinding,
          cmmc_controls: undefined,
        })
      ).toThrow();
    });
  });

  describe('ConfigIssueSchema', () => {
    const validIssue = {
      rule_id: 'CORS_WILDCARD',
      severity: 'medium',
      description: 'CORS configured with wildcard origin',
      file_path: 'config/server.json',
      line_number: 15,
      fix_suggestion: 'Restrict CORS to specific origins',
    };

    it('accepts valid config issue', () => {
      const result = ConfigIssueSchema.parse(validIssue);
      expect(result.rule_id).toBe('CORS_WILDCARD');
    });

    it('requires rule_id', () => {
      expect(() =>
        ConfigIssueSchema.parse({ ...validIssue, rule_id: undefined })
      ).toThrow();
    });

    it('requires severity from enum', () => {
      expect(() =>
        ConfigIssueSchema.parse({ ...validIssue, severity: 'extreme' })
      ).toThrow();
    });

    it('requires description', () => {
      expect(() =>
        ConfigIssueSchema.parse({ ...validIssue, description: undefined })
      ).toThrow();
    });

    it('requires file_path', () => {
      expect(() =>
        ConfigIssueSchema.parse({ ...validIssue, file_path: undefined })
      ).toThrow();
    });

    it('allows optional line_number', () => {
      const result = ConfigIssueSchema.parse({
        ...validIssue,
        line_number: undefined,
      });
      expect(result.line_number).toBeUndefined();
    });

    it('requires fix_suggestion', () => {
      expect(() =>
        ConfigIssueSchema.parse({ ...validIssue, fix_suggestion: undefined })
      ).toThrow();
    });
  });

  describe('SecurityReviewReportSchema', () => {
    const validReport = {
      findings: [
        {
          finding_type: 'dependency_vulnerability',
          severity: 'high',
          title: 'CVE in lodash',
          affected_component: 'lodash@4.17.15',
          fix_suggestion: 'Upgrade to 4.17.21',
          cmmc_controls: ['3.14.1'],
        },
      ],
      config_issues: [
        {
          rule_id: 'DEBUG_MODE',
          severity: 'medium',
          description: 'Debug mode enabled in production',
          file_path: 'config/app.json',
          fix_suggestion: 'Disable debug mode',
        },
      ],
      summary: 'Security review found 1 dependency vulnerability and 1 config issue',
      risk_score: 7.5,
      remediation_priority: ['Upgrade lodash', 'Disable debug mode'],
    };

    it('accepts valid security review report', () => {
      const result = SecurityReviewReportSchema.parse(validReport);
      expect(result.findings).toHaveLength(1);
      expect(result.config_issues).toHaveLength(1);
      expect(result.risk_score).toBe(7.5);
    });

    it('requires findings array', () => {
      expect(() =>
        SecurityReviewReportSchema.parse({
          ...validReport,
          findings: undefined,
        })
      ).toThrow();
    });

    it('requires config_issues array', () => {
      expect(() =>
        SecurityReviewReportSchema.parse({
          ...validReport,
          config_issues: undefined,
        })
      ).toThrow();
    });

    it('requires summary', () => {
      expect(() =>
        SecurityReviewReportSchema.parse({
          ...validReport,
          summary: undefined,
        })
      ).toThrow();
    });

    it('requires risk_score as number', () => {
      expect(() =>
        SecurityReviewReportSchema.parse({
          ...validReport,
          risk_score: undefined,
        })
      ).toThrow();
    });

    it('requires remediation_priority as string array', () => {
      expect(() =>
        SecurityReviewReportSchema.parse({
          ...validReport,
          remediation_priority: undefined,
        })
      ).toThrow();
    });

    it('accepts empty arrays for findings and config_issues', () => {
      const result = SecurityReviewReportSchema.parse({
        ...validReport,
        findings: [],
        config_issues: [],
      });
      expect(result.findings).toHaveLength(0);
      expect(result.config_issues).toHaveLength(0);
    });
  });
});
