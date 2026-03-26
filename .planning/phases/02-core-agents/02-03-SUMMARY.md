---
phase: 02-core-agents
plan: 03
subsystem: analytics
tags: [data-migration, agent-service, useAgentTasks, grc-output, dashboard, risk-analysis]

# Dependency graph
requires:
  - phase: 02-core-agents
    provides: agentService.ts (dispatchCisoAssessment), useAgentTasks hook, GRC agent gap analysis output types
affects: [03-01-agent-dashboard, 03-02-compliance-dashboard, 04-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [Agent output transform pattern (GRC findings -> RiskInsight/MaturityTrend/RiskPrediction for backward-compatible UI)]

key-files:
  created: []
  modified:
    - src/components/analytics/AIInsightsDashboard.tsx
    - src/services/AIRiskAnalysisService.ts
    - src/lib/__tests__/data-architecture.test.ts

key-decisions:
  - "Transform pattern: GRC agent GapAnalysisFinding[] -> RiskInsight[] preserves existing InsightCard UI while sourcing data from real agent output"
  - "Severity derivation uses control family prefix heuristic (AC/SC/IA/AU = high-weight) and failed objectives count"
  - "Empty state dispatches via CISO orchestrator (dispatchCisoAssessment) not directly to GRC -- respects hub-and-spoke topology"

patterns-established:
  - "Agent output to UI transform: domain-specific agent output types -> generic dashboard display types via pure transform functions"
  - "Dashboard agent lifecycle: loading -> empty/error/running -> results state machine using useAgentTasks hook filters"

requirements-completed: [DATA-03]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 2 Plan 03: Mock Service Migration Summary

**AIInsightsDashboard migrated from hardcoded AIRiskAnalysisService to real GRC agent output via agentService dispatch and useAgentTasks hooks, with structural test enforcing zero remaining callers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T20:42:30Z
- **Completed:** 2026-03-26T20:46:01Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- AIInsightsDashboard now sources insights, maturity trends, and risk predictions from GRC agent gap analysis output instead of hardcoded mock data
- Dashboard shows four states: loading, empty (with "Run Assessment" button), running agent progress, and completed results with SPRS score badge
- Structural test scans all .ts/.tsx files in src/components/ and src/pages/ to enforce zero AIRiskAnalysisService callers going forward
- AIRiskAnalysisService.ts preserved with full deprecation notice pointing to agentService.ts and useAgentTasks.ts as replacements
- All 182 tests pass across 12 test files with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate AIInsightsDashboard to agent-driven analysis and update structural tests** - `2edabfd` (feat)

_Task followed TDD: structural test written first (RED -- failed with AIInsightsDashboard as caller), then implementation (GREEN -- all 20 data-architecture tests pass)._

## Files Created/Modified
- `src/components/analytics/AIInsightsDashboard.tsx` - Replaced mock service calls with agentService dispatch and useAgentTasks hook; added empty/loading/error/running states
- `src/services/AIRiskAnalysisService.ts` - Added deprecation notice with migration pointer; preserved class for reference
- `src/lib/__tests__/data-architecture.test.ts` - Added "AIRiskAnalysisService has no remaining callers (DATA-03)" describe block with recursive file scanner

## Decisions Made
- **Transform pattern over rewrite:** Rather than rewriting InsightCard/TrendCard/PredictionCard components, created pure transform functions (findingsToInsights, reportToTrends, findingsToPredictions) that convert GRC agent output to the existing RiskInsight/MaturityTrend/RiskPrediction types. This preserves all existing UI layout and styling.
- **Severity derivation heuristic:** High-weight NIST 800-171 control families (AC, SC, IA, AU) produce higher severity ratings. This approximates the actual SPRS weight system documented in 01-01.
- **CISO dispatch for assessments:** The "Run Assessment" button dispatches via dispatchCisoAssessment (not directly to GRC agent), maintaining the hub-and-spoke topology where only CISO can delegate to specialist agents.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None -- plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AIInsightsDashboard is ready for real data once GRC agent Edge Function is deployed to Supabase
- Phase 3 dashboard work can extend the transform pattern for additional agent output types
- Structural test prevents regression (any new AIRiskAnalysisService caller will fail CI)
- All mock data has been replaced in the analytics dashboard

## Self-Check: PASSED

- [x] AIInsightsDashboard.tsx exists
- [x] AIRiskAnalysisService.ts exists (with deprecation notice)
- [x] data-architecture.test.ts exists (with zero-caller tests)
- [x] 02-03-SUMMARY.md exists
- [x] Commit 2edabfd verified in git log
- [x] Zero AIRiskAnalysisService references in src/components/ (grep verified)
- [x] Zero AIRiskAnalysisService references in src/pages/ (grep verified)
- [x] agentService import confirmed in AIInsightsDashboard.tsx line 8
- [x] useAgentTasks import confirmed in AIInsightsDashboard.tsx line 9
- [x] All 182 tests pass (12 test files, 0 failures)

---
*Phase: 02-core-agents*
*Completed: 2026-03-26*
