# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Feature-based SPA with BFF (Backend-for-Frontend) via Supabase Edge Functions

**Key Characteristics:**
- React SPA (Vite) talks directly to Supabase (Postgres + Auth + Realtime) via auto-generated typed client
- AI workloads (embeddings, LLM calls, CVE ingestion) run as isolated Deno edge functions in Supabase — never in the browser
- Data fetching in the client is mediated entirely through TanStack Query custom hooks; no direct Supabase calls in page components
- Role-based and NDA gating are enforced as React router wrapper components, not middleware
- The `AIRiskAnalysisService` in `src/services/` is a mock class (returns hardcoded/randomized values) — the real AI layer lives in edge functions

## Layers

**Presentation (Pages):**
- Purpose: Route-level page components that compose feature components, handle navigation
- Location: `src/pages/`
- Contains: Page-level layouts, light data wiring, tab orchestration
- Depends on: Layout components, feature components, hooks
- Used by: React Router routes defined in `src/routes/`

**Routing & Auth Guards:**
- Purpose: Declare all app routes and enforce auth/role/NDA access at the route level
- Location: `src/routes/AuthRoutes.tsx`, `src/routes/ProtectedRoutes.tsx`
- Contains: `<ProtectedRoute>`, `<RoleBasedRoute>`, `<NDAGate>` wrapping page components
- Depends on: `useAuth` hook, `useUserProfile` hook
- Used by: `src/App.tsx`

**Feature Components:**
- Purpose: Domain-scoped UI slices that handle their own internal state and call hooks
- Location: `src/components/<domain>/` (admin, analytics, audit, compliance, dashboard, documents, landing, poam, rag, wizard)
- Contains: Stateful components per business domain
- Depends on: Hooks, `src/components/ui/`, services
- Used by: Pages

**Shared Components:**
- Purpose: Generic layout, navigation, error boundaries, and route guards used across features
- Location: `src/components/` (root level, e.g., `AppLayout`, `ProtectedRoute`, `ErrorBoundary`, `FileUpload`)
- Contains: `AppLayout.tsx`, `NDAGate.tsx`, `ProtectedRoute.tsx`, `RoleBasedRoute.tsx`, `ErrorBoundary.tsx`
- Depends on: `src/components/ui/`, hooks
- Used by: All pages and feature components

**Data Access Hooks:**
- Purpose: Encapsulate all Supabase queries and mutations behind TanStack Query hooks; the exclusive data access layer for the frontend
- Location: `src/hooks/`
- Contains: `useAssessments`, `useAssessmentFindings`, `useAssessmentResponses`, `useAssessmentQuestions`, `useAuth`, `useWizardProgress`, `useUserManagement`, `useUserProfile`, `useNDAStatus`
- Depends on: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`
- Used by: Feature components and pages

**Services (Client-Side):**
- Purpose: Thin wrappers that invoke Supabase edge functions or query Supabase tables for cross-cutting concerns
- Location: `src/services/`
- Contains:
  - `aiService.ts` — `ragService`, `poamService`, `auditService`, `threatIntelService`: all invoke edge functions or query Supabase tables
  - `findingsGenerator.ts` — generates `assessment_findings` rows from wizard responses
  - `AIRiskAnalysisService.ts` — **mock/stub** class; returns hardcoded insights; to be replaced with real agent-driven analysis
- Depends on: `src/integrations/supabase/client.ts`
- Used by: Feature components (directly, not via hooks)

**Supabase Integration:**
- Purpose: Auto-generated typed Supabase client and full database type definitions
- Location: `src/integrations/supabase/`
- Contains: `client.ts` (single exported `supabase` instance), `types.ts` (full DB schema types)
- Depends on: `@supabase/supabase-js`
- Used by: All hooks and services

**Edge Functions (Backend):**
- Purpose: Server-side AI workloads running in Deno/Supabase; the only layer with access to OpenAI/Anthropic API keys
- Location: `supabase/functions/`
- Contains:
  - `rag-query/` — embed query → vector search (`match_documents` RPC) → GPT-4o-mini answer → audit log
  - `embed-document/` — chunk document text → OpenAI embeddings → store in `document_chunks`
  - `generate-poam/` — GPT-4o-mini generates POA&M entries from assessment findings
  - `fetch-cve-feed/` — ingests NVD CVE data into `threat_intelligence` table
  - `seed-knowledge-base/` — bulk seeds knowledge base documents
- Depends on: Supabase service role key, OpenAI API key (ANTHROPIC_API_KEY reserved for future agent layer)
- Used by: `src/services/aiService.ts` via `supabase.functions.invoke()`

**Types:**
- Purpose: Shared TypeScript type definitions for domain models
- Location: `src/types/`
- Contains: `questionnaire.ts` (assessment domain types, enums, NIST domain IDs), `documentTypes.ts` (RMF document taxonomy), `analytics.ts` (risk insights, maturity trends, notifications)

**State / Context:**
- Purpose: React context for in-memory notification state (not persisted to DB)
- Location: `src/context/NotificationContext.tsx`
- Contains: `NotificationProvider`, `useNotifications`

## Data Flow

**Assessment Wizard Flow:**

1. User navigates to `/assessment/:id/wizard/:domainId` → `SelfAssessmentWizard` page
2. `useAssessmentQuestions` hook fetches questions for the domain from `assessment_questions` table
3. User answers questions; `useAssessmentResponses` mutation upserts rows to `assessment_responses`
4. On response save, `findingsGenerator.ts` queries the answered question, evaluates `creates_finding` logic, and inserts a row into `assessment_findings`
5. After wizard completion, user navigates to `/assessment/:id/results` → `AssessmentResults` page reads findings via `useAssessmentFindings`

**RAG Query Flow:**

1. User submits query in `RAGChatInterface` component → calls `ragService.query()` in `src/services/aiService.ts`
2. `aiService` invokes `supabase.functions.invoke("rag-query")` with auth JWT
3. Edge function: authenticates user → generates OpenAI embedding for query → calls `match_documents` Postgres RPC (pgvector cosine similarity) → calls GPT-4o-mini with retrieved context → logs to `rag_queries` table + `audit_log`
4. Response returned to UI with answer + source citations

**POA&M Generation Flow:**

1. User triggers generation from `POAMManager` component → calls `poamService.generateFromFindings()`
2. `poamService` invokes `supabase.functions.invoke("generate-poam")` with findings array
3. Edge function: calls GPT-4o-mini per finding → generates structured POA&M with milestones, cost estimate, responsible party → inserts `poam_entries` rows → logs audit event
4. `POAMManagement` page re-queries via `poamService.getAll()`

**State Management:**
- Server state via TanStack Query (`@tanstack/react-query`) with query keys scoped by user ID and resource ID
- Auth state via `AuthProvider` context wrapping the entire app (`src/App.tsx`)
- Notifications via `NotificationContext` (in-memory, not persisted)
- No global client-side state management library (no Redux/Zustand)

## Key Abstractions

**ProtectedRoute / RoleBasedRoute / NDAGate:**
- Purpose: Composable auth enforcement wrappers that redirect unauthenticated or unauthorized users
- Examples: `src/components/ProtectedRoute.tsx`, `src/components/RoleBasedRoute.tsx`, `src/components/NDAGate.tsx`
- Pattern: HOC-style wrapper; checks `useAuth()` + `useUserProfile()` then renders children or redirects

**Custom Data Hooks:**
- Purpose: Single point of data access — all TanStack Query config lives here, pages/components just destructure
- Examples: `src/hooks/useAssessments.tsx`, `src/hooks/useAssessmentFindings.tsx`, `src/hooks/useWizardProgress.tsx`
- Pattern: Each hook exports `{ data, isLoading, mutationFn }` using `useQuery` and `useMutation`

**Edge Functions as AI Microservices:**
- Purpose: Isolated, authenticated serverless functions that own all secrets and AI API calls
- Examples: `supabase/functions/rag-query/index.ts`, `supabase/functions/generate-poam/index.ts`
- Pattern: Every function verifies JWT, fetches `profiles.company_id` for multi-tenant scoping, calls external AI API, logs to `audit_log` via `log_audit_event` RPC

**Audit Trail:**
- Purpose: Every AI decision and significant user action is logged to `audit_log` with an `ai_reasoning` field
- Pattern: Edge functions call `supabase.rpc("log_audit_event", {..., p_ai_reasoning: "..."})` after every AI operation

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: Vite serves `index.html` → loads `main.tsx` → mounts `<App />`
- Responsibilities: Creates React root, renders provider tree

**App Root:**
- Location: `src/App.tsx`
- Triggers: Mounted by `main.tsx`
- Responsibilities: Establishes global providers (`QueryClientProvider`, `AuthProvider`, `NotificationProvider`, `TooltipProvider`), BrowserRouter, and root route tree

**Route Declaration:**
- Location: `src/routes/AuthRoutes.tsx` (public routes: `/`, `/auth`, `/help`), `src/routes/ProtectedRoutes.tsx` (all authenticated routes)
- Triggers: BrowserRouter URL matching
- Responsibilities: Wraps page components in `ProtectedRoute` + `RoleBasedRoute` + `NDAGate` as required

**Edge Function Entry:**
- Location: `supabase/functions/<name>/index.ts`
- Triggers: `supabase.functions.invoke("<name>")` from client services
- Responsibilities: CORS preflight, JWT auth, AI API call, DB write, audit log

## Error Handling

**Strategy:** Errors surface at the hook/service layer and are displayed via `toast` notifications; no global error boundary except `ErrorBoundary.tsx` for unexpected render errors.

**Patterns:**
- TanStack Query mutations: `onError` callbacks call `toast({ variant: "destructive", ... })`
- Edge functions: Try/catch returns JSON `{ error: message }` with appropriate HTTP status (401 for auth, 500 for server errors)
- Auth errors: `useAuth` returns `{ error }` objects from `signIn`/`signUp`; consumed by `Auth.tsx` page
- Supabase query errors: Hooks throw on error; TanStack Query surfaces to `isError` state

## Cross-Cutting Concerns

**Audit Logging:** All AI operations logged via `log_audit_event` Postgres RPC from edge functions; stores `ai_reasoning` field with each entry. Client-side accessible via `auditService.getLogs()` in `src/services/aiService.ts`.

**Validation:** Form validation is component-local (no shared schema library like Zod detected). Auth uses custom DoD password rules enforced in `useAuth.tsx` `signUp()`.

**Authentication:** Supabase Auth with JWT. Auth state managed by `AuthProvider` in `src/hooks/useAuth.tsx`. All edge functions re-verify the JWT using service role key. Password rules enforce DoD standard (12+ chars, complexity, no personal info).

**Multi-tenancy:** All data scoped by `company_id`. Edge functions fetch `profiles.company_id` after auth and apply it to all DB operations. RLS policies on Supabase tables enforce this at the DB level.

**Role System:** Four roles defined in `Database["public"]["Enums"]["user_role"]`: `admin`, `isso`, `issm`, `user` (viewer fallback). Routes enforce roles via `RoleBasedRoute`. Edge functions do not currently re-check roles independently.

---

*Architecture analysis: 2026-03-26*
