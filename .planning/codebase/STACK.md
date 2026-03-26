# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.5 - All frontend source code in `src/`
- SQL - Database migrations in `supabase/migrations/`

**Secondary:**
- TypeScript (Deno runtime) - Supabase Edge Functions in `supabase/functions/`

## Runtime

**Environment:**
- Node.js 18 (Dockerfile base: `node:18-alpine`), `.nvmrc` specifies v24.14.0 for local dev
- Deno (Supabase Edge Functions runtime via `deno.land/std@0.168.0`)

**Package Manager:**
- npm (primary) — `package-lock.json` present
- bun — `bun.lockb` also present (dual lockfiles, npm is canonical per Dockerfile using `npm ci`)

## Frameworks

**Core:**
- React 18.3 — UI rendering, `src/` is a SPA
- React Router DOM 6.26 — Client-side routing, configured in `src/routes/`
- Vite 5.4 — Build tool and dev server (`vite.config.ts`), dev port `8080`
- `@vitejs/plugin-react-swc` — Fast React transform via SWC

**UI / Component Library:**
- shadcn/ui — Component system built on Radix UI primitives, configured in `components.json`
- Radix UI — Full suite of headless primitives (`@radix-ui/react-*`, 20+ packages)
- Tailwind CSS 3.4 — Utility styling (`tailwind.config.ts`), with `tailwindcss-animate` plugin
- Lucide React 0.462 — Icon library
- `next-themes` 0.3 — Dark/light theme support (class-based, `darkMode: ["class"]`)
- Recharts 2.12 — Data visualization/charting
- Embla Carousel — Carousel component
- `react-resizable-panels` — Resizable panel layouts
- Sonner 1.5 — Toast notification library (used alongside Radix toast)
- `vaul` 0.9 — Drawer component

**Forms & Validation:**
- React Hook Form 7.53 — Form state management
- `@hookform/resolvers` 3.9 — Zod schema resolvers
- Zod 3.23 — Runtime schema validation

**Data Fetching / State:**
- TanStack Query (React Query) 5.56 — Server state, caching, data fetching

**Testing:**
- Vitest 3.2 — Test runner (`vitest.config.ts`, jsdom environment)
- `@testing-library/react` 16.3 — Component testing utilities
- `@testing-library/jest-dom` 6.6 — DOM matchers
- `@vitest/ui` — Browser UI for tests
- jsdom 26 — DOM simulation

**Build/Dev:**
- PostCSS 8.4 (`postcss.config.js`) — CSS processing with autoprefixer
- `lovable-tagger` — Lovable platform component tagging plugin (dev-only, `vite.config.ts`)
- ESLint 9.9 (`eslint.config.js`) — Linting with `typescript-eslint`, `react-hooks`, `react-refresh` plugins

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.49 — Primary BaaS client for auth, database, and edge function invocation
- `react-router-dom` 6.26 — SPA routing, critical for navigation
- `@tanstack/react-query` 5.56 — All data fetching patterns use this
- `zod` 3.23 — Type-safe validation for forms and API contracts

**Infrastructure:**
- `class-variance-authority` 0.7 — Component variant styling (used by all shadcn components)
- `clsx` + `tailwind-merge` — Class name utilities used in `src/lib/utils.ts`
- `date-fns` 3.6 — Date manipulation throughout the app
- `cmdk` 1.0 — Command palette component
- `input-otp` 1.2 — OTP input component

## Configuration

**Environment:**
- `.env.example` defines: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`
- Supabase URL and anon key are hard-coded in `src/integrations/supabase/client.ts` (auto-generated file — do not edit manually)
- Edge functions access `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY` via Deno environment

**TypeScript:**
- Config root: `tsconfig.json` (references `tsconfig.app.json` and `tsconfig.node.json`)
- Path alias `@/*` → `./src/*` (set in both `tsconfig.json` and `vite.config.ts`)
- Strict mode relaxed: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`

**Build:**
- `vite.config.ts` — SWC plugin, path aliases, dev server on port `8080`
- `tailwind.config.ts` — Custom CSS variables-based color system, sidebar tokens, animation keyframes
- `postcss.config.js` — Autoprefixer

## Platform Requirements

**Development:**
- Node.js 18+ (Dockerfile), v24.14.0 preferred locally per `.nvmrc`
- npm for package management
- Supabase CLI for local edge function development and migrations

**Production:**
- Docker: multi-stage build (node:18-alpine builder → nginx:alpine runtime)
- Nginx serves the built `/dist` as a static SPA
- `docker-compose.prod.yml` runs: `web` (nginx), `redis:7-alpine`, `prometheus`, `grafana`, `nginx-proxy`
- Redis 7 with AOF persistence, 256 MB max memory (LRU eviction)
- Prometheus + Grafana for observability (`docker/prometheus.yml`, `docker/grafana/`)
- SSL termination via nginx-proxy with certs mounted at `docker/ssl/`

---

*Stack analysis: 2026-03-26*
