---
phase: 02-core-agents
plan: 02
subsystem: agents
tags: [ciso, orchestrator, delegation, zod, tanstack-query, edge-functions, supabase]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: agent_tasks table, agent-base.ts (executeAgentTask, delegateTask), approval-gate.ts, agent-types.ts
provides:
  - CISO Orchestrator Edge Function with 4 actions
  - CISO system prompt with priority ordering and delegation rules
  - 4 CISO tools (delegateToGRC, readCompletedTaskResults, getCurrentRiskPosture, createFollowUpTask)
  - ExecutiveSummary, DelegationPlan, RiskPosture Zod schemas
  - Frontend agentService for dispatching tasks
  - useAgentTasks, useCisoTaskQueue, useAgentTaskDetail hooks
affects: [03-assessment-flow, 04-dashboard, 05-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns: [CISO-as-coordinator agent pattern, dual-module pattern (Deno + Node schemas), chainable supabase mock pattern for vitest]

key-files:
  created:
    - supabase/functions/agent-ciso-orchestrator/index.ts
    - supabase/functions/_shared/ciso-schemas.ts
    - supabase/functions/_shared/ciso-tools.ts
    - src/lib/ciso-schemas.ts
    - src/lib/ciso-tools.ts
    - src/services/agentService.ts
    - src/hooks/useAgentTasks.ts
    - src/lib/__tests__/ciso-agent.test.ts
    - src/lib/__tests__/ciso-schemas.test.ts
    - src/lib/__tests__/agent-hooks.test.ts
  modified: []

key-decisions:
  - "Dual-module pattern: Node-compatible versions of schemas and tools in src/lib/ for vitest, Deno versions in supabase/functions/_shared/ for Edge Functions"
  - "CISO tools are self-contained closures bound to supabase client and parent task -- no global state"
  - "createFollowUpTask uses pgmq for scheduling, enables async synthesis after delegations complete"
  - "agentService inserts task row then invokes agent-worker for immediate processing (fallback to pg_cron if invoke fails)"

patterns-established:
  - "Agent tool factory: createXTools(supabase, task) returns Vercel AI SDK tool objects bound to context"
  - "CISO prompt builder: buildCisoPrompt(action, input) returns action-specific prompts"
  - "Chainable supabase mock: createChainableMock() for fluent query builder testing in vitest"

requirements-completed: [CISO-01, CISO-02, CISO-03, CISO-04, CISO-05]

# Metrics
duration: 7min
completed: 2026-03-26
---

# Phase 2 Plan 02: CISO Orchestrator Summary

**CISO Orchestrator agent with priority-based GRC delegation, executive summary synthesis, risk posture assessment, and frontend task queue hooks**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T20:30:22Z
- **Completed:** 2026-03-26T20:37:34Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- CISO Orchestrator Edge Function with 4 actions: run-compliance-assessment, synthesize-results, generate-executive-summary, assess-risk-posture
- System prompt with strict priority ordering (critical controls > high-SPRS-weight > existing findings > user-requested)
- 4 tools enabling GRC delegation, result reading, risk posture assessment, and follow-up task scheduling
- Frontend agentService for dispatching tasks with immediate agent-worker invocation
- TanStack Query hooks for task queue visibility including delegation tree

## Task Commits

Each task was committed atomically:

1. **Task 1: CISO Zod schemas, system prompt, tools, and Edge Function** - `a3b0e9b` (feat)
2. **Task 2: Frontend agent service and useAgentTasks hook** - `1c903af` (feat)

_Both tasks followed TDD (RED-GREEN): tests written first, then implementation._

## Files Created/Modified
- `supabase/functions/agent-ciso-orchestrator/index.ts` - CISO Orchestrator Edge Function handler (4 actions, 8 maxSteps)
- `supabase/functions/_shared/ciso-schemas.ts` - Deno Zod schemas for ExecutiveSummary, DelegationPlan, RiskPosture
- `supabase/functions/_shared/ciso-tools.ts` - CISO_SYSTEM_PROMPT, createCisoTools factory, buildCisoPrompt builder
- `src/lib/ciso-schemas.ts` - Node-compatible Zod schemas (vitest-importable)
- `src/lib/ciso-tools.ts` - Node-compatible CISO prompt, tool names, prompt builder (vitest-importable)
- `src/services/agentService.ts` - dispatchAgentTask, dispatchCisoAssessment, getAgentTaskStatus
- `src/hooks/useAgentTasks.ts` - useAgentTasks, useCisoTaskQueue, useAgentTaskDetail hooks
- `src/lib/__tests__/ciso-agent.test.ts` - 14 tests for CISO prompt, tools, Edge Function structure
- `src/lib/__tests__/ciso-schemas.test.ts` - 10 tests for ExecutiveSummary, DelegationPlan, RiskPosture schemas
- `src/lib/__tests__/agent-hooks.test.ts` - 10 tests for agent service and hooks

## Decisions Made
- Used dual-module pattern (Deno + Node) to maintain testability with vitest while supporting Deno Edge Functions
- CISO tools are closures bound to (supabase, task) context -- no global state, fully testable via dependency injection
- createFollowUpTask enables async workflow: CISO delegates, then schedules synthesis for when delegations complete
- agentService inserts task then invokes agent-worker for immediate processing; falls back to pg_cron on invoke failure
- High-risk assessment escalation: CMMC Level 2 full assessments set risk_level='high' for approval gate review

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vitest mock hoisting for supabase client**
- **Found during:** Task 2 (agent-hooks.test.ts)
- **Issue:** vi.mock factory referenced top-level variables which are not available due to hoisting
- **Fix:** Restructured mocks to use vi.fn() at module scope and createChainableMock() factory pattern
- **Files modified:** src/lib/__tests__/agent-hooks.test.ts
- **Verification:** All 10 hook tests pass
- **Committed in:** 1c903af (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Mock setup fix was necessary for correct test execution. No scope creep.

## Issues Encountered
None beyond the mock hoisting issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CISO Orchestrator ready to coordinate with GRC Analyst (requires Plan 02-01 GRC agent completion)
- Frontend hooks ready for dashboard integration in Phase 03/04
- Agent dispatch service ready for assessment flow in Phase 03
- compliance_snapshots table not yet created -- getCurrentRiskPosture tool handles gracefully with null return

---
*Phase: 02-core-agents*
*Completed: 2026-03-26*
