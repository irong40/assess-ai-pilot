# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
assess-ai-pilot/
├── src/                        # All frontend source code
│   ├── main.tsx                # React DOM entry point
│   ├── App.tsx                 # Root component: providers + router
│   ├── index.css               # Global Tailwind base styles
│   ├── routes/                 # Route declarations (auth guards applied here)
│   │   ├── AuthRoutes.tsx      # Public routes: /, /auth, /help
│   │   └── ProtectedRoutes.tsx # All authenticated routes with guard wrappers
│   ├── pages/                  # Route-level page components
│   │   ├── Index.tsx           # Landing page (public)
│   │   ├── Auth.tsx            # Sign in / sign up
│   │   ├── Dashboard.tsx       # Main dashboard (overview + analytics + AI insights)
│   │   ├── NewAssessment.tsx   # Create assessment form
│   │   ├── WizardHub.tsx       # Domain selection for wizard
│   │   ├── SelfAssessmentWizard.tsx  # Per-domain question wizard
│   │   ├── AssessmentResults.tsx     # Findings + compliance results
│   │   ├── LeadSummary.tsx     # ISSO-facing assessment summary
│   │   ├── ISSMReview.tsx      # ISSM review workflow
│   │   ├── ReportBuilder.tsx   # Report configuration and preview
│   │   ├── POAMManagement.tsx  # POA&M list and management
│   │   ├── KnowledgeAI.tsx     # RAG chat interface
│   │   ├── AuditLog.tsx        # Audit log viewer
│   │   ├── DocumentManagement.tsx  # Document upload and embedding
│   │   ├── Admin.tsx           # Admin-only user management
│   │   ├── Feedback.tsx        # User feedback
│   │   ├── Help.tsx            # Help documentation
│   │   ├── NDA.tsx             # NDA acceptance page
│   │   └── NotFound.tsx        # 404 fallback
│   ├── components/             # Reusable UI components
│   │   ├── ProtectedRoute.tsx  # Auth guard wrapper
│   │   ├── RoleBasedRoute.tsx  # Role enforcement wrapper
│   │   ├── NDAGate.tsx         # NDA acceptance gate
│   │   ├── ErrorBoundary.tsx   # React error boundary
│   │   ├── Header.tsx          # Top navigation header
│   │   ├── FileUpload.tsx      # Reusable file upload with progress
│   │   ├── Loading.tsx         # Loading spinner component
│   │   ├── AgentSummaryCard.tsx      # Agent status card (Phase 1 prep)
│   │   ├── ExecutiveSummaryCard.tsx  # Executive summary widget
│   │   ├── ComplianceMatrix.tsx      # NIST control matrix display
│   │   ├── admin/              # Admin feature components
│   │   │   └── UserManagement.tsx
│   │   ├── analytics/          # Analytics and AI insights components
│   │   │   └── AIInsightsDashboard.tsx
│   │   ├── audit/              # Audit log components
│   │   │   └── AuditLogViewer.tsx
│   │   ├── compliance/         # Compliance-specific components
│   │   │   └── ATOReadinessCard.tsx
│   │   ├── dashboard/          # Dashboard widget components
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── AnalyticsCards.tsx
│   │   │   ├── DashboardCharts.tsx
│   │   │   └── AssessmentsList.tsx
│   │   ├── documents/          # Document management components
│   │   ├── landing/            # Public landing page sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   └── FinalCTA.tsx
│   │   ├── layout/             # App shell layout
│   │   │   ├── AppLayout.tsx   # Main authenticated layout wrapper
│   │   │   └── AppBreadcrumbs.tsx
│   │   ├── notifications/      # Notification UI components
│   │   ├── poam/               # POA&M management components
│   │   │   └── POAMManager.tsx
│   │   ├── rag/                # RAG chat components
│   │   │   └── RAGChatInterface.tsx
│   │   ├── ui/                 # shadcn-ui primitives (button, card, dialog, etc.)
│   │   └── wizard/             # Assessment wizard step components
│   │       ├── DomainCard.tsx
│   │       ├── DomainProgress.tsx
│   │       ├── QuestionCard.tsx
│   │       ├── ScoreDisplay.tsx
│   │       └── WizardHeader.tsx
│   ├── hooks/                  # TanStack Query data hooks (all DB access)
│   │   ├── useAuth.tsx         # AuthProvider + useAuth (Supabase Auth)
│   │   ├── useAssessments.tsx
│   │   ├── useAssessmentFindings.tsx
│   │   ├── useAssessmentResponses.tsx
│   │   ├── useAssessmentQuestions.tsx
│   │   ├── useAssessmentStatus.tsx
│   │   ├── useWizardProgress.tsx
│   │   ├── useUserProfile.tsx
│   │   ├── useUserManagement.tsx
│   │   ├── useNDAStatus.tsx
│   │   ├── useBreadcrumbs.ts
│   │   ├── useLoadingState.tsx
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── services/               # Client-side service layer
│   │   ├── aiService.ts        # ragService, poamService, auditService, threatIntelService
│   │   ├── findingsGenerator.ts  # Auto-generates findings from wizard responses
│   │   └── AIRiskAnalysisService.ts  # MOCK — returns hardcoded data; replace in Phase 2
│   ├── context/                # React context providers
│   │   └── NotificationContext.tsx
│   ├── types/                  # TypeScript domain types
│   │   ├── questionnaire.ts    # Assessment domain types, NIST domain IDs, enums
│   │   ├── documentTypes.ts    # RMF document taxonomy
│   │   └── analytics.ts        # Risk insights, maturity trends, notification types
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Single supabase client export
│   │       └── types.ts        # Full auto-generated DB type schema
│   ├── lib/
│   │   └── utils.ts            # Tailwind cn() utility
│   └── config/
│       └── breadcrumbs.ts      # Breadcrumb route config
├── supabase/
│   ├── functions/              # Deno edge functions (AI backend)
│   │   ├── rag-query/          # Semantic search + GPT-4o-mini answer
│   │   ├── embed-document/     # Document chunking + OpenAI embeddings
│   │   ├── generate-poam/      # AI-generated POA&M from findings
│   │   ├── fetch-cve-feed/     # NVD CVE ingestion
│   │   └── seed-knowledge-base/ # Bulk knowledge base seeding
│   └── migrations/             # Postgres migration SQL files (chronological)
├── docker/
│   └── grafana/
│       ├── dashboards/         # Grafana dashboard JSON configs
│       └── datasources/        # Prometheus datasource config
├── docs/
│   ├── DATABASE_SCHEMA.md      # Human-readable DB schema reference
│   └── MIGRATION_GUIDE.md      # Migration runbook
├── scripts/
│   ├── docker-setup.sh         # Dev Docker environment setup
│   └── docker-prod-deploy.sh   # Production Docker deploy script
├── public/                     # Static assets (served as-is)
├── dev-logs/                   # Development session logs
├── .planning/                  # GSD planning artifacts
│   └── codebase/               # Codebase map documents (this file)
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite config (@/ alias → src/)
├── tailwind.config.ts          # Tailwind config
├── tsconfig.app.json           # TypeScript config for src/
├── components.json             # shadcn-ui component registry config
├── docker-compose.yml          # Dev Docker (app + Grafana + Prometheus)
├── docker-compose.prod.yml     # Production Docker compose
├── Dockerfile                  # App container build
├── PROJECT.md                  # Vision, agent architecture, phase roadmap
├── PHASE1-PLAN.md              # Phase 1 detailed implementation plan
└── package.json                # Dependencies and scripts
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One file per route. Handles layout composition, tab structures, and navigation only. No direct Supabase calls.
- Contains: Page-level components that import feature components and call hooks
- Key files: `SelfAssessmentWizard.tsx` (wizard engine), `AssessmentResults.tsx` (findings display), `Dashboard.tsx` (main hub)

**`src/components/`:**
- Purpose: All UI components, organized by feature domain in subdirectories
- Contains: Feature slices in subdirs + shared/cross-cutting components at root level
- Key files: `AppLayout.tsx` (authenticated shell), `ProtectedRoute.tsx`, `RoleBasedRoute.tsx`, `NDAGate.tsx`

**`src/hooks/`:**
- Purpose: Exclusive data access layer. Every Supabase table interaction goes through a hook here.
- Contains: TanStack Query hooks (`useQuery`, `useMutation`) wrapping `supabase.from(...)` calls
- Key files: `useAuth.tsx` (exports both hook and `AuthProvider`), `useAssessments.tsx`, `useWizardProgress.tsx`

**`src/services/`:**
- Purpose: Cross-cutting AI/backend service calls that don't fit neatly into a single hook
- Contains: Functions invoking Supabase edge functions (`supabase.functions.invoke()`) and direct table queries for audit/threat intel
- Key files: `aiService.ts` (4 service objects), `findingsGenerator.ts`, `AIRiskAnalysisService.ts` (mock — do not use for real data)

**`src/integrations/supabase/`:**
- Purpose: Auto-generated Supabase client and types — do not edit manually
- Key files: `client.ts` (import `supabase` from here), `types.ts` (all DB table/enum types)

**`src/types/`:**
- Purpose: Shared TypeScript interfaces and enums for domain models used across components, hooks, and services
- Key files: `questionnaire.ts` (8 NIST domain IDs, question/response/finding types), `documentTypes.ts`

**`supabase/functions/`:**
- Purpose: Deno serverless functions deployed to Supabase. Own all AI API keys. Called by `src/services/aiService.ts`.
- Each function is a single `index.ts` file following the pattern: auth check → fetch company_id → AI call → DB write → audit log

**`supabase/migrations/`:**
- Purpose: Ordered Postgres migration files. Never edit applied migrations — always create new ones.
- Naming: Timestamp-prefixed UUIDs (e.g., `20260105163646_8bffd07e-...sql`)
- Key migrations: The largest file (`20260105163646_...sql`) seeds all 96 NIST 800-53 assessment questions

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Mounts React app
- `src/App.tsx`: Provider tree + router root
- `index.html`: HTML shell, loads `src/main.tsx`

**Configuration:**
- `vite.config.ts`: `@` path alias to `src/`, dev port 8080
- `tailwind.config.ts`: Custom Tailwind theme
- `components.json`: shadcn-ui component config
- `tsconfig.app.json`: TypeScript settings for `src/`
- `docker-compose.yml`: Dev environment (app + Grafana + Prometheus)

**Core Logic:**
- `src/routes/ProtectedRoutes.tsx`: Defines all authenticated routes
- `src/hooks/useAuth.tsx`: Auth provider and hook
- `src/services/aiService.ts`: All edge function invocations
- `supabase/functions/rag-query/index.ts`: RAG pipeline implementation
- `supabase/functions/generate-poam/index.ts`: AI POA&M generation

**Testing:**
- `src/test/setup.ts`: Vitest test setup
- `vitest.config.ts`: Vitest configuration

**Documentation:**
- `PROJECT.md`: Full vision, agent architecture diagram, all 7 agents, phase roadmap
- `PHASE1-PLAN.md`: Phase 1 detailed implementation plan
- `docs/DATABASE_SCHEMA.md`: Human-readable DB schema reference

## Naming Conventions

**Files:**
- Pages: `PascalCase.tsx` (e.g., `Dashboard.tsx`, `SelfAssessmentWizard.tsx`)
- Feature components: `PascalCase.tsx` (e.g., `RAGChatInterface.tsx`, `POAMManager.tsx`)
- Hooks: `useFeatureName.tsx` or `useFeatureName.ts` (e.g., `useAssessments.tsx`, `useBreadcrumbs.ts`)
- Services: `featureNameService.ts` or `FeatureNameService.ts` (mixed — prefer camelCase for objects, PascalCase for classes)
- Types: `domainName.ts` (e.g., `questionnaire.ts`, `documentTypes.ts`)
- Edge functions: `kebab-case/index.ts` (e.g., `rag-query/index.ts`)
- Migrations: `YYYYMMDDHHMMSS_<uuid>.sql`

**Directories:**
- Feature component dirs: `kebab-case` (e.g., `src/components/poam/`, `src/components/wizard/`)
- Edge functions: `kebab-case` (e.g., `supabase/functions/fetch-cve-feed/`)

## Where to Add New Code

**New Page/Route:**
- Add page component to `src/pages/NewPage.tsx`
- Register route in `src/routes/ProtectedRoutes.tsx` (wrap with `<ProtectedRoute>`, `<RoleBasedRoute>` if role-restricted, `<NDAGate>` if NDA required)

**New Feature Component:**
- Create `src/components/<domain>/ComponentName.tsx`
- If domain directory doesn't exist, create it; all component files in domain dirs are `PascalCase.tsx`

**New Data Query/Mutation:**
- Add a new hook file `src/hooks/useFeatureName.tsx` using `useQuery` and `useMutation` from `@tanstack/react-query`
- Import `supabase` from `@/integrations/supabase/client`
- Use types from `@/integrations/supabase/types` for DB row types

**New AI Feature (requires server-side LLM/embedding):**
- Create `supabase/functions/feature-name/index.ts` following the existing pattern (CORS headers, auth check, profile fetch for company_id, AI call, audit log)
- Add a service function or method to `src/services/aiService.ts` that calls `supabase.functions.invoke("feature-name")`
- Export types for request/response from `src/services/aiService.ts`

**New Database Table/Column:**
- Create a new migration file in `supabase/migrations/` with current timestamp prefix
- Never edit existing migration files
- Regenerate `src/integrations/supabase/types.ts` after applying migration

**New Shared Type:**
- Add to appropriate file in `src/types/` or create a new `src/types/featureName.ts`
- Use `export interface` / `export type` — no default exports from type files

**Utilities:**
- Tailwind class merging: `src/lib/utils.ts` (`cn()` function)
- Breadcrumb routes: `src/config/breadcrumbs.ts`

## Special Directories

**`src/components/ui/`:**
- Purpose: Auto-generated shadcn-ui primitive components (button, card, dialog, input, tabs, etc.)
- Generated: Yes — managed via `npx shadcn-ui add <component>`
- Committed: Yes — committed to repo, not gitignored

**`supabase/migrations/`:**
- Purpose: Ordered Postgres migrations applied to Supabase hosted DB
- Generated: Partially — some generated by Supabase dashboard, some hand-authored
- Committed: Yes — source of truth for schema

**`.planning/`:**
- Purpose: GSD planning artifacts (phase plans, codebase maps)
- Generated: No — manually created
- Committed: Yes

**`dev-logs/`:**
- Purpose: Development session logs and debug notes
- Generated: No
- Committed: Yes

**`docker/grafana/`:**
- Purpose: Grafana dashboard JSON and Prometheus datasource configs for Docker monitoring stack
- Generated: No (exported from Grafana, then committed)
- Committed: Yes

---

*Structure analysis: 2026-03-26*
