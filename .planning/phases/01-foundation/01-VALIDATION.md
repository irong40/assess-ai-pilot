---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 1 — Validation Strategy

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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CMMC-03 | unit | `npx vitest run src/lib/__tests__/oscal-parser.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | CMMC-01, CMMC-02 | unit | `npx vitest run src/lib/__tests__/oscal-parser.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | CMMC-04 | unit | `npx vitest run src/lib/__tests__/sprs-calculator.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INFRA-01 | unit | `npx vitest run src/lib/__tests__/agent-state.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | INFRA-02 | integration | Manual — requires Supabase connection | N/A | ⬜ pending |
| 01-02-03 | 02 | 1 | INFRA-03 | integration | Manual — requires deployed Edge Function + API key | N/A | ⬜ pending |
| 01-03-01 | 03 | 2 | INFRA-05 | unit | `npx vitest run src/lib/__tests__/approval-gate.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | INFRA-06 | integration | Manual — verify via Supabase Dashboard after test agent run | N/A | ⬜ pending |
| 01-03-03 | 03 | 2 | INFRA-07, INFRA-08 | unit | `npx vitest run src/lib/__tests__/agent-base.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-03-04 | 03 | 2 | DATA-01 | unit | `npx vitest run src/lib/__tests__/data-architecture.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/oscal-parser.test.ts` — stubs for CMMC-01, CMMC-02, CMMC-03
- [ ] `src/lib/__tests__/sprs-calculator.test.ts` — stubs for CMMC-04
- [ ] `src/lib/__tests__/agent-state.test.ts` — stubs for INFRA-01
- [ ] `src/lib/__tests__/approval-gate.test.ts` — stubs for INFRA-05
- [ ] `src/lib/__tests__/agent-base.test.ts` — stubs for INFRA-07, INFRA-08
- [ ] `src/lib/__tests__/data-architecture.test.ts` — stubs for DATA-01

*Existing infrastructure covers framework — no install needed.*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
