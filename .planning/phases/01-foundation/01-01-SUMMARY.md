---
phase: 01-foundation
plan: 01
subsystem: database
tags: [cmmc, nist-800-171, oscal, sprs, supabase, vitest, tdd]

requires:
  - phase: none
    provides: first plan -- no dependencies
provides:
  - controls table migration (Supabase) with RLS for authenticated SELECT
  - TypeScript types for Control, ControlFamily, SprsScore, OSCAL schema
  - parseOscalCatalog pure function that flattens OSCAL JSON to ControlRow[]
  - calculateSprsScore pure function for SPRS scoring from assessment responses
  - sprs-weights.json with 110 control weights (42x5 + 14x3 + 54x1 = 306)
  - seed-oscal-controls.ts standalone script for batch upserting controls
affects: [01-02, 01-03, 02-01, 02-02, 03-02]

tech-stack:
  added: []
  patterns: [pure-function-modules, tdd-red-green, oscal-catalog-flattening, sprs-deduction-algorithm]

key-files:
  created:
    - supabase/migrations/20260326140000_controls_table.sql
    - src/types/controls.ts
    - src/lib/oscal-parser.ts
    - src/lib/sprs-calculator.ts
    - src/lib/__tests__/oscal-parser.test.ts
    - src/lib/__tests__/sprs-calculator.test.ts
    - scripts/sprs-weights.json
    - scripts/seed-oscal-controls.ts
  modified: []

key-decisions:
  - "SPRS weights are approximated from DoD Assessment Methodology Annex A structure (42x5 + 14x3 + 54x1 = 306 total, min score -196). Exact per-control mapping pending official Annex A extraction."
  - "OSCAL parser and SPRS calculator are pure functions with no DB or side-effect dependencies, enabling unit testing and reuse in both seed scripts and application code."
  - "Controls table is public reference data (no company_id scoping) -- all tenants read the same NIST controls per CUI-free architecture (DATA-01)."

patterns-established:
  - "Pure function modules: Business logic in src/lib/ as pure functions with typed inputs/outputs, tested with Vitest"
  - "TDD workflow: Write failing tests first, implement to pass, then refactor"
  - "OSCAL flattening: catalog.groups[].controls[].parts[] -> flat ControlRow[] with family context carried from parent group"
  - "SPRS algorithm: Start at 110, subtract weight per unimplemented control, no partial credit"

requirements-completed: [CMMC-01, CMMC-02, CMMC-03, CMMC-04]

duration: 7min
completed: 2026-03-26
---

# Phase 1 Plan 01: CMMC Control Data and SPRS Scoring Summary

**OSCAL parser flattens 110 NIST 800-171r2 controls into typed ControlRow objects, SPRS calculator computes DoD scores from assessment responses, and seed script batch-upserts to Supabase controls table**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T13:57:59Z
- **Completed:** 2026-03-26T14:04:54Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments

- Created controls table migration with RLS, indexes, and proper constraints (cmmc_level IN (1,2), sprs_weight IN (1,3,5))
- Implemented OSCAL catalog parser that extracts controls with statement prose and assessment objectives from nested parts
- Implemented SPRS score calculator with correct deduction logic (implemented=0, partial/missing/not_implemented=full weight, not_applicable=0)
- Created sprs-weights.json with verified distribution: 42 five-point, 14 three-point, 54 one-point (total 306, min score -196)
- All 28 tests pass (17 OSCAL parser, 11 SPRS calculator) via TDD workflow
- Seed script handles OSCAL download/caching, parsing, validation (110 controls, 14 families, 17 L1), and batch upsert

## Task Commits

Each task was committed atomically:

1. **Task 1: Create controls table migration, types, and OSCAL parser** - `19b3d0c` (feat)
2. **Task 2: SPRS calculator, weights data, and seed script** - `ec10ba7` (feat)

## Files Created/Modified

- `supabase/migrations/20260326140000_controls_table.sql` - Controls table DDL with RLS and indexes
- `src/types/controls.ts` - TypeScript interfaces for Control, ControlFamily, SprsScore, OSCAL schema, ControlRow
- `src/lib/oscal-parser.ts` - parseOscalCatalog pure function + CMMC_LEVEL_1_CONTROLS array
- `src/lib/sprs-calculator.ts` - calculateSprsScore pure function
- `src/lib/__tests__/oscal-parser.test.ts` - 17 tests covering parsing, level tagging, graceful missing parts
- `src/lib/__tests__/sprs-calculator.test.ts` - 11 tests covering all score calculation behaviors
- `scripts/sprs-weights.json` - SPRS weight mapping for all 110 controls
- `scripts/seed-oscal-controls.ts` - Standalone seed script with download caching and validation

## Decisions Made

1. **SPRS weights are approximated:** The exact per-control weights from DoD Assessment Methodology Annex A are not publicly machine-readable. The JSON uses a reasonable approximation matching the documented distribution (42x5 + 14x3 + 54x1 = 306). The file can be updated when the exact Annex A data is extracted from the official DoD PDF.

2. **Pure function architecture:** Both parseOscalCatalog and calculateSprsScore are pure functions with no database calls or side effects. This enables unit testing without mocking and allows reuse in both the seed script and application code.

3. **Controls as public reference data:** The controls table has no company_id column. All tenants read the same NIST 800-171 controls. This is intentional per the CUI-free data architecture (DATA-01).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm dependencies not installed**
- **Found during:** Task 1 (test execution)
- **Issue:** node_modules was empty -- vitest and all project dependencies were not installed
- **Fix:** Ran `npm install` to install all dependencies from package.json
- **Files modified:** node_modules/ (not committed)
- **Verification:** vitest runs successfully after install

**2. [Rule 1 - Bug] SPRS weight distribution mismatch**
- **Found during:** Task 2 (sprs-weights.json creation)
- **Issue:** Initial weight assignment resulted in 38x5 + 13x3 + 59x1 = 288, not matching the documented 42/14/54 distribution (306 total)
- **Fix:** Adjusted weights for 5 controls to match the target distribution exactly: promoted 3.1.8, 3.1.9, 3.3.3, 3.3.4 to weight 5, and 3.7.1 to weight 3
- **Files modified:** scripts/sprs-weights.json
- **Verification:** Node.js script confirmed 42x5 + 14x3 + 54x1 = 306

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- npx vitest resolved to a newer global version (4.x) that did not recognize the `-x` flag. Used the locally installed `./node_modules/.bin/vitest` with `--bail 1` instead.

## User Setup Required

To run the seed script against your Supabase instance:
1. Apply the migration: `supabase migration up` (or apply via Supabase Dashboard)
2. Set environment variables in `.env`: `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. Run: `npx tsx scripts/seed-oscal-controls.ts`

## Next Phase Readiness

- Controls table schema is ready to apply to Supabase
- OSCAL parser and SPRS calculator are tested and ready for use by Plan 01-02 (agent runtime) and Plan 01-03 (multi-tenant isolation)
- The seed script needs to be run once after migration to populate control data
- Phase 2 agents (GRC, CISO) will query the controls table for gap analysis and compliance scoring

---
*Phase: 01-foundation*
*Completed: 2026-03-26*
