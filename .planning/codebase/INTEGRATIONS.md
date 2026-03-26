# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**AI / Machine Learning:**
- OpenAI API — Used in three edge functions for embeddings and chat completions
  - Embeddings model: `text-embedding-3-small` (1536-dimensional vectors)
  - Chat completion model: `gpt-4o-mini` (RAG answers and POAM generation)
  - Endpoints called: `https://api.openai.com/v1/embeddings`, `https://api.openai.com/v1/chat/completions`
  - Auth: `OPENAI_API_KEY` env var (Deno edge function environment only — never exposed to browser)
  - Used by: `supabase/functions/rag-query/index.ts`, `supabase/functions/embed-document/index.ts`, `supabase/functions/generate-poam/index.ts`

**Threat Intelligence:**
- NIST NVD (National Vulnerability Database) API v2 — Fetches CVEs on a scheduled/triggered basis
  - Endpoint: `https://services.nvd.nist.gov/rest/json/cves/2.0`
  - Auth: None (public API, no key required)
  - Fetches last 24 hours of CVEs, up to 100 per call
  - Used by: `supabase/functions/fetch-cve-feed/index.ts`

## Data Storage

**Primary Database:**
- Supabase (PostgreSQL) — All application data
  - Project ID: `zysfnkbwyhrfnpvcnptp`
  - URL: `https://zysfnkbwyhrfnpvcnptp.supabase.co`
  - Client: `@supabase/supabase-js` v2.49, initialized in `src/integrations/supabase/client.ts`
  - RLS enabled on all tables
  - pgvector extension enabled — `document_embeddings` table stores `vector(1536)` with IVFFlat cosine index

**Database Tables:**
- `assessments` — RMF assessment records with domain scores and wizard state
- `assessment_questions` — NIST 800-53 control questions catalog
- `assessment_responses` — User answers per question
- `assessment_findings` — Security findings/gaps generated from responses
- `audit_log` — Immutable audit trail including AI decision reasoning
- `companies` — Organization records (multi-tenant anchor)
- `compliance_metrics` — Compliance scoring data
- `document_embeddings` — Vector chunks for RAG knowledge base
- `document_type_metadata` — RMF document type configuration
- `notification_intelligence` — Smart notification records
- `notification_preferences` — Per-user notification settings
- `poam_entries` — Plan of Action and Milestones items
- `profiles` — User profile data linked to `auth.users`
- `rag_queries` — RAG query history with feedback ratings
- `threat_intelligence` — CVE/threat data ingested from NVD
- `workflow_executions` — Workflow run records

**Database Functions (RPCs):**
- `match_documents` — Vector similarity search using pgvector cosine ops
- `get_user_company_role` — Multi-tenant role lookup
- `log_audit_event` — Audit trail insert

**File Storage:**
- Not detected — no Supabase Storage bucket references or file upload patterns found beyond document text content stored directly in the database

**Caching:**
- Redis 7 (Alpine) — Provisioned in `docker-compose.yml` and `docker-compose.prod.yml` with AOF persistence
  - Port: `6379`
  - No application-level Redis client found in `src/` — provisioned for infrastructure use (rate limiting, session caching potential but not yet wired to app code)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth — Email/password authentication
  - Implementation: `src/hooks/useAuth.tsx` wraps `supabase.auth` in a React context (`AuthProvider`)
  - Sign-up enforces DoD-standard password policy (12+ chars, uppercase, lowercase, number, special char, no repeated chars, no common patterns, no personal info)
  - Email confirmation required on sign-up (`emailRedirectTo` set to `window.location.origin`)
  - Session managed via `supabase.auth.onAuthStateChange` listener
  - No OAuth/SSO providers detected

**JWT Verification:**
- Edge functions `rag-query`, `embed-document`, `generate-poam`, `seed-knowledge-base` all require `verify_jwt = true` (`supabase/config.toml`)
- `fetch-cve-feed` is public (`verify_jwt = false`) — intended for scheduled/cron invocation

## Monitoring & Observability

**Metrics:**
- Prometheus — Metrics collection, config at `docker/prometheus.yml` and `docker/prometheus-prod.yml`
  - Retention: 200h (dev), 720h (prod)
  - Port: `9090`

**Dashboards:**
- Grafana — Dashboard visualization
  - Port: `3001` (dev), internal only (prod, behind nginx-proxy)
  - Dashboard provisioning: `docker/grafana/dashboards/`
  - Datasource provisioning: `docker/grafana/datasources/`
  - Credentials: `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` env vars

**Error Tracking:**
- Not detected — no Sentry, LogRocket, or similar SDK found

**Logs:**
- Console logging via `console.log` in edge functions (Supabase function log viewer)
- No structured logging library detected in frontend code

## CI/CD & Deployment

**Hosting:**
- Docker containers — nginx:alpine serving built Vite/React SPA
- Network: `sentinel-ai-network` (dev), `sentinel-ai-prod-network` (prod)
- Supabase cloud for backend (BaaS)

**CI Pipeline:**
- Not detected — no `.github/workflows/`, `.gitlab-ci.yml`, or similar files found

## Supabase Edge Functions

All functions are deployed to the Supabase project and invoked via `supabase.functions.invoke()`:

| Function | JWT Required | Purpose |
|---|---|---|
| `rag-query` | Yes | Semantic search + GPT-4o-mini answer generation |
| `embed-document` | Yes | Chunk + embed documents via OpenAI into pgvector |
| `generate-poam` | Yes | AI-generated POA&M entries from assessment findings |
| `fetch-cve-feed` | No | Pull last 24h CVEs from NVD into `threat_intelligence` table |
| `seed-knowledge-base` | Yes | Load NIST 800-53 / RMF framework docs into RAG knowledge base |

## Environment Configuration

**Required env vars (production):**
- `VITE_SUPABASE_URL` — Supabase project URL (browser-accessible)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (browser-accessible)
- `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` — Grafana admin credentials
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for edge functions (server-side only)
- `OPENAI_API_KEY` — OpenAI API key for edge functions (server-side only)

**Secrets location:**
- Supabase dashboard → Project Settings → Edge Function Secrets (for `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Docker environment variables / `.env` file for Grafana credentials
- `.env.example` at repo root documents required vars

## Webhooks & Callbacks

**Incoming:**
- Supabase Auth email confirmation redirect → `window.location.origin/` (set in `src/hooks/useAuth.tsx`)

**Outgoing:**
- None detected — no webhook dispatch or outbound HTTP calls from frontend (all external calls go through edge functions)

---

*Integration audit: 2026-03-26*
