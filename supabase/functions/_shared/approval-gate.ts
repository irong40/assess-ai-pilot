/**
 * Server-side approval gate logic for the ASSESS-AI multi-agent system.
 *
 * Provides approval gate checking, request creation, and decision processing
 * for high-risk agent actions. Works with the agent_approvals table and
 * broadcasts approval_needed events via Realtime.
 *
 * Client-side counterpart: src/lib/approval-gate.ts
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AgentTask, RiskLevel } from "./agent-types.ts";

/**
 * Roles authorized to approve high-risk agent actions.
 */
export const APPROVAL_ROLES = ["admin", "issm"] as const;

/**
 * Action verb patterns mapped to risk levels (mirrors client-side logic).
 */
const HIGH_RISK_PATTERNS = [
  "delete",
  "modify",
  "override",
  "revoke",
  "disable",
];

const LOW_RISK_PATTERNS = ["query", "check", "list", "view", "get", "read"];

/**
 * Classifies the risk level of an agent action (server-side mirror of client logic).
 */
export function classifyRiskServer(action: string): RiskLevel {
  const normalized = action.toLowerCase();

  for (const pattern of HIGH_RISK_PATTERNS) {
    if (normalized.includes(pattern)) return "high";
  }

  for (const pattern of LOW_RISK_PATTERNS) {
    if (normalized.includes(pattern)) return "low";
  }

  // Default to medium for analytical and unknown actions
  return "medium";
}

/**
 * Checks whether a task requires human approval before its output can be acted on.
 * Only high-risk tasks require approval.
 *
 * @param task - The agent task to check
 * @returns true if the task requires human approval
 */
export function checkApprovalRequired(task: AgentTask): boolean {
  return task.risk_level === "high";
}

/**
 * Creates an approval request for a high-risk agent task.
 *
 * 1. Inserts a row into agent_approvals with pending status and 24h expiry
 * 2. Broadcasts an approval_needed event via Realtime to the company channel
 * 3. Returns the approval request ID
 *
 * @param supabase - Service role Supabase client
 * @param task - The agent task requiring approval
 * @returns The approval request UUID
 * @throws Error if the approval request cannot be created
 */
export async function createApprovalRequest(
  supabase: SupabaseClient,
  task: AgentTask
): Promise<string> {
  // Insert approval request with 24-hour expiry
  const { data: approval, error: insertError } = await supabase
    .from("agent_approvals")
    .insert({
      task_id: task.id,
      company_id: task.company_id,
      agent_type: task.agent_type.replace(/-/g, "_"), // Convert to Postgres enum format
      action_description: task.action,
      risk_level: task.risk_level,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !approval) {
    throw new Error(
      `Failed to create approval request: ${insertError?.message ?? "unknown error"}`
    );
  }

  // Broadcast approval_needed event via Realtime
  try {
    await supabase.rpc("notify_approval_needed", {
      p_company_id: task.company_id,
      p_approval_id: approval.id,
      p_agent_type: task.agent_type,
      p_action_description: task.action,
      p_risk_level: task.risk_level,
    });
  } catch (err) {
    // Notification failure should not block the approval request
    console.error(
      `Failed to broadcast approval_needed for ${approval.id}:`,
      err
    );
  }

  return approval.id;
}

/**
 * Processes a human approval or rejection decision.
 *
 * 1. Validates the user has an authorized role (admin or issm)
 * 2. Checks the approval hasn't expired
 * 3. Updates the approval status and records the decision
 * 4. Updates the linked agent_task status accordingly
 * 5. Logs the decision to the audit trail
 *
 * @param supabase - Service role Supabase client
 * @param approvalId - The approval request UUID
 * @param decision - 'approved' or 'rejected'
 * @param userId - The UUID of the user making the decision
 * @param reason - Optional reason for the decision
 * @returns Object with success status
 */
export async function processApprovalDecision(
  supabase: SupabaseClient,
  approvalId: string,
  decision: "approved" | "rejected",
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate user role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "User profile not found" };
  }

  if (!APPROVAL_ROLES.includes(profile.role as (typeof APPROVAL_ROLES)[number])) {
    return {
      success: false,
      error: `User role '${profile.role}' is not authorized to approve. Required: ${APPROVAL_ROLES.join(", ")}`,
    };
  }

  // 2. Fetch the approval request
  const { data: approval, error: fetchError } = await supabase
    .from("agent_approvals")
    .select("*")
    .eq("id", approvalId)
    .eq("company_id", profile.company_id) // Multi-tenant scoping
    .single();

  if (fetchError || !approval) {
    return { success: false, error: "Approval request not found" };
  }

  // 3. Check approval hasn't expired
  if (new Date(approval.expiry_at) < new Date()) {
    // Mark as expired
    await supabase
      .from("agent_approvals")
      .update({ status: "expired" })
      .eq("id", approvalId)
      .eq("company_id", profile.company_id);

    return { success: false, error: "Approval request has expired" };
  }

  // 4. Check approval is still pending
  if (approval.status !== "pending") {
    return {
      success: false,
      error: `Approval is no longer pending (current status: ${approval.status})`,
    };
  }

  const now = new Date().toISOString();

  // 5. Update the approval record
  const { error: updateError } = await supabase
    .from("agent_approvals")
    .update({
      status: decision,
      decided_by: userId,
      decided_at: now,
      decision_reason: reason ?? null,
    })
    .eq("id", approvalId)
    .eq("company_id", profile.company_id);

  if (updateError) {
    return {
      success: false,
      error: `Failed to update approval: ${updateError.message}`,
    };
  }

  // 6. Update the linked agent_task status
  const taskStatus = decision === "approved" ? "approved" : "rejected";
  await supabase
    .from("agent_tasks")
    .update({ status: taskStatus })
    .eq("id", approval.task_id)
    .eq("company_id", profile.company_id);

  // 7. Log the decision to audit trail
  try {
    await supabase.rpc("log_audit_event", {
      p_company_id: profile.company_id,
      p_user_id: userId,
      p_action: `approval_${decision}`,
      p_resource_type: "agent_approval",
      p_resource_id: approvalId,
      p_details: {
        task_id: approval.task_id,
        agent_type: approval.agent_type,
        action_description: approval.action_description,
        risk_level: approval.risk_level,
        decision_reason: reason,
      },
      p_ai_reasoning: null,
      p_agent_id: approval.task_id,
      p_agent_type: approval.agent_type,
      p_reasoning_summary: `${decision}: ${reason ?? "no reason provided"}`,
    });
  } catch (err) {
    // Audit logging failure should not block the approval decision
    console.error(`Failed to log approval decision for ${approvalId}:`, err);
  }

  return { success: true };
}
