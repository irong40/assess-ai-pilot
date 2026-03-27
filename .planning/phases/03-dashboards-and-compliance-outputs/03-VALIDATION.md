---
phase: 3
slug: dashboards-and-compliance-outputs
status: draft
nyquist_compliant: true
wave_0_complete: true
wave_0_note: "Inline TDD approach — all plans use tdd='true' tasks creating test files before implementation."
created: 2026-03-27
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2 + @testing-library/react 16.3 |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --bail 1` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --bail 1`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Created By | Status |
|---------|------|------|-------------|-----------|-------------------|------------|--------|
| 03-01-01 | 01 | 1 | DASH-01, DASH-02 | unit | `npx vitest run src/lib/__tests__/agent-dashboard.test.ts --bail 1` | inline TDD | pending |
| 03-01-02 | 01 | 1 | DASH-03, DASH-04 | unit | `npx vitest run src/lib/__tests__/agent-approvals.test.ts src/lib/__tests__/agent-settings.test.ts --bail 1` | inline TDD | pending |
| 03-02-01 | 02 | 1 | REPT-01, REPT-02, REPT-03, REPT-04 | unit | `npx vitest run src/lib/__tests__/compliance-dashboard.test.ts --bail 1` | inline TDD | pending |
| 03-02-02 | 02 | 1 | REPT-05, REPT-06 | unit | `npx vitest run src/lib/__tests__/drift-monitor.test.ts src/lib/__tests__/reassessment.test.ts --bail 1` | inline TDD | pending |
| 03-03-01 | 03 | 2 | CMMC-06, CMMC-07 | unit | `npx vitest run src/lib/__tests__/evidence-management.test.ts --bail 1` | inline TDD | pending |
| 03-03-02 | 03 | 2 | CMMC-08, CMMC-09, CMMC-10 | unit | `npx vitest run src/lib/__tests__/ssp-export.test.ts src/lib/__tests__/poam-export.test.ts src/lib/__tests__/evidence-matrix-export.test.ts --bail 1` | inline TDD | pending |

*Status: pending / green / red / flaky*

---

## Inline TDD Approach

All plans use `tdd="true"` on code-producing tasks. RED-GREEN-REFACTOR cycle within each task.

**Test files created inline by each plan:**

| Plan | Test File | Covers |
|------|-----------|--------|
| 03-01 | `src/lib/__tests__/agent-dashboard.test.ts` | DASH-01, DASH-02 |
| 03-01 | `src/lib/__tests__/agent-approvals.test.ts` | DASH-03 |
| 03-01 | `src/lib/__tests__/agent-settings.test.ts` | DASH-04 |
| 03-02 | `src/lib/__tests__/compliance-dashboard.test.ts` | REPT-01, REPT-02, REPT-03, REPT-04 |
| 03-02 | `src/lib/__tests__/drift-monitor.test.ts` | REPT-05 |
| 03-02 | `src/lib/__tests__/reassessment.test.ts` | REPT-06 |
| 03-03 | `src/lib/__tests__/evidence-management.test.ts` | CMMC-06, CMMC-07 |
| 03-03 | `src/lib/__tests__/ssp-export.test.ts` | CMMC-08 |
| 03-03 | `src/lib/__tests__/poam-export.test.ts` | CMMC-09 |
| 03-03 | `src/lib/__tests__/evidence-matrix-export.test.ts` | CMMC-10 |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent dashboard shows live status updates | DASH-01 | Requires Supabase Realtime subscription | Run agent task, verify dashboard updates in real-time |
| Approval actions take effect on agent tasks | DASH-03 | Requires live approval flow | Approve/reject from dashboard, verify agent resumes/stops |
| SSP PDF opens and renders correctly | CMMC-08 | PDF visual verification | Export SSP, open in viewer, check 14 sections present |
| Drift alerts trigger on score change | REPT-05 | Requires live re-assessment | Run two assessments, verify notification on delta |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 addressed via inline TDD (no separate plan needed)
- [x] No watch-mode flags
- [x] Feedback latency < 25s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (inline TDD satisfies Nyquist requirement)
