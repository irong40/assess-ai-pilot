---
phase: 04-onboarding-and-access
verified: 2026-03-26T10:26:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 4: Onboarding and Access Verification Report

**Phase Goal:** New customer organizations can sign up for a trial, go through a guided onboarding flow that seeds their initial assessment, and have role-based access extended to agent-specific permissions — making the product ready for external customers.
**Verified:** 2026-03-26T10:26:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                        | Status     | Evidence                                                                                                      |
|----|----------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------|
| 1  | New user signup creates a company with 14-day trial period                                   | VERIFIED   | `handle_new_user()` trigger in migration inserts company with `trial_ends_at = now() + interval '14 days'`    |
| 2  | Authenticated user who has not completed onboarding is redirected to /onboarding             | VERIFIED   | `ProtectedRoute.tsx` lines 59-65: navigates to `/onboarding` when `!onboardingComplete`                       |
| 3  | Onboarding wizard collects org profile, tech stack, and compliance goals across 4 steps      | VERIFIED   | Steps 1-4 components exist and are rendered conditionally in `Onboarding.tsx` via `currentStep` state         |
| 4  | Completing onboarding seeds an initial assessment with mapped fields from onboarding data    | VERIFIED   | `Onboarding.tsx` line 57: `createAssessment.mutateAsync` called with `system_name`, `environment`, `compliance_scope`, `status` |
| 5  | Trial banner shows remaining days in the AppLayout header                                    | VERIFIED   | `AppLayout.tsx` line 87: `<TrialBanner>` rendered conditionally when `trialStatus === 'trial'`                |
| 6  | Expired trial redirects to /trial-expired page                                               | VERIFIED   | `ProtectedRoute.tsx` lines 52-55: `navigate('/trial-expired')` when `isExpired && currentPath !== '/trial-expired'` |
| 7  | Each role has agent-specific permissions controlling configure, approve, and view_logs       | VERIFIED   | `company_agent_permissions` table with UNIQUE(company_id, role, agent_type), seeded with correct matrix       |
| 8  | Admin can configure, approve, and view logs for all agents                                   | VERIFIED   | Migration CROSS JOIN seed: `can_configure=true, can_approve=true, can_view_logs=true` for admin               |
| 9  | ISSM can approve and view logs but cannot configure agents                                   | VERIFIED   | Seed: `can_configure=false, can_approve=true, can_view_logs=true` for issm                                    |
| 10 | ISSO can only view agent logs                                                                | VERIFIED   | Seed: `can_configure=false, can_approve=false, can_view_logs=true` for isso                                   |
| 11 | Viewer has no agent-specific permissions                                                     | VERIFIED   | Seed: all false for viewer role                                                                                |
| 12 | ApprovalQueue respects can_approve permission from the new table                             | VERIFIED   | `ApprovalQueue.tsx` line 129: `permissionsMap?.get(approval.agent_type)?.canApprove ?? false` gates buttons   |
| 13 | Agent settings page respects can_configure permission                                        | VERIFIED   | `AgentSettingsForm.tsx` lines 41, 92-114, 153: `canConfigure` disables save button and all form inputs        |
| 14 | Existing companies get default permission rows via migration backfill                        | VERIFIED   | Migration uses CROSS JOIN seed with ON CONFLICT DO NOTHING; trigger auto-seeds for new companies              |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact                                                               | Expected                                                          | Status     | Details                                                                                   |
|------------------------------------------------------------------------|-------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| `supabase/migrations/20260327200000_trial_and_onboarding.sql`          | Trial columns, onboarding_profiles table, updated trigger         | VERIFIED   | Contains `trial_ends_at`, `trial_status`, `onboarding_completed`, `onboarding_profiles`, updated `handle_new_user` |
| `src/hooks/useTrialStatus.ts`                                          | Returns daysLeft, isExpired, isLoading, trialEndsAt               | VERIFIED   | 70 lines; queries companies table, handles active/trial/expired states, uses date-fns     |
| `src/hooks/useOnboarding.ts`                                           | Onboarding profile CRUD and completion status                     | VERIFIED   | 115 lines; isComplete, saveProfile (upsert), completeOnboarding (mutation), profileQuery  |
| `src/pages/Onboarding.tsx`                                             | 4-step onboarding wizard container page                           | VERIFIED   | 172 lines; manages currentStep state, chains 3 mutations on final submit, navigates to /dashboard |
| `src/components/ProtectedRoute.tsx`                                    | Route guard with trial and onboarding checks                      | VERIFIED   | Both useTrialStatus and useOnboarding called; path-safe redirects to /trial-expired and /onboarding |
| `src/components/onboarding/TrialBanner.tsx`                            | Amber banner showing remaining trial days                         | VERIFIED   | 28 lines; uses differenceInDays, returns null for non-trial or expired                    |
| `src/pages/TrialExpired.tsx`                                           | Trial expired page with contact info                              | VERIFIED   | 34 lines; shows sales@sentinelai.com, no nav (correct for expired state)                  |
| `src/routes/ProtectedRoutes.tsx`                                       | /onboarding and /trial-expired routes registered without NDAGate  | VERIFIED   | Lines 25-40: both routes wrapped in ProtectedRoute only, no NDAGate                       |
| `supabase/migrations/20260327200001_agent_permissions.sql`             | company_agent_permissions table, RLS, seed, trigger               | VERIFIED   | 125 lines; UNIQUE constraint, 4 RLS policies, CROSS JOIN seed, AFTER INSERT trigger       |
| `src/hooks/useAgentPermissions.ts`                                     | useAgentPermissions + useAllAgentPermissions                      | VERIFIED   | Both exports present; deny-by-default on error; Map-based batch variant                  |
| `src/components/agents/ApprovalQueue.tsx`                              | Approval queue using permission hook, not hardcoded role          | VERIFIED   | Imports useAllAgentPermissions; canApprove gate at line 129                               |
| `src/components/agents/AgentSettingsForm.tsx`                          | Settings form guarded by canConfigure                             | VERIFIED   | Imports useAgentPermissions; canConfigure disables save + inputs + shows helper text      |
| `src/lib/__tests__/trial-status.test.ts`                               | 5 tests for useTrialStatus hook                                   | VERIFIED   | All 5 pass                                                                                |
| `src/lib/__tests__/onboarding.test.ts`                                 | 6 tests for useOnboarding hook                                    | VERIFIED   | All 6 pass                                                                                |
| `src/lib/__tests__/agent-permissions.test.ts`                          | 12 tests for permission hook and role matrix                      | VERIFIED   | All 12 pass                                                                               |

---

### Key Link Verification

| From                                   | To                                       | Via                                         | Status  | Details                                                                |
|----------------------------------------|------------------------------------------|---------------------------------------------|---------|------------------------------------------------------------------------|
| `src/components/ProtectedRoute.tsx`    | `src/hooks/useTrialStatus.ts`            | `useTrialStatus()` hook call                | WIRED   | Imported at line 5; called at line 19; `isExpired` drives redirect     |
| `src/pages/Onboarding.tsx`             | `src/hooks/useAssessments.tsx`           | `createAssessment.mutateAsync` on final step | WIRED   | Imported at line 5; `createAssessment.mutateAsync` called at line 57   |
| `src/components/layout/AppLayout.tsx`  | `src/components/onboarding/TrialBanner.tsx` | `TrialBanner` rendered in header           | WIRED   | Imported at line 7; rendered at line 88 conditional on `trialStatus`   |
| `src/hooks/useAgentPermissions.ts`     | supabase `company_agent_permissions`     | SELECT where company_id, role, agent_type   | WIRED   | `.from('company_agent_permissions')` at lines 55 and 93                |
| `src/components/agents/ApprovalQueue.tsx` | `src/hooks/useAgentPermissions.ts`    | `useAllAgentPermissions()` hook call        | WIRED   | Imported at line 31; called at line 62; result used at line 129        |
| `src/components/agents/AgentSettingsForm.tsx` | `src/hooks/useAgentPermissions.ts` | `canConfigure` disables save button       | WIRED   | Imported at line 28; called at line 40; `canConfigure` at lines 92-153 |

All 6 key links: WIRED.

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                              | Status     | Evidence                                                                           |
|-------------|-------------|--------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------|
| ONBD-01     | 04-01       | New organizations can sign up with a 14-30 day trial period with full access | SATISFIED | `handle_new_user` trigger creates company with `trial_ends_at = now() + 14 days`   |
| ONBD-02     | 04-01       | Guided onboarding flow captures org profile, tech stack, and compliance goals | SATISFIED | 4-step wizard: Step1=org profile, Step2=tech stack, Step3=goals/CMMC level, Step4=confirm |
| ONBD-03     | 04-01       | Onboarding seeds initial assessment from org profile data                 | SATISFIED | `createAssessment.mutateAsync` called with fields mapped from `formData` in `handleSubmit` |
| ONBD-04     | 04-02       | Existing role-based access extended to agent-specific permissions         | SATISFIED | `company_agent_permissions` table with per-role, per-agent-type `can_configure`, `can_approve`, `can_view_logs` columns |

All 4 required IDs satisfied. No orphaned requirements for Phase 4.

---

### Anti-Patterns Found

No anti-patterns detected across key files.

- No TODO/FIXME/PLACEHOLDER comments in any phase 04 files
- `return null` occurrences in hooks are appropriate early-exit guards (when `!profile?.company_id`), not stubs
- No empty handler implementations (`() => {}`)
- No console.log-only implementations
- No hardcoded role checks remaining in ApprovalQueue (replaced by permission hook)

---

### Human Verification Required

#### 1. Onboarding redirect loop behavior

**Test:** Sign in as a new user with `onboarding_completed = false`, navigate to `/dashboard`, then complete the onboarding wizard.
**Expected:** Immediate redirect to `/onboarding`; wizard completes and navigates to `/dashboard` without looping.
**Why human:** Redirect loop prevention depends on React Router render cycle behavior that can't be verified statically.

#### 2. Trial banner display timing

**Test:** Sign in as a user with a company where `trial_status = 'trial'` and `trial_ends_at` is 5 days from now.
**Expected:** Amber banner appears between header and main content area showing "Trial period: 5 days remaining."
**Why human:** Visual rendering in AppLayout between header and `<main>` requires browser.

#### 3. Trial expiry redirect

**Test:** Set `trial_status = 'expired'` on a company in the database, then try to navigate to `/dashboard`.
**Expected:** Immediate redirect to `/trial-expired` page showing contact info. No app navigation accessible.
**Why human:** Requires live Supabase state manipulation; can't test pure DB-driven redirect statically.

#### 4. AgentSettingsForm read-only state for ISSO

**Test:** Sign in as a user with `role = 'isso'`, navigate to agent settings.
**Expected:** All checkboxes and the threshold select are disabled; save button is disabled; helper text "You do not have permission to configure agent settings." is visible.
**Why human:** Visual disabled state and helper text display requires browser rendering.

---

### Gaps Summary

No gaps found. All 14 truths verified, all 15 artifacts substantive and wired, all 6 key links confirmed. Full test suite passes: 253 tests across 25 test files with 0 failures.

---

_Verified: 2026-03-26T10:26:00Z_
_Verifier: Claude (gsd-verifier)_
