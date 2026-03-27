/**
 * Export service for generating and downloading audit-ready documents.
 *
 * Provides:
 * - exportSsp: SSP PDF download
 * - exportPoam: POA&M PDF download
 * - exportEvidenceMatrix: Evidence matrix PDF or CSV download
 *
 * Uses Supabase client directly (not hooks) since this is a service module.
 */
import { supabase } from '@/integrations/supabase/client';
import { generateSspPdf } from '@/components/export/SspExporter';
import { generatePoamPdf } from '@/components/export/PoamExporter';
import {
  generateEvidenceMatrixPdf,
  generateEvidenceMatrixCsv,
} from '@/components/export/EvidenceMatrixExporter';
import type {
  GapAnalysisReport,
  AuditPackageSection,
  GapAnalysisFinding,
} from '@/types/grc-output';
import { NIST_FAMILIES } from '@/lib/compliance-utils';

/** Transform GapAnalysisFinding[] into AuditPackageSection[] grouped by family */
function buildSspSections(
  findings: GapAnalysisFinding[]
): AuditPackageSection[] {
  const familyMap = new Map<string, GapAnalysisFinding[]>();

  for (const finding of findings) {
    const existing = familyMap.get(finding.family_id) ?? [];
    existing.push(finding);
    familyMap.set(finding.family_id, existing);
  }

  return NIST_FAMILIES.map((family) => {
    const familyFindings = familyMap.get(family.id) ?? [];
    return {
      family_id: family.id,
      family_name: family.name,
      controls: familyFindings.map((f) => ({
        control_id: f.control_id,
        title: f.control_title,
        status: f.status,
        implementation_statement:
          f.status === 'MET'
            ? `Control implemented. Evidence collected via ${f.evidence_gaps.map((g) => g.method).join(', ') || 'review'}.`
            : `NOT MET. Failed objectives: ${f.failed_objectives.join(', ')}`,
        evidence_references: f.evidence_gaps.map((g) => g.description),
      })),
    };
  }).filter((s) => s.controls.length > 0);
}

/** Format date for filenames */
function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Export SSP as PDF.
 */
export async function exportSsp(companyName: string, companyId: string) {
  const { data, error } = await supabase
    .from('gap_analysis_results')
    .select('report')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(`No gap analysis found: ${error.message}`);

  const report = data.report as unknown as GapAnalysisReport;
  const sections = buildSspSections(report.findings);

  const doc = generateSspPdf(sections, {
    companyName,
    assessmentDate: report.assessment_date,
    cmmcLevel: report.cmmc_level,
  });

  doc.save(`SSP-${companyName.replace(/\s+/g, '-')}-${dateStamp()}.pdf`);
}

/**
 * Export POA&M as PDF.
 */
export async function exportPoam(companyName: string, companyId: string) {
  // Fetch latest gap analysis
  const { data: gapData, error: gapErr } = await supabase
    .from('gap_analysis_results')
    .select('report')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (gapErr) throw new Error(`No gap analysis found: ${gapErr.message}`);

  // Fetch latest compliance snapshot for SPRS score
  const { data: snapData } = await supabase
    .from('compliance_snapshots')
    .select('sprs_score')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const report = gapData.report as unknown as GapAnalysisReport;
  const sprsScore = (snapData as { sprs_score: number } | null)?.sprs_score ?? report.sprs_score;

  const doc = generatePoamPdf(report.findings, {
    companyName,
    assessmentDate: report.assessment_date,
    cmmcLevel: report.cmmc_level,
    sprsScore,
  });

  doc.save(`POAM-${companyName.replace(/\s+/g, '-')}-${dateStamp()}.pdf`);
}

/**
 * Export evidence matrix as PDF or CSV.
 */
export async function exportEvidenceMatrix(
  companyName: string,
  companyId: string,
  format: 'pdf' | 'csv' = 'pdf'
) {
  // Fetch evidence records
  const { data: evidence, error: evidenceErr } = await supabase
    .from('control_evidence' as string)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (evidenceErr) throw new Error(`Failed to fetch evidence: ${evidenceErr.message}`);

  // Fetch controls for titles
  const { data: controls, error: controlsErr } = await supabase
    .from('controls')
    .select('control_id, title, family');

  if (controlsErr) throw new Error(`Failed to fetch controls: ${controlsErr.message}`);

  const controlMap = new Map(
    ((controls ?? []) as Array<{ control_id: string; title: string; family: string }>).map(
      (c) => [c.control_id, c]
    )
  );

  const rows = ((evidence ?? []) as Array<{
    control_id: string;
    document_name: string;
    evidence_type: string;
    created_at: string;
  }>).map((ev) => {
    const ctrl = controlMap.get(ev.control_id);
    return {
      control_id: ev.control_id,
      control_title: ctrl?.title ?? 'Unknown',
      family_id: ctrl?.family ?? '',
      document_name: ev.document_name,
      evidence_type: ev.evidence_type,
      uploaded_at: ev.created_at.split('T')[0],
    };
  });

  if (format === 'csv') {
    const csv = generateEvidenceMatrixCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Evidence-Matrix-${companyName.replace(/\s+/g, '-')}-${dateStamp()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const doc = generateEvidenceMatrixPdf(rows, {
      companyName,
      assessmentDate: dateStamp(),
    });
    doc.save(
      `Evidence-Matrix-${companyName.replace(/\s+/g, '-')}-${dateStamp()}.pdf`
    );
  }
}
