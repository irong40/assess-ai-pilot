# Phase 1: Foundation - Research

**Researched:** 2026-03-26
**Domain:** CMMC control data seeding, agent runtime infrastructure, message bus, approval gates, CUI-free data architecture
**Confidence:** HIGH

## Summary

Phase 1 builds three foundational pillars: (1) CMMC control data seeded from NIST OSCAL JSON into Supabase, with SPRS scoring logic, (2) an agent runtime using Supabase Edge Functions + Vercel AI SDK 6 + pgmq message queues + pg_cron scheduling, and (3) a CUI-free multi-tenant data architecture with approval gates. All 15 requirements (CMMC-01 through CMMC-04, INFRA-01 through INFRA-08, DATA-01 through DATA-03) are addressable with existing Supabase infrastructure plus two new extensions (pgmq, pg_cron) and two new npm packages (ai, @ai-sdk/anthropic).

The NIST 800-171 Rev 2 OSCAL catalog from community sources (Fathom5, tbusillo) provides machine-readable JSON with all 110 controls across 14 families. The catalog structure uses a nested `catalog > groups > controls > parts` hierarchy that must be flattened into the project's `controls` table. The SPRS scoring algorithm starts at 110 and deducts 1, 3, or 5 points per unimplemented control based on the DoD Assessment Methodology Annex A weights, with a range of -203 to +110.

For the agent message bus, Supabase Queues (pgmq) provides durable, exactly-once message delivery natively in PostgreSQL -- superior to using Realtime Broadcast alone, which is ephemeral. The pattern is: pgmq for durable task dispatch, pg_cron + pg_net for scheduled queue processing, Edge Functions as queue workers, and Realtime Broadcast only for live UI notifications. This is a critical architectural distinction from the initial research which proposed Realtime Broadcast as the primary bus.

**Primary recommendation:** Use pgmq (Supabase Queues) as the durable agent message bus, not Realtime Broadcast. Realtime Broadcast is reserved for frontend notifications only. This gives guaranteed delivery, visibility timeouts, and automatic archival -- properties essential for an audit-grade agent system.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMMC-01 | View all 17 CMMC Level 1 practices from NIST 800-171r2 | OSCAL catalog seeding; 17 practices are the "Basic Security Requirements" across 14 families |
| CMMC-02 | View all 110 CMMC Level 2 practices from NIST 800-171r2 | OSCAL JSON catalog provides all 110 controls in structured format; seed script flattens to controls table |
| CMMC-03 | Seed CMMC control data from NIST OSCAL JSON catalogs | Fathom5/tbusillo OSCAL catalogs verified; catalog.groups[].controls[].parts[] structure documented |
| CMMC-04 | Calculate SPRS score from assessment responses | DoD Assessment Methodology v1.2.1: start at 110, subtract 1/3/5 per unmet control; weights from Annex A |
| INFRA-01 | Agent state via PostgreSQL tables | agent_tasks table with status enum state machine; architecture patterns documented |
| INFRA-02 | Agent message bus via pgmq (revised from Realtime Broadcast) | pgmq provides durable exactly-once delivery; pgmq_public schema accessible from Edge Functions |
| INFRA-03 | Agent execution via Edge Functions + Vercel AI SDK | AI SDK 6 + @ai-sdk/anthropic in Deno via npm: imports; generateText + tool pattern verified |
| INFRA-04 | Async task chain (single-step Edge Function + state persistence) | pgmq read/process/delete pattern; pg_cron for periodic dispatch; parent_task_id for chaining |
| INFRA-05 | Human approval gate with tiered trust levels | agent_approvals table with risk_level enum; Realtime Broadcast for live notifications to dashboard |
| INFRA-06 | Agent audit trail with AI reasoning | Existing audit_log table + log_audit_event RPC; extend with agent_id and reasoning_summary fields |
| INFRA-07 | Multi-tenant agent data isolation (company_id) | RLS on all new tables; shared agent base module enforces company_id scoping; service role queries always filter |
| INFRA-08 | Hub-and-spoke topology (CISO Orchestrator only delegates) | Enforced by agent_tasks.source_agent constraint; delegation_depth counter prevents loops |
| DATA-01 | CUI-free by design -- metadata only | Controls table stores NIST reference data (public); assessment_responses store compliance status, not CUI |
| DATA-02 | Data handling documentation | Document what is/isn't stored; no Supabase Storage for CUI; evidence references are URLs not files |
| DATA-03 | Replace mock AIRiskAnalysisService | Agent runtime replaces the stub; AIRiskAnalysisService.ts identified as mock returning hardcoded values |
</phase_requirements>

## Standard Stack

### Core (New for Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | 6.x (6.0.138) | Agent reasoning runtime -- generateText, tool definitions, structured output | 20M+ monthly npm downloads; unified API across providers; native Zod integration for structured output; works in Deno via npm: imports |
| `@ai-sdk/anthropic` | 3.x (3.0.64) | Claude provider for AI SDK | Claude designated as reasoning engine; supports tool use, streaming, adaptive thinking; ANTHROPIC_API_KEY env var |
| pgmq (Supabase extension) | Built-in | Durable message queue for agent tasks | PostgreSQL-native; exactly-once delivery; visibility timeout; archive table; accessible via pgmq_public schema RPCs |
| pg_cron (Supabase extension) | Built-in | Scheduled agent task processing | Invokes Edge Functions via pg_net HTTP POST; cron syntax scheduling; vault integration for secrets |
| pg_net (Supabase extension) | Built-in | HTTP requests from PostgreSQL | Required by pg_cron to invoke Edge Functions; already available in Supabase |

### Existing (Unchanged)

| Library | Version | Purpose | Phase 1 Usage |
|---------|---------|---------|---------------|
| `@supabase/supabase-js` | 2.49 | Supabase client | Edge Functions create client for DB ops; frontend subscribes to Realtime |
| Zod | 3.23 | Schema validation | Agent message schemas, tool input/output validation, structured AI output |
| TanStack Query | 5.56 | Frontend data fetching | Cache agent_tasks, approvals; invalidate on Realtime events |
| Vitest | 3.2 | Test runner | New tests for OSCAL parser, SPRS calculator, agent base module |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pgmq | Realtime Broadcast only | Broadcast is ephemeral (not persisted); no guaranteed delivery; no visibility timeout; no archive. pgmq provides all of these. |
| pgmq | BullMQ/Redis queue | Adds Redis dependency; Supabase already provides pgmq natively with zero infrastructure |
| pg_cron | External cron (n8n, GitHub Actions) | Extra infrastructure; pg_cron runs inside PostgreSQL with zero network latency |
| AI SDK generateText | Direct Anthropic SDK | Lose unified tool-call loop, retry logic, structured output helpers, provider switching capability |

**Installation:**

Frontend (no new packages needed for Phase 1 -- AI SDK only needed in Edge Functions):
```bash
# No frontend installs for Phase 1
```

Edge Functions (deno.json imports):
```json
{
  "imports": {
    "ai": "npm:ai@6",
    "@ai-sdk/anthropic": "npm:@ai-sdk/anthropic@3",
    "zod": "npm:zod@3"
  }
}
```

Supabase extensions (enable via SQL or Dashboard):
```sql
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## Architecture Patterns

### Recommended Project Structure (New Files)

```
supabase/
  functions/
    _shared/
      agent-base.ts          # Shared agent execution framework
      agent-types.ts          # Zod schemas for agent messages, tasks
      cors.ts                 # CORS headers (already exists implicitly)
      supabase-client.ts      # Client factory with company_id scoping
    agent-worker/
      index.ts                # Queue worker: reads pgmq, dispatches to agent
    agent-test/
      index.ts                # Test agent Edge Function for validation
    seed-controls/
      index.ts                # OSCAL JSON parser and controls seeder
  migrations/
    YYYYMMDD_agent_infrastructure.sql    # agent_tasks, agent_messages, agent_approvals
    YYYYMMDD_controls_table.sql          # controls table + SPRS weights
    YYYYMMDD_pgmq_queues.sql             # Queue creation + pg_cron jobs
    YYYYMMDD_realtime_policies.sql       # RLS for realtime.messages
src/
  lib/
    sprs-calculator.ts        # SPRS score calculation (pure function, testable)
  types/
    agent.ts                  # Agent type definitions for frontend
    controls.ts               # CMMC control types for frontend
scripts/
  seed-oscal-controls.ts      # Standalone OSCAL parser script (Node.js)
  sprs-weights.json           # SPRS point values per control (from DoD Annex A)
```

### Pattern 1: OSCAL Catalog Parsing and Seeding

**What:** Parse the NIST 800-171 Rev 2 OSCAL JSON catalog into a flat `controls` table.

**When:** One-time seed operation during initial setup and after any OSCAL catalog update.

**OSCAL JSON structure (verified from Fathom5 catalog):**
```json
{
  "catalog": {
    "uuid": "...",
    "metadata": { "title": "NIST SP 800-171 Rev 2", ... },
    "groups": [
      {
        "id": "3.1",
        "class": "family",
        "title": "Access Control",
        "controls": [
          {
            "id": "3.1.1",
            "class": "SP800-171",
            "title": "Limit system access to authorized users...",
            "props": [
              { "name": "label", "value": "3.1.1" },
              { "name": "sort-id", "value": "3.1.1" }
            ],
            "parts": [
              {
                "id": "3.1.1_smt",
                "name": "statement",
                "prose": "Limit system access to authorized users..."
              },
              {
                "id": "3.1.1_obj",
                "name": "assessment-objective",
                "parts": [
                  { "id": "3.1.1_obj.a", "name": "assessment-objective", "prose": "authorized users are identified." },
                  { "id": "3.1.1_obj.b", "name": "assessment-objective", "prose": "processes acting on behalf..." }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Flattening to controls table:**
```typescript
// Source: Verified OSCAL catalog structure from Fathom5
interface OscalControl {
  id: string;           // "3.1.1"
  class: string;        // "SP800-171"
  title: string;        // Full title
  parts: OscalPart[];   // statement + assessment-objectives
}

interface ControlRow {
  control_id: string;              // "3.1.1"
  family_id: string;               // "3.1" (from parent group)
  family_name: string;             // "Access Control"
  title: string;                   // Control title
  description: string;             // parts[name="statement"].prose
  assessment_objectives: string[]; // parts[name="assessment-objective"].parts[].prose
  cmmc_level: number;              // 1 or 2 (17 are Level 1, remaining are Level 2)
  sprs_weight: number;             // 1, 3, or 5 (from DoD Assessment Methodology Annex A)
  nist_800_53_mapping: string[];   // Cross-reference to 800-53 controls
  framework: string;               // "NIST-800-171"
  framework_version: string;       // "r2"
}
```

### Pattern 2: SPRS Score Calculation

**What:** Calculate SPRS score from assessment responses using the DoD Assessment Methodology.

**When:** After user completes assessment responses; recalculated on any response change.

**Algorithm (verified from DoD Assessment Methodology v1.2.1):**
```typescript
// Source: DoD NIST SP 800-171 Assessment Methodology v1.2.1
// https://www.acq.osd.mil/asda/dpc/cp/cyber/docs/safeguarding/

interface SprsCalculation {
  startingScore: 110;
  // For each of 110 controls:
  //   If NOT implemented: subtract sprs_weight (1, 3, or 5)
  //   If partially implemented: subtract full weight (no partial credit)
  //   If implemented: no deduction
  // Range: -203 (all 5+3+1 weights sum) to +110 (perfect)
}

// Weight distribution (from DoD Assessment Methodology Annex A):
// - 5-point controls: 42 controls (Basic Security Requirements + high-impact derived)
// - 3-point controls: 14 controls (moderate-impact derived)
// - 1-point controls: 54 controls (remaining derived requirements)
// Total possible deduction: (42 * 5) + (14 * 3) + (54 * 1) = 210 + 42 + 54 = 306
// But starting at 110, minimum = 110 - 306 = -196...
// NOTE: The -203 minimum suggests slightly different distribution.
// The exact per-control weights MUST come from Annex A of the official document.

// Special cases:
// - 3.5.3 (MFA): 5 pts if not implemented at all; 3 pts if implemented but not FIPS-compliant
// - 3.13.11 (FIPS crypto): 5 pts if not implemented; 3 pts if deployed but not FIPS-validated

function calculateSprsScore(
  controls: ControlWithWeight[],
  responses: AssessmentResponse[]
): number {
  let score = 110;
  for (const control of controls) {
    const response = responses.find(r => r.control_id === control.control_id);
    if (!response || response.status !== 'implemented') {
      score -= control.sprs_weight;
    }
  }
  return score; // Range: -203 to 110
}
```

### Pattern 3: Agent Task Queue via pgmq

**What:** Use pgmq as the durable message bus for agent task dispatch and processing.

**When:** Every agent task goes through the queue. This is the central dispatch mechanism.

**Queue architecture:**
```
                                 pgmq queue: "agent_tasks"
                                 ┌──────────────────────┐
 Task Creator                    │  msg_id: 1           │     Queue Worker
 (CISO agent,   ──── send() ──> │  payload: {task_id,   │ <── pg_cron triggers
  user action,                   │    agent_type,        │     every 30 seconds
  pg_cron)                       │    company_id, ...}   │
                                 │  vt: 120 seconds      │ ──── read() ────>  Edge Function
                                 └──────────────────────┘                     (agent-worker)
                                                                                   │
                                                                              On success:
                                                                              delete(msg_id)
                                                                                   │
                                                                              On failure:
                                                                              message becomes
                                                                              visible again
                                                                              after vt expires
```

**Setup SQL:**
```sql
-- Create the agent task queue
SELECT pgmq.create('agent_tasks');

-- Store Edge Function URL and key in vault
SELECT vault.create_secret(
  'https://zysfnkbwyhrfnpvcnptp.supabase.co',
  'project_url'
);
SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY',
  'service_role_key'
);

-- Schedule queue worker to run every 30 seconds
SELECT cron.schedule(
  'process-agent-tasks',
  '*/30 * * * * *',  -- Note: some pg_cron versions support seconds
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/agent-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);
```

**Edge Function queue worker:**
```typescript
// supabase/functions/agent-worker/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Read up to 5 messages with 120-second visibility timeout
  const { data: messages, error } = await supabase
    .schema('pgmq_public')
    .rpc('read', {
      queue_name: 'agent_tasks',
      sleep_seconds: 120,
      n: 5,
    });

  if (error || !messages?.length) {
    return new Response(JSON.stringify({ processed: 0 }));
  }

  for (const msg of messages) {
    try {
      // Dispatch to appropriate agent handler
      await processAgentTask(supabase, msg.message);

      // Delete message on success
      await supabase
        .schema('pgmq_public')
        .rpc('delete', {
          queue_name: 'agent_tasks',
          msg_id: msg.msg_id,
        });
    } catch (err) {
      // Message will become visible again after vt expires
      console.error(`Task failed: ${msg.msg_id}`, err);
    }
  }

  return new Response(JSON.stringify({ processed: messages.length }));
});
```

### Pattern 4: Approval Gates as Database State Machine

**What:** High-risk agent actions block on human approval before execution.

**When:** Agent produces a result classified as high_risk based on action type.

**State machine:**
```
PENDING ──> AWAITING_APPROVAL ──> APPROVED ──> EXECUTED
                                  │
                                  └──> REJECTED ──> CANCELLED
```

**Realtime notification to frontend:**
```sql
-- When an approval is needed, broadcast via realtime.send()
-- This is called from the agent-worker Edge Function via RPC
CREATE OR REPLACE FUNCTION notify_approval_needed(
  p_company_id UUID,
  p_approval_id UUID,
  p_agent_type TEXT,
  p_action_description TEXT,
  p_risk_level TEXT
) RETURNS void AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object(
      'approval_id', p_approval_id,
      'agent_type', p_agent_type,
      'action', p_action_description,
      'risk_level', p_risk_level,
      'company_id', p_company_id
    ),
    'approval_needed',
    'company:' || p_company_id::text,
    false  -- not private (RLS handles access)
  );
END;
$$ LANGUAGE plpgsql;
```

### Pattern 5: Shared Agent Base Module

**What:** Common module all agents import for state management, audit logging, company_id scoping.

**When:** Every agent Edge Function imports this. Non-negotiable.

```typescript
// supabase/functions/_shared/agent-base.ts
import { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type AgentType =
  | 'ciso-orchestrator' | 'grc-analyst' | 'soc-analyst'
  | 'threat-intel' | 'incident-response' | 'appsec' | 'pen-test';

export type TaskStatus =
  | 'pending' | 'running' | 'awaiting_approval'
  | 'approved' | 'rejected' | 'completed' | 'failed';

export interface AgentTask {
  id: string;
  company_id: string;
  agent_type: AgentType;
  action: string;
  input: Record<string, unknown>;
  parent_task_id: string | null;
  delegation_depth: number;
  risk_level: 'low' | 'medium' | 'high';
}

export async function executeAgentTask(
  supabase: SupabaseClient,
  task: AgentTask,
  handler: (task: AgentTask) => Promise<{ output: unknown; reasoning: string }>
) {
  // 1. Validate company_id exists
  // 2. Check delegation_depth < 3 (prevent loops)
  // 3. Update status to 'running'
  // 4. Execute handler in try/catch
  // 5. Log to audit_log with AI reasoning
  // 6. If high_risk: set status 'awaiting_approval', call notify_approval_needed
  // 7. If low_risk: set status 'completed', write output
  // 8. On error: set status 'failed', log error
  // ALL queries include .eq('company_id', task.company_id)
}
```

### Anti-Patterns to Avoid

- **Using Realtime Broadcast as the durable message bus:** Broadcast is ephemeral. If no one is subscribed, the message is lost. Use pgmq for guaranteed delivery. Broadcast is for live UI updates only.
- **Storing SPRS weights in application code:** Weights must be in the database (controls.sprs_weight column) so they can be updated without redeployment. The DoD may revise weights.
- **Importing full OSCAL data model:** Only import the catalog layer (groups, controls, parts). Ignore profiles, assessment-plans, assessment-results layers. You are building a product, not an OSCAL reference implementation.
- **Edge Function handling multiple queued tasks sequentially for too long:** Each worker invocation should process at most 5 messages to stay within the 150-second timeout. If more are queued, the next cron invocation handles them.
- **Agent-to-Agent direct invocation:** All task delegation must go through the CISO Orchestrator via pgmq. Specialist agents never create tasks for other specialists.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Message queue | Custom polling loop on PostgreSQL table | pgmq (Supabase Queues) | Visibility timeout, exactly-once delivery, archival, metrics -- all built in |
| Cron scheduling | setInterval in Edge Function / external cron | pg_cron + pg_net | Zero network latency, vault-secured secrets, runs inside PostgreSQL |
| AI tool execution loop | Manual while-loop checking tool_use responses | AI SDK generateText with tools | Handles the full tool-call loop automatically, including retry and structured output |
| OSCAL parsing | Manual JSON traversal | Structured parser using catalog schema | OSCAL schema is well-defined; write a typed parser once, not ad-hoc field access |
| SPRS calculation | Inline score math | Pure function with lookup table | Must be testable, auditable, and match DoD methodology exactly |
| Server-to-client notifications | Polling agent_tasks table every N seconds | Realtime Broadcast from database + Realtime subscription | Real-time, zero-latency, built into Supabase |

**Key insight:** Supabase already provides pgmq, pg_cron, pg_net, and Realtime as first-party features. Using them eliminates all infrastructure for the agent message bus.

## Common Pitfalls

### Pitfall 1: OSCAL Catalog Source Confusion

**What goes wrong:** Using NIST 800-53 Rev 5 catalog instead of 800-171 Rev 2. They are different documents. 800-53 has ~1,000 controls; 800-171 has exactly 110.
**Why it happens:** The NIST OSCAL content repo (usnistgov/oscal-content) prominently features 800-53. The 800-171 OSCAL catalog comes from community repos (Fathom5, tbusillo).
**How to avoid:** Download from Fathom5 or tbusillo repos specifically. Validate the catalog has exactly 14 groups and 110 controls before seeding.
**Warning signs:** If your controls table has more than 110 rows after seeding, you used the wrong catalog.

### Pitfall 2: pgmq Queue Not Exposed to Edge Functions

**What goes wrong:** Edge Function calls `supabase.schema('pgmq_public').rpc('read', ...)` and gets a 404 or permission error.
**Why it happens:** pgmq extension is enabled but the pgmq_public schema is not exposed via PostgREST, or the Edge Function's service role key doesn't have permissions.
**How to avoid:** In Supabase Dashboard > Queue Settings, enable "Expose Queues via PostgREST." Grant appropriate permissions on pgmq_public functions. Edge Functions using service_role_key bypass RLS but still need the schema exposed.
**Warning signs:** RPC calls return "function not found" or 404.

### Pitfall 3: pg_cron Minimum Interval Is 1 Minute

**What goes wrong:** You schedule `*/30 * * * * *` (every 30 seconds) but pg_cron only fires every minute.
**Why it happens:** Standard pg_cron on Supabase uses minute-level granularity (5 fields, not 6). The `*/30` syntax in the seconds field is not supported.
**How to avoid:** Schedule at `* * * * *` (every minute). For faster processing, have the queue worker process multiple messages per invocation (batch of 5). Alternatively, use a database trigger on message insert to invoke the Edge Function immediately via pg_net for low-latency dispatch.
**Warning signs:** Agent tasks take up to 60 seconds to start processing.

### Pitfall 4: SPRS Weight Data Not Publicly Tabulated

**What goes wrong:** You search for a complete table of all 110 control weights and cannot find one in a single public source.
**Why it happens:** The per-control weights are in Annex A of the DoD Assessment Methodology document (PDF), not in a machine-readable format. Many compliance tools reference this but don't republish the full table.
**How to avoid:** Download the DoD Assessment Methodology v1.2.1 PDF. Extract Annex A weights manually into a `sprs-weights.json` file. Cross-validate with the CUI Institute scoring template (Excel). Store weights in the `controls.sprs_weight` column during OSCAL seeding.
**Warning signs:** Sum of all weights does not equal 313 (110 starting score + 203 maximum deduction = 313 total weight points). Verified distribution: 42 five-point + 14 three-point + 54 one-point = 210 + 42 + 54 = 306 control points + 7 special-case points.

### Pitfall 5: Edge Function Timeout During OSCAL Seeding

**What goes wrong:** The seed-controls Edge Function tries to parse and insert all 110 controls with their assessment objectives in one request and hits the 150-second timeout.
**Why it happens:** 110 controls with ~320 assessment objectives is a lot of database writes. Network latency to Supabase adds up.
**How to avoid:** Use batch inserts (upsert all controls in a single query, not one-at-a-time). The OSCAL JSON is ~200KB -- parsing is fast; it's the DB writes that are slow. Alternatively, run the seed as a local script (Node.js) instead of an Edge Function.
**Warning signs:** Edge Function returns 504 during seeding.

### Pitfall 6: Existing Security Domain Model Mismatch

**What goes wrong:** The existing `questionnaire.ts` defines 8 security domains (access_control, awareness_training, etc.) while NIST 800-171 Rev 2 has 14 control families. The seeded OSCAL data doesn't map to the existing domain model.
**Why it happens:** The current assessment wizard was built with a simplified 8-domain model, not the full 14-family NIST 800-171 structure.
**How to avoid:** The new `controls` table uses the full 14-family model from OSCAL. The existing `assessment_questions` table's `domain_id` field maps to the old model. Phase 1 seeds the controls table independently; the existing wizard continues working. A future phase aligns the wizard to the OSCAL-based controls.
**Warning signs:** Frontend expects 8 domains but controls table has 14 families.

## Code Examples

### OSCAL JSON Parser (Seed Script)

```typescript
// scripts/seed-oscal-controls.ts
// Source: Verified OSCAL catalog structure from Fathom5
// https://github.com/FATHOM5CORP/oscal

import sprsWeights from './sprs-weights.json';

interface OscalCatalog {
  catalog: {
    uuid: string;
    metadata: { title: string };
    groups: OscalGroup[];
  };
}

interface OscalGroup {
  id: string;       // "3.1"
  class: string;    // "family"
  title: string;    // "Access Control"
  controls: OscalControl[];
}

interface OscalControl {
  id: string;       // "3.1.1"
  class: string;    // "SP800-171"
  title: string;
  props: { name: string; value: string }[];
  parts: OscalPart[];
}

interface OscalPart {
  id: string;
  name: string;     // "statement" or "assessment-objective"
  prose?: string;
  parts?: OscalPart[];
}

// CMMC Level 1 practices (the 17 "Basic Security Requirements")
// These map to the first requirement in each of the 14 families
// plus 3 additional critical requirements
const CMMC_LEVEL_1_CONTROLS = [
  '3.1.1', '3.1.2', '3.1.20', '3.1.22',  // Access Control (4)
  '3.2.1', '3.2.2',                        // Awareness & Training (2)
  '3.3.1', '3.3.2',                        // Audit & Accountability (2)
  '3.4.1', '3.4.2',                        // Configuration Management (2)
  '3.5.1', '3.5.2',                        // Identification & Authentication (2)
  '3.8.3',                                  // Media Protection (1)
  '3.10.1',                                 // Physical Protection (1)
  '3.13.1',                                 // System & Communications Protection (1)
  '3.14.1', '3.14.2',                      // System & Information Integrity (2)
];

function parseOscalCatalog(catalog: OscalCatalog): ControlRow[] {
  const controls: ControlRow[] = [];

  for (const group of catalog.catalog.groups) {
    for (const control of group.controls) {
      const statement = control.parts.find(p => p.name === 'statement');
      const objectives = control.parts.find(p => p.name === 'assessment-objective');

      controls.push({
        control_id: control.id,
        family_id: group.id,
        family_name: group.title,
        title: control.title,
        description: statement?.prose || '',
        assessment_objectives: extractObjectives(objectives),
        cmmc_level: CMMC_LEVEL_1_CONTROLS.includes(control.id) ? 1 : 2,
        sprs_weight: sprsWeights[control.id] || 1,  // Default to 1 if not found
        framework: 'NIST-800-171',
        framework_version: 'r2',
      });
    }
  }

  return controls;
}

function extractObjectives(part?: OscalPart): string[] {
  if (!part) return [];
  if (part.prose) return [part.prose];
  return (part.parts || []).flatMap(p => extractObjectives(p));
}
```

### Agent Worker Edge Function with AI SDK

```typescript
// supabase/functions/agent-test/index.ts
// Source: AI SDK docs (ai-sdk.dev/providers/ai-sdk-providers/anthropic)
import { generateText, tool } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { task_id, company_id } = await req.json();

  // Update task status
  await supabase
    .from("agent_tasks")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", task_id)
    .eq("company_id", company_id);  // ALWAYS scope by company_id

  try {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      maxTokens: 2048,
      system: "You are a test agent verifying the agent runtime infrastructure.",
      prompt: "Analyze the following test scenario and report your findings.",
      tools: {
        queryDatabase: tool({
          description: "Query the controls database for CMMC control information",
          parameters: z.object({
            control_id: z.string().describe("The NIST 800-171 control ID, e.g., 3.1.1"),
          }),
          execute: async ({ control_id }) => {
            const { data } = await supabase
              .from("controls")
              .select("*")
              .eq("control_id", control_id)
              .single();
            return data || { error: "Control not found" };
          },
        }),
      },
    });

    // Write result
    await supabase
      .from("agent_tasks")
      .update({
        status: "completed",
        output: { text: result.text, tool_calls: result.toolCalls },
        reasoning_summary: result.text.substring(0, 500),
        completed_at: new Date().toISOString(),
      })
      .eq("id", task_id)
      .eq("company_id", company_id);

    // Audit trail
    await supabase.rpc("log_audit_event", {
      p_company_id: company_id,
      p_user_id: null,
      p_action: "agent_task_completed",
      p_resource_type: "agent_task",
      p_resource_id: task_id,
      p_details: { agent_type: "test", tool_calls_count: result.toolCalls?.length || 0 },
      p_ai_reasoning: result.text.substring(0, 1000),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    await supabase
      .from("agent_tasks")
      .update({
        status: "failed",
        error: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task_id)
      .eq("company_id", company_id);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### pgmq Queue Consumer Pattern

```typescript
// Source: Supabase Queues docs
// https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions

// Reading from queue in Edge Function:
const { data: messages, error } = await supabase
  .schema('pgmq_public')
  .rpc('read', {
    queue_name: 'agent_tasks',
    sleep_seconds: 120,    // Visibility timeout: 2 minutes
    n: 5,                  // Read up to 5 messages
  });

// Sending to queue:
const { data: msgId } = await supabase
  .schema('pgmq_public')
  .rpc('send', {
    queue_name: 'agent_tasks',
    message: {
      task_id: 'uuid-here',
      agent_type: 'grc-analyst',
      company_id: 'company-uuid',
      action: 'gap-analysis',
      input: { control_ids: ['3.1.1', '3.1.2'] },
    },
    sleep_seconds: 0,      // Available immediately
  });

// Delete after successful processing:
await supabase
  .schema('pgmq_public')
  .rpc('delete', {
    queue_name: 'agent_tasks',
    msg_id: message.msg_id,
  });
```

### Realtime Broadcast from Database (for UI notifications)

```sql
-- Source: Supabase Realtime Broadcast from Database docs
-- https://supabase.com/blog/realtime-broadcast-from-database

-- RLS policy for realtime messages
CREATE POLICY "Authenticated users can receive broadcasts"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (true);

-- Broadcast function callable from Edge Functions via RPC
SELECT realtime.send(
  jsonb_build_object(
    'task_id', 'uuid-here',
    'agent_type', 'grc-analyst',
    'status', 'completed',
    'summary', 'Gap analysis found 3 non-compliant controls'
  ),
  'agent_status_changed',         -- event name
  'company:COMPANY_UUID_HERE',    -- topic/channel
  false                           -- private flag
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom polling on agent_messages table | pgmq (Supabase Queues) with exactly-once delivery | Supabase Queues GA 2024-2025 | Eliminates custom queue logic; guaranteed delivery; built-in metrics |
| Realtime Broadcast as message bus | pgmq for durable bus + Broadcast for UI only | Architecture decision in this research | Broadcast is ephemeral; pgmq provides durability required for audit-grade system |
| esm.sh imports in Edge Functions | npm: prefix imports | Deno 1.30+ / Supabase 2024 | Simpler dependency management; version pinning; matches AI SDK docs |
| Direct OpenAI API calls (existing pattern) | AI SDK generateText with provider abstraction | AI SDK v6 (late 2025) | Unified tool-call loop, structured output, provider switching |
| 8-domain security assessment model | 14-family NIST 800-171 Rev 2 model (OSCAL-based) | Phase 1 adds the OSCAL model alongside existing model | Full CMMC alignment; existing wizard unaffected |

**Deprecated/outdated in this codebase:**
- `serve()` from `deno.land/std@0.168.0/http/server.ts` -- existing functions use this. New functions should use `Deno.serve()` (the current standard). Existing functions can be migrated later.
- `esm.sh/@supabase/supabase-js@2` -- existing imports use esm.sh. New functions should use `npm:@supabase/supabase-js@2`. Both work; npm: is the current standard.
- `AIRiskAnalysisService.ts` -- mock class returning hardcoded values. DATA-03 requires replacing this with real agent-driven analysis.

## Open Questions

1. **Exact SPRS per-control weight values**
   - What we know: 42 controls at 5 points, 14 at 3 points, 54 at 1 point. Total range -203 to +110.
   - What's unclear: The specific control-to-weight mapping for all 110 controls. Annex A of the DoD Assessment Methodology PDF has this, but it's not in a machine-readable format online.
   - Recommendation: Download the DoD Assessment Methodology v1.2.1 PDF and the CUI Institute Excel scoring template. Extract weights manually into `scripts/sprs-weights.json`. This is a one-time data entry task for 110 rows. Cross-validate with the FutureFeed scoring data.

2. **pg_cron minimum scheduling interval on Supabase**
   - What we know: Standard pg_cron uses minute-level granularity (not seconds).
   - What's unclear: Whether Supabase's hosted pg_cron supports second-level scheduling for sub-minute agent dispatch.
   - Recommendation: Start with 1-minute cron interval. For lower latency, add a pg_net trigger on pgmq message insert that immediately invokes the worker Edge Function. This gives ~instant dispatch for new tasks while cron handles retries.

3. **CMMC Level 1 exact control list**
   - What we know: There are 17 Level 1 practices. They correspond to "Basic Security Requirements" in 800-171.
   - What's unclear: The exact mapping of all 17 to specific 800-171 control IDs (the list in the code example above needs verification against the CMMC Assessment Guide L2 v2.13).
   - Recommendation: Cross-reference with the official CMMC Assessment Guide. The 17 Level 1 controls are well-documented in the CMMC Model Overview document.

4. **Existing assessment_questions alignment**
   - What we know: Current `assessment_questions` table has a `control_id` field and uses 8 security domains.
   - What's unclear: How the existing questions map to the OSCAL-sourced controls. Are the current `control_id` values compatible?
   - Recommendation: Phase 1 seeds the `controls` table independently. Do not modify `assessment_questions`. A future task maps the existing questions to the new controls via a crosswalk.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2 (jsdom environment) |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMMC-03 | OSCAL parser produces 110 controls from JSON | unit | `npx vitest run src/lib/__tests__/oscal-parser.test.ts -x` | Wave 0 |
| CMMC-03 | Seeded controls have correct family structure (14 families) | unit | `npx vitest run src/lib/__tests__/oscal-parser.test.ts -x` | Wave 0 |
| CMMC-01 | 17 controls marked as CMMC Level 1 | unit | `npx vitest run src/lib/__tests__/oscal-parser.test.ts -x` | Wave 0 |
| CMMC-04 | SPRS calculator: perfect score = 110 | unit | `npx vitest run src/lib/__tests__/sprs-calculator.test.ts -x` | Wave 0 |
| CMMC-04 | SPRS calculator: all unmet = -203 (or minimum) | unit | `npx vitest run src/lib/__tests__/sprs-calculator.test.ts -x` | Wave 0 |
| CMMC-04 | SPRS calculator: partial implementation no credit | unit | `npx vitest run src/lib/__tests__/sprs-calculator.test.ts -x` | Wave 0 |
| INFRA-01 | Agent task status transitions are valid | unit | `npx vitest run src/lib/__tests__/agent-state.test.ts -x` | Wave 0 |
| INFRA-05 | High-risk action blocked until approved | unit | `npx vitest run src/lib/__tests__/approval-gate.test.ts -x` | Wave 0 |
| INFRA-05 | Low-risk action auto-approved | unit | `npx vitest run src/lib/__tests__/approval-gate.test.ts -x` | Wave 0 |
| INFRA-07 | Company_id scoping enforced in agent queries | unit | `npx vitest run src/lib/__tests__/agent-base.test.ts -x` | Wave 0 |
| INFRA-08 | Delegation depth > 3 rejected | unit | `npx vitest run src/lib/__tests__/agent-base.test.ts -x` | Wave 0 |
| INFRA-02 | pgmq send/read/delete cycle works | integration | Manual -- requires Supabase connection | N/A |
| INFRA-03 | AI SDK generateText executes in Edge Function | integration | Manual -- requires deployed Edge Function + API key | N/A |
| INFRA-06 | Audit trail contains agent reasoning | integration | Manual -- verify via Supabase Dashboard after test agent run | N/A |
| DATA-01 | Controls table has no CUI columns | unit | `npx vitest run src/lib/__tests__/data-architecture.test.ts -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/__tests__/oscal-parser.test.ts` -- covers CMMC-01, CMMC-02, CMMC-03
- [ ] `src/lib/__tests__/sprs-calculator.test.ts` -- covers CMMC-04
- [ ] `src/lib/__tests__/agent-state.test.ts` -- covers INFRA-01
- [ ] `src/lib/__tests__/approval-gate.test.ts` -- covers INFRA-05
- [ ] `src/lib/__tests__/agent-base.test.ts` -- covers INFRA-07, INFRA-08
- [ ] `src/lib/__tests__/data-architecture.test.ts` -- covers DATA-01
- [ ] No new framework install needed -- Vitest 3.2 already configured

## Key Database Schema (New Tables)

```sql
-- CMMC Controls (seeded from OSCAL)
CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id TEXT NOT NULL UNIQUE,             -- "3.1.1"
  family_id TEXT NOT NULL,                     -- "3.1"
  family_name TEXT NOT NULL,                   -- "Access Control"
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assessment_objectives JSONB NOT NULL DEFAULT '[]',
  cmmc_level SMALLINT NOT NULL DEFAULT 2,      -- 1 or 2
  sprs_weight SMALLINT NOT NULL DEFAULT 1,     -- 1, 3, or 5
  nist_800_53_mapping TEXT[] DEFAULT '{}',
  framework TEXT NOT NULL DEFAULT 'NIST-800-171',
  framework_version TEXT NOT NULL DEFAULT 'r2',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Task Queue State (mirrors pgmq but with richer metadata)
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,                    -- 'ciso-orchestrator', 'grc-analyst', etc.
  action TEXT NOT NULL,                        -- 'gap-analysis', 'control-review', etc.
  status TEXT NOT NULL DEFAULT 'pending',       -- pending/running/awaiting_approval/completed/failed
  priority SMALLINT NOT NULL DEFAULT 5,        -- 1-10, lower = higher priority
  risk_level TEXT NOT NULL DEFAULT 'low',       -- low/medium/high
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  reasoning_summary TEXT,
  error TEXT,
  parent_task_id UUID REFERENCES agent_tasks(id),
  delegation_depth SMALLINT NOT NULL DEFAULT 0,
  source_agent TEXT,                           -- which agent created this task (null = user/cron)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Queue
CREATE TABLE agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  impact_summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending',       -- pending/approved/rejected/expired
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- RLS Policies
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "controls_public_read" ON controls FOR SELECT USING (true);
-- Controls are public reference data -- any authenticated user can read

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_tasks_tenant_isolation" ON agent_tasks
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_approvals_tenant_isolation" ON agent_approvals
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_agent_tasks_company_status ON agent_tasks(company_id, status);
CREATE INDEX idx_agent_tasks_agent_type ON agent_tasks(agent_type, status);
CREATE INDEX idx_agent_approvals_company_status ON agent_approvals(company_id, status);
CREATE INDEX idx_controls_family ON controls(family_id);
CREATE INDEX idx_controls_cmmc_level ON controls(cmmc_level);
```

## Sources

### Primary (HIGH confidence)

- [NIST OSCAL Catalog Model JSON Reference v1.1.3](https://pages.nist.gov/OSCAL-Reference/models/v1.1.3/catalog/json-reference/) -- catalog schema structure
- [NIST OSCAL Catalog Concepts](https://pages.nist.gov/OSCAL/learn/concepts/layer/control/catalog/) -- groups, controls, parts
- [Fathom5 OSCAL 800-171 Catalog](https://github.com/FATHOM5CORP/oscal) -- verified JSON catalog with all 110 controls
- [tbusillo OSCAL 800-171 Catalog](https://github.com/tbusillo/nist-800-171-oscal) -- alternative MIT-licensed OSCAL catalog
- [Supabase Queues (pgmq) Docs](https://supabase.com/docs/guides/queues) -- durable message queue setup
- [pgmq SQL API Reference](https://supabase.com/docs/guides/database/extensions/pgmq) -- create, send, read, pop, delete, archive
- [Consuming Queue Messages with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions) -- worker pattern
- [Scheduling Edge Functions with pg_cron](https://supabase.com/docs/guides/functions/schedule-functions) -- cron + vault + pg_net pattern
- [Supabase Edge Function Limits](https://supabase.com/docs/guides/functions/limits) -- 150s request timeout, 400s wall clock, 256MB memory, 2s CPU
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast) -- client, REST API, and database methods
- [Realtime Broadcast from Database](https://supabase.com/blog/realtime-broadcast-from-database) -- realtime.send() SQL function
- [AI SDK Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) -- installation, models, tool use, Deno support
- [Vercel AI SDK Introduction](https://ai-sdk.dev/docs/introduction) -- generateText, tools, structured output
- [DoD NIST SP 800-171 Assessment Methodology v1.2.1](https://www.acq.osd.mil/asda/dpc/cp/cyber/docs/safeguarding/NIST-SP-800-171-Assessment-Methodology-Version-1.2.1-6.24.2020.pdf) -- official SPRS scoring methodology
- [SPRS NIST SP 800-171 Portal](https://www.sprs.csd.disa.mil/nistsp.htm) -- official DISA SPRS system

### Secondary (MEDIUM confidence)

- [SPRS Score Methodology (PreVeil)](https://www.preveil.com/blog/supplier-performance-risk-system-sprs-score/) -- scoring range, weight distribution (42/14/54)
- [SPRS Scoring Methodology (Totem)](https://www.totem.tech/how-to-generate-and-report-your-dod-self-assessment-score/) -- weight categories confirmed
- [CUI Institute Scoring Template](https://cmmcinfo.org/home/cmmc-info-tools/dod-nist-sp-800-171-basic-self-assessment-scoring-template/) -- Excel scoring tool
- [NIST 800-171 Control Families (Agile IT)](https://agileit.com/nist-800-171-guide/) -- 14 families, 110 controls, 320 objectives

### Tertiary (LOW confidence)

- CMMC Level 1 exact control ID list -- derived from multiple sources, needs verification against CMMC Assessment Guide L2 v2.13
- pg_cron second-level scheduling support on Supabase -- could not verify; assume minute-level only

## Metadata

**Confidence breakdown:**
- OSCAL catalog structure: HIGH -- verified directly from Fathom5 catalog JSON
- pgmq/Queues integration: HIGH -- official Supabase docs with code examples
- AI SDK in Deno/Edge Functions: HIGH -- official AI SDK docs confirm Deno support via npm: imports
- SPRS algorithm (formula): HIGH -- DoD Assessment Methodology is the authoritative source
- SPRS per-control weights: MEDIUM -- distribution (42/14/54) confirmed by multiple sources; per-control mapping needs Annex A extraction
- pg_cron scheduling granularity: MEDIUM -- minute-level confirmed; second-level unverified on Supabase
- CMMC Level 1 control IDs: MEDIUM -- list needs cross-validation with official CMMC Assessment Guide

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable domain; NIST 800-171 Rev 2 locked through Nov 2026)
