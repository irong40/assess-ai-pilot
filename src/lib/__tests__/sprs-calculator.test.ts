import { describe, it, expect } from 'vitest';
import { calculateSprsScore } from '../sprs-calculator';
import type { AssessmentResponse } from '@/types/controls';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

/** Small control set with known weights for precise math verification */
const TEST_CONTROLS = [
  { control_id: '3.1.1', sprs_weight: 5 },
  { control_id: '3.1.2', sprs_weight: 5 },
  { control_id: '3.2.1', sprs_weight: 5 },
  { control_id: '3.4.5', sprs_weight: 3 },
  { control_id: '3.4.6', sprs_weight: 3 },
  { control_id: '3.5.4', sprs_weight: 1 },
  { control_id: '3.5.5', sprs_weight: 1 },
  { control_id: '3.5.6', sprs_weight: 1 },
  { control_id: '3.6.3', sprs_weight: 1 },
  { control_id: '3.7.3', sprs_weight: 1 },
];
// Total weight: 3*5 + 2*3 + 5*1 = 15 + 6 + 5 = 26

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateSprsScore', () => {
  it('returns 110 when all controls are implemented', () => {
    const responses: AssessmentResponse[] = TEST_CONTROLS.map((c) => ({
      control_id: c.control_id,
      status: 'implemented' as const,
    }));

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    expect(result.score).toBe(110);
    expect(result.maxScore).toBe(110);
    expect(result.deductions).toHaveLength(0);
    expect(result.implemented_count).toBe(10);
    expect(result.total_count).toBe(10);
  });

  it('returns correct negative score when no controls are implemented', () => {
    const responses: AssessmentResponse[] = TEST_CONTROLS.map((c) => ({
      control_id: c.control_id,
      status: 'not_implemented' as const,
    }));

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    // 110 - 26 = 84
    expect(result.score).toBe(84);
    expect(result.deductions).toHaveLength(10);
    expect(result.implemented_count).toBe(0);
    expect(result.total_count).toBe(10);
  });

  it('deducts the correct weight (5) for a 5-point unimplemented control', () => {
    const responses: AssessmentResponse[] = TEST_CONTROLS.map((c) => ({
      control_id: c.control_id,
      status: c.control_id === '3.1.1' ? ('not_implemented' as const) : ('implemented' as const),
    }));

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    expect(result.score).toBe(105); // 110 - 5
    expect(result.deductions).toHaveLength(1);
    expect(result.deductions[0]).toEqual({ control_id: '3.1.1', weight: 5 });
  });

  it('deducts the correct weight (3) for a 3-point unimplemented control', () => {
    const responses: AssessmentResponse[] = TEST_CONTROLS.map((c) => ({
      control_id: c.control_id,
      status: c.control_id === '3.4.5' ? ('not_implemented' as const) : ('implemented' as const),
    }));

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    expect(result.score).toBe(107); // 110 - 3
    expect(result.deductions).toHaveLength(1);
    expect(result.deductions[0]).toEqual({ control_id: '3.4.5', weight: 3 });
  });

  it('deducts the correct weight (1) for a 1-point unimplemented control', () => {
    const responses: AssessmentResponse[] = TEST_CONTROLS.map((c) => ({
      control_id: c.control_id,
      status: c.control_id === '3.5.4' ? ('not_implemented' as const) : ('implemented' as const),
    }));

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    expect(result.score).toBe(109); // 110 - 1
    expect(result.deductions).toHaveLength(1);
    expect(result.deductions[0]).toEqual({ control_id: '3.5.4', weight: 1 });
  });

  it('treats partially_implemented as NOT implemented (full deduction)', () => {
    const responses: AssessmentResponse[] = TEST_CONTROLS.map((c) => ({
      control_id: c.control_id,
      status: c.control_id === '3.1.1' ? ('partially_implemented' as const) : ('implemented' as const),
    }));

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    expect(result.score).toBe(105); // 110 - 5 (full deduction for partial)
    expect(result.deductions).toHaveLength(1);
    expect(result.deductions[0]).toEqual({ control_id: '3.1.1', weight: 5 });
  });

  it('treats missing responses as NOT implemented', () => {
    // Only provide responses for half the controls
    const responses: AssessmentResponse[] = TEST_CONTROLS.slice(0, 5).map((c) => ({
      control_id: c.control_id,
      status: 'implemented' as const,
    }));
    // 5 controls have no response: 3.5.4(1) + 3.5.5(1) + 3.5.6(1) + 3.6.3(1) + 3.7.3(1) = 5

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    expect(result.score).toBe(105); // 110 - 5
    expect(result.deductions).toHaveLength(5);
    expect(result.implemented_count).toBe(5);
  });

  it('treats not_applicable as zero deduction', () => {
    const responses: AssessmentResponse[] = TEST_CONTROLS.map((c) => ({
      control_id: c.control_id,
      status: c.control_id === '3.1.1' ? ('not_applicable' as const) : ('implemented' as const),
    }));

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    expect(result.score).toBe(110); // No deduction for N/A
    expect(result.deductions).toHaveLength(0);
  });

  it('handles multiple mixed statuses correctly', () => {
    const responses: AssessmentResponse[] = [
      { control_id: '3.1.1', status: 'implemented' },
      { control_id: '3.1.2', status: 'not_implemented' },       // -5
      { control_id: '3.2.1', status: 'partially_implemented' }, // -5
      { control_id: '3.4.5', status: 'not_applicable' },        // 0
      { control_id: '3.4.6', status: 'implemented' },
      { control_id: '3.5.4', status: 'not_implemented' },       // -1
      { control_id: '3.5.5', status: 'implemented' },
      { control_id: '3.5.6', status: 'implemented' },
      // 3.6.3 missing                                           // -1
      // 3.7.3 missing                                           // -1
    ];

    const result = calculateSprsScore(TEST_CONTROLS, responses);

    // 110 - 5 - 5 - 1 - 1 - 1 = 97
    expect(result.score).toBe(97);
    expect(result.deductions).toHaveLength(5);
    expect(result.implemented_count).toBe(4); // 3.1.1, 3.4.6, 3.5.5, 3.5.6
    expect(result.total_count).toBe(10);
  });

  it('handles empty controls array', () => {
    const result = calculateSprsScore([], []);
    expect(result.score).toBe(110);
    expect(result.deductions).toHaveLength(0);
    expect(result.implemented_count).toBe(0);
    expect(result.total_count).toBe(0);
  });

  it('returns correct score range validation with full 110-control set', () => {
    // Simulate worst case: 42 five-point, 14 three-point, 54 one-point controls
    const fullControls: { control_id: string; sprs_weight: number }[] = [];
    for (let i = 0; i < 42; i++) fullControls.push({ control_id: `5pt-${i}`, sprs_weight: 5 });
    for (let i = 0; i < 14; i++) fullControls.push({ control_id: `3pt-${i}`, sprs_weight: 3 });
    for (let i = 0; i < 54; i++) fullControls.push({ control_id: `1pt-${i}`, sprs_weight: 1 });
    // Total: 110 controls, total weight: 210 + 42 + 54 = 306

    // All unimplemented
    const responses: AssessmentResponse[] = fullControls.map((c) => ({
      control_id: c.control_id,
      status: 'not_implemented' as const,
    }));

    const result = calculateSprsScore(fullControls, responses);

    // 110 - 306 = -196
    expect(result.score).toBe(-196);
    expect(result.score).toBeGreaterThanOrEqual(-203); // Within valid SPRS range
    expect(result.total_count).toBe(110);
  });
});
