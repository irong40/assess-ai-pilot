/**
 * TypeScript types for CMMC controls, OSCAL catalog parsing, and SPRS scoring.
 *
 * These types represent the NIST 800-171 Rev 2 controls as used by CMMC Level 1/2
 * assessments and the DoD SPRS scoring methodology.
 */

// ---------------------------------------------------------------------------
// Database / Domain Types
// ---------------------------------------------------------------------------

/** A single CMMC control mapped from NIST 800-171 Rev 2 */
export interface Control {
  id: string; // UUID
  control_id: string; // e.g. "3.1.1"
  family_id: string; // e.g. "3.1"
  family_name: string; // e.g. "Access Control"
  title: string;
  description: string;
  assessment_objectives: string[];
  cmmc_level: 1 | 2;
  sprs_weight: 1 | 3 | 5;
  nist_800_53_mapping: string[];
  framework: string; // "NIST-800-171"
  framework_version: string; // "r2"
  created_at: string;
  updated_at: string;
}

/** A NIST 800-171 control family (group) */
export interface ControlFamily {
  id: string; // e.g. "3.1"
  name: string; // e.g. "Access Control"
  control_count: number;
}

/** SPRS score calculation result */
export interface SprsScore {
  score: number; // -203 to +110
  maxScore: 110;
  deductions: SprsDeduction[];
  implemented_count: number;
  total_count: number;
}

export interface SprsDeduction {
  control_id: string;
  weight: 1 | 3 | 5;
}

// ---------------------------------------------------------------------------
// Assessment Response Types
// ---------------------------------------------------------------------------

export type ImplementationStatus =
  | 'implemented'
  | 'not_implemented'
  | 'partially_implemented'
  | 'not_applicable';

export interface AssessmentResponse {
  control_id: string;
  status: ImplementationStatus;
}

// ---------------------------------------------------------------------------
// OSCAL JSON Catalog Types (NIST SP 800-171 Rev 2 format)
// ---------------------------------------------------------------------------

/** Top-level OSCAL catalog document */
export interface OscalDocument {
  catalog: OscalCatalog;
}

export interface OscalCatalog {
  uuid: string;
  metadata: OscalMetadata;
  groups: OscalGroup[];
}

export interface OscalMetadata {
  title: string;
  'last-modified'?: string;
  version?: string;
  'oscal-version'?: string;
}

/** A control family (group) in the OSCAL catalog */
export interface OscalGroup {
  id: string; // e.g. "3.1"
  class?: string; // "family"
  title: string; // e.g. "Access Control"
  controls: OscalControl[];
}

/** A single control in the OSCAL catalog */
export interface OscalControl {
  id: string; // e.g. "3.1.1"
  class?: string; // "SP800-171"
  title: string;
  props?: OscalProp[];
  parts?: OscalPart[];
}

export interface OscalProp {
  name: string;
  value: string;
}

/** A part within a control (statement, assessment-objective, etc.) */
export interface OscalPart {
  id?: string;
  name: string;
  prose?: string;
  parts?: OscalPart[]; // Nested parts (e.g. assessment objectives)
}

// ---------------------------------------------------------------------------
// Flat row type used by the OSCAL parser output and seed script
// ---------------------------------------------------------------------------

/** Flattened control row ready for database insertion */
export interface ControlRow {
  control_id: string;
  family_id: string;
  family_name: string;
  title: string;
  description: string;
  assessment_objectives: string[];
  cmmc_level: 1 | 2;
  sprs_weight: number;
  nist_800_53_mapping: string[];
  framework: string;
  framework_version: string;
}
