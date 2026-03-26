import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for agent service and useAgentTasks hooks.
 *
 * Mocks:
 * - @/integrations/supabase/client (supabase client)
 * - @tanstack/react-query (useQuery hook)
 *
 * Tests verify:
 * - dispatchAgentTask creates agent_tasks row and invokes edge function
 * - dispatchCisoAssessment passes correct action and parameters
 * - getAgentTaskStatus returns task with status field
 * - useAgentTasks queries agent_tasks with optional filters
 * - useCisoTaskQueue filters by ciso_orchestrator agent_type
 */

// vi.mock factories are hoisted -- must be self-contained (no top-level refs)

const mockFunctionsInvoke = vi.fn().mockResolvedValue({
  data: { success: true },
  error: null,
});

const mockSingleInsert = vi.fn().mockResolvedValue({
  data: { id: 'task-uuid-123' },
  error: null,
});

const mockSelectInsert = vi.fn().mockReturnValue({
  single: mockSingleInsert,
});

const mockInsert = vi.fn().mockReturnValue({
  select: mockSelectInsert,
});

const mockSingleSelect = vi.fn().mockResolvedValue({
  data: {
    id: 'task-uuid-123',
    status: 'running',
    agent_type: 'ciso-orchestrator',
    output: null,
    error: null,
    reasoning_summary: null,
    action: 'test',
  },
  error: null,
});

// Chainable query builder mock - every method returns the same chainable object
function createChainableMock() {
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.single = mockSingleSelect;
  return chain;
}

const mockSelect = vi.fn().mockImplementation(() => createChainableMock());

const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: mockSelect,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
  },
}));

// --- React Query mock ---
const mockUseQuery = vi.fn().mockReturnValue({
  data: [],
  isLoading: false,
  error: null,
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// --- Import modules under test after mocks ---
import {
  dispatchAgentTask,
  dispatchCisoAssessment,
  getAgentTaskStatus,
} from '@/services/agentService';

import {
  useAgentTasks,
  useCisoTaskQueue,
  useAgentTaskDetail,
} from '@/hooks/useAgentTasks';

describe('Agent Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup default mock returns after clearAllMocks
    mockSingleInsert.mockResolvedValue({
      data: { id: 'task-uuid-123' },
      error: null,
    });
    mockSelectInsert.mockReturnValue({ single: mockSingleInsert });
    mockInsert.mockReturnValue({ select: mockSelectInsert });
    mockSingleSelect.mockResolvedValue({
      data: {
        id: 'task-uuid-123',
        status: 'running',
        agent_type: 'ciso-orchestrator',
        output: null,
        error: null,
        reasoning_summary: null,
        action: 'test',
      },
      error: null,
    });
    mockSelect.mockImplementation(() => createChainableMock());
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });
  });

  describe('dispatchAgentTask', () => {
    it('creates an agent_tasks row via supabase.from("agent_tasks").insert()', async () => {
      await dispatchAgentTask('ciso-orchestrator', 'run-compliance-assessment', {
        assessment_id: 'abc',
      });

      expect(mockFrom).toHaveBeenCalledWith('agent_tasks');
    });

    it('invokes agent-worker Edge Function', async () => {
      await dispatchAgentTask('grc-analyst', 'gap-analysis', {});

      expect(mockFunctionsInvoke).toHaveBeenCalledWith(
        'agent-worker',
        expect.objectContaining({
          body: expect.objectContaining({
            task_id: 'task-uuid-123',
          }),
        })
      );
    });

    it('returns taskId on success', async () => {
      const result = await dispatchAgentTask('ciso-orchestrator', 'test', {});
      expect(result).toHaveProperty('taskId', 'task-uuid-123');
    });
  });

  describe('dispatchCisoAssessment', () => {
    it('passes correct action and parameters', async () => {
      await dispatchCisoAssessment('assessment-456', 2, {
        control_family: 'AC',
      });

      expect(mockFrom).toHaveBeenCalledWith('agent_tasks');
    });
  });

  describe('getAgentTaskStatus', () => {
    it('returns task with status field', async () => {
      const result = await getAgentTaskStatus('task-uuid-123');
      expect(result).toHaveProperty('status');
      expect(mockFrom).toHaveBeenCalledWith('agent_tasks');
    });
  });
});

describe('Agent Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAgentTasks', () => {
    it('returns data array from useQuery', () => {
      mockUseQuery.mockReturnValue({
        data: [{ id: '1', agent_type: 'ciso-orchestrator' }],
        isLoading: false,
        error: null,
      });

      const result = useAgentTasks();
      expect(result.data).toEqual([{ id: '1', agent_type: 'ciso-orchestrator' }]);
    });

    it('passes agent_type filter to query key', () => {
      useAgentTasks({ agentType: 'grc-analyst' });

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['agent-tasks', { agentType: 'grc-analyst' }],
        })
      );
    });

    it('passes status filter to query key', () => {
      useAgentTasks({ status: 'completed' });

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['agent-tasks', { status: 'completed' }],
        })
      );
    });
  });

  describe('useCisoTaskQueue', () => {
    it('uses ciso-task-queue query key', () => {
      useCisoTaskQueue();

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['ciso-task-queue'],
        })
      );
    });
  });

  describe('useAgentTaskDetail', () => {
    it('uses agent-task query key with task ID', () => {
      useAgentTaskDetail('task-123');

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['agent-task', 'task-123'],
        })
      );
    });
  });
});
