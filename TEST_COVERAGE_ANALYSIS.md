# Test Coverage Analysis

## Current State

**Test coverage: 0%** — The codebase has **zero test files** despite having 145 TypeScript/TSX source files across services, hooks, components, pages, routes, types, and utilities.

Vitest is configured and ready (`vitest.config.ts`, `src/test/setup.ts`), and testing libraries are installed (`@testing-library/react`, `@testing-library/jest-dom`), but no tests have been written. There are also no `test` or `coverage` npm scripts defined in `package.json`.

---

## Priority Areas for Test Coverage

### Priority 1: Pure Functions & Business Logic (High value, easy to test)

These files contain pure logic with no UI or database dependencies — ideal first targets.

| File | What to Test |
|------|-------------|
| `src/types/questionnaire.ts` — `responseCreatesFinding()` | All response types (`yes_no`, `yes_no_partial`, `yes_no_na`, `scale`, `text`) with various inputs. Edge cases: invalid scale values, empty strings, case sensitivity. |
| `src/types/questionnaire.ts` — `riskWeightToSeverity()` | Boundary values at thresholds (3→low, 4→medium, 7→high, 9→critical). Edge cases: 0, negative, very large numbers. |
| `src/types/questionnaire.ts` — `getDomainById()` | Valid domain IDs return correct metadata. Invalid IDs return undefined. |
| `src/lib/utils.ts` — `cn()` | Tailwind class merging/deduplication behavior. |

**Estimated effort**: Low — these are stateless functions with clear inputs/outputs.

---

### Priority 2: Service Layer — `AIRiskAnalysisService` (Medium effort, high value)

`src/services/AIRiskAnalysisService.ts` contains core business logic that can be tested with mock data:

| Method | What to Test |
|--------|-------------|
| `calculateMaturityTrend()` | Trend detection: improving (diff > 0.2), declining (diff < -0.2), stable. Empty historical data defaults. Domain filtering. |
| `calculateDomainMaturity()` (private, test via public API) | Score calculation for pass/partial/fail/unknown. Empty assessment arrays default to 3.0. |
| `predictFutureRisk()` | Risk level transitions: trend > 0.5 decreases risk, trend < -0.5 increases risk, moderate trend stays same. Boundary clamping (can't go below 'low' or above 'critical'). |
| `identifyRiskFactors()` | Known domains return specific factors. Unknown domains return fallback. |

**Note**: `getCurrentRiskLevel()` and `analyzeTrend()` use `Math.random()` — these should be refactored to accept a random source, or tests should mock `Math.random`.

---

### Priority 3: Findings Generator (Medium effort, high value)

`src/services/findingsGenerator.ts` is critical business logic but requires mocking Supabase. Focus on the pure helper functions first:

| Function | What to Test |
|----------|-------------|
| `interpolateTemplate()` | Template variable replacement: `{control_id}`, `{domain_name}`, `{response}`, `{question}`. Multiple replacements in one template. Missing variables left as-is. |
| `buildFindingDescription()` | Response label mapping: 'no' → 'Not Implemented', 'partial' → 'Partially Implemented', other → 'Response: X'. Inclusion/exclusion of help_text. |

For database-dependent functions (`generateFindingFromResponse`, `createFinding`, `syncFindingWithResponse`, `generateAllFindings`):
- Mock `supabase` client
- Test error handling paths (query failures return null/false/0)
- Test `syncFindingWithResponse` branching: creates finding when `createsFinding=true` and none exists, removes finding when `createsFinding=false`
- Test `generateAllFindings` deduplication logic (skips questions with existing findings)

---

### Priority 4: Authentication Logic (High value, medium effort)

`src/hooks/useAuth.tsx` — `validateDoDPassword()` enforces DoD password policy. This is security-critical and highly testable:

| Test Case | Details |
|-----------|---------|
| Minimum length | Passwords < 12 chars fail; >= 12 chars pass |
| Character classes | Must have uppercase, lowercase, digit, and special character |
| Sequential characters | Three or more repeated chars (`aaa`) fail |
| Common patterns | `123`, `abc`, `qwe`, `password`, `admin`, `welcome` rejected |
| Personal info | Password containing first name, last name, or email prefix rejected (only when > 2 chars) |
| Edge cases | Empty strings, unicode, extremely long passwords |

**Recommendation**: Extract `validateDoDPassword` into a standalone utility so it can be unit-tested without rendering the AuthProvider.

---

### Priority 5: Route Guards (Medium effort, high value)

`src/components/ProtectedRoute.tsx` and `src/components/RoleBasedRoute.tsx` control access to the entire app:

| Component | What to Test |
|-----------|-------------|
| `ProtectedRoute` | Shows loading state when auth is loading. Redirects to `/auth` when no user. Renders children when authenticated. |
| `RoleBasedRoute` | Redirects unauthenticated users. Shows "Access Denied" for wrong role. Renders children for correct role. Defaults to 'viewer' when profile has no role. Supports multiple required roles. |

Requires mocking `useAuth`, `useUserProfile`, and `react-router-dom`'s `useNavigate`.

---

### Priority 6: AI Service Layer (Medium effort)

`src/services/aiService.ts` contains RAG, POA&M, Audit, and Threat Intel services — all Supabase-dependent. Key test targets:

| Service | What to Test |
|---------|-------------|
| `ragService.query()` | Throws when not authenticated. Passes correct params to edge function. Handles error responses. |
| `poamService.getSummary()` | Correctly counts statuses (open, in_progress, completed). Overdue calculation: entries past `scheduled_completion_date` and not completed. Severity bucketing. |
| `poamService.getAll()` | Filter application: status, riskLevel, assessmentId filters are properly chained. |
| `auditService.exportToCSV()` | CSV header correctness. Proper escaping of quotes in cell values. Handles empty log arrays. |
| `threatIntelService.getSummary()` | Time-window filtering (last24h, last7d). Severity counts. Exploited count. |

---

### Priority 7: Key UI Components (Higher effort)

After the logic layer is covered, add component tests for critical user flows:

| Component | What to Test |
|-----------|-------------|
| `src/components/wizard/*` | `QuestionCard` renders question text and response options. `ScoreDisplay` shows correct score/color. `DomainProgress` shows completion percentage. |
| `src/components/FileUpload.tsx` | File type validation. Size limit enforcement. Upload progress display. |
| `src/components/ErrorBoundary.tsx` | Catches child component errors. Renders fallback UI. |
| `src/pages/Auth.tsx` | Form validation. Sign-in/sign-up toggle. Error message display. |

---

## Recommended Implementation Plan

### Phase 1 — Foundation (Week 1)
1. Add npm scripts to `package.json`: `"test": "vitest"`, `"test:coverage": "vitest --coverage"`
2. Install `@vitest/coverage-v8` for coverage reporting
3. Write tests for Priority 1 (pure functions) — target: ~20 tests
4. Write tests for Priority 4 (password validation, extracted to utility) — target: ~15 tests

### Phase 2 — Business Logic (Week 2)
5. Write tests for Priority 2 (AIRiskAnalysisService) — target: ~15 tests
6. Write tests for Priority 3 (findingsGenerator helpers + mocked DB calls) — target: ~20 tests

### Phase 3 — Integration (Week 3)
7. Write tests for Priority 5 (route guards) — target: ~10 tests
8. Write tests for Priority 6 (AI service layer with mocked Supabase) — target: ~15 tests

### Phase 4 — Components (Week 4)
9. Write tests for Priority 7 (key UI components) — target: ~15 tests
10. Set coverage thresholds in vitest config (suggest: 60% lines minimum)

---

## Suggested Refactoring to Improve Testability

1. **Extract `validateDoDPassword`** from `useAuth.tsx` into `src/lib/passwordValidation.ts` — enables unit testing without React context.
2. **Extract `interpolateTemplate` and `buildFindingDescription`** — already module-level functions but not exported. Export them for direct testing.
3. **Inject randomness in `AIRiskAnalysisService`** — `getCurrentRiskLevel()` and `analyzeTrend()` use `Math.random()`, making them non-deterministic. Accept an optional RNG parameter.
4. **Add Supabase client abstraction** — Create a thin interface over `supabase` to simplify mocking in service tests.

---

## Coverage Targets

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| Line coverage | 15% | 35% | 50% | 60%+ |
| Branch coverage | 20% | 40% | 55% | 65%+ |
| Test count | ~35 | ~70 | ~95 | ~110+ |
