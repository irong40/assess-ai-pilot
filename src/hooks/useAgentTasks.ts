/**
 * TanStack Query hooks for agent task data.
 *
 * Provides reactive data access to the agent_tasks table for:
 * - Listing all agent tasks with optional filters
 * - Viewing the CISO task queue with delegation tree
 * - Fetching individual task details
 *
 * Usage:
 *   import { useAgentTasks, useCisoTaskQueue } from '@/hooks/useAgentTasks';
 *   const { data, isLoading } = useAgentTasks({ agentType: 'grc-analyst' });
 *   const { data: queue } = useCisoTaskQueue();
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgentTask } from '@/types/agent';

interface AgentTaskFilters {
  agentType?: string;
  status?: string;
}

/**
 * Queries agent_tasks table with optional filters.
 * Returns a typed AgentTask array.
 *
 * @param filters - Optional filters for agent_type and status
 */
export function useAgentTasks(filters?: AgentTaskFilters) {
  return useQuery({
    queryKey: ['agent-tasks', filters] as const,
    queryFn: async () => {
      let query = supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.agentType) {
        query = query.eq(
          'agent_type',
          filters.agentType.replace(/-/g, '_')
        );
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as AgentTask[];
    },
  });
}

/**
 * Queries the CISO task queue: all CISO orchestrator tasks plus
 * their delegated child tasks (parent_task_id match).
 *
 * Returns both CISO-level tasks and their delegation tree.
 */
export function useCisoTaskQueue() {
  return useQuery({
    queryKey: ['ciso-task-queue'] as const,
    queryFn: async () => {
      // 1. Fetch all CISO orchestrator tasks
      const { data: cisoTasks, error: cisoError } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('agent_type', 'ciso_orchestrator')
        .order('created_at', { ascending: false });

      if (cisoError) throw cisoError;

      const cisoTaskList = (cisoTasks ?? []) as AgentTask[];

      // 2. Fetch delegated child tasks for all CISO tasks
      const cisoTaskIds = cisoTaskList.map((t) => t.id);
      let delegatedTasks: AgentTask[] = [];

      if (cisoTaskIds.length > 0) {
        const { data: children, error: childError } = await supabase
          .from('agent_tasks')
          .select('*')
          .in('parent_task_id', cisoTaskIds)
          .order('created_at', { ascending: true });

        if (childError) throw childError;
        delegatedTasks = (children ?? []) as AgentTask[];
      }

      return {
        cisoTasks: cisoTaskList,
        delegatedTasks,
      };
    },
  });
}

/**
 * Fetches a single agent task by ID with full output.
 *
 * @param taskId - The task UUID to fetch
 */
export function useAgentTaskDetail(taskId: string) {
  return useQuery({
    queryKey: ['agent-task', taskId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data as AgentTask;
    },
    enabled: !!taskId,
  });
}
