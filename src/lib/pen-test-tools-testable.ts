/**
 * Vitest-compatible Pen Test tools module.
 *
 * The source of truth is supabase/functions/_shared/pen-test-tools.ts (Deno context).
 * This file mirrors the testable parts using standard npm imports so vitest
 * can import without Deno npm: specifier resolution issues.
 *
 * Exports: PEN_TEST_SYSTEM_PROMPT, PEN_TEST_TOOL_NAMES, createPenTestTools,
 *          buildPenTestPrompt
 *
 * Keep in sync with: supabase/functions/_shared/pen-test-tools.ts
 */
import { z } from 'zod';

// ---------- System Prompt (identical to pen-test-tools.ts) ----------

export const PEN_TEST_SYSTEM_PROMPT = `You are the Pen Test agent for ASSESS-AI. You perform PASSIVE vulnerability discovery ONLY.

## Critical Constraints
- You have NO access to external networks. You can ONLY query internal database tables.
- You MUST call checkScanAuthorization FIRST before any other tool. If authorization fails, stop immediately.
- Your analysis matches the company's declared tech stack against known CVE patterns. No active exploitation, no network scanning, no port probing.

## CMMC Control References
Your analysis supports and assesses compliance with these CMMC controls:
- **3.11.2** -- Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified
- **3.11.3** -- Remediate vulnerabilities in accordance with risk assessments

## Analysis Methodology
1. FIRST: Call checkScanAuthorization to verify this company has enabled pen testing
2. Use getCompanyTechStack to retrieve the company's declared technology stack from onboarding profiles
3. Use matchTechStackCVEs to cross-reference tech stack keywords against the threat_intelligence CVE table
4. For each match, create a finding with risk rating, exploitability assessment, and business impact
5. Use createPenTestFinding to persist each finding to the database
6. Generate a VulnerabilityReport aggregating all findings with recommendations

## Finding Types
- **known_cve** -- A specific CVE matching a declared technology in the company's stack
- **version_mismatch** -- Technology version is outdated and has known vulnerabilities in newer versions
- **eol_software** -- Technology has reached end-of-life and no longer receives security patches
- **missing_patch** -- A critical patch exists but the declared version predates it

## Risk Rating Criteria
- **critical** -- Actively exploited CVE with CVSS >= 9.0 affecting internet-facing technology
- **high** -- CVE with CVSS >= 7.0 or technology with multiple unpatched vulnerabilities
- **medium** -- CVE with CVSS >= 4.0 affecting internal systems
- **low** -- Informational finding or minor version mismatch with no known exploits

## Output Format
Always produce structured JSON output conforming to the VulnerabilityReport schema. Include findings array, summary, overall_risk_rating, scan_scope (always 'passive_only'), authorization_reference, and recommendations.

## Constraints
- PASSIVE ONLY -- never attempt to connect to external systems
- All queries must be scoped to the task's company_id
- Reference CMMC controls 3.11.2 and 3.11.3 in findings
- Include business impact assessment for each finding
- Remediation suggestions must be actionable`;

export const PEN_TEST_TOOL_NAMES = [
  'checkScanAuthorization',
  'getCompanyTechStack',
  'matchTechStackCVEs',
  'createPenTestFinding',
] as const;

// ---------- Tool Factory (uses standard zod, no Deno imports) ----------

/**
 * Creates 4 AI SDK tool definitions for the Pen Test agent.
 * Returns plain objects with description and parameters properties
 * matching the AI SDK tool() shape for testability.
 *
 * CRITICAL: No tool parameter accepts URLs, IP addresses, or hostnames.
 */
export function createPenTestTools(supabase: any, task: any) {
  return {
    checkScanAuthorization: {
      description:
        'Check if the pen-test agent is authorized to scan this company. ' +
        'Queries the agent_permissions table for pen_test agent type. ' +
        'MUST be called FIRST before any other tool.',
      parameters: z.object({}),
    },

    getCompanyTechStack: {
      description:
        "Query the company's primary technology stack from onboarding profiles.",
      parameters: z.object({}),
    },

    matchTechStackCVEs: {
      description:
        'Cross-reference tech stack keywords against the threat_intelligence table to find matching CVEs.',
      parameters: z.object({
        tech_stack_keywords: z
          .array(z.string())
          .describe(
            "Array of technology name keywords to match (e.g., ['apache', 'nginx', 'react'])"
          ),
      }),
    },

    createPenTestFinding: {
      description:
        'Create a new pen test finding in the database with risk rating, exploitability, and CMMC control mapping.',
      parameters: z.object({
        finding_type: z.enum(['known_cve', 'version_mismatch', 'eol_software', 'missing_patch']),
        risk_rating: z.enum(['critical', 'high', 'medium', 'low']),
        title: z.string().describe('Finding title/summary'),
        affected_technology: z.string().describe('Affected technology name and version'),
        matched_cve_ids: z.array(z.string()).describe('Array of matched CVE identifiers'),
        exploitability_score: z.number().optional().describe('CVSS exploitability sub-score (0-10)'),
        business_impact: z.string().describe('Business impact assessment'),
        remediation: z.string().describe('Actionable remediation recommendation'),
        cmmc_controls: z.array(z.string()).describe('CMMC controls affected'),
        scan_authorization_id: z.string().optional().describe('UUID of the authorization record'),
      }),
    },
  };
}

// ---------- Prompt Builder (identical to pen-test-tools.ts) ----------

export function buildPenTestPrompt(
  action: string,
  input: Record<string, unknown>
): string {
  switch (action) {
    case 'passive-scan':
      return (
        `Perform a passive vulnerability scan for this company. ` +
        `\nSteps:\n` +
        `1. Call checkScanAuthorization to verify authorization -- stop if unauthorized\n` +
        `2. Use getCompanyTechStack to retrieve the declared technology stack\n` +
        `3. Use matchTechStackCVEs to find CVE matches for each technology keyword\n` +
        `4. Use createPenTestFinding for each vulnerability found\n` +
        `5. Generate a VulnerabilityReport with all findings and recommendations\n` +
        `\nReturn a VulnerabilityReport as structured JSON.`
      );

    case 'tech-stack-cve-match':
      return (
        `Perform focused CVE matching for specific tech stack components. ` +
        `Keywords: ${JSON.stringify(input.keywords ?? [])}. ` +
        `\nSteps:\n` +
        `1. Call checkScanAuthorization to verify authorization -- stop if unauthorized\n` +
        `2. Use matchTechStackCVEs with the provided keywords\n` +
        `3. Use createPenTestFinding for each match\n` +
        `\nReturn a VulnerabilityReport with CVE match findings as structured JSON.`
      );

    case 'generate-vulnerability-report':
      return (
        `Generate a comprehensive vulnerability report aggregating all findings. ` +
        `\nSteps:\n` +
        `1. Call checkScanAuthorization to verify authorization -- stop if unauthorized\n` +
        `2. Use getCompanyTechStack to understand the technology environment\n` +
        `3. Use matchTechStackCVEs to cross-reference all tech stack keywords against CVEs\n` +
        `4. Use createPenTestFinding to persist all findings\n` +
        `5. Aggregate all findings into a VulnerabilityReport with overall_risk_rating and recommendations\n` +
        `\nReturn a complete VulnerabilityReport as structured JSON.`
      );

    default:
      return (
        `Execute Pen Test action: ${action}. ` +
        `Input: ${JSON.stringify(input)}. ` +
        `Follow PASSIVE ONLY vulnerability discovery methodology. ` +
        `Always call checkScanAuthorization first.`
      );
  }
}
