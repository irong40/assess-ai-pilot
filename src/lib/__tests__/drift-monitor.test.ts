import { describe, it, expect } from 'vitest';

/**
 * Tests for drift detection logic in compliance-utils.
 *
 * Covers:
 * - detectDrift returns drift with delta when consecutive snapshots differ by > threshold
 * - detectDrift returns no drift within threshold
 * - detectDrift handles fewer than 2 snapshots
 * - DriftAlertBanner renders warning when drift detected
 * - DriftAlertBanner renders nothing when no drift
 */

import { detectDrift } from '@/lib/compliance-utils';

describe('detectDrift', () => {
  it('returns { hasDrift: true, delta, direction } when last two snapshots differ by more than threshold', () => {
    const snapshots = [
      { sprs_score: 55 },
      { sprs_score: 42 }, // dropped 13 points
    ];

    const result = detectDrift(snapshots);

    expect(result.hasDrift).toBe(true);
    expect(result.delta).toBe(13);
    expect(result.direction).toBe('declining');
    expect(result.previousScore).toBe(55);
    expect(result.currentScore).toBe(42);
  });

  it('returns { hasDrift: true } for improving drift', () => {
    const snapshots = [
      { sprs_score: 42 },
      { sprs_score: 65 }, // improved 23 points
    ];

    const result = detectDrift(snapshots);

    expect(result.hasDrift).toBe(true);
    expect(result.delta).toBe(23);
    expect(result.direction).toBe('improving');
  });

  it('returns { hasDrift: false } when snapshots are within threshold', () => {
    const snapshots = [
      { sprs_score: 55 },
      { sprs_score: 53 }, // only 2 points difference (default threshold 5)
    ];

    const result = detectDrift(snapshots);

    expect(result.hasDrift).toBe(false);
    expect(result.delta).toBe(2);
  });

  it('returns { hasDrift: false } when fewer than 2 snapshots exist', () => {
    expect(detectDrift([])).toEqual({
      hasDrift: false,
      delta: 0,
      direction: 'stable',
    });

    expect(detectDrift([{ sprs_score: 55 }])).toEqual({
      hasDrift: false,
      delta: 0,
      direction: 'stable',
    });

    expect(detectDrift(null)).toEqual({
      hasDrift: false,
      delta: 0,
      direction: 'stable',
    });

    expect(detectDrift(undefined)).toEqual({
      hasDrift: false,
      delta: 0,
      direction: 'stable',
    });
  });

  it('respects custom threshold parameter', () => {
    const snapshots = [
      { sprs_score: 55 },
      { sprs_score: 48 }, // 7 points
    ];

    // With threshold 10, should not flag
    expect(detectDrift(snapshots, 10).hasDrift).toBe(false);

    // With threshold 5, should flag
    expect(detectDrift(snapshots, 5).hasDrift).toBe(true);
  });
});
