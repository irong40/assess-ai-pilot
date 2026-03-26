---
phase: 02-core-agents
plan: 01
subsystem: agents
tags: [grc, cmmc, nist-800-171, zod, edge-function, gap-analysis, compliance, ai-sdk]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: agent-base.ts (executeAgentTask, delegateTask), agent-types.ts, controls table, SPRS calculator, approval gates
provides:
  - GRC Analyst Edge Function with 6 domain-specific tools
  - Zod schemas for gap analysis reports, compliance snapshots, audit packages
  - Frontend TypeScript types for GRC output
  - gap_analysis_results and compliance_snapshots database tables
  - GRC system prompt encoding 7 NIST 800-171A methodology rules
affects: [02-02-ciso-orchestrator, 03-01-agent-dashboard, 03-02-compliance-dashboard, 03-03-evidence-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [Deno-to-vitest re-export pattern for testable Edge Function logic, file-level SQL migration structural testing]

key-files:
  created:
    - supabase/functions/_shared/grc-schemas.ts
    - supabase/functions/_shared/grc-tools.ts
    - supabase/functions/agent-grc-analyst/index.ts
    - src/types/grc-output.ts
    - src/lib/grc-schemas-frontend.ts
    - src/lib/grc-tools-testable.ts
    - supabase/migrations/20260327000001_gap_analysis_tables.sql
    - src/lib/__tests__/grc-schemas.test.ts
    - src/lib/__tests__/grc-agent.test.ts
    - src/lib/__tests__/compliance-tracking.test.ts
  modified: []

key-decisions:
  - "Deno-to-vitest re-export pattern: grc-tools-testable.ts and grc-schemas-frontend.ts mirror Deno modules with standard npm imports for vitest compatibility"
  - "Tool factory returns plain objects with description/parameters instead of AI SDK tool() calls in testable module -- avoids Deno npm: import issues in vitest"
  - "CREATE TABLE regex extraction uses [\\s\\S]+? instead of [^)]+ to handle nested parentheses in SQL (e.g., gen_random_uuid())"
  - "GRC Edge Function uses maxSteps: 10 (vs agent-test's 3) for compliance reasoning depth across 110 controls"

patterns-established:
  - "Deno-vitest bridge: for each Deno _shared module, create an src/lib/ mirror using standard npm imports for testing"
  - "Agent tool factory: createXxxTools(supabase, task) returns object of AI SDK tool definitions scoped by company_id"
  - "SQL migration structural testing: read migration file, extract CREATE TABLE block, verify columns/indexes/RLS with regex"
  - "Compliance result storage: every GRC analysis persists to gap_analysis_results AND creates a compliance_snapshot for time-series tracking"

requirements-completed: [GRC-01, GRC-02, GRC-03, GRC-04, GRC-05, CMMC-05]

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 2 Plan 01: GRC Analyst Agent Summary

**GRC Analyst Edge Function with 6 domain tools, 7-rule NIST 800-171A system prompt, Zod-validated gap analysis schemas, and compliance tracking tables**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T20:30:46Z
- **Completed:** 2026-03-26T20:39:01Z
- **Tasks:** 2
- **Files created:** 10

## Accomplishments
- GRC Analyst Edge Function operational at supabase/functions/agent-grc-analyst/index.ts following proven agent-test pattern with generateText + 10-step max
- 7 NIST 800-171A methodology rules encoded in GRC_SYSTEM_PROMPT: objective-level evaluation, finding classification, evidence categorization by method, SPRS scoring, POA&M constraints (80/110 minimum, critical controls not deferrable, 180-day deadline), SSP alignment to 14 control families, implementation specificity
- 6 domain-specific tools (queryControls, queryAssessmentResponses, queryFindings, calculateSprsScore, getControlFamily, getEvidenceStatus) all scoped by company_id
- Zod schemas: GapAnalysisReportSchema, FindingSchema, RemediationOptionSchema, ComplianceSnapshotSchema, AuditPackageSectionSchema with strict enum validation
- Database migration: gap_analysis_results and compliance_snapshots tables with RLS, company_id NOT NULL, time-series indexes, service_role INSERT policies
- 29 tests passing across 3 test files (schema validation, agent handler, structural migration)

## Task Commits

Each task was committed atomically:

1. **Task 1: GRC Zod schemas, frontend types, database migration, and schema validation tests**
   - `48371a9` (test: RED phase - failing tests for schemas and compliance tracking)
   - `1cf4d5b` (feat: GREEN phase - schemas, types, migration, 16 tests passing)
2. **Task 2: GRC Analyst system prompt, tools, Edge Function, and agent handler tests**
   - `2fa8d07` (test: RED phase - failing tests for agent handler)
   - `29ae8d0` (feat: GREEN phase - Edge Function, tools, prompt, 13 tests passing)

## Files Created/Modified
- `supabase/functions/_shared/grc-schemas.ts` - Zod schemas for GRC structured output (Deno context)
- `supabase/functions/_shared/grc-tools.ts` - System prompt, 6 tool definitions, prompt builder, result storage (Deno context)
- `supabase/functions/agent-grc-analyst/index.ts` - GRC Analyst Edge Function handler
- `supabase/migrations/20260327000001_gap_analysis_tables.sql` - gap_analysis_results and compliance_snapshots tables
- `src/types/grc-output.ts` - Frontend TypeScript types (no Zod dependency)
- `src/lib/grc-schemas-frontend.ts` - Vitest-compatible Zod schema re-exports
- `src/lib/grc-tools-testable.ts` - Vitest-compatible tool logic re-exports
- `src/lib/__tests__/grc-schemas.test.ts` - 9 schema validation tests
- `src/lib/__tests__/grc-agent.test.ts` - 13 agent handler tests
- `src/lib/__tests__/compliance-tracking.test.ts` - 7 structural migration tests

## Decisions Made
- **Deno-vitest bridge pattern:** Edge Function modules use Deno npm: specifiers that vitest cannot resolve. Created parallel src/lib/ modules with standard npm imports that mirror the Deno _shared/ modules. This is explicit rather than clever (no dynamic import hacking).
- **Tool factory shape for testing:** The testable module returns plain objects with `description` and `parameters` properties matching AI SDK tool shape, rather than calling `tool()` which requires Deno context. The Deno module uses actual `tool()` calls.
- **maxSteps: 10 for GRC:** Compliance reasoning across 110 controls needs more tool-calling rounds than the test agent's 3 steps. The research warned about Edge Function timeouts -- family-scoped analysis (delegated by CISO) keeps each invocation within bounds.
- **Compliance snapshot on every analysis:** storeGrcResult creates both a gap_analysis_results row AND a compliance_snapshot row. This enables time-series tracking without a separate job.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CREATE TABLE regex for multi-line SQL with nested parentheses**
- **Found during:** Task 1 (compliance-tracking.test.ts GREEN phase)
- **Issue:** Regex `\([^)]+\)` stopped at first `)` inside SQL (e.g., `gen_random_uuid()`) instead of capturing full CREATE TABLE block
- **Fix:** Replaced with `[\s\S]+?` pattern that matches across nested parentheses up to `);`
- **Files modified:** src/lib/__tests__/compliance-tracking.test.ts
- **Verification:** All 7 structural tests pass
- **Committed in:** 1cf4d5b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Regex fix necessary for test correctness. No scope creep.

## Issues Encountered
None -- plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GRC Analyst agent is operational with full tool suite and schema validation
- CISO Orchestrator (02-02) can now delegate to GRC via existing delegateTask function
- Frontend types ready for compliance dashboard (Phase 3)
- Compliance snapshots table ready for time-series charts
- gap_analysis_results table ready for report display

---
*Phase: 02-core-agents*
*Completed: 2026-03-26*
