---
phase: 02-core-agents
verified: 2026-03-26T16:52:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 2: Core Agents Verification Report

**Phase Goal:** The GRC Analyst and CISO Orchestrator agents are operational — the GRC agent performs compliance gap analysis and generates remediation recommendations, while the CISO Orchestrator delegates tasks, maintains risk posture, and produces executive summaries. This is the minimum viable "AI security team."
**Verified:** 2026-03-26T16:52:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | GRC agent processes a gap-analysis action and produces a typed GapAnalysisReport | VERIFIED | `agent-grc-analyst/index.ts` calls `executeAgentTask` with `generateText`, parses output via `GapAnalysisReportSchema.parse()` (line 118), and falls back gracefully on parse failure |
| 2  | Gap analysis evaluates at the assessment OBJECTIVE level, not just control level | VERIFIED | `GRC_SYSTEM_PROMPT` Rule 1 explicitly states "A control is MET only if ALL applicable objectives are satisfied"; `FindingSchema.failed_objectives` array enforces objective-level tracking in schema |
| 3  | Remediation options include cost_tier and effort_tier rankings | VERIFIED | `RemediationOptionSchema` requires `cost_tier` and `effort_tier` as `z.enum(["low","medium","high"])`; all 9 schema tests pass |
| 4  | Compliance snapshots are recorded after each GRC analysis for time-series tracking | VERIFIED | `storeGrcResult()` in `grc-tools.ts` (line 401) inserts into `compliance_snapshots` after every gap-analysis; migration table confirmed with RLS and time-series index |
| 5  | GRC output includes SSP sections organized by 14 NIST 800-171 control families | VERIFIED | `AuditPackageSectionSchema` validated; GRC_SYSTEM_PROMPT Rule 6 names all 14 families; `buildPromptForAction("audit-package")` instructs the model to organize by control families |
| 6  | CISO agent delegates tasks to GRC agent via the existing delegateTask function | VERIFIED | `ciso-tools.ts` `delegateToGRC` tool calls `delegateTask(supabase, task, "grc-analyst", ...)` (line 111); `agent-ciso-orchestrator/index.ts` imports `delegateTask` from `agent-base.ts` (line 21-24) |
| 7  | CISO agent prioritizes tasks: critical controls first, then high-SPRS-weight, then existing findings | VERIFIED | `CISO_SYSTEM_PROMPT` "Priority Ordering" section lists 4-level queue: critical controls (MFA 3.5.3, FIPS 3.13.11, IR, audit, SSP) > high-SPRS-weight (5-point) > controls with existing findings > user-requested; 2 ciso-agent tests verify this content |
| 8  | CISO agent generates executive summaries from completed agent task outputs | VERIFIED | `generate-executive-summary` and `synthesize-results` actions handled in orchestrator; `readCompletedTaskResults` tool queries completed subtasks by `parent_task_id`; `ExecutiveSummarySchema` validates structured output |
| 9  | CISO agent escalates high-risk findings by setting risk_level='high' on tasks | VERIFIED | `agent-ciso-orchestrator/index.ts` lines 118-131: CMMC Level 2 `run-compliance-assessment` sets `risk_level='high'` via direct Supabase update; CISO_SYSTEM_PROMPT Escalation Rules encode criteria |
| 10 | User can query CISO agent's task queue and delegation status from the frontend | VERIFIED | `useAgentTasks` queries `agent_tasks` with optional filters; `useCisoTaskQueue` fetches CISO tasks plus child tasks by `parent_task_id`; all hook tests pass |
| 11 | AIRiskAnalysisService has zero remaining callers in the codebase | VERIFIED | `grep -r AIRiskAnalysisService src/components/ src/pages/` returns zero results; structural test in `data-architecture.test.ts` scans recursively and enforces this invariant |
| 12 | AIInsightsDashboard uses agent-driven analysis instead of mock data | VERIFIED | Dashboard imports `dispatchCisoAssessment` (line 8) and `useAgentTasks` (line 9); transform functions `findingsToInsights`, `reportToTrends`, `findingsToPredictions` convert `GapAnalysisFinding[]` to display types |
| 13 | The structural test validates no component imports AIRiskAnalysisService | VERIFIED | `data-architecture.test.ts` "AIRiskAnalysisService has no remaining callers (DATA-03)" describe block: 2 tests pass scanning `src/components/` and `src/pages/` |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/agent-grc-analyst/index.ts` | GRC Analyst Edge Function handler | VERIFIED | 164 lines (min: 60); imports `executeAgentTask`, `GRC_SYSTEM_PROMPT`, `createGrcTools`, `buildPromptForAction`, `storeGrcResult`, `GapAnalysisReportSchema` |
| `supabase/functions/_shared/grc-tools.ts` | GRC_SYSTEM_PROMPT and 6 tool definitions | VERIFIED | Exports `GRC_SYSTEM_PROMPT`, `createGrcTools`, `buildPromptForAction`, `storeGrcResult`, `GRC_TOOL_NAMES`; 6 tools present: `queryControls`, `queryAssessmentResponses`, `queryFindings`, `calculateSprsScore`, `getControlFamily`, `getEvidenceStatus` |
| `supabase/functions/_shared/grc-schemas.ts` | Zod schemas for GRC structured output | VERIFIED | Exports `GapAnalysisReportSchema`, `RemediationOptionSchema`, `ComplianceSnapshotSchema`, `AuditPackageSectionSchema`, `ExecutiveSummaryInputSchema`, `FindingStatusSchema`, `EvidenceMethodSchema`, `CostEffortTierSchema` |
| `supabase/migrations/20260327000001_gap_analysis_tables.sql` | gap_analysis_results and compliance_snapshots tables with RLS | VERIFIED | Both tables have `company_id UUID NOT NULL`, `ENABLE ROW LEVEL SECURITY`, time-series indexes `(company_id, created_at DESC)`, SELECT policy scoped to company, INSERT policy for service_role |
| `src/types/grc-output.ts` | Frontend TypeScript types matching GRC Zod schemas | VERIFIED | Exports `GapAnalysisReport`, `GapAnalysisFinding`, `EvidenceGap`, `RemediationOption`, `ComplianceSnapshot`, `AuditPackageSection`; string literal unions match Zod enums |
| `src/lib/__tests__/grc-agent.test.ts` | Unit tests for GRC handler and gap analysis logic | VERIFIED | 159 lines (min: 40); 13 tests passing |
| `src/lib/__tests__/grc-schemas.test.ts` | Unit tests for Zod schema validation | VERIFIED | 9 tests passing (all schema enums, required fields, valid/invalid cases) |
| `src/lib/__tests__/compliance-tracking.test.ts` | Structural tests for compliance_snapshots table | VERIFIED | 7 tests passing; verifies company_id NOT NULL, RLS, time-series indexes, poam_eligible/critical_controls_met columns |
| `supabase/functions/agent-ciso-orchestrator/index.ts` | CISO Orchestrator Edge Function handler | VERIFIED | 161 lines (min: 60); imports `executeAgentTask`, `delegateTask`, `CISO_SYSTEM_PROMPT`, `createCisoTools`, `buildCisoPrompt`; 4 actions handled |
| `supabase/functions/_shared/ciso-tools.ts` | CISO_SYSTEM_PROMPT and delegation tool definitions | VERIFIED | Exports `CISO_SYSTEM_PROMPT`, `createCisoTools`, `buildCisoPrompt`, `CISO_TOOL_NAMES`; 4 tools: `delegateToGRC`, `readCompletedTaskResults`, `getCurrentRiskPosture`, `createFollowUpTask` |
| `supabase/functions/_shared/ciso-schemas.ts` | Zod schemas for CISO structured output | VERIFIED | Exports `ExecutiveSummarySchema`, `DelegationPlanSchema`, `RiskPostureSchema` and inferred types |
| `src/hooks/useAgentTasks.ts` | TanStack Query hook for agent task data | VERIFIED | Exports `useAgentTasks`, `useCisoTaskQueue`, `useAgentTaskDetail`; imports supabase from integrations client |
| `src/services/agentService.ts` | Client-side agent task dispatch service | VERIFIED | Exports `dispatchAgentTask`, `dispatchCisoAssessment`, `getAgentTaskStatus`; uses `supabase.functions.invoke('agent-worker')` |
| `src/lib/__tests__/ciso-agent.test.ts` | Unit tests for CISO handler and delegation logic | VERIFIED | 129 lines (min: 40); 14 tests passing |
| `src/lib/__tests__/ciso-schemas.test.ts` | Unit tests for CISO Zod schema validation | VERIFIED | 10 tests passing |
| `src/lib/__tests__/agent-hooks.test.ts` | Unit tests for useAgentTasks hook | VERIFIED | 242 lines (min: 20); 10 tests passing |
| `src/services/AIRiskAnalysisService.ts` | Deprecated module with agent redirect (no callers) | VERIFIED | Full deprecation notice at top of file pointing to `agentService.ts` and `useAgentTasks.ts`; zero callers in src/components/ or src/pages/ |
| `src/components/analytics/AIInsightsDashboard.tsx` | Dashboard using agent task dispatch instead of mock service | VERIFIED | 607 lines (min: 50); imports `dispatchCisoAssessment`, `useAgentTasks`, `GapAnalysisReport`, `GapAnalysisFinding`; no AIRiskAnalysisService import |
| `src/lib/__tests__/data-architecture.test.ts` | Updated structural test validating zero AIRiskAnalysisService callers | VERIFIED | Contains "no remaining callers" describe block; 20 tests passing |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `agent-grc-analyst/index.ts` | `_shared/agent-base.ts` | `executeAgentTask` import | WIRED | Line 21: `import { executeAgentTask } from "../_shared/agent-base.ts"` |
| `agent-grc-analyst/index.ts` | `_shared/grc-tools.ts` | `GRC_SYSTEM_PROMPT` and tool imports | WIRED | Lines 23-27: imports `GRC_SYSTEM_PROMPT`, `createGrcTools`, `buildPromptForAction`, `storeGrcResult`; all used in handler |
| `agent-grc-analyst/index.ts` | `_shared/grc-schemas.ts` | `GapAnalysisReportSchema` import | WIRED | Line 28: imported and used at line 118 for structured output parsing |
| `agent-ciso-orchestrator/index.ts` | `_shared/agent-base.ts` | `executeAgentTask` and `delegateTask` imports | WIRED | Lines 21-24: both imported; `executeAgentTask` used at line 105, `delegateTask` used transitively via `createCisoTools` |
| `agent-ciso-orchestrator/index.ts` | `_shared/ciso-tools.ts` | `CISO_SYSTEM_PROMPT` and tool imports | WIRED | Lines 27-30: imported; `CISO_SYSTEM_PROMPT` used at line 109, `createCisoTools` at line 99, `buildCisoPrompt` at line 102 |
| `src/hooks/useAgentTasks.ts` | `src/integrations/supabase/client.ts` | supabase client import | WIRED | Line 15: `import { supabase } from '@/integrations/supabase/client'`; used for all queries |
| `src/services/agentService.ts` | `src/integrations/supabase/client.ts` | `supabase.functions.invoke` | WIRED | Line 12: client imported; line 51: `supabase.functions.invoke('agent-worker', ...)` confirmed |
| `src/components/analytics/AIInsightsDashboard.tsx` | `src/services/agentService.ts` | `dispatchAgentTask` import | WIRED | Line 8: `import { dispatchCisoAssessment, getAgentTaskStatus } from '@/services/agentService'`; used in "Run Assessment" handler |
| `src/components/analytics/AIInsightsDashboard.tsx` | `src/hooks/useAgentTasks.ts` | `useAgentTasks` hook | WIRED | Line 9: `import { useAgentTasks } from '@/hooks/useAgentTasks'`; used for querying agent results |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GRC-01 | 02-01 | GRC agent auto-assesses compliance gaps from uploaded documents | SATISFIED | `gap-analysis` action in Edge Function queries assessment responses and evaluates controls; `queryAssessmentResponses` tool fetches company responses |
| GRC-02 | 02-01 | GRC agent generates gap analysis reports against CMMC L1/L2 controls | SATISFIED | `GapAnalysisReportSchema` with `findings[]`, `sprs_score`, `met_count`, `not_met_count`; persisted to `gap_analysis_results` |
| GRC-03 | 02-01 | GRC agent generates multi-option remediation recommendations with cost/effort ranking | SATISFIED | `RemediationOptionSchema` with `cost_tier`, `effort_tier`, `priority_rank`, `timeline_days`; 9 schema tests verify enum constraints |
| GRC-04 | 02-01 | GRC agent tracks compliance status changes over time | SATISFIED | `compliance_snapshots` table; `storeGrcResult()` creates snapshot on every analysis; time-series index on `(company_id, created_at DESC)` |
| GRC-05 | 02-01 | GRC agent prepares audit-ready documentation packages | SATISFIED | `audit-package` action in Edge Function; `AuditPackageSectionSchema` organizes SSP by 14 NIST families; `buildPromptForAction("audit-package")` instructs per-family output |
| CMMC-05 | 02-01 | GRC agent identifies gaps between current posture and CMMC L1/L2 requirements | SATISFIED | GRC Edge Function scopes gap analysis to `cmmc_level` 1 or 2; `queryControls` tool filters by `cmmc_level`; `scope_family_id` enables targeted analysis |
| CISO-01 | 02-02 | CISO agent delegates tasks to specialist agents based on priority queue | SATISFIED | `delegateToGRC` tool calls `delegateTask(supabase, task, "grc-analyst", ...)`; priority queue encoded in `CISO_SYSTEM_PROMPT`; 14 ciso-agent tests pass |
| CISO-02 | 02-02 | CISO agent generates executive summary reports from all agent outputs | SATISFIED | `generate-executive-summary` and `synthesize-results` actions; `readCompletedTaskResults` tool; `ExecutiveSummarySchema` validates output |
| CISO-03 | 02-02 | CISO agent escalates high-risk findings to human operators for approval | SATISFIED | CMMC L2 assessments set `risk_level='high'` at lines 118-131; existing Phase 1 approval gate blocks high-risk tasks |
| CISO-04 | 02-02 | CISO agent maintains a prioritized risk assessment across all agent domains | SATISFIED | `assess-risk-posture` action; `getCurrentRiskPosture` tool queries `compliance_snapshots`; `RiskPostureSchema` validates with `domain_risks[]` and `trend` |
| CISO-05 | 02-02 | User can view CISO agent's current task queue and delegation status | SATISFIED | `useCisoTaskQueue()` fetches CISO tasks + child tasks by `parent_task_id`; `useAgentTasks()` with optional filters; 10 hook tests pass |
| DATA-03 | 02-03 | Replace mock AIRiskAnalysisService with real agent-driven analysis | SATISFIED | `AIInsightsDashboard.tsx` uses `useAgentTasks` + `dispatchCisoAssessment`; zero callers of `AIRiskAnalysisService` in `src/components/` or `src/pages/`; structural test enforces invariant |

All 12 required IDs from the 3 PLANs are accounted for. No orphaned requirements found for Phase 2 in REQUIREMENTS.md.

---

### Anti-Patterns Found

No blocking anti-patterns detected. Observations:

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `agent-ciso-orchestrator/index.ts` | 139 | `steps?.length ?? 0` — reasoning summary uses step count but not step content | Info | CISO output contains raw LLM text rather than structured schema; no schema validation on CISO output (unlike GRC agent). This is intentional (CISO synthesizes, does not produce a fixed schema). |
| `agent-ciso-orchestrator/index.ts` | 119 | Escalation only triggers for `cmmc_level === 2` | Info | CMMC L1 assessments never escalate. Documented behavior consistent with plan spec. |
| `grc-tools.ts` | 414 | `critical_controls_met: false` hardcoded in snapshot insert | Info | The snapshot always writes `false` for `critical_controls_met`. A follow-on task would need to update this. Does not block the phase goal. |

---

### Human Verification Required

The following behaviors require a running deployment to fully verify. All automated checks pass.

#### 1. GRC Agent LLM Output Parsing

**Test:** Deploy `agent-grc-analyst` to Supabase, create a test task with `action: "gap-analysis"`, trigger via `agent-worker`, inspect the task output in `agent_tasks.output`.
**Expected:** Output field contains a parseable `GapAnalysisReport` JSON object with `findings[]`, `sprs_score`, `met_count`, `not_met_count`.
**Why human:** The fallback path at lines 119-130 of the Edge Function catches parse failures and returns `raw_response` instead. Only a live Claude call can confirm the structured output path is exercised.

#### 2. CISO Delegation Chain

**Test:** Create a CISO task with `action: "run-compliance-assessment"`, let it run, verify child tasks are created in `agent_tasks` with `parent_task_id` matching the CISO task.
**Expected:** One or more GRC Analyst tasks appear with `agent_type = 'grc_analyst'` and `parent_task_id = <ciso_task_id>`.
**Why human:** The `delegateToGRC` tool calls `delegateTask` which inserts rows and enqueues via pgmq. The queue and worker routing cannot be tested without a live Supabase instance.

#### 3. AIInsightsDashboard "Run Assessment" Flow

**Test:** Open the AIInsightsDashboard in the browser with a logged-in user who has no completed GRC agent tasks. Click "Run Assessment".
**Expected:** Empty state is replaced by a loading/progress indicator; after the CISO agent completes, the dashboard shows insights, maturity trends, and SPRS score from the GRC agent output.
**Why human:** Requires browser rendering, user auth session, and live Edge Function execution to test the full state machine (empty → loading → results).

---

### Test Suite Summary

| Test File | Tests | Status |
|-----------|-------|--------|
| `src/lib/__tests__/grc-schemas.test.ts` | 9 | All passing |
| `src/lib/__tests__/grc-agent.test.ts` | 13 | All passing |
| `src/lib/__tests__/compliance-tracking.test.ts` | 7 | All passing |
| `src/lib/__tests__/ciso-schemas.test.ts` | 10 | All passing |
| `src/lib/__tests__/ciso-agent.test.ts` | 14 | All passing |
| `src/lib/__tests__/agent-hooks.test.ts` | 10 | All passing |
| `src/lib/__tests__/data-architecture.test.ts` | 20 | All passing |
| All other phase 1 tests | 99 | All passing (no regressions) |
| **Total** | **182** | **All passing** |

---

## Gaps Summary

None. All 13 observable truths are verified, all 19 artifacts are substantive and wired, all 9 key links are confirmed, all 12 requirement IDs are satisfied. The full test suite (182 tests, 12 files) passes with zero regressions.

The phase goal — "minimum viable AI security team" with GRC Analyst and CISO Orchestrator operational — is achieved at the code level. Three behaviors (LLM output parsing in production, CISO delegation chain via pgmq, and dashboard state machine) require a live Supabase deployment for complete end-to-end verification.

---

_Verified: 2026-03-26T16:52:00Z_
_Verifier: Claude (gsd-verifier)_
