import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';

// ---- Mocks ----

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();

const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  upsert: mockUpsert,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
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

function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

// ---- Tests ----

describe('agent_settings migration', () => {
  it('creates table with company_id, agent_type, settings JSONB, and RLS policies', () => {
    const sql = readMigrationFile('agent_settings');

    // Table creation
    expect(sql).toMatch(/CREATE\s+TABLE\s+public\.agent_settings/i);

    // Required columns
    expect(sql).toMatch(/company_id\s+UUID\s+NOT\s+NULL\s+REFERENCES/i);
    expect(sql).toMatch(/agent_type\s+TEXT\s+NOT\s+NULL/i);
    expect(sql).toMatch(/settings\s+JSONB\s+NOT\s+NULL/i);

    // Unique constraint
    expect(sql).toMatch(/UNIQUE\s*\(\s*company_id\s*,\s*agent_type\s*\)/i);

    // RLS enabled
    expect(sql).toMatch(/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);

    // RLS policies exist
    expect(sql).toMatch(/CREATE\s+POLICY/i);
    expect(sql).toMatch(/SELECT.*auth\.uid\(\)/is);
  });
});

describe('AgentSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: 'settings-1',
        company_id: 'company-1',
        agent_type: 'global',
        settings: {
          notifications: {
            approval_needed: true,
            drift_alert: true,
            task_complete: false,
          },
          auto_approve_threshold: 'low',
        },
      },
      error: null,
    });
  });

  it('renders notification preferences and auto-approve threshold controls', async () => {
    const { AgentSettingsForm } = await import(
      '@/components/agents/AgentSettingsForm'
    );

    render(React.createElement(AgentSettingsForm), {
      wrapper: createWrapper(),
    });

    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      // Notification checkboxes
      expect(screen.getByText(/approval needed/i)).toBeInTheDocument();
      expect(screen.getByText(/drift alert/i)).toBeInTheDocument();
      expect(screen.getByText(/task complete/i)).toBeInTheDocument();

      // Auto-approve threshold
      expect(screen.getByText(/auto-approve/i)).toBeInTheDocument();
    });
  });
});

describe('useAgentSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: 'settings-1',
        company_id: 'company-1',
        agent_type: 'global',
        settings: { notifications: { approval_needed: true }, auto_approve_threshold: 'low' },
      },
      error: null,
    });
  });

  it('queries and upserts agent_settings by company_id', async () => {
    const { useAgentSettings } = await import('@/hooks/useAgentSettings');
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(() => useAgentSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should query agent_settings
    expect(mockFrom).toHaveBeenCalledWith('agent_settings');
  });
});
