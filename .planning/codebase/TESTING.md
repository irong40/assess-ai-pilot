# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts`
- Environment: `jsdom` (browser DOM simulation)
- Globals enabled (`globals: true`) — no need to import `describe`, `it`, `expect`

**Assertion Library:**
- `@testing-library/jest-dom` 6.6.3 — extended matchers (`toBeInTheDocument`, `toHaveValue`, etc.)
- Standard Vitest `expect` assertions

**Component Testing:**
- `@testing-library/react` 16.3.0

**Path resolution:**
- `@/` alias resolves to `src/` in test context (configured in `vitest.config.ts`)

**Run Commands:**
```bash
npx vitest                  # Run all tests (watch mode by default)
npx vitest run              # Single run, no watch
npx vitest --ui             # Open @vitest/ui browser UI
npx vitest run --coverage   # Coverage report (no coverage provider configured yet)
```

## Test File Organization

**Location:**
- No test files currently exist in the project
- Setup file only: `src/test/setup.ts`
- No co-located `.test.tsx` or `.spec.ts` files found anywhere in `src/`

**Intended naming (inferred from config):**
- Vitest default glob — place tests as `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`
- Co-locate with source files OR place in `src/test/` alongside `setup.ts`

**Structure:**
```
src/
├── test/
│   └── setup.ts            # Global test setup (jest-dom, mocks)
├── hooks/
│   └── useAssessments.tsx  # No test file yet
├── services/
│   └── aiService.ts        # No test file yet
└── components/
    └── AssessmentCard.tsx  # No test file yet
```

## Global Test Setup

Setup file at `src/test/setup.ts` runs before every test file. It provides:

```typescript
import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// NODE_ENV set to 'test'
// console.log/error/warn replaced with vi.fn() — no noise in test output
// window.location mocked to http://localhost:3000
// ResizeObserver mocked (required for layout components)
// IntersectionObserver mocked (required for scroll/visibility components)
// vi.clearAllMocks() called in beforeEach
```

## Mocking

**Framework:** Vitest `vi` — imported from `'vitest'`

**Global browser API mocks (in setup.ts):**
```typescript
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

**What to mock when writing tests:**

- **Supabase client** — mock `src/integrations/supabase/client.ts` to avoid real network calls:
  ```typescript
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
      from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() })),
    }
  }))
  ```

- **TanStack Query** — wrap components in a `QueryClientProvider` with a test `QueryClient`:
  ```typescript
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><Component /></QueryClientProvider>)
  ```

- **React Router** — wrap with `MemoryRouter` or `BrowserRouter` for components using `useNavigate` or `useParams`

- **Auth context** — mock `useAuth` hook:
  ```typescript
  vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({ user: { id: 'test-user', email: 'test@example.com' }, loading: false })),
    AuthProvider: ({ children }) => children,
  }))
  ```

**What NOT to mock:**
- Pure utility functions (`src/lib/utils.ts`, `responseCreatesFinding`, `riskWeightToSeverity` in `src/types/questionnaire.ts`) — test these directly
- Type helpers and constants (`RESPONSE_VALUES`, `SECURITY_DOMAINS`) — no mocking needed

## Test Structure

**Recommended suite organization:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ComponentUnderTest from '@/components/ComponentUnderTest'

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('ComponentUnderTest', () => {
  it('renders without crashing', () => {
    renderWithProviders(<ComponentUnderTest />)
    expect(screen.getByRole('...')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    renderWithProviders(<ComponentUnderTest />)
    fireEvent.click(screen.getByText('...'))
    expect(screen.getByText('...')).toBeVisible()
  })
})
```

## Fixtures and Factories

**Test Data:**
No factory files exist. Inline test data is the expected pattern until factories are added.

Recommended fixture shape for assessment data based on `src/integrations/supabase/types.ts`:
```typescript
const mockAssessment = {
  id: 'test-assessment-id',
  user_id: 'test-user-id',
  company_id: 'test-company-id',
  system_name: 'Test System',
  environment: 'DoD IL2',
  compliance_scope: 'CMMC Level 2',
  status: 'in_progress',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
```

**Location:**
- No fixture directory exists. Place test fixtures in `src/test/fixtures/` when created.

## Coverage

**Requirements:** None enforced — no coverage thresholds configured in `vitest.config.ts`

**Coverage provider:** Not configured. To add:
```typescript
// vitest.config.ts
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    thresholds: { lines: 70, functions: 70 }
  }
}
```

**View Coverage:**
```bash
npx vitest run --coverage
# Output in coverage/ directory
```

## Test Types

**Unit Tests:**
- Intended scope: pure functions in `src/types/questionnaire.ts` (`responseCreatesFinding`, `riskWeightToSeverity`, `getDomainById`), `src/lib/utils.ts` (`cn`), `src/config/breadcrumbs.ts` (`matchRoute`, `resolvePattern`)
- No unit tests written yet

**Integration Tests:**
- Intended scope: hooks that call Supabase (`useAssessments`, `useAuth`, `useUserProfile`) with mocked Supabase client
- No integration tests written yet

**E2E Tests:**
- Framework: Not configured. No Playwright or Cypress installed.

## Current State

**Test coverage is zero.** The test infrastructure is bootstrapped (Vitest + Testing Library + setup file) but no actual test files have been written. The `src/test/setup.ts` file establishes the global mock environment.

**Highest-value areas to test first:**
1. `src/types/questionnaire.ts` — pure functions `responseCreatesFinding` and `riskWeightToSeverity` have no side effects and are critical to scoring logic
2. `src/config/breadcrumbs.ts` — `matchRoute` and `resolvePattern` are pure functions with regex logic
3. `src/components/AssessmentCard.tsx` — stateless display component, easy to render and assert
4. `src/components/wizard/QuestionCard.tsx` — has user interaction logic (`handleSelect`, `handleNotesChange`) worth testing
5. `src/hooks/useAssessments.tsx` — covers Supabase CRUD mutations and query invalidation patterns

## Common Patterns

**Async Testing:**
```typescript
import { waitFor } from '@testing-library/react'

it('loads data asynchronously', async () => {
  renderWithProviders(<ComponentWithQuery />)
  await waitFor(() => {
    expect(screen.getByText('Expected Data')).toBeInTheDocument()
  })
})
```

**Error Testing:**
```typescript
it('shows error toast on mutation failure', async () => {
  vi.mocked(supabase.from).mockReturnValue({
    insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
  } as any)
  // trigger mutation and assert toast appears
})
```

**Testing context-dependent hooks:**
```typescript
import { renderHook } from '@testing-library/react'

it('throws when used outside provider', () => {
  expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider')
})
```
