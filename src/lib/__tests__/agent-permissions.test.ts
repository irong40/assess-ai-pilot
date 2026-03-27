import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';

// ---- Mocks ----

let mockUserProfile: { role: string; company_id: string } | null = {
  role: 'admin',
  company_id: 'company-1',
};

const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
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
    data: mockUserProfile,
    isLoading: mockUserProfile === null,
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
  if (!match)
    throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

// ---- Tests ----

describe('company_agent_permissions migration', () => {
  it('creates table with correct schema and unique constraint', () => {
    const sql = readMigrationFile('agent_permissions');

    // Table creation
    expect(sql).toMatch(/CREATE\s+TABLE\s+public\.company_agent_permissions/i);

    // Required columns
    expect(sql).toMatch(/company_id\s+UUID\s+NOT\s+NULL\s+REFERENCES/i);
    expect(sql).toMatch(/role\s+public\.user_role\s+NOT\s+NULL/i);
    expect(sql).toMatch(/agent_type\s+public\.agent_type\s+NOT\s+NULL/i);
    expect(sql).toMatch(/can_configure\s+BOOLEAN\s+NOT\s+NULL/i);
    expect(sql).toMatch(/can_approve\s+BOOLEAN\s+NOT\s+NULL/i);
    expect(sql).toMatch(/can_view_logs\s+BOOLEAN\s+NOT\s+NULL/i);

    // Unique constraint on (company_id, role, agent_type)
    expect(sql).toMatch(
      /UNIQUE\s*\(\s*company_id\s*,\s*role\s*,\s*agent_type\s*\)/i
    );
  });

  it('enables RLS with SELECT for all company users and admin-only writes', () => {
    const sql = readMigrationFile('agent_permissions');

    // RLS enabled
    expect(sql).toMatch(/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);

    // At least one policy for SELECT and one for writes
    expect(sql).toMatch(/CREATE\s+POLICY/i);
    expect(sql).toMatch(/SELECT/i);
  });

  it('seeds default permissions for existing companies via CROSS JOIN', () => {
    const sql = readMigrationFile('agent_permissions');

    // Seed uses CROSS JOIN to populate for all companies x roles x agent_types
    expect(sql).toMatch(/CROSS\s+JOIN/i);
    expect(sql).toMatch(/ON\s+CONFLICT.*DO\s+NOTHING/i);
  });

  it('creates trigger for auto-seeding new companies', () => {
    const sql = readMigrationFile('agent_permissions');

    // Trigger function and trigger
    expect(sql).toMatch(
      /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+.*seed_agent_permissions/i
    );
    expect(sql).toMatch(/CREATE\s+TRIGGER/i);
    expect(sql).toMatch(/AFTER\s+INSERT\s+ON\s+public\.companies/i);
  });

  it('uses correct default permission matrix', () => {
    const sql = readMigrationFile('agent_permissions');

    // Admin gets all permissions
    expect(sql).toMatch(/admin/);
    // ISSM gets approve and view_logs
    expect(sql).toMatch(/issm/);
    // ISSO gets view_logs only
    expect(sql).toMatch(/isso/);
    // Viewer in defaults
    expect(sql).toMatch(/viewer/);
  });
});

describe('useAgentPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserProfile = { role: 'admin', company_id: 'company-1' };
  });

  it('returns canConfigure=true, canApprove=true, canViewLogs=true for admin role', async () => {
    mockSingle.mockResolvedValue({
      data: { can_configure: true, can_approve: true, can_view_logs: true },
      error: null,
    });

    const { useAgentPermissions } = await import(
      '@/hooks/useAgentPermissions'
    );
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(
      () => useAgentPermissions('grc_analyst'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      canConfigure: true,
      canApprove: true,
      canViewLogs: true,
    });
    expect(mockFrom).toHaveBeenCalledWith('company_agent_permissions');
  });

  it('returns canConfigure=false, canApprove=true, canViewLogs=true for issm role', async () => {
    mockUserProfile = { role: 'issm', company_id: 'company-1' };
    mockSingle.mockResolvedValue({
      data: { can_configure: false, can_approve: true, can_view_logs: true },
      error: null,
    });

    const { useAgentPermissions } = await import(
      '@/hooks/useAgentPermissions'
    );
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(
      () => useAgentPermissions('grc_analyst'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      canConfigure: false,
      canApprove: true,
      canViewLogs: true,
    });
  });

  it('returns canConfigure=false, canApprove=false, canViewLogs=true for isso role', async () => {
    mockUserProfile = { role: 'isso', company_id: 'company-1' };
    mockSingle.mockResolvedValue({
      data: { can_configure: false, can_approve: false, can_view_logs: true },
      error: null,
    });

    const { useAgentPermissions } = await import(
      '@/hooks/useAgentPermissions'
    );
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(
      () => useAgentPermissions('grc_analyst'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      canConfigure: false,
      canApprove: false,
      canViewLogs: true,
    });
  });

  it('returns all-false for viewer role', async () => {
    mockUserProfile = { role: 'viewer', company_id: 'company-1' };
    mockSingle.mockResolvedValue({
      data: {
        can_configure: false,
        can_approve: false,
        can_view_logs: false,
      },
      error: null,
    });

    const { useAgentPermissions } = await import(
      '@/hooks/useAgentPermissions'
    );
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(
      () => useAgentPermissions('grc_analyst'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      canConfigure: false,
      canApprove: false,
      canViewLogs: false,
    });
  });

  it('returns safe default (all-false) on query error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'no rows', code: 'PGRST116' },
    });

    const { useAgentPermissions } = await import(
      '@/hooks/useAgentPermissions'
    );
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(
      () => useAgentPermissions('grc_analyst'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      canConfigure: false,
      canApprove: false,
      canViewLogs: false,
    });
  });

  it('is disabled (isLoading) when profile has no company_id', async () => {
    mockUserProfile = null;

    const { useAgentPermissions } = await import(
      '@/hooks/useAgentPermissions'
    );
    const { renderHook } = await import('@testing-library/react');

    const { result } = renderHook(
      () => useAgentPermissions('grc_analyst'),
      { wrapper: createWrapper() }
    );

    // Query should not fire -- stays in pending/idle state (enabled=false)
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalledWith('company_agent_permissions');
  });
});

describe('useAllAgentPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserProfile = { role: 'admin', company_id: 'company-1' };
  });

  it('returns a Map of all agent type permissions for current role', async () => {
    // Override mockFrom to handle the non-single query for useAllAgentPermissions
    const mockSelectAll = vi.fn().mockReturnThis();
    const mockEqAll = vi.fn().mockReturnThis();
    mockEqAll.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            agent_type: 'grc_analyst',
            can_configure: true,
            can_approve: true,
            can_view_logs: true,
          },
          {
            agent_type: 'soc_analyst',
            can_configure: true,
            can_approve: true,
            can_view_logs: true,
          },
        ],
        error: null,
      }),
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                agent_type: 'grc_analyst',
                can_configure: true,
                can_approve: true,
                can_view_logs: true,
              },
              {
                agent_type: 'soc_analyst',
                can_configure: true,
                can_approve: true,
                can_view_logs: true,
              },
            ],
            error: null,
          }),
        }),
      }),
    });

    const { useAllAgentPermissions } = await import(
      '@/hooks/useAgentPermissions'
    );
    const { renderHook, waitFor } = await import('@testing-library/react');

    const { result } = renderHook(() => useAllAgentPermissions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const map = result.current.data;
    expect(map).toBeInstanceOf(Map);
    expect(map?.get('grc_analyst')).toEqual({
      canConfigure: true,
      canApprove: true,
      canViewLogs: true,
    });
    expect(map?.get('soc_analyst')).toEqual({
      canConfigure: true,
      canApprove: true,
      canViewLogs: true,
    });
  });
});
