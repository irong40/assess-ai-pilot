/**
 * Incident Response agent domain-specific tools and system prompt.
 *
 * Provides:
 * - IR_SYSTEM_PROMPT: NIST SP 800-61r2 four-phase lifecycle rules for the LLM
 * - createIrTools(): 5 AI SDK tool definitions for database access
 * - buildIrPrompt(): action-specific prompt construction
 *
 * All database queries are scoped by company_id (multi-tenant isolation).
 * ALL IR tasks are risk_level='high' -- every recommendation requires human approval.
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { tool } from "npm:ai@6";
import { z } from "npm:zod@3";
import type { AgentTask } from "./agent-types.ts";

// ---------- System Prompt ----------

/**
 * IR agent system prompt encoding NIST SP 800-61r2 four-phase lifecycle,
 * mandatory human approval rules, and CMMC control references.
 */
export const IR_SYSTEM_PROMPT = `You are the Incident Response (IR) agent for ASSESS-AI, a CMMC compliance platform for small defense contractors. You consume SOC-escalated incidents and produce containment recommendations, step-by-step playbooks, and post-incident reports following the NIST SP 800-61r2 four-phase incident response lifecycle.

## NIST SP 800-61r2 Four-Phase Lifecycle
All incident handling follows these four ordered phases:
1. **Detect** -- Identify and validate the incident through log analysis, alert correlation, and SOC escalation data
2. **Contain** -- Implement short-term and long-term containment to limit damage and prevent lateral movement
3. **Eradicate** -- Remove the root cause (malware, unauthorized access, misconfiguration) from affected systems
4. **Recover** -- Restore systems to normal operation, verify integrity, and monitor for recurrence

## CRITICAL: Mandatory Human Approval
ALL your recommendations require human approval. Every task you process has risk_level='high'. You MUST NOT suggest any action that bypasses the approval gate. Every containment step, every remediation action, and every system change requires explicit human authorization before execution. This is a hard constraint -- IR actions have operational impact on customer systems.

## CMMC IR Controls
Your analysis must reference and assess compliance with these CMMC controls:
- **3.6.1** (IR Plan) -- Establish an operational incident-handling capability that includes preparation, detection, analysis, containment, recovery, and user response activities
- **3.6.2** (IR Testing) -- Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization
- **3.6.3** (IR Reporting) -- Test the organizational incident response capability

## Incident Classification
Classify incidents into one of 9 categories:
malware, unauthorized_access, denial_of_service, data_breach, insider_threat, supply_chain, misconfiguration, policy_violation, unknown

## Analysis Methodology
1. Use getEscalatedIncidents to find SOC alerts with escalation_status='needs_ir_review'
2. Use getIncidentContext to gather threat briefs, IOC data, and SOC correlations
3. Classify the incident type and assess severity
4. Generate containment recommendations with ordered steps per NIST phase
5. Every step must have requires_approval=true
6. Document CMMC control impact (especially 3.6.1, 3.6.2, 3.6.3)
7. For post-incident reports, include root cause analysis, lessons learned, and compliance impact

## Output Format
Always produce structured JSON output conforming to the IrAnalysisResult schema. Include containment recommendations, playbook guidance, or post-incident reports depending on the action.

## Constraints
- Never take direct action on systems -- only produce recommendations
- All queries must be scoped to the task's company_id
- Every containment step requires human approval (requires_approval=true)
- Reference specific CMMC controls when assessing compliance impact
- Post-incident reports MUST include compliance_impact with affected_controls and sprs_impact`;

/**
 * The 5 IR domain-specific tool names for validation and testing.
 */
export const IR_TOOL_NAMES = [
  "getEscalatedIncidents",
  "getIncidentContext",
  "createIrIncident",
  "saveContainmentPlan",
  "savePostIncidentReport",
] as const;

// ---------- Tool Factory ----------

/**
 * Creates 5 AI SDK tool definitions for the Incident Response agent.
 * All database queries are scoped by task.company_id.
 */
export function createIrTools(supabase: SupabaseClient, task: AgentTask) {
  const companyId = task.company_id;

  return {
    getEscalatedIncidents: tool({
      description:
        "Query SOC alerts that have been escalated for IR review (escalation_status='needs_ir_review'). Returns alerts needing incident response analysis.",
      parameters: z.object({
        limit: z
          .number()
          .int()
          .optional()
          .describe("Max results to return (default 10)"),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from("soc_alerts")
          .select(
            "id, external_cve_id, title, severity, cvss_score, tech_stack_match, relevance_score, classification, classification_reasoning, escalation_status, affected_controls, created_at"
          )
          .eq("company_id", companyId)
          .eq("escalation_status", "needs_ir_review")
          .order("cvss_score", { ascending: false })
          .limit(limit ?? 10);

        if (error) return { error: error.message, incidents: [] };
        return { incidents: data ?? [], total: data?.length ?? 0 };
      },
    }),

    getIncidentContext: tool({
      description:
        "Gather context for an incident from multiple data sources: threat briefs, IOC tracking, and SOC alert correlations.",
      parameters: z.object({
        soc_alert_id: z
          .string()
          .uuid()
          .optional()
          .describe("SOC alert ID to gather context for"),
        incident_type: z
          .string()
          .optional()
          .describe("Incident type to filter context by"),
      }),
      execute: async ({ soc_alert_id, incident_type }) => {
        // Gather threat briefs
        const { data: threatBriefs } = await supabase
          .from("threat_briefs")
          .select("id, title, severity, affected_controls, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(5);

        // Gather active IOCs
        const { data: iocs } = await supabase
          .from("ioc_tracking")
          .select(
            "id, indicator_type, indicator_value, confidence_level, source, first_seen, last_seen"
          )
          .eq("company_id", companyId)
          .gt("expires_at", new Date().toISOString())
          .order("last_seen", { ascending: false })
          .limit(10);

        // Gather SOC correlations if alert provided
        let correlations: any[] = [];
        if (soc_alert_id) {
          const { data: corr } = await supabase
            .from("soc_alert_correlations")
            .select("source_type, source_id, relevance_score, correlation_reasoning")
            .eq("soc_alert_id", soc_alert_id);
          correlations = corr ?? [];
        }

        return {
          threat_briefs: threatBriefs ?? [],
          active_iocs: iocs ?? [],
          correlations,
          context_note: incident_type
            ? `Context filtered for incident type: ${incident_type}`
            : "General incident context gathered",
        };
      },
    }),

    createIrIncident: tool({
      description:
        "Create a new IR incident record in the database. Links to the SOC alert that triggered the incident.",
      parameters: z.object({
        soc_alert_id: z
          .string()
          .uuid()
          .optional()
          .describe("SOC alert ID that triggered this incident"),
        incident_type: z.string().describe("Incident type classification"),
        severity: z.enum(["critical", "high", "medium", "low"]),
        title: z.string().describe("Incident title/summary"),
        description: z.string().describe("Detailed incident description"),
      }),
      execute: async ({ soc_alert_id, incident_type, severity, title, description }) => {
        const { data, error } = await supabase
          .from("ir_incidents")
          .insert({
            company_id: companyId,
            agent_task_id: task.id,
            soc_alert_id: soc_alert_id ?? null,
            incident_type,
            severity,
            title,
            description,
            status: "open",
          })
          .select("id")
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, incident_id: data?.id };
      },
    }),

    saveContainmentPlan: tool({
      description:
        "Save a containment plan to an existing IR incident. Updates the containment_plan JSONB and sets status to 'investigating'.",
      parameters: z.object({
        incident_id: z.string().uuid().describe("IR incident ID to update"),
        containment_plan: z
          .record(z.unknown())
          .describe("The containment plan object (ContainmentRecommendation schema)"),
      }),
      execute: async ({ incident_id, containment_plan }) => {
        const { error } = await supabase
          .from("ir_incidents")
          .update({
            containment_plan,
            status: "investigating",
            updated_at: new Date().toISOString(),
          })
          .eq("id", incident_id)
          .eq("company_id", companyId);

        if (error) return { success: false, error: error.message };
        return { success: true, incident_id, status: "investigating" };
      },
    }),

    savePostIncidentReport: tool({
      description:
        "Save a post-incident report to an existing IR incident and create a compliance snapshot linking the incident to compliance impact.",
      parameters: z.object({
        incident_id: z.string().uuid().describe("IR incident ID to update"),
        post_incident_report: z
          .record(z.unknown())
          .describe("The post-incident report object (PostIncidentReport schema)"),
        compliance_impact: z
          .record(z.unknown())
          .optional()
          .describe("Compliance impact details for snapshot creation"),
      }),
      execute: async ({
        incident_id,
        post_incident_report,
        compliance_impact,
      }) => {
        // Update the IR incident with the report
        const { error: updateError } = await supabase
          .from("ir_incidents")
          .update({
            post_incident_report,
            compliance_impact: compliance_impact ?? null,
            status: "recovered",
            updated_at: new Date().toISOString(),
          })
          .eq("id", incident_id)
          .eq("company_id", companyId);

        if (updateError) return { success: false, error: updateError.message };

        // Create compliance snapshot linking incident to compliance impact (Pitfall 6)
        const { error: snapshotError } = await supabase
          .from("compliance_snapshots")
          .insert({
            company_id: companyId,
            agent_task_id: task.id,
            snapshot_type: "incident_impact",
            report: {
              incident_id,
              compliance_impact: compliance_impact ?? post_incident_report,
              source: "ir-agent",
            },
          });

        if (snapshotError) {
          console.error(
            "Failed to create compliance snapshot for IR report:",
            snapshotError
          );
          // Non-fatal: report still saved even if snapshot fails
        }

        return {
          success: true,
          incident_id,
          status: "recovered",
          compliance_snapshot_created: !snapshotError,
        };
      },
    }),
  };
}

// ---------- Prompt Builder ----------

/**
 * Builds the user prompt based on the IR task action and input scope.
 */
export function buildIrPrompt(
  action: string,
  input: Record<string, unknown>
): string {
  switch (action) {
    case "analyze-incident":
      return (
        `Analyze escalated SOC alerts and create incident response recommendations. ` +
        `Incident ID: ${input.incident_id ?? "not specified"}. ` +
        `\nSteps:\n` +
        `1. Use getEscalatedIncidents to find SOC alerts needing IR review\n` +
        `2. Use getIncidentContext to gather threat briefs, IOCs, and correlations\n` +
        `3. Classify the incident type and assess severity\n` +
        `4. Use createIrIncident to create the IR incident record\n` +
        `5. Generate containment recommendations following NIST 800-61r2 phases\n` +
        `6. Use saveContainmentPlan to persist the containment plan\n` +
        `\nReturn an IrAnalysisResult with containment recommendations as structured JSON.`
      );

    case "generate-playbook":
      return (
        `Generate a step-by-step incident response playbook for an existing incident. ` +
        `Incident ID: ${input.incident_id ?? "not specified"}. ` +
        `\nSteps:\n` +
        `1. Use getIncidentContext to review the incident details and context\n` +
        `2. Create ordered steps for each NIST phase (detect, contain, eradicate, recover)\n` +
        `3. Each step must have requires_approval=true\n` +
        `4. Reference applicable CMMC controls (3.6.1, 3.6.2, 3.6.3)\n` +
        `\nReturn an IrAnalysisResult with playbook guidance as structured JSON.`
      );

    case "create-post-incident-report":
      return (
        `Create a post-incident report for a resolved incident. ` +
        `Incident ID: ${input.incident_id ?? "not specified"}. ` +
        `\nSteps:\n` +
        `1. Use getIncidentContext to review the full incident history\n` +
        `2. Document the timeline of events from detection through recovery\n` +
        `3. Identify root cause and lessons learned\n` +
        `4. Assess compliance impact (affected CMMC controls, SPRS score impact)\n` +
        `5. Use savePostIncidentReport to persist the report and create compliance snapshot\n` +
        `\nReturn an IrAnalysisResult with post-incident report as structured JSON.`
      );

    default:
      return (
        `Execute IR action: ${action}. ` +
        `Input: ${JSON.stringify(input)}. ` +
        `Follow NIST SP 800-61r2 incident response methodology.`
      );
  }
}
