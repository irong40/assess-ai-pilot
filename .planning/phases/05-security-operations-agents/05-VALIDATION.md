---
phase: 5
slug: security-operations-agents
status: draft
nyquist_compliant: true
wave_0_complete: true
wave_0_note: "Inline TDD approach — all plans use tdd='true' tasks creating test files before implementation."
created: 2026-03-27
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2 (jsdom environment) |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --bail 1` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --bail 1`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Created By | Status |
|---------|------|------|-------------|-----------|-------------------|------------|--------|
| 05-01-01 | 01 | 1 | SOC-01, SOC-03 | unit | `npx vitest run src/lib/__tests__/soc-schemas.test.ts --bail 1` | inline TDD | pending |
| 05-01-02 | 01 | 1 | SOC-01, SOC-02, SOC-04 | unit | `npx vitest run src/lib/__tests__/soc-agent.test.ts --bail 1` | inline TDD | pending |
| 05-02-01 | 02 | 1 | THRT-01, THRT-02, THRT-04 | unit | `npx vitest run src/lib/__tests__/threat-intel-schemas.test.ts --bail 1` | inline TDD | pending |
| 05-02-02 | 02 | 1 | THRT-01, THRT-03 | unit | `npx vitest run src/lib/__tests__/threat-intel-agent.test.ts --bail 1` | inline TDD | pending |

*Status: pending / green / red / flaky*

---

## Inline TDD Approach

All plans use `tdd="true"` on code-producing tasks.

**Test files created inline by each plan:**

| Plan | Test File | Covers |
|------|-----------|--------|
| 05-01 | `src/lib/__tests__/soc-schemas.test.ts` | SOC-01, SOC-03 |
| 05-01 | `src/lib/__tests__/soc-agent.test.ts` | SOC-01, SOC-02, SOC-04 |
| 05-02 | `src/lib/__tests__/threat-intel-schemas.test.ts` | THRT-01, THRT-02, THRT-04 |
| 05-02 | `src/lib/__tests__/threat-intel-agent.test.ts` | THRT-01, THRT-03 |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SOC agent triages live NVD CVEs | SOC-01 | Requires Claude API + live CVE data | Run SOC triage task, verify alert quality |
| Threat Intel generates relevant threat brief | THRT-02 | Requires Claude API + company tech stack | Run threat brief for company, verify relevance |
| SOC escalates to CISO | SOC-04 | Requires live agent orchestration | Trigger high-severity alert, verify CISO receives escalation |
| IOCs visible on agent dashboard | THRT-04 | Requires live frontend + data | Run threat intel, check agent dashboard for IOC data |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 addressed via inline TDD
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
