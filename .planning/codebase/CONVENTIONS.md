# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- React components: PascalCase matching component name (`AssessmentCard.tsx`, `QuestionCard.tsx`)
- Custom hooks: camelCase prefixed with `use` (`useAssessments.tsx`, `useAuth.tsx`, `useUserProfile.tsx`)
- Services: camelCase or PascalCase class name (`aiService.ts`, `findingsGenerator.ts`, `AIRiskAnalysisService.ts`)
- Config/type files: camelCase (`breadcrumbs.ts`, `questionnaire.ts`, `analytics.ts`)
- Route modules: PascalCase describing what they register (`AuthRoutes.tsx`, `ProtectedRoutes.tsx`)
- UI primitives in `src/components/ui/`: kebab-case (`alert-dialog.tsx`, `accordion.tsx`)

**Components:**
- Named function with `const` for functional components: `const AssessmentCard = ({ ... }: AssessmentCardProps) => { ... }`
- Named exports for layout/utility components, default exports for pages and most components
- Component files export one primary component matching the filename

**Functions:**
- camelCase for all functions and methods (`handleSelect`, `getStatusConfig`, `validateDoDPassword`)
- Handler functions prefixed with `handle` (`handleSelect`, `handleReset`, `handleSignOut`)
- Boolean state variables prefixed with `is`, `has`, or `show` (`isLoading`, `hasError`, `showNotes`)
- Async operations use `async/await`, not `.then()` chains (except in `useEffect` where `.then()` is acceptable)

**Variables:**
- camelCase throughout
- Constants exported from type files in SCREAMING_SNAKE_CASE (`RESPONSE_VALUES`, `SECURITY_DOMAINS`, `BREADCRUMB_CONFIG`)
- Type aliases use PascalCase (`RiskLevel`, `FindingStatus`, `SecurityDomainId`)

**Types/Interfaces:**
- Interfaces prefixed with the domain noun, no `I` prefix (`AssessmentCardProps`, `AuthContextType`)
- Props interfaces named `[ComponentName]Props`
- Context interfaces named `[Context]ContextType`
- Database-derived types use `Database["public"]["Tables"]["table"]["Row"]` pattern

## Code Style

**Formatting:**
- No Prettier config present — formatting is not enforced by tooling
- Indentation: 2 spaces (consistent across all files examined)
- Trailing commas present in multi-line structures
- Single quotes for imports, double quotes acceptable in JSX attributes

**Linting:**
- Tool: ESLint 9 with `typescript-eslint` (flat config at `eslint.config.js`)
- `@typescript-eslint/no-unused-vars` is turned OFF — unused variables are not flagged
- `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` enforced
- `react-refresh/only-export-components` set to `warn`
- TypeScript strict mode is OFF (`"strict": false` in `tsconfig.app.json`)
- `noImplicitAny` is OFF — `any` types are freely used in `AIRiskAnalysisService.ts`

## Import Organization

**Order (observed pattern):**
1. React and React ecosystem (`react`, `react-router-dom`)
2. Third-party libraries (`@tanstack/react-query`, `lucide-react`)
3. Internal `@/` path alias imports — UI components first, then hooks, then services/types
4. Relative imports (rare, mostly in Supabase functions)

**Path Aliases:**
- `@/` maps to `src/` (configured in `tsconfig.app.json` and `vitest.config.ts`)
- Use `@/components/ui/button` not relative paths for shared UI

**Barrel Files:**
- Not used. Each import references the specific file directly.

## Error Handling

**Async hooks pattern (React Query mutations):**
- Errors thrown inside `mutationFn` are caught by `onError` callback
- `onError` displays a destructive toast: `toast({ title: "Error", description: error.message, variant: "destructive" })`
- Supabase errors are re-thrown with `if (error) { throw error; }`

**Async service functions:**
- Check session before making authenticated calls: `if (!session?.access_token) { throw new Error("Not authenticated"); }`
- Supabase query errors: `if (error) throw error;` — short-circuit pattern
- `console.error()` used in service-layer fire-and-forget paths (`findingsGenerator.ts`) where callers receive `null` or `false` returns
- `try/catch` with typed cast `const error = err as Error` used in auth operations

**React component errors:**
- `ErrorBoundary` class component at `src/components/ErrorBoundary.tsx` wraps the app
- `componentDidCatch` logs to monitoring (stub — not wired to a service yet)
- Fallback UI shows error message with reset and reload options

**Context guard pattern:**
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```
Used consistently in `useAuth` and `useNotifications`.

## Logging

**Framework:** `console.error()` in service layer; no structured logging library

**Patterns:**
- `console.error('Error [action]:', error)` in service functions that return null/false on failure
- Two `console.log` debug statements left in `src/components/dashboard/DashboardHeader.tsx` (should be removed)
- `console.log("Download report")` placeholder in `src/pages/AssessmentResults.tsx`
- Production error monitoring hookpoint exists in `ErrorBoundary.componentDidCatch` but is not wired up

## Comments

**When to Comment:**
- Section dividers using `// ============= SECTION =============` pattern in large service files (`aiService.ts`)
- JSDoc-style `/** ... */` comments on exported service functions in `findingsGenerator.ts`
- Inline `// Comment explaining why` for non-obvious logic (e.g., `// DoD Password Validation Helper`)
- Database schema comments: `// Enums matching database types`

**JSDoc:**
- Used selectively on standalone exported async functions in service files
- Not used on React components or hooks

## Function Design

**Size:** Functions kept focused; helper functions extracted (e.g., `interpolateTemplate`, `buildFindingDescription`, `getResponseOptions`, `RiskBadge`)

**Parameters:**
- Destructured props in component signatures
- Object parameter pattern for multi-arg mutations: `{ id, updates }: { id: string; updates: AssessmentUpdate }`
- Optional params use `?` suffix, defaults via `?? fallback` at call site

**Return Values:**
- Hooks return plain objects with named keys (not arrays), e.g., `return { assessments, isLoading, createAssessment, ... }`
- Service functions return typed interfaces or `null`/`false` on error
- Async functions always return typed Promises

## Module Design

**Exports:**
- Default exports for page components and most UI components
- Named exports for hooks, context functions, service objects, and utility functions
- Service files export plain objects with method properties (object literal pattern): `export const ragService = { async query(...) {...} }`
- Class-based service as exception: `export class AIRiskAnalysisService` with static methods

**Context pattern:**
```typescript
const SomeContext = createContext<SomeContextType | undefined>(undefined);
export function SomeProvider({ children }: { children: React.ReactNode }) { ... }
export function useSomething() {
  const context = useContext(SomeContext);
  if (context === undefined) throw new Error('...');
  return context;
}
```

## React-specific Patterns

**State management:**
- Server state via TanStack Query (`useQuery`, `useMutation`) in custom hooks under `src/hooks/`
- Local UI state via `useState`
- Global app state via React Context (`AuthContext`, `NotificationContext`)
- Query keys follow `[resource, userId]` pattern: `['assessments', user?.id]`

**Components and props:**
- Props interfaces defined in same file as component, exported when consumed externally
- `React.ReactNode` for children prop type
- `useCallback` used in context providers for stable function references

**Conditional rendering:**
- Early returns for loading states before main render
- Ternary expressions for inline conditional JSX
- `&&` operator for optional UI sections

**Route protection:**
- Routes wrap children in `<ProtectedRoute>` then `<NDAGate>` then optionally `<RoleBasedRoute requiredRoles={[...]}>`
- Role check roles: `'admin'`, `'isso'`, `'issm'`, `'viewer'`
