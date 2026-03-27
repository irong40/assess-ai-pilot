---
phase: 06-advanced-agents
plan: 01
subsystem: agents
tags: [incident-response, nist-800-61r2, containment, playbook, post-incident-report, ir-agent, ciso-delegation, zod, edge-function]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: agent-base.ts (executeAgentTask, delegateTask), agent-types.ts, controls table
  - phase: 02-core-agents
    provides: GRC Analyst agent, CISO Orchestrator with delegateToGRC, dual-module pattern, tool factory pattern
  - phase: 05-security-operations-agents
    provides: SOC Analyst agent (05-01), Threat Intel agent (05-02), CISO delegateToSOC/delegateToThreatIntel, soc_alerts table
provides:
  - IR Edge Function with analyze-incident/generate-playbook/create-post-incident-report actions
  - 5 IR tools (getEscalatedIncidents, getIncidentContext, createIrIncident, saveContainmentPlan, savePostIncidentReport)
  - Zod schemas for containment recommendations, playbook guidance, post-incident reports
  - ir_incidents database table with lifecycle status (6 states), RLS, 3 indexes
  - CISO Orchestrator extended with delegateToIR tool (risk_level='high' hardcoded)
  - Frontend TypeScript types for IR output
affects: [06-02-appsec-agent, 06-03-pen-test-agent]

# Tech tracking
tech-stack:
  added: []
  patterns: [NIST SP 800-61r2 four-phase lifecycle (detect/contain/eradicate/recover), mandatory approval via risk_level='high' override, post-incident compliance snapshot creation (Pitfall 6)]

key-files:
  created:
    - supabase/functions/agent-incident-response/index.ts
    - supabase/functions/_shared/ir-schemas.ts
    - supabase/functions/_shared/ir-tools.ts
    - src/lib/ir-schemas-frontend.ts
    - src/lib/ir-tools-testable.ts
    - src/types/ir-output.ts
    - supabase/migrations/20260327400000_ir_agent_tables.sql
    - src/lib/__tests__/ir-schemas.test.ts
    - src/lib/__tests__/ir-agent.test.ts
    - src/lib/__tests__/ir-migration.test.ts
  modified:
    - supabase/functions/_shared/ciso-tools.ts
    - src/lib/ciso-tools.ts
    - src/lib/__tests__/ciso-agent.test.ts

key-decisions:
  - "IR agent uses maxSteps: 8 consistent with SOC and Threat Intel agents for Edge Function timeout avoidance"
  - "ALL IR tasks hardcoded to risk_level='high' in delegateToIR tool (IR-04 mandatory approval constraint)"
  - "CISO delegation extension appends IR rules to existing prompt (does not rewrite) -- preserves GRC, SOC, and Threat Intel delegation rules"
  - "Post-incident reports create compliance_snapshots linking incident to compliance impact (Pitfall 6 addressed)"
  - "IR tools persist data via createIrIncident, saveContainmentPlan, savePostIncidentReport during execution -- no separate storeResult needed"

patterns-established:
  - "CISO delegation extension: add delegateToX tool, update CISO_TOOL_NAMES, append delegation rules, add buildCisoPrompt cases"
  - "IR mandatory approval: risk_level='high' override in delegation tool guarantees approval gate routing"

requirements-completed: [IR-01, IR-02, IR-03, IR-04]

# Metrics
duration: 8min
completed: 2026-03-27
---

# Phase 6 Plan 01: Incident Response Agent Summary

**IR agent with NIST SP 800-61r2 containment playbooks, post-incident reports with compliance impact tracking, and mandatory human approval via risk_level='high' override on all delegated tasks**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-27T21:39:17Z
- **Completed:** 2026-03-27T21:47:46Z
- **Tasks:** 2
- **Files created:** 10
- **Files modified:** 3

## Accomplishments
- IR Edge Function operational at supabase/functions/agent-incident-response/index.ts following established agent skeleton with maxSteps: 8
- IR_SYSTEM_PROMPT encodes NIST SP 800-61r2 four-phase lifecycle (detect, contain, eradicate, recover), mandatory human approval rule, and CMMC controls 3.6.1/3.6.2/3.6.3 references
- 5 domain-specific tools (getEscalatedIncidents, getIncidentContext, createIrIncident, saveContainmentPlan, savePostIncidentReport) all scoped by company_id
- Zod schemas: IncidentTypeSchema (9 enum values), ContainmentRecommendationSchema (with requires_approval=z.literal(true)), PlaybookGuidanceSchema, PostIncidentReportSchema (with compliance_impact object), IrAnalysisResultSchema
- Database migration: ir_incidents table with lifecycle status CHECK (6 states: open/investigating/contained/eradicated/recovered/closed), incident_type CHECK (9 values), severity CHECK (4 values), JSONB columns for containment_plan/playbook/post_incident_report/compliance_impact, RLS, 3 indexes
- CISO Orchestrator extended with delegateToIR tool alongside existing delegateToGRC/delegateToSOC/delegateToThreatIntel -- hub-and-spoke topology maintained with 4 specialist agents
- Post-incident reports create compliance_snapshots linking incident to compliance impact (Pitfall 6 from research addressed)
- 93 new tests across 4 test files (71 IR-specific + 22 updated CISO), 484 total suite passing

## Task Commits

Each task was committed atomically:

1. **Task 1: IR schemas, tools, migration, and test suite**
   - `0024b14` (feat: IR Zod schemas, 5 tools, NIST 800-61r2 prompt, ir_incidents migration, Node mirrors, 71 tests passing)
2. **Task 2: IR Edge Function and CISO delegateToIR extension**
   - `a516efe` (feat: IR Edge Function, CISO delegateToIR with risk_level='high', 484 tests passing)

## Files Created/Modified
- `supabase/functions/agent-incident-response/index.ts` - IR Edge Function handler (3 actions, maxSteps: 8)
- `supabase/functions/_shared/ir-schemas.ts` - Deno Zod schemas for IR structured output
- `supabase/functions/_shared/ir-tools.ts` - IR_SYSTEM_PROMPT, 5 tool definitions, prompt builder (Deno)
- `src/lib/ir-schemas-frontend.ts` - Vitest-compatible Zod schema re-exports
- `src/lib/ir-tools-testable.ts` - Vitest-compatible tool logic re-exports
- `src/types/ir-output.ts` - Frontend TypeScript types for IR output
- `supabase/migrations/20260327400000_ir_agent_tables.sql` - ir_incidents table with lifecycle status
- `src/lib/__tests__/ir-schemas.test.ts` - 31 schema validation tests
- `src/lib/__tests__/ir-agent.test.ts` - 21 agent handler, tool, and structural parity tests
- `src/lib/__tests__/ir-migration.test.ts` - 19 structural migration tests
- `supabase/functions/_shared/ciso-tools.ts` - Extended with delegateToIR tool and IR delegation prompt rules
- `src/lib/ciso-tools.ts` - Node mirror updated with matching CISO_TOOL_NAMES and IR delegation prompt
- `src/lib/__tests__/ciso-agent.test.ts` - Updated to validate delegateToIR, IR delegation, and IR Edge Function structure

## Decisions Made
- **maxSteps: 8 for IR agent:** Consistent with SOC and Threat Intel agents (Pitfall 5). Limits multi-step tool usage to stay within the 150-second Edge Function timeout.
- **risk_level='high' hardcoded in delegateToIR:** The delegateToIR tool's execute function ALWAYS sets risk_level:'high' in the delegateTask() call, overriding whatever priority the CISO Orchestrator provides. This is the mechanism guaranteeing IR-04 (human approval required for all IR actions).
- **CISO prompt append-only:** Added IR Delegation rules as a new section appended to existing CISO_SYSTEM_PROMPT. Did NOT rewrite existing GRC, SOC, or Threat Intel delegation rules. Same pattern established in 05-01 and 05-02.
- **Compliance snapshot on post-incident report (Pitfall 6):** savePostIncidentReport tool creates a compliance_snapshot row linking the incident to compliance impact, ensuring IR reports are visible on the compliance dashboard.
- **Tool-based persistence:** IR agent stores incidents via createIrIncident, containment plans via saveContainmentPlan, and reports via savePostIncidentReport during execution. No separate storeResult function needed -- same pattern as SOC and Threat Intel.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- IR agent operational with containment recommendations, playbook guidance, and post-incident reports
- CISO Orchestrator can now delegate to GRC, SOC, Threat Intel, and IR -- 4 specialist agents in hub-and-spoke topology
- ir_incidents table ready for compliance dashboard integration
- Post-incident reports feed into compliance_snapshots for CMMC control impact tracking
- agent-worker already routes incident-response to agent-incident-response Edge Function (pre-registered)
- Phase 6 can continue with AppSec agent (06-02) and Pen Test agent (06-03)

## Self-Check: PASSED

- 10/10 created files exist
- 3/3 modified files verified
- 2/2 commits verified (0024b14, a516efe)
- 484/484 tests passing (full suite)

---
*Phase: 06-advanced-agents*
*Completed: 2026-03-27*
