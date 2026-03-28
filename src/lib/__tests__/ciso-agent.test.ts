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
    it('exports expected tool names including delegateToSOC and delegateToThreatIntel', () => {
      expect(CISO_TOOL_NAMES).toContain('delegateToGRC');
      expect(CISO_TOOL_NAMES).toContain('delegateToSOC');
      expect(CISO_TOOL_NAMES).toContain('delegateToThreatIntel');
      expect(CISO_TOOL_NAMES).toContain('readCompletedTaskResults');
      expect(CISO_TOOL_NAMES).toContain('getCurrentRiskPosture');
      expect(CISO_TOOL_NAMES).toContain('createFollowUpTask');
    });

    it('includes delegateToIR for incident response delegation', () => {
      expect(CISO_TOOL_NAMES).toContain('delegateToIR');
    });

    it('includes delegateToAppSec for application security delegation', () => {
      expect(CISO_TOOL_NAMES).toContain('delegateToAppSec');
    });

    it('includes delegateToPenTest for pen test delegation', () => {
      expect(CISO_TOOL_NAMES).toContain('delegateToPenTest');
    });

    it('contains exactly 9 tools (6 delegations + 3 utility = complete 7-agent team)', () => {
      expect(CISO_TOOL_NAMES).toHaveLength(9);
    });

    it('has all 6 specialist delegation tools', () => {
      const delegationTools = CISO_TOOL_NAMES.filter((n: string) => n.startsWith('delegateTo'));
      expect(delegationTools).toHaveLength(6);
      expect(delegationTools).toContain('delegateToGRC');
      expect(delegationTools).toContain('delegateToSOC');
      expect(delegationTools).toContain('delegateToThreatIntel');
      expect(delegationTools).toContain('delegateToIR');
      expect(delegationTools).toContain('delegateToAppSec');
      expect(delegationTools).toContain('delegateToPenTest');
    });

    it('has all 3 utility tools', () => {
      expect(CISO_TOOL_NAMES).toContain('readCompletedTaskResults');
      expect(CISO_TOOL_NAMES).toContain('getCurrentRiskPosture');
      expect(CISO_TOOL_NAMES).toContain('createFollowUpTask');
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

  describe('CISO Threat Intel Delegation', () => {
    it('CISO_SYSTEM_PROMPT contains Threat Intelligence delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Threat.*Intelligence.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToThreatIntel/i);
    });

    it('CISO_SYSTEM_PROMPT mentions generate-threat-brief delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/generate-threat-brief/i);
    });

    it('CISO_SYSTEM_PROMPT mentions scan-iocs delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/scan-iocs/i);
    });

    it('CISO_SYSTEM_PROMPT mentions map-attack-surface delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/map-attack-surface/i);
    });

    it('CISO_SYSTEM_PROMPT mentions CWE categorization in threat briefs', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/CWE/i);
    });

    it('buildCisoPrompt returns appropriate prompt for generate-threat-brief action', () => {
      const prompt = buildCisoPrompt('generate-threat-brief', {});
      expect(prompt.toLowerCase()).toContain('threat');
      expect(prompt.toLowerCase()).toContain('intel');
    });

    it('buildCisoPrompt returns appropriate prompt for security-posture-review action', () => {
      const prompt = buildCisoPrompt('security-posture-review', {});
      expect(prompt.toLowerCase()).toContain('threat');
      expect(prompt.toLowerCase()).toContain('soc');
      expect(prompt.toLowerCase()).toContain('grc');
    });
  });

  describe('CISO IR Delegation', () => {
    it('CISO_SYSTEM_PROMPT contains Incident Response Delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Incident.*Response.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToIR/i);
    });

    it('CISO_SYSTEM_PROMPT mentions analyze-incident action', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/analyze-incident/i);
    });

    it('CISO_SYSTEM_PROMPT mentions generate-playbook action', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/generate-playbook/i);
    });

    it('CISO_SYSTEM_PROMPT mentions create-post-incident-report action', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/create-post-incident-report/i);
    });

    it('CISO_SYSTEM_PROMPT mentions IR tasks are high-risk', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/IR.*high.risk|high.risk.*IR|all.*IR.*tasks/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing GRC delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Delegation Rules/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToGRC/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing SOC delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/SOC.*Analyst.*Delegation/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing Threat Intel delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Threat.*Intelligence.*Delegation/i);
    });

    it('buildCisoPrompt returns appropriate prompt for handle-incident action', () => {
      const prompt = buildCisoPrompt('handle-incident', {});
      expect(prompt.toLowerCase()).toContain('incident');
    });

    it('buildCisoPrompt returns appropriate prompt for post-incident-review action', () => {
      const prompt = buildCisoPrompt('post-incident-review', {});
      expect(prompt.toLowerCase()).toContain('incident');
      expect(prompt.toLowerCase()).toContain('report');
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

  describe('Threat Intel Edge Function structure', () => {
    it('imports executeAgentTask from agent-base.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-threat-intel/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*executeAgentTask.*agent-base/s);
    });

    it('imports THREAT_INTEL_SYSTEM_PROMPT and createThreatIntelTools from threat-intel-tools.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-threat-intel/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*THREAT_INTEL_SYSTEM_PROMPT.*threat-intel-tools/s);
      expect(code).toMatch(/import.*createThreatIntelTools.*threat-intel-tools/s);
    });

    it('imports ThreatAnalysisResultSchema from threat-intel-schemas.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-threat-intel/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*ThreatAnalysisResultSchema.*threat-intel-schemas/s);
    });

    it('uses anthropic claude model for text generation', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-threat-intel/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/anthropic\(["']claude/);
    });

    it('uses maxSteps: 8 for timeout avoidance', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-threat-intel/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/maxSteps:\s*8/);
    });

    it('uses Deno.serve pattern', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-threat-intel/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/Deno\.serve/);
    });

    it('uses buildThreatIntelPrompt for action-specific prompts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-threat-intel/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/buildThreatIntelPrompt/);
    });
  });

  describe('IR Edge Function structure', () => {
    it('imports executeAgentTask from agent-base.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-incident-response/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*executeAgentTask.*agent-base/s);
    });

    it('imports IR_SYSTEM_PROMPT and createIrTools from ir-tools.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-incident-response/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*IR_SYSTEM_PROMPT.*ir-tools/s);
      expect(code).toMatch(/import.*createIrTools.*ir-tools/s);
    });

    it('imports IrAnalysisResultSchema from ir-schemas.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-incident-response/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*IrAnalysisResultSchema.*ir-schemas/s);
    });

    it('uses anthropic claude model for text generation', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-incident-response/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/anthropic\(["']claude/);
    });

    it('uses maxSteps: 8 for timeout avoidance', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-incident-response/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/maxSteps:\s*8/);
    });

    it('uses Deno.serve pattern', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-incident-response/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/Deno\.serve/);
    });

    it('uses buildIrPrompt for action-specific prompts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-incident-response/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/buildIrPrompt/);
    });
  });

  describe('CISO AppSec Delegation', () => {
    it('CISO_SYSTEM_PROMPT contains AppSec Engineer Delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/AppSec.*Engineer.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToAppSec/i);
    });

    it('CISO_SYSTEM_PROMPT mentions scan-dependencies delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/scan-dependencies/i);
    });

    it('CISO_SYSTEM_PROMPT mentions review-config delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/review-config/i);
    });

    it('CISO_SYSTEM_PROMPT mentions security-review delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/security-review/i);
    });

    it('CISO_SYSTEM_PROMPT mentions CMMC control families AC, SI, CM for AppSec', () => {
      // The AppSec delegation section references these control families
      expect(CISO_SYSTEM_PROMPT).toMatch(/AC.*SI.*CM|AC.*CM|SI.*CM/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing GRC delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Delegation Rules/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToGRC/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing SOC delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/SOC.*Analyst.*Delegation/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing Threat Intel delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Threat.*Intelligence.*Delegation/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing IR delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Incident.*Response.*Delegation/i);
    });

    it('buildCisoPrompt returns appropriate prompt for scan-dependencies action', () => {
      const prompt = buildCisoPrompt('scan-dependencies', {});
      expect(prompt.toLowerCase()).toContain('scan');
      expect(prompt.toLowerCase()).toContain('dependenc');
      expect(prompt.toLowerCase()).toContain('appsec');
    });

    it('buildCisoPrompt returns appropriate prompt for security-review action', () => {
      const prompt = buildCisoPrompt('security-review', {});
      expect(prompt.toLowerCase()).toContain('security');
      expect(prompt.toLowerCase()).toContain('review');
      expect(prompt.toLowerCase()).toContain('appsec');
    });
  });

  describe('AppSec Edge Function structure', () => {
    it('imports executeAgentTask from agent-base.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-appsec/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*executeAgentTask.*agent-base/s);
    });

    it('imports APPSEC_SYSTEM_PROMPT and createAppSecTools from appsec-tools.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-appsec/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*APPSEC_SYSTEM_PROMPT.*appsec-tools/s);
      expect(code).toMatch(/import.*createAppSecTools.*appsec-tools/s);
    });

    it('imports SecurityReviewReportSchema from appsec-schemas.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-appsec/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*SecurityReviewReportSchema.*appsec-schemas/s);
    });

    it('uses anthropic claude model for text generation', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-appsec/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/anthropic\(["']claude/);
    });

    it('uses maxSteps: 8 for timeout avoidance', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-appsec/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/maxSteps:\s*8/);
    });

    it('uses Deno.serve pattern', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-appsec/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/Deno\.serve/);
    });

    it('uses buildAppSecPrompt for action-specific prompts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-appsec/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/buildAppSecPrompt/);
    });
  });

  describe('CISO Deno module structural parity', () => {
    it('Deno ciso-tools.ts has delegateToIR in CISO_TOOL_NAMES', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toContain('delegateToIR');
    });

    it('Deno ciso-tools.ts has delegateToAppSec in CISO_TOOL_NAMES', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toContain('delegateToAppSec');
    });

    it('Deno ciso-tools.ts has IR delegation section in CISO_SYSTEM_PROMPT', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toMatch(/Incident.*Response.*Delegation/i);
    });

    it('Deno ciso-tools.ts has AppSec delegation section in CISO_SYSTEM_PROMPT', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toMatch(/AppSec.*Engineer.*Delegation/i);
    });

    it('Deno ciso-tools.ts imports delegateTask from agent-base.ts', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toMatch(/import.*delegateTask.*agent-base/s);
    });

    it('Deno ciso-tools.ts hardcodes risk_level high for IR delegation', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      // The delegateToIR section should contain risk_level: 'high'
      expect(code).toMatch(/risk_level.*high/i);
    });

    it('Deno ciso-tools.ts has delegateToPenTest in CISO_TOOL_NAMES', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toContain('delegateToPenTest');
    });

    it('Deno ciso-tools.ts has Pen Test delegation section in CISO_SYSTEM_PROMPT', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      expect(code).toMatch(/Pen\s*Test\s*Delegation/i);
    });

    it('Deno ciso-tools.ts has exactly 9 tool names', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      // Count delegateToX entries in the CISO_TOOL_NAMES array
      const toolNamesMatch = code.match(/CISO_TOOL_NAMES\s*=\s*\[[\s\S]*?\]\s*as\s*const/);
      expect(toolNamesMatch).toBeTruthy();
      const entries = toolNamesMatch![0].match(/"/g);
      // Each tool name is quoted, so count pairs
      expect(entries!.length).toBe(18); // 9 tools * 2 quotes each
    });

    it('Deno ciso-tools.ts hardcodes risk_level high for Pen Test delegation', () => {
      const denoPath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/ciso-tools.ts'
      );
      const code = fs.readFileSync(denoPath, 'utf-8');
      // The delegateToPenTest section should contain risk_level: 'high'
      const penTestSection = code.substring(code.indexOf('delegateToPenTest'));
      expect(penTestSection).toMatch(/risk_level.*"high"/i);
    });
  });

  describe('CISO Pen Test Delegation', () => {
    it('CISO_SYSTEM_PROMPT contains Pen Test Delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Pen\s*Test\s*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToPenTest/i);
    });

    it('CISO_SYSTEM_PROMPT mentions passive-scan delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/passive-scan/i);
    });

    it('CISO_SYSTEM_PROMPT mentions tech-stack-cve-match delegation', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/tech-stack-cve-match/i);
    });

    it('CISO_SYSTEM_PROMPT mentions Pen Test tasks are high-risk', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Pen\s*Test.*high.risk|high.risk.*Pen\s*Test|ALL.*Pen\s*Test.*tasks/i);
    });

    it('CISO_SYSTEM_PROMPT mentions PASSIVE ONLY for Pen Test', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/PASSIVE\s*ONLY/i);
    });

    it('CISO_SYSTEM_PROMPT mentions CMMC controls 3.11.2 and 3.11.3', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/3\.11\.2/);
      expect(CISO_SYSTEM_PROMPT).toMatch(/3\.11\.3/);
    });

    it('CISO_SYSTEM_PROMPT preserves existing GRC delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Delegation Rules/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/delegateToGRC/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing SOC delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/SOC.*Analyst.*Delegation/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing Threat Intel delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Threat.*Intelligence.*Delegation/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing IR delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/Incident.*Response.*Delegation/i);
    });

    it('CISO_SYSTEM_PROMPT preserves existing AppSec delegation rules', () => {
      expect(CISO_SYSTEM_PROMPT).toMatch(/AppSec.*Engineer.*Delegation/i);
    });

    it('CISO_SYSTEM_PROMPT has all 6 delegation sections', () => {
      // Verify all delegation sections exist in the prompt
      expect(CISO_SYSTEM_PROMPT).toMatch(/Delegation Rules/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/SOC.*Analyst.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/Threat.*Intelligence.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/Incident.*Response.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/AppSec.*Engineer.*Delegation/i);
      expect(CISO_SYSTEM_PROMPT).toMatch(/Pen\s*Test\s*Delegation/i);
    });

    it('buildCisoPrompt returns appropriate prompt for passive-vulnerability-scan action', () => {
      const prompt = buildCisoPrompt('passive-vulnerability-scan', {});
      expect(prompt.toLowerCase()).toContain('passive');
      expect(prompt.toLowerCase()).toContain('vulnerability');
      expect(prompt.toLowerCase()).toContain('pen test');
    });
  });

  describe('Pen Test Edge Function structure', () => {
    it('imports executeAgentTask from agent-base.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-pen-test/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*executeAgentTask.*agent-base/s);
    });

    it('imports PEN_TEST_SYSTEM_PROMPT and createPenTestTools from pen-test-tools.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-pen-test/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*PEN_TEST_SYSTEM_PROMPT.*pen-test-tools/s);
      expect(code).toMatch(/import.*createPenTestTools.*pen-test-tools/s);
    });

    it('imports VulnerabilityReportSchema from pen-test-schemas.ts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-pen-test/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/import.*VulnerabilityReportSchema.*pen-test-schemas/s);
    });

    it('uses anthropic claude model for text generation', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-pen-test/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/anthropic\(["']claude/);
    });

    it('uses maxSteps: 8 for timeout avoidance', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-pen-test/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/maxSteps:\s*8/);
    });

    it('uses Deno.serve pattern', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-pen-test/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/Deno\.serve/);
    });

    it('uses buildPenTestPrompt for action-specific prompts', () => {
      const edgeFnPath = path.resolve(
        __dirname,
        '../../../supabase/functions/agent-pen-test/index.ts'
      );
      const code = fs.readFileSync(edgeFnPath, 'utf-8');
      expect(code).toMatch(/buildPenTestPrompt/);
    });
  });
});
