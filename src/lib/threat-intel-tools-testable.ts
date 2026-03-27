/**
 * Vitest-compatible Threat Intel tools module.
 *
 * The source of truth is supabase/functions/_shared/threat-intel-tools.ts (Deno context).
 * This file mirrors the testable parts using standard npm imports so vitest
 * can import without Deno npm: specifier resolution issues.
 *
 * Exports: THREAT_INTEL_SYSTEM_PROMPT, THREAT_INTEL_TOOL_NAMES, buildThreatIntelPrompt,
 *          createThreatIntelTools, CWE_TO_CMMC_FAMILY
 *
 * Keep in sync with: supabase/functions/_shared/threat-intel-tools.ts
 */
import { z } from 'zod';

// ---------- CWE-to-CMMC Family Heuristic Mapping (identical to threat-intel-tools.ts) ----------

export const CWE_TO_CMMC_FAMILY: Record<
  string,
  { families: string[]; description: string }
> = {
  'CWE-79': {
    families: ['SI', 'SC'],
    description: 'Cross-site Scripting (XSS) -- system integrity and communications protection',
  },
  'CWE-89': {
    families: ['SI'],
    description: 'SQL Injection -- system and information integrity',
  },
  'CWE-287': {
    families: ['IA', 'AC'],
    description: 'Improper Authentication -- identification/authentication and access control',
  },
  'CWE-200': {
    families: ['AU', 'MP'],
    description: 'Information Disclosure -- audit and media protection',
  },
  'CWE-22': {
    families: ['AC', 'SI'],
    description: 'Path Traversal -- access control and system integrity',
  },
  'CWE-352': {
    families: ['SC', 'SI'],
    description: 'Cross-Site Request Forgery (CSRF) -- communications and system integrity',
  },
  'CWE-78': {
    families: ['SI', 'AC'],
    description: 'OS Command Injection -- system integrity and access control',
  },
  'CWE-327': {
    families: ['SC'],
    description: 'Use of Broken Crypto Algorithm -- communications protection (FIPS)',
  },
  'CWE-306': {
    families: ['IA', 'AC'],
    description: 'Missing Authentication for Critical Function -- identification and access control',
  },
  'CWE-862': {
    families: ['AC'],
    description: 'Missing Authorization -- access control enforcement',
  },
  'CWE-798': {
    families: ['IA', 'CM'],
    description: 'Hardcoded Credentials -- identification/authentication and configuration management',
  },
  'CWE-918': {
    families: ['SC', 'AC'],
    description: 'Server-Side Request Forgery (SSRF) -- communications protection and access control',
  },
  'CWE-502': {
    families: ['SI'],
    description: 'Deserialization of Untrusted Data -- system and information integrity',
  },
  'CWE-434': {
    families: ['SI', 'CM'],
    description: 'Unrestricted File Upload -- system integrity and configuration management',
  },
  'CWE-611': {
    families: ['SI', 'SC'],
    description: 'XXE (XML External Entity) -- system integrity and communications protection',
  },
  'CWE-269': {
    families: ['AC'],
    description: 'Improper Privilege Management -- access control',
  },
  'CWE-732': {
    families: ['AC', 'CM'],
    description: 'Incorrect Permission Assignment -- access control and configuration management',
  },
  'CWE-416': {
    families: ['SI'],
    description: 'Use After Free -- system and information integrity (memory safety)',
  },
  'CWE-190': {
    families: ['SI'],
    description: 'Integer Overflow -- system and information integrity',
  },
  'CWE-522': {
    families: ['IA', 'SC'],
    description:
      'Insufficiently Protected Credentials -- identification/authentication and comms protection',
  },
};

// ---------- System Prompt (identical to threat-intel-tools.ts) ----------

export const THREAT_INTEL_SYSTEM_PROMPT = `You are the Threat Intelligence agent for ASSESS-AI, a CMMC compliance platform for small defense contractors. You generate strategic threat briefs, track indicators of compromise (IOCs), map threats to CMMC controls via CWE categorization, and produce attack surface assessments.

## Core Analysis Methodology

### Enhanced CVE Analysis
For each CVE in the threat intelligence feed:
1. Identify the CWE category (from cwe_id field)
2. Score relevance against the company's declared tech stack
3. Map the CWE to CMMC control families using the CWE-to-CMMC mapping
4. Assess exploit likelihood based on is_exploited flag and CVSS score
5. Extract any IOCs mentioned in the CVE description or reference URLs

### Tech Stack Relevance Scoring
Every threat analysis MUST consider the company's declared tech stack. Use getCompanyTechStack first, then:
- High relevance: CVE directly affects a technology in the company's stack
- Medium relevance: CVE affects a technology in the same ecosystem (e.g., Apache library when company uses Apache HTTP Server)
- Low relevance: CVE is in the same domain but different technology
- Not relevant: CVE has no connection to the company's tech stack

### CWE-to-CMMC Control Mapping
Use the getCweToCmmcMapping tool to retrieve the heuristic mapping. For each CVE:
1. Look up the CWE category in the mapping
2. Identify the CMMC control families at risk
3. Use getControlsByFamily to find specific controls within those families
4. Document the threat-to-control link in the threat brief's affected_controls array

For CWEs not in the mapping, reason about which CMMC control families are relevant based on the vulnerability's nature and the control family descriptions.

### IOC Extraction and Confidence Rating
When analyzing CVEs and threat data, extract IOCs with confidence levels:
- High confidence: IOC confirmed in multiple sources or CISA alerts
- Medium confidence: IOC from a single reputable source
- Low confidence: IOC inferred or from unverified source
IOC types: IP addresses, domains, file hashes, URLs, email addresses

### Attack Surface Mapping
Combine three data sources to produce an attack surface assessment:
1. Company tech stack (from onboarding profile)
2. NOT_MET CMMC controls (compliance gaps)
3. Active threats (CVEs matching tech stack)
Calculate a risk_score (0-100) based on: number of active threats x severity weight + number of compliance gaps in threat-affected families.

## Output Format
Always produce structured JSON output conforming to the ThreatAnalysisResult schema. Include threat briefs with affected controls, IOCs with confidence levels, and optionally an attack surface map.

## Constraints
- Never fabricate CVE data -- use queryRecentCVEs to get actual threat intelligence
- All queries must be scoped to the task's company_id
- Threat briefs must map each threat to specific CMMC controls via CWE mapping
- IOCs must have a confidence level and source CVE when available
- Attack surface risk_score must be between 0 and 100
- Do not exceed 20 CVEs per analysis batch to avoid timeout`;

export const THREAT_INTEL_TOOL_NAMES = [
  'queryRecentCVEs',
  'getCompanyTechStack',
  'saveThreatBrief',
  'trackIOCs',
  'getControlsByFamily',
  'getCweToCmmcMapping',
] as const;

// ---------- Tool Factory (uses standard zod, no Deno imports) ----------

/**
 * Creates 6 AI SDK tool definitions for the Threat Intelligence agent.
 * Returns plain objects with description and parameters properties
 * matching the AI SDK tool() shape for testability.
 */
export function createThreatIntelTools(supabase: any, task: any) {
  return {
    queryRecentCVEs: {
      description:
        'Query recent CVEs from the threat intelligence feed with full detail including CWE IDs and reference URLs for deeper analysis.',
      parameters: z.object({
        min_cvss: z
          .number()
          .optional()
          .describe('Minimum CVSS score filter (default 4.0 for broader threat coverage)'),
        days_back: z.number().int().optional().describe('Days to look back (default 14)'),
        limit: z.number().int().optional().describe('Max results to return (default 20)'),
      }),
    },

    getCompanyTechStack: {
      description:
        "Get the company's declared technology stack, system name, and target CMMC level from their onboarding profile.",
      parameters: z.object({}),
    },

    saveThreatBrief: {
      description:
        "Save a generated threat brief to the database. A threat brief summarizes recent threats relevant to the company's tech stack and maps them to CMMC controls.",
      parameters: z.object({
        title: z.string().describe('Threat brief title'),
        executive_summary: z.string().describe('Executive summary of the threat landscape'),
        threat_count: z.number().int().describe('Number of threats analyzed'),
        affected_controls: z
          .array(
            z.object({
              control_id: z.string(),
              family_id: z.string(),
              threat_description: z.string(),
              risk_level: z.enum(['critical', 'high', 'medium', 'low']),
            })
          )
          .describe('CMMC controls affected by the identified threats'),
      }),
    },

    trackIOCs: {
      description:
        'Track indicators of compromise (IOCs) extracted from threat analysis. Uses ON CONFLICT for deduplication -- existing IOCs get their last_seen updated.',
      parameters: z.object({
        threat_brief_id: z
          .string()
          .uuid()
          .optional()
          .describe('Reference to the threat brief that produced these IOCs'),
        iocs: z.array(
          z.object({
            indicator_type: z.enum(['ip', 'domain', 'hash', 'url', 'email']),
            indicator_value: z.string(),
            confidence_level: z.enum(['high', 'medium', 'low']),
            source_cve: z.string().optional(),
          })
        ),
      }),
    },

    getControlsByFamily: {
      description: 'Query CMMC controls filtered by family ID to map threats to specific controls.',
      parameters: z.object({
        family_id: z.string().describe("CMMC control family (e.g., 'SI', 'AC', 'IA')"),
        limit: z.number().int().optional().describe('Max results to return (default 50)'),
      }),
    },

    getCweToCmmcMapping: {
      description:
        'Get the CWE-to-CMMC control family heuristic mapping. Returns ~20 common CWE categories mapped to their relevant NIST 800-171 / CMMC control families.',
      parameters: z.object({}),
    },
  };
}

// ---------- Prompt Builder (identical to threat-intel-tools.ts) ----------

export function buildThreatIntelPrompt(
  action: string,
  input: Record<string, unknown>
): string {
  switch (action) {
    case 'generate-threat-brief':
      return (
        `Generate a threat intelligence brief for the company. ` +
        `Days to cover: ${input.days_back ?? 14}. ` +
        `Minimum CVSS: ${input.min_cvss ?? 4.0}. ` +
        `\nSteps:\n` +
        `1. Use getCompanyTechStack to retrieve the company's declared technology stack and target CMMC level\n` +
        `2. Use queryRecentCVEs to get recent CVEs with CWE data\n` +
        `3. Use getCweToCmmcMapping to get the CWE-to-CMMC control family mapping\n` +
        `4. For each relevant CVE, map its CWE to CMMC control families\n` +
        `5. Use getControlsByFamily to find specific controls at risk\n` +
        `6. Use saveThreatBrief to persist the threat brief with affected controls\n` +
        `7. Use trackIOCs to record any IOCs extracted from CVE analysis\n` +
        `\nReturn a complete ThreatAnalysisResult as structured JSON.`
      );

    case 'scan-iocs':
      return (
        `Scan recent threat data for indicators of compromise (IOCs). ` +
        `Time range: ${input.days_back ?? 7} days. ` +
        `\nSteps:\n` +
        `1. Use queryRecentCVEs to get recent CVE data including reference URLs\n` +
        `2. Analyze CVE descriptions and references for IOC indicators\n` +
        `3. Extract IP addresses, domains, file hashes, URLs, and email addresses\n` +
        `4. Rate confidence level for each IOC based on source reliability\n` +
        `5. Use trackIOCs to persist extracted IOCs with confidence levels\n` +
        `\nReturn IOC scan results as structured JSON.`
      );

    case 'map-attack-surface':
      return (
        `Map the attack surface for the company. ` +
        `\nSteps:\n` +
        `1. Use getCompanyTechStack to get the company's technology stack\n` +
        `2. Use queryRecentCVEs to identify active threats relevant to the tech stack\n` +
        `3. Use getCweToCmmcMapping to correlate threats with CMMC control families\n` +
        `4. Use getControlsByFamily for each affected family to find specific NOT_MET controls\n` +
        `5. Calculate risk_score (0-100) based on: threat severity, tech stack matches, and compliance gaps\n` +
        `6. Produce an attack surface map combining tech stack, NOT_MET controls, and active threats\n` +
        `\nReturn the attack surface assessment as structured JSON.`
      );

    default:
      return (
        `Execute Threat Intel action: ${action}. ` +
        `Input: ${JSON.stringify(input)}. ` +
        `Follow threat intelligence analysis methodology.`
      );
  }
}
