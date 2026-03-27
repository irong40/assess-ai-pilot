/**
 * Approval Queue -- displays pending agent approval requests
 * with approve/reject actions restricted to admin and issm roles.
 *
 * Features:
 * - Lists all pending approvals with task context
 * - Approve button (immediate) for admin/issm only
 * - Reject button with optional reason dialog for admin/issm only
 * - Loading skeleton state
 * - Empty state with check icon
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePendingApprovals,
  useApprovalDecision,
} from '@/hooks/useAgentApprovals';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { AgentType } from '@/types/agent';
import { formatDistanceToNow } from 'date-fns';

/** Human-readable display names for each agent type */
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'ciso-orchestrator': 'CISO Orchestrator',
  'grc-analyst': 'GRC Analyst',
  'soc-analyst': 'SOC Analyst',
  'threat-intel': 'Threat Intelligence',
  'incident-response': 'Incident Response',
  'appsec': 'AppSec Engineer',
  'pen-test': 'Pen Test',
};

/** Risk level badge styling */
function getRiskBadgeClass(risk: string): string {
  switch (risk) {
    case 'high':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'low':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    default:
      return 'bg-gray-100 text-gray-600 hover:bg-gray-100';
  }
}

/** Roles allowed to approve/reject */
const APPROVER_ROLES = ['admin', 'issm'];

export function ApprovalQueue() {
  const { data: approvals, isLoading } = usePendingApprovals();
  const { data: profile } = useUserProfile();
  const decision = useApprovalDecision();
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const userRole = profile?.role ?? '';
  const canApprove = APPROVER_ROLES.includes(userRole);

  const handleApprove = (approvalId: string) => {
    decision.mutate({ approvalId, status: 'approved' });
  };

  const handleReject = () => {
    if (!rejectDialogId) return;
    decision.mutate({
      approvalId: rejectDialogId,
      status: 'rejected',
      reason: rejectReason || undefined,
    });
    setRejectDialogId(null);
    setRejectReason('');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pendingApprovals = approvals ?? [];

  if (pendingApprovals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mb-4 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg">No pending approvals</p>
        <p className="text-sm mt-1">All agent actions are up to date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingApprovals.map((approval) => {
        const agentName =
          AGENT_DISPLAY_NAMES[approval.agent_type] ?? approval.agent_type;
        const reasoning =
          approval.agent_tasks?.reasoning_summary ?? 'No reasoning provided';

        return (
          <Card key={approval.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {approval.action_description}
                </CardTitle>
                <Badge
                  className={getRiskBadgeClass(approval.risk_level)}
                  variant="secondary"
                >
                  {approval.risk_level} risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{agentName}</span>
                  {' -- '}
                  <span>{reasoning}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Requested{' '}
                  {formatDistanceToNow(new Date(approval.requested_at), {
                    addSuffix: true,
                  })}
                </div>

                {canApprove && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(approval.id)}
                      disabled={decision.isPending}
                    >
                      Approve
                    </Button>
                    <Dialog
                      open={rejectDialogId === approval.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setRejectDialogId(null);
                          setRejectReason('');
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectDialogId(approval.id)}
                          disabled={decision.isPending}
                        >
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Approval</DialogTitle>
                          <DialogDescription>
                            Provide an optional reason for rejecting this action.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Reason for rejection (optional)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectDialogId(null);
                              setRejectReason('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={decision.isPending}
                          >
                            Confirm Reject
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
