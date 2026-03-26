/**
 * SPRS Score Calculator
 *
 * Calculates the Supplier Performance Risk System (SPRS) score based on
 * the DoD NIST SP 800-171 Assessment Methodology v1.2.1.
 *
 * Algorithm:
 * - Start at 110 (perfect score)
 * - For each control that is NOT implemented: subtract its sprs_weight (1, 3, or 5)
 * - Partially implemented = full deduction (no partial credit)
 * - Missing responses = treated as not implemented
 * - Not applicable = zero deduction
 * - Score range: -203 to +110
 *
 * This is a pure function with no side effects or database calls.
 * Weights are passed in as data, not read from any external source.
 */

import type { SprsScore, SprsDeduction, AssessmentResponse } from '@/types/controls';

/** Starting/maximum score per DoD Assessment Methodology */
const MAX_SCORE = 110 as const;

/**
 * Calculate SPRS score from control weights and assessment responses.
 *
 * @param controls - Array of controls with their SPRS weight values
 * @param responses - Array of assessment responses for those controls
 * @returns SprsScore object with score, deductions, and counts
 */
export function calculateSprsScore(
  controls: { control_id: string; sprs_weight: number }[],
  responses: AssessmentResponse[]
): SprsScore {
  // Build a lookup map for O(1) response access
  const responseMap = new Map<string, AssessmentResponse>();
  for (const response of responses) {
    responseMap.set(response.control_id, response);
  }

  const deductions: SprsDeduction[] = [];
  let implementedCount = 0;

  for (const control of controls) {
    const response = responseMap.get(control.control_id);
    const status = response?.status;

    if (status === 'implemented' || status === 'not_applicable') {
      // No deduction for implemented or N/A controls
      if (status === 'implemented') {
        implementedCount++;
      }
    } else {
      // Missing, not_implemented, or partially_implemented = full deduction
      deductions.push({
        control_id: control.control_id,
        weight: control.sprs_weight as 1 | 3 | 5,
      });
    }
  }

  const totalDeduction = deductions.reduce((sum, d) => sum + d.weight, 0);

  return {
    score: MAX_SCORE - totalDeduction,
    maxScore: MAX_SCORE,
    deductions,
    implemented_count: implementedCount,
    total_count: controls.length,
  };
}
