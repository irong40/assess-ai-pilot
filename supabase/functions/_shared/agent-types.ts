/**
 * Zod schemas for agent message and task payload validation.
 * Used in Supabase Edge Functions for runtime validation of agent data.
 *
 * These schemas mirror the frontend types in src/types/agent.ts but provide
 * runtime validation via Zod for the server-side (Deno) environment.
 */
import { z } from "npm:zod@3";

// All 7 agent types in the ASSESS-AI system
export const AgentTypeSchema = z.enum([
  'ciso-orchestrator',
  'grc-analyst',
  'soc-analyst',
  'threat-intel',
  'incident-response',
  'appsec',
  'pen-test',
]);
export type AgentType = z.infer<typeof AgentTypeSchema>;

// Task lifecycle statuses
export const TaskStatusSchema = z.enum([
  'pending',
  'running',
  'awaiting_approval',
  'approved',
  'rejected',
  'completed',
  'failed',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Risk level for agent tasks
export const RiskLevelSchema = z.enum(['low', 'medium', 'high']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

// Full agent task payload validation (matches agent_tasks table)
export const AgentTaskSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  agent_type: AgentTypeSchema,
  action: z.string().min(1),
  input: z.record(z.unknown()).default({}),
  output: z.record(z.unknown()).nullable().default(null),
  status: TaskStatusSchema.default('pending'),
  risk_level: RiskLevelSchema.default('low'),
  error: z.string().nullable().default(null),
  reasoning_summary: z.string().nullable().default(null),
  parent_task_id: z.string().uuid().nullable().default(null),
  source_agent: AgentTypeSchema.nullable().default(null),
  delegation_depth: z.number().int().min(0).max(3).default(0),
  started_at: z.string().nullable().default(null),
  completed_at: z.string().nullable().default(null),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});
export type AgentTask = z.infer<typeof AgentTaskSchema>;

// pgmq message payload validation (what gets sent to/read from the queue)
export const AgentMessageSchema = z.object({
  task_id: z.string().uuid(),
  company_id: z.string().uuid(),
  agent_type: AgentTypeSchema,
  action: z.string().min(1),
  input: z.record(z.unknown()).default({}),
  parent_task_id: z.string().uuid().nullable().default(null),
  delegation_depth: z.number().int().min(0).max(3).default(0),
  risk_level: RiskLevelSchema.default('low'),
});
export type AgentMessage = z.infer<typeof AgentMessageSchema>;

/**
 * Valid state transitions for the agent task state machine.
 * Used for server-side validation before updating task status.
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
 * Maximum delegation depth to prevent infinite delegation loops.
 */
export const MAX_DELEGATION_DEPTH = 3;
