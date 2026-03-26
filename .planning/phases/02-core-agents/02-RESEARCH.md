# Phase 2: Core Agents - Research

**Researched:** 2026-03-26
**Domain:** AI agent implementation (GRC Analyst + CISO Orchestrator) for CMMC compliance gap analysis
**Confidence:** HIGH

## Summary

Phase 2 builds two operational AI agents -- the GRC Analyst and the CISO Orchestrator -- on top of the Phase 1 foundation (agent-base module, pgmq queue, approval gates, CMMC controls data). The GRC Analyst is the primary value-producing agent: it consumes CMMC controls + assessment responses + uploaded document metadata, reasons about compliance gaps at the assessment-objective level per NIST 800-171A methodology, and produces structured gap analysis reports with multi-option remediation recommendations ranked by cost and effort. The CISO Orchestrator is the coordination layer: it receives high-level requests (run a compliance assessment, generate an executive summary), breaks them into delegated tasks for the GRC agent, tracks their priority and status, and synthesizes results into executive-grade output.

The critical technical challenge is bridging the AI SDK's generateText tool-calling pattern with the existing agent-base module's lifecycle management. The agent-test Edge Function from Phase 1 already demonstrates this exact pattern -- generateText with tools inside an executeAgentTask handler. Phase 2 extends this by giving the GRC agent domain-specific tools (query controls, query assessments, query findings, calculate SPRS score) and the CISO agent delegation tools (delegate to GRC, read task results, synthesize reports). Both agents will use structured output via Zod schemas to produce typed, parseable JSON responses rather than free-text.

The domain knowledge from the NotebookLM CMMC reference is essential: assessment is at the OBJECTIVE level (single failed objective = entire requirement NOT MET), evidence must be categorized by method (examine/interview/test), SSP must align to 14 control families, and POA&M has hard constraints (minimum 80/110 SPRS, critical controls cannot be deferred, 180-day remediation window). These rules must be encoded into the GRC agent's system prompt and tool logic, not left to the LLM to "figure out."

**Primary recommendation:** Build the GRC Analyst agent first with 6 domain-specific tools and strict Zod output schemas. Then build the CISO Orchestrator that delegates to GRC via the existing delegateTask function. Replace AIRiskAnalysisService callers with agent task dispatch as the final step.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CISO-01 | CISO agent delegates tasks to specialist agents based on priority queue | delegateTask() from agent-base already enforces hub-and-spoke; CISO needs priority sorting logic + delegation tools |
| CISO-02 | CISO agent generates executive summary reports from all agent outputs | generateText with structured output Zod schema for ExecutiveSummary; reads completed task outputs |
| CISO-03 | CISO agent escalates high-risk findings to human operators for approval | Approval gate system from Phase 1 Plan 03 handles this; CISO sets risk_level='high' on sensitive tasks |
| CISO-04 | CISO agent maintains a prioritized risk assessment across all agent domains | New compliance_snapshots table for point-in-time risk state; CISO recalculates after each GRC analysis |
| CISO-05 | User can view CISO agent's current task queue and delegation status | Frontend query of agent_tasks filtered by agent_type='ciso_orchestrator' + child tasks; TanStack Query hook |
| GRC-01 | GRC agent auto-assesses compliance gaps from uploaded documents | Tools: queryAssessmentResponses, queryControls; system prompt encodes 800-171A objective-level assessment |
| GRC-02 | GRC agent generates gap analysis reports against CMMC L1/L2 controls | Structured output via Zod GapAnalysisReport schema; iterates all 110 controls or scoped subset |
| GRC-03 | GRC agent generates multi-option remediation recommendations with cost/effort ranking | Zod RemediationOption schema with cost_tier/effort_tier enums; LLM generates options from control context |
| GRC-04 | GRC agent tracks compliance status changes over time | compliance_snapshots table with timestamped SPRS scores + per-control status; diffing previous vs current |
| GRC-05 | GRC agent prepares audit-ready documentation packages | Tools generate SSP sections organized by 14 control families, POA&M with 80/110 threshold validation |
| CMMC-05 | GRC agent identifies gaps between current posture and CMMC L1/L2 requirements | Core gap analysis logic: compare assessment_responses against controls.assessment_objectives |
| DATA-03 | Replace mock AIRiskAnalysisService with real agent-driven analysis | Replace callers of AIRiskAnalysisService with supabase.functions.invoke('agent-grc-analyst') |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | 6.x | Agent reasoning via generateText with tool-calling loops | Already used in agent-test (npm:ai@6); 20M+ monthly downloads; native Anthropic provider |
| @ai-sdk/anthropic | 3.x | Claude model provider for AI SDK | Already used in agent-test (npm:@ai-sdk/anthropic@3); verified working in Deno Edge Functions |
| zod | 3.x | Tool input schemas + structured output validation | Already used in agent-types.ts (npm:zod@3); required by AI SDK for tool definitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | 2.49+ | Database queries from within agent tools | Already installed; used via createServiceClient() |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| generateText | Agent class (AI SDK 6) | Agent class is higher-level but less control over per-step behavior; generateText with tools is simpler for Edge Functions |
| Claude sonnet | Claude opus/haiku | Sonnet is cost-efficient for gap analysis; opus for complex synthesis; haiku too weak for compliance reasoning |
| Manual tool loop | ToolLoopAgent | ToolLoopAgent is newer abstraction; existing codebase uses generateText+maxSteps pattern; stay consistent |

**Installation:**
No new npm packages needed. Edge Functions use `npm:` specifiers:
```typescript
import { generateText, tool } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import { z } from "npm:zod@3";
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
  _shared/
    agent-base.ts          # Existing - executeAgentTask, delegateTask
    agent-types.ts         # Existing - Zod schemas, enums
    approval-gate.ts       # Existing - approval flow
    supabase-client.ts     # Existing - client factories
    grc-tools.ts           # NEW - GRC agent tool definitions
    grc-schemas.ts         # NEW - Zod schemas for GRC output types
    ciso-tools.ts          # NEW - CISO agent tool definitions
    ciso-schemas.ts        # NEW - Zod schemas for CISO output types
  agent-grc-analyst/
    index.ts               # NEW - GRC Analyst Edge Function
  agent-ciso-orchestrator/
    index.ts               # NEW - CISO Orchestrator Edge Function
src/
  types/
    agent.ts               # Existing - frontend agent types
    grc-output.ts          # NEW - TypeScript types matching GRC Zod schemas
  hooks/
    useAgentTasks.ts        # NEW - TanStack Query hook for agent task data
  services/
    agentService.ts         # NEW - client-side agent task dispatch
    AIRiskAnalysisService.ts # MODIFY - redirect to agent dispatch
supabase/migrations/
    XXXXXXXX_compliance_snapshots.sql  # NEW - compliance history tracking
    XXXXXXXX_gap_analysis_tables.sql   # NEW - structured gap analysis storage
```

### Pattern 1: Agent Handler with Domain Tools

**What:** Each agent Edge Function follows the same skeleton: fetch task from DB, normalize enum formats, call executeAgentTask with a handler that uses generateText + domain-specific tools.

**When to use:** Every agent implementation.

**Example:**
```typescript
// supabase/functions/agent-grc-analyst/index.ts
import { generateText, tool } from "npm:ai@6";
import { anthropic } from "npm:@ai-sdk/anthropic@3";
import { z } from "npm:zod@3";
import { executeAgentTask } from "../_shared/agent-base.ts";
import { GRC_SYSTEM_PROMPT } from "../_shared/grc-tools.ts";
import { GapAnalysisReportSchema } from "../_shared/grc-schemas.ts";

// Inside the handler:
const result = await executeAgentTask(supabase, task, async (t) => {
  const { text, toolCalls, steps } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: GRC_SYSTEM_PROMPT,
    prompt: buildPromptForAction(t.action, t.input),
    tools: {
      queryControls: tool({ /* ... */ }),
      queryAssessmentResponses: tool({ /* ... */ }),
      queryFindings: tool({ /* ... */ }),
      calculateSprsScore: tool({ /* ... */ }),
      getControlFamily: tool({ /* ... */ }),
      getEvidenceStatus: tool({ /* ... */ }),
    },
    maxSteps: 10,
  });

  return {
    output: parseStructuredOutput(text),
    reasoning: summarizeSteps(steps),
  };
});
```

### Pattern 2: CISO Orchestrator Delegation

**What:** The CISO agent receives a high-level task, plans subtasks, delegates them to GRC via the existing delegateTask function, and polls/waits for completion before synthesizing results.

**When to use:** Any multi-step workflow that spans agents.

**Example:**
```typescript
// CISO handler receives "run-compliance-assessment" action
// 1. Plan: determine which control families need assessment
// 2. Delegate: create GRC tasks for each family/scope
// 3. Track: store delegation plan in task output
// The CISO does NOT wait for GRC in the same invocation.
// Instead, it creates subtasks and completes.
// A follow-up CISO task ("synthesize-results") runs
// after GRC subtasks complete (triggered by worker polling).

const delegationResult = await delegateTask(
  supabase,
  cisoTask,
  "grc-analyst",
  "gap-analysis",
  { control_family: "3.1", company_id: cisoTask.company_id }
);
```

### Pattern 3: Structured Output with Zod Schemas

**What:** All agent outputs conform to typed Zod schemas, enabling downstream consumers (frontend, CISO synthesis, report generation) to parse results reliably without free-text interpretation.

**When to use:** Every agent output.

**Example:**
```typescript
// grc-schemas.ts
export const GapAnalysisReportSchema = z.object({
  assessment_date: z.string(),
  cmmc_level: z.enum(["1", "2"]),
  sprs_score: z.number(),
  total_controls: z.number(),
  met_count: z.number(),
  not_met_count: z.number(),
  not_applicable_count: z.number(),
  findings: z.array(z.object({
    control_id: z.string(),
    control_title: z.string(),
    family_name: z.string(),
    status: z.enum(["MET", "NOT_MET", "NOT_APPLICABLE"]),
    failed_objectives: z.array(z.string()),
    evidence_gaps: z.array(z.object({
      method: z.enum(["examine", "interview", "test"]),
      description: z.string(),
    })),
    remediation_options: z.array(z.object({
      option_id: z.string(),
      description: z.string(),
      cost_tier: z.enum(["low", "medium", "high"]),
      effort_tier: z.enum(["low", "medium", "high"]),
      timeline_days: z.number(),
      priority_rank: z.number(),
    })),
  })),
});
```

### Pattern 4: Asynchronous Task Chaining (Not Synchronous Waiting)

**What:** Agent invocations are single-step: one Edge Function invocation does one unit of work and completes. Multi-step workflows are modeled as chains of tasks in the agent_tasks table, not as long-running Edge Function processes.

**When to use:** Always. Supabase Edge Functions have a ~150s timeout.

**Why critical:** The CISO orchestrator cannot invoke the GRC agent and wait for it in the same function execution. Instead: CISO creates a task (delegateTask), marks its own task as "completed" with a delegation plan, and a follow-up task is queued to run after the delegated work finishes. The agent-worker polling (pg_cron every minute) handles the timing.

### Anti-Patterns to Avoid

- **Synchronous agent chaining:** Do NOT have the CISO Edge Function call the GRC Edge Function and await the response. Edge Functions time out at ~150s, and GRC analysis of 110 controls could take longer. Use task chaining via the queue.
- **Free-text agent output:** Do NOT let the LLM produce unstructured text as the gap analysis result. Always use Zod schemas for parseable, typed output.
- **Hardcoding assessment logic in code:** Encode CMMC assessment rules (objective-level evaluation, evidence categorization, critical control identification) in the system prompt and tool definitions, not in hand-coded if/else trees. The LLM reasons over rules; tools provide data.
- **Skipping assessment objectives:** The GRC agent MUST evaluate at the objective level, not the control level. A control with 5 objectives where 4 pass and 1 fails is NOT MET. This must be in the system prompt.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gap analysis reasoning | Custom rule engine matching controls to responses | LLM (Claude) with tools that query controls + responses | 110 controls x N objectives x 3 evidence methods = combinatorial explosion; LLM handles nuance |
| SPRS score calculation | New scoring logic in the agent | Existing calculateSprsScore pure function (src/lib/sprs-calculator.ts) wrapped as a tool | Already tested with 11 unit tests; no reason to rebuild |
| OSCAL control data access | Custom control lookup logic | Existing controls table + simple SQL queries in tools | Data is seeded and indexed |
| Task delegation | Custom message passing between agents | Existing delegateTask() from agent-base.ts | Already enforces hub-and-spoke, depth limits, pgmq queueing |
| Approval routing | New approval logic | Existing approval-gate.ts (checkApprovalRequired, createApprovalRequest) | Already integrated into executeAgentTask lifecycle |
| Risk classification | New classification system | Existing classifyRiskServer() verb-pattern matching | Already tested with 28 unit tests |
| Executive summary formatting | Custom report templating | LLM with structured output schema | LLM excels at synthesis; schema ensures parseable output |

**Key insight:** Phase 1 built the entire agent runtime infrastructure. Phase 2 agents are essentially "fill in the handler" -- the lifecycle, approval, audit, multi-tenant, and queue infrastructure is done. The complexity is in the domain-specific tools and prompts, not the agent framework.

## Common Pitfalls

### Pitfall 1: Control-Level Instead of Objective-Level Assessment
**What goes wrong:** Marking a control as MET/NOT_MET without evaluating individual assessment objectives. This produces incorrect gap analysis because a single failed objective means the entire requirement is NOT MET.
**Why it happens:** Oversimplification -- treating each control as a binary pass/fail without drilling into the objectives array stored in controls.assessment_objectives.
**How to avoid:** The GRC system prompt must explicitly state "evaluate each assessment objective individually. A control is MET only if ALL applicable objectives are satisfied." The queryControls tool must return assessment_objectives, not just control-level data.
**Warning signs:** Gap analysis results where every control is either fully MET or fully NOT_MET with no partial objective detail.

### Pitfall 2: Ignoring Evidence Method Categorization
**What goes wrong:** Producing gap analysis that says "you need evidence for control X" without specifying whether it's an examine (document), interview (personnel), or test (demonstration) evidence requirement.
**Why it happens:** NIST 800-171A specifies evidence methods per objective, but it's easy to skip this categorization.
**How to avoid:** GapAnalysisReport schema includes evidence_gaps with a method enum. System prompt instructs the GRC agent to classify evidence needs by method.
**Warning signs:** All evidence gaps listed as generic "provide evidence" without method classification.

### Pitfall 3: Edge Function Timeout on Full 110-Control Analysis
**What goes wrong:** GRC agent tries to analyze all 110 controls in a single generateText call, exceeds the ~150s Edge Function timeout, and the task fails.
**Why it happens:** 110 controls x multiple objectives each = potentially hundreds of tool calls and reasoning steps.
**How to avoid:** Scope GRC analysis by control family (14 families). The CISO orchestrator delegates family-scoped tasks, not "analyze everything." Each family-scoped task is manageable within timeout.
**Warning signs:** agent_tasks with status='failed' and error containing timeout messages.

### Pitfall 4: Non-Deterministic Agent Output Breaking Frontend Parsing
**What goes wrong:** The LLM produces output that doesn't match the expected Zod schema, and the frontend crashes trying to display gap analysis results.
**Why it happens:** generateText returns text, which may not perfectly conform to the schema unless explicitly instructed.
**How to avoid:** Use generateText with output: Output.object({ schema: GapAnalysisReportSchema }), which forces structured JSON output. The AI SDK validates against the Zod schema before returning.
**Warning signs:** Zod parse errors in agent output processing.

### Pitfall 5: CISO-GRC Circular Delegation
**What goes wrong:** CISO delegates to GRC, GRC somehow creates a task that triggers CISO, which delegates back to GRC, consuming the delegation depth limit.
**Why it happens:** Misconfigured action routing or GRC trying to "escalate" directly.
**How to avoid:** Hub-and-spoke is enforced at SQL constraint level (source_agent must be ciso_orchestrator or NULL). GRC agent NEVER calls delegateTask. Only CISO delegates. MAX_DELEGATION_DEPTH = 3 is a safety net.
**Warning signs:** agent_tasks with delegation_depth > 1 for simple analyses.

### Pitfall 6: Mock Service Callers Not Updated
**What goes wrong:** Some frontend components still call AIRiskAnalysisService methods, which return mock data instead of real agent analysis.
**Why it happens:** The replacement requires updating every caller, and some may be missed.
**How to avoid:** Identify all callers of AIRiskAnalysisService (grep for import), replace with agent task dispatch, and add a test that validates the mock class has no remaining callers.
**Warning signs:** Components showing hardcoded risk insights that don't change between assessments.

## Code Examples

### GRC Agent System Prompt (Verified against NIST 800-171A methodology)

```typescript
// Source: NotebookLM CMMC reference + NIST 800-171A assessment methodology
export const GRC_SYSTEM_PROMPT = `You are a GRC (Governance, Risk, and Compliance) Analyst specializing in CMMC Level 2 compliance assessment per NIST SP 800-171 Revision 2.

## Assessment Methodology (NIST SP 800-171A)

You perform gap analysis by evaluating assessment OBJECTIVES, not just controls. Critical rules:

1. **Objective-level evaluation**: Each NIST 800-171 control has multiple assessment objectives. A control is MET only if ALL applicable objectives are satisfied. A single failed objective = entire requirement NOT MET.

2. **Finding types**:
   - MET: All applicable assessment objectives satisfied with finalized, approved evidence
   - NOT MET: One or more objectives not satisfied
   - NOT APPLICABLE: Requirement doesn't apply (equivalent to MET, requires explanation)

3. **Evidence categorization by method**:
   - Examine: Review/inspect/observe/analyze artifacts (policies, SOPs, SSPs, network diagrams, config settings, audit logs)
   - Interview: Discussions with specific personnel (system admins, security personnel, users)
   - Test: Exercise systems under specified conditions (live demonstrations)

4. **SPRS scoring**: Start at 110, subtract weight for each NOT MET control. Partially implemented = full deduction. Not applicable = zero deduction.

5. **POA&M rules**: Minimum 80/110 SPRS to use POA&M. Critical controls (MFA, FIPS encryption, incident response, audit logging, SSP) cannot be deferred. 180-day remediation deadline.

6. **SSP alignment**: All output organized by the 14 NIST 800-171 control families for assessor traceability.

7. **Implementation specificity**: Flag vague implementation statements. "We limit system access" is NOT acceptable. "Access requires MFA using Yubikey hardware tokens with 12-character passwords rotated every 90 days" IS acceptable.

## Your Role

When analyzing compliance gaps:
- Use the queryControls tool to fetch control details including assessment objectives
- Use the queryAssessmentResponses tool to get the organization's current implementation status
- Evaluate each objective within a control independently
- Categorize needed evidence by method (examine/interview/test)
- Generate remediation options ranked by cost and effort
- Calculate SPRS impact using the calculateSprsScore tool

Output must conform to the GapAnalysisReport schema. Never produce free-text analysis.`;
```

### GRC Agent Tool Definitions

```typescript
// Source: Pattern from agent-test/index.ts + domain-specific queries
const grcTools = {
  queryControls: tool({
    description: "Query CMMC controls from the database. Returns control details including assessment objectives, SPRS weight, and family information. Can filter by control_id, family_id, or cmmc_level.",
    parameters: z.object({
      control_id: z.string().optional().describe("Specific control ID e.g. '3.1.1'"),
      family_id: z.string().optional().describe("Control family ID e.g. '3.1' for Access Control"),
      cmmc_level: z.number().optional().describe("CMMC level filter: 1 or 2"),
    }),
    execute: async ({ control_id, family_id, cmmc_level }) => {
      let query = supabase.from("controls").select("*");
      if (control_id) query = query.eq("control_id", control_id);
      if (family_id) query = query.eq("family_id", family_id);
      if (cmmc_level) query = query.eq("cmmc_level", cmmc_level);
      const { data, error } = await query;
      return error ? { error: error.message } : { controls: data, count: data?.length ?? 0 };
    },
  }),

  queryAssessmentResponses: tool({
    description: "Query the organization's assessment responses for their compliance posture. Returns implementation status per control.",
    parameters: z.object({
      assessment_id: z.string().describe("The assessment UUID to query"),
      company_id: z.string().describe("Company UUID for multi-tenant scoping"),
      control_id: z.string().optional().describe("Filter to specific control"),
    }),
    execute: async ({ assessment_id, company_id, control_id }) => {
      let query = supabase
        .from("assessment_responses")
        .select("*, assessment_questions!inner(control_id, domain_name)")
        .eq("assessment_id", assessment_id);
      // company_id scoping via assessment ownership
      if (control_id) query = query.eq("assessment_questions.control_id", control_id);
      const { data, error } = await query;
      return error ? { error: error.message } : { responses: data, count: data?.length ?? 0 };
    },
  }),

  queryFindings: tool({
    description: "Query existing assessment findings (gaps) for the organization.",
    parameters: z.object({
      assessment_id: z.string().describe("The assessment UUID"),
      company_id: z.string().describe("Company UUID"),
      status: z.string().optional().describe("Filter by status: open, in_progress, resolved"),
    }),
    execute: async ({ assessment_id, company_id, status }) => {
      let query = supabase
        .from("assessment_findings")
        .select("*")
        .eq("assessment_id", assessment_id)
        .eq("company_id", company_id);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      return error ? { error: error.message } : { findings: data, count: data?.length ?? 0 };
    },
  }),

  calculateSprsScore: tool({
    description: "Calculate the SPRS score for the organization based on their assessment responses. Returns current score, deductions, and implementation counts.",
    parameters: z.object({
      assessment_id: z.string().describe("The assessment UUID"),
      company_id: z.string().describe("Company UUID"),
    }),
    execute: async ({ assessment_id, company_id }) => {
      // Fetch controls with weights
      const { data: controls } = await supabase
        .from("controls")
        .select("control_id, sprs_weight");
      // Fetch responses
      const { data: responses } = await supabase
        .from("assessment_responses")
        .select("*, assessment_questions!inner(control_id)")
        .eq("assessment_id", assessment_id);
      // Map to SPRS format and calculate
      // (Uses same algorithm as src/lib/sprs-calculator.ts)
      const mapped = (responses ?? []).map(r => ({
        control_id: r.assessment_questions.control_id,
        status: r.response_value === 'yes' ? 'implemented' :
               r.response_value === 'partial' ? 'partially_implemented' :
               r.response_value === 'na' ? 'not_applicable' : 'not_implemented',
      }));
      // Calculate score inline (pure function logic)
      let score = 110;
      const deductions = [];
      for (const ctrl of (controls ?? [])) {
        const resp = mapped.find(m => m.control_id === ctrl.control_id);
        if (!resp || (resp.status !== 'implemented' && resp.status !== 'not_applicable')) {
          score -= ctrl.sprs_weight;
          deductions.push({ control_id: ctrl.control_id, weight: ctrl.sprs_weight });
        }
      }
      return { score, maxScore: 110, deductions, totalControls: controls?.length ?? 0 };
    },
  }),

  getControlFamily: tool({
    description: "Get all controls within a specific NIST 800-171 control family.",
    parameters: z.object({
      family_id: z.string().describe("The family ID, e.g. '3.1' for Access Control"),
    }),
    execute: async ({ family_id }) => {
      const { data, error } = await supabase
        .from("controls")
        .select("control_id, title, assessment_objectives, cmmc_level, sprs_weight")
        .eq("family_id", family_id)
        .order("control_id");
      return error ? { error: error.message } : { controls: data, family_id };
    },
  }),

  getEvidenceStatus: tool({
    description: "Check what evidence documents exist for a specific control.",
    parameters: z.object({
      control_id: z.string().describe("The NIST 800-171 control ID"),
      company_id: z.string().describe("Company UUID"),
    }),
    execute: async ({ control_id, company_id }) => {
      // Query document_embeddings or a future evidence tracking table
      // For now, check assessment_findings for existing evidence references
      const { data } = await supabase
        .from("assessment_findings")
        .select("id, title, status, recommendation")
        .eq("control_id", control_id)
        .eq("company_id", company_id);
      return { evidence_records: data ?? [], has_evidence: (data?.length ?? 0) > 0 };
    },
  }),
};
```

### CISO Orchestrator Delegation Pattern

```typescript
// Source: Existing delegateTask from agent-base.ts + orchestrator-worker pattern from AI SDK docs
export const CISO_SYSTEM_PROMPT = `You are the CISO (Chief Information Security Officer) Orchestrator for a CMMC compliance platform. You coordinate all security assessment activities.

## Your Role
- Receive high-level compliance requests from users
- Break requests into actionable tasks for specialist agents
- Delegate tasks to the GRC Analyst agent
- Track task completion and synthesize results
- Generate executive summaries from agent outputs
- Escalate high-risk findings for human approval

## Delegation Rules
- You delegate tasks using the delegateToGRC tool
- You NEVER perform detailed compliance analysis yourself
- You synthesize and summarize results from specialist agents
- You maintain a prioritized risk assessment across all domains

## Priority Queue
When multiple tasks are pending, prioritize by:
1. Critical controls (MFA, encryption, IR, audit, SSP) -- always highest priority
2. High-SPRS-weight controls (5-point) before low-weight (1-point)
3. Controls with existing findings before unassessed controls
4. User-requested assessments before scheduled assessments`;

// CISO tools:
const cisoTools = {
  delegateToGRC: tool({
    description: "Delegate a compliance analysis task to the GRC Analyst agent.",
    parameters: z.object({
      action: z.string().describe("The action for GRC to perform: gap-analysis, control-review, remediation-plan, audit-package"),
      scope: z.object({
        control_family: z.string().optional(),
        control_ids: z.array(z.string()).optional(),
        cmmc_level: z.number().optional(),
      }).describe("Scope of the analysis"),
      priority: z.enum(["critical", "high", "medium", "low"]),
    }),
    execute: async ({ action, scope, priority }) => {
      const result = await delegateTask(
        supabase, cisoTask, "grc-analyst", action,
        { ...scope, priority, company_id: cisoTask.company_id }
      );
      return result;
    },
  }),

  readCompletedTaskResults: tool({
    description: "Read the output of completed agent tasks delegated by this CISO task.",
    parameters: z.object({
      task_id: z.string().optional().describe("Specific task ID to read"),
      status_filter: z.enum(["completed", "failed", "all"]).default("completed"),
    }),
    execute: async ({ task_id, status_filter }) => {
      let query = supabase.from("agent_tasks")
        .select("id, agent_type, action, output, status, completed_at")
        .eq("parent_task_id", cisoTask.id)
        .eq("company_id", cisoTask.company_id);
      if (task_id) query = query.eq("id", task_id);
      if (status_filter !== "all") query = query.eq("status", status_filter);
      const { data, error } = await query;
      return error ? { error: error.message } : { tasks: data };
    },
  }),

  getCurrentSprsScore: tool({
    description: "Get the current SPRS score for executive summary context.",
    parameters: z.object({ company_id: z.string() }),
    execute: async ({ company_id }) => {
      const { data } = await supabase
        .from("compliance_snapshots")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] ?? { score: null, message: "No compliance snapshot found" };
    },
  }),
};
```

### Compliance Snapshot Data Model

```sql
-- Source: Requirement GRC-04 (compliance status tracking over time)
CREATE TABLE public.compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id),
  sprs_score INTEGER NOT NULL,
  total_controls INTEGER NOT NULL DEFAULT 110,
  met_count INTEGER NOT NULL DEFAULT 0,
  not_met_count INTEGER NOT NULL DEFAULT 0,
  not_applicable_count INTEGER NOT NULL DEFAULT 0,
  cmmc_level INTEGER NOT NULL CHECK (cmmc_level IN (1, 2)),
  -- Per-family breakdown stored as JSONB for flexibility
  family_scores JSONB NOT NULL DEFAULT '{}',
  -- Snapshot of critical control status
  critical_controls_met BOOLEAN NOT NULL DEFAULT false,
  poam_eligible BOOLEAN NOT NULL DEFAULT false,  -- score >= 80
  -- Metadata
  triggered_by TEXT NOT NULL DEFAULT 'manual', -- 'grc-agent', 'manual', 'scheduled'
  agent_task_id UUID REFERENCES public.agent_tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for time-series queries per company
CREATE INDEX idx_compliance_snapshots_company_time
  ON public.compliance_snapshots (company_id, created_at DESC);

-- RLS: users can view their company's snapshots
ALTER TABLE public.compliance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view company compliance snapshots"
  ON public.compliance_snapshots FOR SELECT TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

### Gap Analysis Result Storage

```sql
-- Source: Requirements GRC-02, GRC-05 (structured gap analysis output)
CREATE TABLE public.gap_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id),
  agent_task_id UUID NOT NULL REFERENCES public.agent_tasks(id),
  cmmc_level INTEGER NOT NULL CHECK (cmmc_level IN (1, 2)),
  scope_family_id TEXT,  -- NULL = full assessment, else family-scoped
  -- Structured output from GRC agent (matches GapAnalysisReportSchema)
  report JSONB NOT NULL,
  sprs_score_at_analysis INTEGER NOT NULL,
  findings_count INTEGER NOT NULL DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gap_analysis_company_time
  ON public.gap_analysis_results (company_id, created_at DESC);

ALTER TABLE public.gap_analysis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view company gap analysis"
  ON public.gap_analysis_results FOR SELECT TO authenticated
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI SDK 5 generateObject/generateText separate | AI SDK 6 unified generateText with Output.object() | 2025-Q3 | Agents can do tool-calling + structured output in one flow |
| maxSteps integer | stopWhen condition functions | AI SDK 5+ | More flexible loop control; stopWhen: stepCountIs(N) replaces maxSteps |
| esm.sh imports for Deno | npm: specifier imports | Supabase Edge Functions 2025 | Cleaner, more reliable dependency resolution |
| Manual agent coordination | Agent class with generate/stream | AI SDK 6 | Reusable agent definitions; however, generateText is simpler for Edge Functions |

**Deprecated/outdated:**
- `maxSteps` parameter: Still works but `stopWhen: stepCountIs(N)` is the newer equivalent. Use maxSteps for simplicity since the existing agent-test uses it.
- `esm.sh` for supabase-js in Edge Functions: The codebase already uses `https://esm.sh/@supabase/supabase-js@2`; this is fine but `npm:@supabase/supabase-js@2` is also valid.

## Open Questions

1. **Token budget per gap analysis**
   - What we know: A single control analysis with objectives + remediation likely uses 2-4K tokens. Full 110-control analysis would be 220-440K tokens.
   - What's unclear: Exact cost per assessment run. Claude Sonnet pricing x token count = per-customer-assessment cost.
   - Recommendation: Scope by family (14 tasks instead of 1), track token usage in audit log. Run a cost projection after the first end-to-end test.

2. **Assessment response mapping to NIST controls**
   - What we know: assessment_responses are linked to assessment_questions which have a control_id field. The controls table has the NIST control data.
   - What's unclear: Whether the existing assessment_questions completely cover all 110 NIST 800-171 controls and their objectives. There may be gaps in question coverage.
   - Recommendation: Add a validation tool that checks coverage of questions against controls. Flag uncovered controls as "unassessed."

3. **Follow-up task triggering after delegation**
   - What we know: CISO delegates to GRC, GRC completes, but CISO needs to know when to synthesize.
   - What's unclear: The current pg_cron worker polls every minute and dispatches pending tasks, but there's no automatic "callback" when a subtask completes.
   - Recommendation: When GRC completes a delegated task, insert a follow-up CISO task ("synthesize-results") into the queue with parent_task_id pointing to the original CISO task. The CISO reads completed subtask outputs.

4. **Claude model selection per agent action**
   - What we know: agent-test uses claude-sonnet-4-20250514. Gap analysis needs strong reasoning. Executive summaries need good writing.
   - What's unclear: Whether Sonnet is sufficient for all tasks or if some should use Opus for better reasoning.
   - Recommendation: Start with Sonnet for all tasks. If gap analysis quality is insufficient, upgrade specific actions to Opus. Track quality in user feedback.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2+ |
| Config file | vitest.config.ts (exists, jsdom environment, @/ alias) |
| Quick run command | `./node_modules/.bin/vitest run --bail 1` |
| Full suite command | `./node_modules/.bin/vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRC-01 | GRC agent handler processes gap-analysis action | unit (mock generateText) | `./node_modules/.bin/vitest run src/lib/__tests__/grc-agent.test.ts --bail 1` | No - Wave 0 |
| GRC-02 | GapAnalysisReport Zod schema validates correctly | unit | `./node_modules/.bin/vitest run src/lib/__tests__/grc-schemas.test.ts --bail 1` | No - Wave 0 |
| GRC-03 | RemediationOption schema includes cost/effort tiers | unit | `./node_modules/.bin/vitest run src/lib/__tests__/grc-schemas.test.ts --bail 1` | No - Wave 0 |
| GRC-04 | compliance_snapshots created after GRC analysis | unit (structural) | `./node_modules/.bin/vitest run src/lib/__tests__/compliance-tracking.test.ts --bail 1` | No - Wave 0 |
| GRC-05 | Audit package output includes SSP sections by family | unit | `./node_modules/.bin/vitest run src/lib/__tests__/grc-agent.test.ts --bail 1` | No - Wave 0 |
| CISO-01 | CISO delegation creates child tasks with correct agent_type | unit | `./node_modules/.bin/vitest run src/lib/__tests__/ciso-agent.test.ts --bail 1` | No - Wave 0 |
| CISO-02 | Executive summary schema validates correctly | unit | `./node_modules/.bin/vitest run src/lib/__tests__/ciso-schemas.test.ts --bail 1` | No - Wave 0 |
| CISO-03 | High-risk findings set risk_level='high' on task | unit | `./node_modules/.bin/vitest run src/lib/__tests__/ciso-agent.test.ts --bail 1` | No - Wave 0 |
| CISO-04 | Risk assessment reads compliance_snapshots for latest score | unit | `./node_modules/.bin/vitest run src/lib/__tests__/ciso-agent.test.ts --bail 1` | No - Wave 0 |
| CISO-05 | Frontend hook queries agent_tasks for CISO queue | unit | `./node_modules/.bin/vitest run src/lib/__tests__/agent-hooks.test.ts --bail 1` | No - Wave 0 |
| CMMC-05 | Gap analysis evaluates at objective level | unit | `./node_modules/.bin/vitest run src/lib/__tests__/grc-agent.test.ts --bail 1` | No - Wave 0 |
| DATA-03 | AIRiskAnalysisService has zero remaining callers | unit (structural) | `./node_modules/.bin/vitest run src/lib/__tests__/data-architecture.test.ts --bail 1` | Yes (existing, needs update) |

### Sampling Rate
- **Per task commit:** `./node_modules/.bin/vitest run --bail 1`
- **Per wave merge:** `./node_modules/.bin/vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/grc-agent.test.ts` -- covers GRC-01, GRC-02, GRC-05, CMMC-05
- [ ] `src/lib/__tests__/grc-schemas.test.ts` -- covers GRC-02, GRC-03 (Zod schema validation)
- [ ] `src/lib/__tests__/ciso-agent.test.ts` -- covers CISO-01, CISO-03, CISO-04
- [ ] `src/lib/__tests__/ciso-schemas.test.ts` -- covers CISO-02 (executive summary schema)
- [ ] `src/lib/__tests__/compliance-tracking.test.ts` -- covers GRC-04 (snapshots)
- [ ] `src/lib/__tests__/agent-hooks.test.ts` -- covers CISO-05 (frontend hook)
- [ ] Update `src/lib/__tests__/data-architecture.test.ts` -- covers DATA-03 (no mock callers)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `supabase/functions/_shared/agent-base.ts`, `agent-types.ts`, `approval-gate.ts` -- all Phase 1 infrastructure
- Existing codebase: `supabase/functions/agent-test/index.ts` -- proven pattern for AI SDK + Deno + executeAgentTask
- Existing codebase: `src/lib/oscal-parser.ts`, `src/lib/sprs-calculator.ts` -- reusable pure functions
- `.planning/research/NOTEBOOKLM-CMMC-REFERENCE.md` -- NIST 800-171A assessment methodology, SSP structure, POA&M rules
- [AI SDK generateText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) -- parameters, return type, tool integration
- [AI SDK Tool foundations](https://ai-sdk.dev/docs/foundations/tools) -- Zod schema tool pattern
- [AI SDK Workflow patterns](https://ai-sdk.dev/docs/agents/workflows) -- orchestrator-worker delegation

### Secondary (MEDIUM confidence)
- [Vercel blog: AI SDK 6](https://vercel.com/blog/ai-sdk-6) -- Agent class, unified generateText+structured output
- [Supabase Edge Functions dependencies](https://supabase.com/docs/guides/functions/dependencies) -- npm: specifier pattern for Deno
- [Multi-agent workflow community discussion](https://community.vercel.com/t/multi-agent-workflow-delegate-agents-via-tool-call/26470) -- delegate agents via tool call pattern

### Tertiary (LOW confidence)
- CMMC gap analysis report format is inferred from multiple compliance consulting sites rather than an official CMMC standard; the actual deliverable format is at the C3PAO's discretion
- Token cost estimates are approximations; actual costs depend on prompt complexity and model pricing at time of execution

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - already proven in Phase 1 agent-test; same libraries
- Architecture: HIGH - extends existing patterns with domain-specific tools
- Pitfalls: HIGH - grounded in NIST 800-171A methodology and Edge Function constraints
- Domain knowledge: HIGH - NotebookLM reference provides authoritative CMMC assessment rules

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (30 days; AI SDK and Supabase Edge Functions are stable)
