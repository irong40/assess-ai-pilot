/**
 * AppSec Engineer agent domain-specific tools and system prompt.
 *
 * Provides:
 * - APPSEC_SYSTEM_PROMPT: CMMC control families AC, SI, CM rules for the LLM
 * - CONFIG_SECURITY_RULES: hardcoded rules checklist for config file review
 * - createAppSecTools(): 5 AI SDK tool definitions for database access
 * - parseDependencyManifest(): pure function for manifest parsing
 * - reviewConfigFile(): pure function for config security review
 * - buildAppSecPrompt(): action-specific prompt construction
 *
 * All database queries are scoped by company_id (multi-tenant isolation).
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { tool } from "npm:ai@6";
import { z } from "npm:zod@3";
import type { AgentTask } from "./agent-types.ts";

// ---------- System Prompt ----------

/**
 * AppSec agent system prompt referencing CMMC control families
 * AC (access control), SI (system/info integrity), and CM (configuration management).
 */
export const APPSEC_SYSTEM_PROMPT = `You are the Application Security (AppSec) Engineer agent for ASSESS-AI, a CMMC compliance platform for small defense contractors. You scan dependency manifests, review configuration files for security misconfigurations, and generate vulnerability findings with fix suggestions mapped to CMMC controls.

## CMMC Control Families
Your analysis must reference and assess compliance with these CMMC control families:
- **AC (Access Control)** -- Controls governing who can access systems and data (3.1.x)
- **SI (System and Information Integrity)** -- Controls ensuring system integrity, flaw remediation, and malicious code protection (3.14.x)
- **CM (Configuration Management)** -- Controls for baseline configurations, change control, and least functionality (3.4.x)

## Dependency Manifest Scanning
Parse uploaded dependency manifests (package.json, requirements.txt, pom.xml) as plain text:
1. Use parseDependencyManifest to extract package-version pairs from the manifest
2. Use matchDependencyVulnerabilities to cross-reference packages against the threat_intelligence CVE table
3. For each match, create a finding with severity, CVE ID, affected package, fix suggestion, and fix version
4. Map findings to CMMC controls (SI-family for vulnerabilities, CM-family for outdated packages)

## Configuration File Review
Review configuration files for security misconfigurations using CONFIG_SECURITY_RULES:
1. Use reviewConfigFile to apply the security rules checklist against the config content
2. Rules detect: hardcoded secrets (API keys, passwords), debug mode enabled, permissive CORS (*), default credentials, insecure protocols (HTTP), missing security headers, verbose error messages
3. Create findings for each detected issue with severity and fix suggestion
4. Map findings to CMMC controls (AC-family for access issues, CM-family for misconfigurations)

## Analysis Methodology
1. Use getCompanyTechStack to understand the company's technology environment
2. Parse manifests with parseDependencyManifest (handles package.json, requirements.txt, pom.xml)
3. Match dependencies against CVE data with matchDependencyVulnerabilities
4. Review configs with reviewConfigFile for misconfigurations
5. Use createAppSecFinding to persist each finding to the database
6. Generate a SecurityReviewReport aggregating all findings with remediation priority

## Output Format
Always produce structured JSON output conforming to the SecurityReviewReport schema. Include findings array, config_issues array, summary, risk_score (0-10), and remediation_priority (ordered list of actions).

## Constraints
- Never execute code or modify files -- only analyze and report
- All queries must be scoped to the task's company_id
- Reference specific CMMC controls when mapping findings
- Prioritize findings by severity (critical > high > medium > low)
- Fix suggestions must be actionable (e.g., "Upgrade lodash to 4.17.21")`;

/**
 * The 5 AppSec domain-specific tool names for validation and testing.
 */
export const APPSEC_TOOL_NAMES = [
  "parseDependencyManifest",
  "matchDependencyVulnerabilities",
  "reviewConfigFile",
  "createAppSecFinding",
  "getCompanyTechStack",
] as const;

// ---------- Pure Functions ----------

/**
 * Strips version range operators (^, ~, >=, <=, >, <) from a version string.
 */
export function stripVersionRange(version: string): string {
  return version.replace(/^[\^~>=<]+/, "").trim();
}

/**
 * Parses a dependency manifest and extracts package-version pairs.
 * Pure function -- no database calls.
 *
 * Handles:
 * - package.json: JSON.parse extracting dependencies + devDependencies
 * - requirements.txt: line split with ==/>=/<=/ operator parsing
 * - pom.xml: regex <groupId>/<artifactId>/<version> extraction
 */
export function parseDependencyManifest(
  manifestContent: string,
  manifestType: string
): Array<{ name: string; version: string; dep_type: "runtime" | "dev" }> {
  const deps: Array<{ name: string; version: string; dep_type: "runtime" | "dev" }> = [];

  if (manifestType === "package.json") {
    try {
      const pkg = JSON.parse(manifestContent);
      const runtime = pkg.dependencies ?? {};
      const dev = pkg.devDependencies ?? {};

      for (const [name, ver] of Object.entries(runtime)) {
        deps.push({ name, version: stripVersionRange(String(ver)), dep_type: "runtime" });
      }
      for (const [name, ver] of Object.entries(dev)) {
        deps.push({ name, version: stripVersionRange(String(ver)), dep_type: "dev" });
      }
    } catch {
      // Invalid JSON -- return empty
    }
  } else if (manifestType === "requirements.txt") {
    const lines = manifestContent.split("\n").map((l) => l.trim());
    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;

      // Match package with version operator (==, >=, <=, >, <)
      const match = line.match(/^([a-zA-Z0-9_.-]+)\s*(?:[><=!~]+)\s*(.+)$/);
      if (match) {
        deps.push({ name: match[1].toLowerCase(), version: match[2].trim(), dep_type: "runtime" });
      } else {
        // Package without version specifier
        const pkgName = line.split(/[\s;#]/)[0].trim();
        if (pkgName) {
          deps.push({ name: pkgName.toLowerCase(), version: "*", dep_type: "runtime" });
        }
      }
    }
  } else if (manifestType === "pom.xml") {
    // Regex to extract <dependency> blocks with groupId, artifactId, version
    const depRegex =
      /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*<version>([^<]+)<\/version>/g;
    let match;
    while ((match = depRegex.exec(manifestContent)) !== null) {
      deps.push({
        name: `${match[1]}:${match[2]}`,
        version: match[3],
        dep_type: "runtime",
      });
    }
  }

  return deps;
}

// ---------- CONFIG_SECURITY_RULES ----------

/**
 * Hardcoded security rules checklist for configuration file review.
 * Each rule has a regex pattern to detect the issue and metadata for reporting.
 */
export const CONFIG_SECURITY_RULES: Array<{
  id: string;
  pattern: RegExp;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  fix_suggestion: string;
}> = [
  {
    id: "HARDCODED_SECRET",
    pattern:
      /(?:api[_-]?key|secret[_-]?key|password|passwd|token|auth[_-]?token)["']?\s*[=:]\s*["'][^"']{8,}["']/i,
    severity: "critical",
    description: "Hardcoded secret (API key, password, or token) detected in configuration",
    fix_suggestion:
      "Move secrets to environment variables or a secure secrets manager. Never commit secrets to configuration files.",
  },
  {
    id: "DEBUG_MODE",
    pattern: /["']?debug["']?\s*[=:]\s*(?:true|1|["']true["'])/i,
    severity: "medium",
    description: "Debug mode is enabled in configuration",
    fix_suggestion:
      "Disable debug mode in production. Set debug=false and use environment-specific configuration.",
  },
  {
    id: "CORS_WILDCARD",
    pattern: /(?:cors|origin|allow[_-]?origin)["']?\s*[=:]\s*["']\*["']/i,
    severity: "medium",
    description: "CORS configured with wildcard origin (*), allowing any domain",
    fix_suggestion:
      "Restrict CORS to specific trusted origins. Replace '*' with explicit domain allowlist.",
  },
  {
    id: "DEFAULT_CREDENTIALS",
    pattern:
      /(?:username|user)\s*[=:]\s*["'](?:admin|root|test|default)["'].*(?:password|passwd)\s*[=:]\s*["'](?:admin|root|password|123456|test|default)["']/is,
    severity: "critical",
    description: "Default credentials detected in configuration (username/password pair)",
    fix_suggestion:
      "Change default credentials immediately. Use strong, unique passwords and store them securely.",
  },
  {
    id: "INSECURE_PROTOCOL",
    pattern: /(?:url|endpoint|host|server)\s*[=:]\s*["']http:\/\//i,
    severity: "high",
    description:
      "Insecure HTTP protocol detected for service endpoint (should use HTTPS)",
    fix_suggestion:
      "Use HTTPS for all service endpoints. Configure TLS certificates and enforce HTTPS-only connections.",
  },
  {
    id: "MISSING_SECURITY_HEADER",
    pattern:
      /(?:x[_-]frame[_-]options|strict[_-]transport|content[_-]security[_-]policy|x[_-]content[_-]type)\s*[=:]\s*["']?(?:false|disabled|none|off)["']?/i,
    severity: "medium",
    description: "Security header explicitly disabled or set to permissive value",
    fix_suggestion:
      "Enable security headers: X-Frame-Options, Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options.",
  },
  {
    id: "VERBOSE_ERROR_DETAILS",
    pattern:
      /(?:show[_-]?errors?|detailed[_-]?errors?|stack[_-]?trace|error[_-]?detail)\s*[=:]\s*(?:true|1|["']true["'])/i,
    severity: "low",
    description: "Verbose error details enabled, potentially exposing internal system information",
    fix_suggestion:
      "Disable verbose error messages in production. Log detailed errors server-side only and show generic messages to users.",
  },
];

/**
 * Reviews a configuration file against CONFIG_SECURITY_RULES.
 * Pure function -- no database calls.
 */
export function reviewConfigFile(
  configContent: string,
  configPath: string
): Array<{
  rule_id: string;
  severity: string;
  description: string;
  file_path: string;
  line_number?: number;
  fix_suggestion: string;
}> {
  const issues: Array<{
    rule_id: string;
    severity: string;
    description: string;
    file_path: string;
    line_number?: number;
    fix_suggestion: string;
  }> = [];

  const lines = configContent.split("\n");

  for (const rule of CONFIG_SECURITY_RULES) {
    // Check each line for the pattern
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        issues.push({
          rule_id: rule.id,
          severity: rule.severity,
          description: rule.description,
          file_path: configPath,
          line_number: i + 1,
          fix_suggestion: rule.fix_suggestion,
        });
        break; // One issue per rule per file
      }
    }
  }

  return issues;
}

// ---------- Tool Factory ----------

/**
 * Creates 5 AI SDK tool definitions for the AppSec Engineer agent.
 * All database queries are scoped by task.company_id.
 */
export function createAppSecTools(supabase: SupabaseClient, task: AgentTask) {
  const companyId = task.company_id;

  return {
    parseDependencyManifest: tool({
      description:
        "Parse a dependency manifest file (package.json, requirements.txt, or pom.xml) and extract package-version pairs. Pure function -- no database calls.",
      parameters: z.object({
        manifest_content: z.string().describe("The raw content of the manifest file"),
        manifest_type: z
          .enum(["package.json", "requirements.txt", "pom.xml"])
          .describe("The type of manifest file"),
      }),
      execute: async ({ manifest_content, manifest_type }) => {
        const deps = parseDependencyManifest(manifest_content, manifest_type);
        return {
          dependencies: deps,
          total: deps.length,
          manifest_type,
        };
      },
    }),

    matchDependencyVulnerabilities: tool({
      description:
        "Cross-reference package names against the threat_intelligence table to find known CVEs. Matches package names via ILIKE against the description column.",
      parameters: z.object({
        packages: z
          .array(
            z.object({
              name: z.string(),
              version: z.string(),
            })
          )
          .describe("Array of package name-version pairs to check"),
      }),
      execute: async ({ packages }) => {
        const results: Array<{
          package_name: string;
          package_version: string;
          cve_id: string;
          severity: string;
          description: string;
        }> = [];

        for (const pkg of packages) {
          const { data, error } = await supabase
            .from("threat_intelligence")
            .select("cve_id, severity, description, affected_versions")
            .ilike("description", `%${pkg.name}%`)
            .limit(5);

          if (!error && data) {
            for (const cve of data) {
              results.push({
                package_name: pkg.name,
                package_version: pkg.version,
                cve_id: cve.cve_id,
                severity: cve.severity,
                description: cve.description,
              });
            }
          }
        }

        return {
          vulnerabilities: results,
          total_matches: results.length,
          packages_checked: packages.length,
        };
      },
    }),

    reviewConfigFile: tool({
      description:
        "Review a configuration file for security misconfigurations using CONFIG_SECURITY_RULES checklist. Pure function -- no database calls.",
      parameters: z.object({
        config_content: z.string().describe("The raw content of the configuration file"),
        config_type: z
          .string()
          .describe("The file name or type of the configuration file"),
      }),
      execute: async ({ config_content, config_type }) => {
        const issues = reviewConfigFile(config_content, config_type);
        return {
          issues,
          total_issues: issues.length,
          config_type,
        };
      },
    }),

    createAppSecFinding: tool({
      description:
        "Create a new AppSec finding in the database. Persists vulnerability or misconfiguration findings with severity, fix suggestion, and CMMC control mapping.",
      parameters: z.object({
        finding_type: z
          .enum([
            "dependency_vulnerability",
            "config_misconfiguration",
            "hardcoded_secret",
            "deprecated_package",
          ])
          .describe("Type of security finding"),
        severity: z.enum(["critical", "high", "medium", "low"]),
        title: z.string().describe("Finding title/summary"),
        affected_component: z
          .string()
          .describe("Affected package, file, or component"),
        fix_suggestion: z.string().describe("Actionable fix recommendation"),
        fix_version: z.string().optional().describe("Version to upgrade to"),
        cve_id: z.string().optional().describe("CVE identifier if applicable"),
        cmmc_controls: z
          .array(z.string())
          .describe("CMMC controls affected by this finding"),
      }),
      execute: async ({
        finding_type,
        severity,
        title,
        affected_component,
        fix_suggestion,
        fix_version,
        cve_id,
        cmmc_controls,
      }) => {
        const { data, error } = await supabase
          .from("appsec_findings")
          .insert({
            company_id: companyId,
            agent_task_id: task.id,
            finding_type,
            severity,
            title,
            affected_component,
            fix_suggestion,
            fix_version: fix_version ?? null,
            cve_id: cve_id ?? null,
            cmmc_controls,
            status: "open",
          })
          .select("id")
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, finding_id: data?.id };
      },
    }),

    getCompanyTechStack: tool({
      description:
        "Query the company's primary technology stack from onboarding profiles. Returns tech stack info for context-aware vulnerability analysis.",
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
  };
}

// ---------- Prompt Builder ----------

/**
 * Builds the user prompt based on the AppSec task action and input scope.
 */
export function buildAppSecPrompt(
  action: string,
  input: Record<string, unknown>
): string {
  switch (action) {
    case "scan-dependencies":
      return (
        `Scan dependency manifests for known vulnerabilities. ` +
        `Manifest type: ${input.manifest_type ?? "not specified"}. ` +
        `\nSteps:\n` +
        `1. Use getCompanyTechStack to understand the company's technology environment\n` +
        `2. Use parseDependencyManifest to extract package-version pairs from the manifest content\n` +
        `3. Use matchDependencyVulnerabilities to cross-reference packages against CVE data\n` +
        `4. Use createAppSecFinding for each vulnerability found\n` +
        `\nReturn a SecurityReviewReport with dependency findings as structured JSON.`
      );

    case "review-config":
      return (
        `Review configuration files for security misconfigurations. ` +
        `Config type: ${input.config_type ?? "not specified"}. ` +
        `\nSteps:\n` +
        `1. Use getCompanyTechStack to understand the company's technology environment\n` +
        `2. Use reviewConfigFile to apply CONFIG_SECURITY_RULES against the config content\n` +
        `3. Use createAppSecFinding for each misconfiguration detected\n` +
        `\nReturn a SecurityReviewReport with config issues as structured JSON.`
      );

    case "generate-security-report":
      return (
        `Generate a comprehensive security review report aggregating all findings. ` +
        `\nSteps:\n` +
        `1. Use getCompanyTechStack to understand the company's technology environment\n` +
        `2. Scan any provided manifests with parseDependencyManifest and matchDependencyVulnerabilities\n` +
        `3. Review any provided configs with reviewConfigFile\n` +
        `4. Use createAppSecFinding to persist all findings\n` +
        `5. Aggregate findings into a SecurityReviewReport with risk_score and remediation_priority\n` +
        `\nReturn a complete SecurityReviewReport as structured JSON.`
      );

    default:
      return (
        `Execute AppSec action: ${action}. ` +
        `Input: ${JSON.stringify(input)}. ` +
        `Follow CMMC-aligned application security methodology.`
      );
  }
}
