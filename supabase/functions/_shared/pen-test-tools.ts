/**
 * Pen Test agent domain-specific tools and system prompt.
 *
 * Provides:
 * - PEN_TEST_SYSTEM_PROMPT: PASSIVE ONLY vulnerability discovery rules for the LLM
 * - createPenTestTools(): 4 AI SDK tool definitions for database access
 * - buildPenTestPrompt(): action-specific prompt construction
 *
 * CRITICAL CONSTRAINTS:
 * - PASSIVE ONLY -- no HTTP requests, no DNS lookups, no port scans, no network probing
 * - No tool accepts URLs, IP addresses, or hostnames as parameters
 * - All data comes from onboarding_profiles.primary_tech_stack and threat_intelligence table
 * - checkScanAuthorization must be called FIRST before any other tool
 *
 * All database queries are scoped by company_id (multi-tenant isolation).
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { tool } from "npm:ai@6";
import { z } from "npm:zod@3";
import type { AgentTask } from "./agent-types.ts";

// ---------- System Prompt ----------

/**
 * Pen Test agent system prompt enforcing PASSIVE ONLY constraints.
 * References CMMC controls 3.11.2 (scan for vulnerabilities) and 3.11.3 (remediate vulnerabilities).
 */
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

/**
 * The 4 Pen Test domain-specific tool names for validation and testing.
 */
export const PEN_TEST_TOOL_NAMES = [
  "checkScanAuthorization",
  "getCompanyTechStack",
  "matchTechStackCVEs",
  "createPenTestFinding",
] as const;

// ---------- Tool Factory ----------

/**
 * Creates 4 AI SDK tool definitions for the Pen Test agent.
 * All database queries are scoped by task.company_id.
 *
 * CRITICAL: No tool parameter accepts URLs, IP addresses, or hostnames.
 */
export function createPenTestTools(supabase: SupabaseClient, task: AgentTask) {
  const companyId = task.company_id;

  return {
    checkScanAuthorization: tool({
      description:
        "Check if the pen-test agent is authorized to scan this company. " +
        "Queries the agent_permissions table for pen_test agent type. " +
        "MUST be called FIRST before any other tool.",
      parameters: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("agent_permissions")
          .select("enabled, config")
          .eq("company_id", companyId)
          .eq("agent_type", "pen_test")
          .maybeSingle();

        if (error) {
          return {
            authorized: false,
            reason: `Authorization check failed: ${error.message}`,
            scope: "passive_only",
            restrictions: ["no_active_scanning", "no_network_access"],
          };
        }

        if (!data || !data.enabled) {
          return {
            authorized: false,
            reason: "Pen test agent is not enabled for this company",
            scope: "passive_only",
            restrictions: ["no_active_scanning", "no_network_access"],
          };
        }

        return {
          authorized: true,
          scope: "passive_only",
          restrictions: ["no_active_scanning", "no_network_access", "database_only"],
        };
      },
    }),

    getCompanyTechStack: tool({
      description:
        "Query the company's primary technology stack from onboarding profiles. " +
        "Returns tech stack info for passive CVE matching.",
      parameters: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("onboarding_profiles")
          .select("primary_tech_stack")
          .eq("company_id", companyId)
          .maybeSingle();

        if (error) return { success: false, error: error.message, tech_stack: null };
        return {
          success: true,
          tech_stack: data?.primary_tech_stack ?? null,
        };
      },
    }),

    matchTechStackCVEs: tool({
      description:
        "Cross-reference tech stack keywords against the threat_intelligence table " +
        "to find matching CVEs. Takes string keywords only (e.g., 'apache', 'nginx', 'react') -- " +
        "NOT URLs, IP addresses, or hostnames.",
      parameters: z.object({
        tech_stack_keywords: z
          .array(z.string())
          .describe(
            "Array of technology name keywords to match (e.g., ['apache', 'nginx', 'react'])"
          ),
      }),
      execute: async ({ tech_stack_keywords }) => {
        const results: Array<{
          keyword: string;
          cve_id: string;
          severity: string;
          description: string;
          cvss_score: number | null;
        }> = [];

        for (const keyword of tech_stack_keywords) {
          // Match against description ILIKE or affected_products
          const { data, error } = await supabase
            .from("threat_intelligence")
            .select("cve_id, severity, description, cvss_score, affected_versions")
            .or(`description.ilike.%${keyword}%,affected_versions.ilike.%${keyword}%`)
            .limit(10);

          if (!error && data) {
            for (const cve of data) {
              results.push({
                keyword,
                cve_id: cve.cve_id,
                severity: cve.severity,
                description: cve.description,
                cvss_score: cve.cvss_score ?? null,
              });
            }
          }
        }

        return {
          matches: results,
          total_matches: results.length,
          keywords_searched: tech_stack_keywords.length,
        };
      },
    }),

    createPenTestFinding: tool({
      description:
        "Create a new pen test finding in the database. Persists vulnerability findings " +
        "with risk rating, exploitability assessment, business impact, and CMMC control mapping.",
      parameters: z.object({
        finding_type: z
          .enum(["known_cve", "version_mismatch", "eol_software", "missing_patch"])
          .describe("Type of pen test finding"),
        risk_rating: z.enum(["critical", "high", "medium", "low"]),
        title: z.string().describe("Finding title/summary"),
        affected_technology: z
          .string()
          .describe("Affected technology name and version"),
        matched_cve_ids: z
          .array(z.string())
          .describe("Array of matched CVE identifiers"),
        exploitability_score: z
          .number()
          .optional()
          .describe("CVSS exploitability sub-score (0-10)"),
        business_impact: z
          .string()
          .describe("Business impact assessment"),
        remediation: z
          .string()
          .describe("Actionable remediation recommendation"),
        cmmc_controls: z
          .array(z.string())
          .describe("CMMC controls affected by this finding"),
        scan_authorization_id: z
          .string()
          .optional()
          .describe("UUID of the authorization record"),
      }),
      execute: async ({
        finding_type,
        risk_rating,
        title,
        affected_technology,
        matched_cve_ids,
        exploitability_score,
        business_impact,
        remediation,
        cmmc_controls,
        scan_authorization_id,
      }) => {
        const { data, error } = await supabase
          .from("pen_test_findings")
          .insert({
            company_id: companyId,
            agent_task_id: task.id,
            finding_type,
            risk_rating,
            title,
            affected_technology,
            matched_cve_ids,
            exploitability_score: exploitability_score ?? null,
            business_impact,
            remediation,
            cmmc_controls,
            scan_authorization_id: scan_authorization_id ?? null,
            status: "open",
          })
          .select("id")
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, finding_id: data?.id };
      },
    }),
  };
}

// ---------- Prompt Builder ----------

/**
 * Builds the user prompt based on the Pen Test task action and input scope.
 */
export function buildPenTestPrompt(
  action: string,
  input: Record<string, unknown>
): string {
  switch (action) {
    case "passive-scan":
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

    case "tech-stack-cve-match":
      return (
        `Perform focused CVE matching for specific tech stack components. ` +
        `Keywords: ${JSON.stringify(input.keywords ?? [])}. ` +
        `\nSteps:\n` +
        `1. Call checkScanAuthorization to verify authorization -- stop if unauthorized\n` +
        `2. Use matchTechStackCVEs with the provided keywords\n` +
        `3. Use createPenTestFinding for each match\n` +
        `\nReturn a VulnerabilityReport with CVE match findings as structured JSON.`
      );

    case "generate-vulnerability-report":
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
