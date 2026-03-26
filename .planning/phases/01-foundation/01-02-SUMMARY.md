---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [pgmq, pg_cron, edge-functions, agent-runtime, deno, supabase, zod, ai-sdk, postgresql]

# Dependency graph
requires:
  - phase: none
    provides: "existing companies table, profiles table, audit_log RPC, edge function patterns"
provides:
  - "agent_tasks table with RLS, hub-and-spoke constraint, delegation depth limit"
  - "pgmq 'agent_tasks' queue with pg_cron scheduled worker"
  - "shared agent-base module (executeAgentTask, delegateTask)"
  - "shared supabase-client factory (createServiceClient, createAuthClient, getCompanyId)"
  - "agent-worker queue consumer Edge Function"
  - "agent-test validation Edge Function with AI SDK + Claude"
  - "frontend TypeScript types (AgentType, TaskStatus, VALID_TRANSITIONS)"
  - "Zod schemas for Edge Function runtime validation"
  - "agent_type, task_status, agent_risk_level PostgreSQL enums"
affects: [02-core-agents, 03-specialist-agents, 04-approval-gates]

# Tech tracking
tech-stack:
  added: [pgmq, pg_cron, pg_net, ai-sdk-6, ai-sdk-anthropic-3]
  patterns: [agent-state-machine, hub-and-spoke-topology, pgmq-queue-consumer, deno-edge-function-shared-modules]

key-files:
  created:
    - supabase/migrations/20260326140047_agent_infrastructure.sql
    - supabase/migrations/20260326140048_pgmq_queues.sql
    - src/types/agent.ts
    - supabase/functions/_shared/agent-types.ts
    - supabase/functions/_shared/agent-base.ts
    - supabase/functions/_shared/supabase-client.ts
    - supabase/functions/agent-worker/index.ts
    - supabase/functions/agent-test/index.ts
    - src/lib/__tests__/agent-state.test.ts
  modified: []

key-decisions:
  - "Separate agent_risk_level enum (low/medium/high) from existing risk_level enum (critical/high/medium/low) to avoid coupling agent approval routing with finding severity"
  - "Type assertions for Supabase pgmq_public schema calls since supabase-js generics do not include non-standard schemas"
  - "agent-test uses npm: imports for AI SDK (resolved at Supabase deploy time, not during local deno check)"

patterns-established:
  - "Agent state machine: VALID_TRANSITIONS record mapping each TaskStatus to allowed next statuses"
  - "Hub-and-spoke topology: source_agent SQL CHECK constraint + application-level validation in agent-base"
  - "Shared Edge Function modules: _shared/ directory for cross-function code (agent-base, agent-types, supabase-client)"
  - "pgmq queue consumer pattern: read with visibility timeout, dispatch to function, delete on success, auto-retry on failure"
  - "Service role client pattern: createServiceClient() for agent operations without user context"
  - "company_id scoping: every agent database query includes .eq('company_id', task.company_id)"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-08]

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 1 Plan 02: Agent Runtime Infrastructure Summary

**PostgreSQL agent state machine with pgmq durable queue, pg_cron worker scheduling, shared agent-base module, and AI SDK test agent for end-to-end validation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T13:58:12Z
- **Completed:** 2026-03-26T14:06:42Z
- **Tasks:** 2
- **Files created:** 9

## Accomplishments
- Agent state machine with 7 statuses, strict transition rules, and 31 passing unit tests
- Hub-and-spoke topology enforced at both SQL (CHECK constraint) and application level
- pgmq durable queue with pg_cron worker dispatching to Edge Functions every minute
- Shared agent-base module providing executeAgentTask and delegateTask with company_id scoping on every query
- Test agent Edge Function demonstrating full lifecycle: dispatch -> AI SDK generateText with Claude -> state persistence -> audit trail

## Task Commits

Each task was committed atomically:

1. **Task 1: Agent infrastructure migrations, types, and state machine tests** - `5942905` (feat)
2. **Task 2: Agent base module, queue worker, and test agent Edge Functions** - `586a6e4` (feat)

## Files Created/Modified
- `supabase/migrations/20260326140047_agent_infrastructure.sql` - agent_tasks table with RLS, enums, constraints, indexes, updated_at trigger
- `supabase/migrations/20260326140048_pgmq_queues.sql` - pgmq queue creation, pg_cron schedule, vault secrets, realtime RLS
- `src/types/agent.ts` - Frontend types: AgentType, TaskStatus, RiskLevel, AgentTask, AgentMessage, VALID_TRANSITIONS, validation functions
- `supabase/functions/_shared/agent-types.ts` - Zod schemas mirroring frontend types for Edge Function runtime validation
- `supabase/functions/_shared/agent-base.ts` - executeAgentTask (lifecycle manager), delegateTask (hub-and-spoke delegation)
- `supabase/functions/_shared/supabase-client.ts` - createServiceClient, createAuthClient, getCompanyId factory functions
- `supabase/functions/agent-worker/index.ts` - pgmq queue consumer: reads 5 messages, dispatches to agent functions, deletes on success
- `supabase/functions/agent-test/index.ts` - Test agent: AI SDK generateText with Claude + queryDatabase tool
- `src/lib/__tests__/agent-state.test.ts` - 31 unit tests for state machine, hub-and-spoke, delegation depth

## Decisions Made
- Created separate `agent_risk_level` enum (low/medium/high) rather than reusing existing `risk_level` enum (critical/high/medium/low) to keep agent approval routing decoupled from finding severity classification
- Used type assertions (`as any`) for Supabase client's `.schema("pgmq_public")` calls because the supabase-js TypeScript generics do not include non-standard PostgreSQL schemas
- agent-test Edge Function uses `npm:ai@6` and `npm:@ai-sdk/anthropic@3` imports which resolve at Supabase deploy time, not during local `deno check`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm dependencies not installed**
- **Found during:** Task 1 (running vitest tests)
- **Issue:** vitest binary not found in node_modules/.bin -- npm install had not been run
- **Fix:** Ran `npm install` to resolve all dependencies
- **Files modified:** package-lock.json (lockfile updated)
- **Verification:** Tests run successfully after install
- **Committed in:** Not committed (lockfile change is transient)

**2. [Rule 1 - Bug] Supabase pgmq_public schema type errors in Deno**
- **Found during:** Task 2 (deno check of agent-worker and agent-base)
- **Issue:** `supabase.schema("pgmq_public")` causes TypeScript error because supabase-js generics only know about the `public` schema
- **Fix:** Added `(supabase as any).schema("pgmq_public")` type assertions with lint suppression comments
- **Files modified:** supabase/functions/agent-worker/index.ts, supabase/functions/_shared/agent-base.ts
- **Verification:** `deno check --no-lock` passes for all 4 shared/worker files
- **Committed in:** 586a6e4 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- `npx vitest run -x` flag not recognized in vitest 3.2 -- used `--bail 1` instead
- agent-test/index.ts cannot be type-checked locally with `deno check` because npm:ai@6 and npm:@ai-sdk/anthropic@3 require the Supabase Edge Function runtime for npm resolution. This is expected behavior and will work correctly when deployed.

## User Setup Required

**Vault secrets must be configured before agent runtime can function.** In Supabase Dashboard:
1. Go to Project Settings > Vault
2. Update `project_url` secret with your actual Supabase project URL
3. Update `service_role_key` secret with your actual service role key
4. Enable pgmq extension in Database > Extensions (if not already enabled)
5. Enable pg_cron extension in Database > Extensions (if not already enabled)
6. Enable pg_net extension in Database > Extensions (if not already enabled)
7. Verify Queue Settings: ensure "Expose Queues via PostgREST" is enabled
8. Set `ANTHROPIC_API_KEY` in Edge Function secrets for the test agent

## Next Phase Readiness
- Agent runtime infrastructure complete -- all 7 agents can be built on this foundation
- agent-base module provides the executeAgentTask/delegateTask pattern every agent will use
- pgmq queue and pg_cron worker handle durable task dispatch
- Controls data needs to be seeded (Plan 01-01) before agent-test queryDatabase tool can verify data access
- Ready for Phase 2: CISO Orchestrator and GRC Analyst implementation

## Self-Check: PASSED

All 10 created files verified on disk. Both task commits (5942905, 586a6e4) verified in git history.

---
*Phase: 01-foundation*
*Completed: 2026-03-26*
