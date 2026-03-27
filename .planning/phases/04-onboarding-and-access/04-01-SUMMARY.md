---
phase: 04-onboarding-and-access
plan: 01
subsystem: auth, onboarding, database
tags: [trial, onboarding, wizard, supabase, react, date-fns, rls]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: companies table, profiles table, handle_new_user trigger, RLS patterns
  - phase: 02-core-agents
    provides: useAssessments hook with createAssessment mutation
provides:
  - Trial lifecycle columns on companies table (trial_ends_at, trial_status, onboarding_completed)
  - onboarding_profiles table with RLS
  - useTrialStatus hook for trial state
  - useOnboarding hook for onboarding CRUD and completion
  - 4-step onboarding wizard page at /onboarding
  - TrialBanner component in AppLayout header
  - TrialExpired page at /trial-expired
  - Updated ProtectedRoute with trial/onboarding gates
  - Updated handle_new_user trigger creating per-signup companies
affects: [04-02, 05-agents-and-chat, 06-polish]

# Tech tracking
tech-stack:
  added: [date-fns (differenceInDays)]
  patterns: [onboarding wizard with step state, trial lifecycle hooks, path-based redirect loop prevention]

key-files:
  created:
    - supabase/migrations/20260327200000_trial_and_onboarding.sql
    - src/hooks/useTrialStatus.ts
    - src/hooks/useOnboarding.ts
    - src/components/onboarding/OnboardingStep1OrgProfile.tsx
    - src/components/onboarding/OnboardingStep2TechStack.tsx
    - src/components/onboarding/OnboardingStep3Goals.tsx
    - src/components/onboarding/OnboardingStep4Confirm.tsx
    - src/components/onboarding/TrialBanner.tsx
    - src/pages/Onboarding.tsx
    - src/pages/TrialExpired.tsx
    - src/lib/__tests__/trial-status.test.ts
    - src/lib/__tests__/onboarding.test.ts
  modified:
    - src/components/ProtectedRoute.tsx
    - src/components/layout/AppLayout.tsx
    - src/routes/ProtectedRoutes.tsx

key-decisions:
  - "New signups get admin role (org owner) instead of viewer -- they own their company"
  - "Path-based redirect loop prevention in ProtectedRoute (/onboarding and /trial-expired excluded from redirect checks)"
  - "Converted customers (trial_status=active) never show as expired regardless of trial_ends_at date"
  - "Onboarding profiles use upsert on company_id unique constraint for idempotent saves"

patterns-established:
  - "Onboarding wizard: useState for currentStep, form data passed down via props, final step chains 3 async mutations"
  - "Trial gating: ProtectedRoute checks trial + onboarding status after auth, uses path checks to avoid redirect loops"
  - "TrialBanner: rendered conditionally in AppLayout when trialStatus === trial"

requirements-completed: [ONBD-01, ONBD-02, ONBD-03]

# Metrics
duration: 7min
completed: 2026-03-27
---

# Phase 4 Plan 1: Trial & Onboarding Summary

**14-day trial lifecycle with 4-step onboarding wizard that seeds initial CMMC assessment from org profile data**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-27T14:13:57Z
- **Completed:** 2026-03-27T14:21:33Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- Trial lifecycle: new signups get 14-day trial with per-company isolation
- 4-step onboarding wizard captures org profile, tech stack, and CMMC compliance goals
- Final onboarding step automatically seeds first assessment with mapped fields (system_name, environment, compliance_scope)
- ProtectedRoute gates trial expiry and onboarding completion with loop-safe redirects
- TrialBanner shows remaining trial days in the application header

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration, hooks, and trial/onboarding logic with tests** - `a99d750` (feat - TDD)
2. **Task 2: Onboarding wizard components and page** - `dfd4dfb` (feat)
3. **Task 3: Trial banner, route guards, and layout wiring** - `be404af` (feat)

## Files Created/Modified
- `supabase/migrations/20260327200000_trial_and_onboarding.sql` - Trial columns, onboarding_profiles table, updated handle_new_user trigger
- `src/hooks/useTrialStatus.ts` - Trial status hook (daysLeft, isExpired, trialStatus)
- `src/hooks/useOnboarding.ts` - Onboarding CRUD, isComplete, saveProfile, completeOnboarding
- `src/components/onboarding/OnboardingStep1OrgProfile.tsx` - Org name, size, system name inputs
- `src/components/onboarding/OnboardingStep2TechStack.tsx` - Multi-select for 12 tech platforms
- `src/components/onboarding/OnboardingStep3Goals.tsx` - CMMC level, goals, environment
- `src/components/onboarding/OnboardingStep4Confirm.tsx` - Review summary with assessment preview
- `src/components/onboarding/TrialBanner.tsx` - Amber banner showing trial days remaining
- `src/pages/Onboarding.tsx` - Wizard container with step state and final submission logic
- `src/pages/TrialExpired.tsx` - Trial expired message with contact info
- `src/components/ProtectedRoute.tsx` - Added trial expiry and onboarding gates with path checks
- `src/components/layout/AppLayout.tsx` - TrialBanner integration between header and main content
- `src/routes/ProtectedRoutes.tsx` - Added /onboarding and /trial-expired routes
- `src/lib/__tests__/trial-status.test.ts` - 5 tests for useTrialStatus hook
- `src/lib/__tests__/onboarding.test.ts` - 6 tests for useOnboarding hook

## Decisions Made
- New signups get admin role (org owner) instead of viewer -- they create and own their company
- Path-based redirect loop prevention: ProtectedRoute excludes /onboarding and /trial-expired from redirect checks
- Converted customers (trial_status='active') never show as expired regardless of trial_ends_at
- Onboarding profile uses upsert on company_id unique constraint for idempotent saves across wizard revisits
- RLS on onboarding_profiles mirrors agent_settings pattern: same-company read, admin-only write

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed flaky trial-status test day boundary**
- **Found during:** Task 2 verification
- **Issue:** differenceInDays returns inconsistent results when test time crosses day boundary (14 vs 13)
- **Fix:** Changed test to use +15 days at noon and assert >= 14 instead of exact match
- **Files modified:** src/lib/__tests__/trial-status.test.ts
- **Verification:** Test passes consistently in isolation and full suite
- **Committed in:** dfd4dfb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test robustness improvement. No scope creep.

## Issues Encountered
- Pre-existing flaky test in agent-approvals.test.ts (timing-dependent waitFor) -- not caused by this plan's changes, out of scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Trial and onboarding infrastructure is complete for Plan 04-02 (RBAC and invitation system)
- ProtectedRoute is now the single enforcement point for auth + trial + onboarding
- New users flow: signup -> /onboarding wizard -> assessment seeded -> /dashboard

## Self-Check: PASSED

- 12/12 created files verified present
- 3/3 task commits verified in git log

---
*Phase: 04-onboarding-and-access*
*Completed: 2026-03-27*
