/**
 * Shared agent execution framework for the ASSESS-AI multi-agent system.
 * Every agent Edge Function imports this module for:
 * - Task lifecycle management (status transitions, timestamps)
 * - Company_id scoping on every database query
 * - Hub-and-spoke topology enforcement
 * - Delegation depth validation
 * - Audit logging with AI reasoning
 *
 * Non-negotiable: ALL database queries include .eq('company_id', task.company_id)
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  type AgentTask,
  type AgentType,
  type TaskStatus,
  AgentTaskSchema,
  AgentMessageSchema,
  MAX_DELEGATION_DEPTH,
  isValidTransition,
} from "./agent-types.ts";
import {
  checkApprovalRequired,
  createApprovalRequest,
} from "./approval-gate.ts";

/**
 * The result returned by an agent handler function.
 */
export interface AgentHandlerResult {
  output: unknown;
  reasoning: string;
}

/**
 * An agent handler function that performs the actual AI work.
 * Receives the validated task and returns output + reasoning.
 */
export type AgentHandler = (
  task: AgentTask
) => Promise<AgentHandlerResult>;

/**
 * Executes an agent task through its full lifecycle:
 * 1. Validates company_id, delegation depth, hub-and-spoke rules
 * 2. Transitions task to 'running'
 * 3. Executes the handler
 * 4. On success with high risk: sets 'awaiting_approval'
 * 5. On success with low/medium risk: sets 'completed'
 * 6. On error: sets 'failed'
 * 7. Logs audit event with AI reasoning
 *
 * @param supabase - Service role Supabase client
 * @param task - The agent task to execute
 * @param handler - The agent-specific handler function
 */
export async function executeAgentTask(
  supabase: SupabaseClient,
  task: AgentTask,
  handler: AgentHandler
): Promise<{ success: boolean; status: TaskStatus; error?: string }> {
  // 1. Validate company_id exists in the companies table
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("id", task.company_id)
    .single();

  if (companyError || !company) {
    await updateTaskStatus(supabase, task, "failed", {
      error: `Company not found: ${task.company_id}`,
    });
    return { success: false, status: "failed", error: "Company not found" };
  }

  // 2. Validate delegation_depth < MAX_DELEGATION_DEPTH
  if (task.delegation_depth >= MAX_DELEGATION_DEPTH) {
    const errorMsg = `Delegation depth ${task.delegation_depth} exceeds maximum of ${MAX_DELEGATION_DEPTH - 1}`;
    await updateTaskStatus(supabase, task, "failed", { error: errorMsg });
    await logAuditEvent(supabase, task, "agent_task_rejected", errorMsg);
    return { success: false, status: "failed", error: errorMsg };
  }

  // 3. If task has source_agent, validate it is 'ciso_orchestrator' (hub-and-spoke)
  if (task.source_agent && task.source_agent !== "ciso-orchestrator") {
    const errorMsg = `Hub-and-spoke violation: only ciso-orchestrator can delegate, got ${task.source_agent}`;
    await updateTaskStatus(supabase, task, "failed", { error: errorMsg });
    await logAuditEvent(supabase, task, "agent_task_rejected", errorMsg);
    return { success: false, status: "failed", error: errorMsg };
  }

  // 4. Update status to 'running', set started_at
  await updateTaskStatus(supabase, task, "running", {
    started_at: new Date().toISOString(),
  });

  try {
    // 5. Execute the handler
    const result = await handler(task);

    // 6. High risk: create approval request, set 'awaiting_approval'
    if (checkApprovalRequired(task)) {
      await updateTaskStatus(supabase, task, "awaiting_approval", {
        reasoning_summary: result.reasoning,
        // Output is stored but task stays in awaiting_approval until approved
        output: result.output,
      });

      // Create formal approval request and broadcast via Realtime
      try {
        await createApprovalRequest(supabase, task);
      } catch (err) {
        console.error(
          `Failed to create approval request for task ${task.id}:`,
          err
        );
        // Approval request creation failure does not fail the task --
        // the task is already in awaiting_approval state and can be
        // discovered via dashboard query
      }

      await logAuditEvent(
        supabase,
        task,
        "agent_task_awaiting_approval",
        result.reasoning
      );
      return { success: true, status: "awaiting_approval" };
    }

    // 7. Low/medium risk: set 'completed', write output
    await updateTaskStatus(supabase, task, "completed", {
      output: result.output,
      reasoning_summary: result.reasoning,
      completed_at: new Date().toISOString(),
    });
    await logAuditEvent(
      supabase,
      task,
      "agent_task_completed",
      result.reasoning
    );
    return { success: true, status: "completed" };
  } catch (err) {
    // 8. On error: set 'failed', write error message
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    await updateTaskStatus(supabase, task, "failed", {
      error: errorMessage,
      completed_at: new Date().toISOString(),
    });
    await logAuditEvent(
      supabase,
      task,
      "agent_task_failed",
      `Error: ${errorMessage}`
    );
    return { success: false, status: "failed", error: errorMessage };
  }
}

/**
 * Delegates a task from the CISO orchestrator to a specialist agent.
 * Creates a new agent_tasks row and sends a message to the pgmq queue.
 *
 * @param supabase - Service role Supabase client
 * @param fromTask - The parent task (must be from ciso-orchestrator)
 * @param toAgentType - The specialist agent to delegate to
 * @param action - The action for the delegated task
 * @param input - Input data for the delegated task
 */
export async function delegateTask(
  supabase: SupabaseClient,
  fromTask: AgentTask,
  toAgentType: AgentType,
  action: string,
  input: Record<string, unknown> = {}
): Promise<{ taskId: string } | { error: string }> {
  // Validate: only ciso-orchestrator can delegate
  if (fromTask.agent_type !== "ciso-orchestrator") {
    return {
      error: `Only ciso-orchestrator can delegate tasks, got ${fromTask.agent_type}`,
    };
  }

  // Calculate new delegation depth
  const newDepth = fromTask.delegation_depth + 1;
  if (newDepth >= MAX_DELEGATION_DEPTH) {
    return {
      error: `Delegation depth ${newDepth} would exceed maximum of ${MAX_DELEGATION_DEPTH - 1}`,
    };
  }

  // Insert new agent_tasks row
  const { data: newTask, error: insertError } = await supabase
    .from("agent_tasks")
    .insert({
      company_id: fromTask.company_id,
      agent_type: toAgentType.replace(/-/g, "_"), // Convert to Postgres enum format
      action,
      input,
      parent_task_id: fromTask.id,
      source_agent: "ciso_orchestrator",
      delegation_depth: newDepth,
      risk_level: "low",
    })
    .select("id")
    .single();

  if (insertError || !newTask) {
    return {
      error: `Failed to create delegated task: ${insertError?.message ?? "unknown error"}`,
    };
  }

  // Send message to pgmq for queue processing
  const message = {
    task_id: newTask.id,
    company_id: fromTask.company_id,
    agent_type: toAgentType,
    action,
    input,
    parent_task_id: fromTask.id,
    delegation_depth: newDepth,
    risk_level: "low",
  };

  // deno-lint-ignore no-explicit-any
  const { error: queueError } = await (supabase as any)
    .schema("pgmq_public")
    .rpc("send", {
      queue_name: "agent_tasks",
      message,
    });

  if (queueError) {
    console.error("Failed to enqueue delegated task:", queueError);
    // Task was created but not queued -- mark it for manual processing
    await supabase
      .from("agent_tasks")
      .update({ error: "Failed to enqueue task" })
      .eq("id", newTask.id)
      .eq("company_id", fromTask.company_id);
  }

  return { taskId: newTask.id };
}

/**
 * Updates the status and fields of an agent task.
 * Always scopes by company_id for multi-tenant isolation.
 */
async function updateTaskStatus(
  supabase: SupabaseClient,
  task: AgentTask,
  status: TaskStatus,
  fields: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase
    .from("agent_tasks")
    .update({ status, ...fields })
    .eq("id", task.id)
    .eq("company_id", task.company_id);

  if (error) {
    console.error(
      `Failed to update task ${task.id} to status ${status}:`,
      error
    );
  }
}

/**
 * Logs an audit event for the agent task using the existing log_audit_event RPC.
 * Always includes company_id, agent_type, action, and AI reasoning.
 */
async function logAuditEvent(
  supabase: SupabaseClient,
  task: AgentTask,
  action: string,
  reasoning: string
): Promise<void> {
  try {
    await supabase.rpc("log_audit_event", {
      p_company_id: task.company_id,
      p_user_id: null, // Agent tasks may not have a user context
      p_action: action,
      p_resource_type: "agent_task",
      p_resource_id: task.id,
      p_details: {
        agent_type: task.agent_type,
        task_action: task.action,
        delegation_depth: task.delegation_depth,
        risk_level: task.risk_level,
        parent_task_id: task.parent_task_id,
      },
      p_ai_reasoning: reasoning.substring(0, 2000), // Truncate to reasonable length
      // New agent-specific fields (Phase 1 Plan 03)
      p_agent_id: task.id,
      p_agent_type: task.agent_type.replace(/-/g, "_"), // Convert to Postgres enum format
      p_reasoning_summary: reasoning.substring(0, 500),
    });
  } catch (err) {
    // Audit logging should not fail the task
    console.error(`Failed to log audit event for task ${task.id}:`, err);
  }
}
