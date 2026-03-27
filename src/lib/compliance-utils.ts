/**
 * Compliance utility functions for the Compliance Dashboard.
 *
 * Provides:
 * - NIST_FAMILIES: 14 NIST 800-171 control family constants
 * - familyScoresToChartData: transforms family_scores JSONB to chart-ready array
 * - getPostureLabel / getPostureColor: SPRS score to human-readable posture
 * - getLatestSnapshot: extracts most recent snapshot from ordered array
 * - detectDrift: compares consecutive snapshots for compliance drift
 */

import type { ComplianceSnapshot } from '@/types/grc-output';

/** The 14 NIST 800-171 control families */
export const NIST_FAMILIES = [
  { id: '3.1', name: 'Access Control' },
  { id: '3.2', name: 'Awareness & Training' },
  { id: '3.3', name: 'Audit & Accountability' },
  { id: '3.4', name: 'Configuration Management' },
  { id: '3.5', name: 'Identification & Authentication' },
  { id: '3.6', name: 'Incident Response' },
  { id: '3.7', name: 'Maintenance' },
  { id: '3.8', name: 'Media Protection' },
  { id: '3.9', name: 'Personnel Security' },
  { id: '3.10', name: 'Physical Protection' },
  { id: '3.11', name: 'Risk Assessment' },
  { id: '3.12', name: 'Security Assessment' },
  { id: '3.13', name: 'System & Communications Protection' },
  { id: '3.14', name: 'System & Information Integrity' },
] as const;

export interface FamilyChartDatum {
  family: string;
  familyId: string;
  score: number;
}

/**
 * Transforms family_scores JSONB into a chart-ready array for all 14 families.
 * Missing families default to 0.
 */
export function familyScoresToChartData(
  familyScores: Record<string, number> | null | undefined
): FamilyChartDatum[] {
  const scores = familyScores ?? {};
  return NIST_FAMILIES.map((f) => ({
    family: f.name,
    familyId: f.id,
    score: scores[f.id] ?? 0,
  }));
}

/**
 * Returns a human-readable posture label based on SPRS score.
 *
 * - Critical: score < 0
 * - At Risk: 0-50
 * - Progressing: 51-80
 * - Compliant: 81+
 */
export function getPostureLabel(sprsScore: number): string {
  if (sprsScore < 0) return 'Critical';
  if (sprsScore <= 50) return 'At Risk';
  if (sprsScore <= 80) return 'Progressing';
  return 'Compliant';
}

/**
 * Returns a Tailwind color class for the posture level.
 */
export function getPostureColor(sprsScore: number): string {
  if (sprsScore < 0) return 'text-red-600';
  if (sprsScore <= 50) return 'text-orange-500';
  if (sprsScore <= 80) return 'text-yellow-500';
  return 'text-green-600';
}

/**
 * Returns the badge variant for posture.
 */
export function getPostureBadgeVariant(
  sprsScore: number
): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (sprsScore < 0) return 'destructive';
  if (sprsScore <= 50) return 'destructive';
  if (sprsScore <= 80) return 'default';
  return 'secondary';
}

/**
 * Returns the most recent snapshot from an ascending-ordered array,
 * or null if the array is empty/undefined.
 */
export function getLatestSnapshot<
  T extends Pick<ComplianceSnapshot, 'sprs_score'>
>(snapshots: T[] | null | undefined): T | null {
  if (!snapshots || snapshots.length === 0) return null;
  return snapshots[snapshots.length - 1];
}

export interface DriftResult {
  hasDrift: boolean;
  delta: number;
  direction: 'improving' | 'declining' | 'stable';
  previousScore?: number;
  currentScore?: number;
}

/**
 * Detects compliance drift by comparing the last two snapshots' SPRS scores.
 *
 * @param snapshots - Array of snapshots ordered by created_at ascending
 * @param threshold - Minimum point change to trigger drift (default: 5)
 */
export function detectDrift(
  snapshots: Array<{ sprs_score: number }> | null | undefined,
  threshold = 5
): DriftResult {
  if (!snapshots || snapshots.length < 2) {
    return { hasDrift: false, delta: 0, direction: 'stable' };
  }

  const previous = snapshots[snapshots.length - 2];
  const current = snapshots[snapshots.length - 1];
  const delta = current.sprs_score - previous.sprs_score;
  const absDelta = Math.abs(delta);

  if (absDelta < threshold) {
    return {
      hasDrift: false,
      delta: absDelta,
      direction: delta > 0 ? 'improving' : delta < 0 ? 'declining' : 'stable',
      previousScore: previous.sprs_score,
      currentScore: current.sprs_score,
    };
  }

  return {
    hasDrift: true,
    delta: absDelta,
    direction: delta > 0 ? 'improving' : 'declining',
    previousScore: previous.sprs_score,
    currentScore: current.sprs_score,
  };
}
