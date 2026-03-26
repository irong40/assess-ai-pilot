/**
 * Agent type definitions for the ASSESS-AI multi-agent system.
 * These types are used by the frontend to display agent task data.
 *
 * The 7 agents follow a hub-and-spoke topology:
 * - ciso-orchestrator: central coordinator, the ONLY agent that can delegate
 * - 6 specialist agents: grc-analyst, soc-analyst, threat-intel,
 *   incident-response, appsec, pen-test
 */

// All 7 agent types in the ASSESS-AI system
export type AgentType =
  | 'ciso-orchestrator'
  | 'grc-analyst'
  | 'soc-analyst'
  | 'threat-intel'
  | 'incident-response'
  | 'appsec'
  | 'pen-test';

// Task lifecycle statuses following a strict state machine
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed';

// Risk level for agent tasks (determines approval flow)
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Valid state transitions for the agent task state machine.
 *
 * State diagram:
 *   pending -> running
 *   running -> completed | failed | awaiting_approval
 *   awaiting_approval -> approved | rejected
 *   approved -> completed | failed
 *   rejected -> (terminal)
 *   completed -> (terminal)
 *   failed -> (terminal)
 */
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['running'],
  running: ['completed', 'failed', 'awaiting_approval'],
  awaiting_approval: ['approved', 'rejected'],
  approved: ['completed', 'failed'],
  rejected: [],
  completed: [],
  failed: [],
};

/**
 * Checks whether a transition from one status to another is valid.
 */
export function isValidTransition(
  from: TaskStatus,
  to: TaskStatus
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Agent task record matching the agent_tasks database table.
 */
export interface AgentTask {
  id: string;
  company_id: string;
  agent_type: AgentType;
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: TaskStatus;
  risk_level: RiskLevel;
  error: string | null;
  reasoning_summary: string | null;
  parent_task_id: string | null;
  source_agent: AgentType | null;
  delegation_depth: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Agent message payload for pgmq queue dispatch.
 */
export interface AgentMessage {
  task_id: string;
  company_id: string;
  agent_type: AgentType;
  action: string;
  input: Record<string, unknown>;
  parent_task_id: string | null;
  delegation_depth: number;
  risk_level: RiskLevel;
}

/**
 * All agent type values as a constant array (useful for iteration/validation).
 */
export const AGENT_TYPES: AgentType[] = [
  'ciso-orchestrator',
  'grc-analyst',
  'soc-analyst',
  'threat-intel',
  'incident-response',
  'appsec',
  'pen-test',
];

/**
 * Maximum delegation depth to prevent infinite delegation loops.
 */
export const MAX_DELEGATION_DEPTH = 3;

/**
 * Validates hub-and-spoke topology: only ciso-orchestrator can delegate tasks.
 */
export function isValidDelegation(
  sourceAgentType: AgentType | null
): boolean {
  if (sourceAgentType === null) return true; // direct task, no delegation
  return sourceAgentType === 'ciso-orchestrator';
}

/**
 * Validates that delegation depth does not exceed the maximum.
 */
export function isValidDelegationDepth(depth: number): boolean {
  return depth >= 0 && depth < MAX_DELEGATION_DEPTH;
}
