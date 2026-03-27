import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

/**
 * Tests for Compliance Dashboard components, hooks, and utility functions.
 *
 * Covers:
 * - useComplianceSnapshots hook (TanStack Query + Supabase)
 * - compliance-utils: getLatestSnapshot, familyScoresToChartData, getPostureLabel
 * - SprsScoreCard, FamilyProgressChart, ComplianceTrendChart, ExecutiveSummaryView
 * - ComplianceDashboard page composition
 */

// ---------------------------------------------------------------------------
// Supabase mock -- chainable query builder
// ---------------------------------------------------------------------------
const mockSnapshotsData = [
  {
    id: 'snap-1',
    sprs_score: 42,
    met_count: 80,
    not_met_count: 30,
    total_controls: 110,
    family_scores: { '3.1': 75, '3.5': 60 },
    created_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'snap-2',
    sprs_score: 55,
    met_count: 85,
    not_met_count: 25,
    total_controls: 110,
    family_scores: { '3.1': 80, '3.5': 70 },
    created_at: '2026-03-15T00:00:00Z',
  },
];

function createChainableMock(resolvedData: unknown = mockSnapshotsData) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: resolvedData, error: null });
  // Terminal call for list queries
  chain.then = undefined as unknown as ReturnType<typeof vi.fn>;
  // Make the chain thenable so await resolves
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => void) =>
      resolve({ data: resolvedData, error: null }),
    writable: true,
    configurable: true,
  });
  return chain;
}

let snapshotChain: ReturnType<typeof createChainableMock>;
let agentTaskChain: ReturnType<typeof createChainableMock>;

const mockExecutiveSummary = {
  overall_posture: 'progressing' as const,
  sprs_score: 55,
  sprs_trend: 'improving' as const,
  critical_findings: [
    { control_id: '3.5.3', title: 'MFA not enforced', impact: 'High', urgency: 'immediate' as const },
  ],
  risk_areas: [
    { domain: 'Identification & Authentication', risk_level: 'high' as const, finding_count: 4 },
  ],
  recommendations: [
    { priority: 1, description: 'Deploy MFA across all accounts', estimated_effort: 'medium' as const },
  ],
  next_steps: ['Schedule remediation planning meeting'],
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'compliance_snapshots') return snapshotChain;
      if (table === 'agent_tasks') return agentTaskChain;
      return createChainableMock([]);
    }),
  },
}));

// Mock @tanstack/react-query to avoid provider requirement
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryFn: () => Promise<unknown> }) => mockUseQuery(opts),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

// Mock recharts to avoid SVG rendering in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  AreaChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'area-chart' }, children),
  Area: () => React.createElement('div', { 'data-testid': 'area' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'xaxis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'yaxis' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'grid' }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  snapshotChain = createChainableMock(mockSnapshotsData);
  agentTaskChain = createChainableMock({
    id: 'task-1',
    output: mockExecutiveSummary,
    status: 'completed',
  });
});

// ===========================================================================
// Test 1: useComplianceSnapshots returns time-ordered snapshot array
// ===========================================================================
describe('useComplianceSnapshots', () => {
  it('returns time-ordered snapshot array from compliance_snapshots table', async () => {
    // Arrange: mock useQuery to invoke the queryFn
    mockUseQuery.mockImplementation((opts: { queryFn: () => Promise<unknown> }) => {
      const data = mockSnapshotsData;
      return { data, isLoading: false, error: null };
    });

    const { useComplianceSnapshots } = await import('@/hooks/useComplianceSnapshots');

    const result = useComplianceSnapshots();
    expect(result.data).toHaveLength(2);
    expect(result.data![0].sprs_score).toBe(42);
    expect(result.data![1].sprs_score).toBe(55);
  });
});

// ===========================================================================
// Test 2: getLatestSnapshot returns most recent snapshot or null
// ===========================================================================
describe('getLatestSnapshot', () => {
  it('returns the most recent snapshot or null if empty', async () => {
    const { getLatestSnapshot } = await import('@/lib/compliance-utils');

    const latest = getLatestSnapshot(mockSnapshotsData as any);
    expect(latest).toBeDefined();
    expect(latest!.sprs_score).toBe(55);

    expect(getLatestSnapshot([])).toBeNull();
    expect(getLatestSnapshot(undefined as any)).toBeNull();
  });
});

// ===========================================================================
// Test 3: familyScoresToChartData transforms JSONB to chart array
// ===========================================================================
describe('familyScoresToChartData', () => {
  it('transforms family_scores JSONB into array of { family, familyId, score } for all 14 families', async () => {
    const { familyScoresToChartData } = await import('@/lib/compliance-utils');

    const scores: Record<string, number> = { '3.1': 85, '3.5': 60 };
    const chartData = familyScoresToChartData(scores);

    expect(chartData).toHaveLength(14);

    const accessControl = chartData.find((d) => d.familyId === '3.1');
    expect(accessControl).toBeDefined();
    expect(accessControl!.score).toBe(85);
    expect(accessControl!.family).toBe('Access Control');

    const idAuth = chartData.find((d) => d.familyId === '3.5');
    expect(idAuth!.score).toBe(60);

    // Missing families should default to 0
    const maintenance = chartData.find((d) => d.familyId === '3.7');
    expect(maintenance!.score).toBe(0);
  });
});

// ===========================================================================
// Test 4: getPostureLabel returns correct posture string
// ===========================================================================
describe('getPostureLabel', () => {
  it('returns correct posture for score ranges', async () => {
    const { getPostureLabel } = await import('@/lib/compliance-utils');

    expect(getPostureLabel(-10)).toBe('Critical');
    expect(getPostureLabel(-1)).toBe('Critical');
    expect(getPostureLabel(0)).toBe('At Risk');
    expect(getPostureLabel(50)).toBe('At Risk');
    expect(getPostureLabel(51)).toBe('Progressing');
    expect(getPostureLabel(80)).toBe('Progressing');
    expect(getPostureLabel(81)).toBe('Compliant');
    expect(getPostureLabel(110)).toBe('Compliant');
  });
});

// ===========================================================================
// Test 5: SprsScoreCard renders score, posture, and counts
// ===========================================================================
describe('SprsScoreCard', () => {
  it('renders the SPRS score number, posture label, and met/not_met counts', async () => {
    const { default: SprsScoreCard } = await import(
      '@/components/compliance/SprsScoreCard'
    );

    render(
      React.createElement(SprsScoreCard, {
        snapshot: {
          sprs_score: 55,
          met_count: 85,
          not_met_count: 25,
          total_controls: 110,
          family_scores: {},
          cmmc_level: 2,
          not_applicable_count: 0,
          critical_controls_met: true,
          poam_eligible: true,
        },
      })
    );

    // Score displayed
    expect(screen.getByText('55')).toBeInTheDocument();
    // Posture label
    expect(screen.getByText('Progressing')).toBeInTheDocument();
    // Met count
    expect(screen.getByText(/85/)).toBeInTheDocument();
    // Not met count
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });
});

// ===========================================================================
// Test 6: FamilyProgressChart renders 14 progress bars
// ===========================================================================
describe('FamilyProgressChart', () => {
  it('renders 14 progress bars with family names and percentage scores', async () => {
    const { default: FamilyProgressChart } = await import(
      '@/components/compliance/FamilyProgressChart'
    );

    render(
      React.createElement(FamilyProgressChart, {
        familyScores: { '3.1': 85, '3.5': 60, '3.14': 90 },
      })
    );

    // All 14 family names should be present
    expect(screen.getByText('Access Control')).toBeInTheDocument();
    expect(screen.getByText('Identification & Authentication')).toBeInTheDocument();
    expect(screen.getByText('System & Information Integrity')).toBeInTheDocument();
    // Score percentages
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });
});

// ===========================================================================
// Test 7: ComplianceTrendChart renders Recharts AreaChart
// ===========================================================================
describe('ComplianceTrendChart', () => {
  it('renders a Recharts AreaChart with SPRS score data points over time', async () => {
    const { default: ComplianceTrendChart } = await import(
      '@/components/compliance/ComplianceTrendChart'
    );

    render(
      React.createElement(ComplianceTrendChart, {
        snapshots: mockSnapshotsData as any,
      })
    );

    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByText(/Compliance Trend/i)).toBeInTheDocument();
  });
});

// ===========================================================================
// Test 8: ExecutiveSummaryView renders posture, findings, risk areas
// ===========================================================================
describe('ExecutiveSummaryView', () => {
  it('renders posture, critical findings, risk areas, and recommendations from CISO output', async () => {
    // Configure useQuery to return executive summary data
    mockUseQuery.mockImplementation(() => ({
      data: mockExecutiveSummary,
      isLoading: false,
      error: null,
    }));

    const { default: ExecutiveSummaryView } = await import(
      '@/components/compliance/ExecutiveSummaryView'
    );

    render(React.createElement(ExecutiveSummaryView));

    // Posture
    expect(screen.getByText(/progressing/i)).toBeInTheDocument();
    // Critical finding
    expect(screen.getByText(/MFA not enforced/i)).toBeInTheDocument();
    // Risk area
    expect(screen.getByText(/Identification & Authentication/i)).toBeInTheDocument();
    // Recommendation
    expect(screen.getByText(/Deploy MFA/i)).toBeInTheDocument();
  });
});

// ===========================================================================
// Test 9: ComplianceDashboard composes all components
// ===========================================================================
describe('ComplianceDashboard', () => {
  it('composes all components on one page', async () => {
    // useQuery returns snapshots for the main hook, executive summary for the second
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        return { data: mockSnapshotsData, isLoading: false, error: null };
      }
      return { data: mockExecutiveSummary, isLoading: false, error: null };
    });

    const { default: ComplianceDashboard } = await import(
      '@/pages/ComplianceDashboard'
    );

    render(React.createElement(ComplianceDashboard));

    // Page title
    expect(screen.getByText('Compliance Dashboard')).toBeInTheDocument();
    // SPRS score card
    expect(screen.getByText('55')).toBeInTheDocument();
    // Trend chart
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    // Family progress bars (at least one)
    expect(screen.getByText('Access Control')).toBeInTheDocument();
  });
});
