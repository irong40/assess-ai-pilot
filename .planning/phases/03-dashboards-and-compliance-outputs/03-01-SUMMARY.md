---
phase: 03-dashboards-and-compliance-outputs
plan: 01
subsystem: ui
tags: [react, tanstack-query, supabase-realtime, shadcn, agent-dashboard, approval-queue]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: agent_tasks table, agent_approvals table, agent types, RLS policies
  - phase: 02-core-agents
    provides: useAgentTasks hook, agent type definitions, CISO task queue
provides:
  - AgentDashboard page with 4 tabs (Status, Activity, Approvals, Settings)
  - AgentStatusGrid with real-time status for all 7 agent types
  - AgentActivityLog with reasoning summaries and expandable rows
  - ApprovalQueue with role-based approve/reject (admin/issm only)
  - AgentSettingsForm with notification preferences and auto-approve threshold
  - useRealtimeAgentStatus hook for Supabase Realtime invalidation
  - useAgentApprovals hook (usePendingApprovals + useApprovalDecision)
  - useAgentSettings hook (query + upsert)
  - agent_settings table with RLS
affects: [03-dashboards-and-compliance-outputs, 04-reporting-and-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-realtime-invalidation, role-gated-ui-actions, agent-status-derivation]

key-files:
  created:
    - src/pages/AgentDashboard.tsx
    - src/components/agents/AgentStatusGrid.tsx
    - src/components/agents/AgentActivityLog.tsx
    - src/components/agents/ApprovalQueue.tsx
    - src/components/agents/AgentSettingsForm.tsx
    - src/hooks/useRealtimeAgentStatus.ts
    - src/hooks/useAgentApprovals.ts
    - src/hooks/useAgentSettings.ts
    - supabase/migrations/20260327100000_agent_settings.sql
    - src/lib/__tests__/agent-dashboard.test.ts
    - src/lib/__tests__/agent-approvals.test.ts
    - src/lib/__tests__/agent-settings.test.ts
  modified:
    - src/pages/AgentDashboard.tsx

key-decisions:
  - "Agent status derived from most recent task per agent type -- no separate status table needed"
  - "Realtime subscription at page level (AgentDashboard) invalidates both agent-tasks and ciso-task-queue query keys"
  - "Global settings row (agent_type='global') per company for v1 -- per-agent settings deferred"
  - "ApprovalQueue role check uses useUserProfile().role matching ['admin','issm'] -- consistent with RLS policy"

patterns-established:
  - "Realtime invalidation pattern: supabase.channel().on('postgres_changes') -> queryClient.invalidateQueries"
  - "Agent display name map: AGENT_DISPLAY_NAMES constant shared across dashboard components"
  - "Role-gated UI: conditionally render action buttons based on useUserProfile().role"
  - "Settings upsert pattern: INSERT ON CONFLICT UPDATE via Supabase .upsert() with onConflict"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04]

# Metrics
duration: 7min
completed: 2026-03-27
---

# Phase 3 Plan 1: Agent Dashboard Summary

**Agent Dashboard with real-time status grid, activity log with AI reasoning, role-gated approval queue, and company-level settings via Supabase Realtime and TanStack Query**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-27T12:54:22Z
- **Completed:** 2026-03-27T13:01:01Z
- **Tasks:** 2
- **Files created:** 12

## Accomplishments
- AgentStatusGrid renders 7 agent cards with live status derived from latest task (idle/running/completed/failed/awaiting approval)
- AgentActivityLog shows task history with reasoning summaries, expandable rows, and relative timestamps
- ApprovalQueue with approve/reject actions restricted to admin and issm roles via useUserProfile
- AgentSettingsForm with notification checkboxes and auto-approve threshold select, persisted via upsert
- Supabase Realtime subscription invalidates TanStack Query caches on agent_tasks table changes
- agent_settings migration with RLS policies for tenant isolation
- 15 tests across 3 test files all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Agent status grid, activity log, and Realtime subscription** - `74f416b` (feat)
2. **Task 2: Approval queue, agent settings, and migration** - `40282ff` (feat)

## Files Created/Modified
- `src/pages/AgentDashboard.tsx` - Main dashboard page with 4 tabbed sections
- `src/components/agents/AgentStatusGrid.tsx` - Grid of 7 agent status cards with color-coded badges
- `src/components/agents/AgentActivityLog.tsx` - Task history table with reasoning and expandable rows
- `src/components/agents/ApprovalQueue.tsx` - Pending approval cards with role-gated approve/reject
- `src/components/agents/AgentSettingsForm.tsx` - Notification preferences and auto-approve threshold
- `src/hooks/useRealtimeAgentStatus.ts` - Supabase Realtime subscription for cache invalidation
- `src/hooks/useAgentApprovals.ts` - usePendingApprovals query + useApprovalDecision mutation
- `src/hooks/useAgentSettings.ts` - useAgentSettings query + useUpdateAgentSettings upsert mutation
- `supabase/migrations/20260327100000_agent_settings.sql` - agent_settings table with RLS
- `src/lib/__tests__/agent-dashboard.test.ts` - 7 tests for status grid, activity log, Realtime
- `src/lib/__tests__/agent-approvals.test.ts` - 5 tests for approval queries and role-based rendering
- `src/lib/__tests__/agent-settings.test.ts` - 3 tests for settings migration, form, and hook

## Decisions Made
- Agent status derived from most recent task per agent type -- avoids needing a separate status tracking table
- Realtime subscription placed at AgentDashboard page level (not per-component) to avoid multiple channels
- Global settings row per company (agent_type='global') for v1 simplicity -- per-agent configuration deferred
- AGENT_DISPLAY_NAMES constant duplicated across components (not extracted to shared module) -- small enough to not warrant abstraction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing test failure in `reassessment.test.ts` (references `@/components/compliance/ReassessmentScheduler` from a future plan). Out of scope for this plan -- logged but not fixed.

## User Setup Required

Supabase Realtime must be enabled on the `agent_tasks` table in the Supabase Dashboard:
- Navigate to Database > Replication
- Enable Realtime for the `agent_tasks` table
- This is required for the useRealtimeAgentStatus hook to receive postgres_changes events

## Next Phase Readiness
- Agent Dashboard complete with all 4 functional tabs
- Ready for 03-02 (Compliance Dashboard) and 03-03 (POAM tracking) to build on this foundation
- Approval queue patterns can be reused for any future human-in-the-loop flows

## Self-Check: PASSED

- All 12 files verified present on disk
- Commit 74f416b (Task 1) verified in git log
- Commit 40282ff (Task 2) verified in git log
- 15/15 tests passing across 3 test files

---
*Phase: 03-dashboards-and-compliance-outputs*
*Completed: 2026-03-27*
