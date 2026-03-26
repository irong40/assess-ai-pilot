import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * GRC Analyst agent tests.
 *
 * Tests the system prompt content, tool factory shape, prompt builder, and
 * result storage function. These tests validate the domain logic without
 * requiring a live Supabase connection or LLM API call.
 *
 * Import strategy: The GRC tools module uses Deno npm: specifiers. We use
 * a vitest-compatible re-export (grc-tools-testable.ts) that extracts the
 * testable parts (prompts, tool names, builders) using standard imports.
 */
import {
  GRC_SYSTEM_PROMPT,
  GRC_TOOL_NAMES,
  buildPromptForAction,
  createGrcTools,
  storeGrcResult,
} from '../grc-tools-testable';

describe('GRC Analyst Agent', () => {
  describe('GRC_SYSTEM_PROMPT', () => {
    it('contains "objective-level evaluation" text', () => {
      expect(GRC_SYSTEM_PROMPT.toLowerCase()).toContain('objective-level');
    });

    it('contains "MET" and "NOT_MET" finding types', () => {
      expect(GRC_SYSTEM_PROMPT).toContain('MET');
      expect(GRC_SYSTEM_PROMPT).toContain('NOT_MET');
    });

    it('contains evidence methods "examine", "interview", "test"', () => {
      expect(GRC_SYSTEM_PROMPT.toLowerCase()).toContain('examine');
      expect(GRC_SYSTEM_PROMPT.toLowerCase()).toContain('interview');
      expect(GRC_SYSTEM_PROMPT.toLowerCase()).toContain('test');
    });

    it('contains SPRS scoring rule text', () => {
      expect(GRC_SYSTEM_PROMPT).toMatch(/sprs/i);
    });

    it('contains POA&M 80/110 minimum rule', () => {
      expect(GRC_SYSTEM_PROMPT).toContain('80');
      expect(GRC_SYSTEM_PROMPT).toContain('110');
    });

    it('contains "14" control families reference', () => {
      expect(GRC_SYSTEM_PROMPT).toContain('14');
    });
  });

  describe('buildPromptForAction', () => {
    it('returns appropriate prompt for gap-analysis action', () => {
      const prompt = buildPromptForAction('gap-analysis', {
        company_id: 'test-co',
        assessment_id: 'test-assess',
      });
      expect(prompt.toLowerCase()).toContain('gap');
      expect(prompt.toLowerCase()).toContain('analysis');
    });

    it('returns appropriate prompt for control-review action', () => {
      const prompt = buildPromptForAction('control-review', {
        control_id: '3.1.1',
      });
      expect(prompt.toLowerCase()).toContain('control');
      expect(prompt.toLowerCase()).toContain('review');
    });

    it('returns appropriate prompt for remediation-plan action', () => {
      const prompt = buildPromptForAction('remediation-plan', {
        finding_ids: ['f1', 'f2'],
      });
      expect(prompt.toLowerCase()).toContain('remediation');
    });

    it('returns appropriate prompt for audit-package action', () => {
      const prompt = buildPromptForAction('audit-package', {
        cmmc_level: 2,
      });
      expect(prompt.toLowerCase()).toContain('audit');
    });
  });

  describe('createGrcTools', () => {
    it('returns an object with all 6 expected tool keys', () => {
      const mockSupabase = { from: vi.fn() } as any;
      const mockTask = { company_id: 'test-co', input: {} } as any;
      const tools = createGrcTools(mockSupabase, mockTask);

      expect(Object.keys(tools)).toHaveLength(6);
      GRC_TOOL_NAMES.forEach((name) => {
        expect(tools).toHaveProperty(name);
      });
    });

    it('each tool has description and parameters property (AI SDK tool shape)', () => {
      const mockSupabase = { from: vi.fn() } as any;
      const mockTask = { company_id: 'test-co', input: {} } as any;
      const tools = createGrcTools(mockSupabase, mockTask);

      for (const [name, toolDef] of Object.entries(tools)) {
        // AI SDK tools created with tool() have these properties
        expect(toolDef).toHaveProperty('description');
        expect(toolDef).toHaveProperty('parameters');
      }
    });
  });

  describe('storeGrcResult', () => {
    it('inserts into gap_analysis_results', async () => {
      const insertFn = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'result-1' }, error: null }) }) });
      const insertFn2 = vi.fn().mockReturnValue({ error: null });
      let callCount = 0;
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'gap_analysis_results') {
            return { insert: insertFn };
          }
          if (table === 'compliance_snapshots') {
            return { insert: insertFn2 };
          }
          return { insert: vi.fn() };
        }),
      } as any;

      const mockTask = {
        id: 'task-1',
        company_id: 'co-1',
        input: { assessment_id: 'assess-1' },
      } as any;

      const mockReport = {
        assessment_date: '2026-03-26',
        cmmc_level: 2,
        scope_family_id: null,
        sprs_score: 85,
        total_controls: 110,
        met_count: 90,
        not_met_count: 15,
        not_applicable_count: 5,
        findings: [],
      };

      await storeGrcResult(mockSupabase, mockTask, mockReport);

      expect(mockSupabase.from).toHaveBeenCalledWith('gap_analysis_results');
      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 'co-1',
          agent_task_id: 'task-1',
          report: mockReport,
          sprs_score_at_analysis: 85,
        })
      );
    });
  });
});
