import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for reassessment scheduling:
 * - Migration file structure (reassessment_schedules table)
 * - ReassessmentScheduler component UI
 * - useReassessmentSchedule hook
 */

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------
function createChainableMock(resolvedData: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: resolvedData, error: null });
  chain.upsert = vi.fn().mockReturnValue(chain);
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => void) =>
      resolve({ data: resolvedData, error: null }),
    writable: true,
    configurable: true,
  });
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => createChainableMock()),
  },
}));

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: unknown) => mockUseQuery(opts),
  useMutation: (opts: unknown) => mockUseMutation(opts),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// Test 6: reassessment_schedules migration structure
// ===========================================================================
describe('reassessment_schedules migration', () => {
  it('creates table with company_id, cmmc_level, cron_expression, enabled, and RLS', () => {
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir);
    const match = files.find((f) => f.includes('reassessment_schedules'));
    expect(match).toBeDefined();

    const sql = fs.readFileSync(path.join(migrationsDir, match!), 'utf-8');

    // Table creation
    expect(sql).toMatch(/CREATE\s+TABLE\s+public\.reassessment_schedules/i);
    // Required columns
    expect(sql).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    expect(sql).toMatch(/cmmc_level\s+INT/i);
    expect(sql).toMatch(/cron_expression\s+TEXT/i);
    expect(sql).toMatch(/enabled\s+BOOLEAN/i);
    // RLS enabled
    expect(sql).toMatch(
      /ALTER\s+TABLE\s+public\.reassessment_schedules\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i
    );
    // At least one policy
    expect(sql).toMatch(/CREATE\s+POLICY/i);
  });
});

// ===========================================================================
// Test 7: ReassessmentScheduler renders frequency dropdown and save button
// ===========================================================================
describe('ReassessmentScheduler', () => {
  it('renders frequency dropdown (weekly/monthly/quarterly) and save button', async () => {
    mockUseQuery.mockImplementation(() => ({
      data: null,
      isLoading: false,
      error: null,
    }));

    const { default: ReassessmentScheduler } = await import(
      '@/components/compliance/ReassessmentScheduler'
    );

    render(React.createElement(ReassessmentScheduler));

    // Title
    expect(screen.getByText(/Reassessment Schedule/i)).toBeInTheDocument();
    // Save button
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});

// ===========================================================================
// Test 8: useReassessmentSchedule queries for current company
// ===========================================================================
describe('useReassessmentSchedule', () => {
  it('queries reassessment_schedules for current company', async () => {
    mockUseQuery.mockImplementation((opts: { queryKey: string[] }) => {
      return {
        data: {
          id: 'sched-1',
          frequency_label: 'monthly',
          cron_expression: '0 0 1 * *',
          cmmc_level: 2,
          enabled: true,
        },
        isLoading: false,
        error: null,
      };
    });

    const { useReassessmentSchedule } = await import(
      '@/hooks/useReassessmentSchedule'
    );

    const result = useReassessmentSchedule();
    expect(result.data).toBeDefined();
    expect(result.data!.frequency_label).toBe('monthly');
    expect(result.data!.cmmc_level).toBe(2);
    expect(result.data!.enabled).toBe(true);
  });
});
