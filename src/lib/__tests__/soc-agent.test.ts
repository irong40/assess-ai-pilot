import { describe, it, expect, vi } from 'vitest';

/**
 * SOC Analyst agent tests.
 *
 * Tests the system prompt content, tool factory shape, prompt builder, and
 * tool name array. These tests validate SOC domain logic without requiring
 * a live Supabase connection or LLM API call.
 *
 * Import strategy: Uses vitest-compatible re-export (soc-tools-testable.ts)
 * that mirrors supabase/functions/_shared/soc-tools.ts with standard imports.
 */
import {
  SOC_SYSTEM_PROMPT,
  SOC_TOOL_NAMES,
  buildSocPrompt,
  createSocTools,
} from '../soc-tools-testable';

describe('SOC Analyst Agent', () => {
  describe('SOC_SYSTEM_PROMPT', () => {
    it('contains "triage" methodology reference', () => {
      expect(SOC_SYSTEM_PROMPT.toLowerCase()).toContain('triage');
    });

    it('contains "false positive" classification reference', () => {
      expect(SOC_SYSTEM_PROMPT.toLowerCase()).toContain('false positive');
    });

    it('contains "tech stack" context awareness reference', () => {
      expect(SOC_SYSTEM_PROMPT.toLowerCase()).toContain('tech stack');
    });

    it('contains "escalat" reference for IR flagging', () => {
      expect(SOC_SYSTEM_PROMPT.toLowerCase()).toContain('escalat');
    });

    it('contains "CVSS" scoring reference', () => {
      expect(SOC_SYSTEM_PROMPT).toMatch(/cvss/i);
    });

    it('contains 4-step false positive reasoning chain', () => {
      // Per research Pitfall 2: reasoning chain with 4 steps
      const prompt = SOC_SYSTEM_PROMPT.toLowerCase();
      expect(prompt).toContain('tech stack match');
      expect(prompt).toContain('compensating control');
      expect(prompt).toContain('cvss context');
      expect(prompt).toContain('classification decision');
    });
  });

  describe('SOC_TOOL_NAMES', () => {
    it('contains exactly 5 tool names', () => {
      expect(SOC_TOOL_NAMES).toHaveLength(5);
    });

    it('includes all required SOC tools', () => {
      expect(SOC_TOOL_NAMES).toContain('queryRecentCVEs');
      expect(SOC_TOOL_NAMES).toContain('getCompanyTechStack');
      expect(SOC_TOOL_NAMES).toContain('queryAssessmentGaps');
      expect(SOC_TOOL_NAMES).toContain('createSocAlert');
      expect(SOC_TOOL_NAMES).toContain('correlateFindingsByPatterns');
    });
  });

  describe('buildSocPrompt', () => {
    it('returns appropriate prompt for triage-alerts action', () => {
      const prompt = buildSocPrompt('triage-alerts', {
        company_id: 'test-co',
        days_back: 7,
      });
      expect(prompt.toLowerCase()).toContain('triage');
      expect(prompt.toLowerCase()).toContain('alert');
    });

    it('returns appropriate prompt for correlate-findings action', () => {
      const prompt = buildSocPrompt('correlate-findings', {
        alert_ids: ['alert-1', 'alert-2'],
      });
      expect(prompt.toLowerCase()).toContain('correlat');
    });

    it('returns appropriate prompt for classify-alert action', () => {
      const prompt = buildSocPrompt('classify-alert', {
        alert_id: 'alert-1',
      });
      expect(prompt.toLowerCase()).toContain('classif');
    });

    it('returns default prompt for unknown action', () => {
      const prompt = buildSocPrompt('unknown-action', {});
      expect(prompt.toLowerCase()).toContain('soc');
    });
  });

  describe('createSocTools', () => {
    it('returns an object with all 5 expected tool keys', () => {
      const mockSupabase = { from: vi.fn() } as any;
      const mockTask = { company_id: 'test-co', id: 'task-1', input: {} } as any;
      const tools = createSocTools(mockSupabase, mockTask);

      expect(Object.keys(tools)).toHaveLength(5);
      SOC_TOOL_NAMES.forEach((name) => {
        expect(tools).toHaveProperty(name);
      });
    });

    it('each tool has description and parameters property (AI SDK tool shape)', () => {
      const mockSupabase = { from: vi.fn() } as any;
      const mockTask = { company_id: 'test-co', id: 'task-1', input: {} } as any;
      const tools = createSocTools(mockSupabase, mockTask);

      for (const [name, toolDef] of Object.entries(tools)) {
        expect(toolDef).toHaveProperty('description');
        expect(toolDef).toHaveProperty('parameters');
      }
    });
  });
});
