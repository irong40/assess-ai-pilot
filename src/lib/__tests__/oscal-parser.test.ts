import { describe, it, expect } from 'vitest';
import { parseOscalCatalog } from '../oscal-parser';
import type { OscalCatalog, ControlRow } from '@/types/controls';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal OSCAL catalog with 3 controls across 2 families for testing */
const MINI_CATALOG: OscalCatalog = {
  uuid: 'test-uuid-001',
  metadata: {
    title: 'NIST SP 800-171 Rev 2 (test subset)',
    version: '2.0.0',
  },
  groups: [
    {
      id: '3.1',
      class: 'family',
      title: 'Access Control',
      controls: [
        {
          id: '3.1.1',
          class: 'SP800-171',
          title: 'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).',
          props: [
            { name: 'label', value: '3.1.1' },
            { name: 'sort-id', value: '3.1.1' },
          ],
          parts: [
            {
              id: '3.1.1_smt',
              name: 'statement',
              prose: 'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).',
            },
            {
              id: '3.1.1_obj',
              name: 'assessment-objective',
              parts: [
                { id: '3.1.1_obj.a', name: 'assessment-objective', prose: 'authorized users are identified.' },
                { id: '3.1.1_obj.b', name: 'assessment-objective', prose: 'processes acting on behalf of authorized users are identified.' },
                { id: '3.1.1_obj.c', name: 'assessment-objective', prose: 'devices (and other systems) authorized to connect to the system are identified.' },
              ],
            },
          ],
        },
        {
          id: '3.1.3',
          class: 'SP800-171',
          title: 'Control the flow of CUI in accordance with approved authorizations.',
          parts: [
            {
              id: '3.1.3_smt',
              name: 'statement',
              prose: 'Control the flow of CUI in accordance with approved authorizations.',
            },
            {
              id: '3.1.3_obj',
              name: 'assessment-objective',
              parts: [
                { id: '3.1.3_obj.a', name: 'assessment-objective', prose: 'information flow control policies are defined.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: '3.13',
      class: 'family',
      title: 'System and Communications Protection',
      controls: [
        {
          id: '3.13.1',
          class: 'SP800-171',
          title: 'Monitor, control, and protect communications at the external boundaries and key internal boundaries of organizational systems.',
          parts: [
            {
              id: '3.13.1_smt',
              name: 'statement',
              prose: 'Monitor, control, and protect communications at the external boundaries and key internal boundaries of organizational systems.',
            },
            {
              id: '3.13.1_obj',
              name: 'assessment-objective',
              parts: [
                { id: '3.13.1_obj.a', name: 'assessment-objective', prose: 'communications at external boundaries are monitored.' },
                { id: '3.13.1_obj.b', name: 'assessment-objective', prose: 'communications at key internal boundaries are monitored.' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const TEST_WEIGHTS: Record<string, number> = {
  '3.1.1': 5, // Level 1 control -> weight 5
  '3.1.3': 1, // Level 2 control -> weight 1
  '3.13.1': 5, // Level 1 control -> weight 5
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseOscalCatalog', () => {
  let results: ControlRow[];

  beforeAll(() => {
    results = parseOscalCatalog(MINI_CATALOG, TEST_WEIGHTS);
  });

  it('returns the correct number of ControlRow objects', () => {
    expect(results).toHaveLength(3);
  });

  it('extracts control_id from the OSCAL control id field', () => {
    const ids = results.map((r) => r.control_id).sort();
    expect(ids).toEqual(['3.1.1', '3.1.3', '3.13.1']);
  });

  it('extracts family_id from the parent group id', () => {
    const ctrl311 = results.find((r) => r.control_id === '3.1.1')!;
    expect(ctrl311.family_id).toBe('3.1');

    const ctrl3131 = results.find((r) => r.control_id === '3.13.1')!;
    expect(ctrl3131.family_id).toBe('3.13');
  });

  it('extracts family_name from the parent group title', () => {
    const ctrl311 = results.find((r) => r.control_id === '3.1.1')!;
    expect(ctrl311.family_name).toBe('Access Control');

    const ctrl3131 = results.find((r) => r.control_id === '3.13.1')!;
    expect(ctrl3131.family_name).toBe('System and Communications Protection');
  });

  it('extracts the control title', () => {
    const ctrl311 = results.find((r) => r.control_id === '3.1.1')!;
    expect(ctrl311.title).toContain('Limit system access');
  });

  it('extracts description from statement prose', () => {
    const ctrl311 = results.find((r) => r.control_id === '3.1.1')!;
    expect(ctrl311.description).toContain('Limit system access to authorized users');
  });

  it('extracts assessment_objectives from nested parts', () => {
    const ctrl311 = results.find((r) => r.control_id === '3.1.1')!;
    expect(ctrl311.assessment_objectives).toHaveLength(3);
    expect(ctrl311.assessment_objectives[0]).toBe('authorized users are identified.');
    expect(ctrl311.assessment_objectives[1]).toContain('processes acting on behalf');
    expect(ctrl311.assessment_objectives[2]).toContain('devices');
  });

  it('tags CMMC Level 1 controls correctly', () => {
    // 3.1.1 and 3.13.1 are in the CMMC_LEVEL_1_CONTROLS list
    const ctrl311 = results.find((r) => r.control_id === '3.1.1')!;
    expect(ctrl311.cmmc_level).toBe(1);

    const ctrl3131 = results.find((r) => r.control_id === '3.13.1')!;
    expect(ctrl3131.cmmc_level).toBe(1);
  });

  it('tags non-Level-1 controls as Level 2', () => {
    // 3.1.3 is NOT a Level 1 control
    const ctrl313 = results.find((r) => r.control_id === '3.1.3')!;
    expect(ctrl313.cmmc_level).toBe(2);
  });

  it('assigns sprs_weight from the weights lookup', () => {
    const ctrl311 = results.find((r) => r.control_id === '3.1.1')!;
    expect(ctrl311.sprs_weight).toBe(5);

    const ctrl313 = results.find((r) => r.control_id === '3.1.3')!;
    expect(ctrl313.sprs_weight).toBe(1);
  });

  it('defaults sprs_weight to 1 when control is not in weights lookup', () => {
    const unknownWeights: Record<string, number> = {}; // empty
    const result = parseOscalCatalog(MINI_CATALOG, unknownWeights);
    result.forEach((r) => {
      expect(r.sprs_weight).toBe(1);
    });
  });

  it('sets framework and framework_version correctly', () => {
    results.forEach((r) => {
      expect(r.framework).toBe('NIST-800-171');
      expect(r.framework_version).toBe('r2');
    });
  });

  it('initializes nist_800_53_mapping as empty array', () => {
    results.forEach((r) => {
      expect(r.nist_800_53_mapping).toEqual([]);
    });
  });

  it('spans exactly 2 families in the test fixture', () => {
    const familyIds = new Set(results.map((r) => r.family_id));
    expect(familyIds.size).toBe(2);
  });

  describe('graceful handling of missing parts', () => {
    it('returns empty description when statement part is missing', () => {
      const catalogMissingStatement: OscalCatalog = {
        uuid: 'test-uuid-002',
        metadata: { title: 'Test' },
        groups: [
          {
            id: '3.1',
            title: 'Access Control',
            controls: [
              {
                id: '3.1.1',
                title: 'Test control',
                parts: [
                  // No statement part
                  {
                    id: '3.1.1_obj',
                    name: 'assessment-objective',
                    parts: [{ id: '3.1.1_obj.a', name: 'assessment-objective', prose: 'objective A' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = parseOscalCatalog(catalogMissingStatement, {});
      expect(result[0].description).toBe('');
    });

    it('returns empty assessment_objectives when objective part is missing', () => {
      const catalogMissingObj: OscalCatalog = {
        uuid: 'test-uuid-003',
        metadata: { title: 'Test' },
        groups: [
          {
            id: '3.1',
            title: 'Access Control',
            controls: [
              {
                id: '3.1.1',
                title: 'Test control',
                parts: [
                  { id: '3.1.1_smt', name: 'statement', prose: 'Some statement' },
                  // No assessment-objective part
                ],
              },
            ],
          },
        ],
      };
      const result = parseOscalCatalog(catalogMissingObj, {});
      expect(result[0].assessment_objectives).toEqual([]);
    });

    it('handles controls with no parts at all', () => {
      const catalogNoParts: OscalCatalog = {
        uuid: 'test-uuid-004',
        metadata: { title: 'Test' },
        groups: [
          {
            id: '3.1',
            title: 'Access Control',
            controls: [
              {
                id: '3.1.1',
                title: 'Test control',
                // No parts
              },
            ],
          },
        ],
      };
      const result = parseOscalCatalog(catalogNoParts, {});
      expect(result[0].description).toBe('');
      expect(result[0].assessment_objectives).toEqual([]);
    });
  });
});
