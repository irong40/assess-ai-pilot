/**
 * Evidence Matrix export generators (PDF and CSV).
 *
 * PDF: Grouped by family_id with section headers and tables.
 * CSV: Proper escaping -- fields with commas wrapped in double quotes,
 *      double quotes escaped as double-double-quotes.
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface EvidenceRow {
  control_id: string;
  control_title: string;
  family_id: string;
  document_name: string;
  evidence_type: string;
  uploaded_at?: string;
}

interface MatrixMetadata {
  companyName: string;
  assessmentDate: string;
}

/**
 * Generates an evidence matrix PDF grouped by family.
 */
export function generateEvidenceMatrixPdf(
  evidenceRows: EvidenceRow[],
  metadata: MatrixMetadata
): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Cover / title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Evidence Matrix', doc.getPageWidth() / 2, 40, {
    align: 'center',
  });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(metadata.companyName, doc.getPageWidth() / 2, 55, {
    align: 'center',
  });

  doc.setFontSize(11);
  doc.text(
    `Assessment Date: ${metadata.assessmentDate}`,
    doc.getPageWidth() / 2,
    68,
    { align: 'center' }
  );

  // Group by family
  const grouped = new Map<string, EvidenceRow[]>();
  for (const row of evidenceRows) {
    const existing = grouped.get(row.family_id) ?? [];
    existing.push(row);
    grouped.set(row.family_id, existing);
  }

  // One section per family
  const sortedFamilies = Array.from(grouped.keys()).sort();

  for (const familyId of sortedFamilies) {
    const rows = grouped.get(familyId)!;

    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Family ${familyId}`, 14, 20);

    const head = [
      ['Control ID', 'Control Title', 'Document Name', 'Evidence Type', 'Date'],
    ];

    const body = rows.map((r) => [
      r.control_id,
      r.control_title,
      r.document_name,
      r.evidence_type.charAt(0).toUpperCase() + r.evidence_type.slice(1),
      r.uploaded_at ?? '',
    ]);

    (doc as jsPDF & { autoTable: (opts: unknown) => void }).autoTable({
      head,
      body,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [55, 65, 81], fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  return doc;
}

/**
 * Generates an evidence matrix CSV string with proper escaping.
 *
 * Rules:
 * - Fields containing commas wrapped in double quotes
 * - Double quotes in field values escaped as double-double-quotes
 */
export function generateEvidenceMatrixCsv(evidenceRows: EvidenceRow[]): string {
  const header =
    'Control ID,Control Title,Family,Document Name,Evidence Type,Upload Date';

  const escapeField = (value: string): string => {
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n')
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = evidenceRows.map((r) =>
    [
      escapeField(r.control_id),
      escapeField(r.control_title),
      escapeField(r.family_id),
      escapeField(r.document_name),
      escapeField(r.evidence_type),
      escapeField(r.uploaded_at ?? ''),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}
