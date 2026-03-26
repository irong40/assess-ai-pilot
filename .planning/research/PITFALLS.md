# Domain Pitfalls: AI-Powered CMMC Compliance Platform

**Domain:** Multi-agent AI security/compliance SaaS for defense contractors
**Researched:** 2026-03-26

## Critical Pitfalls

Mistakes that cause rewrites, legal exposure, or product failure.

### Pitfall 1: Building on NIST 800-171 Rev 3 Instead of Rev 2

**What goes wrong:** You implement CMMC controls based on NIST 800-171 Revision 3, thinking it's "more current." Your customers fail their CMMC assessments.
**Why it happens:** Rev 3 was published by NIST and looks like the latest. Developers assume "latest = correct."
**Consequences:** CMMC 2.0 is legally codified around Rev 2. C3PAO assessors benchmark against Rev 2. Implementing Rev 3 controls prematurely can lead to deficiency marks and official audit failure. Customers lose trust, demand refunds, leave negative reviews in the small DIB community.
**Prevention:** Seed the controls database from NIST 800-171 Rev 2 OSCAL data. Add a `framework_version` column to the controls table. Build a Rev 2 -> Rev 3 crosswalk table for future migration, but do not expose Rev 3 controls in the assessment workflow until CMMC officially adopts it.
**Detection:** If any control ID starts with a Rev 3 format or references Rev 3-specific families, flag it immediately.
**Confidence:** HIGH -- multiple official DoD sources and compliance guides confirm Rev 2 is the CMMC standard through at least November 2026.

### Pitfall 2: Agent Circular Delegation Loops

**What goes wrong:** Agent A delegates to Agent B, which delegates to Agent C, which delegates back to Agent A. The system enters an infinite loop consuming Claude API tokens ($$$) and Edge Function compute.
**Why it happens:** Multi-agent systems without strict delegation hierarchies naturally develop circular dependencies, especially when agents are allowed to invoke each other freely.
**Consequences:** Runaway API costs (Claude charges per token), Edge Function timeouts, degraded system performance, confusing audit trails.
**Prevention:**
1. Enforce hierarchical delegation: ONLY the CISO Orchestrator creates tasks for other agents
2. Add a `delegation_depth` counter to agent_tasks. Hard limit at 3 levels deep.
3. Track `parent_task_id` chains. Before creating a new task, check that the target agent doesn't already have a pending task in the same chain.
4. Set per-task token budgets in the AI SDK `maxTokens` parameter.
**Detection:** Monitor agent_tasks for chains longer than 3. Alert on any task that has been running for more than 5 minutes.

### Pitfall 3: Missing Human-in-the-Loop for Compliance Assertions

**What goes wrong:** An AI agent marks a CMMC control as "compliant" and that assertion feeds into the customer's official SPRS (Supplier Performance Risk System) score or SSP without human review.
**Why it happens:** Developers optimize for automation and forget that compliance is a legal assertion. The person signing the SSP is legally responsible.
**Consequences:** False compliance claims can result in False Claims Act liability for the contractor (treble damages). If the customer gets audited and a C3PAO finds AI-generated compliance assertions without human attestation, the assessment fails.
**Prevention:** Every compliance status change (NOT_ASSESSED -> COMPLIANT, NOT_ASSESSED -> NON_COMPLIANT) goes through the approval gate. The agent recommends; the human decides. Log both the AI recommendation and the human decision with timestamps.
**Detection:** Audit the `agent_approvals` table. Any compliance assertion without a `reviewed_by` user ID is a critical bug.

### Pitfall 4: Unbounded Claude API Costs Per Tenant

**What goes wrong:** A single customer triggers extensive agent activity (full compliance assessment, all 7 agents running, each making multiple tool calls with long contexts). Monthly Claude API bill exceeds the customer's subscription revenue.
**Why it happens:** AI token costs are invisible during development. No per-tenant budgeting or throttling.
**Consequences:** Negative unit economics. At $2-5k/month revenue per customer, even one $500+ API bill per customer erodes margins. With complex security analysis, a single agent run can consume 100k+ tokens.
**Prevention:**
1. Set `maxTokens` in every AI SDK `generateText` call (not unlimited)
2. Implement per-tenant monthly token budgets tracked in a `usage` table
3. Use Claude Haiku for simple classification tasks, Sonnet for complex reasoning (not Opus for everything)
4. Cache common compliance Q&A responses to avoid repeated API calls for identical questions
5. Track cost per agent per task in the audit log
**Detection:** Dashboard showing token usage per customer per month. Alert when any customer exceeds 80% of their token budget.

### Pitfall 5: Supabase Edge Function Timeout on Complex Agent Tasks

**What goes wrong:** A complex agent task (e.g., full gap analysis across 110 CMMC controls) exceeds the Edge Function execution time limit.
**Why it happens:** Supabase Edge Functions have execution time limits (varies by plan, typically 60s on free, up to 400s on Pro). A full compliance analysis with multiple Claude API calls can take minutes.
**Consequences:** Task fails mid-execution. Partial results written to database. Agent state becomes inconsistent.
**Prevention:**
1. Break complex tasks into smaller subtasks. "Analyze all 110 controls" becomes 14 family-level subtasks.
2. Use the CISO Orchestrator to chain subtasks sequentially.
3. Each subtask fits within the Edge Function timeout window.
4. Implement idempotent task execution -- if a task is retried, it picks up where it left off (check which control families are already analyzed).
**Detection:** Monitor Edge Function execution durations in Grafana. Alert on any execution exceeding 80% of the timeout limit.

### Pitfall 6: Multi-Tenant Data Leakage in Agent Context

**What goes wrong:** Agent for Company A accidentally receives context or findings from Company B, because the agent's system prompt or tool results aren't properly scoped.
**Why it happens:** Edge Functions use the service role key (bypasses RLS). If queries don't include `company_id` filters, they return all tenants' data.
**Consequences:** Compliance violation, customer trust destruction, potential ITAR (International Traffic in Arms Regulations) violation if defense contractor data is exposed cross-tenant.
**Prevention:**
1. Every database query in agent code includes `.eq('company_id', task.company_id)`
2. The shared agent base module enforces company_id scoping at the framework level -- individual agents can't bypass it
3. Automated tests that verify no agent query returns data from a different company_id
4. RLS policies as a safety net (even though Edge Functions use service role)
**Detection:** Add a test suite that runs each agent with two different company_ids and verifies zero cross-contamination.

## Moderate Pitfalls

### Pitfall 7: Over-Engineering the "Pen Test Agent" and Creating Legal Liability

**What goes wrong:** The Pen Test agent actively scans customer networks, accidentally takes down a production system, or triggers IDS alerts at a DoD-adjacent network.
**Prevention:** v1 Pen Test agent does NOT perform active scanning. Limit to: dependency vulnerability checking (from provided SBOMs), configuration review (from uploaded configs), known CVE matching against declared assets. Label it "Vulnerability Discovery" not "Penetration Testing." Add explicit disclaimers and Terms of Service covering scope.

### Pitfall 8: Shipping All 7 Agents Before Any Are Production-Quality

**What goes wrong:** You build all 7 agents to 60% quality instead of building 2-3 to 95% quality. Every agent has bugs, none deliver reliable value, customers churn.
**Prevention:** Ship agents incrementally: GRC Analyst and CISO Orchestrator first (core compliance value). Get them production-solid. Then add agents one at a time. Each new agent should feel like a product upgrade, not a bugfix target.

### Pitfall 9: Stripe Webhook Event Ordering and Idempotency

**What goes wrong:** Stripe webhooks arrive out of order or are delivered multiple times. Your subscription status gets corrupted (e.g., `subscription.deleted` arrives before `subscription.created`).
**Prevention:**
1. Store the Stripe event ID and check for duplicates before processing
2. Use Stripe's `created` timestamp to handle out-of-order events
3. Always fetch the latest subscription state from Stripe API when processing a webhook (don't rely solely on the webhook payload)
4. Implement the official Supabase Stripe webhook Edge Function pattern which handles these cases

### Pitfall 10: Agent Hallucination in Compliance Recommendations

**What goes wrong:** Claude generates a compliance recommendation that sounds authoritative but is factually wrong about a specific CMMC requirement.
**Prevention:**
1. Ground all compliance analysis in the database controls table (seeded from OSCAL). The agent's tools should query actual control text, not rely on the LLM's training data.
2. Include the exact control text in the agent's context for every compliance assessment.
3. Require agents to cite specific control IDs in their output (structured output with Zod validation).
4. Human review for all compliance assertions (see Pitfall 3).

### Pitfall 11: Cold Start Latency Creating Poor Agent Dashboard UX

**What goes wrong:** User clicks "Run Analysis" on the agent dashboard. Nothing happens for 5-10 seconds while the Edge Function cold-starts.
**Prevention:**
1. Show immediate "Task Queued" status in the UI when the task is created in the database (optimistic update via TanStack Query)
2. Subscribe to Realtime for status changes so the UI updates as soon as the function starts
3. Consider pre-warming critical agent functions with periodic health checks
4. Set realistic user expectations with progress indicators

## Minor Pitfalls

### Pitfall 12: OSCAL Data Model Complexity

**What goes wrong:** You try to import the full OSCAL data model (profiles, baselines, assessment plans, results) and the schema becomes unwieldy.
**Prevention:** Import ONLY the catalog layer (controls + control families). Flatten into your own simplified schema. You're building a product, not an OSCAL reference implementation.

### Pitfall 13: Stripe Test Mode vs. Live Mode Confusion

**What goes wrong:** Development and production environments accidentally share Stripe keys. Test charges appear on real cards, or production charges go to test mode.
**Prevention:** Use separate Stripe accounts for test and production. Store keys in Supabase Edge Function secrets, never in code. Verify `STRIPE_SECRET_KEY` prefix: `sk_test_` vs `sk_live_`.

### Pitfall 14: Agent Dashboard Showing Stale Data After Browser Tab Sits Idle

**What goes wrong:** User leaves the agent dashboard open in a background tab. WebSocket disconnects. When they return, they see stale agent status.
**Prevention:** Supabase Realtime auto-reconnects, but implement a "last synced" indicator and a manual refresh button. On tab focus, trigger a TanStack Query refetch for critical data.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| CMMC data seeding | Using Rev 3 instead of Rev 2 (Pitfall 1) | Validate framework_version in seed script |
| Agent runtime setup | Circular delegation (Pitfall 2) | Enforce hierarchy from day 1 |
| First agent (GRC) | Edge Function timeout (Pitfall 5) | Break into control-family-level subtasks |
| Agent communication | Cross-tenant leakage (Pitfall 6) | Company_id scoping in shared base module |
| Approval gates | Auto-approving compliance assertions (Pitfall 3) | Default ALL compliance changes to require approval |
| Pen Test agent | Active scanning liability (Pitfall 7) | Passive-only scope, clear ToS |
| Stripe integration | Webhook ordering (Pitfall 9) | Idempotency + fetch latest state pattern |
| Scaling to 10+ customers | Unbounded API costs (Pitfall 4) | Token budgets before first paying customer |
| All agents live | Shipping all at once at low quality (Pitfall 8) | Incremental rollout: GRC -> CISO -> SOC -> rest |

## Sources

- [NIST 800-171 Rev 2 vs Rev 3 for CMMC](https://isidefense.com/blog/nist-800-171-rev-2-vs-rev-3-what-defense-contractors-need-to-know-now) -- Rev 2 requirement
- [2026 NIST Compliance Guide](https://www.complyjet.com/blog/nist-compliance-guide) -- Rev 3 trap warning
- [CMMC Assessment Guide Level 2](https://dodcio.defense.gov/Portals/0/Documents/CMMC/AssessmentGuideL2v2.pdf) -- assessment process
- [LangGraph Agents in Production](https://www.alphabold.com/langgraph-agents-in-production/) -- production agent challenges (applicable to any framework)
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits) -- rate limiting, message sizes
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) -- execution time limits
- [Stripe Webhook Best Practices](https://docs.stripe.com/billing/subscriptions/build-subscriptions) -- idempotency, event ordering
- [Supabase Stripe Webhook Example](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) -- reference implementation
- [Multi-Agent Architecture Pitfalls](https://singhajit.com/multi-agent-ai-swarms-system-design/) -- circular delegation, state management

---

*Pitfalls research: 2026-03-26*
