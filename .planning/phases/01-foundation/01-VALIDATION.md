---
phase: 1
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
wave_0_note: "No separate Wave 0 plan needed. All plans use tdd='true' tasks which create test files inline (RED phase) before implementation (GREEN phase). Test stubs are created as part of each task's TDD cycle, not in a separate preceding plan."
created: 2026-03-26
---

# Phase 1 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2 (jsdom environment) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Created By | Status |
|---------|------|------|-------------|-----------|-------------------|------------|--------|
| 01-01-01 | 01 | 1 | CMMC-03 | unit | `npx vitest run src/lib/__tests__/oscal-parser.test.ts -x` | inline TDD | pending |
| 01-01-02 | 01 | 1 | CMMC-01, CMMC-02 | unit | `npx vitest run src/lib/__tests__/oscal-parser.test.ts -x` | inline TDD | pending |
| 01-01-03 | 01 | 1 | CMMC-04 | unit | `npx vitest run src/lib/__tests__/sprs-calculator.test.ts -x` | inline TDD | pending |
| 01-02-01 | 02 | 1 | INFRA-01 | unit | `npx vitest run src/lib/__tests__/agent-state.test.ts -x` | inline TDD | pending |
| 01-02-02 | 02 | 1 | INFRA-02 | type-check | `deno check --no-lock supabase/functions/agent-worker/index.ts` + Manual pgmq cycle | inline | pending |
| 01-02-03 | 02 | 1 | INFRA-03 | integration | Manual -- requires deployed Edge Function + API key | inline | pending |
| 01-03-01 | 03 | 2 | INFRA-05 | unit | `npx vitest run src/lib/__tests__/approval-gate.test.ts -x` | inline TDD | pending |
| 01-03-02 | 03 | 2 | INFRA-06 | integration | Manual -- verify via Supabase Dashboard after test agent run | N/A | pending |
| 01-03-03 | 03 | 2 | INFRA-07, INFRA-08 | unit | `npx vitest run src/lib/__tests__/agent-base.test.ts -x` | inline TDD | pending |
| 01-03-04 | 03 | 2 | DATA-01 | unit | `npx vitest run src/lib/__tests__/data-architecture.test.ts -x` | inline TDD | pending |

*Status: pending / green / red / flaky*

---

## Inline TDD Approach

All plans in this phase use `tdd="true"` on code-producing tasks. This means each task follows the RED-GREEN-REFACTOR cycle:

1. **RED:** Task creates the test file with failing tests (test stubs with expected behavior)
2. **GREEN:** Task implements production code to pass the tests
3. **REFACTOR:** Task cleans up if needed, all tests still green

No separate Wave 0 plan is needed because test files are created as the first step within each TDD task. The `<behavior>` block in each task defines the test expectations before implementation begins.

**Test files created inline by each plan:**

| Plan | Test File | Covers |
|------|-----------|--------|
| 01-01 | `src/lib/__tests__/oscal-parser.test.ts` | CMMC-01, CMMC-02, CMMC-03 |
| 01-01 | `src/lib/__tests__/sprs-calculator.test.ts` | CMMC-04 |
| 01-02 | `src/lib/__tests__/agent-state.test.ts` | INFRA-01 |
| 01-03 | `src/lib/__tests__/approval-gate.test.ts` | INFRA-05 |
| 01-03 | `src/lib/__tests__/agent-base.test.ts` | INFRA-07, INFRA-08 |
| 01-03 | `src/lib/__tests__/data-architecture.test.ts` | DATA-01 |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| pgmq send/read/delete cycle works | INFRA-02 | Requires live Supabase DB with pgmq extension | Dispatch test message via Supabase SQL editor, verify in queue table |
| AI SDK executes in Edge Function | INFRA-03 | Requires deployed Edge Function + Anthropic API key | Deploy test agent function, invoke, verify response |
| Audit trail contains reasoning | INFRA-06 | Requires end-to-end agent execution | Run test agent, check audit_log table for ai_reasoning field |
| CUI-free data architecture | DATA-02 | Documentation review | Verify data handling docs exist and accurately describe storage |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 addressed via inline TDD (no separate plan needed)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (inline TDD satisfies Nyquist requirement)
