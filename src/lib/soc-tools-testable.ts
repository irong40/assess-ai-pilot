/**
 * Vitest-compatible SOC tools module.
 *
 * The source of truth is supabase/functions/_shared/soc-tools.ts (Deno context).
 * This file mirrors the testable parts using standard npm imports so vitest
 * can import without Deno npm: specifier resolution issues.
 *
 * Exports: SOC_SYSTEM_PROMPT, SOC_TOOL_NAMES, buildSocPrompt, createSocTools
 *
 * Keep in sync with: supabase/functions/_shared/soc-tools.ts
 */
import { z } from 'zod';

// ---------- System Prompt (identical to soc-tools.ts) ----------

export const SOC_SYSTEM_PROMPT = `You are the SOC (Security Operations Center) Analyst agent for ASSESS-AI, a CMMC compliance platform for small defense contractors. You perform CVE alert triage, cross-source correlation, false positive classification, and incident escalation.

## Core Triage Rules

### Rule 1: Tech Stack Awareness
Every CVE triage MUST consider the company's declared tech stack. A critical CVE in software the company does not use is irrelevant. Use the getCompanyTechStack tool first, then match CVE affected products against the company's technologies. Set tech_stack_match=true only when there is a clear match between the CVE's affected software and the company's declared stack.

### Rule 2: CVSS-Based Severity Prioritization
Prioritize alerts by CVSS score using standard severity mapping:
- Critical: CVSS >= 9.0 -- process immediately, check for active exploitation
- High: CVSS 7.0-8.9 -- process in current triage batch
- Medium: CVSS 4.0-6.9 -- process if tech stack match is confirmed
- Low: CVSS < 4.0 -- log and monitor, skip detailed analysis unless tech stack match
Always reference the CVSS vector string when explaining severity context.

### Rule 3: False Positive Reasoning Chain
When classifying an alert, follow this 4-step reasoning chain and document EACH step:
1. **Tech stack match?** -- Does the CVE affect software in the company's declared tech stack? If no match, likely false positive for this company.
2. **Compensating control in place?** -- Query assessment gaps to check if relevant CMMC controls are already MET. A MET control may mitigate the CVE's impact.
3. **CVSS context applicable?** -- Is the attack vector (network/local/physical) relevant to the company's deployment? A local-only exploit is less relevant to a cloud-only company.
4. **Classification decision with evidence** -- Based on steps 1-3, classify as true_positive, false_positive, or needs_investigation. Provide specific evidence from each step in classification_reasoning.

### Rule 4: Escalation Rules for IR Flagging
Set escalation_status based on these criteria:
- 'needs_ir_review': true_positive alerts with CVSS >= 9.0, or tech_stack_match=true AND is_exploited=true
- 'escalated_to_ciso': When multiple correlated true_positive alerts indicate a systemic threat
- 'resolved': After classification as false_positive with documented reasoning
- 'none': For unclassified alerts still under investigation

### Rule 5: Batch Processing for Timeout Avoidance
Process CVEs in batches of up to 20 per invocation. For each CVE:
1. Query the CVE data (queryRecentCVEs)
2. Check tech stack relevance (getCompanyTechStack)
3. Check for existing compliance gaps (queryAssessmentGaps)
4. Create the SOC alert with classification (createSocAlert)
Do NOT attempt to process more than 20 CVEs in a single task. If there are more, the CISO Orchestrator will create additional scoped tasks.

## Output Format
Always produce structured JSON output conforming to the SocTriageResult schema. Include all triaged alerts with severity, relevance scores, classification reasoning, and escalation status.

## Constraints
- Never fabricate CVE data -- use queryRecentCVEs to get actual threat intelligence
- All queries must be scoped to the task's company_id
- Classification reasoning must reference specific tech stack matches or mismatches
- Do not escalate without documenting the reasoning chain`;

export const SOC_TOOL_NAMES = [
  'queryRecentCVEs',
  'getCompanyTechStack',
  'queryAssessmentGaps',
  'createSocAlert',
  'correlateFindingsByPatterns',
] as const;

// ---------- Tool Factory (uses standard zod, no Deno imports) ----------

/**
 * Creates 5 AI SDK tool definitions for the SOC Analyst agent.
 * Returns plain objects with description and parameters properties
 * matching the AI SDK tool() shape for testability.
 */
export function createSocTools(supabase: any, task: any) {
  return {
    queryRecentCVEs: {
      description:
        'Query recent CVEs from the threat intelligence feed, optionally filtered by severity and recency. Returns CVE data including CVSS scores and CWE IDs.',
      parameters: z.object({
        min_cvss: z.number().optional().describe('Minimum CVSS score filter (default 7.0)'),
        days_back: z.number().int().optional().describe('Days to look back (default 7)'),
        limit: z.number().int().optional().describe('Max results to return (default 20)'),
      }),
    },

    getCompanyTechStack: {
      description:
        "Get the company's declared technology stack from their onboarding profile. Used to determine CVE relevance.",
      parameters: z.object({}),
    },

    queryAssessmentGaps: {
      description:
        'Query assessment findings with NOT_MET status to correlate with CVEs. Returns compliance gaps that may be relevant to active vulnerabilities.',
      parameters: z.object({
        family_id: z.string().optional().describe("Filter by CMMC control family (e.g., 'SI', 'AC')"),
        limit: z.number().int().optional().describe('Max results to return (default 50)'),
      }),
    },

    createSocAlert: {
      description:
        'Create a SOC alert record in the database after triage analysis. Stores classification, reasoning, and escalation status.',
      parameters: z.object({
        external_cve_id: z.string().describe('The CVE identifier (e.g., CVE-2026-1234)'),
        title: z.string().describe('Alert title'),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        cvss_score: z.number().describe('CVSS v3.1 score'),
        tech_stack_match: z.boolean().describe("Whether CVE affects company's tech stack"),
        relevance_score: z.number().int().min(0).max(100).describe('Company-specific relevance score (0-100)'),
        classification: z.enum(['true_positive', 'false_positive', 'unclassified', 'needs_investigation']),
        classification_reasoning: z.string().nullable().describe('4-step reasoning chain for classification'),
        escalation_status: z.enum(['none', 'needs_ir_review', 'escalated_to_ciso', 'resolved']),
        affected_controls: z.array(z.string()).describe('CMMC control families affected'),
        threat_intel_id: z.string().uuid().optional().describe('Reference to threat_intelligence row'),
      }),
    },

    correlateFindingsByPatterns: {
      description:
        'Correlate a SOC alert with findings from multiple data sources (CVEs, assessment gaps, existing SOC alerts). Creates correlation records linking related findings.',
      parameters: z.object({
        soc_alert_id: z.string().uuid().describe('The SOC alert ID to correlate'),
        search_patterns: z
          .array(z.string())
          .describe('Patterns to search for (CWE IDs, control family IDs, CVE IDs)'),
      }),
    },
  };
}

// ---------- Prompt Builder (identical to soc-tools.ts) ----------

export function buildSocPrompt(
  action: string,
  input: Record<string, unknown>
): string {
  switch (action) {
    case 'triage-alerts':
      return (
        `Triage recent CVE alerts for the company. ` +
        `Days to look back: ${input.days_back ?? 7}. ` +
        `Minimum CVSS: ${input.min_cvss ?? 7.0}. ` +
        `\nSteps:\n` +
        `1. Use getCompanyTechStack to retrieve the company's declared technology stack\n` +
        `2. Use queryRecentCVEs to get recent high-severity CVEs\n` +
        `3. For each CVE, determine tech stack relevance and compute relevance_score\n` +
        `4. Use queryAssessmentGaps to check if relevant CMMC controls are already NOT_MET\n` +
        `5. Apply the 4-step false positive reasoning chain for each alert\n` +
        `6. Use createSocAlert to persist each triaged alert with classification\n` +
        `7. Flag alerts needing escalation based on Rule 4\n` +
        `\nReturn a complete SocTriageResult as structured JSON.`
      );

    case 'correlate-findings':
      return (
        `Correlate SOC alerts with findings from other data sources. ` +
        `Alert IDs to correlate: ${JSON.stringify(input.alert_ids ?? [])}. ` +
        `\nSteps:\n` +
        `1. For each alert, identify CWE categories and affected control families\n` +
        `2. Use correlateFindingsByPatterns to find related CVEs, assessment gaps, and existing alerts\n` +
        `3. Evaluate correlation strength and update relevance scores\n` +
        `4. If multiple correlated true_positives indicate systemic threat, flag for CISO escalation\n` +
        `\nReturn correlation results as structured JSON.`
      );

    case 'classify-alert':
      return (
        `Classify a specific SOC alert using the 4-step reasoning chain. ` +
        `Alert ID: ${input.alert_id ?? 'not specified'}. ` +
        `\nSteps:\n` +
        `1. Retrieve the alert details and associated CVE data\n` +
        `2. Use getCompanyTechStack to check tech stack relevance\n` +
        `3. Use queryAssessmentGaps to check compensating controls\n` +
        `4. Apply the full 4-step classification reasoning chain\n` +
        `5. Update the alert classification and reasoning via createSocAlert\n` +
        `\nReturn the classification decision with full reasoning.`
      );

    default:
      return (
        `Execute SOC action: ${action}. ` +
        `Input: ${JSON.stringify(input)}. ` +
        `Follow SOC triage methodology rules.`
      );
  }
}
