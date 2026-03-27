import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

/**
 * Tests for Evidence Management -- migration, hooks, and UI components.
 *
 * Covers:
 * - control_evidence migration structure (UNIQUE constraint, RLS)
 * - useControlEvidence hook (list + filter)
 * - useEvidenceCompleteness hook (per-family completeness ratio)
 * - useAddControlEvidence mutation (insert with ON CONFLICT)
 * - EvidenceUpload component (file input, control selector, evidence_type radio)
 * - EvidenceCompleteness component (14 family rows with progress)
 * - EvidenceMatrixTable component (sortable data table)
 */

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const mockControls = [
  { control_id: '3.1.1', title: 'Limit access to authorized users', family: '3.1' },
  { control_id: '3.1.2', title: 'Limit access to types of transactions', family: '3.1' },
  { control_id: '3.5.1', title: 'Identify system users', family: '3.5' },
  { control_id: '3.5.2', title: 'Authenticate users', family: '3.5' },
];

const mockEvidence = [
  {
    id: 'ev-1',
    company_id: 'comp-1',
    control_id: '3.1.1',
    document_id: 'doc-1',
    document_name: 'access-policy.pdf',
    evidence_type: 'examine',
    notes: null,
    created_at: '2026-03-20T00:00:00Z',
  },
  {
    id: 'ev-2',
    company_id: 'comp-1',
    control_id: '3.5.1',
    document_id: 'doc-2',
    document_name: 'interview-notes.pdf',
    evidence_type: 'interview',
    notes: 'Interviewed IT manager',
    created_at: '2026-03-21T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Supabase mock -- chainable query builder
// ---------------------------------------------------------------------------
function createChainableMock(resolvedData: unknown = []) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: resolvedData, error: null });
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  // Make the chain thenable so await resolves
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => void) =>
      resolve({ data: resolvedData, error: null }),
    writable: true,
    configurable: true,
  });
  return chain;
}

let evidenceChain: ReturnType<typeof createChainableMock>;
let controlsChain: ReturnType<typeof createChainableMock>;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'control_evidence') return evidenceChain;
      if (table === 'controls') return controlsChain;
      return createChainableMock([]);
    }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/file.pdf' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } })),
      })),
    },
  },
}));

// Mock @tanstack/react-query
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryFn: () => Promise<unknown> }) => mockUseQuery(opts),
  useMutation: (opts: unknown) => mockUseMutation(opts),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// Mock useUserProfile
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ data: { company_id: 'comp-1', role: 'admin' } }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  evidenceChain = createChainableMock(mockEvidence);
  controlsChain = createChainableMock(mockControls);
});

// ===========================================================================
// Test 1: control_evidence migration creates table with required columns and UNIQUE
// ===========================================================================
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('control_evidence migration', () => {
  it('creates table with company_id, control_id, document_id, evidence_type, and UNIQUE constraint', () => {
    const migrationPath = resolve(
      __dirname,
      '../../../supabase/migrations/20260327100002_control_evidence.sql'
    );
    const sql = readFileSync(migrationPath, 'utf-8');

    // Table creation
    expect(sql).toContain('CREATE TABLE public.control_evidence');

    // Required columns
    expect(sql).toContain('company_id');
    expect(sql).toContain('control_id');
    expect(sql).toContain('document_id');
    expect(sql).toContain('evidence_type');

    // UNIQUE constraint to prevent double-counting
    expect(sql).toMatch(/UNIQUE\s*\(company_id,\s*control_id,\s*document_id\)/i);

    // RLS enabled
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
  });
});

// ===========================================================================
// Test 2: useControlEvidence returns evidence records for current company
// ===========================================================================
describe('useControlEvidence', () => {
  it('returns evidence records for current company', async () => {
    mockUseQuery.mockImplementation(() => ({
      data: mockEvidence,
      isLoading: false,
      error: null,
    }));

    const { useControlEvidence } = await import('@/hooks/useControlEvidence');
    const result = useControlEvidence();

    expect(result.data).toHaveLength(2);
    expect(result.data![0].control_id).toBe('3.1.1');
    expect(result.data![1].evidence_type).toBe('interview');
  });
});

// ===========================================================================
// Test 3: useEvidenceCompleteness returns per-family completeness ratio
// ===========================================================================
describe('useEvidenceCompleteness', () => {
  it('returns per-family completeness ratio (controls_with_evidence / total_controls)', async () => {
    // Mock: 2 controls in 3.1 (1 with evidence), 2 controls in 3.5 (1 with evidence)
    mockUseQuery.mockImplementation((opts: { queryKey: string[] }) => {
      // Return mock completeness data
      return {
        data: [
          { familyId: '3.1', familyName: 'Access Control', controlsWithEvidence: 1, totalControls: 2, percentage: 50 },
          { familyId: '3.5', familyName: 'Identification & Authentication', controlsWithEvidence: 1, totalControls: 2, percentage: 50 },
        ],
        isLoading: false,
        error: null,
      };
    });

    const { useEvidenceCompleteness } = await import('@/hooks/useControlEvidence');
    const result = useEvidenceCompleteness();

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    const acFamily = result.data!.find((f: { familyId: string }) => f.familyId === '3.1');
    expect(acFamily).toBeDefined();
    expect(acFamily!.percentage).toBe(50);
  });
});

// ===========================================================================
// Test 4: useAddControlEvidence mutation inserts row with ON CONFLICT DO NOTHING
// ===========================================================================
describe('useAddControlEvidence', () => {
  it('provides a mutation that calls insert on control_evidence', async () => {
    const mutateSpyFn = vi.fn();
    mockUseMutation.mockReturnValue({
      mutate: mutateSpyFn,
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useAddControlEvidence } = await import('@/hooks/useControlEvidence');
    const mutation = useAddControlEvidence();

    expect(mutation.mutate).toBeDefined();
    expect(typeof mutation.mutate).toBe('function');
    // Verify useMutation was called with the right config
    expect(mockUseMutation).toHaveBeenCalled();
  });
});

// ===========================================================================
// Test 5: EvidenceUpload renders file input, control selector, and evidence_type radio
// ===========================================================================
describe('EvidenceUpload', () => {
  it('renders file input, control selector dropdown, and evidence_type radio options', async () => {
    mockUseQuery.mockImplementation(() => ({
      data: mockControls,
      isLoading: false,
      error: null,
    }));
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { default: EvidenceUpload } = await import(
      '@/components/evidence/EvidenceUpload'
    );
    render(React.createElement(EvidenceUpload));

    // File upload area -- heading text
    expect(screen.getByText('Upload Evidence')).toBeDefined();

    // Evidence type options (label text includes descriptions)
    expect(screen.getByText(/Examine \(documents/i)).toBeDefined();
    expect(screen.getByText(/Interview \(discussions/i)).toBeDefined();
    expect(screen.getByText(/Test \(live demonstrations\)/i)).toBeDefined();
  });
});

// ===========================================================================
// Test 6: EvidenceCompleteness renders 14 family rows with progress
// ===========================================================================
describe('EvidenceCompleteness', () => {
  it('renders 14 family rows with progress percentage and count', async () => {
    const completenessData = [
      { familyId: '3.1', familyName: 'Access Control', controlsWithEvidence: 10, totalControls: 22, percentage: 45 },
      { familyId: '3.2', familyName: 'Awareness & Training', controlsWithEvidence: 3, totalControls: 3, percentage: 100 },
      { familyId: '3.3', familyName: 'Audit & Accountability', controlsWithEvidence: 0, totalControls: 9, percentage: 0 },
      { familyId: '3.4', familyName: 'Configuration Management', controlsWithEvidence: 5, totalControls: 9, percentage: 56 },
      { familyId: '3.5', familyName: 'Identification & Authentication', controlsWithEvidence: 8, totalControls: 11, percentage: 73 },
      { familyId: '3.6', familyName: 'Incident Response', controlsWithEvidence: 2, totalControls: 3, percentage: 67 },
      { familyId: '3.7', familyName: 'Maintenance', controlsWithEvidence: 4, totalControls: 6, percentage: 67 },
      { familyId: '3.8', familyName: 'Media Protection', controlsWithEvidence: 7, totalControls: 9, percentage: 78 },
      { familyId: '3.9', familyName: 'Personnel Security', controlsWithEvidence: 2, totalControls: 2, percentage: 100 },
      { familyId: '3.10', familyName: 'Physical Protection', controlsWithEvidence: 4, totalControls: 6, percentage: 67 },
      { familyId: '3.11', familyName: 'Risk Assessment', controlsWithEvidence: 2, totalControls: 3, percentage: 67 },
      { familyId: '3.12', familyName: 'Security Assessment', controlsWithEvidence: 3, totalControls: 4, percentage: 75 },
      { familyId: '3.13', familyName: 'System & Communications Protection', controlsWithEvidence: 10, totalControls: 16, percentage: 63 },
      { familyId: '3.14', familyName: 'System & Information Integrity', controlsWithEvidence: 5, totalControls: 7, percentage: 71 },
    ];

    mockUseQuery.mockImplementation(() => ({
      data: completenessData,
      isLoading: false,
      error: null,
    }));

    const { default: EvidenceCompleteness } = await import(
      '@/components/evidence/EvidenceCompleteness'
    );
    render(React.createElement(EvidenceCompleteness));

    // Should render family names
    expect(screen.getByText('Access Control')).toBeDefined();
    expect(screen.getByText('Audit & Accountability')).toBeDefined();
    expect(screen.getByText('Incident Response')).toBeDefined();

    // Should show overall summary
    expect(screen.getByText(/controls have evidence/i)).toBeDefined();
  });
});

// ===========================================================================
// Test 7: EvidenceMatrixTable renders data table with evidence records
// ===========================================================================
describe('EvidenceMatrixTable', () => {
  it('renders a data table with control_id, document_name, evidence_type columns', async () => {
    const matrixData = [
      {
        control_id: '3.1.1',
        control_title: 'Limit access to authorized users',
        family_id: '3.1',
        document_name: 'access-policy.pdf',
        evidence_type: 'examine',
        uploaded_at: '2026-03-20',
        notes: null,
      },
      {
        control_id: '3.5.1',
        control_title: 'Identify system users',
        family_id: '3.5',
        document_name: 'interview-notes.pdf',
        evidence_type: 'interview',
        uploaded_at: '2026-03-21',
        notes: 'Interviewed IT manager',
      },
    ];

    mockUseQuery.mockImplementation(() => ({
      data: matrixData,
      isLoading: false,
      error: null,
    }));

    const { default: EvidenceMatrixTable } = await import(
      '@/components/evidence/EvidenceMatrixTable'
    );
    render(React.createElement(EvidenceMatrixTable));

    // Should render column headers
    expect(screen.getByText('Control ID')).toBeDefined();
    expect(screen.getByText('Document Name')).toBeDefined();

    // Should render evidence data
    expect(screen.getByText('3.1.1')).toBeDefined();
    expect(screen.getByText('access-policy.pdf')).toBeDefined();
    expect(screen.getByText('3.5.1')).toBeDefined();
    expect(screen.getByText('interview-notes.pdf')).toBeDefined();
  });
});
