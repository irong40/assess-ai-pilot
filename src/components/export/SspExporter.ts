/**
 * SSP (System Security Plan) PDF generator.
 *
 * Generates an audit-ready SSP organized by the 14 NIST 800-171 control families.
 * Each family section includes a table of controls with implementation statements
 * and evidence references. Vague statements (< 50 chars) are flagged with
 * "[NEEDS REVIEW]" per CMMC assessment best practices.
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { AuditPackageSection } from '@/types/grc-output';

interface SspMetadata {
  companyName: string;
  assessmentDate: string;
  cmmcLevel: number;
}

/**
 * Generates an SSP PDF document.
 *
 * @param sections - Array of AuditPackageSection (one per NIST family)
 * @param metadata - Company name, assessment date, CMMC level
 * @returns jsPDF document instance
 */
export function generateSspPdf(
  sections: AuditPackageSection[],
  metadata: SspMetadata
): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // -----------------------------------------------------------------------
  // Cover page
  // -----------------------------------------------------------------------
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('System Security Plan', doc.getPageWidth() / 2, 60, {
    align: 'center',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(metadata.companyName, doc.getPageWidth() / 2, 80, {
    align: 'center',
  });

  doc.text(`CMMC Level ${metadata.cmmcLevel}`, doc.getPageWidth() / 2, 95, {
    align: 'center',
  });

  doc.setFontSize(12);
  doc.text(
    `Assessment Date: ${metadata.assessmentDate}`,
    doc.getPageWidth() / 2,
    110,
    { align: 'center' }
  );

  doc.text(
    'NIST SP 800-171 Rev 2 Compliance',
    doc.getPageWidth() / 2,
    125,
    { align: 'center' }
  );

  // -----------------------------------------------------------------------
  // Family sections -- one page per family
  // -----------------------------------------------------------------------
  for (const section of sections) {
    doc.addPage();

    // Section header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${section.family_id} - ${section.family_name}`,
      14,
      20
    );

    // Control table
    const head = [
      ['Control ID', 'Title', 'Status', 'Implementation Statement', 'Evidence'],
    ];

    const body = section.controls.map((ctrl) => {
      // Quality check: flag vague implementation statements
      let statement = ctrl.implementation_statement || '';
      if (statement.length < 50) {
        statement = `[NEEDS REVIEW] ${statement}`;
      }

      return [
        ctrl.control_id,
        ctrl.title,
        ctrl.status,
        statement,
        ctrl.evidence_references.join(', ') || 'None',
      ];
    });

    (doc as jsPDF & { autoTable: (opts: unknown) => void }).autoTable({
      head,
      body,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 65, 122], fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 18 },
        3: { cellWidth: 70 },
        4: { cellWidth: 40 },
      },
      margin: { left: 14, right: 14 },
    });
  }

  return doc;
}
