# Codebase Concerns

**Analysis Date:** 2026-03-26

---

## Tech Debt

**Hardcoded Supabase Credentials in Source:**
- Issue: The Supabase URL and anon key are hardcoded directly in `src/integrations/supabase/client.ts` (lines 5-6), not read from environment variables. The file header says "automatically generated — do not edit" but the values are committed plaintext in version control.
- Files: `src/integrations/supabase/client.ts`
- Impact: Anyone with repo access has the anon key. Rotating the key requires a code change and redeploy. The `.env.example` references `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` but these are never read by the app.
- Fix approach: Replace hardcoded values with `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`. Add validation at startup to fail fast if env vars are missing.

**`unknown[]` Return Types Masking Missing Domain Models:**
- Issue: Several service methods in `src/services/aiService.ts` return `Promise<unknown[]>` instead of typed interfaces — `getQueryHistory`, `getAll` (poam), `getRecent`, `search`, and `getBySeverity` on the threat intel service (lines 155, 210, 376, 387, 399). Callers must cast at the boundary with no type safety.
- Files: `src/services/aiService.ts`
- Impact: Compiler cannot catch shape mismatches between DB results and component usage. Adding new fields or renaming columns silently breaks rendering.
- Fix approach: Define typed interfaces (`RAGQueryLog`, `POAMEntry`, `ThreatIntelEntry`) and use the Supabase-generated `Database` types to derive them.

**`any` Typing Throughout Edge Functions:**
- Issue: All four production Edge Functions (`rag-query`, `embed-document`, `generate-poam`, `fetch-cve-feed`) use untyped `any` casts for Supabase RPC results, OpenAI response payloads, and chunk filtering (e.g., `filteredChunks.map((c: any) => ...)` in `rag-query/index.ts` line 117).
- Files: `supabase/functions/rag-query/index.ts`, `supabase/functions/embed-document/index.ts`, `supabase/functions/generate-poam/index.ts`
- Impact: Silent runtime failures if OpenAI API response shape changes or DB schema evolves. No Deno type-checking benefits.
- Fix approach: Define typed interfaces for OpenAI API responses and RPC return shapes. Validate payloads before casting.

**Dual Toast Systems Running Simultaneously:**
- Issue: The app mounts both `<Toaster>` (Radix) and `<Sonner>` in `src/App.tsx` (lines 21-22). Component files inconsistently import from `@/hooks/use-toast` vs. `sonner`, meaning toast calls from the same action may route to different UI surfaces.
- Files: `src/App.tsx`, components using `toast` vs `useToast`
- Impact: Visual inconsistency; some toasts vanish without user interaction (Sonner default), others accumulate. Hard to centralize toast logic.
- Fix approach: Standardize on one system (Sonner recommended for the existing import pattern). Remove the Radix toaster.

**`QueryClient` Instantiated Without Configuration:**
- Issue: `src/App.tsx` line 14 creates `new QueryClient()` with no custom configuration — no `staleTime`, `gcTime`, `retry` limits, or error handlers. Default behavior retries all failed queries 3 times with exponential backoff, causing slow error surfacing.
- Files: `src/App.tsx`
- Impact: Supabase errors (e.g., RLS violations, network failures) silently retry, delaying feedback to users and flooding Supabase's request log.
- Fix approach: Configure `QueryClient` with sensible defaults: `staleTime: 1000 * 60`, `retry: 1`, and a global `onError` handler.

**`NotificationProvider` Receives Hardcoded `organizationId`:**
- Issue: `src/App.tsx` line 19 passes `organizationId="default-org"` to `NotificationProvider`. This prop is used to stamp notification records but bears no relation to the authenticated user's actual company.
- Files: `src/App.tsx`, `src/context/NotificationContext.tsx`
- Impact: All in-memory notifications are stamped with the wrong organization identifier. If notification persistence is added later, data would be incorrectly attributed.
- Fix approach: Fetch and pass the real `company_id` from the user's profile, or derive it inside the context from `useAuth`.

---

## Known Bugs / Incomplete Features

**Report Generation is Fully Mocked (No Actual Output):**
- Symptoms: Clicking "Generate Report" in `src/pages/ReportBuilder.tsx` runs a `setTimeout` for 5 seconds, sets `reportGenerated = true`, and shows a success toast. No file is created, no data is read, no download is triggered. "Download Report" navigates to the feedback page.
- Files: `src/pages/ReportBuilder.tsx` (lines 105-125)
- Trigger: Any user clicking the generate or download buttons
- Workaround: None — this is a UI scaffold only.

**ISSM Review Page Uses Completely Hardcoded Static Findings:**
- Symptoms: `src/pages/ISSMReview.tsx` defines `summaryFindings` as a hardcoded array of 4 mock findings (lines 19-59) regardless of which assessment ID is in the URL. The `id` param from `useParams` is read but never used to fetch real data.
- Files: `src/pages/ISSMReview.tsx`
- Trigger: Any ISSM navigating to `/assessment/:id/issm-review`
- Workaround: None.

**Lead Summary Generates a Hardcoded Templated Report, Not Real Assessment Data:**
- Symptoms: `src/pages/LeadSummary.tsx` computes metrics (`totalFindings`, `totalCritical`, etc.) from a hardcoded `agentFindings` array (lines 20-61). The `handleCompileSummary` function builds a static markdown template from these fake numbers inside a `setTimeout` (lines 80-128). The `id` param is never used to query real assessment data.
- Files: `src/pages/LeadSummary.tsx`
- Trigger: Any ISSO navigating to `/assessment/:id/summary`
- Workaround: None.

**`AssessmentResults.tsx` Download Report Handler is a No-Op:**
- Symptoms: `handleDownloadReport` in `src/pages/AssessmentResults.tsx` only calls `console.log("Download report")` with no file generation or navigation.
- Files: `src/pages/AssessmentResults.tsx` (line 36)
- Trigger: User clicking "Download Report" on a completed assessment
- Workaround: None.

**Simulated Upload Progress Bar Does Not Reflect Actual Network Progress:**
- Symptoms: `src/components/documents/DocumentUpload.tsx` starts a `setInterval` that increments progress by 10% every 200ms regardless of actual embedding progress (lines 129-131). If embedding takes longer than 1.8 seconds the bar stalls at 90%.
- Files: `src/components/documents/DocumentUpload.tsx`
- Trigger: Uploading any document
- Workaround: None — visually misleading but functionally harmless.

---

## Security Considerations

**Supabase Anon Key Committed to Git:**
- Risk: The JWT anon key in `src/integrations/supabase/client.ts` is committed. While anon keys are intended to be public-facing, committing them makes rotation difficult and leaves a permanent record in git history.
- Files: `src/integrations/supabase/client.ts`
- Current mitigation: Supabase RLS policies restrict what the anon key can access.
- Recommendations: Move to `import.meta.env` variables. Run `git filter-repo` to scrub history before any public release.

**NDA Gate Enforced Only via `localStorage`:**
- Risk: `src/hooks/useNDAStatus.tsx` checks NDA acceptance by reading `localStorage.getItem(`nda_accepted_${user.id}`)`. Any user can bypass NDA requirements by setting this key in browser devtools.
- Files: `src/hooks/useNDAStatus.tsx`, `src/components/NDAGate.tsx`
- Current mitigation: None — this is client-side only enforcement.
- Recommendations: Persist NDA acceptance in a Supabase table column on the `profiles` row. Validate server-side in RLS policies or Edge Functions for sensitive operations.

**CORS Headers Allow All Origins in All Edge Functions:**
- Risk: All four Edge Functions set `"Access-Control-Allow-Origin": "*"` unconditionally (e.g., `supabase/functions/rag-query/index.ts` line 6). For functions that handle sensitive compliance data and write to audit logs, this permits requests from any origin.
- Files: `supabase/functions/rag-query/index.ts`, `supabase/functions/embed-document/index.ts`, `supabase/functions/generate-poam/index.ts`, `supabase/functions/fetch-cve-feed/index.ts`
- Current mitigation: Auth token is still validated per request.
- Recommendations: Restrict `Access-Control-Allow-Origin` to the app's known origin(s) in production. The anon key in the request already identifies the Supabase project; wildcard CORS adds no benefit.

**`fetch-cve-feed` Edge Function Has No Authentication:**
- Risk: `supabase/functions/fetch-cve-feed/index.ts` creates a Supabase service role client with no auth header check (line 46). It writes to the `threat_intelligence` table using service role permissions. Any caller who can reach the function URL can trigger CVE ingestion.
- Files: `supabase/functions/fetch-cve-feed/index.ts`
- Current mitigation: Function URL is not publicly exposed in the UI.
- Recommendations: Add a shared secret check (e.g., compare `Authorization` header against a function secret) or restrict invocation to Supabase cron/pg_cron.

**Role-Based Route Guard Has a Logic Gap:**
- Risk: In `src/components/RoleBasedRoute.tsx` lines 39-42, the role check evaluates `requiredRoles.length === 0` as granting access. This means components rendered inside a `<RoleBasedRoute requiredRoles={[]}>` are accessible to all authenticated users regardless of role. The condition appears inside the "has required role" check, making it a silent bypass.
- Files: `src/components/RoleBasedRoute.tsx`
- Current mitigation: No current routes pass an empty `requiredRoles` array intentionally.
- Recommendations: Treat empty `requiredRoles` as "no restriction" explicitly and document this contract, or assert a non-empty array in development.

---

## Performance Bottlenecks

**POA&M Generation Makes N Sequential OpenAI API Calls:**
- Problem: `supabase/functions/generate-poam/index.ts` iterates over findings with a `for...of` loop (line 95), making one OpenAI completion call per finding sequentially. A 20-finding assessment results in 20 serial API round-trips.
- Files: `supabase/functions/generate-poam/index.ts`
- Cause: Sequential loop with `await` inside.
- Improvement path: Use `Promise.all` with a concurrency limit (e.g., `p-limit` or chunked batches of 5) to parallelize calls.

**`useWizardProgress` Fires Three Parallel DB Queries on Every Render:**
- Problem: `src/hooks/useWizardProgress.tsx` fetches all questions (no assessment filter), all responses for the assessment, and all findings for the assessment as three separate queries. As the question bank grows this becomes a full table scan on every wizard page load.
- Files: `src/hooks/useWizardProgress.tsx`
- Cause: No question-count caching; question list is refetched on every `queryKey` invalidation.
- Improvement path: Cache the question list separately with a long `staleTime` (questions rarely change). Consider a single Supabase RPC that returns progress stats in one call.

**`threatIntelService.getSummary()` Fetches Full Table for Client-Side Aggregation:**
- Problem: `src/services/aiService.ts` lines 421-441 selects `severity, is_exploited, created_at` for the entire `threat_intelligence` table, then filters and counts in JavaScript. As CVE ingestion accumulates data, this will transfer increasingly large payloads.
- Files: `src/services/aiService.ts`
- Cause: No server-side aggregation.
- Improvement path: Replace with a Supabase RPC that returns pre-aggregated counts, or add a Postgres view with `COUNT(*) GROUP BY severity`.

**`poamService.getSummary()` Has the Same Full-Scan Pattern:**
- Problem: `src/services/aiService.ts` lines 249-273 fetches all POAM entries for client-side counting. Without pagination or server-side aggregation this degrades with data volume.
- Files: `src/services/aiService.ts`
- Cause: Same pattern as threat intel summary.
- Improvement path: Move aggregation to a Supabase RPC or database view.

---

## Fragile Areas

**`AIRiskAnalysisService` is Entirely Fake:**
- Files: `src/services/AIRiskAnalysisService.ts`
- Why fragile: All methods (`generateRiskPredictions`, `generateInsights`, `getCurrentRiskLevel`, `analyzeTrend`) return hardcoded mock data or `Math.random()` results. The `AIInsightsDashboard` component renders these as real AI-generated insights with specific confidence percentages. Replacing this with real analysis will require changing the return contract and all consumers.
- Safe modification: Treat the current interface as a stable contract; implement real logic behind it without changing method signatures.
- Test coverage: Zero — no test files exist in the project.

**`src/components/ui/sidebar.tsx` Returns Random Width Values:**
- Files: `src/components/ui/sidebar.tsx` (line 653)
- Why fragile: `Math.floor(Math.random() * 40) + 50` returns a new random width on every render, causing layout thrashing in any component that uses this sidebar helper.
- Safe modification: Replace with a stable constant or a user-controlled value stored in state.
- Test coverage: None.

**`NotificationContext` Fires Random Fake Alerts in Production:**
- Files: `src/context/NotificationContext.tsx` (lines 70-99)
- Why fragile: A 30-second interval adds random "Security Alert" and "Assessment Update" notifications with a 10% probability. These run in all environments including production, polluting the notification feed with fabricated data.
- Safe modification: Gate the simulation interval behind `import.meta.env.DEV` or remove it entirely and replace with real Supabase Realtime subscriptions.
- Test coverage: None.

**Documents Are Not Stored in Supabase Storage — Only Embeddings Are:**
- Files: `src/components/documents/DocumentUpload.tsx`, `supabase/functions/embed-document/index.ts`
- Why fragile: The upload flow reads file content client-side and sends it to the embed function. No record of the original file is persisted in Supabase Storage. The `DocumentLibrary` component reconstructs "documents" by querying `document_embeddings` grouped by `document_id`. If chunks are deleted or the schema changes, document metadata is permanently lost.
- Safe modification: Upload the original file to Supabase Storage before embedding. Store a `documents` table record with the storage path, then reference it from `document_embeddings`.
- Test coverage: None.

---

## Test Coverage Gaps

**Zero Test Files Exist:**
- What's not tested: Everything — auth flows, assessment wizard progression, findings generation, POAM creation, Edge Functions, role-based access enforcement, NDA gating.
- Files: `src/test/setup.ts` exists (test infrastructure configured with Vitest + Testing Library), but `find src -name "*.test.*"` returns no results.
- Risk: Any refactor to core hooks (`useAuth`, `useWizardProgress`, `useAssessmentFindings`) or services (`findingsGenerator.ts`, `aiService.ts`) can silently break behavior with no regression coverage.
- Priority: High — especially for `src/services/findingsGenerator.ts` (auto-generates compliance findings) and `src/hooks/useAuth.tsx` (DoD password validation logic).

---

## Missing Critical Features

**No Actual Report Export:**
- Problem: Report generation across three surfaces (`ReportBuilder`, `AssessmentResults`, `LeadSummary`) is either a `setTimeout` simulation or a no-op `console.log`. No PDF, Word, or CSV export of assessment data exists.
- Blocks: The core user workflow — completing an assessment and delivering a report to a customer or ISSM — cannot be completed.

**NDA Acceptance Not Persisted Server-Side:**
- Problem: NDA acceptance lives only in `localStorage`. Clearing browser storage or switching devices requires re-accepting, and there is no audit trail of NDA acceptance dates per user.
- Blocks: Compliance audit requirements for recording who accepted the NDA and when.

**No Real-Time Threat Intelligence Correlation:**
- Problem: The CVE ingestion pipeline populates `threat_intelligence` but there is no linkage between ingested CVEs and assessment findings or POAM entries. Threat intel data is displayed in isolation.
- Blocks: The "Threat Intelligence" feature's primary value proposition — surfacing relevant CVEs against open findings.

---

*Concerns audit: 2026-03-26*
