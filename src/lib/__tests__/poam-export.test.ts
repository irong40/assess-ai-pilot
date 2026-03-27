import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for POA&M (Plan of Action & Milestones) PDF export.
 *
 * Covers:
 * - All 7 required POA&M fields per CMMC Level 2
 * - Warning banner for critical controls that cannot be deferred
 * - 180-day deadline calculation from assessment_date
 */

// ---------------------------------------------------------------------------
// jsPDF mock
// ---------------------------------------------------------------------------
const mockAddPage = vi.fn();
const mockText = vi.fn();
const mockSave = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetFont = vi.fn();
const mockSetTextColor = vi.fn();
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
      setTextColor: mockSetTextColor,
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

import type { GapAnalysisFinding } from '@/types/grc-output';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockFindings: GapAnalysisFinding[] = [
  {
    control_id: '3.5.3',
    control_title: 'Use multifactor authentication',
    family_id: '3.5',
    family_name: 'Identification & Authentication',
    status: 'NOT_MET',
    failed_objectives: ['MFA not enforced for remote access'],
    evidence_gaps: [{ method: 'test', description: 'No MFA configured' }],
    remediation_options: [
      {
        option_id: 'r-1',
        description: 'Deploy Microsoft Authenticator for all Azure AD users',
        cost_tier: 'low',
        effort_tier: 'medium',
        timeline_days: 30,
        priority_rank: 1,
      },
    ],
  },
  {
    control_id: '3.1.1',
    control_title: 'Limit access to authorized users',
    family_id: '3.1',
    family_name: 'Access Control',
    status: 'NOT_MET',
    failed_objectives: ['No RBAC enforcement'],
    evidence_gaps: [{ method: 'examine', description: 'Missing access policy' }],
    remediation_options: [
      {
        option_id: 'r-2',
        description: 'Implement Active Directory group-based RBAC',
        cost_tier: 'medium',
        effort_tier: 'high',
        timeline_days: 90,
        priority_rank: 1,
      },
    ],
  },
  {
    control_id: '3.2.1',
    control_title: 'Security awareness training',
    family_id: '3.2',
    family_name: 'Awareness & Training',
    status: 'MET',
    failed_objectives: [],
    evidence_gaps: [],
    remediation_options: [],
  },
];

const mockMetadata = {
  companyName: 'Acme Defense Corp',
  assessmentDate: '2026-03-15',
  cmmcLevel: 2,
  sprsScore: 55,
};

// ===========================================================================
// Test 4: generatePoamPdf includes all 7 required POA&M fields
// ===========================================================================
describe('generatePoamPdf', () => {
  it('includes all 7 required POA&M fields per CMMC Level 2', async () => {
    const { generatePoamPdf } = await import(
      '@/components/export/PoamExporter'
    );

    const doc = generatePoamPdf(mockFindings, mockMetadata);
    expect(doc).toBeDefined();

    // Verify autoTable was called with 7-column data
    const autoTableCalls = (doc.autoTable as ReturnType<typeof vi.fn>).mock
      .calls;

    // Find the main POA&M table (has 7 columns in head)
    const poamTable = autoTableCalls.find(
      (call: [{ head: string[][] }]) =>
        call[0]?.head?.[0]?.length === 7
    );
    expect(poamTable).toBeDefined();

    // Verify header labels match the 7 required fields
    const headers = poamTable![0].head[0];
    expect(headers).toContain('Control ID');
    expect(headers).toContain('Weakness');
    expect(headers).toContain('Risk/Impact');
    expect(headers).toContain('Remediation');
    expect(headers).toContain('Resources');
    expect(headers).toContain('Owner');
    expect(headers).toContain('Due Date');
  });

  // ===========================================================================
  // Test 5: Warning banner for critical controls that cannot be deferred
  // ===========================================================================
  it('adds warning banner for critical controls that cannot be deferred (MFA, FIPS, IR, audit, SSP)', async () => {
    const { generatePoamPdf } = await import(
      '@/components/export/PoamExporter'
    );

    generatePoamPdf(mockFindings, mockMetadata);

    // 3.5.3 (MFA) is NOT_MET and is a critical control
    const textCalls = mockText.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(
      textCalls.some((t: string) => t.includes('CANNOT BE DEFERRED'))
    ).toBe(true);
  });

  // ===========================================================================
  // Test 6: 180-day deadline calculation from assessment_date
  // ===========================================================================
  it('includes 180-day deadline calculation from assessment_date', async () => {
    const { generatePoamPdf } = await import(
      '@/components/export/PoamExporter'
    );

    const doc = generatePoamPdf(mockFindings, mockMetadata);

    // The 180-day max deadline from 2026-03-15 = 2026-09-11
    const autoTableCalls = (doc.autoTable as ReturnType<typeof vi.fn>).mock
      .calls;

    // Find body data that includes date strings
    const allBodies = autoTableCalls.flatMap(
      (call: [{ body: string[][] }]) => call[0]?.body ?? []
    );

    // At least one row should have a due date
    const rowsWithDates = allBodies.filter((row: string[]) =>
      row.some(
        (cell: string) => typeof cell === 'string' && /\d{4}-\d{2}-\d{2}/.test(cell)
      )
    );
    expect(rowsWithDates.length).toBeGreaterThan(0);

    // Verify the 180-day deadline text appears
    const textCalls = mockText.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(
      textCalls.some((t: string) => t.includes('180'))
    ).toBe(true);
  });
});
