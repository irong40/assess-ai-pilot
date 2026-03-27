/**
 * TanStack Query hooks for agent approval workflows.
 *
 * Provides:
 * - usePendingApprovals(): Fetch pending approval requests with joined task data
 * - useApprovalDecision(): Mutation to approve/reject an approval request
 *
 * Usage:
 *   import { usePendingApprovals, useApprovalDecision } from '@/hooks/useAgentApprovals';
 *   const { data: approvals } = usePendingApprovals();
 *   const decision = useApprovalDecision();
 *   decision.mutate({ approvalId: '...', status: 'approved', reason: 'Looks good' });
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PendingApproval {
  id: string;
  task_id: string;
  company_id: string;
  agent_type: string;
  action_description: string;
  risk_level: string;
  status: string;
  requested_at: string;
  expiry_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  created_at: string;
  agent_tasks: {
    action: string;
    input: Record<string, unknown>;
    reasoning_summary: string | null;
    agent_type: string;
    risk_level: string;
  } | null;
}

/**
 * Fetches all pending approval requests for the current user's company,
 * joined with the associated agent task data.
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['agent-approvals', 'pending'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_approvals')
        .select(
          '*, agent_tasks(action, input, reasoning_summary, agent_type, risk_level)'
        )
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as PendingApproval[];
    },
  });
}

interface ApprovalDecisionInput {
  approvalId: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

/**
 * Mutation to approve or reject an agent approval request.
 * Updates the approval status, records the decision maker and timestamp.
 * On success, invalidates both approvals and tasks caches.
 */
export function useApprovalDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, status, reason }: ApprovalDecisionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('agent_approvals')
        .update({
          status,
          decided_at: new Date().toISOString(),
          decided_by: user?.id ?? null,
          decision_reason: reason ?? null,
        })
        .eq('id', approvalId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      toast({
        title: 'Decision recorded',
        description: 'The approval decision has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record approval decision.',
        variant: 'destructive',
      });
    },
  });
}
