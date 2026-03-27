---
phase: 6
slug: advanced-agents
status: draft
nyquist_compliant: true
wave_0_complete: true
wave_0_note: "Inline TDD approach — all plans use tdd='true' tasks creating test files before implementation."
created: 2026-03-27
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2 (jsdom environment) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --bail 1` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~35 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --bail 1`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Created By | Status |
|---------|------|------|-------------|-----------|-------------------|------------|--------|
| 06-01-01 | 01 | 1 | IR-01, IR-03 | unit | `npx vitest run src/lib/__tests__/ir-schemas.test.ts --bail 1` | inline TDD | pending |
| 06-01-02 | 01 | 1 | IR-02, IR-04 | unit | `npx vitest run src/lib/__tests__/ir-agent.test.ts --bail 1` | inline TDD | pending |
| 06-02-01 | 02 | 2 | ASEC-01, ASEC-03 | unit | `npx vitest run src/lib/__tests__/appsec-schemas.test.ts --bail 1` | inline TDD | pending |
| 06-02-02 | 02 | 2 | ASEC-02, ASEC-04 | unit | `npx vitest run src/lib/__tests__/appsec-agent.test.ts --bail 1` | inline TDD | pending |
| 06-03-01 | 03 | 3 | PENT-01, PENT-03 | unit | `npx vitest run src/lib/__tests__/pen-test-schemas.test.ts --bail 1` | inline TDD | pending |
| 06-03-02 | 03 | 3 | PENT-02, PENT-04 | unit | `npx vitest run src/lib/__tests__/pen-test-agent.test.ts --bail 1` | inline TDD | pending |

*Status: pending / green / red / flaky*

---

## Inline TDD Approach

All plans use `tdd="true"` on code-producing tasks.

**Test files created inline by each plan:**

| Plan | Test File | Covers |
|------|-----------|--------|
| 06-01 | `src/lib/__tests__/ir-schemas.test.ts` | IR-01, IR-03 |
| 06-01 | `src/lib/__tests__/ir-agent.test.ts` | IR-02, IR-04 |
| 06-02 | `src/lib/__tests__/appsec-schemas.test.ts` | ASEC-01, ASEC-03 |
| 06-02 | `src/lib/__tests__/appsec-agent.test.ts` | ASEC-02, ASEC-04 |
| 06-03 | `src/lib/__tests__/pen-test-schemas.test.ts` | PENT-03 |
| 06-03 | `src/lib/__tests__/pen-test-agent.test.ts` | PENT-01, PENT-02, PENT-04 |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| IR generates useful containment guidance | IR-01 | Requires Claude API + real incident data | Escalate SOC alert, verify IR playbook quality |
| IR approval gate blocks all actions | IR-04 | Requires live approval flow | Trigger IR task, verify blocked until human approves |
| AppSec finds real vulnerabilities in manifest | ASEC-01 | Requires live Claude API | Upload package.json, verify CVE matches |
| Pen Test authorization required before scan | PENT-04 | Requires live approval flow | Trigger pen test, verify auth gate blocks execution |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 addressed via inline TDD
- [x] No watch-mode flags
- [x] Feedback latency < 35s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
