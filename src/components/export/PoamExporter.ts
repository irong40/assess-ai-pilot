/**
 * POA&M (Plan of Action & Milestones) PDF generator.
 *
 * Generates an audit-ready POA&M with all 7 required fields per CMMC Level 2:
 * 1. Control Identifier
 * 2. Current State / Weakness
 * 3. Risk/Impact Assessment
 * 4. Remediation Action and Milestones
 * 5. Resources Required
 * 6. Owner / Responsibility
 * 7. Scheduled Due Dates
 *
 * Enforces CMMC POA&M rules:
 * - Minimum SPRS score of 80/110 to use POA&M
 * - MFA, FIPS encryption, IR, audit logging, SSP cannot be deferred
 * - 180-day remediation deadline
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { GapAnalysisFinding } from '@/types/grc-output';

interface PoamMetadata {
  companyName: string;
  assessmentDate: string;
  cmmcLevel: number;
  sprsScore: number;
}

/** Critical controls that CANNOT be deferred per CMMC Level 2 rules */
const CRITICAL_CONTROLS = [
  { id: '3.5.3', name: 'Multifactor Authentication (MFA)' },
  { id: '3.13.11', name: 'FIPS-validated Encryption' },
  { id: '3.6.1', name: 'Incident Response' },
  { id: '3.3.1', name: 'Audit Logging' },
  { id: '3.12.4', name: 'System Security Plan (SSP)' },
];

/** Map family prefix to risk impact level */
function getRiskImpact(familyId: string): string {
  const highImpactFamilies = ['3.1', '3.3', '3.5', '3.13'];
  return highImpactFamilies.includes(familyId) ? 'High' : 'Medium';
}

/** Calculate due date: min(assessment + timeline, assessment + 180 days) */
function calculateDueDate(assessmentDate: string, timelineDays: number): string {
  const assessment = new Date(assessmentDate);
  const maxDeadline = new Date(assessmentDate);
  maxDeadline.setDate(maxDeadline.getDate() + 180);

  const planned = new Date(assessment);
  planned.setDate(planned.getDate() + timelineDays);

  const effective = planned <= maxDeadline ? planned : maxDeadline;
  return effective.toISOString().split('T')[0];
}

/** Format resources from cost/effort tiers */
function formatResources(costTier: string, effortTier: string): string {
  const costMap: Record<string, string> = {
    low: 'Minimal funding',
    medium: 'Moderate budget allocation',
    high: 'Significant investment required',
  };
  const effortMap: Record<string, string> = {
    low: 'light personnel',
    medium: 'dedicated team member',
    high: 'full team effort',
  };
  return `${costMap[costTier] ?? 'TBD funding'}, ${effortMap[effortTier] ?? 'TBD effort'}`;
}

/**
 * Generates a POA&M PDF document.
 *
 * @param findings - All gap analysis findings (NOT_MET filtered internally)
 * @param metadata - Company info, assessment date, CMMC level, SPRS score
 * @returns jsPDF document instance
 */
export function generatePoamPdf(
  findings: GapAnalysisFinding[],
  metadata: PoamMetadata
): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const notMetFindings = findings.filter((f) => f.status === 'NOT_MET');

  // -----------------------------------------------------------------------
  // Cover page
  // -----------------------------------------------------------------------
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'Plan of Action & Milestones (POA&M)',
    doc.getPageWidth() / 2,
    60,
    { align: 'center' }
  );

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
    `SPRS Score: ${metadata.sprsScore} / 110`,
    doc.getPageWidth() / 2,
    125,
    { align: 'center' }
  );

  // -----------------------------------------------------------------------
  // Warning banner page
  // -----------------------------------------------------------------------
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CMMC Level 2 POA&M Rules', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 35;

  doc.text(
    'POA&M remediation deadline: 180 days from assessment date',
    14,
    y
  );
  y += 8;

  doc.text(
    `Maximum deadline: ${calculateDueDate(metadata.assessmentDate, 180)}`,
    14,
    y
  );
  y += 8;

  doc.text(
    `Minimum SPRS score for POA&M eligibility: 80/110`,
    14,
    y
  );
  y += 8;

  // SPRS score warning
  if (metadata.sprsScore < 80) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 50, 50);
    doc.text(
      `WARNING: SPRS score ${metadata.sprsScore} is below the 80/110 minimum required for POA&M eligibility.`,
      14,
      y
    );
    doc.setTextColor(0, 0, 0);
    y += 12;
  } else {
    y += 4;
  }

  // Critical controls that cannot be deferred
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Critical Controls (CANNOT BE DEFERRED):', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  for (const critical of CRITICAL_CONTROLS) {
    const finding = notMetFindings.find((f) => f.control_id === critical.id);
    const status = finding ? '[CANNOT BE DEFERRED] NOT MET' : 'MET';
    const color = finding ? 'WARNING' : 'OK';
    doc.text(`  ${critical.id} - ${critical.name}: ${status}`, 14, y);
    y += 7;
  }

  // -----------------------------------------------------------------------
  // POA&M table with all 7 required fields
  // -----------------------------------------------------------------------
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('POA&M Items', 14, 20);

  const head = [
    [
      'Control ID',
      'Weakness',
      'Risk/Impact',
      'Remediation',
      'Resources',
      'Owner',
      'Due Date',
    ],
  ];

  const body = notMetFindings.map((f) => {
    const topRemediation = f.remediation_options[0];
    const isCritical = CRITICAL_CONTROLS.some((c) => c.id === f.control_id);

    // Field 1: Control Identifier
    const controlId = isCritical
      ? `${f.control_id} [CANNOT BE DEFERRED]`
      : f.control_id;

    // Field 2: Current State / Weakness
    const weakness = `Control ${f.control_id} - ${f.control_title}: NOT MET. Failed objectives: ${f.failed_objectives.join(', ')}`;

    // Field 3: Risk/Impact Assessment
    const riskImpact = getRiskImpact(f.family_id);

    // Field 4: Remediation Action & Milestones
    const remediation = topRemediation?.description ?? '[NO REMEDIATION DEFINED]';

    // Field 5: Resources Required
    const resources = topRemediation
      ? formatResources(topRemediation.cost_tier, topRemediation.effort_tier)
      : '[TBD]';

    // Field 6: Owner / Responsibility
    const owner = '[TO BE ASSIGNED]';

    // Field 7: Scheduled Due Date (capped at 180 days)
    const dueDate = topRemediation
      ? calculateDueDate(metadata.assessmentDate, topRemediation.timeline_days)
      : calculateDueDate(metadata.assessmentDate, 180);

    return [controlId, weakness, riskImpact, remediation, resources, owner, dueDate];
  });

  (doc as jsPDF & { autoTable: (opts: unknown) => void }).autoTable({
    head,
    body,
    startY: 30,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [178, 34, 34], fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 55 },
      2: { cellWidth: 18 },
      3: { cellWidth: 55 },
      4: { cellWidth: 35 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  return doc;
}
