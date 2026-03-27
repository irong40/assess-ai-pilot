import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for SSP (System Security Plan) PDF export.
 *
 * Covers:
 * - Cover page with company name, date, CMMC level
 * - One page per control family with autoTable
 * - Vague implementation statement flagging ("[NEEDS REVIEW]")
 */

// ---------------------------------------------------------------------------
// jsPDF mock -- tracks method calls for structural verification
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

// Mock jspdf-autotable as a side-effect module
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

import type { AuditPackageSection } from '@/types/grc-output';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockSections: AuditPackageSection[] = [
  {
    family_id: '3.1',
    family_name: 'Access Control',
    controls: [
      {
        control_id: '3.1.1',
        title: 'Limit access to authorized users',
        status: 'MET',
        implementation_statement:
          'We use Active Directory with Okta SSO to enforce role-based access control (RBAC) across all CUI-touching systems.',
        evidence_references: ['access-policy.pdf', 'okta-config.png'],
      },
      {
        control_id: '3.1.2',
        title: 'Limit access to types of transactions',
        status: 'NOT_MET',
        implementation_statement: 'We limit access.',
        evidence_references: [],
      },
    ],
  },
  {
    family_id: '3.5',
    family_name: 'Identification & Authentication',
    controls: [
      {
        control_id: '3.5.3',
        title: 'Use multifactor authentication',
        status: 'MET',
        implementation_statement:
          'All users are required to use Microsoft Authenticator for MFA. Conditional Access policies enforce MFA for all Azure AD sign-ins.',
        evidence_references: ['mfa-policy.pdf'],
      },
    ],
  },
];

const mockMetadata = {
  companyName: 'Acme Defense Corp',
  assessmentDate: '2026-03-15',
  cmmcLevel: 2,
};

// ===========================================================================
// Test 1: Cover page contains company name, date, CMMC level
// ===========================================================================
describe('generateSspPdf', () => {
  it('creates a jsPDF document with cover page containing company name, date, CMMC level', async () => {
    const { generateSspPdf } = await import(
      '@/components/export/SspExporter'
    );

    const doc = generateSspPdf(mockSections, mockMetadata);

    expect(doc).toBeDefined();
    // Verify cover page text calls include company name and CMMC level
    const textCalls = mockText.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(textCalls.some((t: string) => t.includes('System Security Plan'))).toBe(true);
    expect(textCalls.some((t: string) => t.includes('Acme Defense Corp'))).toBe(true);
    expect(textCalls.some((t: string) => t.includes('CMMC Level 2'))).toBe(true);
  });

  // ===========================================================================
  // Test 2: One page per control family section with control table
  // ===========================================================================
  it('adds one page per control family section', async () => {
    const { generateSspPdf } = await import(
      '@/components/export/SspExporter'
    );

    generateSspPdf(mockSections, mockMetadata);

    // Should add a page for each family section (2 families in mock data)
    // Cover page is page 1, then addPage called for each family
    expect(mockAddPage.mock.calls.length).toBeGreaterThanOrEqual(
      mockSections.length
    );
  });

  // ===========================================================================
  // Test 3: Vague implementation statements flagged with "[NEEDS REVIEW]"
  // ===========================================================================
  it('flags vague implementation statements (< 50 chars) with "[NEEDS REVIEW]" prefix', async () => {
    const { generateSspPdf } = await import(
      '@/components/export/SspExporter'
    );

    generateSspPdf(mockSections, mockMetadata);

    // The autoTable mock is called on the doc instance; check that
    // the short implementation statement "We limit access." gets flagged
    // We verify via the doc.autoTable calls that data includes [NEEDS REVIEW]
    const doc = generateSspPdf(mockSections, mockMetadata);
    const autoTableCalls = (doc.autoTable as ReturnType<typeof vi.fn>).mock
      .calls;

    // Find a call whose body data includes the flagged text
    const allBodies = autoTableCalls.flatMap(
      (call: [{ body: string[][] }]) => call[0]?.body ?? []
    );
    const flaggedRows = allBodies.filter((row: string[]) =>
      row.some((cell: string) =>
        typeof cell === 'string' && cell.includes('[NEEDS REVIEW]')
      )
    );
    expect(flaggedRows.length).toBeGreaterThan(0);
  });
});
