---
phase: 2
slug: core-agents
status: draft
nyquist_compliant: true
wave_0_complete: true
wave_0_note: "Inline TDD approach — all plans use tdd='true' tasks creating test files before implementation."
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2 (jsdom environment) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --bail 1` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --bail 1`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Created By | Status |
|---------|------|------|-------------|-----------|-------------------|------------|--------|
| 02-01-01 | 01 | 1 | GRC-01, CMMC-05 | unit | `npx vitest run src/lib/__tests__/grc-agent.test.ts --bail 1` | inline TDD | pending |
| 02-01-02 | 01 | 1 | GRC-02, GRC-03 | unit | `npx vitest run src/lib/__tests__/grc-schemas.test.ts --bail 1` | inline TDD | pending |
| 02-01-03 | 01 | 1 | GRC-04 | unit | `npx vitest run src/lib/__tests__/compliance-tracking.test.ts --bail 1` | inline TDD | pending |
| 02-01-04 | 01 | 1 | GRC-05 | unit | `npx vitest run src/lib/__tests__/grc-agent.test.ts --bail 1` | inline TDD | pending |
| 02-02-01 | 02 | 1 | CISO-01, CISO-03 | unit | `npx vitest run src/lib/__tests__/ciso-agent.test.ts --bail 1` | inline TDD | pending |
| 02-02-02 | 02 | 1 | CISO-02, CISO-04 | unit | `npx vitest run src/lib/__tests__/ciso-schemas.test.ts --bail 1` | inline TDD | pending |
| 02-02-03 | 02 | 1 | CISO-05 | unit | `npx vitest run src/lib/__tests__/agent-hooks.test.ts --bail 1` | inline TDD | pending |
| 02-03-01 | 03 | 2 | DATA-03 | unit | `npx vitest run src/lib/__tests__/data-architecture.test.ts --bail 1` | inline TDD | pending |

*Status: pending / green / red / flaky*

---

## Inline TDD Approach

All plans use `tdd="true"` on code-producing tasks. RED-GREEN-REFACTOR cycle within each task.

**Test files created inline by each plan:**

| Plan | Test File | Covers |
|------|-----------|--------|
| 02-01 | `src/lib/__tests__/grc-agent.test.ts` | GRC-01, GRC-05, CMMC-05 |
| 02-01 | `src/lib/__tests__/grc-schemas.test.ts` | GRC-02, GRC-03 |
| 02-01 | `src/lib/__tests__/compliance-tracking.test.ts` | GRC-04 |
| 02-02 | `src/lib/__tests__/ciso-agent.test.ts` | CISO-01, CISO-03, CISO-04 |
| 02-02 | `src/lib/__tests__/ciso-schemas.test.ts` | CISO-02 |
| 02-02 | `src/lib/__tests__/agent-hooks.test.ts` | CISO-05 |
| 02-03 | `src/lib/__tests__/data-architecture.test.ts` (update) | DATA-03 |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GRC agent produces meaningful gap analysis from real documents | GRC-01 | Requires Claude API + real CMMC controls | Upload test document, invoke GRC agent, review gap report quality |
| CISO agent delegates to GRC and generates executive summary | CISO-01, CISO-02 | Requires live agent orchestration | Trigger CISO task, verify GRC subtask created, verify summary output |
| Approval gate blocks high-risk GRC findings | CISO-03 | Requires live approval flow | Trigger finding with risk_level='high', verify blocked until approved |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 addressed via inline TDD (no separate plan needed)
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (inline TDD satisfies Nyquist requirement)
