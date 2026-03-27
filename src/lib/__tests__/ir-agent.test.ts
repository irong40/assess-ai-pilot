import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for IR agent handler, tools, and system prompt.
 *
 * Validates:
 * - IR_SYSTEM_PROMPT contains NIST 800-61r2 lifecycle keywords
 * - IR_SYSTEM_PROMPT mandates human approval
 * - IR_TOOL_NAMES has 5 domain tools
 * - buildIrPrompt produces action-specific prompts
 * - Node mirror matches Deno module structural parity
 */
import {
  IR_SYSTEM_PROMPT,
  IR_TOOL_NAMES,
  buildIrPrompt,
} from '../ir-tools-testable';

describe('IR Agent', () => {
  describe('IR_SYSTEM_PROMPT', () => {
    it('contains NIST 800-61r2 four-phase lifecycle keywords', () => {
      expect(IR_SYSTEM_PROMPT).toMatch(/detect/i);
      expect(IR_SYSTEM_PROMPT).toMatch(/contain/i);
      expect(IR_SYSTEM_PROMPT).toMatch(/eradicate/i);
      expect(IR_SYSTEM_PROMPT).toMatch(/recover/i);
    });

    it('references NIST SP 800-61r2', () => {
      expect(IR_SYSTEM_PROMPT).toMatch(/NIST.*800-61/i);
    });

    it('mandates human approval for ALL actions', () => {
      expect(IR_SYSTEM_PROMPT).toMatch(/ALL.*require.*human.*approval|ALL.*actions.*require.*human.*approval|require.*human.*approval/i);
    });

    it('explicitly states all tasks are high risk', () => {
      expect(IR_SYSTEM_PROMPT).toMatch(/risk_level.*high|high.*risk/i);
    });

    it('references CMMC controls 3.6.1, 3.6.2, 3.6.3', () => {
      expect(IR_SYSTEM_PROMPT).toContain('3.6.1');
      expect(IR_SYSTEM_PROMPT).toContain('3.6.2');
      expect(IR_SYSTEM_PROMPT).toContain('3.6.3');
    });

    it('describes the IR agent role for ASSESS-AI', () => {
      expect(IR_SYSTEM_PROMPT).toMatch(/incident.*response/i);
      expect(IR_SYSTEM_PROMPT).toMatch(/ASSESS-AI|CMMC/i);
    });
  });

  describe('IR_TOOL_NAMES', () => {
    it('has exactly 5 domain tools', () => {
      expect(IR_TOOL_NAMES).toHaveLength(5);
    });

    it('includes getEscalatedIncidents', () => {
      expect(IR_TOOL_NAMES).toContain('getEscalatedIncidents');
    });

    it('includes getIncidentContext', () => {
      expect(IR_TOOL_NAMES).toContain('getIncidentContext');
    });

    it('includes createIrIncident', () => {
      expect(IR_TOOL_NAMES).toContain('createIrIncident');
    });

    it('includes saveContainmentPlan', () => {
      expect(IR_TOOL_NAMES).toContain('saveContainmentPlan');
    });

    it('includes savePostIncidentReport', () => {
      expect(IR_TOOL_NAMES).toContain('savePostIncidentReport');
    });
  });

  describe('buildIrPrompt', () => {
    it('returns prompt for analyze-incident action', () => {
      const prompt = buildIrPrompt('analyze-incident', {});
      expect(prompt.toLowerCase()).toContain('incident');
      expect(prompt.toLowerCase()).toContain('analyze');
    });

    it('returns prompt for generate-playbook action', () => {
      const prompt = buildIrPrompt('generate-playbook', {
        incident_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(prompt.toLowerCase()).toContain('playbook');
    });

    it('returns prompt for create-post-incident-report action', () => {
      const prompt = buildIrPrompt('create-post-incident-report', {
        incident_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(prompt.toLowerCase()).toContain('report');
    });

    it('returns fallback prompt for unknown action', () => {
      const prompt = buildIrPrompt('unknown-action', {});
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('includes incident_id in prompt when provided', () => {
      const prompt = buildIrPrompt('generate-playbook', {
        incident_id: 'test-id-123',
      });
      expect(prompt).toContain('test-id-123');
    });

    it('returns distinct prompts for each action', () => {
      const actions = ['analyze-incident', 'generate-playbook', 'create-post-incident-report'];
      const prompts = actions.map((a) => buildIrPrompt(a, {}));
      const unique = new Set(prompts);
      expect(unique.size).toBe(actions.length);
    });
  });

  describe('Deno module structural parity', () => {
    it('Deno ir-tools.ts exports IR_SYSTEM_PROMPT matching Node mirror keywords', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ir-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      // Same NIST keywords
      expect(code).toMatch(/detect/i);
      expect(code).toMatch(/contain/i);
      expect(code).toMatch(/eradicate/i);
      expect(code).toMatch(/recover/i);
      // Same approval mandate
      expect(code).toMatch(/human.*approval/i);
      // Same CMMC controls
      expect(code).toContain('3.6.1');
      expect(code).toContain('3.6.2');
      expect(code).toContain('3.6.3');
    });

    it('Deno ir-tools.ts has matching IR_TOOL_NAMES', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ir-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      for (const name of IR_TOOL_NAMES) {
        expect(code).toContain(name);
      }
    });

    it('Deno ir-schemas.ts exports all schema names matching Node mirror', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ir-schemas.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toContain('IncidentTypeSchema');
      expect(code).toContain('ContainmentRecommendationSchema');
      expect(code).toContain('PlaybookGuidanceSchema');
      expect(code).toContain('PostIncidentReportSchema');
      expect(code).toContain('IrAnalysisResultSchema');
    });
  });
});
