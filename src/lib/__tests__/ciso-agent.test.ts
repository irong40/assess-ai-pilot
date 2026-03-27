import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for CISO Orchestrator agent: system prompt, tools, and delegation logic.
 *
 * Tests are split into:
 * 1. Structural tests - verify the Deno Edge Function source code has expected patterns
 * 2. Unit tests - verify testable exports (prompt, prompt builder, tool factory shape)
 */
import {
  CISO_SYSTEM_PROMPT,
  buildCisoPrompt,
  CISO_TOOL_NAMES,
} from '../ciso-tools';

describe('CISO Agent', () => {
  describe('CISO_SYSTEM_PROMPT', () => {
    it('contains delegation rules referencing GRC agent', () => {
      expect(CISO_SYSTEM_PROMPT).toContain('delegate');
      expect(CISO_SYSTEM_PROMPT).toMatch(/GRC/i);
    });

    it('contains priority ordering rules (critical controls first)', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/critical.*control/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/priority/i);
    });

    it('contains escalation rules for high-risk findings', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/high.risk|risk_level.*high|escalat/i);
    });

    it('specifies CISO should never perform detailed analysis directly', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/never.*perform.*detailed|never.*direct.*analysis/i);
    });

    it('mentions key critical controls (MFA, FIPS, IR, audit, SSP)', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/MFA/);
      expect(CISO_SYSTEM_PROMPT).toMatch(/FIPS/);
      expect(CISO_SYSTEM_PROMPT).toMatch(/incident.*response/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/audit.*log/i);
    });
  });

  describe('CISO_TOOL_NAMES', () => {
    it('exports expected tool names including delegateToSOC', () => {
      expect(CISO_TOOL_NAMES).toContain('delegateToGRC');
      expect(CISO_TOOL_NAMES).toContain('delegateToSOC');
      expect(CISO_TOOL_NAMES).toContain('readCompletedTaskResults');
      expect(CISO_TOOL_NAMES).toContain('getCurrentRiskPosture');
      expect(CISO_TOOL_NAMES).toContain('createFollowUpTask');
    });

    it('contains exactly 5 tools', () => {
      expect(CISO_TOOL_NAMES).toHaveLength(5);
    });
  });

  describe('buildCisoPrompt', () => {
    it('returns different prompts for each action type', () => {
      const actions = [
        'run-compliance-assessment',
        'synthesize-results',
        'generate-executive-summary',
        'assess-risk-posture',
      ];
      const prompts = actions.map((a) => buildCisoPrompt(a, {}));
      // All prompts should be distinct
      const uniquePrompts = new Set(prompts);
      expect(uniquePrompts.size).toBe(actions.length);
    });

    it('includes assessment_id in compliance assessment prompt when provided', () => {
      const prompt = buildCisoPrompt('run-compliance-assessment', {
        assessment_id: 'abc-123',
        cmmc_level: 2,
      });
      expect(prompt).toContain('abc-123');
      expect(prompt).toContain('2');
    });

    it('returns fallback prompt for unknown action', () => {
      const prompt = buildCisoPrompt('unknown-action', {});
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('CISO SOC Delegation', () => {
    it('CISO_SYSTEM_PROMPT contains SOC Analyst delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/SOC.*Analyst.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToSOC/i);
    });

    it('CISO_SYSTEM_PROMPT mentions triage-alerts delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/triage.alerts/i);
    });

    it('buildCisoPrompt returns appropriate prompt for triage-alerts action', () => {
      const prompt = buildCisoPrompt('triage-alerts', {
        company_id: 'test-co',
      });
      expect(prompt.toLowerCase()).toContain('triage');
      expect(prompt.toLowerCase()).toContain('soc');
    });
  });

  describe('CISO Edge Function structure', () => {
    it('imports executeAgentTask and delegateTask from agent-base.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-ciso-orchestrator/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*executeAgentTask.*agent-base/s);
      expect(code).toMatch(/import.*delegateTask.*agent-base/s);
    });

    it('imports CISO_SYSTEM_PROMPT from ciso-tools.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-ciso-orchestrator/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*CISO_SYSTEM_PROMPT.*ciso-tools/s);
    });

    it('uses anthropic claude model for text generation', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-ciso-orchestrator/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/anthropic\(["']claude/);
    });

    it('handles run-compliance-assessment, synthesize-results, executive-summary, and risk-posture actions', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-ciso-orchestrator/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toContain('run-compliance-assessment');
      expect(code).toContain('synthesize-results');
      expect(code).toContain('generate-executive-summary');
      expect(code).toContain('assess-risk-posture');
    });
  });

  describe('SOC Analyst Edge Function structure', () => {
    it('imports executeAgentTask from agent-base.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-soc-analyst/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*executeAgentTask.*agent-base/s);
    });

    it('imports SOC_SYSTEM_PROMPT and createSocTools from soc-tools.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-soc-analyst/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*SOC_SYSTEM_PROMPT.*soc-tools/s);
      expect(code).toMatch(/import.*createSocTools.*soc-tools/s);
    });

    it('imports SocTriageResultSchema from soc-schemas.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-soc-analyst/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*SocTriageResultSchema.*soc-schemas/s);
    });

    it('uses anthropic claude model for text generation', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-soc-analyst/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/anthropic\(["']claude/);
    });

    it('uses maxSteps: 8 for timeout avoidance', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-soc-analyst/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/maxSteps:\s*8/);
    });

    it('uses Deno.serve pattern', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-soc-analyst/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/Deno\.serve/);
    });
  });
});
