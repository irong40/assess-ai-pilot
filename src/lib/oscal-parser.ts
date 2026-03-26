/**
 * OSCAL JSON Catalog Parser for NIST 800-171 Rev 2
 *
 * Parses the NIST OSCAL JSON catalog format and flattens the nested
 * catalog > groups > controls > parts hierarchy into ControlRow objects
 * suitable for database insertion.
 *
 * This is a pure function with no side effects.
 *
 * @see https://pages.nist.gov/OSCAL/
 */

import type { OscalCatalog, OscalControl, OscalPart, ControlRow } from '@/types/controls';

/**
 * The 17 CMMC Level 1 control IDs (Basic Security Requirements).
 * These map directly from NIST 800-171 Rev 2 to CMMC Level 1.
 *
 * Source: CMMC Model v2.0 Appendix A / NIST 800-171 Rev 2 "Basic" requirements
 */
export const CMMC_LEVEL_1_CONTROLS: ReadonlyArray<string> = [
  '3.1.1',
  '3.1.2',
  '3.1.20',
  '3.1.22',
  '3.2.1',
  '3.2.2',
  '3.3.1',
  '3.3.2',
  '3.4.1',
  '3.4.2',
  '3.5.1',
  '3.5.2',
  '3.8.3',
  '3.10.1',
  '3.13.1',
  '3.14.1',
  '3.14.2',
] as const;

/**
 * Parse an OSCAL JSON catalog into flat ControlRow objects.
 *
 * @param catalog - The OSCAL catalog object (catalog.groups[].controls[])
 * @param sprsWeights - Mapping of control_id to SPRS weight (1, 3, or 5). Missing keys default to 1.
 * @returns Array of ControlRow objects ready for database insertion
 */
export function parseOscalCatalog(
  catalog: OscalCatalog,
  sprsWeights: Record<string, number>
): ControlRow[] {
  const rows: ControlRow[] = [];
  const level1Set = new Set(CMMC_LEVEL_1_CONTROLS);

  for (const group of catalog.groups) {
    const familyId = group.id;
    const familyName = group.title;

    if (!group.controls) continue;

    for (const control of group.controls) {
      const row = flattenControl(control, familyId, familyName, level1Set, sprsWeights);
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Flatten a single OSCAL control into a ControlRow.
 */
function flattenControl(
  control: OscalControl,
  familyId: string,
  familyName: string,
  level1Set: Set<string>,
  sprsWeights: Record<string, number>
): ControlRow {
  const controlId = control.id;
  const description = extractStatementProse(control.parts);
  const assessmentObjectives = extractAssessmentObjectives(control.parts);
  const cmmcLevel: 1 | 2 = level1Set.has(controlId) ? 1 : 2;
  const sprsWeight = sprsWeights[controlId] ?? 1;

  return {
    control_id: controlId,
    family_id: familyId,
    family_name: familyName,
    title: control.title,
    description,
    assessment_objectives: assessmentObjectives,
    cmmc_level: cmmcLevel,
    sprs_weight: sprsWeight,
    nist_800_53_mapping: [],
    framework: 'NIST-800-171',
    framework_version: 'r2',
  };
}

/**
 * Extract the statement prose from control parts.
 * Looks for the part with name="statement" and returns its prose.
 */
function extractStatementProse(parts?: OscalPart[]): string {
  if (!parts) return '';

  const statementPart = parts.find((p) => p.name === 'statement');
  if (!statementPart) return '';

  return statementPart.prose ?? '';
}

/**
 * Extract assessment objectives from control parts.
 * Looks for the part with name="assessment-objective" and collects
 * prose from its nested child parts.
 */
function extractAssessmentObjectives(parts?: OscalPart[]): string[] {
  if (!parts) return [];

  const objectivePart = parts.find((p) => p.name === 'assessment-objective');
  if (!objectivePart) return [];

  // Objectives are stored in nested parts
  if (!objectivePart.parts) {
    // If the objective part itself has prose but no children, use it directly
    return objectivePart.prose ? [objectivePart.prose] : [];
  }

  return objectivePart.parts
    .filter((p) => p.prose)
    .map((p) => p.prose!);
}
