/**
 * Client-side approval gate helpers for the ASSESS-AI multi-agent system.
 *
 * Provides deterministic risk classification for agent actions and
 * approval routing logic. High-risk actions require human approval
 * from admin or issm roles before execution proceeds.
 *
 * Server-side counterpart: supabase/functions/_shared/approval-gate.ts
 */
import type { AgentType, RiskLevel } from '@/types/agent';

/**
 * Approval status for the approval gate state machine.
 * pending -> approved | rejected
 * approved -> executed
 * rejected -> cancelled
 * expired -> cancelled
 * executed -> (terminal)
 * cancelled -> (terminal)
 */
export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'executed'
  | 'cancelled';

/**
 * Valid state transitions for the approval gate state machine.
 */
export const APPROVAL_STATUS_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['executed'],
  rejected: ['cancelled'],
  expired: ['cancelled'],
  executed: [],
  cancelled: [],
};

/**
 * Roles authorized to approve high-risk agent actions.
 * Only admin and issm (Information System Security Manager) can approve.
 */
export const APPROVAL_ROLES: readonly string[] = ['admin', 'issm'] as const;

/**
 * Action verb patterns mapped to risk levels.
 * Destructive verbs -> high risk (requires approval)
 * Analytical verbs -> medium risk (auto-approved)
 * Read-only verbs -> low risk (auto-approved)
 */
const HIGH_RISK_PATTERNS: string[] = [
  'delete',
  'modify',
  'override',
  'revoke',
  'disable',
];

const MEDIUM_RISK_PATTERNS: string[] = [
  'analyze',
  'assess',
  'generate',
  'report',
];

const LOW_RISK_PATTERNS: string[] = [
  'query',
  'check',
  'list',
  'view',
  'get',
  'read',
];

/**
 * Classifies the risk level of an agent action based on the action string.
 *
 * Risk classification is deterministic and based on verb patterns in the
 * action string. The first matching pattern wins.
 *
 * Priority: high > low > medium (default)
 *
 * @param agentType - The type of agent performing the action
 * @param action - The action string to classify (e.g., "delete_finding", "query_control")
 * @returns The risk level: 'high', 'medium', or 'low'
 */
export function classifyRisk(agentType: AgentType, action: string): RiskLevel {
  const normalizedAction = action.toLowerCase();

  // Check high-risk patterns first (destructive verbs)
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (normalizedAction.includes(pattern)) {
      return 'high';
    }
  }

  // Check low-risk patterns (read-only verbs)
  for (const pattern of LOW_RISK_PATTERNS) {
    if (normalizedAction.includes(pattern)) {
      return 'low';
    }
  }

  // Check medium-risk patterns (analytical verbs)
  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (normalizedAction.includes(pattern)) {
      return 'medium';
    }
  }

  // Default to medium for unknown actions
  return 'medium';
}

/**
 * Determines whether human approval is required for a given risk level.
 * Only high-risk actions require approval. Medium and low risk auto-approve.
 *
 * @param riskLevel - The risk level to check
 * @returns true if human approval is required
 */
export function isApprovalRequired(riskLevel: RiskLevel): boolean {
  return riskLevel === 'high';
}
