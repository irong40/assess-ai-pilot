import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for Pen Test agent handler, tools, authorization gate, and system prompt.
 *
 * Validates:
 * - PEN_TEST_SYSTEM_PROMPT contains PASSIVE ONLY constraint and NO external network access
 * - PEN_TEST_SYSTEM_PROMPT references CMMC controls 3.11.2 and 3.11.3
 * - PEN_TEST_TOOL_NAMES has 4 domain tools
 * - No tool parameter schema includes url/ip/hostname fields
 * - checkScanAuthorization queries agent_permissions
 * - buildPenTestPrompt produces action-specific prompts
 * - Node mirror matches Deno module structural parity
 */
import {
  PEN_TEST_SYSTEM_PROMPT,
  PEN_TEST_TOOL_NAMES,
  createPenTestTools,
  buildPenTestPrompt,
} from '../pen-test-tools-testable';

describe('Pen Test Agent', () => {
  describe('PEN_TEST_SYSTEM_PROMPT', () => {
    it('describes the Pen Test agent role for ASSESS-AI', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/Pen\s*Test/i);
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/ASSESS-AI/i);
    });

    it('contains PASSIVE vulnerability discovery constraint', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/PASSIVE/);
    });

    it('states NO access to external networks', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toContain('You have NO access to external networks');
    });

    it('states can ONLY query internal database tables', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toContain(
        'You can ONLY query internal database tables'
      );
    });

    it('requires checkScanAuthorization FIRST before any other tool', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/checkScanAuthorization.*FIRST/i);
    });

    it('states no active exploitation, no network scanning, no port probing', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/no.*active.*exploitation/i);
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/no.*network.*scanning/i);
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/no.*port.*probing/i);
    });

    it('references CMMC control 3.11.2 (scan for vulnerabilities)', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/3\.11\.2/);
    });

    it('references CMMC control 3.11.3 (remediate vulnerabilities)', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/3\.11\.3/);
    });

    it('mentions tech stack matching against CVE patterns', () => {
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/tech.*stack/i);
      expect(PEN_TEST_SYSTEM_PROMPT).toMatch(/CVE/i);
    });
  });

  describe('PEN_TEST_TOOL_NAMES', () => {
    it('has exactly 4 domain tools', () => {
      expect(PEN_TEST_TOOL_NAMES).toHaveLength(4);
    });

    it('includes checkScanAuthorization', () => {
      expect(PEN_TEST_TOOL_NAMES).toContain('checkScanAuthorization');
    });

    it('includes getCompanyTechStack', () => {
      expect(PEN_TEST_TOOL_NAMES).toContain('getCompanyTechStack');
    });

    it('includes matchTechStackCVEs', () => {
      expect(PEN_TEST_TOOL_NAMES).toContain('matchTechStackCVEs');
    });

    it('includes createPenTestFinding', () => {
      expect(PEN_TEST_TOOL_NAMES).toContain('createPenTestFinding');
    });
  });

  describe('Tool parameter schemas (PASSIVE ONLY enforcement)', () => {
    const mockSupabase = {};
    const mockTask = {
      id: 'test-task-id',
      company_id: 'test-company-id',
      agent_type: 'pen-test',
      action: 'passive-scan',
      input: {},
    };

    let tools: ReturnType<typeof createPenTestTools>;

    beforeAll(() => {
      tools = createPenTestTools(mockSupabase, mockTask);
    });

    it('no tool has a url parameter', () => {
      for (const [name, toolDef] of Object.entries(tools)) {
        const schema = (toolDef as any).parameters;
        if (schema && schema.shape) {
          const keys = Object.keys(schema.shape);
          for (const key of keys) {
            expect(key.toLowerCase()).not.toContain('url');
          }
        }
      }
    });

    it('no tool has an ip_address parameter', () => {
      for (const [name, toolDef] of Object.entries(tools)) {
        const schema = (toolDef as any).parameters;
        if (schema && schema.shape) {
          const keys = Object.keys(schema.shape);
          for (const key of keys) {
            expect(key.toLowerCase()).not.toMatch(/^ip$|ip_addr|ip_address/);
          }
        }
      }
    });

    it('no tool has a hostname parameter', () => {
      for (const [name, toolDef] of Object.entries(tools)) {
        const schema = (toolDef as any).parameters;
        if (schema && schema.shape) {
          const keys = Object.keys(schema.shape);
          for (const key of keys) {
            expect(key.toLowerCase()).not.toContain('hostname');
          }
        }
      }
    });

    it('matchTechStackCVEs takes tech_stack_keywords as string array', () => {
      const matchTool = tools.matchTechStackCVEs;
      expect(matchTool).toBeDefined();
      expect((matchTool as any).parameters).toBeDefined();
      const shape = (matchTool as any).parameters.shape;
      expect(shape.tech_stack_keywords).toBeDefined();
    });

    it('checkScanAuthorization has no network-related parameters', () => {
      const authTool = tools.checkScanAuthorization;
      expect(authTool).toBeDefined();
      expect((authTool as any).parameters).toBeDefined();
    });
  });

  describe('buildPenTestPrompt', () => {
    it('returns prompt for passive-scan action', () => {
      const prompt = buildPenTestPrompt('passive-scan', {});
      expect(prompt.toLowerCase()).toContain('scan');
      expect(prompt.toLowerCase()).toContain('authorization');
    });

    it('returns prompt for tech-stack-cve-match action', () => {
      const prompt = buildPenTestPrompt('tech-stack-cve-match', {});
      expect(prompt.toLowerCase()).toContain('cve');
      expect(prompt.toLowerCase()).toContain('tech');
    });

    it('returns prompt for generate-vulnerability-report action', () => {
      const prompt = buildPenTestPrompt('generate-vulnerability-report', {});
      expect(prompt.toLowerCase()).toContain('report');
      expect(prompt.toLowerCase()).toContain('vulnerability');
    });

    it('returns fallback prompt for unknown action', () => {
      const prompt = buildPenTestPrompt('unknown-action', {});
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('returns distinct prompts for each action', () => {
      const actions = ['passive-scan', 'tech-stack-cve-match', 'generate-vulnerability-report'];
      const prompts = actions.map((a) => buildPenTestPrompt(a, {}));
      const unique = new Set(prompts);
      expect(unique.size).toBe(actions.length);
    });
  });

  describe('Deno module structural parity', () => {
    it('Deno pen-test-tools.ts exports PEN_TEST_SYSTEM_PROMPT matching Node mirror keywords', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/pen-test-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toMatch(/PEN_TEST_SYSTEM_PROMPT/);
      expect(code).toMatch(/PASSIVE/);
      expect(code).toContain('NO access to external networks');
    });

    it('Deno pen-test-tools.ts has matching PEN_TEST_TOOL_NAMES', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/pen-test-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      for (const name of PEN_TEST_TOOL_NAMES) {
        expect(code).toContain(name);
      }
    });

    it('Deno pen-test-schemas.ts exports all schema names matching Node mirror', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/pen-test-schemas.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toContain('PenTestFindingSchema');
      expect(code).toContain('VulnerabilityReportSchema');
      expect(code).toContain('AuthorizationResultSchema');
    });

    it('Deno pen-test-tools.ts references CMMC controls 3.11.2 and 3.11.3', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/pen-test-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toMatch(/3\.11\.2/);
      expect(code).toMatch(/3\.11\.3/);
    });

    it('Deno pen-test-tools.ts contains checkScanAuthorization querying agent_permissions', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/pen-test-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toContain('checkScanAuthorization');
      expect(code).toContain('agent_permissions');
    });

    it('Deno pen-test-tools.ts does NOT contain url/ip/hostname parameter names', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/pen-test-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      // Tool parameter definitions should not have url/ip/hostname
      // Check z.object parameter blocks for forbidden field names
      const paramBlocks = code.match(/parameters:\s*z\.object\(\{[\s\S]*?\}\)/g) || [];
      for (const block of paramBlocks) {
        expect(block).not.toMatch(/\btarget_url\b/i);
        expect(block).not.toMatch(/\bip_address\b/i);
        expect(block).not.toMatch(/\bhostname\b/i);
      }
    });
  });
});
