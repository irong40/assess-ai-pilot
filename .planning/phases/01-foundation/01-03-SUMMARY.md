---
phase: 01-foundation
plan: 03
subsystem: trust-and-safety
tags: [approval-gates, audit-trail, multi-tenant, rls, cui-free, data-handling, risk-classification, realtime]

# Dependency graph
requires:
  - phase: 01-02
    provides: "agent_tasks table, agent-base module (executeAgentTask, delegateTask), agent-types (AgentType, RiskLevel)"
provides:
  - "agent_approvals table with RLS, approval_status enum, 24h expiry"
  - "Client-side classifyRisk() and isApprovalRequired() with deterministic verb-pattern matching"
  - "Server-side checkApprovalRequired/createApprovalRequest/processApprovalDecision"
  - "notify_approval_needed RPC for Realtime Broadcast to company channels"
  - "audit_log extended with agent_id, agent_type, reasoning_summary columns"
  - "log_audit_event RPC updated with optional agent parameters"
  - "agent-base.ts integrated with approval gate module"
  - "Multi-tenant isolation validated (12 structural tests)"
  - "CUI-free architecture validated (18 architecture decision tests)"
  - "docs/DATA-HANDLING.md customer-facing data handling policy"
  - "AIRiskAnalysisService.ts documented as mock with Phase 2 replacement path"
affects: [02-core-agents, 03-dashboards]

# Tech tracking
tech-stack:
  added: []
  patterns: [approval-gate-state-machine, risk-classification-verb-patterns, architecture-decision-tests, realtime-broadcast-notifications]

key-files:
  created:
    - supabase/migrations/20260326180000_approval_gates.sql
    - supabase/migrations/20260326180001_audit_agent_fields.sql
    - supabase/functions/_shared/approval-gate.ts
    - src/lib/approval-gate.ts
    - src/lib/__tests__/approval-gate.test.ts
    - src/lib/__tests__/agent-base.test.ts
    - src/lib/__tests__/data-architecture.test.ts
    - docs/DATA-HANDLING.md
  modified:
    - supabase/functions/_shared/agent-base.ts
    - src/services/AIRiskAnalysisService.ts

key-decisions:
  - "Risk classification uses verb-pattern matching (high: delete/modify/override/revoke/disable, medium: analyze/assess/generate/report, low: query/check/list/view/get/read) with medium as default for unknown actions"
  - "Only admin and issm roles can approve high-risk actions -- isso and user cannot"
  - "Approval requests expire after 24 hours if no decision is made"
  - "Architecture decision tests validate SQL migrations at the file level, not requiring a live database"

patterns-established:
  - "Approval gate state machine: pending -> approved|rejected; approved -> executed; rejected -> cancelled; expired -> cancelled"
  - "Verb-pattern risk classification: deterministic matching of action strings to risk levels via ordered pattern lists"
  - "Architecture decision tests: file-level structural tests that enforce data model invariants by reading SQL migrations and source files"
  - "Realtime Broadcast for approval notifications: notify_approval_needed RPC pushes events to company-scoped channel"
  - "Separation of client/server approval logic: src/lib/approval-gate.ts for frontend, supabase/functions/_shared/approval-gate.ts for Edge Functions"

requirements-completed: [INFRA-05, INFRA-06, INFRA-07, DATA-01, DATA-02]

# Metrics
duration: 7min
completed: 2026-03-26
---

# Phase 1 Plan 03: Approval Gates, Audit Trail, Multi-Tenant Isolation Summary

**Human approval gates for high-risk agent actions with deterministic verb-pattern risk classification, audit trail with agent reasoning, multi-tenant isolation enforcement, and CUI-free data architecture with customer-facing documentation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T18:37:57Z
- **Completed:** 2026-03-26T18:44:32Z
- **Tasks:** 2
- **Files created:** 8
- **Files modified:** 2
- **Tests:** 58 passing (28 approval-gate + 12 agent-base + 18 data-architecture)

## Accomplishments

- Approval gate system blocks high-risk agent actions (delete, modify, override, revoke, disable) until human admin or ISSM approves
- Deterministic risk classification via verb-pattern matching -- 28 tests confirm correct classification across all action categories and agent types
- agent_approvals table with RLS scoped by company_id, role-restricted UPDATE for admin/issm only, 24-hour expiry
- audit_log extended with agent_id, agent_type, reasoning_summary for full agent decision traceability
- Server-side approval-gate.ts creates approval requests, broadcasts via Realtime, and processes human decisions
- agent-base.ts executeAgentTask now routes through approval gate module instead of inline risk check
- 12 structural tests validating multi-tenant isolation: company_id NOT NULL on all agent tables, RLS enabled, hub-and-spoke constraints in both SQL and application code
- 18 architecture decision tests enforcing CUI-free data model: no CUI-holding columns, controls table is public, mock service identified
- Customer-facing DATA-HANDLING.md with clear sections on what is/isn't stored, tenant isolation, agent data handling, and customer responsibilities
- AIRiskAnalysisService.ts documented as mock with explicit replacement path to GRC agent in Phase 2

## Task Commits

Each task was committed atomically:

1. **Task 1: Approval gates migration, logic, and risk classification tests** - `de0d689` (feat)
2. **Task 2: Multi-tenant isolation tests, CUI-free architecture validation, and data handling docs** - `7dc799f` (feat)

## Files Created/Modified

- `supabase/migrations/20260326180000_approval_gates.sql` - agent_approvals table with approval_status enum, RLS, notify_approval_needed RPC
- `supabase/migrations/20260326180001_audit_agent_fields.sql` - audit_log extended with agent_id, agent_type, reasoning_summary; log_audit_event RPC updated
- `supabase/functions/_shared/approval-gate.ts` - Server-side checkApprovalRequired, createApprovalRequest, processApprovalDecision
- `src/lib/approval-gate.ts` - Client-side classifyRisk, isApprovalRequired, APPROVAL_ROLES, APPROVAL_STATUS_TRANSITIONS
- `src/lib/__tests__/approval-gate.test.ts` - 28 tests for risk classification, approval routing, state machine, role authorization
- `src/lib/__tests__/agent-base.test.ts` - 12 structural tests for multi-tenant isolation and hub-and-spoke enforcement
- `src/lib/__tests__/data-architecture.test.ts` - 18 architecture decision tests for CUI-free data model
- `docs/DATA-HANDLING.md` - Customer-facing data handling policy document
- `supabase/functions/_shared/agent-base.ts` (modified) - Integrated approval gate module, updated logAuditEvent with agent fields
- `src/services/AIRiskAnalysisService.ts` (modified) - Added DATA-03 replacement path documentation comment

## Decisions Made

- Risk classification uses ordered verb-pattern matching with high > low > medium priority. Unknown actions default to medium (safe default requiring no approval but flagged for review).
- Only admin and issm roles can approve high-risk actions. ISSO and user roles cannot approve, even though they may view pending approvals.
- Approval requests expire after 24 hours. Expired approvals transition to cancelled status. This prevents stale approvals from blocking agent workflows indefinitely.
- Architecture decision tests validate SQL migration files by reading them as text files, not requiring a live database. This makes the tests portable and fast.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test false positive from comment text in AIRiskAnalysisService.ts**
- **Found during:** Task 2 (data-architecture test for mock service detection)
- **Issue:** The test `expect(code).not.toContain('supabase')` failed because the replacement path documentation comment added to AIRiskAnalysisService.ts contains the word "supabase" (referencing the agent framework path). The test was checking raw file content including comments.
- **Fix:** Updated the test to strip block and line comments before checking for supabase imports, so it validates executable code only.
- **Files modified:** src/lib/__tests__/data-architecture.test.ts
- **Committed in:** 7dc799f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix necessary for correctness. No scope creep.

## User Setup Required

**Before approval gates can function in production, the following must be configured:**
1. Enable pgmq extension in Supabase Dashboard (if not already done from Plan 02)
2. Apply migrations 20260326180000_approval_gates.sql and 20260326180001_audit_agent_fields.sql
3. The Realtime Broadcast function `notify_approval_needed` requires the `realtime.send()` function -- verify Realtime is enabled in Supabase Dashboard

## Next Phase Readiness

- Phase 1 Foundation is now complete -- all 3 plans executed
- CMMC control data seeded (Plan 01), agent runtime infrastructure built (Plan 02), approval gates and CUI-free architecture established (Plan 03)
- Ready for Phase 2: GRC Analyst and CISO Orchestrator agents can be built on this foundation
- The approval gate module is ready for agent integration -- agents calling executeAgentTask with high-risk tasks will automatically route through the approval flow
- AIRiskAnalysisService.ts replacement is documented and ready for Phase 2 Plan 02-03

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (de0d689, 7dc799f) verified in git history. 2 modified files confirmed.

---
*Phase: 01-foundation*
*Completed: 2026-03-26*
