import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---- Mocks ----

// Mock useAgentTasks hook
const mockUseAgentTasks = vi.fn();
vi.mock('@/hooks/useAgentTasks', () => ({
  useAgentTasks: (...args: unknown[]) => mockUseAgentTasks(...args),
}));

// Mock useRealtimeAgentStatus hook
const mockCleanup = vi.fn();
const mockChannel = vi.fn().mockReturnValue({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
});
const mockRemoveChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    data: { role: 'admin', company_id: 'company-1' },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// Import components after mocks
import { AgentStatusGrid } from '@/components/agents/AgentStatusGrid';
import { AgentActivityLog } from '@/components/agents/AgentActivityLog';
import type { AgentTask } from '@/types/agent';

// ---- Test Data ----

const now = new Date().toISOString();

const mockTasks: AgentTask[] = [
  {
    id: '1',
    company_id: 'company-1',
    agent_type: 'grc-analyst',
    action: 'analyze-compliance',
    input: {},
    output: null,
    status: 'running',
    risk_level: 'low',
    error: null,
    reasoning_summary: 'Analyzing NIST 800-171 controls for access control family',
    parent_task_id: null,
    source_agent: null,
    delegation_depth: 0,
    started_at: now,
    completed_at: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: '2',
    company_id: 'company-1',
    agent_type: 'soc-analyst',
    action: 'scan-vulnerabilities',
    input: {},
    output: { findings: [] },
    status: 'completed',
    risk_level: 'medium',
    error: null,
    reasoning_summary: 'Completed vulnerability scan with 0 critical findings',
    parent_task_id: null,
    source_agent: null,
    delegation_depth: 0,
    started_at: now,
    completed_at: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: '3',
    company_id: 'company-1',
    agent_type: 'threat-intel',
    action: 'check-threat-feeds',
    input: {},
    output: null,
    status: 'failed',
    risk_level: 'low',
    error: 'API timeout',
    reasoning_summary: null,
    parent_task_id: null,
    source_agent: null,
    delegation_depth: 0,
    started_at: now,
    completed_at: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: '4',
    company_id: 'company-1',
    agent_type: 'incident-response',
    action: 'review-incident',
    input: {},
    output: null,
    status: 'awaiting_approval',
    risk_level: 'high',
    error: null,
    reasoning_summary: 'Requesting approval to escalate incident to external response team',
    parent_task_id: null,
    source_agent: null,
    delegation_depth: 0,
    started_at: now,
    completed_at: null,
    created_at: now,
    updated_at: now,
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

describe('AgentStatusGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a card for each of the 7 AGENT_TYPES with name and status badge', () => {
    mockUseAgentTasks.mockReturnValue({ data: mockTasks, isLoading: false });

    render(React.createElement(AgentStatusGrid), { wrapper: createWrapper() });

    // Expect all 7 agent display names
    expect(screen.getByText('CISO Orchestrator')).toBeInTheDocument();
    expect(screen.getByText('GRC Analyst')).toBeInTheDocument();
    expect(screen.getByText('SOC Analyst')).toBeInTheDocument();
    expect(screen.getByText('Threat Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Incident Response')).toBeInTheDocument();
    expect(screen.getByText('AppSec Engineer')).toBeInTheDocument();
    expect(screen.getByText('Pen Test')).toBeInTheDocument();
  });

  it('shows correct status badge colors', () => {
    mockUseAgentTasks.mockReturnValue({ data: mockTasks, isLoading: false });

    render(React.createElement(AgentStatusGrid), { wrapper: createWrapper() });

    // GRC Analyst should show "Running" (yellow)
    const grcCard = screen.getByText('GRC Analyst').closest('[data-testid]');
    expect(grcCard).toBeTruthy();
    expect(within(grcCard!).getByText('Running')).toBeInTheDocument();

    // SOC Analyst should show "Completed" (green)
    const socCard = screen.getByText('SOC Analyst').closest('[data-testid]');
    expect(socCard).toBeTruthy();
    expect(within(socCard!).getByText('Completed')).toBeInTheDocument();

    // Threat Intelligence should show "Failed" (red)
    const tiCard = screen.getByText('Threat Intelligence').closest('[data-testid]');
    expect(tiCard).toBeTruthy();
    expect(within(tiCard!).getByText('Failed')).toBeInTheDocument();

    // Incident Response should show "Awaiting Approval" (orange)
    const irCard = screen.getByText('Incident Response').closest('[data-testid]');
    expect(irCard).toBeTruthy();
    expect(within(irCard!).getByText('Awaiting Approval')).toBeInTheDocument();
  });

  it('derives "Idle" status when no tasks exist for an agent type', () => {
    mockUseAgentTasks.mockReturnValue({ data: mockTasks, isLoading: false });

    render(React.createElement(AgentStatusGrid), { wrapper: createWrapper() });

    // CISO Orchestrator has no tasks in mockTasks -> Idle
    const cisoCard = screen.getByText('CISO Orchestrator').closest('[data-testid]');
    expect(cisoCard).toBeTruthy();
    expect(within(cisoCard!).getByText('Idle')).toBeInTheDocument();

    // AppSec has no tasks -> Idle
    const appsecCard = screen.getByText('AppSec Engineer').closest('[data-testid]');
    expect(appsecCard).toBeTruthy();
    expect(within(appsecCard!).getByText('Idle')).toBeInTheDocument();

    // Pen Test has no tasks -> Idle
    const penTestCard = screen.getByText('Pen Test').closest('[data-testid]');
    expect(penTestCard).toBeTruthy();
    expect(within(penTestCard!).getByText('Idle')).toBeInTheDocument();
  });
});

describe('AgentActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task list with reasoning_summary text visible', () => {
    mockUseAgentTasks.mockReturnValue({ data: mockTasks, isLoading: false });

    render(React.createElement(AgentActivityLog), { wrapper: createWrapper() });

    expect(
      screen.getByText(/Analyzing NIST 800-171 controls/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Completed vulnerability scan/)
    ).toBeInTheDocument();
  });

  it('shows task action, agent_type, and status for each task', () => {
    mockUseAgentTasks.mockReturnValue({ data: mockTasks, isLoading: false });

    render(React.createElement(AgentActivityLog), { wrapper: createWrapper() });

    // Actions visible
    expect(screen.getByText('analyze-compliance')).toBeInTheDocument();
    expect(screen.getByText('scan-vulnerabilities')).toBeInTheDocument();
    expect(screen.getByText('check-threat-feeds')).toBeInTheDocument();

    // Agent type display names
    expect(screen.getByText('GRC Analyst')).toBeInTheDocument();
    expect(screen.getByText('SOC Analyst')).toBeInTheDocument();
  });

  it('handles empty state with "No agent activity yet" message', () => {
    mockUseAgentTasks.mockReturnValue({ data: [], isLoading: false });

    render(React.createElement(AgentActivityLog), { wrapper: createWrapper() });

    expect(screen.getByText('No agent activity yet')).toBeInTheDocument();
  });
});

describe('useRealtimeAgentStatus', () => {
  it('subscribes to postgres_changes on agent_tasks table', async () => {
    // Import after mocks
    const { useRealtimeAgentStatus } = await import(
      '@/hooks/useRealtimeAgentStatus'
    );
    const { renderHook } = await import('@testing-library/react');

    renderHook(() => useRealtimeAgentStatus(), { wrapper: createWrapper() });

    // Should create a channel
    expect(mockChannel).toHaveBeenCalledWith('agent-tasks-changes');

    // Should subscribe to postgres_changes on agent_tasks
    const onCall = mockChannel().on;
    expect(onCall).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'agent_tasks',
      }),
      expect.any(Function)
    );
  });
});
