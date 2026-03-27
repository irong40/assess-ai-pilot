import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for AppSec agent handler, tools, manifest parser, and system prompt.
 *
 * Validates:
 * - APPSEC_SYSTEM_PROMPT contains CMMC control families AC, SI, CM
 * - APPSEC_TOOL_NAMES has 5 domain tools
 * - parseDependencyManifest handles package.json, requirements.txt, pom.xml
 * - CONFIG_SECURITY_RULES detects common misconfigurations
 * - buildAppSecPrompt produces action-specific prompts
 * - Node mirror matches Deno module structural parity
 */
import {
  APPSEC_SYSTEM_PROMPT,
  APPSEC_TOOL_NAMES,
  parseDependencyManifest,
  CONFIG_SECURITY_RULES,
  buildAppSecPrompt,
  reviewConfigFile,
} from '../appsec-tools-testable';

describe('AppSec Agent', () => {
  describe('APPSEC_SYSTEM_PROMPT', () => {
    it('describes the AppSec agent role for ASSESS-AI', () => {
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/AppSec|application.*security/i);
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/ASSESS-AI|CMMC/i);
    });

    it('references CMMC control family AC (access control)', () => {
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/AC.*access.*control|access.*control.*AC/i);
    });

    it('references CMMC control family SI (system integrity)', () => {
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/SI.*system.*integrity|system.*integrity.*SI|system.*info.*integrity.*SI|SI.*system.*info/i);
    });

    it('references CMMC control family CM (configuration management)', () => {
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/CM.*configuration.*management|configuration.*management.*CM/i);
    });

    it('mentions dependency manifest scanning', () => {
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/dependency|manifest|package/i);
    });

    it('mentions configuration file review', () => {
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/configuration.*review|config.*review|security.*rule/i);
    });

    it('mentions vulnerability findings', () => {
      expect(APPSEC_SYSTEM_PROMPT).toMatch(/vulnerability|CVE|vuln/i);
    });
  });

  describe('APPSEC_TOOL_NAMES', () => {
    it('has exactly 5 domain tools', () => {
      expect(APPSEC_TOOL_NAMES).toHaveLength(5);
    });

    it('includes parseDependencyManifest', () => {
      expect(APPSEC_TOOL_NAMES).toContain('parseDependencyManifest');
    });

    it('includes matchDependencyVulnerabilities', () => {
      expect(APPSEC_TOOL_NAMES).toContain('matchDependencyVulnerabilities');
    });

    it('includes reviewConfigFile', () => {
      expect(APPSEC_TOOL_NAMES).toContain('reviewConfigFile');
    });

    it('includes createAppSecFinding', () => {
      expect(APPSEC_TOOL_NAMES).toContain('createAppSecFinding');
    });

    it('includes getCompanyTechStack', () => {
      expect(APPSEC_TOOL_NAMES).toContain('getCompanyTechStack');
    });
  });

  describe('parseDependencyManifest', () => {
    describe('package.json', () => {
      it('parses package.json with dependencies and devDependencies', () => {
        const manifest = JSON.stringify({
          dependencies: {
            'lodash': '^4.17.21',
            'express': '~4.18.2',
          },
          devDependencies: {
            'vitest': '1.0.0',
          },
        });

        const result = parseDependencyManifest(manifest, 'package.json');
        expect(result).toHaveLength(3);

        const lodash = result.find((d) => d.name === 'lodash');
        expect(lodash).toBeDefined();
        expect(lodash!.version).toBe('4.17.21');
        expect(lodash!.dep_type).toBe('runtime');

        const vitest = result.find((d) => d.name === 'vitest');
        expect(vitest).toBeDefined();
        expect(vitest!.dep_type).toBe('dev');
      });

      it('strips version range operators (^, ~, >=, <=, >)', () => {
        const manifest = JSON.stringify({
          dependencies: {
            'a': '^1.0.0',
            'b': '~2.0.0',
            'c': '>=3.0.0',
            'd': '<=4.0.0',
            'e': '>5.0.0',
          },
        });

        const result = parseDependencyManifest(manifest, 'package.json');
        expect(result.find((d) => d.name === 'a')!.version).toBe('1.0.0');
        expect(result.find((d) => d.name === 'b')!.version).toBe('2.0.0');
        expect(result.find((d) => d.name === 'c')!.version).toBe('3.0.0');
        expect(result.find((d) => d.name === 'd')!.version).toBe('4.0.0');
        expect(result.find((d) => d.name === 'e')!.version).toBe('5.0.0');
      });

      it('handles package.json with only dependencies', () => {
        const manifest = JSON.stringify({
          dependencies: { 'lodash': '4.17.21' },
        });
        const result = parseDependencyManifest(manifest, 'package.json');
        expect(result).toHaveLength(1);
        expect(result[0].dep_type).toBe('runtime');
      });

      it('handles package.json with only devDependencies', () => {
        const manifest = JSON.stringify({
          devDependencies: { 'vitest': '1.0.0' },
        });
        const result = parseDependencyManifest(manifest, 'package.json');
        expect(result).toHaveLength(1);
        expect(result[0].dep_type).toBe('dev');
      });

      it('returns empty array for empty package.json', () => {
        const manifest = JSON.stringify({});
        const result = parseDependencyManifest(manifest, 'package.json');
        expect(result).toHaveLength(0);
      });
    });

    describe('requirements.txt', () => {
      it('parses requirements.txt with version operators', () => {
        const manifest = `
flask==2.3.2
requests>=2.28.0
numpy<=1.24.0
django>4.0
sqlalchemy<2.0
`.trim();

        const result = parseDependencyManifest(manifest, 'requirements.txt');
        expect(result).toHaveLength(5);

        const flask = result.find((d) => d.name === 'flask');
        expect(flask).toBeDefined();
        expect(flask!.version).toBe('2.3.2');
        expect(flask!.dep_type).toBe('runtime');
      });

      it('handles lines without version specifiers', () => {
        const manifest = `flask\nrequests`;
        const result = parseDependencyManifest(manifest, 'requirements.txt');
        expect(result).toHaveLength(2);
        expect(result[0].version).toBe('*');
      });

      it('ignores comments and blank lines', () => {
        const manifest = `# This is a comment
flask==2.3.2

# Another comment
requests>=2.28.0
`;
        const result = parseDependencyManifest(manifest, 'requirements.txt');
        expect(result).toHaveLength(2);
      });
    });

    describe('pom.xml', () => {
      it('parses pom.xml dependency blocks', () => {
        const manifest = `
<dependencies>
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.23</version>
  </dependency>
  <dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>31.1-jre</version>
  </dependency>
</dependencies>
`.trim();

        const result = parseDependencyManifest(manifest, 'pom.xml');
        expect(result).toHaveLength(2);

        const spring = result.find((d) => d.name === 'org.springframework:spring-core');
        expect(spring).toBeDefined();
        expect(spring!.version).toBe('5.3.23');
        expect(spring!.dep_type).toBe('runtime');

        const guava = result.find((d) => d.name === 'com.google.guava:guava');
        expect(guava).toBeDefined();
        expect(guava!.version).toBe('31.1-jre');
      });

      it('handles pom.xml with no dependencies', () => {
        const manifest = `<project><name>test</name></project>`;
        const result = parseDependencyManifest(manifest, 'pom.xml');
        expect(result).toHaveLength(0);
      });
    });

    it('returns empty array for unknown manifest type', () => {
      const result = parseDependencyManifest('content', 'unknown.file');
      expect(result).toHaveLength(0);
    });
  });

  describe('CONFIG_SECURITY_RULES', () => {
    it('has rules for hardcoded secrets (API keys, passwords)', () => {
      const hasSecretRule = CONFIG_SECURITY_RULES.some(
        (r) => r.id.match(/SECRET|API_KEY|PASSWORD|CREDENTIAL/i)
      );
      expect(hasSecretRule).toBe(true);
    });

    it('has rule for debug mode', () => {
      const hasDebugRule = CONFIG_SECURITY_RULES.some(
        (r) => r.id.match(/DEBUG/i)
      );
      expect(hasDebugRule).toBe(true);
    });

    it('has rule for permissive CORS', () => {
      const hasCorsRule = CONFIG_SECURITY_RULES.some(
        (r) => r.id.match(/CORS/i)
      );
      expect(hasCorsRule).toBe(true);
    });

    it('has rule for default credentials', () => {
      const hasDefaultCredRule = CONFIG_SECURITY_RULES.some(
        (r) => r.id.match(/DEFAULT.*CRED/i)
      );
      expect(hasDefaultCredRule).toBe(true);
    });

    it('has rule for insecure protocols (HTTP)', () => {
      const hasHttpRule = CONFIG_SECURITY_RULES.some(
        (r) => r.id.match(/INSECURE.*PROTO|HTTP(?!S)/i)
      );
      expect(hasHttpRule).toBe(true);
    });

    it('has rule for missing security headers', () => {
      const hasHeaderRule = CONFIG_SECURITY_RULES.some(
        (r) => r.id.match(/SECURITY.*HEADER|HEADER/i)
      );
      expect(hasHeaderRule).toBe(true);
    });

    it('has rule for verbose error messages', () => {
      const hasVerboseRule = CONFIG_SECURITY_RULES.some(
        (r) => r.id.match(/VERBOSE.*ERROR|ERROR.*DETAIL/i)
      );
      expect(hasVerboseRule).toBe(true);
    });

    it('each rule has id, pattern, severity, description, and fix_suggestion', () => {
      for (const rule of CONFIG_SECURITY_RULES) {
        expect(rule.id).toBeTruthy();
        expect(rule.pattern).toBeInstanceOf(RegExp);
        expect(['critical', 'high', 'medium', 'low']).toContain(rule.severity);
        expect(rule.description).toBeTruthy();
        expect(rule.fix_suggestion).toBeTruthy();
      }
    });
  });

  describe('reviewConfigFile', () => {
    it('detects hardcoded API key', () => {
      const config = `
{
  "api_key": "sk-1234567890abcdef",
  "debug": false
}
`;
      const issues = reviewConfigFile(config, 'config.json');
      const secretIssue = issues.find((i) => i.rule_id.match(/SECRET|API_KEY/i));
      expect(secretIssue).toBeDefined();
    });

    it('detects debug mode enabled', () => {
      const config = `
{
  "debug": true,
  "port": 3000
}
`;
      const issues = reviewConfigFile(config, 'app.json');
      const debugIssue = issues.find((i) => i.rule_id.match(/DEBUG/i));
      expect(debugIssue).toBeDefined();
    });

    it('detects permissive CORS wildcard', () => {
      const config = `
{
  "cors": {
    "origin": "*"
  }
}
`;
      const issues = reviewConfigFile(config, 'server.json');
      const corsIssue = issues.find((i) => i.rule_id.match(/CORS/i));
      expect(corsIssue).toBeDefined();
    });

    it('returns empty array for clean config', () => {
      const config = `
{
  "port": 3000,
  "host": "localhost"
}
`;
      const issues = reviewConfigFile(config, 'clean.json');
      expect(issues).toHaveLength(0);
    });

    it('returns issues with file_path set to the provided path', () => {
      const config = `{ "debug": true }`;
      const issues = reviewConfigFile(config, 'my/config.json');
      if (issues.length > 0) {
        expect(issues[0].file_path).toBe('my/config.json');
      }
    });
  });

  describe('buildAppSecPrompt', () => {
    it('returns prompt for scan-dependencies action', () => {
      const prompt = buildAppSecPrompt('scan-dependencies', {});
      expect(prompt.toLowerCase()).toContain('dependenc');
      expect(prompt.toLowerCase()).toContain('scan');
    });

    it('returns prompt for review-config action', () => {
      const prompt = buildAppSecPrompt('review-config', {});
      expect(prompt.toLowerCase()).toContain('config');
      expect(prompt.toLowerCase()).toContain('review');
    });

    it('returns prompt for generate-security-report action', () => {
      const prompt = buildAppSecPrompt('generate-security-report', {});
      expect(prompt.toLowerCase()).toContain('report');
      expect(prompt.toLowerCase()).toContain('security');
    });

    it('returns fallback prompt for unknown action', () => {
      const prompt = buildAppSecPrompt('unknown-action', {});
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('returns distinct prompts for each action', () => {
      const actions = ['scan-dependencies', 'review-config', 'generate-security-report'];
      const prompts = actions.map((a) => buildAppSecPrompt(a, {}));
      const unique = new Set(prompts);
      expect(unique.size).toBe(actions.length);
    });
  });

  describe('Deno module structural parity', () => {
    it('Deno appsec-tools.ts exports APPSEC_SYSTEM_PROMPT matching Node mirror keywords', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/appsec-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toMatch(/APPSEC_SYSTEM_PROMPT/);
      expect(code).toMatch(/access.*control|AC/i);
      expect(code).toMatch(/system.*integrity|SI/i);
      expect(code).toMatch(/configuration.*management|CM/i);
    });

    it('Deno appsec-tools.ts has matching APPSEC_TOOL_NAMES', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/appsec-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      for (const name of APPSEC_TOOL_NAMES) {
        expect(code).toContain(name);
      }
    });

    it('Deno appsec-schemas.ts exports all schema names matching Node mirror', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/appsec-schemas.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toContain('ManifestDependencySchema');
      expect(code).toContain('AppSecFindingSchema');
      expect(code).toContain('ConfigIssueSchema');
      expect(code).toContain('SecurityReviewReportSchema');
    });
  });
});
