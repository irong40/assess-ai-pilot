---
phase: 4
slug: onboarding-and-access
status: draft
nyquist_compliant: true
wave_0_complete: true
wave_0_note: "Inline TDD approach — all plans use tdd='true' tasks creating test files before implementation."
created: 2026-03-27
---

# Phase 4 — Validation Strategy

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
| 04-01-01 | 01 | 1 | ONBD-01, ONBD-02, ONBD-03 | unit | `npx vitest run src/lib/__tests__/onboarding.test.ts src/lib/__tests__/trial-status.test.ts --bail 1` | inline TDD | pending |
| 04-02-01 | 02 | 1 | ONBD-04 | unit | `npx vitest run src/lib/__tests__/agent-permissions.test.ts --bail 1` | inline TDD | pending |

*Status: pending / green / red / flaky*

---

## Inline TDD Approach

All plans use `tdd="true"` on code-producing tasks.

**Test files created inline by each plan:**

| Plan | Test File | Covers |
|------|-----------|--------|
| 04-01 | `src/lib/__tests__/onboarding.test.ts` | ONBD-02, ONBD-03 |
| 04-01 | `src/lib/__tests__/trial-status.test.ts` | ONBD-01 |
| 04-02 | `src/lib/__tests__/agent-permissions.test.ts` | ONBD-04 |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| New org signup creates company + trial | ONBD-01 | Requires live Supabase Auth | Sign up new user, verify company row with trial_ends_at |
| Onboarding seeds assessment from profile | ONBD-03 | Requires live DB with controls | Complete onboarding, verify assessment created with mapped fields |
| Trial expiry redirects to upgrade page | ONBD-01 | Requires expired trial state | Set trial_ends_at to past, verify redirect |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 addressed via inline TDD
- [x] No watch-mode flags
- [x] Feedback latency < 25s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
