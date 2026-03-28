/**
 * CISO Orchestrator system prompt, tool definitions, and prompt builder.
 *
 * Node/vitest-compatible version. The Deno Edge Function counterpart at
 * supabase/functions/_shared/ciso-tools.ts mirrors these constants and
 * additionally provides the runtime tool implementations that interact
 * with Supabase.
 *
 * Exports used by tests:
 * - CISO_SYSTEM_PROMPT: The system prompt for the CISO Orchestrator
 * - CISO_TOOL_NAMES: Array of tool names the CISO has access to
 * - buildCisoPrompt: Constructs action-specific user prompts
 */

// --------------------------------------------------------------------------
// CISO System Prompt
// --------------------------------------------------------------------------
export const CISO_SYSTEM_PROMPT = `You are the CISO Orchestrator for the ASSESS-AI CMMC compliance platform.

## Role
You receive high-level compliance requests, break them into scoped tasks, delegate to specialist agents (primarily the GRC Analyst), and synthesize their results into executive-level summaries.

## Critical Rule
You NEVER perform detailed compliance analysis directly. All analysis work is delegated to the GRC Analyst or other specialist agents via the delegateToGRC tool.

## Priority Ordering
When planning delegation tasks, follow this strict priority queue:
1. Critical controls (highest priority, always first):
   - MFA (3.5.3) - Multi-factor authentication
   - FIPS encryption (3.13.11) - Cryptographic protection of CUI
   - Incident response (3.6.1, 3.6.2) - IR plan and reporting
   - Audit logging (3.3.1, 3.3.2) - System audit and accountability
   - System Security Plan (SSP) - Foundational documentation
2. High-SPRS-weight controls (5-point controls) - highest score impact
3. Controls with existing findings - remediation tracking
4. User-requested assessments before scheduled assessments

## Delegation Rules
- Use the delegateToGRC tool to assign work to the GRC Analyst
- Scope each delegation by control family or specific control IDs
- Include the CMMC level and company context in every delegation
- Track your delegation plan in the task output

## Escalation Rules
- Set risk_level to 'high' for findings involving critical controls listed above
- Set risk_level to 'high' for systemic failures (multiple controls in same family failing)
- The existing approval gate system will block high-risk tasks for human review
- Medium and low risk findings proceed automatically

## Synthesis Behavior
- When reading completed subtask results, look for patterns across control families
- Generate an executive summary that a non-technical CISO can act on
- Always include SPRS score impact and trend direction
- Prioritize recommendations by risk reduction value

## SOC Analyst Delegation
- Use delegateToSOC tool to assign alert triage and correlation tasks
- Delegate triage-alerts when new CVEs are detected or on scheduled scans
- Delegate correlate-findings to link SOC alerts with compliance gaps
- Delegate classify-alert for individual alert investigation
- SOC alerts with escalation_status='needs_ir_review' should be flagged for human approval (IR agent not yet available)

## Threat Intelligence Delegation
- Use delegateToThreatIntel tool for strategic threat analysis tasks
- Delegate generate-threat-brief for periodic threat landscape reports relevant to company tech stack
- Delegate scan-iocs to extract and track indicators of compromise from recent CVEs
- Delegate map-attack-surface for comprehensive risk mapping combining tech stack, compliance gaps, and active threats
- Threat briefs map CVE threats to specific CMMC controls via CWE categorization

## Incident Response Delegation
- Use delegateToIR for incident handling after SOC escalation (escalation_status='needs_ir_review')
- IR actions: 'analyze-incident', 'generate-playbook', 'create-post-incident-report'
- ALL IR tasks are high-risk -- always set priority to 'critical' or 'high'
- IR recommendations require human approval before any containment action

## AppSec Engineer Delegation
- Use delegateToAppSec tool for dependency scanning and configuration review tasks
- Delegate scan-dependencies to analyze package.json, requirements.txt, or pom.xml manifests
- Delegate review-config to check configuration files against security rules checklist
- Delegate security-review for comprehensive security reports aggregating all findings
- AppSec findings map to CMMC control families AC, SI, and CM

## Pen Test Delegation
- Use delegateToPenTest tool for passive vulnerability discovery tasks
- Pen Test agent performs PASSIVE ONLY analysis -- no active exploitation, no network scanning
- Delegate passive-scan for full tech stack CVE matching against threat_intelligence table
- Delegate tech-stack-cve-match for focused CVE matching on specific technology components
- ALL Pen Test tasks are high-risk -- requires company authorization AND human approval (double-gate)
- Pen Test findings map to CMMC controls 3.11.2 (scan for vulnerabilities) and 3.11.3 (remediate vulnerabilities)
`;

// --------------------------------------------------------------------------
// Tool Names
// --------------------------------------------------------------------------
export const CISO_TOOL_NAMES = [
  'delegateToGRC',
  'delegateToSOC',
  'delegateToThreatIntel',
  'delegateToIR',
  'delegateToAppSec',
  'delegateToPenTest',
  'readCompletedTaskResults',
  'getCurrentRiskPosture',
  'createFollowUpTask',
] as const;

// --------------------------------------------------------------------------
// Prompt Builder
// --------------------------------------------------------------------------

/**
 * Builds action-specific user prompts for the CISO Orchestrator.
 *
 * @param action - The CISO action to perform
 * @param input - Input parameters for the action
 * @returns Formatted prompt string
 */
export function buildCisoPrompt(
  action: string,
  input: Record<string, unknown>
): string {
  switch (action) {
    case 'run-compliance-assessment':
      return (
        `Run a compliance assessment for company. ` +
        `Assessment ID: ${input.assessment_id ?? 'not specified'}. ` +
        `CMMC Level: ${input.cmmc_level ?? 2}. ` +
        (input.control_family
          ? `Focus on control family: ${input.control_family}. `
          : 'Assess all control families. ') +
        `Plan your delegation strategy, prioritize critical controls, delegate gap analyses to the GRC Analyst, ` +
        `and create a follow-up task to synthesize results once all delegations complete.`
      );

    case 'synthesize-results':
      return (
        `Synthesize the results from completed subtasks. ` +
        `Read all completed task outputs using the readCompletedTaskResults tool. ` +
        `Identify patterns across control families, calculate overall compliance posture, ` +
        `and generate an executive summary with prioritized recommendations.`
      );

    case 'generate-executive-summary':
      return (
        `Generate an executive summary of the current compliance state. ` +
        `Use getCurrentRiskPosture to get the latest compliance snapshot, ` +
        `then read any recent completed assessments. ` +
        `Produce a summary suitable for a non-technical CISO covering: ` +
        `overall posture, critical gaps, SPRS score trend, and prioritized next steps.`
      );

    case 'assess-risk-posture':
      return (
        `Assess the current risk posture for the company. ` +
        `Use getCurrentRiskPosture to retrieve the latest compliance snapshot. ` +
        `Analyze domain-level risks, identify the top findings by SPRS weight impact, ` +
        `determine the overall trend (improving/stable/declining), ` +
        `and flag any domains requiring immediate attention.`
      );

    case 'triage-alerts':
      return (
        `Triage recent CVE alerts for the company. ` +
        `Delegate to SOC Analyst for tech-stack-aware alert analysis. ` +
        `Severity filter: ${input.severity_filter ?? 'all'}. ` +
        `Time range: ${input.time_range_hours ?? 168} hours. ` +
        `Use delegateToSOC to assign triage-alerts to the SOC Analyst, ` +
        `then schedule a follow-up to review SOC escalation recommendations.`
      );

    case 'generate-threat-brief':
      return (
        `Generate a threat intelligence brief for the company. ` +
        `Delegate to Threat Intel agent for strategic threat analysis. ` +
        `Use delegateToThreatIntel to assign generate-threat-brief, ` +
        `then schedule a follow-up to review the completed brief and distribute findings.`
      );

    case 'security-posture-review':
      return (
        `Conduct a comprehensive security posture review. ` +
        `Delegate threat analysis to Threat Intel (generate-threat-brief), ` +
        `alert triage to SOC (triage-alerts), ` +
        `and compliance assessment to GRC (gap-analysis). ` +
        `After all delegations complete, synthesize results into an executive security posture report.`
      );

    case 'handle-incident':
      return (
        `Handle a security incident requiring IR response. ` +
        `Incident ID: ${input.incident_id ?? 'not specified'}. ` +
        `SOC alert IDs: ${JSON.stringify(input.soc_alert_ids ?? [])}. ` +
        `Use delegateToIR to assign analyze-incident to the IR agent. ` +
        `All IR tasks are high-risk and require human approval. ` +
        `Schedule a follow-up to review IR containment recommendations.`
      );

    case 'post-incident-review':
      return (
        `Conduct a post-incident review for a resolved incident. ` +
        `Incident ID: ${input.incident_id ?? 'not specified'}. ` +
        `Use delegateToIR to assign create-post-incident-report to the IR agent. ` +
        `The post-incident report will include root cause analysis, lessons learned, ` +
        `and compliance impact assessment for CMMC controls 3.6.1-3.6.3.`
      );

    case 'scan-dependencies':
      return (
        `Scan dependency manifests for known vulnerabilities. ` +
        `Manifest type: ${input.manifest_type ?? 'not specified'}. ` +
        `Use delegateToAppSec to assign scan-dependencies to the AppSec Engineer agent. ` +
        `AppSec will parse the manifest, match against CVE data, and create findings. ` +
        `Schedule a follow-up to review AppSec vulnerability findings.`
      );

    case 'security-review':
      return (
        `Conduct a comprehensive application security review. ` +
        `Use delegateToAppSec to assign generate-security-report to the AppSec Engineer agent. ` +
        `AppSec will scan manifests, review configs, and produce a SecurityReviewReport. ` +
        `Schedule a follow-up to review findings and integrate with compliance posture.`
      );

    case 'passive-vulnerability-scan':
      return (
        `Conduct a passive vulnerability scan for the company. ` +
        `Use delegateToPenTest to assign passive-scan to the Pen Test agent. ` +
        `Pen Test will match the company's tech stack against known CVE patterns. ` +
        `ALL Pen Test tasks are high-risk and require human approval. ` +
        `Schedule a follow-up to review Pen Test vulnerability findings.`
      );

    default:
      return (
        `Execute CISO action: ${action}. ` +
        `Input: ${JSON.stringify(input)}. ` +
        `Determine the appropriate delegation strategy and proceed.`
      );
  }
}
