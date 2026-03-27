import { describe, it, expect, vi } from 'vitest';

/**
 * Threat Intelligence agent tests.
 *
 * Tests the system prompt content, tool factory shape, prompt builder,
 * tool name array, and CWE-to-CMMC-family heuristic mapping.
 * These tests validate Threat Intel domain logic without requiring
 * a live Supabase connection or LLM API call.
 *
 * Import strategy: Uses vitest-compatible re-export (threat-intel-tools-testable.ts)
 * that mirrors supabase/functions/_shared/threat-intel-tools.ts with standard imports.
 */
import {
  THREAT_INTEL_SYSTEM_PROMPT,
  THREAT_INTEL_TOOL_NAMES,
  buildThreatIntelPrompt,
  createThreatIntelTools,
  CWE_TO_CMMC_FAMILY,
} from '../threat-intel-tools-testable';

describe('Threat Intel Agent', () => {
  describe('THREAT_INTEL_SYSTEM_PROMPT', () => {
    it('contains "threat brief" methodology reference', () => {
      expect(THREAT_INTEL_SYSTEM_PROMPT.toLowerCase()).toContain('threat brief');
    });

    it('contains "tech stack" context awareness reference', () => {
      expect(THREAT_INTEL_SYSTEM_PROMPT.toLowerCase()).toContain('tech stack');
    });

    it('contains "CWE" classification reference', () => {
      expect(THREAT_INTEL_SYSTEM_PROMPT).toMatch(/CWE/i);
    });

    it('contains "IOC" tracking reference', () => {
      expect(THREAT_INTEL_SYSTEM_PROMPT).toMatch(/IOC/i);
    });

    it('contains "CMMC" compliance mapping reference', () => {
      expect(THREAT_INTEL_SYSTEM_PROMPT).toMatch(/CMMC/i);
    });

    it('contains "attack surface" mapping reference', () => {
      expect(THREAT_INTEL_SYSTEM_PROMPT.toLowerCase()).toContain('attack surface');
    });
  });

  describe('THREAT_INTEL_TOOL_NAMES', () => {
    it('contains exactly 6 tool names', () => {
      expect(THREAT_INTEL_TOOL_NAMES).toHaveLength(6);
    });

    it('includes all required Threat Intel tools', () => {
      expect(THREAT_INTEL_TOOL_NAMES).toContain('queryRecentCVEs');
      expect(THREAT_INTEL_TOOL_NAMES).toContain('getCompanyTechStack');
      expect(THREAT_INTEL_TOOL_NAMES).toContain('saveThreatBrief');
      expect(THREAT_INTEL_TOOL_NAMES).toContain('trackIOCs');
      expect(THREAT_INTEL_TOOL_NAMES).toContain('getControlsByFamily');
      expect(THREAT_INTEL_TOOL_NAMES).toContain('getCweToCmmcMapping');
    });
  });

  describe('buildThreatIntelPrompt', () => {
    it('returns appropriate prompt for generate-threat-brief action', () => {
      const prompt = buildThreatIntelPrompt('generate-threat-brief', {
        company_id: 'test-co',
      });
      expect(prompt.toLowerCase()).toContain('threat');
      expect(prompt.toLowerCase()).toContain('brief');
    });

    it('returns appropriate prompt for scan-iocs action', () => {
      const prompt = buildThreatIntelPrompt('scan-iocs', {
        company_id: 'test-co',
      });
      expect(prompt.toLowerCase()).toContain('ioc');
    });

    it('returns appropriate prompt for map-attack-surface action', () => {
      const prompt = buildThreatIntelPrompt('map-attack-surface', {
        company_id: 'test-co',
      });
      expect(prompt.toLowerCase()).toContain('attack surface');
    });

    it('returns default prompt for unknown action', () => {
      const prompt = buildThreatIntelPrompt('unknown-action', {});
      expect(prompt.toLowerCase()).toContain('threat');
    });
  });

  describe('createThreatIntelTools', () => {
    it('returns an object with all 6 expected tool keys', () => {
      const mockSupabase = { from: vi.fn() } as any;
      const mockTask = { company_id: 'test-co', id: 'task-1', input: {} } as any;
      const tools = createThreatIntelTools(mockSupabase, mockTask);

      expect(Object.keys(tools)).toHaveLength(6);
      THREAT_INTEL_TOOL_NAMES.forEach((name) => {
        expect(tools).toHaveProperty(name);
      });
    });

    it('each tool has description and parameters property (AI SDK tool shape)', () => {
      const mockSupabase = { from: vi.fn() } as any;
      const mockTask = { company_id: 'test-co', id: 'task-1', input: {} } as any;
      const tools = createThreatIntelTools(mockSupabase, mockTask);

      for (const [name, toolDef] of Object.entries(tools)) {
        expect(toolDef).toHaveProperty('description');
        expect(toolDef).toHaveProperty('parameters');
      }
    });
  });

  describe('CWE_TO_CMMC_FAMILY', () => {
    // Valid NIST 800-171 control family IDs
    const VALID_FAMILY_IDS = [
      'AC', 'AT', 'AU', 'CM', 'IA', 'IR', 'MA', 'MP', 'PE', 'PS', 'RA', 'CA', 'SC', 'SI',
    ];

    it('maps CWE-287 (Improper Authentication) to IA and AC families', () => {
      const entry = CWE_TO_CMMC_FAMILY['CWE-287'];
      expect(entry).toBeDefined();
      expect(entry.families).toContain('IA');
      expect(entry.families).toContain('AC');
    });

    it('maps CWE-79 (XSS) to SI and SC families', () => {
      const entry = CWE_TO_CMMC_FAMILY['CWE-79'];
      expect(entry).toBeDefined();
      expect(entry.families).toContain('SI');
      expect(entry.families).toContain('SC');
    });

    it('maps CWE-89 (SQL Injection) to SI family', () => {
      const entry = CWE_TO_CMMC_FAMILY['CWE-89'];
      expect(entry).toBeDefined();
      expect(entry.families).toContain('SI');
    });

    it('does not exceed 25 entries (Pitfall 3 -- avoid over-engineering)', () => {
      expect(Object.keys(CWE_TO_CMMC_FAMILY).length).toBeLessThanOrEqual(25);
    });

    it('has at least 15 entries for reasonable coverage', () => {
      expect(Object.keys(CWE_TO_CMMC_FAMILY).length).toBeGreaterThanOrEqual(15);
    });

    it('all family values are valid NIST 800-171 family IDs', () => {
      for (const [cweId, entry] of Object.entries(CWE_TO_CMMC_FAMILY)) {
        for (const family of entry.families) {
          expect(VALID_FAMILY_IDS).toContain(family);
        }
      }
    });

    it('each entry has a non-empty description', () => {
      for (const [cweId, entry] of Object.entries(CWE_TO_CMMC_FAMILY)) {
        expect(entry.description).toBeDefined();
        expect(entry.description.length).toBeGreaterThan(0);
      }
    });

    it('each entry has at least one family mapping', () => {
      for (const [cweId, entry] of Object.entries(CWE_TO_CMMC_FAMILY)) {
        expect(entry.families.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
