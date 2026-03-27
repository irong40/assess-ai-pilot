/**
 * CISO Orchestrator system prompt, tool definitions, and prompt builder.
 *
 * Provides the runtime tool implementations that interact with Supabase
 * for the CISO Orchestrator Edge Function.
 *
 * Tools:
 * 1. delegateToGRC - Delegates tasks to the GRC Analyst via agent-base delegateTask
 * 2. delegateToSOC - Delegates tasks to the SOC Analyst
 * 3. delegateToThreatIntel - Delegates tasks to the Threat Intelligence agent
 * 4. readCompletedTaskResults - Reads completed subtask outputs
 * 5. getCurrentRiskPosture - Queries latest compliance snapshot
 * 6. createFollowUpTask - Schedules follow-up CISO tasks
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { tool } from "npm:ai@6";
import type { AgentTask } from "./agent-types.ts";
import { delegateTask } from "./agent-base.ts";

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
`;

// --------------------------------------------------------------------------
// Tool Names (exported for testing)
// --------------------------------------------------------------------------
export const CISO_TOOL_NAMES = [
  "delegateToGRC",
  "delegateToSOC",
  "delegateToThreatIntel",
  "readCompletedTaskResults",
  "getCurrentRiskPosture",
  "createFollowUpTask",
] as const;

// --------------------------------------------------------------------------
// Tool Factory
// --------------------------------------------------------------------------

/**
 * Creates the CISO Orchestrator tool set bound to the current supabase client
 * and parent task context.
 *
 * @param supabase - Service role Supabase client
 * @param task - The current CISO agent task (used for company_id, task.id)
 */
export function createCisoTools(supabase: SupabaseClient, task: AgentTask) {
  return {
    /**
     * Delegates a scoped task to the GRC Analyst.
     * Calls the shared delegateTask function from agent-base.ts.
     */
    delegateToGRC: tool({
      description:
        "Delegate a compliance analysis task to the GRC Analyst. " +
        "Scope the task by control family or specific control IDs. " +
        "The GRC Analyst will perform the detailed gap analysis.",
      parameters: z.object({
        action: z
          .string()
          .describe(
            "The action for the GRC Analyst, e.g., 'gap-analysis', 'control-assessment'"
          ),
        scope: z
          .object({
            control_family: z.string().optional(),
            control_ids: z.array(z.string()).optional(),
            cmmc_level: z.number().min(1).max(3).optional(),
          })
          .describe("Scope of the delegation"),
        priority: z
          .enum(["critical", "high", "medium", "low"])
          .describe("Priority level for the delegated task"),
      }),
      execute: async ({ action, scope, priority }) => {
        const result = await delegateTask(
          supabase,
          task,
          "grc-analyst",
          action,
          {
            ...scope,
            company_id: task.company_id,
            priority,
          }
        );

        if ("error" in result) {
          return { success: false, error: result.error };
        }

        return {
          success: true,
          taskId: result.taskId,
          delegated_to: "grc-analyst",
          action,
          scope,
          priority,
        };
      },
    }),

    /**
     * Delegates a scoped task to the SOC Analyst.
     * Calls the shared delegateTask function from agent-base.ts.
     */
    delegateToSOC: tool({
      description:
        "Delegate an alert triage, correlation, or classification task to the SOC Analyst agent.",
      parameters: z.object({
        action: z
          .string()
          .describe(
            "SOC action: 'triage-alerts', 'correlate-findings', 'classify-alert'"
          ),
        scope: z
          .object({
            severity_filter: z.string().optional(),
            time_range_hours: z.number().optional(),
            alert_ids: z.array(z.string()).optional(),
          })
          .describe("Scope of the SOC task"),
        priority: z
          .enum(["critical", "high", "medium", "low"])
          .describe("Priority level for the delegated task"),
      }),
      execute: async ({ action, scope, priority }) => {
        const result = await delegateTask(
          supabase,
          task,
          "soc-analyst",
          action,
          {
            ...scope,
            company_id: task.company_id,
            priority,
          }
        );

        if ("error" in result) {
          return { success: false, error: result.error };
        }

        return {
          success: true,
          taskId: result.taskId,
          delegated_to: "soc-analyst",
          action,
          scope,
          priority,
        };
      },
    }),

    /**
     * Delegates a scoped task to the Threat Intelligence agent.
     * Calls the shared delegateTask function from agent-base.ts.
     */
    delegateToThreatIntel: tool({
      description:
        "Delegate a threat analysis, brief generation, or IOC scanning task to the Threat Intelligence agent.",
      parameters: z.object({
        action: z
          .string()
          .describe(
            "Threat Intel action: 'generate-threat-brief', 'scan-iocs', 'map-attack-surface'"
          ),
        scope: z
          .object({
            severity_filter: z.string().optional(),
            time_range_hours: z.number().optional(),
            focus_families: z.array(z.string()).optional(),
          })
          .describe("Scope of the Threat Intel task"),
        priority: z
          .enum(["critical", "high", "medium", "low"])
          .describe("Priority level for the delegated task"),
      }),
      execute: async ({ action, scope, priority }) => {
        const result = await delegateTask(
          supabase,
          task,
          "threat-intel",
          action,
          {
            ...scope,
            company_id: task.company_id,
            priority,
          }
        );

        if ("error" in result) {
          return { success: false, error: result.error };
        }

        return {
          success: true,
          taskId: result.taskId,
          delegated_to: "threat-intel",
          action,
          scope,
          priority,
        };
      },
    }),

    /**
     * Reads completed subtask results for synthesis.
     */
    readCompletedTaskResults: tool({
      description:
        "Read outputs from completed child tasks delegated by this CISO task. " +
        "Use this to synthesize results after delegations complete.",
      parameters: z.object({
        status_filter: z
          .enum(["completed", "failed", "all"])
          .default("completed")
          .describe("Filter subtasks by status"),
      }),
      execute: async ({ status_filter }) => {
        let query = supabase
          .from("agent_tasks")
          .select(
            "id, agent_type, action, status, output, error, reasoning_summary, completed_at"
          )
          .eq("parent_task_id", task.id)
          .eq("company_id", task.company_id);

        if (status_filter !== "all") {
          query = query.eq("status", status_filter);
        }

        const { data, error } = await query.order("completed_at", {
          ascending: true,
        });

        if (error) {
          return { success: false, error: error.message, tasks: [] };
        }

        return {
          success: true,
          task_count: data?.length ?? 0,
          tasks:
            data?.map((t) => ({
              id: t.id,
              agent_type: t.agent_type,
              action: t.action,
              status: t.status,
              output: t.output,
              error: t.error,
              reasoning: t.reasoning_summary,
            })) ?? [],
        };
      },
    }),

    /**
     * Reads the latest compliance snapshot for the company.
     */
    getCurrentRiskPosture: tool({
      description:
        "Get the current risk posture from the latest compliance snapshot. " +
        "Returns SPRS score, met/not-met counts, and POAM eligibility.",
      parameters: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("compliance_snapshots")
          .select("*")
          .eq("company_id", task.company_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          return {
            success: false,
            error: error.message,
            note: "compliance_snapshots table may not exist yet",
          };
        }

        if (!data) {
          return {
            success: true,
            snapshot: null,
            note: "No compliance snapshot found for this company. This may be the first assessment.",
          };
        }

        return {
          success: true,
          snapshot: data,
        };
      },
    }),

    /**
     * Creates a follow-up CISO task for later processing.
     * Used to schedule synthesis after delegations complete.
     */
    createFollowUpTask: tool({
      description:
        "Create a follow-up CISO task to be processed later. " +
        "Use this to schedule result synthesis after delegated tasks complete.",
      parameters: z.object({
        action: z
          .string()
          .describe(
            "The follow-up action, e.g., 'synthesize-results'"
          ),
        input: z
          .record(z.unknown())
          .default({})
          .describe("Input data for the follow-up task"),
        delay_minutes: z
          .number()
          .min(0)
          .optional()
          .describe(
            "Optional delay in minutes before processing (default: immediate)"
          ),
      }),
      execute: async ({ action, input: followUpInput, delay_minutes }) => {
        // Insert the follow-up task
        const { data: newTask, error: insertError } = await supabase
          .from("agent_tasks")
          .insert({
            company_id: task.company_id,
            agent_type: "ciso_orchestrator",
            action,
            input: {
              ...followUpInput,
              parent_assessment_task_id: task.id,
              scheduled_delay_minutes: delay_minutes ?? 0,
            },
            parent_task_id: task.id,
            source_agent: null, // Self-created follow-up, not a delegation
            delegation_depth: 0,
            risk_level: "low",
          })
          .select("id")
          .single();

        if (insertError || !newTask) {
          return {
            success: false,
            error: `Failed to create follow-up task: ${insertError?.message ?? "unknown"}`,
          };
        }

        // Enqueue via pgmq for processing
        // deno-lint-ignore no-explicit-any
        const { error: queueError } = await (supabase as any)
          .schema("pgmq_public")
          .rpc("send", {
            queue_name: "agent_tasks",
            message: {
              task_id: newTask.id,
              company_id: task.company_id,
              agent_type: "ciso-orchestrator",
              action,
              input: followUpInput,
              parent_task_id: task.id,
              delegation_depth: 0,
              risk_level: "low",
            },
          });

        if (queueError) {
          console.error("Failed to enqueue follow-up task:", queueError);
        }

        return {
          success: true,
          taskId: newTask.id,
          action,
          delay_minutes: delay_minutes ?? 0,
        };
      },
    }),
  };
}

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
    case "run-compliance-assessment":
      return (
        `Run a compliance assessment for company. ` +
        `Assessment ID: ${input.assessment_id ?? "not specified"}. ` +
        `CMMC Level: ${input.cmmc_level ?? 2}. ` +
        (input.control_family
          ? `Focus on control family: ${input.control_family}. `
          : "Assess all control families. ") +
        `Plan your delegation strategy, prioritize critical controls, delegate gap analyses to the GRC Analyst, ` +
        `and create a follow-up task to synthesize results once all delegations complete.`
      );

    case "synthesize-results":
      return (
        `Synthesize the results from completed subtasks. ` +
        `Read all completed task outputs using the readCompletedTaskResults tool. ` +
        `Identify patterns across control families, calculate overall compliance posture, ` +
        `and generate an executive summary with prioritized recommendations.`
      );

    case "generate-executive-summary":
      return (
        `Generate an executive summary of the current compliance state. ` +
        `Use getCurrentRiskPosture to get the latest compliance snapshot, ` +
        `then read any recent completed assessments. ` +
        `Produce a summary suitable for a non-technical CISO covering: ` +
        `overall posture, critical gaps, SPRS score trend, and prioritized next steps.`
      );

    case "assess-risk-posture":
      return (
        `Assess the current risk posture for the company. ` +
        `Use getCurrentRiskPosture to retrieve the latest compliance snapshot. ` +
        `Analyze domain-level risks, identify the top findings by SPRS weight impact, ` +
        `determine the overall trend (improving/stable/declining), ` +
        `and flag any domains requiring immediate attention.`
      );

    case "triage-alerts":
      return (
        `Triage recent CVE alerts for the company. ` +
        `Delegate to SOC Analyst for tech-stack-aware alert analysis. ` +
        `Severity filter: ${input.severity_filter ?? "all"}. ` +
        `Time range: ${input.time_range_hours ?? 168} hours. ` +
        `Use delegateToSOC to assign triage-alerts to the SOC Analyst, ` +
        `then schedule a follow-up to review SOC escalation recommendations.`
      );

    case "generate-threat-brief":
      return (
        `Generate a threat intelligence brief for the company. ` +
        `Delegate to Threat Intel agent for strategic threat analysis. ` +
        `Use delegateToThreatIntel to assign generate-threat-brief, ` +
        `then schedule a follow-up to review the completed brief and distribute findings.`
      );

    case "security-posture-review":
      return (
        `Conduct a comprehensive security posture review. ` +
        `Delegate threat analysis to Threat Intel (generate-threat-brief), ` +
        `alert triage to SOC (triage-alerts), ` +
        `and compliance assessment to GRC (gap-analysis). ` +
        `After all delegations complete, synthesize results into an executive security posture report.`
      );

    default:
      return (
        `Execute CISO action: ${action}. ` +
        `Input: ${JSON.stringify(input)}. ` +
        `Determine the appropriate delegation strategy and proceed.`
      );
  }
}
