/**
 * Client-side agent task dispatch service.
 *
 * Provides functions to create and dispatch agent tasks from the frontend.
 * Tasks are inserted into the agent_tasks table and then triggered via
 * the agent-worker Edge Function for immediate processing.
 *
 * Usage:
 *   import { dispatchCisoAssessment } from '@/services/agentService';
 *   const result = await dispatchCisoAssessment('assessment-123', 2);
 */
import { supabase } from '@/integrations/supabase/client';
import type { AgentType } from '@/types/agent';

/**
 * Dispatches an agent task by creating a row in agent_tasks and
 * invoking the agent-worker Edge Function for immediate processing.
 *
 * @param agentType - The agent type to dispatch to
 * @param action - The action for the agent to perform
 * @param input - Input data for the task
 * @returns Object with taskId on success, or error on failure
 */
export async function dispatchAgentTask(
  agentType: AgentType,
  action: string,
  input: Record<string, unknown>
): Promise<{ taskId: string } | { error: string }> {
  // 1. Create the agent_tasks row with pending status
  const { data: task, error: insertError } = await supabase
    .from('agent_tasks')
    .insert({
      agent_type: agentType.replace(/-/g, '_'), // Postgres enum uses underscores
      action,
      input,
      status: 'pending',
      risk_level: 'low',
      delegation_depth: 0,
    })
    .select('id')
    .single();

  if (insertError || !task) {
    return {
      error: `Failed to create agent task: ${insertError?.message ?? 'unknown error'}`,
    };
  }

  // 2. Invoke the agent-worker Edge Function for immediate processing
  //    (instead of waiting for pg_cron to pick it up)
  const { error: invokeError } = await supabase.functions.invoke(
    'agent-worker',
    {
      body: {
        task_id: task.id,
        agent_type: agentType,
        action,
      },
    }
  );

  if (invokeError) {
    // Task was created but invocation failed -- it will still be picked up by pg_cron
    console.warn(
      `Agent task ${task.id} created but immediate invocation failed:`,
      invokeError
    );
  }

  return { taskId: task.id };
}

/**
 * Convenience wrapper to dispatch a CISO compliance assessment.
 *
 * @param assessmentId - The assessment to run against
 * @param cmmcLevel - CMMC certification level (1 or 2)
 * @param scope - Optional scope narrowing (control family, etc.)
 * @returns Object with taskId on success, or error on failure
 */
export async function dispatchCisoAssessment(
  assessmentId: string,
  cmmcLevel: 1 | 2,
  scope?: { control_family?: string }
): Promise<{ taskId: string } | { error: string }> {
  return dispatchAgentTask('ciso-orchestrator', 'run-compliance-assessment', {
    assessment_id: assessmentId,
    cmmc_level: cmmcLevel,
    ...scope,
  });
}

/**
 * Queries the current status and output of an agent task.
 *
 * @param taskId - The task UUID to check
 * @returns The task record with status and output
 */
export async function getAgentTaskStatus(
  taskId: string
): Promise<{
  id: string;
  status: string;
  output: Record<string, unknown> | null;
  error: string | null;
} | null> {
  const { data, error } = await supabase
    .from('agent_tasks')
    .select('id, status, output, error, reasoning_summary, agent_type, action')
    .eq('id', taskId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as {
    id: string;
    status: string;
    output: Record<string, unknown> | null;
    error: string | null;
  };
}
