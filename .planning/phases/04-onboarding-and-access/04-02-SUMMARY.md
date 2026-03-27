---
phase: 04-onboarding-and-access
plan: 02
subsystem: auth
tags: [rbac, permissions, supabase, rls, react-query, hooks]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: companies table, user_role enum, agent_type enum
  - phase: 03-dashboards-and-compliance-outputs
    provides: ApprovalQueue component, AgentSettingsForm component, useAgentSettings hook
provides:
  - company_agent_permissions table with RLS and auto-seed trigger
  - useAgentPermissions hook for single agent type permission lookup
  - useAllAgentPermissions hook for batch permission lookup (Map-based)
  - Permission-guarded ApprovalQueue (per-agent-type canApprove)
  - Permission-guarded AgentSettingsForm (canConfigure disables save + inputs)
affects: [05-assessment-flow, 06-advanced-agents]

# Tech tracking
tech-stack:
  added: []
  patterns: [permission-hook-pattern, deny-by-default-permissions, cross-join-seed-migration, after-insert-trigger-seed]

key-files:
  created:
    - supabase/migrations/20260327200001_agent_permissions.sql
    - src/hooks/useAgentPermissions.ts
    - src/lib/__tests__/agent-permissions.test.ts
  modified:
    - src/components/agents/ApprovalQueue.tsx
    - src/hooks/useAgentSettings.ts
    - src/components/agents/AgentSettingsForm.tsx
    - src/lib/__tests__/agent-approvals.test.ts

key-decisions:
  - "Deny-by-default: useAgentPermissions returns all-false on error or missing row"
  - "CROSS JOIN seed populates 28 rows per company (4 roles x 7 agent types)"
  - "AFTER INSERT trigger on companies auto-seeds permissions for new companies"
  - "useAllAgentPermissions returns Map<agentType, permissions> for batch lookups in ApprovalQueue"

patterns-established:
  - "Permission hook pattern: useAgentPermissions(agentType) for component-level access control"
  - "Deny-by-default: all permission hooks return false on error"
  - "Auto-seed trigger: new table rows created automatically for new companies"

requirements-completed: [ONBD-04]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 4, Plan 2: Agent Permissions Summary

**Granular per-agent-type permission matrix (configure/approve/view_logs) with RLS-backed table, auto-seed trigger, and React hooks wired into ApprovalQueue and AgentSettingsForm**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T14:14:04Z
- **Completed:** 2026-03-27T14:19:33Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- company_agent_permissions table with UNIQUE(company_id, role, agent_type) constraint and 4 RLS policies mirroring agent_settings pattern
- Default permission matrix seeded for all existing companies: admin=full, issm=approve+logs, isso=logs-only, viewer=none
- AFTER INSERT trigger on companies auto-creates 28 permission rows for every new company
- useAgentPermissions and useAllAgentPermissions hooks with deny-by-default error handling
- ApprovalQueue now checks per-agent-type canApprove instead of hardcoded role list
- AgentSettingsForm disables save button and all form inputs when user lacks canConfigure, with permission helper text

## Task Commits

Each task was committed atomically:

1. **Task 1: Agent permissions migration, hook, and tests** - `59cbb12` (feat) [TDD: RED-GREEN]
2. **Task 2: Update ApprovalQueue and AgentSettingsForm to use permission hook** - `31ada0e` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `supabase/migrations/20260327200001_agent_permissions.sql` - Permission table, RLS, seed, trigger
- `src/hooks/useAgentPermissions.ts` - useAgentPermissions + useAllAgentPermissions hooks
- `src/lib/__tests__/agent-permissions.test.ts` - 12 tests: migration schema, role permissions, error fallback, disabled state, Map variant
- `src/components/agents/ApprovalQueue.tsx` - Uses useAllAgentPermissions for per-agent canApprove
- `src/hooks/useAgentSettings.ts` - Permission guidance comment on useUpdateAgentSettings
- `src/components/agents/AgentSettingsForm.tsx` - canConfigure guard on save button and inputs
- `src/lib/__tests__/agent-approvals.test.ts` - Updated mocks for useAgentPermissions module

## Decisions Made
- Deny-by-default: useAgentPermissions returns { canConfigure: false, canApprove: false, canViewLogs: false } on any error or missing row -- security-first design
- CROSS JOIN seed with ON CONFLICT DO NOTHING ensures idempotent migration for existing companies
- AFTER INSERT trigger uses SECURITY DEFINER to bypass RLS during auto-seed
- useAllAgentPermissions returns Map<string, AgentPermissions> for O(1) lookups in list components like ApprovalQueue
- Permission guidance comment added to useUpdateAgentSettings rather than embedding permission checks inside the mutation hook (avoids conditional hook composition issue)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated agent-approvals test mocks for permission hooks**
- **Found during:** Task 2 (ApprovalQueue update)
- **Issue:** Existing ApprovalQueue tests timed out because the component now imports useAllAgentPermissions which was not mocked in agent-approvals.test.ts
- **Fix:** Added vi.mock for @/hooks/useAgentPermissions with mockPermissionsMap returning appropriate Maps per test case (admin=canApprove:true, isso=canApprove:false)
- **Files modified:** src/lib/__tests__/agent-approvals.test.ts
- **Verification:** Full test suite passes (253 tests, 0 failures)
- **Committed in:** 31ada0e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Test mock update was necessary to maintain test suite integrity after refactoring ApprovalQueue. No scope creep.

## Issues Encountered
- TanStack Query v5 `isLoading` vs `isPending` semantics: when `enabled: false`, `isLoading` is false but `isPending` is true. Fixed test assertion to use `isPending` + `fetchStatus === 'idle'` for the disabled-query test case.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Agent permission infrastructure complete, ready for Phase 5 assessment flow
- Permission hooks available for any future component needing role-based agent access control
- Auto-seed trigger ensures zero-config for new companies joining the platform

## Self-Check: PASSED

- All 7 files verified on disk (7/7 FOUND)
- Task 1 commit `59cbb12` verified in git log
- Task 2 commit `31ada0e` verified in git log
- Full test suite: 253 tests passing, 0 failures

---
*Phase: 04-onboarding-and-access*
*Completed: 2026-03-27*
