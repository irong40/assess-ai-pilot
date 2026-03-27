/**
 * Agent Activity Log -- displays a table of agent task history
 * with action, status, reasoning summary, and timestamps.
 *
 * Features:
 * - Optional agentType filter prop
 * - Reasoning summary truncated to 100 chars with full text in expandable row
 * - Relative timestamps via date-fns
 * - Empty state when no tasks exist
 */
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import type { AgentType, TaskStatus } from '@/types/agent';
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

/** Badge variant class for task statuses */
function getStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case 'completed':
    case 'approved':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'running':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'failed':
    case 'rejected':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'awaiting_approval':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    default:
      return 'bg-gray-100 text-gray-600 hover:bg-gray-100';
  }
}

/** Format status for display */
function formatStatus(status: TaskStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Truncate text to maxLen characters */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

interface AgentActivityLogProps {
  agentType?: AgentType;
}

export function AgentActivityLog({ agentType }: AgentActivityLogProps) {
  const { data: tasks, isLoading } = useAgentTasks(
    agentType ? { agentType } : undefined
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (taskId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const allTasks = tasks ?? [];

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg">No agent activity yet</p>
        <p className="text-sm mt-1">
          Agent tasks will appear here once they start running.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reasoning</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allTasks.map((task) => {
          const hasReasoning =
            task.reasoning_summary && task.reasoning_summary.length > 0;
          const isExpanded = expandedRows.has(task.id);
          const displayName =
            AGENT_DISPLAY_NAMES[task.agent_type] ?? task.agent_type;

          return (
            <Collapsible key={task.id} asChild open={isExpanded}>
              <>
                <CollapsibleTrigger asChild>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => hasReasoning && toggleRow(task.id)}
                  >
                    <TableCell className="font-medium">{displayName}</TableCell>
                    <TableCell>{task.action}</TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadgeClass(task.status)}
                        variant="secondary"
                      >
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {hasReasoning
                        ? truncate(task.reasoning_summary!, 100)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {formatDistanceToNow(new Date(task.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  {hasReasoning ? (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="py-3 px-6">
                        <div className="text-sm">
                          <span className="font-medium">Full reasoning: </span>
                          {task.reasoning_summary}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow className="hidden">
                      <TableCell />
                    </TableRow>
                  )}
                </CollapsibleContent>
              </>
            </Collapsible>
          );
        })}
      </TableBody>
    </Table>
  );
}
