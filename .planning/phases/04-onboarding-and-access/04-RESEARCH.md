# Phase 4: Onboarding and Access - Research

**Researched:** 2026-03-26
**Domain:** Trial management, multi-step onboarding wizard, assessment seeding, role-based agent permissions
**Confidence:** HIGH

---

## Summary

Phase 4 adds three new capabilities on top of a fully-built Phases 1-3 foundation: (1) a trial period lifecycle tracked in the `companies` table, (2) a guided onboarding wizard that collects org profile, tech stack, and compliance goals, and (3) extension of the existing role enum into agent-specific permission columns.

The most important architectural decision is where trial state lives. The `companies` table is the right anchor — it is already the multi-tenant root, all data is scoped to it by `company_id`, and RLS policies already use it. Adding `trial_ends_at` and `trial_status` columns to `companies` requires one migration and touches no existing queries. The onboarding wizard is a new React multi-step component following the same pattern as the existing `SelfAssessmentWizard` (step state in `useState`, progression guarded in the component, final step triggers DB writes). Assessment seeding is a straightforward mutation that calls `createAssessment` with pre-populated fields derived from onboarding answers. Agent-specific permissions are best stored as JSONB in a new `agent_permissions` column on `profiles` or in a dedicated `company_agent_permissions` table — the latter is preferred because it keeps permission grants at the company level where agents operate, not at the individual user level.

**Primary recommendation:** Add trial columns to `companies`, build a 4-step onboarding wizard as a new page/flow post-signup, seed assessment via existing `createAssessment` hook, and extend permissions via a new `company_agent_permissions` table with RLS mirroring `agent_settings`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBD-01 | New organizations can sign up with a 14-30 day trial period with full access | Add `trial_ends_at TIMESTAMPTZ` and `trial_status TEXT` to `companies`; enforce in `ProtectedRoute` via `useTrialStatus` hook |
| ONBD-02 | Guided onboarding flow captures organization profile, tech stack, and compliance goals | New 4-step wizard page at `/onboarding`; stores data in new `onboarding_profiles` table linked to `company_id` |
| ONBD-03 | Onboarding seeds initial assessment from organization profile data | Final onboarding step calls `createAssessment` mutation with fields mapped from onboarding answers; sets `system_name`, `environment`, `compliance_scope` |
| ONBD-04 | Existing role-based access extended to agent-specific permissions | New `company_agent_permissions` table: `(company_id, role, agent_type, can_configure, can_approve, can_view_logs)`; checked in agent hooks and ApprovalQueue |
</phase_requirements>

---

## Standard Stack

### Core (already in project — no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.49 | DB mutations, RLS-enforced reads | Already the data layer |
| @tanstack/react-query | 5.x | Server state, mutations, cache invalidation | All data hooks use this |
| React Router v6 | 6.x | Route guards, navigation after onboarding | Already the router |
| shadcn/ui | latest | Step indicator, form inputs, progress | Already the component library |
| vitest + @testing-library/react | current | Unit + component tests | Existing test infra at `src/lib/__tests__/` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | (already in project) | `addDays(now, 14)` for trial_ends_at | Trial end date calculation |
| zod | (if added) | Onboarding form schema validation | Only if project adopts it; currently forms use component-local validation |

**No new npm installs required** — all needed libraries are already in the project.

---

## Architecture Patterns

### Pattern 1: Trial State on `companies` Table

**What:** Add `trial_ends_at TIMESTAMPTZ` and `trial_status TEXT CHECK (trial_status IN ('trial', 'active', 'expired', 'cancelled'))` to the `companies` table. Set `trial_ends_at = now() + interval '14 days'` and `trial_status = 'trial'` in the Supabase Auth trigger that creates the company row on first signup.

**Why this table:** Every authenticated user's `company_id` is already fetched in `useUserProfile`. All existing RLS policies scope by `company_id`. Putting trial state on `companies` means one query gives you auth, role, AND trial status — no extra round trips.

**Trial enforcement:** A new `useTrialStatus` hook queries `companies` for `trial_ends_at` and `trial_status`. `ProtectedRoute` wraps this hook and redirects to `/trial-expired` if status is `expired` or `trial_ends_at < now()`. Full platform access is granted during trial — no feature gating needed (ONBD-01 spec: "full access").

**Trial banner:** A `TrialBanner` component rendered in `AppLayout` displays days remaining when `trial_status === 'trial'`. Uses `differenceInDays(trial_ends_at, now())` from date-fns.

```typescript
// Migration: add trial columns to companies
ALTER TABLE public.companies
  ADD COLUMN trial_ends_at TIMESTAMPTZ,
  ADD COLUMN trial_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (trial_status IN ('trial', 'active', 'expired', 'cancelled'));

-- Set trial for all existing companies (retroactive default)
UPDATE public.companies
  SET trial_ends_at = created_at + interval '14 days',
      trial_status = 'trial'
  WHERE trial_ends_at IS NULL;

-- Make trial_ends_at NOT NULL after backfill
ALTER TABLE public.companies ALTER COLUMN trial_ends_at SET NOT NULL;
```

### Pattern 2: Onboarding Wizard as a New Page Flow

**What:** A 4-step React component at `/onboarding` that collects: (Step 1) organization name and size, (Step 2) primary tech stack (multi-select from preset options), (Step 3) compliance goals and target CMMC level, (Step 4) confirmation + assessment seed preview. Uses local `useState` for step progression, one final mutation to persist.

**Where it fits:** Triggered automatically after email confirmation redirect to `/`. `ProtectedRoute` checks a new boolean `onboarding_completed` on the `companies` row — if false, redirects to `/onboarding`. After final step, sets `onboarding_completed = true` and navigates to `/dashboard`.

**Data model:** New `onboarding_profiles` table (company-scoped JSONB is the simplest approach — avoids schema migration sprawl for flexible onboarding data):

```sql
CREATE TABLE public.onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  org_size TEXT,                          -- 'small' | 'medium' | 'large'
  primary_tech_stack TEXT[] DEFAULT '{}', -- ['aws', 'windows-server', 'ms365', ...]
  compliance_goals TEXT[] DEFAULT '{}',   -- ['cmmc-l1', 'cmmc-l2', 'sprs-score']
  target_cmmc_level INT DEFAULT 1,        -- 1 or 2
  system_name TEXT,                       -- feeds assessment.system_name
  environment TEXT,                       -- feeds assessment.environment
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Pattern follows existing wizard:** The existing `SelfAssessmentWizard` manages step state with `useState`, navigates domains sequentially, and writes via mutations. The onboarding wizard follows the same pattern — local step state, guard buttons disabled until step is valid, final step triggers two mutations (insert `onboarding_profiles` row + create initial assessment).

### Pattern 3: Assessment Seeding from Onboarding Data

**What:** After onboarding Step 4 confirmation, call the existing `createAssessment` mutation from `useAssessments` hook with fields mapped from onboarding answers:

```typescript
// Mapping from onboarding_profiles -> assessments.Insert
createAssessment.mutate({
  system_name: onboardingData.system_name || `${companyName} IT Systems`,
  environment: onboardingData.environment || 'cloud',          // 'cloud' | 'on-premise' | 'hybrid'
  compliance_scope: onboardingData.target_cmmc_level === 2 ? 'CMMC Level 2' : 'CMMC Level 1',
  status: 'in_progress',
});
```

`createAssessment` already handles `user_id` and `company_id` injection from the authenticated user's profile. No changes to the existing hook are needed. The seeded assessment navigates the user to the `WizardHub` for that assessment_id on completion.

**What "seeding" does NOT mean here:** ONBD-03 says "seeds initial assessment from organization profile data." This means pre-populating the assessment record's metadata fields (`system_name`, `environment`, `compliance_scope`) from onboarding answers — not pre-filling `assessment_responses`. Pre-filling responses would require mapping tech stack selections to specific NIST control answers, which is a complex heuristic and out of scope for v1. The correct interpretation is creating a ready-to-start assessment with sensible defaults.

### Pattern 4: Agent-Specific Permissions Table

**What:** A new `company_agent_permissions` table that stores which roles within a company can perform which actions on which agents. This extends — not replaces — the existing `user_role` enum.

```sql
CREATE TABLE public.company_agent_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  agent_type public.agent_type NOT NULL,
  can_configure BOOLEAN NOT NULL DEFAULT false,  -- can edit agent_settings
  can_approve BOOLEAN NOT NULL DEFAULT false,    -- can approve/reject in ApprovalQueue
  can_view_logs BOOLEAN NOT NULL DEFAULT false,  -- can view audit_log for this agent
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, role, agent_type)
);
```

**Default seed data:** Insert defaults at company creation time (in the same trigger that sets trial dates). Sensible defaults matching existing RLS patterns:

| Role | can_configure | can_approve | can_view_logs |
|------|---------------|-------------|---------------|
| admin | true | true | true |
| issm | false | true | true |
| isso | false | false | true |
| viewer | false | false | false |

**Where enforced:** The existing `ApprovalQueue` component checks `profile.role` against `['admin', 'issm']` already (from decision [03-01]). With ONBD-04, it instead queries `company_agent_permissions` for `can_approve = true`. The `useAgentSettings` hook similarly checks `can_configure`. Both hooks add a `useAgentPermissions(agentType)` call that returns `{ canConfigure, canApprove, canViewLogs }`.

**RLS mirrors `agent_settings`:** Same policy pattern — all company users can SELECT, only admin can INSERT/UPDATE/DELETE permission rows.

### Recommended Project Structure (new files only)

```
src/
├── components/
│   ├── onboarding/
│   │   ├── OnboardingStep1OrgProfile.tsx   # org name, size
│   │   ├── OnboardingStep2TechStack.tsx    # multi-select tech stack
│   │   ├── OnboardingStep3Goals.tsx        # compliance goals, CMMC level
│   │   ├── OnboardingStep4Confirm.tsx      # review + seed preview
│   │   └── TrialBanner.tsx                 # days remaining banner in AppLayout
├── hooks/
│   ├── useOnboarding.ts                    # TanStack Query hook for onboarding_profiles
│   ├── useTrialStatus.ts                   # trial_ends_at + trial_status from companies
│   └── useAgentPermissions.ts              # per-agent role permission lookup
├── pages/
│   └── Onboarding.tsx                      # container page routing the 4 steps
supabase/
└── migrations/
    └── 20260327200000_onboarding_and_trial.sql  # trial columns, onboarding_profiles, agent_permissions
```

### Anti-Patterns to Avoid

- **Do not store trial state in profiles.** Trial is a company-level concept. One company row = one trial period. Storing it per-user creates split-brain.
- **Do not add `can_configure` / `can_approve` columns directly to `profiles`.** Agent permissions are company-wide policies for a role, not per-user overrides. A table with `(company_id, role, agent_type)` PK is the right model.
- **Do not redirect to `/onboarding` from every ProtectedRoute.** Check `onboarding_completed` once in the root `ProtectedRoute` wrapper, not per-page. Otherwise the redirect fires inside every nested route.
- **Do not pre-populate assessment_responses during seeding.** Mapping tech stack tags to CMMC control answers is a heuristics minefield. Seed the assessment metadata; let the user fill responses via the existing wizard.
- **Do not create a separate trial enforcement edge function.** Trial expiry is a `companies` row read. The client can check `trial_ends_at < new Date()` with full confidence — no server-side enforcement step is needed for a UI-only gate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-step form state | Custom step manager with reducer | React `useState` step index + array of step components | Wizard has 4 linear steps — no branching logic |
| Trial expiry check | Cron job or edge function | Client-side `trial_ends_at < now()` in `useTrialStatus` | DB timestamp comparison in client is reliable for UI gating |
| Permission lookup | Custom RBAC engine | Simple `company_agent_permissions` SELECT in `useAgentPermissions` | RLS enforces it at DB level; client just reads the row |
| Onboarding persistence | Complex state machine | Single upsert to `onboarding_profiles` on final step | No partial-save requirement; full form submitted at end |

---

## Common Pitfalls

### Pitfall 1: `onboarding_completed` gate causes infinite redirect loops

**What goes wrong:** `ProtectedRoute` checks `onboarding_completed` and redirects to `/onboarding`. If the `/onboarding` route itself is wrapped in `ProtectedRoute`, it triggers the same check and loops.
**How to avoid:** Add `/onboarding` as a special case in `ProtectedRoute` — only check `onboarding_completed` when the current path is NOT `/onboarding`. Alternatively, put `/onboarding` outside `ProtectedRoutes.tsx` and inside a lighter `AuthenticatedRoute` that only checks `useAuth().user`.

### Pitfall 2: Trial gate fires before `companies` row is loaded

**What goes wrong:** `useTrialStatus` queries `companies` via `useUserProfile` → `company_id` chain. On first load, profile is still fetching. If `ProtectedRoute` reads `trialStatus` before profile loads, it sees `undefined` and incorrectly redirects.
**How to avoid:** `useTrialStatus` must return `{ isLoading: true }` while the profile query is in flight. `ProtectedRoute` only evaluates trial status after `isLoading === false`.

### Pitfall 3: `createAssessment` requires `company_id` but onboarding runs before profile has `company_id`

**What goes wrong:** The signup flow creates the `auth.users` row, triggers email confirmation, then user is redirected. At that point, the database trigger that creates the `companies` row and sets `profiles.company_id` may not have run yet.
**How to avoid:** The Supabase Auth trigger (or a `handle_new_user` function) must be verified to create the `companies` row synchronously on signup. The onboarding wizard should check that `profile.company_id` is non-null before enabling Step 1. A loading state handles the brief gap.

### Pitfall 4: Agent permissions table not seeded for existing companies

**What goes wrong:** The migration adds `company_agent_permissions` but existing companies have no rows. Any hook that queries the table returns empty, and all permission checks default to `false`, locking existing users out of agent features.
**How to avoid:** The migration must include a seed `INSERT ... SELECT` that populates default rows for all existing companies × all roles × all agent types. A `handle_new_company` trigger should also insert defaults for future companies.

### Pitfall 5: `user_role` enum has `viewer` but codebase uses `user` in some places

**What goes wrong:** `types.ts` line 1093 shows `user_role: "admin" | "issm" | "isso" | "viewer"` but earlier decisions reference a `user` role. `RoleBasedRoute` line 41 reads `profile?.role || 'viewer'` as fallback. Any permission seed data using `'user'` will violate the CHECK constraint.
**How to avoid:** Confirm the actual enum values from the migration before seeding permission rows. The live enum from `types.ts` is `admin | issm | isso | viewer`. Use `viewer` consistently, not `user`.

---

## Code Examples

### Trial Banner (TrialBanner.tsx sketch)
```typescript
// Pattern: read trial_ends_at from companies row via useTrialStatus hook
import { differenceInDays } from 'date-fns';

export function TrialBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const daysLeft = differenceInDays(new Date(trialEndsAt), new Date());
  if (daysLeft < 0) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-sm text-amber-700">
      Trial period: {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining.
    </div>
  );
}
```

### Agent Permission Check Pattern (useAgentPermissions.ts sketch)
```typescript
// Source: follows useAgentSettings pattern (src/hooks/useAgentSettings.ts)
export function useAgentPermissions(agentType: string) {
  const { data: profile } = useUserProfile();

  return useQuery({
    queryKey: ['agent-permissions', profile?.company_id, profile?.role, agentType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_agent_permissions')
        .select('can_configure, can_approve, can_view_logs')
        .eq('company_id', profile!.company_id)
        .eq('role', profile!.role)
        .eq('agent_type', agentType)
        .single();
      if (error) return { canConfigure: false, canApprove: false, canViewLogs: false };
      return {
        canConfigure: data.can_configure,
        canApprove: data.can_approve,
        canViewLogs: data.can_view_logs,
      };
    },
    enabled: !!profile?.company_id && !!profile?.role,
  });
}
```

### Default Permission Seed (migration fragment)
```sql
-- Seed default agent permissions for all existing companies
INSERT INTO public.company_agent_permissions
  (company_id, role, agent_type, can_configure, can_approve, can_view_logs)
SELECT
  c.id,
  r.role::public.user_role,
  a.agent_type::public.agent_type,
  CASE WHEN r.role = 'admin' THEN true ELSE false END,
  CASE WHEN r.role IN ('admin', 'issm') THEN true ELSE false END,
  CASE WHEN r.role IN ('admin', 'issm', 'isso') THEN true ELSE false END
FROM public.companies c
CROSS JOIN (VALUES ('admin'), ('issm'), ('isso'), ('viewer')) AS r(role)
CROSS JOIN (
  SELECT unnest(enum_range(NULL::public.agent_type)) AS agent_type
) a
ON CONFLICT (company_id, role, agent_type) DO NOTHING;
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.ts at repo root) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/__tests__/onboarding.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBD-01 | `useTrialStatus` returns correct days-remaining and expired state | unit | `npx vitest run src/lib/__tests__/trial-status.test.ts` | Wave 0 |
| ONBD-01 | `ProtectedRoute` redirects to `/trial-expired` when trial is expired | unit | `npx vitest run src/lib/__tests__/onboarding.test.ts` | Wave 0 |
| ONBD-02 | Onboarding wizard advances through 4 steps and persists data | unit | `npx vitest run src/lib/__tests__/onboarding.test.ts` | Wave 0 |
| ONBD-03 | `createAssessment` called with fields mapped from onboarding profile | unit | `npx vitest run src/lib/__tests__/onboarding.test.ts` | Wave 0 |
| ONBD-04 | `useAgentPermissions` returns correct booleans per role | unit | `npx vitest run src/lib/__tests__/agent-permissions.test.ts` | Wave 0 |
| ONBD-04 | `ApprovalQueue` hides approve/reject buttons when `can_approve === false` | unit | `npx vitest run src/lib/__tests__/agent-permissions.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/__tests__/onboarding.test.ts src/lib/__tests__/trial-status.test.ts src/lib/__tests__/agent-permissions.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/trial-status.test.ts` — covers ONBD-01 trial expiry logic
- [ ] `src/lib/__tests__/onboarding.test.ts` — covers ONBD-02 wizard flow + ONBD-03 assessment seed
- [ ] `src/lib/__tests__/agent-permissions.test.ts` — covers ONBD-04 permission hook + ApprovalQueue guard

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Trial gating via separate subscription table | Trial columns on `companies` | Simpler for v1; `BILL-01` (Stripe) deferred to v2 |
| Per-user permission rows | Company-level role × agent_type matrix | Matches how agents operate (company scope, not user scope) |
| Onboarding data in `profiles` JSONB | Dedicated `onboarding_profiles` table | Cleaner schema; easier to query; avoids polluting profiles |

**Deferred (v2):**
- Stripe subscription gating (`BILL-01`, `BILL-02`) — trial period is the only commercial mechanism in v1
- Admin UI to manually set trial_status to `'active'` for converted customers — can be done directly in Supabase dashboard for v1

---

## Open Questions

1. **Who creates the `companies` row on signup?**
   - What we know: `profiles.company_id NOT NULL` is enforced. A default company fallback exists in early migrations.
   - What's unclear: Is there a `handle_new_user` trigger that auto-creates a company row, or does the signup flow require an explicit company name field?
   - Recommendation: During Wave 0, read the Supabase Auth trigger (`handle_new_user` function in migrations) to confirm. If no auto-create exists, the onboarding Step 1 form becomes the company creation point — `createAssessment` can only be called after Step 1 writes the company row and triggers profile update.

2. **What is the `agent_type` enum's exact values?**
   - What we know: `agent_type` is used in `agent_approvals`, `agent_tasks`, `agent_settings` tables.
   - What's unclear: The full list of valid values (grc_analyst, ciso_orchestrator, soc_analyst, etc.) — needed for the permissions seed.
   - Recommendation: Read the `agent_type` enum definition from the `20260326140047_agent_infrastructure.sql` migration before writing the permissions seed.

---

## Sources

### Primary (HIGH confidence)
- `src/integrations/supabase/types.ts` — full DB schema including `companies`, `profiles`, `agent_settings`, `user_role` enum
- `src/hooks/useAuth.tsx` — signup flow, email confirmation pattern
- `src/hooks/useAssessments.tsx` — `createAssessment` mutation signature
- `src/components/RoleBasedRoute.tsx` — existing role check pattern
- `src/components/agents/ApprovalQueue.tsx` — existing approval role check
- `supabase/migrations/20260327100000_agent_settings.sql` — `agent_settings` RLS pattern to mirror for `company_agent_permissions`
- `supabase/migrations/20260326180000_approval_gates.sql` — `agent_type` enum usage, approval role enforcement

### Secondary (MEDIUM confidence)
- Existing wizard pattern (`src/components/wizard/`, `src/pages/WizardHub.tsx`) — inferred onboarding wizard structure
- Decision log in `STATE.md` — [03-01] confirms admin/issm approval gate pattern; [Roadmap] confirms billing deferred to v2

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all existing dependencies verified from source
- Architecture patterns: HIGH — patterns derived directly from existing codebase code, not assumptions
- Pitfalls: HIGH — all pitfalls identified from concrete code inspection (enum values, RLS patterns, redirect logic)
- Open questions: Items are targeted and answerable by reading one migration file each

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable stack; only risk is upstream Supabase Auth trigger behavior)
