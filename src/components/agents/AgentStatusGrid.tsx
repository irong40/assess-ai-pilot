/**
 * Agent Status Grid -- displays a card for each of the 7 ASSESS-AI agent types
 * showing their current operational status derived from the most recent task.
 *
 * Status derivation:
 * - No tasks for agent -> "Idle"
 * - Latest task status maps to display status (Running, Completed, Failed, etc.)
 *
 * Color coding:
 * - Green: completed, approved (healthy/idle)
 * - Yellow: running, pending
 * - Red: failed, rejected
 * - Orange: awaiting_approval
 * - Gray: idle (no tasks)
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import { AGENT_TYPES } from '@/types/agent';
import type { AgentTask, AgentType, TaskStatus } from '@/types/agent';
import { formatDistanceToNow } from 'date-fns';

/** Human-readable display names for each agent type */
const AGENT_DISPLAY_NAMES: Record<AgentType, string> = {
  'ciso-orchestrator': 'CISO Orchestrator',
  'grc-analyst': 'GRC Analyst',
  'soc-analyst': 'SOC Analyst',
  'threat-intel': 'Threat Intelligence',
  'incident-response': 'Incident Response',
  'appsec': 'AppSec Engineer',
  'pen-test': 'Pen Test',
};

/** Display label for each status */
type DisplayStatus = 'Idle' | 'Pending' | 'Running' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Completed' | 'Failed';

const STATUS_DISPLAY: Record<TaskStatus, DisplayStatus> = {
  pending: 'Pending',
  running: 'Running',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
};

/** Badge variant/class mapping for visual status indication */
function getStatusBadgeClass(status: DisplayStatus): string {
  switch (status) {
    case 'Completed':
    case 'Approved':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'Running':
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'Failed':
    case 'Rejected':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'Awaiting Approval':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    case 'Idle':
    default:
      return 'bg-gray-100 text-gray-600 hover:bg-gray-100';
  }
}

/** Derive the current display status for an agent from its tasks */
function deriveAgentStatus(
  agentType: AgentType,
  tasks: AgentTask[]
): { displayStatus: DisplayStatus; lastActivity: string | null; taskCount: number } {
  const agentTasks = tasks.filter((t) => t.agent_type === agentType);

  if (agentTasks.length === 0) {
    return { displayStatus: 'Idle', lastActivity: null, taskCount: 0 };
  }

  // Tasks are already ordered by created_at desc from the hook
  const latestTask = agentTasks[0];
  const displayStatus = STATUS_DISPLAY[latestTask.status];

  return {
    displayStatus,
    lastActivity: latestTask.created_at,
    taskCount: agentTasks.length,
  };
}

export function AgentStatusGrid() {
  const { data: tasks, isLoading } = useAgentTasks();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENT_TYPES.map((type) => (
          <Card key={type} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const allTasks = tasks ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {AGENT_TYPES.map((agentType) => {
        const { displayStatus, lastActivity, taskCount } = deriveAgentStatus(
          agentType,
          allTasks
        );

        return (
          <Card key={agentType} data-testid={`agent-card-${agentType}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {AGENT_DISPLAY_NAMES[agentType]}
                </CardTitle>
                <Badge className={getStatusBadgeClass(displayStatus)} variant="secondary">
                  {displayStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{taskCount} task{taskCount !== 1 ? 's' : ''}</p>
                {lastActivity && (
                  <p>
                    Last activity:{' '}
                    {formatDistanceToNow(new Date(lastActivity), {
                      addSuffix: true,
                    })}
                  </p>
                )}
                {!lastActivity && <p>No activity yet</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
