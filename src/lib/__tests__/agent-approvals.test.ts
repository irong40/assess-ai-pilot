import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---- Mocks ----

// Chainable supabase mock
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  update: mockUpdate,
});

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-1' } },
  error: null,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

// Mock useUserProfile for role-based tests
const mockRole = vi.fn();
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    data: { role: mockRole(), company_id: 'company-1' },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// ---- Test Data ----

const now = new Date().toISOString();

const mockPendingApprovals = [
  {
    id: 'approval-1',
    task_id: 'task-1',
    company_id: 'company-1',
    agent_type: 'incident-response',
    action_description: 'Escalate incident to external team',
    risk_level: 'high',
    status: 'pending',
    requested_at: now,
    expiry_at: new Date(Date.now() + 86400000).toISOString(),
    decided_by: null,
    decided_at: null,
    decision_reason: null,
    created_at: now,
    agent_tasks: {
      action: 'escalate-incident',
      input: {},
      reasoning_summary: 'Critical incident requires external response team involvement',
      agent_type: 'incident-response',
      risk_level: 'high',
    },
  },
  {
    id: 'approval-2',
    task_id: 'task-2',
    company_id: 'company-1',
    agent_type: 'pen-test',
    action_description: 'Run external port scan',
    risk_level: 'high',
    status: 'pending',
    requested_at: now,
    expiry_at: new Date(Date.now() + 86400000).toISOString(),
    decided_by: null,
    decided_at: null,
    decision_reason: null,
    created_at: now,
    agent_tasks: {
      action: 'external-port-scan',
      input: {},
      reasoning_summary: 'Need to scan external perimeter for open ports',
      agent_type: 'pen-test',
      risk_level: 'high',
    },
  },
];

// ---- Helpers ----

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// ---- Tests ----

describe('usePendingApprovals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: mockPendingApprovals, error: null });
  });

  it('queries agent_approvals where status=pending with joined task data', async () => {
    const { usePendingApprovals } = await import('@/hooks/useAgentApprovals');
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(() => usePendingApprovals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the query calls
    expect(mockFrom).toHaveBeenCalledWith('agent_approvals');
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining('agent_tasks')
    );
    expect(mockEq).toHaveBeenCalledWith('status', 'pending');
  });
});

describe('useApprovalDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls update on agent_approvals with approved/rejected status', async () => {
    // Setup mock chain for update
    const mockUpdateEq = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });

    const { useApprovalDecision } = await import('@/hooks/useAgentApprovals');
    const { renderHook, waitFor, act } = await import('@testing-library/react');

    const { result } = renderHook(() => useApprovalDecision(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        approvalId: 'approval-1',
        status: 'approved',
        reason: 'Approved for execution',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('agent_approvals');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        decision_reason: 'Approved for execution',
      })
    );
  });
});

describe('ApprovalQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of pending approvals with task action, reasoning, and risk level', async () => {
    mockRole.mockReturnValue('admin');
    mockOrder.mockResolvedValue({ data: mockPendingApprovals, error: null });

    const { ApprovalQueue } = await import(
      '@/components/agents/ApprovalQueue'
    );

    render(React.createElement(ApprovalQueue), { wrapper: createWrapper() });

    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      expect(
        screen.getByText('Escalate incident to external team')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Run external port scan')
      ).toBeInTheDocument();
    });
  });

  it('shows approve/reject buttons only for admin and issm roles', async () => {
    mockRole.mockReturnValue('admin');
    mockOrder.mockResolvedValue({ data: mockPendingApprovals, error: null });

    const { ApprovalQueue } = await import(
      '@/components/agents/ApprovalQueue'
    );

    render(React.createElement(ApprovalQueue), { wrapper: createWrapper() });

    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      expect(approveButtons.length).toBeGreaterThan(0);
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      expect(rejectButtons.length).toBeGreaterThan(0);
    });
  });

  it('hides action buttons for user and isso roles', async () => {
    mockRole.mockReturnValue('isso');
    mockOrder.mockResolvedValue({ data: mockPendingApprovals, error: null });

    const { ApprovalQueue } = await import(
      '@/components/agents/ApprovalQueue'
    );

    render(React.createElement(ApprovalQueue), { wrapper: createWrapper() });

    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      expect(
        screen.getByText('Escalate incident to external team')
      ).toBeInTheDocument();
    });

    // Buttons should NOT be present for isso role
    expect(screen.queryByRole('button', { name: /approve/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /reject/i })).toBeNull();
  });
});
