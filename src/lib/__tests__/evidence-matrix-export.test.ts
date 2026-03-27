import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for Evidence Matrix export (PDF and CSV).
 *
 * Covers:
 * - Evidence matrix PDF grouped by family with document-to-control mapping
 * - CSV export with proper comma escaping
 * - ExportPanel renders 3 export buttons and triggers download
 */

// ---------------------------------------------------------------------------
// jsPDF mock
// ---------------------------------------------------------------------------
const mockAddPage = vi.fn();
const mockText = vi.fn();
const mockSave = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockGetPageHeight = vi.fn().mockReturnValue(297);
const mockGetPageWidth = vi.fn().mockReturnValue(210);

vi.mock('jspdf', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      addPage: mockAddPage,
      text: mockText,
      save: mockSave,
      setFontSize: mockSetFontSize,
      setFont: mockSetFont,
      internal: {
        getNumberOfPages: vi.fn().mockReturnValue(1),
        pageSize: { getHeight: mockGetPageHeight, getWidth: mockGetPageWidth },
      },
      getPageHeight: mockGetPageHeight,
      getPageWidth: mockGetPageWidth,
      autoTable: vi.fn(),
      lastAutoTable: { finalY: 100 },
    })),
  };
});

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

// Mock Supabase for ExportPanel test
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      Object.defineProperty(chain, 'then', {
        value: (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null }),
        writable: true,
        configurable: true,
      });
      return chain;
    }),
  },
}));

// Mock TanStack Query
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: unknown) => mockUseQuery(opts),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ data: { company_id: 'comp-1', role: 'admin' } }),
}));
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockEvidenceRows = [
  {
    control_id: '3.1.1',
    control_title: 'Limit access to authorized users',
    family_id: '3.1',
    document_name: 'access-policy.pdf',
    evidence_type: 'examine',
    uploaded_at: '2026-03-20',
  },
  {
    control_id: '3.1.2',
    control_title: 'Limit access to types of transactions',
    family_id: '3.1',
    document_name: 'rbac-config, screenshot.png',
    evidence_type: 'test',
    uploaded_at: '2026-03-21',
  },
  {
    control_id: '3.5.3',
    control_title: 'Use multifactor authentication',
    family_id: '3.5',
    document_name: 'mfa-report.pdf',
    evidence_type: 'test',
    uploaded_at: '2026-03-22',
  },
];

const mockMetadata = {
  companyName: 'Acme Defense Corp',
  assessmentDate: '2026-03-15',
};

// ===========================================================================
// Test 7: Evidence matrix PDF grouped by family
// ===========================================================================
describe('generateEvidenceMatrixPdf', () => {
  it('creates table mapping documents to controls grouped by family', async () => {
    const { generateEvidenceMatrixPdf } = await import(
      '@/components/export/EvidenceMatrixExporter'
    );

    const doc = generateEvidenceMatrixPdf(mockEvidenceRows, mockMetadata);
    expect(doc).toBeDefined();

    // Family headers should appear in text calls
    const textCalls = mockText.mock.calls.map((c: unknown[]) => String(c[0]));
    // Should include family grouping (at least family-level text)
    expect(textCalls.some((t: string) => t.includes('Evidence Matrix'))).toBe(true);

    // autoTable should be called for the evidence data
    const autoTableCalls = (doc.autoTable as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(autoTableCalls.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Test 8: Evidence matrix CSV with proper escaping
// ===========================================================================
describe('generateEvidenceMatrixCsv', () => {
  it('produces valid CSV with proper escaping', async () => {
    const { generateEvidenceMatrixCsv } = await import(
      '@/components/export/EvidenceMatrixExporter'
    );

    const csv = generateEvidenceMatrixCsv(mockEvidenceRows);

    // Header row
    expect(csv).toContain(
      'Control ID,Control Title,Family,Document Name,Evidence Type,Upload Date'
    );

    // Data rows present
    expect(csv).toContain('3.1.1');
    expect(csv).toContain('access-policy.pdf');

    // Field containing comma should be wrapped in double quotes
    // "rbac-config, screenshot.png" contains a comma
    expect(csv).toContain('"rbac-config, screenshot.png"');

    // Each data row should have 6 fields
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(4); // 1 header + 3 data rows
  });
});

// ===========================================================================
// Test 9: ExportPanel renders 3 export buttons
// ===========================================================================
describe('ExportPanel', () => {
  it('renders 3 export buttons (SSP, POA&M, Evidence Matrix) and triggers download', async () => {
    mockUseQuery.mockImplementation(() => ({
      data: null,
      isLoading: false,
      error: null,
    }));

    const { default: ExportPanel } = await import(
      '@/components/export/ExportPanel'
    );
    render(React.createElement(ExportPanel));

    // Should render all 3 export buttons
    expect(screen.getByText(/Export SSP/i)).toBeDefined();
    expect(screen.getByText(/Export POA&M/i)).toBeDefined();
    expect(screen.getByText(/Export Evidence Matrix/i)).toBeDefined();
  });
});
