# Architecture Patterns: Multi-Agent Security Platform

**Domain:** AI-powered CMMC compliance with 7 autonomous security agents
**Researched:** 2026-03-26

## Recommended Architecture

### High-Level System Structure

```
+---------------------------------------------------+
|                   React Frontend                   |
|  (Vite SPA, shadcn/ui, TanStack Query)           |
|                                                    |
|  [Agent Dashboard] [Compliance Dashboard] [Chat]  |
|  [Assessment Wizard] [Billing/Onboarding]         |
+-------------------+-------------------------------+
                    |
          Supabase Client SDK
          (Auth, Realtime, REST)
                    |
+-------------------v-------------------------------+
|              Supabase Platform                     |
|                                                    |
|  +---AUTH---+ +--REALTIME--+ +---STORAGE---+      |
|  | JWT/RBAC | | Broadcast  | | Documents   |      |
|  |          | | Presence   | | Evidence    |      |
|  +----------+ | PG Changes | +-------------+      |
|               +------------+                       |
|                                                    |
|  +---------- PostgreSQL Database ----------+      |
|  | controls | assessments | agent_tasks    |      |
|  | findings | agent_messages | approvals   |      |
|  | subscriptions | audit_log | companies   |      |
|  +------------------------------------------+      |
|                                                    |
|  +---------- Edge Functions (Deno) --------+      |
|  |                                          |      |
|  |  [CISO Orchestrator Agent]               |      |
|  |  [SOC Analyst Agent]                     |      |
|  |  [Threat Intel Agent]                    |      |
|  |  [GRC Analyst Agent]                     |      |
|  |  [Incident Response Agent]               |      |
|  |  [AppSec Engineer Agent]                 |      |
|  |  [Pen Test Agent]                        |      |
|  |                                          |      |
|  |  [Stripe Webhook Handler]                |      |
|  |  [RAG/Embedding Service]                 |      |
|  +------------------------------------------+      |
+---------------------------------------------------+
                    |
         External API Calls
                    |
     +----+---------+--------+------+
     |    |         |        |      |
  Claude  OpenAI   NVD    Stripe  (future
  API     API      API    API     integrations)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| React Frontend | UI rendering, user interaction, real-time subscriptions | Supabase (auth, database, realtime, edge functions) |
| Agent Dashboard | Display agent status, logs, approve/deny actions | Supabase Realtime (subscribe to agent channels), agent_tasks table |
| Compliance Dashboard | CMMC progress, maturity scoring, gap visualization | controls, assessments, findings tables via TanStack Query |
| CISO Orchestrator Agent | Task delegation, prioritization, executive report generation | All other agents via agent_messages table + Realtime Broadcast |
| Specialist Agents (6) | Domain-specific analysis (SOC, Threat Intel, GRC, IR, AppSec, PenTest) | CISO agent (receive tasks, report results), database (read/write findings) |
| Agent Shared Services | Common functions: logging, approval gates, state management | All agents import from shared module |
| Supabase Database | Persistent state, audit trail, multi-tenant data | All components (source of truth) |
| Supabase Realtime | Ephemeral messaging, presence, live updates | Frontend (subscriptions), Edge Functions (broadcast REST API) |
| Stripe Integration | Billing, subscription lifecycle, payment processing | Frontend (checkout), Edge Functions (webhooks), subscriptions table |

### Data Flow

**Agent Task Lifecycle:**
```
1. Trigger (user action, schedule, or CISO delegation)
   |
2. Create task in agent_tasks table
   Status: PENDING
   |
3. Edge Function picks up task
   Status: RUNNING
   |
4. Agent reasons (Claude API via AI SDK)
   - Calls tools as needed
   - Each tool call logged to agent_tool_calls table
   |
5. Agent produces result
   |
6. IF high_impact:
   |   Status: AWAITING_APPROVAL
   |   --> Broadcast to approval channel
   |   --> Human reviews in Agent Dashboard
   |   --> APPROVED or REJECTED
   |
7. Result written to relevant tables (findings, reports, etc.)
   Status: COMPLETED
   |
8. Broadcast completion event
   --> Dashboard updates via Realtime
   --> CISO agent may chain next task
```

**Agent-to-Agent Communication:**
```
CISO Orchestrator
  |
  |--> Writes task to agent_tasks (target_agent: 'grc-analyst')
  |--> Broadcasts to 'agent:grc-analyst' channel (notification)
  |
  GRC Analyst Agent
    |
    |--> Reads task from agent_tasks
    |--> Executes analysis
    |--> Writes result to agent_tasks (status: COMPLETED)
    |--> Broadcasts to 'agent:ciso' channel (result notification)
    |
    CISO Orchestrator
      |--> Reads result
      |--> May delegate follow-up to another agent
```

## Patterns to Follow

### Pattern 1: Agent as Stateless Edge Function + Stateful Database

**What:** Each agent is a Supabase Edge Function that reads its task from the database, executes, and writes results back. No in-memory state between invocations.

**When:** Always. This is the foundational pattern.

**Why:** Edge Functions are serverless -- they spin up, execute, and terminate. State MUST live in the database. This gives you: free retry (re-invoke the function), audit trail (every state change is a row), and horizontal scaling (multiple invocations for different tenants).

**Example:**
```typescript
// supabase/functions/agent-grc-analyst/index.ts
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const TaskSchema = z.object({
  id: z.string().uuid(),
  agent_type: z.literal("grc-analyst"),
  company_id: z.string().uuid(),
  input: z.object({
    action: z.enum(["gap-analysis", "control-review", "policy-check"]),
    control_ids: z.array(z.string()).optional(),
  }),
});

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const task = TaskSchema.parse(await req.json());

  // Update status
  await supabase
    .from("agent_tasks")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", task.id);

  // Agent reasoning via AI SDK
  const result = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: "You are a GRC Analyst specializing in CMMC Level 2 compliance...",
    prompt: `Analyze compliance gaps for controls: ${task.input.control_ids}`,
    tools: {
      queryControls: { /* tool definition */ },
      queryAssessments: { /* tool definition */ },
    },
  });

  // Write result
  await supabase
    .from("agent_tasks")
    .update({
      status: result.requiresApproval ? "awaiting_approval" : "completed",
      output: result.text,
      completed_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  return new Response(JSON.stringify({ success: true }));
});
```

### Pattern 2: Shared Agent Base Module

**What:** A common module imported by all agents that handles: state transitions, audit logging, approval gate checks, error handling, and Realtime broadcasting.

**When:** Every agent imports this. Prevents 7 copies of boilerplate.

**Example:**
```typescript
// supabase/functions/_shared/agent-base.ts
export async function executeAgentTask(
  supabase: SupabaseClient,
  taskId: string,
  handler: (task: AgentTask) => Promise<AgentResult>
) {
  // 1. Fetch and validate task
  // 2. Update status to RUNNING
  // 3. Execute handler with try/catch
  // 4. Log all tool calls to audit_log
  // 5. Check if result needs approval
  // 6. Update task status
  // 7. Broadcast completion
}
```

### Pattern 3: Hierarchical Agent Delegation

**What:** The CISO Orchestrator is the ONLY agent that creates tasks for other agents. Specialist agents never directly invoke each other.

**When:** Always. This prevents circular delegation and makes the task chain traceable.

**Why:** Without a single delegation authority, agents can enter infinite loops (A asks B, B asks C, C asks A). The CISO orchestrator acts as a "manager" -- it receives results from specialists and decides what to do next.

**Exception:** An agent CAN read data produced by another agent (e.g., SOC reads Threat Intel findings). But it cannot TELL another agent to do something. Only CISO orchestrates.

### Pattern 4: Approval Gates as Database State Machine

**What:** High-impact actions go through PENDING -> AWAITING_APPROVAL -> APPROVED/REJECTED states in the database. The frontend subscribes to Realtime changes on the approval table.

**When:** Any agent action classified as high_impact (defined per agent type).

**Example high-impact actions:**
- GRC Agent: Marking a control as "compliant" (affects audit readiness)
- IR Agent: Recommending system isolation
- Pen Test Agent: Any scanning action
- CISO Agent: Generating board-level reports

**Low-impact (auto-approved):**
- Threat Intel: Fetching latest CVEs from NVD
- SOC Agent: Correlating existing log data
- GRC Agent: Running gap analysis (read-only)

### Pattern 5: Tenant-Scoped Agent Execution

**What:** Every agent task, message, and result is scoped to a `company_id`. Row Level Security (RLS) policies enforce this at the database level.

**When:** Always. This is non-negotiable for a multi-tenant SaaS.

**Implementation:**
```sql
-- RLS policy on agent_tasks
CREATE POLICY "agent_tasks_tenant_isolation" ON agent_tasks
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Service role (used by Edge Functions) bypasses RLS
-- But agent functions MUST include company_id in every query
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Agent-to-Agent Direct Invocation

**What:** Agent A directly calls Agent B's Edge Function endpoint.
**Why bad:** Creates hidden coupling, makes execution chains untraceable, enables circular invocations, bypasses approval gates.
**Instead:** All delegation goes through CISO Orchestrator via the agent_tasks table.

### Anti-Pattern 2: In-Memory Agent State

**What:** Storing agent conversation history, task progress, or intermediate results in Edge Function memory.
**Why bad:** Edge Functions are stateless. Memory is lost between invocations. If the function times out or errors, all state is lost.
**Instead:** Every state change written to the database immediately.

### Anti-Pattern 3: Monolithic Agent Function

**What:** One huge Edge Function that contains all 7 agents with a switch statement.
**Why bad:** Deployment couples all agents (changing one redeploys all), cold start times increase, harder to debug, impossible to scale independently.
**Instead:** One Edge Function per agent (7 separate functions + shared module).

### Anti-Pattern 4: Polling-Only Agent Dashboard

**What:** Frontend polls the database every N seconds to check agent status.
**Why bad:** Wastes bandwidth, adds latency to status updates, doesn't scale.
**Instead:** Subscribe to Supabase Realtime channels for agent status changes. Use TanStack Query for initial data load + Realtime for live updates.

### Anti-Pattern 5: Storing Full LLM Context in Database Rows

**What:** Saving full Claude conversation arrays (system + user + assistant + tool_use messages) in a JSON column.
**Why bad:** Context windows grow large (100k+ tokens). Storing full context in the database bloats rows, slows queries, and makes auditing harder.
**Instead:** Store structured summaries (task input, tool calls made, final output, reasoning summary). If full context replay is needed, store in Supabase Storage as a JSON file linked by task_id.

## Scalability Considerations

| Concern | At 10 customers | At 100 customers | At 1,000 customers |
|---------|-----------------|-------------------|---------------------|
| Agent execution | Edge Functions handle fine | Monitor cold start times, consider pre-warming | May need dedicated compute for heavy agents (Pen Test, Threat Intel) |
| Database load | No issues | Add indexes on company_id + status columns, consider partitioning agent_tasks by company_id | Read replicas for dashboard queries, write optimization |
| Realtime connections | Minimal | Monitor concurrent connections per plan tier | May need Realtime quotas per tenant, consider connection pooling |
| Claude API costs | ~$50-200/month | ~$500-2,000/month | Implement token budgets per tenant, caching for repeated queries |
| Stripe webhooks | Trivial | Still trivial | Still trivial (Stripe handles scale) |

## Key Database Tables (New)

```sql
-- CMMC controls (seeded from OSCAL)
controls (
  id, framework, framework_version, control_id, family, title,
  description, assessment_objectives, evidence_requirements,
  nist_800_53_mapping, cmmc_level, created_at
)

-- Agent task queue and state
agent_tasks (
  id, company_id, agent_type, status, priority,
  input, output, reasoning_summary,
  parent_task_id, -- for delegation chains
  requires_approval, approved_by, approved_at,
  created_at, started_at, completed_at, error
)

-- Agent messages (durable bus)
agent_messages (
  id, company_id, from_agent, to_agent, channel,
  message_type, payload, correlation_id,
  created_at
)

-- Approval queue
agent_approvals (
  id, company_id, task_id, agent_type,
  action_description, risk_level, impact_summary,
  status, reviewed_by, reviewed_at, review_notes,
  created_at, expires_at
)

-- Subscriptions (Stripe sync)
subscriptions (
  id, company_id, stripe_customer_id, stripe_subscription_id,
  plan_id, status, current_period_start, current_period_end,
  cancel_at_period_end, created_at, updated_at
)
```

## Sources

- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture) -- channel and broadcast patterns
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast) -- pub/sub for agent messaging
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) -- Deno runtime, npm compatibility
- [AI SDK Agent Patterns](https://ai-sdk.dev/docs/foundations/tools) -- tool definitions, structured output
- [Multi-Agent Architecture Patterns 2025](https://nexaitech.com/multi-ai-agent-architecutre-patterns-for-scale/) -- hierarchical delegation
- [Agent Message Bus Patterns](https://dev.to/linou518/agent-message-bus-communication-infrastructure-for-16-ai-agents-18af) -- message bus design for AI agents
- [Supabase Stripe Webhooks](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) -- webhook handler pattern

---

*Architecture research: 2026-03-26*
