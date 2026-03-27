---
phase: 03-dashboards-and-compliance-outputs
plan: 02
subsystem: ui
tags: [compliance, dashboard, recharts, sprs, drift-detection, reassessment, tanstack-query]

# Dependency graph
requires:
  - phase: 02-core-agents
    provides: "compliance_snapshots table, agent_tasks table, CISO orchestrator, agentService"
provides:
  - "ComplianceDashboard page with SPRS score, family progress, trend chart, executive summary"
  - "DriftAlertBanner detecting declining compliance between assessments"
  - "ReassessmentScheduler for recurring weekly/monthly/quarterly schedules"
  - "reassessment_schedules table with RLS"
  - "useComplianceSnapshots and useLatestExecutiveSummary hooks"
  - "compliance-utils: NIST_FAMILIES, familyScoresToChartData, getPostureLabel, detectDrift"
affects: [03-dashboards-and-compliance-outputs, 04-evidence-and-poam-workflows]

# Tech tracking
tech-stack:
  added: [recharts-area-chart, date-fns-format]
  patterns: [compliance-snapshot-hooks, drift-detection-threshold, cron-expression-scheduling]

key-files:
  created:
    - src/pages/ComplianceDashboard.tsx
    - src/components/compliance/SprsScoreCard.tsx
    - src/components/compliance/FamilyProgressChart.tsx
    - src/components/compliance/ComplianceTrendChart.tsx
    - src/components/compliance/ExecutiveSummaryView.tsx
    - src/components/compliance/DriftAlertBanner.tsx
    - src/components/compliance/ReassessmentScheduler.tsx
    - src/hooks/useComplianceSnapshots.ts
    - src/hooks/useReassessmentSchedule.ts
    - src/lib/compliance-utils.ts
    - supabase/migrations/20260327100001_reassessment_schedules.sql
    - src/lib/__tests__/compliance-dashboard.test.ts
    - src/lib/__tests__/drift-monitor.test.ts
    - src/lib/__tests__/reassessment.test.ts
  modified:
    - src/pages/ComplianceDashboard.tsx

key-decisions:
  - "detectDrift included in compliance-utils (shared between DriftAlertBanner and future monitoring) rather than a separate module"
  - "ReassessmentScheduler uses native select elements (not shadcn Select) for simplicity -- form has only 3 controls"
  - "pg_cron setup documented as SQL comment in migration (not auto-executed) because pg_cron availability varies by environment"
  - "Compliance trend chart Y-axis domain set to [-203, 110] to match full SPRS score range"

patterns-established:
  - "Compliance snapshot hook pattern: useComplianceSnapshots returns ascending time-series for charts, getLatestSnapshot extracts most recent"
  - "Drift detection pattern: threshold-based comparison of consecutive snapshots with direction indicator"
  - "Cron scheduling pattern: human-friendly labels mapped to cron expressions, stored in reassessment_schedules"

requirements-completed: [REPT-01, REPT-02, REPT-03, REPT-04, REPT-05, REPT-06]

# Metrics
duration: 8min
completed: 2026-03-27
---

# Phase 3 Plan 2: Compliance Dashboard Summary

**Compliance dashboard with SPRS score card, 14-family progress bars, Recharts trend chart, CISO executive summary, drift alert banner, and recurring reassessment scheduler**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-27T12:54:02Z
- **Completed:** 2026-03-27T13:02:06Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- ComplianceDashboard page with 6 compliance components: SPRS score card, family progress chart, trend chart, executive summary, drift alert banner, reassessment scheduler
- Drift detection compares consecutive SPRS snapshots with configurable threshold (default 5 points), shows declining drift warning with re-assessment dispatch
- Reassessment scheduling with weekly/monthly/quarterly frequency options persisted to reassessment_schedules table with RLS
- Full test coverage: 17 tests across 3 test files (9 + 5 + 3)
- Full test suite green: 214 tests passing across 18 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Compliance data hooks, utility functions, SPRS score card, family progress, and trend chart** - `523591c` (feat)
2. **Task 2: Drift monitoring, reassessment scheduling, and migration** - `74e8e13` (feat)

## Files Created/Modified
- `src/pages/ComplianceDashboard.tsx` - Main dashboard page composing all 6 compliance components
- `src/components/compliance/SprsScoreCard.tsx` - Large SPRS score display with posture badge, met/not-met counts, POA&M eligibility
- `src/components/compliance/FamilyProgressChart.tsx` - 14 color-coded progress bars for NIST 800-171 control families
- `src/components/compliance/ComplianceTrendChart.tsx` - Recharts AreaChart of SPRS score over time
- `src/components/compliance/ExecutiveSummaryView.tsx` - CISO executive summary with posture, findings, risk areas, recommendations, print button
- `src/components/compliance/DriftAlertBanner.tsx` - Warning banner for declining compliance drift with re-assessment action
- `src/components/compliance/ReassessmentScheduler.tsx` - Schedule configuration (frequency, CMMC level, enabled toggle)
- `src/hooks/useComplianceSnapshots.ts` - TanStack Query hooks for compliance_snapshots and agent_tasks
- `src/hooks/useReassessmentSchedule.ts` - TanStack Query hooks for reassessment_schedules CRUD
- `src/lib/compliance-utils.ts` - NIST_FAMILIES, familyScoresToChartData, getPostureLabel, detectDrift utilities
- `supabase/migrations/20260327100001_reassessment_schedules.sql` - reassessment_schedules table with RLS, policies, updated_at trigger
- `src/lib/__tests__/compliance-dashboard.test.ts` - 9 tests for hooks, utils, and dashboard components
- `src/lib/__tests__/drift-monitor.test.ts` - 5 tests for drift detection logic
- `src/lib/__tests__/reassessment.test.ts` - 3 tests for migration structure, scheduler UI, and schedule hook

## Decisions Made
- detectDrift lives in compliance-utils alongside other compliance functions rather than a separate drift module -- single import for all compliance logic
- ReassessmentScheduler uses native HTML select elements for simplicity since the form has only 3 simple controls
- pg_cron job setup is documented as a SQL comment in the migration file but not auto-executed, since pg_cron availability varies across Supabase environments
- Compliance trend chart Y-axis domain set to [-203, 110] to accommodate the full SPRS score range per NIST 800-171

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The pg_cron job for automated reassessment dispatch is documented in the migration file comments and can be configured via the Supabase Dashboard SQL Editor when ready.

## Next Phase Readiness
- Compliance Dashboard fully functional with real data sources from compliance_snapshots and agent_tasks
- Drift detection and reassessment scheduling ready for production use
- Ready for Phase 3 Plan 3 (remaining dashboard outputs)

## Self-Check: PASSED

All 14 files verified present. Both commits (523591c, 74e8e13) verified in git log. 17/17 tests passing, 214/214 full suite passing.

---
*Phase: 03-dashboards-and-compliance-outputs*
*Completed: 2026-03-27*
