# Technology Stack: Agentic AI + CMMC Compliance Layer

**Project:** ASSESS-AI v1 (7 AI Agents + CMMC Framework + Subscription Billing)
**Researched:** 2026-03-26
**Scope:** New capabilities layered onto existing React + Vite + Supabase stack

## Recommended Stack

This covers ONLY the new technology needed for the agent layer, CMMC data, and payment system. The existing stack (React 18, Vite 5, Supabase, TanStack Query, shadcn/ui, Zod, React Hook Form) is unchanged.

### Agent Orchestration & AI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel AI SDK (`ai`) | 6.x (current: 6.0.138) | Unified agent runtime, tool execution loop, structured output | TypeScript-native, runs in both browser and Deno/Edge, unified API across providers, Agent interface with ToolLoopAgent handles the full tool-call cycle. 20M+ monthly downloads, production-proven. Already Zod-integrated for structured output which matches existing validation stack. | HIGH |
| `@ai-sdk/anthropic` | 3.x (current: 3.0.64) | Claude provider for AI SDK | Claude is the designated reasoning engine per PROJECT.md. This provider wraps the Anthropic API with AI SDK's unified interface -- tool use, streaming, structured output all work through one API. | HIGH |
| `@ai-sdk/openai` | (keep existing) | OpenAI provider for embeddings/RAG | Existing RAG system uses OpenAI embeddings + GPT-4o-mini. Keep this for embeddings; use Claude via @ai-sdk/anthropic for agent reasoning. No need to migrate the working RAG. | HIGH |

**Why Vercel AI SDK over alternatives:**

| Alternative | Why Not |
|------------|---------|
| LangGraph (Python) | Python-based. Existing codebase is 100% TypeScript. Adding Python introduces a second runtime, deployment complexity, and cross-language serialization. LangGraph is excellent for Python shops but wrong for this stack. |
| LangChain.js | Heavier abstraction layer with more opinions than needed. AI SDK is lighter, more composable, and has better Deno/Edge compatibility. LangChain.js also has a history of breaking changes between versions. |
| Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) | Designed for Claude Code-style autonomous agents (file system, shell access). Overkill and wrong abstraction for security analysis agents that need structured tool calls, not OS-level access. Version 0.2.x -- still pre-1.0 and evolving rapidly. |
| Direct Anthropic SDK (`@anthropic-ai/sdk`) | Works but forces manual tool-call loop management, no streaming abstractions, no provider-switching. AI SDK wraps this with production patterns (retry, structured output, stop conditions). |
| CrewAI / AutoGen | Python frameworks. Same runtime mismatch as LangGraph. |

### CMMC & Compliance Data

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| NIST OSCAL Content (JSON) | SP 800-53 Rev 5.2.0, SP 800-171 Rev 2 | Machine-readable control catalogs | Official NIST GitHub repo (`usnistgov/oscal-content`) provides 800-53 and 800-171 controls in JSON/YAML/XML. Seed your database from these -- no manual data entry. | HIGH |
| Fathom5 OSCAL 800-171 Catalog | Rev 2 | Community-maintained 800-171 OSCAL JSON | NIST does not yet publish an official 800-171 OSCAL catalog. Fathom5's is the most widely referenced community version. Cross-validate against DoD CMMC Assessment Guide. | MEDIUM |
| CMMC Assessment Guide L2 v2.13 | v2.13 | Assessment objectives, evidence requirements | Official DoD document. PDF-only -- will need to be parsed/structured into database tables. Maps 1:1 to NIST 800-171 Rev 2's 110 controls. | HIGH |
| NVD API | 2.0 | CVE feed (already integrated) | Existing integration. Continue using for vulnerability data that feeds the Threat Intelligence agent. | HIGH |

**Critical CMMC data decision:** Build on NIST 800-171 **Revision 2**, not Rev 3. CMMC 2.0 is legally codified around Rev 2. Implementing Rev 3 prematurely can cause audit failure. Phase 2 third-party assessments start November 2026 -- Rev 2 is the standard for at least the next 18 months.

**What NOT to use:**
- Do NOT purchase a commercial CMMC control database (e.g., from GRC vendors). The OSCAL JSON data is free and authoritative.
- Do NOT attempt to scrape CMMC documentation. Use the structured OSCAL catalogs.
- Do NOT map to Rev 3 yet. Build a Rev 2 -> Rev 3 crosswalk table for future migration, but assess against Rev 2.

### Agent Communication (Inter-Agent Messaging)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Realtime Broadcast | (built into `@supabase/supabase-js` 2.x) | Agent-to-agent pub/sub messaging | Already in the stack. Channel-based pub/sub over WebSockets. Agents publish to topic channels (e.g., `agent:ciso`, `agent:soc-analyst`), others subscribe. No new infrastructure. REST API allows Edge Functions to broadcast server-side. | HIGH |
| Supabase Database (agent_messages table) | PostgreSQL via Supabase | Persistent message log, task queue, state | Broadcast is ephemeral (not persisted). For audit trail and task management, write agent messages to a `agent_messages` table. Agents poll or use Realtime Postgres Changes to react. This is the "durable message bus." | HIGH |
| Supabase Realtime Presence | (built-in) | Agent status tracking (online, busy, idle, error) | Shows which agents are active in real-time on the dashboard. Built into Realtime -- zero additional infrastructure. | MEDIUM |

**Why NOT a dedicated message bus (Kafka, RabbitMQ, Redis Pub/Sub):**
- Seven agents with human-speed interaction patterns do not need Kafka-scale throughput.
- Supabase Realtime handles the volume (sub-100 messages/second for this use case).
- Adding Kafka/RabbitMQ means new infrastructure to deploy, monitor, and pay for.
- The 1 MB message size limit is more than sufficient for agent task payloads (JSON commands, not file transfers).
- Keep it simple. If you outgrow Realtime (unlikely at this scale), migrate later.

### Agent State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Database (PostgreSQL) | (existing) | Agent task state, execution history, approval gates | Agents are serverless (Edge Functions). State cannot live in memory. Store agent state (current task, step, status, last output) in dedicated tables. TanStack Query on the frontend provides real-time cache of agent state. | HIGH |
| Zod | 3.23 (existing) | Agent message schemas, tool input/output validation | Already in the stack. Define strict schemas for every agent message type, tool input, and tool output. AI SDK's structured output uses Zod natively. Single validation library across frontend forms AND agent I/O. | HIGH |

### Payment & Subscription

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Stripe (server SDK) | `stripe` 21.x (current: 21.0.0) | Subscription management, invoicing, payment processing | Industry standard for SaaS billing. Supports tiered pricing ($2-5k/month range), metered billing if needed later, built-in dunning/retry. TypeScript types included. Node.js 18+ support confirmed. | HIGH |
| `@stripe/stripe-js` | 8.x (current: 8.11.0) | Client-side Stripe.js loader | Loads Stripe.js for secure payment element rendering. PCI compliance handled by Stripe -- never touch card numbers. | HIGH |
| `@stripe/react-stripe-js` | 6.x (current: 6.0.0) | React components for Stripe Elements | `<Elements>`, `<PaymentElement>`, `<CardElement>` components. Integrates with existing React 18 app. shadcn/ui styling can wrap Stripe Elements. | HIGH |
| Supabase Edge Functions | (existing) | Stripe webhook handler, checkout session creation | Supabase has official Stripe webhook Edge Function examples. Handles `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_failed` events. Writes subscription status to a `subscriptions` table. | HIGH |

**Why Stripe over alternatives:**

| Alternative | Why Not |
|------------|---------|
| Paddle | Higher fees, less control over billing logic, smaller ecosystem. Better for simple SaaS, not $2-5k/month enterprise-ish pricing. |
| LemonSqueezy | Merchant of Record model handles tax but takes larger cut. At $2-5k/month price point, Stripe's 2.9% + 30c is more economical. |
| Custom billing | Never. PCI compliance alone makes this a non-starter. |
| Square | B2C focused. No SaaS subscription primitives comparable to Stripe Billing. |

**Stripe architecture pattern for this project:**
```
Frontend (React) --> Stripe Checkout/Customer Portal (hosted by Stripe)
                 --> Supabase Edge Function (create-checkout-session)
                 --> Supabase Edge Function (stripe-webhook handler)
                 --> subscriptions table in Supabase
                 --> Row Level Security checks subscription_status
```

### Agent Execution Runtime

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Edge Functions (Deno) | Deno runtime (current) | Agent execution environment | Each agent runs as one or more Edge Functions. Serverless, auto-scaling, built-in auth context. Already in the stack for existing AI features. npm: imports supported for AI SDK packages. | HIGH |

**Deno + AI SDK compatibility note:** Supabase Edge Functions run on Deno, which supports npm packages via `npm:` specifier prefix. In your function's `deno.json`, declare dependencies like:
```json
{
  "imports": {
    "ai": "npm:ai@6",
    "@ai-sdk/anthropic": "npm:@ai-sdk/anthropic@3"
  }
}
```
This is a verified pattern -- Supabase officially documents npm compatibility in Edge Functions, and developers have confirmed AI SDK works in this environment.

### Observability & Monitoring

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Existing Prometheus + Grafana | (existing Docker stack) | Agent execution metrics | Extend existing monitoring. Add custom metrics for: agent execution duration, tool call counts, approval gate latency, error rates per agent. | HIGH |
| Supabase Audit Log (existing) | (existing pattern) | Agent decision audit trail | Every agent decision already goes through audit logging. Extend the schema to include: agent_id, reasoning_chain, tool_calls, confidence_score, human_approval_status. | HIGH |

## Supporting Libraries (New Additions)

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `uuid` | 11.x | Generate unique IDs for agent tasks, messages | Every agent task needs a correlation ID for tracing | MEDIUM |
| `cron` or Supabase pg_cron | -- | Scheduled agent runs (threat intel polling, compliance checks) | Threat Intel agent needs periodic execution; GRC agent needs scheduled compliance scans | HIGH |

**Libraries explicitly NOT needed:**
- `socket.io` -- Supabase Realtime handles WebSocket communication
- `bull` / `bullmq` -- No Redis-based job queue needed; agent tasks flow through Supabase tables
- `axios` -- Use native `fetch` in Deno Edge Functions
- `jsonwebtoken` -- Supabase handles JWT validation
- `langchain` -- AI SDK covers the same ground with less abstraction overhead

## Complete New Dependencies

### Frontend (React app -- npm install)

```bash
# Payment
npm install @stripe/stripe-js@8 @stripe/react-stripe-js@6

# AI SDK (for client-side streaming UI if showing agent reasoning in real-time)
npm install ai@6 @ai-sdk/anthropic@3
```

### Edge Functions (Deno -- deno.json imports)

```json
{
  "imports": {
    "ai": "npm:ai@6",
    "@ai-sdk/anthropic": "npm:@ai-sdk/anthropic@3",
    "@ai-sdk/openai": "npm:@ai-sdk/openai@1",
    "stripe": "npm:stripe@21",
    "zod": "npm:zod@3"
  }
}
```

## Version Verification

| Package | Claimed | Verified Via | Date |
|---------|---------|-------------|------|
| `ai` | 6.0.138 | npm registry search result | 2026-03-26 |
| `@ai-sdk/anthropic` | 3.0.64 | npm registry search result | 2026-03-26 |
| `@stripe/stripe-js` | 8.11.0 | npm registry search result | 2026-03-26 |
| `@stripe/react-stripe-js` | 6.0.0 | npm registry search result | 2026-03-26 |
| `stripe` (server) | 21.0.0 | npm/GitHub releases search result | 2026-03-26 |
| OSCAL 800-53 content | Rev 5.2.0 | NIST GitHub (usnistgov/oscal-content) | 2026-03-26 |
| CMMC Assessment Guide | L2 v2.13 | DoD CIO portal | 2026-03-26 |

## Sources

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) -- HIGH confidence, official docs
- [AI SDK npm package](https://www.npmjs.com/package/ai) -- version 6.0.138 verified
- [@ai-sdk/anthropic npm](https://www.npmjs.com/package/@ai-sdk/anthropic) -- version 3.0.64 verified
- [Anthropic Agent SDK TypeScript](https://github.com/anthropics/claude-agent-sdk-typescript) -- reviewed, NOT recommended for this use case
- [NIST OSCAL Content Repository](https://github.com/usnistgov/oscal-content) -- official NIST source
- [Fathom5 800-171 OSCAL Catalog](https://github.com/FATHOM5CORP/oscal) -- community-maintained
- [CMMC Assessment Guide Level 2](https://dodcio.defense.gov/Portals/0/Documents/CMMC/AssessmentGuideL2v2.pdf) -- official DoD
- [CMMC-NIST Alignment](https://dodcio.defense.gov/Portals/0/Documents/CMMC/CMMC-AlignmentNIST-Standards.pdf) -- official DoD
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast) -- official docs
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits) -- 1MB message limit
- [Supabase Edge Functions Dependencies](https://supabase.com/docs/guides/functions/dependencies) -- npm: import pattern
- [Supabase Stripe Webhook Example](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) -- official integration pattern
- [Stripe Billing Documentation](https://docs.stripe.com/billing/subscriptions/build-subscriptions) -- subscription integration
- [Stripe npm package](https://www.npmjs.com/package/stripe) -- version 21.0.0 verified
- [@stripe/react-stripe-js npm](https://www.npmjs.com/package/@stripe/react-stripe-js) -- version 6.0.0 verified
- [NIST 800-171 Rev 2 vs Rev 3 for CMMC](https://isidefense.com/blog/nist-800-171-rev-2-vs-rev-3-what-defense-contractors-need-to-know-now) -- Rev 2 is current standard
- [2026 NIST Compliance Guide on Rev 3 Trap](https://www.complyjet.com/blog/nist-compliance-guide) -- confirms Rev 2 for CMMC assessments

---

*Stack research: 2026-03-26*
