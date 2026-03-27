# Phase 5: Security Operations Agents - Research

**Researched:** 2026-03-26
**Domain:** SOC Analyst agent, Threat Intelligence agent, CVE triage, IOC tracking, CMMC threat mapping
**Confidence:** HIGH

## Summary

Phase 5 adds two new specialist agents -- SOC Analyst and Threat Intelligence -- to the existing hub-and-spoke agent system. Both agents follow the established pattern from Phase 2 (agent-base.ts, executeAgentTask, delegateTask, Deno Edge Function with AI SDK + Claude, Zod schemas, dual-module pattern for vitest). The infrastructure is ready: the agent_type enum already includes `soc_analyst` and `threat_intel`, the agent-worker routing map already maps these types to `agent-soc-analyst` and `agent-threat-intel` Edge Functions, and the existing `threat_intelligence` table contains NVD CVE data ingested by the `fetch-cve-feed` Edge Function.

The core technical challenge is NOT building agent infrastructure (that is solved) but designing the right tool sets and data models so each agent produces actionable security intelligence. The SOC agent needs to correlate CVE data against the company's tech stack and compliance gaps, classify false positives, and escalate through the CISO Orchestrator. The Threat Intel agent needs to generate contextual threat briefs, track IOCs, and map threats to specific CMMC controls. The company's `primary_tech_stack` field (TEXT[] in onboarding_profiles) provides the bridge between generic CVE data and company-specific relevance.

**Primary recommendation:** Build both agents as Deno Edge Functions following the exact GRC/CISO pattern, add 3-4 new database tables (soc_alerts, soc_alert_correlations, threat_briefs, ioc_tracking), extend the CISO Orchestrator with delegateToSOC and delegateToThreatIntel tools, and create a CWE-to-CMMC-family heuristic mapping for threat-to-control correlation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SOC-01 | SOC agent triages alerts from CVE feed and enriches with severity and context | SOC agent queries threat_intelligence table, cross-references company tech stack from onboarding_profiles, enriches with CVSS context, writes to soc_alerts table |
| SOC-02 | SOC agent correlates findings across data sources (CVE, assessment gaps, threat intel) | Correlation tool queries threat_intelligence + assessment_findings + gap_analysis_results, creates soc_alert_correlations linking related findings |
| SOC-03 | SOC agent classifies false positives and provides reasoning | False positive classification based on tech stack match (CVE affects software not in company stack), compensating controls (control already MET), and CVSS context applicability. Reasoning stored in soc_alerts.classification_reasoning |
| SOC-04 | SOC agent escalates confirmed incidents to IR agent via CISO Orchestrator | SOC agent returns escalation recommendation in output; CISO Orchestrator receives via existing delegation pattern and can flag for Phase 6 IR agent (not yet built) |
| THRT-01 | Threat Intel agent monitors NVD CVE feed with enhanced analysis | Agent queries existing threat_intelligence table (populated by fetch-cve-feed), performs deeper analysis including CWE categorization, exploit likelihood, and relevance scoring |
| THRT-02 | Threat Intel agent generates threat briefs relevant to customer's tech stack | Agent reads onboarding_profiles.primary_tech_stack, filters/scores CVEs by relevance, generates structured ThreatBrief with executive summary and technical details |
| THRT-03 | Threat Intel agent maps threats to specific CMMC controls at risk | CWE-to-CMMC-family heuristic mapping (e.g., CWE-79 XSS -> SI family, CWE-287 auth -> IA/AC families) plus CVE description keyword matching against control descriptions |
| THRT-04 | Threat Intel agent tracks IOCs and provides attack surface mapping | ioc_tracking table stores indicators (IP, domain, hash, URL) with confidence levels; attack surface mapping combines tech stack + NOT_MET controls + active threats into risk view |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | 6.x | LLM orchestration with tool calling | Already used by GRC and CISO agents; provides generateText with maxSteps for multi-tool reasoning |
| @ai-sdk/anthropic | 3.x | Claude model provider | Already used; claude-sonnet-4-20250514 is the model for all agents |
| zod | 3.x | Runtime schema validation for agent I/O | Already used by all agents; enforces typed structured output |
| @supabase/supabase-js | 2.x | Database access from Edge Functions | Already used; service role client pattern established |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | (existing) | Frontend data hooks for SOC/Threat dashboards | Display alert triage results, threat briefs, IOCs on agent dashboard |
| pgmq | (existing) | Durable task queue | Agent task dispatch -- already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AI SDK tool calling for CVE analysis | Direct LLM prompt with JSON output | Tool calling allows multi-step reasoning (query CVE -> query tech stack -> correlate -> classify); single prompt would miss correlation depth |
| CWE-to-CMMC heuristic mapping | Full MITRE ATT&CK mapping | ATT&CK is comprehensive but overkill for v1; heuristic covers 80% of cases with much less complexity |
| Company-scoped threat_intelligence | Global threat_intelligence (current) | Global is correct -- CVEs are public data; company relevance is computed at query time via tech stack matching |

**Installation:**
No new npm packages required. All dependencies already exist in the project.

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
  agent-soc-analyst/
    index.ts                    # SOC Analyst Edge Function (same skeleton as agent-grc-analyst)
  agent-threat-intel/
    index.ts                    # Threat Intel Edge Function (same skeleton)
  _shared/
    soc-schemas.ts              # Zod schemas for SOC output (Deno)
    soc-tools.ts                # SOC system prompt + tools + prompt builder (Deno)
    threat-intel-schemas.ts     # Zod schemas for Threat Intel output (Deno)
    threat-intel-tools.ts       # Threat Intel system prompt + tools + prompt builder (Deno)
src/
  lib/
    soc-schemas-frontend.ts     # Vitest-compatible Zod schema re-exports
    soc-tools-testable.ts       # Vitest-compatible tool logic re-exports
    threat-intel-schemas-frontend.ts
    threat-intel-tools-testable.ts
    __tests__/
      soc-schemas.test.ts
      soc-agent.test.ts
      threat-intel-schemas.test.ts
      threat-intel-agent.test.ts
      soc-migration.test.ts
      threat-intel-migration.test.ts
  types/
    soc-output.ts               # Frontend TypeScript types for SOC output
    threat-intel-output.ts      # Frontend TypeScript types for Threat Intel output
supabase/migrations/
  20260327300000_soc_analyst_tables.sql
  20260327300001_threat_intel_tables.sql
```

### Pattern 1: Agent Edge Function Skeleton (Established)
**What:** Every agent follows the identical skeleton: CORS -> service client -> parse body -> fetch task -> normalize enums -> executeAgentTask with generateText handler
**When to use:** Both new agents
**Example:**
```typescript
// Source: supabase/functions/agent-grc-analyst/index.ts (established pattern)
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const body = await req.json();
  const { task_id, company_id } = body;

  // Fetch task, normalize enums (underscores -> hyphens)
  const task = { ...taskRow, agent_type: taskRow.agent_type?.replace(/_/g, "-") };

  // Execute via shared framework
  const result = await executeAgentTask(supabase, task, async (t) => {
    const tools = createSocTools(supabase, t); // or createThreatIntelTools
    const { text, steps } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: SOC_SYSTEM_PROMPT,
      prompt: buildSocPrompt(t.action, t.input ?? {}),
      tools,
      maxSteps: 8,
    });
    return { output: parsedResult, reasoning: text.substring(0, 500) };
  });
});
```

### Pattern 2: Dual-Module Pattern (Established)
**What:** For each Deno _shared module, create a parallel src/lib/ module with standard npm imports for vitest testing
**When to use:** All new schemas and tools
**Example:**
```typescript
// Deno version: supabase/functions/_shared/soc-schemas.ts
import { z } from "npm:zod@3";

// Vitest version: src/lib/soc-schemas-frontend.ts
import { z } from "zod";
// ... identical schema definitions with standard imports
```

### Pattern 3: Tool Factory with Closure Binding (Established)
**What:** createXxxTools(supabase, task) returns tool objects bound to the supabase client and parent task context -- no global state
**When to use:** Both new agents' tool definitions
**Example:**
```typescript
// Source: Pattern from ciso-tools.ts and grc-tools.ts
export function createSocTools(supabase: SupabaseClient, task: AgentTask) {
  return {
    queryRecentCVEs: tool({
      description: "Query recent CVEs from threat_intelligence table...",
      parameters: z.object({ severity_min: z.string().optional(), days_back: z.number().optional() }),
      execute: async ({ severity_min, days_back }) => {
        // All queries scoped by task context
        const { data } = await supabase.from("threat_intelligence").select("*")...;
        return { cves: data ?? [] };
      },
    }),
    // ... more tools
  };
}
```

### Pattern 4: CISO Orchestrator Delegation Extension
**What:** Extend CISO tools with delegateToSOC and delegateToThreatIntel alongside existing delegateToGRC
**When to use:** CISO needs to dispatch work to these new agents
**Example:**
```typescript
// Add to ciso-tools.ts alongside delegateToGRC
delegateToSOC: tool({
  description: "Delegate an alert triage or correlation task to the SOC Analyst agent.",
  parameters: z.object({
    action: z.string(),
    scope: z.object({
      severity_filter: z.string().optional(),
      time_range_hours: z.number().optional(),
    }),
    priority: z.enum(["critical", "high", "medium", "low"]),
  }),
  execute: async ({ action, scope, priority }) => {
    const result = await delegateTask(supabase, task, "soc-analyst", action, {
      ...scope, company_id: task.company_id, priority,
    });
    // ... same pattern as delegateToGRC
  },
}),
```

### Anti-Patterns to Avoid
- **Direct cross-agent communication:** SOC and Threat Intel agents MUST NOT communicate directly. All inter-agent coordination goes through the CISO Orchestrator (hub-and-spoke topology, INFRA-08).
- **Global CVE analysis without company context:** Never analyze CVEs without considering the company's tech stack. A critical CVE in Apache Struts is irrelevant to a company that does not use Java.
- **Storing CUI in threat data:** The soc_alerts and threat_briefs tables store analysis metadata only, never actual CUI. This maintains the CUI-free architecture (DATA-01).
- **Coupling SOC triage with Threat Intel analysis:** These are distinct responsibilities. SOC triages individual alerts; Threat Intel generates strategic intelligence. They feed each other through the CISO Orchestrator, not directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent task lifecycle | Custom task state machine | executeAgentTask from agent-base.ts | Handles status transitions, approval gates, audit logging, error handling |
| Cross-agent delegation | Direct function calls between agents | delegateTask via CISO Orchestrator | Hub-and-spoke enforcement, delegation depth limits, pgmq queueing |
| CVE data ingestion | New CVE fetcher for SOC agent | Existing fetch-cve-feed Edge Function + threat_intelligence table | Already ingests NVD CVE data on schedule; SOC agent reads from the same table |
| Schema validation | Manual JSON parsing/checking | Zod schemas (established pattern) | Type safety, error messages, consistent with all other agents |
| LLM tool orchestration | Custom prompt chaining | Vercel AI SDK generateText with tools + maxSteps | Multi-step reasoning with tool calls, automatic step management |
| CWE categorization | Full MITRE ATT&CK integration | Heuristic CWE-to-CMMC-family mapping table | ATT&CK is 600+ techniques; 50 common CWE categories cover CMMC mapping needs |

**Key insight:** The entire agent infrastructure is solved. Phase 5 is purely about domain-specific tools, prompts, schemas, and data models -- not infrastructure.

## Common Pitfalls

### Pitfall 1: CVE Relevance Without Tech Stack Context
**What goes wrong:** SOC agent triages all CVEs equally, flooding the user with thousands of irrelevant alerts
**Why it happens:** The threat_intelligence table is global (no company_id), so a naive query returns all CVEs
**How to avoid:** Every triage operation MUST join against onboarding_profiles.primary_tech_stack. CVEs are scored for relevance based on whether the affected product matches the company's declared stack.
**Warning signs:** If SOC alert count per company approaches total CVE count, the relevance filter is broken

### Pitfall 2: False Positive Classification Requires Reasoning Chain
**What goes wrong:** Agent marks alerts as false positives without explainable reasoning, making classifications unauditable
**Why it happens:** LLM classifies without being prompted to explain each reasoning step
**How to avoid:** SOC system prompt MUST require structured reasoning: (1) tech stack match? (2) compensating control in place? (3) CVSS context applicable? (4) classification decision with evidence. Store reasoning in soc_alerts.classification_reasoning.
**Warning signs:** classification_reasoning column is empty or contains only "false positive"

### Pitfall 3: Threat-to-CMMC Mapping Over-Engineering
**What goes wrong:** Attempt to build a comprehensive CWE-to-NIST-800-171 mapping covering all 900+ CWEs
**Why it happens:** Desire for completeness
**How to avoid:** Use a focused heuristic mapping of ~20 CWE categories to CMMC control families. The Threat Intel LLM can reason about unmapped CWEs using the control descriptions. The mapping is a starting point, not an exhaustive database.
**Warning signs:** Mapping table exceeds 50 rows or requires external data imports

### Pitfall 4: Escalation to Non-Existent IR Agent
**What goes wrong:** SOC-04 requires escalation to IR agent, but IR agent is Phase 6 (not built yet)
**Why it happens:** Trying to implement full escalation flow prematurely
**How to avoid:** SOC agent sets escalation_status='needs_ir_review' on soc_alerts. CISO Orchestrator receives this as a flag. For v1 Phase 5, escalation means: (1) flag the alert, (2) notify via CISO, (3) create an approval request for human review. The actual IR agent connection happens in Phase 6.
**Warning signs:** Code references agent-incident-response Edge Function that does not exist yet

### Pitfall 5: Edge Function Timeout on Large CVE Analysis
**What goes wrong:** SOC agent tries to analyze all CVEs in a single invocation, exceeding the 150-second Edge Function timeout
**Why it happens:** No pagination or batching of CVE analysis
**How to avoid:** SOC agent processes CVEs in batches (e.g., 20 per invocation). Use maxSteps: 8 (not 10+) to stay within timeout. For large backlogs, CISO delegates multiple scoped SOC tasks (by date range or severity).
**Warning signs:** Agent tasks failing with timeout errors

### Pitfall 6: IOC Table Bloat Without TTL
**What goes wrong:** ioc_tracking table grows unbounded as threat intel continuously adds indicators
**Why it happens:** No expiration mechanism for stale IOCs
**How to avoid:** Add expires_at column with default 90-day TTL. Include a CHECK constraint or pg_cron cleanup job. IOCs with is_active=false are soft-deleted and excluded from active queries.
**Warning signs:** ioc_tracking row count growing faster than threat_intelligence

## Code Examples

### SOC Agent Tool: Query and Triage CVEs
```typescript
// Tool for SOC agent to query recent CVEs relevant to the company
queryRecentCVEs: tool({
  description: "Query recent CVEs from the threat intelligence feed, optionally filtered by severity and recency. Returns CVE data including CVSS scores and CWE IDs.",
  parameters: z.object({
    min_cvss: z.number().optional().describe("Minimum CVSS score filter (default 7.0)"),
    days_back: z.number().int().optional().describe("Days to look back (default 7)"),
    limit: z.number().int().optional().describe("Max results to return (default 20)"),
  }),
  execute: async ({ min_cvss, days_back, limit }) => {
    const since = new Date();
    since.setDate(since.getDate() - (days_back ?? 7));

    let query = supabase
      .from("threat_intelligence")
      .select("id, external_id, title, description, severity, cvss_score, cvss_vector, cwe_id, published_date, is_exploited, tags")
      .gte("published_date", since.toISOString().split("T")[0])
      .order("cvss_score", { ascending: false })
      .limit(limit ?? 20);

    if (min_cvss) query = query.gte("cvss_score", min_cvss);

    const { data, error } = await query;
    if (error) return { error: error.message, cves: [] };
    return { cves: data ?? [], total: data?.length ?? 0 };
  },
}),
```

### SOC Agent Tool: Get Company Tech Stack
```typescript
// Tool for SOC agent to retrieve the company's declared technology stack
getCompanyTechStack: tool({
  description: "Get the company's declared technology stack from their onboarding profile. Used to determine CVE relevance.",
  parameters: z.object({}),
  execute: async () => {
    const { data, error } = await supabase
      .from("onboarding_profiles")
      .select("primary_tech_stack, system_name, target_cmmc_level")
      .eq("company_id", task.company_id)
      .maybeSingle();

    if (error) return { error: error.message, tech_stack: [] };
    if (!data) return { tech_stack: [], note: "No onboarding profile found. Company may not have completed onboarding." };

    return {
      tech_stack: data.primary_tech_stack ?? [],
      system_name: data.system_name,
      target_cmmc_level: data.target_cmmc_level,
    };
  },
}),
```

### Threat Intel Agent Tool: Generate Threat Brief
```typescript
// Tool for Threat Intel agent to save a generated threat brief
saveThreatBrief: tool({
  description: "Save a generated threat brief to the database. A threat brief summarizes recent threats relevant to the company's tech stack and maps them to CMMC controls.",
  parameters: z.object({
    title: z.string(),
    executive_summary: z.string(),
    threat_count: z.number().int(),
    affected_controls: z.array(z.object({
      control_id: z.string(),
      family_id: z.string(),
      threat_description: z.string(),
      risk_level: z.enum(["critical", "high", "medium", "low"]),
    })),
    iocs: z.array(z.object({
      type: z.enum(["ip", "domain", "hash", "url", "email"]),
      value: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
      source_cve: z.string().optional(),
    })).optional(),
  }),
  execute: async ({ title, executive_summary, threat_count, affected_controls, iocs }) => {
    const { data, error } = await supabase
      .from("threat_briefs")
      .insert({
        company_id: task.company_id,
        agent_task_id: task.id,
        title,
        executive_summary,
        threat_count,
        affected_controls,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    // Track IOCs if provided
    if (iocs && iocs.length > 0) {
      await supabase.from("ioc_tracking").insert(
        iocs.map(ioc => ({
          company_id: task.company_id,
          threat_brief_id: data.id,
          indicator_type: ioc.type,
          indicator_value: ioc.value,
          confidence_level: ioc.confidence,
          source_cve: ioc.source_cve,
          is_active: true,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        }))
      );
    }

    return { success: true, brief_id: data.id, iocs_tracked: iocs?.length ?? 0 };
  },
}),
```

### Database Schema: SOC Alerts Table
```sql
-- New table for SOC agent triage results
CREATE TABLE soc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  threat_intel_id UUID REFERENCES threat_intelligence(id),
  external_cve_id TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  cvss_score DECIMAL(3,1),
  tech_stack_match BOOLEAN NOT NULL DEFAULT false,
  relevance_score INTEGER NOT NULL DEFAULT 0 CHECK (relevance_score BETWEEN 0 AND 100),
  classification TEXT NOT NULL DEFAULT 'unclassified'
    CHECK (classification IN ('true_positive', 'false_positive', 'unclassified', 'needs_investigation')),
  classification_reasoning TEXT,
  escalation_status TEXT DEFAULT 'none'
    CHECK (escalation_status IN ('none', 'needs_ir_review', 'escalated_to_ciso', 'resolved')),
  affected_controls TEXT[] DEFAULT '{}',
  correlation_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_soc_alerts_company ON soc_alerts(company_id, created_at DESC);
CREATE INDEX idx_soc_alerts_classification ON soc_alerts(company_id, classification);
CREATE INDEX idx_soc_alerts_severity ON soc_alerts(company_id, severity, cvss_score DESC);
CREATE INDEX idx_soc_alerts_escalation ON soc_alerts(company_id, escalation_status)
  WHERE escalation_status != 'none';
```

### Database Schema: Threat Briefs Table
```sql
-- New table for Threat Intel agent briefs
CREATE TABLE threat_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  title TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  threat_count INTEGER NOT NULL DEFAULT 0,
  affected_controls JSONB NOT NULL DEFAULT '[]',
  risk_summary JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_threat_briefs_company ON threat_briefs(company_id, generated_at DESC);
```

### Database Schema: IOC Tracking Table
```sql
-- New table for Indicator of Compromise tracking
CREATE TABLE ioc_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  threat_brief_id UUID REFERENCES threat_briefs(id),
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain', 'hash', 'url', 'email')),
  indicator_value TEXT NOT NULL,
  confidence_level TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence_level IN ('high', 'medium', 'low')),
  source_cve TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, indicator_type, indicator_value)
);

CREATE INDEX idx_ioc_active ON ioc_tracking(company_id, is_active, indicator_type)
  WHERE is_active = true;
CREATE INDEX idx_ioc_expiry ON ioc_tracking(expires_at) WHERE is_active = true;
```

### CWE-to-CMMC Family Heuristic Mapping
```typescript
// Heuristic mapping of common CWE categories to NIST 800-171 / CMMC control families
// Used by Threat Intel agent to map CVE threats to specific controls at risk
export const CWE_TO_CMMC_FAMILY: Record<string, { families: string[]; description: string }> = {
  // Authentication & Access
  "CWE-287": { families: ["IA", "AC"], description: "Improper Authentication" },
  "CWE-306": { families: ["IA", "AC"], description: "Missing Authentication for Critical Function" },
  "CWE-522": { families: ["IA"], description: "Insufficiently Protected Credentials" },
  "CWE-798": { families: ["IA"], description: "Hard-coded Credentials" },
  "CWE-862": { families: ["AC"], description: "Missing Authorization" },
  "CWE-863": { families: ["AC"], description: "Incorrect Authorization" },

  // Injection & Input Validation -> System Integrity
  "CWE-79":  { families: ["SI", "SC"], description: "Cross-site Scripting (XSS)" },
  "CWE-89":  { families: ["SI"], description: "SQL Injection" },
  "CWE-78":  { families: ["SI"], description: "OS Command Injection" },
  "CWE-94":  { families: ["SI"], description: "Code Injection" },
  "CWE-502": { families: ["SI"], description: "Deserialization of Untrusted Data" },

  // Cryptographic Issues -> System & Communications Protection
  "CWE-327": { families: ["SC"], description: "Broken Crypto Algorithm" },
  "CWE-326": { families: ["SC"], description: "Inadequate Encryption Strength" },
  "CWE-311": { families: ["SC", "MP"], description: "Missing Encryption of Sensitive Data" },
  "CWE-295": { families: ["SC"], description: "Improper Certificate Validation" },

  // Information Disclosure -> Audit & Media Protection
  "CWE-200": { families: ["AU", "MP"], description: "Exposure of Sensitive Information" },
  "CWE-532": { families: ["AU"], description: "Info Exposure Through Log Files" },
  "CWE-209": { families: ["SI"], description: "Info Exposure Through Error Messages" },

  // Configuration Management
  "CWE-16":  { families: ["CM"], description: "Configuration" },
  "CWE-732": { families: ["CM", "AC"], description: "Incorrect Permission Assignment" },

  // Buffer/Memory -> System Integrity
  "CWE-119": { families: ["SI"], description: "Buffer Overflow" },
  "CWE-416": { families: ["SI"], description: "Use After Free" },
  "CWE-787": { families: ["SI"], description: "Out-of-bounds Write" },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual CVE triage by human analysts | AI-assisted triage with LLM reasoning | 2024-2025 | 80% reduction in MTTR, 90%+ alert coverage vs 22% manual |
| Rule-based false positive detection | LLM-based contextual classification with reasoning chains | 2025 | 40-62% of alerts were previously ignored; AI addresses the full queue |
| Separate threat intel and compliance tracking | Unified threat-to-control mapping | 2025-2026 | Threat intelligence becomes actionable compliance input |
| Generic CVE feeds for all customers | Tech-stack-filtered relevance scoring | Current best practice | Eliminates noise; only relevant threats surfaced |

**Deprecated/outdated:**
- NVD API v1.0: Deprecated in favor of v2.0 (already using v2.0 in fetch-cve-feed)
- CVSS v2: Only CVSS v3.1 is used in the existing fetch-cve-feed (correct approach)

## Open Questions

1. **CISO Orchestrator Prompt Update Scope**
   - What we know: Current CISO system prompt only references delegating to "GRC Analyst" and "other specialist agents"
   - What's unclear: Should the CISO prompt be fully rewritten with explicit SOC/Threat Intel delegation rules, or just appended?
   - Recommendation: Append new delegation rules to existing prompt. Add new delegation tools (delegateToSOC, delegateToThreatIntel). Do NOT rewrite existing GRC delegation logic.

2. **CVE-to-Tech-Stack Matching Fidelity**
   - What we know: CVE descriptions contain affected product names. onboarding_profiles.primary_tech_stack is a TEXT[] of technology names.
   - What's unclear: How precisely to match CVE descriptions to tech stack entries (exact match vs fuzzy match vs CPE matching)
   - Recommendation: For v1, use LLM-based matching. The SOC agent's system prompt instructs it to compare CVE affected products against the company's tech stack and explain the match reasoning. This is more flexible than rule-based CPE matching and leverages the existing AI infrastructure.

3. **Attack Surface Mapping Visualization (THRT-04)**
   - What we know: The agent dashboard already displays agent activity and outputs
   - What's unclear: How to visualize attack surface mapping on the existing dashboard
   - Recommendation: Store attack surface data as structured JSONB in threat_briefs.risk_summary. Phase 5 focuses on the backend agent producing this data; frontend visualization can extend the existing agent task detail view to render risk_summary as a list of affected controls with severity badges.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x (jsdom environment) |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --bail 1 src/lib/__tests__/soc-*.test.ts src/lib/__tests__/threat-intel-*.test.ts` |
| Full suite command | `npx vitest run --bail 1` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SOC-01 | SOC schemas validate triage output with severity/context fields | unit | `npx vitest run --bail 1 src/lib/__tests__/soc-schemas.test.ts` | Wave 0 |
| SOC-01 | SOC Edge Function handler structure matches agent pattern | unit | `npx vitest run --bail 1 src/lib/__tests__/soc-agent.test.ts` | Wave 0 |
| SOC-02 | SOC correlation tool queries multiple data sources | unit | `npx vitest run --bail 1 src/lib/__tests__/soc-agent.test.ts` | Wave 0 |
| SOC-03 | False positive classification includes reasoning field | unit | `npx vitest run --bail 1 src/lib/__tests__/soc-schemas.test.ts` | Wave 0 |
| SOC-04 | SOC escalation status flows through CISO delegation | unit | `npx vitest run --bail 1 src/lib/__tests__/soc-agent.test.ts` | Wave 0 |
| SOC-ALL | soc_alerts migration has correct columns, RLS, indexes | unit | `npx vitest run --bail 1 src/lib/__tests__/soc-migration.test.ts` | Wave 0 |
| THRT-01 | Threat Intel schemas validate enhanced CVE analysis output | unit | `npx vitest run --bail 1 src/lib/__tests__/threat-intel-schemas.test.ts` | Wave 0 |
| THRT-02 | Threat brief schema includes tech_stack_relevance and executive_summary | unit | `npx vitest run --bail 1 src/lib/__tests__/threat-intel-schemas.test.ts` | Wave 0 |
| THRT-03 | CWE-to-CMMC mapping covers common weakness categories | unit | `npx vitest run --bail 1 src/lib/__tests__/threat-intel-agent.test.ts` | Wave 0 |
| THRT-04 | IOC tracking schema validates indicator types and confidence levels | unit | `npx vitest run --bail 1 src/lib/__tests__/threat-intel-schemas.test.ts` | Wave 0 |
| THRT-ALL | threat_briefs and ioc_tracking migrations correct | unit | `npx vitest run --bail 1 src/lib/__tests__/threat-intel-migration.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --bail 1 src/lib/__tests__/soc-*.test.ts src/lib/__tests__/threat-intel-*.test.ts`
- **Per wave merge:** `npx vitest run --bail 1`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/lib/__tests__/soc-schemas.test.ts` -- covers SOC-01, SOC-03
- [ ] `src/lib/__tests__/soc-agent.test.ts` -- covers SOC-01, SOC-02, SOC-04
- [ ] `src/lib/__tests__/soc-migration.test.ts` -- covers SOC-ALL migration structure
- [ ] `src/lib/__tests__/threat-intel-schemas.test.ts` -- covers THRT-01, THRT-02, THRT-04
- [ ] `src/lib/__tests__/threat-intel-agent.test.ts` -- covers THRT-01, THRT-03
- [ ] `src/lib/__tests__/threat-intel-migration.test.ts` -- covers THRT-ALL migration structure

## Sources

### Primary (HIGH confidence)
- `supabase/functions/_shared/agent-base.ts` -- executeAgentTask, delegateTask patterns
- `supabase/functions/_shared/agent-types.ts` -- AgentType enum already includes soc-analyst, threat-intel
- `supabase/functions/agent-worker/index.ts` -- AGENT_FUNCTION_MAP already routes soc-analyst and threat-intel
- `supabase/functions/agent-grc-analyst/index.ts` -- Edge Function skeleton pattern
- `supabase/functions/_shared/grc-tools.ts` -- Tool factory pattern (createGrcTools)
- `supabase/functions/_shared/ciso-tools.ts` -- CISO delegation pattern (delegateToGRC)
- `supabase/functions/fetch-cve-feed/index.ts` -- Existing NVD CVE ingestion
- `supabase/migrations/20260105145624_*.sql` -- threat_intelligence table schema
- `supabase/migrations/20260327200000_trial_and_onboarding.sql` -- onboarding_profiles.primary_tech_stack

### Secondary (MEDIUM confidence)
- [NVD CVE API 2.0 Documentation](https://nvd.nist.gov/developers/vulnerabilities) -- API response structure, CVSS/CWE fields
- [CMMC vs NIST 800-171 Mapping](https://www.strikegraph.com/blog/cmmc-nist-800-171) -- CMMC Level 2 is one-to-one with NIST 800-171 controls
- [AI SOC Alert Triage Benchmarks](https://simbian.ai/blog/the-first-ai-soc-llm-benchmark) -- LLM performance on alert triage (61-67% accuracy, human+AI 73-85%)
- [SOC Alert Triage with AI 2026](https://www.networkintelligence.ai/blogs/soc-alert-triage/) -- 90% alert coverage achievable with AI

### Tertiary (LOW confidence)
- CWE-to-CMMC-family mapping is heuristic, not from an official source. Based on reasoning about which vulnerability categories affect which control families. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, patterns established across 4 phases
- Architecture: HIGH -- exact same skeleton as GRC/CISO agents, no new patterns needed
- Data models: HIGH -- natural extension of existing tables with same RLS/indexing patterns
- CWE-to-CMMC mapping: MEDIUM -- heuristic approach, not from official mapping document
- Pitfalls: MEDIUM -- derived from industry research and codebase patterns

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- no fast-moving dependencies)
