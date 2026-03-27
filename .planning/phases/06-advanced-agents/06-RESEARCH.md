# Phase 6: Advanced Agents - Research

**Researched:** 2026-03-27
**Domain:** Incident Response, Application Security, Passive Vulnerability Discovery (CMMC-focused)
**Confidence:** HIGH

## Summary

Phase 6 completes the 7-agent security team by adding three advanced agents: Incident Response (IR), Application Security (AppSec), and Pen Test. These agents build directly on the established infrastructure -- the agent runtime (Phase 1), CISO Orchestrator with delegation tools (Phase 2), SOC alert escalation pipeline (Phase 5 Plan 01), and Threat Intel briefs/IOC data (Phase 5 Plan 02). The architecture patterns are well-proven across 5 previous phases with 391 passing tests.

The IR agent consumes SOC-escalated incidents (`escalation_status='needs_ir_review'` in `soc_alerts`) and produces containment playbooks following the NIST SP 800-61r2/r3 four-phase lifecycle (Preparation, Detection/Analysis, Containment/Eradication/Recovery, Post-Incident). All IR actions require human approval -- this is a hard constraint because IR recommendations may have operational impact on customer systems. The AppSec agent parses uploaded dependency manifests (package.json, requirements.txt, pom.xml, etc.) and configuration files to identify known vulnerabilities and misconfigurations, producing structured findings with fix suggestions. The Pen Test agent performs PASSIVE ONLY vulnerability discovery by matching the company's declared tech stack against known CVE patterns in the NVD feed -- no active exploitation, no network scanning, no port probing.

All three agents follow the identical skeleton established in Phases 2 and 5: Deno Edge Function with AI SDK `generateText`, Zod-validated schemas, domain-specific tools, CISO delegation extension (append to existing prompt), and vitest-compatible Node mirror modules.

**Primary recommendation:** Build all three agents using the proven agent skeleton pattern. The IR agent should use maxSteps: 8 and set ALL tasks to risk_level 'high' to guarantee approval gate routing. The AppSec agent parses manifests as plain text (no external SCA tools) and matches package-version strings against the existing `threat_intelligence` table. The Pen Test agent queries the company's `onboarding_profiles.primary_tech_stack` and cross-references against `threat_intelligence` CVE data -- strictly declarative, no external probing.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IR-01 | IR agent generates containment recommendations based on incident type | NIST SP 800-61r2 four-phase lifecycle encoded in IR system prompt; containment recommendation schema with incident_type enum |
| IR-02 | IR agent provides step-by-step playbook guidance (detect, contain, eradicate, recover) | PlaybookGuidance schema with ordered steps per phase; template patterns from NIST framework |
| IR-03 | IR agent generates post-incident reports | PostIncidentReport schema with timeline, actions_taken, lessons_learned, compliance_impact sections; stored in ir_incidents table and linked to compliance_snapshots |
| IR-04 | IR agent recommendations require human approval before any action | ALL IR tasks use risk_level='high' hardcoded; approval gate routes through existing agent_approvals system |
| ASEC-01 | AppSec agent scans dependency manifests for known vulnerabilities | parseDependencyManifest tool reads uploaded text, extracts package-version pairs; matchDependencyVulnerabilities cross-references against threat_intelligence |
| ASEC-02 | AppSec agent reviews configuration files for security misconfigurations | reviewConfigFile tool with CONFIG_SECURITY_RULES checklist (hardcoded secrets, debug mode, permissive CORS, default credentials, etc.) |
| ASEC-03 | AppSec agent generates vulnerability findings with fix suggestions | AppSecFinding schema with severity, cve_id, affected_package, fix_suggestion, fix_version fields |
| ASEC-04 | AppSec agent produces security review reports | SecurityReviewReport schema aggregating findings, config issues, and remediation priority |
| PENT-01 | Pen Test agent performs passive vulnerability discovery (no active exploitation) | PEN_TEST_SYSTEM_PROMPT with explicit PASSIVE ONLY constraint; tools query existing data only, never make external requests |
| PENT-02 | Pen Test agent scans for known CVE patterns in customer's declared tech stack | matchTechStackCVEs tool queries onboarding_profiles.primary_tech_stack and cross-references threat_intelligence table |
| PENT-03 | Pen Test agent generates vulnerability reports with risk ratings | VulnerabilityReport schema with risk_rating (critical/high/medium/low), exploitability_assessment, and business_impact |
| PENT-04 | Pen Test agent requires explicit authorization and scoped permissions before any scan | Authorization gate: checkScanAuthorization tool verifies agent_permissions for pen-test agent type AND creates approval request before ANY scan |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | 6.x | LLM orchestration via `generateText` with multi-step tool calling | Already used by all 4 existing agents; provides Claude integration via @ai-sdk/anthropic@3 |
| @ai-sdk/anthropic | 3.x | Claude model provider for AI SDK | Standard across all agents since Phase 1 |
| zod | 3.x | Runtime schema validation for structured agent output | Used for all agent schemas (GRC, CISO, SOC, Threat Intel) |
| @supabase/supabase-js | 2.x | Database access, RLS, pgmq queue | Foundation infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 3.x | Test framework | All test files |
| jsdom | (vitest env) | DOM simulation for component tests | Not needed for Phase 6 agent tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual manifest parsing | OWASP Dependency-Check | External tool adds deployment complexity; manifest parsing is simple text extraction for our use case |
| NVD API direct queries | Existing threat_intelligence table | We already have CVE data from fetch-cve-feed Edge Function; querying local table is faster and simpler |
| Active port scanning | Passive CVE matching | Active scanning is explicitly OUT OF SCOPE (legal liability) |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
# Phase 6 uses the identical stack as Phases 1-5
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
  agent-incident-response/index.ts    # IR Edge Function
  agent-appsec/index.ts               # AppSec Edge Function
  agent-pen-test/index.ts             # Pen Test Edge Function
  _shared/
    ir-schemas.ts                      # IR Zod schemas (Deno)
    ir-tools.ts                        # IR system prompt + 5-6 tools (Deno)
    appsec-schemas.ts                  # AppSec Zod schemas (Deno)
    appsec-tools.ts                    # AppSec system prompt + 5-6 tools (Deno)
    pen-test-schemas.ts                # Pen Test Zod schemas (Deno)
    pen-test-tools.ts                  # Pen Test system prompt + 4-5 tools (Deno)
    ciso-tools.ts                      # EXTENDED with delegateToIR, delegateToAppSec, delegateToPenTest

src/lib/
  ir-schemas-frontend.ts              # Vitest-compatible Zod re-exports
  ir-tools-testable.ts                # Vitest-compatible tool logic re-exports
  appsec-schemas-frontend.ts
  appsec-tools-testable.ts
  pen-test-schemas-frontend.ts
  pen-test-tools-testable.ts
  ciso-tools.ts                        # UPDATED Node mirror with 3 new delegation tools

src/types/
  ir-output.ts                         # Frontend TypeScript types for IR output
  appsec-output.ts                     # Frontend TypeScript types for AppSec output
  pen-test-output.ts                   # Frontend TypeScript types for Pen Test output

src/lib/__tests__/
  ir-schemas.test.ts
  ir-agent.test.ts
  ir-migration.test.ts
  appsec-schemas.test.ts
  appsec-agent.test.ts
  appsec-migration.test.ts
  pen-test-schemas.test.ts
  pen-test-agent.test.ts
  pen-test-migration.test.ts
  ciso-agent.test.ts                   # UPDATED with 3 new delegation validations

supabase/migrations/
  20260327400000_ir_agent_tables.sql
  20260327400001_appsec_agent_tables.sql
  20260327400002_pen_test_agent_tables.sql
```

### Pattern 1: Agent Skeleton (Proven in Phases 2, 5)
**What:** Every agent Edge Function follows the identical structure.
**When to use:** All three new agents.
**Example:**
```typescript
// Source: supabase/functions/agent-soc-analyst/index.ts (established pattern)
Deno.serve(async (req: Request) => {
  // CORS preflight
  // Create service role client
  // Parse body -> task_id, company_id
  // Fetch full task row from agent_tasks
  // Normalize enums (underscores to hyphens)
  // executeAgentTask(supabase, task, async (t) => {
  //   const tools = createXxxTools(supabase, t);
  //   const { text, steps } = await generateText({
  //     model: anthropic("claude-sonnet-4-20250514"),
  //     system: XXX_SYSTEM_PROMPT,
  //     prompt: buildXxxPrompt(t.action, t.input ?? {}),
  //     tools,
  //     maxSteps: 8,
  //   });
  //   // Parse structured output
  //   // Return { output, reasoning }
  // });
});
```

### Pattern 2: CISO Delegation Extension (Proven in Phases 2, 5)
**What:** Add new delegateToXxx tool to CISO tools, update CISO_TOOL_NAMES, append delegation rules to CISO_SYSTEM_PROMPT.
**When to use:** All three new agents need CISO delegation.
**Critical rule:** APPEND to existing prompt. NEVER rewrite existing GRC, SOC, or Threat Intel delegation rules.
**Example:**
```typescript
// In ciso-tools.ts (Deno), AFTER existing tools:
delegateToIR: tool({
  description: "Delegate incident handling to the IR agent...",
  parameters: z.object({
    action: z.string(), // 'analyze-incident', 'generate-playbook', 'create-post-incident-report'
    scope: z.object({
      incident_id: z.string().uuid().optional(),
      soc_alert_ids: z.array(z.string().uuid()).optional(),
      incident_type: z.string().optional(),
    }),
    priority: z.enum(["critical", "high", "medium", "low"]),
  }),
  execute: async ({ action, scope, priority }) => {
    // delegateTask(supabase, task, "incident-response", action, { ...scope, company_id, priority })
  },
}),
```

### Pattern 3: IR Agent -- All Actions High Risk
**What:** IR agent hardcodes risk_level='high' on ALL delegated tasks because IR actions have operational impact.
**When to use:** Every IR task created via CISO delegation.
**Why:** The existing approval gate checks `task.risk_level === 'high'` in `checkApprovalRequired()`. By setting all IR tasks to high, every IR recommendation goes through human approval.
**Implementation:** In the delegateToIR tool execute function, override `risk_level: 'high'` regardless of the action type.

### Pattern 4: AppSec Manifest Parsing (Text-Based)
**What:** Parse dependency manifest content as plain text to extract package-name + version pairs, then cross-reference against the `threat_intelligence` table.
**When to use:** AppSec agent processing uploaded manifests.
**Why:** Keeps the agent self-contained. No external SCA tools needed. The NVD data is already in the database from `fetch-cve-feed`.
**Example:**
```typescript
// parseDependencyManifest tool
// Input: manifest_content (string), manifest_type ('package.json' | 'requirements.txt' | 'pom.xml')
// For package.json: JSON.parse -> extract dependencies + devDependencies
// For requirements.txt: split by newline, parse 'package==version' or 'package>=version'
// Output: Array<{ name: string, version: string, type: 'runtime' | 'dev' }>
```

### Pattern 5: Pen Test Authorization Gate
**What:** Before ANY Pen Test scan, verify the company has authorized pen testing AND create an approval request.
**When to use:** Every Pen Test agent action.
**Implementation:** The Pen Test agent's tools FIRST check `agent_permissions` for the pen-test agent type for that company. Then the CISO delegation sets risk_level='high' to trigger the approval gate. Double-gate: permission check + approval request.

### Anti-Patterns to Avoid
- **Active scanning/probing in Pen Test agent:** The Pen Test agent must NEVER make HTTP requests to external systems, scan ports, or probe services. All analysis is against declared data in the database.
- **Rewriting CISO system prompt:** The CISO delegation extension must APPEND new sections. Previous phases (GRC, SOC, Threat Intel) have established delegation rules that must be preserved.
- **IR agent auto-approving actions:** Even "low risk" IR recommendations (e.g., generating a report) should go through approval to maintain the trust model. Override risk_level to 'high' for all IR tasks.
- **External API calls from agents:** Agents query only the Supabase database. The CVE data, tech stack, and assessment data are already local. No external NVD API calls during agent execution.
- **Overly complex manifest parsing:** Do not attempt to resolve transitive dependencies or build dependency trees. Parse the top-level manifest only. Transitive dependency analysis is a v2 feature.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CVE matching | Custom NVD API client | Query existing `threat_intelligence` table | Data already ingested by `fetch-cve-feed` Edge Function; local queries are fast and reliable |
| Approval routing | Custom IR approval logic | Existing `approval-gate.ts` with `risk_level='high'` | Approval gate is fully built and tested (Phase 1 Plan 03); just set risk_level correctly |
| Task delegation | Custom inter-agent messaging | Existing `delegateTask()` from `agent-base.ts` | Hub-and-spoke enforcement, pgmq queuing, delegation depth -- all handled |
| Audit logging | Custom IR audit trail | Existing `logAuditEvent` RPC via `agent-base.ts` | Every `executeAgentTask` call automatically logs to audit_log with agent reasoning |
| Agent routing | Custom dispatcher for new agents | Existing `agent-worker` with `AGENT_FUNCTION_MAP` | IR, AppSec, and Pen Test are already pre-registered in the worker map |
| Schema validation | Custom JSON validation | Zod schemas with `.parse()` | Consistent with all existing agents; type-safe, runtime-validated |
| CWE-to-CMMC mapping | New mapping table | Existing `CWE_TO_CMMC_FAMILY` from Threat Intel (Phase 5) | 20-entry heuristic mapping already available for reuse |

**Key insight:** Phase 6 adds zero new infrastructure. Every cross-cutting concern (approval gates, audit trail, delegation, queuing, routing, RLS, multi-tenancy) is already built. The only new code is agent-specific domain logic: system prompts, tools, schemas, and database tables.

## Common Pitfalls

### Pitfall 1: IR Agent Executing Without Approval
**What goes wrong:** IR agent generates containment recommendations that auto-complete because risk_level defaults to 'low' in `delegateTask()`.
**Why it happens:** The `delegateTask()` function in `agent-base.ts` sets `risk_level: 'low'` by default. If the CISO delegation tool does not override this, IR actions bypass the approval gate.
**How to avoid:** In `delegateToIR`, explicitly set `risk_level: 'high'` in the `delegateTask()` call. Also in the IR Edge Function handler, verify the task has `risk_level='high'` and reject otherwise.
**Warning signs:** IR tasks completing without `awaiting_approval` status in agent_tasks.

### Pitfall 2: Pen Test Agent Making External Requests
**What goes wrong:** The LLM generates tool calls that attempt to reach external systems (HTTP requests, DNS lookups, port scans).
**Why it happens:** The system prompt instructs "passive vulnerability discovery" but the LLM may interpret this as "scan passively" rather than "analyze existing data."
**How to avoid:** PEN_TEST_SYSTEM_PROMPT must explicitly state: "You have NO access to external networks. You can ONLY query internal database tables." Pen Test tools should ONLY accept database queries as parameters -- no URL, IP, or hostname parameters.
**Warning signs:** Tool definitions that accept URLs, IP addresses, or hostnames as parameters.

### Pitfall 3: CISO Prompt Growing Too Large
**What goes wrong:** After adding 3 more delegation sections, the CISO_SYSTEM_PROMPT exceeds optimal prompt length, causing LLM confusion or context limits.
**Why it happens:** Phase 2 added GRC rules, Phase 5 added SOC + Threat Intel rules, Phase 6 adds IR + AppSec + Pen Test rules. Six specialist delegation sections.
**How to avoid:** Keep new delegation rules concise (5-8 lines each). Use bullet points, not paragraphs. Reference tool names, don't repeat tool descriptions. Target < 2000 tokens total for CISO_SYSTEM_PROMPT.
**Warning signs:** CISO agent taking too many steps to decide which agent to delegate to, or delegating to wrong agents.

### Pitfall 4: Manifest Parsing Fragility
**What goes wrong:** AppSec manifest parser fails on non-standard formats (lockfiles, workspaces, version ranges like `^1.2.3` or `>=2.0`).
**Why it happens:** Real-world manifests have many formats and edge cases.
**How to avoid:** Support only the 3 most common formats (package.json, requirements.txt, pom.xml). For package.json, use JSON.parse (it IS JSON). For requirements.txt, handle `==`, `>=`, `<=`, `~=` operators. Strip version range operators and match on the base version. For pom.xml, extract `<dependency>` blocks via regex (not a full XML parser).
**Warning signs:** Parser returning empty arrays on valid manifests.

### Pitfall 5: Edge Function Timeout with 3 Agents Processing Simultaneously
**What goes wrong:** Agent-worker processes 5 queue messages, dispatching to 3 different agents, and some time out.
**Why it happens:** The worker reads up to 5 messages with 120s visibility timeout. If multiple long-running agents process simultaneously, the 150s Edge Function timeout is hit.
**How to avoid:** Keep maxSteps: 8 for all three agents (consistent with SOC and Threat Intel). IR may need fewer steps (5-6) since its analysis is more structured. AppSec manifest parsing should be fast (mostly string operations, not LLM reasoning).
**Warning signs:** Agent tasks stuck in 'running' status for > 2 minutes.

### Pitfall 6: Post-Incident Report Not Feeding Compliance Dashboard
**What goes wrong:** IR generates post-incident reports but they are isolated -- not visible on the compliance dashboard.
**Why it happens:** The compliance dashboard reads from `compliance_snapshots` and `gap_analysis_results`. IR reports stored in a separate table are invisible.
**How to avoid:** When IR generates a post-incident report, ALSO create/update a `compliance_snapshot` row recording the incident's impact on CMMC compliance posture (particularly controls 3.6.1, 3.6.2, 3.6.3). Store the IR report ID in the snapshot's `agent_task_id` reference.
**Warning signs:** Incidents occurring but compliance dashboard showing no change in IR-related controls.

### Pitfall 7: Node Mirror Drift
**What goes wrong:** Deno `_shared/xxx-tools.ts` and Node `src/lib/xxx-tools-testable.ts` diverge, causing tests to pass but production to behave differently.
**Why it happens:** Developer updates one file but forgets the mirror.
**How to avoid:** Tests should validate structural parity: compare tool names, prompt keywords, and schema field names between Deno and Node modules. This pattern is established in existing CISO agent tests.
**Warning signs:** Tests passing but Edge Function returning unexpected output shapes.

## Code Examples

### IR Incident Type Enum and Containment Schema
```typescript
// Source: NIST SP 800-61r2 incident categories
export const IncidentTypeSchema = z.enum([
  'malware',
  'unauthorized_access',
  'denial_of_service',
  'data_breach',
  'insider_threat',
  'supply_chain',
  'misconfiguration',
  'policy_violation',
  'unknown',
]);

export const ContainmentRecommendationSchema = z.object({
  incident_type: IncidentTypeSchema,
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  containment_strategy: z.enum(['short_term', 'long_term', 'both']),
  steps: z.array(z.object({
    phase: z.enum(['detect', 'contain', 'eradicate', 'recover']),
    order: z.number().int().min(1),
    action: z.string().min(1),
    rationale: z.string().min(1),
    requires_approval: z.literal(true), // Always true for IR
    estimated_time: z.string().optional(),
    affected_systems: z.array(z.string()).optional(),
  })),
  cmmc_controls_affected: z.array(z.string()), // e.g., ['3.6.1', '3.6.2']
  compliance_impact: z.string(),
});
```

### AppSec Manifest Parser Pattern
```typescript
// Source: Established patterns for dependency manifest parsing
export function parseDependencyManifest(
  content: string,
  type: 'package.json' | 'requirements.txt' | 'pom.xml'
): Array<{ name: string; version: string; dep_type: string }> {
  switch (type) {
    case 'package.json': {
      const pkg = JSON.parse(content);
      const deps: Array<{ name: string; version: string; dep_type: string }> = [];
      for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
        deps.push({ name, version: stripVersionRange(version as string), dep_type: 'runtime' });
      }
      for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
        deps.push({ name, version: stripVersionRange(version as string), dep_type: 'dev' });
      }
      return deps;
    }
    case 'requirements.txt': {
      return content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
          const match = line.match(/^([a-zA-Z0-9_-]+)\s*([><=!~]+)\s*(.+)/);
          return match
            ? { name: match[1], version: match[3].trim(), dep_type: 'runtime' }
            : { name: line, version: 'unknown', dep_type: 'runtime' };
        });
    }
    // pom.xml: regex extraction of <groupId>, <artifactId>, <version>
  }
}

function stripVersionRange(v: string): string {
  return v.replace(/^[\^~>=<]+/, '');
}
```

### Pen Test Authorization Check Pattern
```typescript
// Source: Existing agent_permissions table (Phase 4 Plan 02)
export const checkScanAuthorization = tool({
  description: "Verify the company has authorized passive vulnerability scanning. " +
    "MUST be called before any scan operation.",
  parameters: z.object({}),
  execute: async () => {
    // Check agent_permissions for pen-test agent type
    const { data: permission } = await supabase
      .from('agent_permissions')
      .select('is_enabled, can_auto_execute')
      .eq('company_id', companyId)
      .eq('agent_type', 'pen_test')
      .maybeSingle();

    if (!permission?.is_enabled) {
      return {
        authorized: false,
        reason: 'Pen Test agent is not enabled for this company. Enable it in agent settings.',
      };
    }

    return {
      authorized: true,
      scope: 'passive_only',
      restrictions: [
        'No active exploitation',
        'No network scanning',
        'No port probing',
        'Analysis limited to declared tech stack and known CVE patterns',
      ],
    };
  },
});
```

### IR Post-Incident Report Schema
```typescript
// Source: NIST SP 800-61r2 post-incident activity guidance
export const PostIncidentReportSchema = z.object({
  incident_id: z.string().uuid(),
  incident_type: IncidentTypeSchema,
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  timeline: z.array(z.object({
    timestamp: z.string(),
    event: z.string(),
    actor: z.enum(['system', 'agent', 'human']),
  })),
  detection_method: z.string(),
  containment_actions: z.array(z.string()),
  eradication_actions: z.array(z.string()),
  recovery_actions: z.array(z.string()),
  root_cause_analysis: z.string(),
  lessons_learned: z.array(z.string()),
  compliance_impact: z.object({
    affected_controls: z.array(z.string()),
    sprs_impact: z.number().int(),
    requires_poam_update: z.boolean(),
  }),
  recommendations: z.array(z.object({
    action: z.string(),
    priority: z.enum(['immediate', 'short_term', 'long_term']),
    cmmc_control: z.string().optional(),
  })),
});
```

### CISO Delegation Extension -- Append Pattern
```typescript
// Added to CISO_SYSTEM_PROMPT (APPENDED, not rewritten)
// Keep concise: 5-8 lines per agent section

`
## Incident Response Delegation
- Use delegateToIR for incident handling after SOC escalation (escalation_status='needs_ir_review')
- IR actions: 'analyze-incident', 'generate-playbook', 'create-post-incident-report'
- ALL IR tasks are high-risk -- always set priority to 'critical' or 'high'
- IR recommendations require human approval before any containment action

## AppSec Engineer Delegation
- Use delegateToAppSec for dependency scanning and configuration review
- AppSec actions: 'scan-dependencies', 'review-config', 'generate-security-report'
- Delegate when new dependency manifests are uploaded or on scheduled security reviews
- AppSec findings feed into GRC gap analysis for CMMC control mapping

## Pen Test Delegation
- Use delegateToPenTest for passive vulnerability discovery only
- Pen Test actions: 'passive-scan', 'tech-stack-cve-match', 'generate-vulnerability-report'
- REQUIRES explicit company authorization -- Pen Test agent checks permissions first
- Pen Test findings are PASSIVE ONLY -- no active exploitation or network scanning
`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NIST SP 800-61r2 static lifecycle | SP 800-61r3 CSF 2.0 aligned | April 2025 | IR playbooks now map to CSF functions (Govern, Identify, Protect, Detect, Respond, Recover) but our CMMC focus uses 800-171r2 controls (3.6.x) which reference the r2 lifecycle |
| External SCA tools (Snyk, npm audit) | Local NVD matching against declared manifests | Current | For our use case (AI-driven analysis, not CI/CD pipeline), local matching is simpler and avoids external dependencies |
| Active penetration testing | Passive CVE pattern matching | Required by scope | Legal liability constraint; "pen test" is a misnomer -- agent performs passive vulnerability discovery only |

**Deprecated/outdated:**
- NIST SP 800-61r2: Officially withdrawn April 2025, replaced by r3. However, CMMC Level 2 still references NIST 800-171r2 controls 3.6.1-3.6.3 which align with the r2 lifecycle phases. Our IR agent should use r2 terminology (detect/contain/eradicate/recover) since that is what CMMC assessors expect.

## Open Questions

1. **Manifest Upload Mechanism**
   - What we know: AppSec agent needs to read dependency manifest content. The `control_evidence` table exists for document uploads.
   - What's unclear: How manifests get to the agent -- uploaded as evidence documents? Pasted as text? A new upload UI?
   - Recommendation: Reuse existing document upload flow. AppSec agent queries document content from the documents/evidence tables. New upload UI is out of scope for Phase 6 (can use existing evidence upload).

2. **IR Incident Lifecycle State Machine**
   - What we know: SOC alerts have `escalation_status='needs_ir_review'`. IR needs to track incident lifecycle (open/investigating/contained/eradicated/recovered/closed).
   - What's unclear: Whether to add status to soc_alerts or create a separate ir_incidents table.
   - Recommendation: Create separate `ir_incidents` table referencing `soc_alert_id`. Incidents have their own lifecycle distinct from SOC alerts. SOC alert escalation_status updates to 'resolved' when IR closes the incident.

3. **Pen Test Agent Frequency**
   - What we know: Pen Test scans should be authorized per company.
   - What's unclear: How often to run passive scans, and whether they are triggered by CISO or by schedule.
   - Recommendation: CISO-triggered only for v1. Scheduled scanning is a v2 feature. The CISO delegates to Pen Test when Threat Intel identifies new relevant CVEs or after onboarding.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x |
| Config file | vitest.config.ts (existing) |
| Quick run command | `npx vitest run --bail 1` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IR-01 | IR containment recommendations with incident type | unit | `npx vitest run src/lib/__tests__/ir-schemas.test.ts --bail 1` | Wave 0 |
| IR-02 | Playbook guidance with 4 phases | unit | `npx vitest run src/lib/__tests__/ir-agent.test.ts --bail 1` | Wave 0 |
| IR-03 | Post-incident report generation | unit | `npx vitest run src/lib/__tests__/ir-schemas.test.ts --bail 1` | Wave 0 |
| IR-04 | Human approval required for all IR actions | unit | `npx vitest run src/lib/__tests__/ir-agent.test.ts --bail 1` | Wave 0 |
| ASEC-01 | Dependency manifest scanning | unit | `npx vitest run src/lib/__tests__/appsec-schemas.test.ts --bail 1` | Wave 0 |
| ASEC-02 | Config file security review | unit | `npx vitest run src/lib/__tests__/appsec-agent.test.ts --bail 1` | Wave 0 |
| ASEC-03 | Vulnerability findings with fix suggestions | unit | `npx vitest run src/lib/__tests__/appsec-schemas.test.ts --bail 1` | Wave 0 |
| ASEC-04 | Security review report production | unit | `npx vitest run src/lib/__tests__/appsec-agent.test.ts --bail 1` | Wave 0 |
| PENT-01 | Passive-only vulnerability discovery | unit | `npx vitest run src/lib/__tests__/pen-test-agent.test.ts --bail 1` | Wave 0 |
| PENT-02 | Known CVE pattern matching against tech stack | unit | `npx vitest run src/lib/__tests__/pen-test-agent.test.ts --bail 1` | Wave 0 |
| PENT-03 | Vulnerability reports with risk ratings | unit | `npx vitest run src/lib/__tests__/pen-test-schemas.test.ts --bail 1` | Wave 0 |
| PENT-04 | Explicit authorization and scoped permissions | unit | `npx vitest run src/lib/__tests__/pen-test-agent.test.ts --bail 1` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --bail 1`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/ir-schemas.test.ts` -- covers IR-01, IR-03
- [ ] `src/lib/__tests__/ir-agent.test.ts` -- covers IR-02, IR-04
- [ ] `src/lib/__tests__/ir-migration.test.ts` -- covers IR table structure
- [ ] `src/lib/__tests__/appsec-schemas.test.ts` -- covers ASEC-01, ASEC-03
- [ ] `src/lib/__tests__/appsec-agent.test.ts` -- covers ASEC-02, ASEC-04
- [ ] `src/lib/__tests__/appsec-migration.test.ts` -- covers AppSec table structure
- [ ] `src/lib/__tests__/pen-test-schemas.test.ts` -- covers PENT-03
- [ ] `src/lib/__tests__/pen-test-agent.test.ts` -- covers PENT-01, PENT-02, PENT-04
- [ ] `src/lib/__tests__/pen-test-migration.test.ts` -- covers Pen Test table structure
- [ ] `src/lib/__tests__/ciso-agent.test.ts` -- UPDATED to validate 3 new delegation tools (9 tools total)

## Database Schema Design

### ir_incidents Table
```sql
CREATE TABLE ir_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  soc_alert_id UUID REFERENCES soc_alerts(id),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'malware', 'unauthorized_access', 'denial_of_service', 'data_breach',
    'insider_threat', 'supply_chain', 'misconfiguration', 'policy_violation', 'unknown'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed'
  )),
  containment_plan JSONB,     -- ContainmentRecommendation output
  playbook JSONB,             -- PlaybookGuidance output
  post_incident_report JSONB, -- PostIncidentReport output
  compliance_impact JSONB,    -- affected controls, SPRS impact
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes: (company_id, status), (company_id, created_at DESC), (soc_alert_id)
-- RLS: Users can view own company incidents; service role can insert/update
```

### appsec_findings Table
```sql
CREATE TABLE appsec_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  finding_type TEXT NOT NULL CHECK (finding_type IN (
    'dependency_vulnerability', 'config_misconfiguration', 'hardcoded_secret', 'deprecated_package'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  affected_component TEXT NOT NULL,  -- package name or config file path
  current_version TEXT,              -- for dependency findings
  fix_version TEXT,                  -- recommended upgrade version
  fix_suggestion TEXT,               -- human-readable fix guidance
  cve_id TEXT,                       -- linked CVE if applicable
  cmmc_controls TEXT[] DEFAULT '{}', -- affected CMMC controls
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'accepted_risk', 'false_positive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes: (company_id, status), (company_id, severity), (cve_id)
-- RLS: Users can view own company findings; service role can insert/update
```

### pen_test_findings Table
```sql
CREATE TABLE pen_test_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  scan_authorization_id UUID,        -- reference to approval that authorized the scan
  finding_type TEXT NOT NULL CHECK (finding_type IN (
    'known_cve', 'version_mismatch', 'eol_software', 'missing_patch'
  )),
  risk_rating TEXT NOT NULL CHECK (risk_rating IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  affected_technology TEXT NOT NULL,  -- from declared tech stack
  matched_cve_ids TEXT[] DEFAULT '{}',
  exploitability_score DECIMAL(3,1), -- CVSS exploitability sub-score
  business_impact TEXT,
  remediation TEXT,
  cmmc_controls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'remediated', 'accepted_risk', 'false_positive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes: (company_id, status), (company_id, risk_rating), (affected_technology)
-- RLS: Users can view own company findings; service role can insert/update
```

## IR Agent Tool Design

| Tool | Purpose | DB Tables Accessed |
|------|---------|-------------------|
| `getEscalatedIncidents` | Query SOC alerts with `escalation_status='needs_ir_review'` | soc_alerts |
| `getIncidentContext` | Fetch threat briefs, IOCs, and correlations for an incident | threat_briefs, ioc_tracking, soc_alert_correlations |
| `createIrIncident` | Create incident record with type, severity, initial assessment | ir_incidents |
| `saveContainmentPlan` | Persist containment recommendations (JSONB) to incident | ir_incidents (update) |
| `savePostIncidentReport` | Persist post-incident report and update compliance snapshot | ir_incidents (update), compliance_snapshots (insert) |

## AppSec Agent Tool Design

| Tool | Purpose | DB Tables Accessed |
|------|---------|-------------------|
| `parseDependencyManifest` | Extract package-version pairs from manifest text | None (pure function) |
| `matchDependencyVulnerabilities` | Cross-reference packages against known CVEs | threat_intelligence |
| `reviewConfigFile` | Check config content against security rules | None (pure function with rules) |
| `createAppSecFinding` | Persist vulnerability finding with fix suggestion | appsec_findings |
| `getCompanyTechStack` | Get company's declared tech stack | onboarding_profiles |

## Pen Test Agent Tool Design

| Tool | Purpose | DB Tables Accessed |
|------|---------|-------------------|
| `checkScanAuthorization` | Verify company has authorized pen test agent | agent_permissions |
| `getCompanyTechStack` | Get declared technology stack | onboarding_profiles |
| `matchTechStackCVEs` | Match tech stack components against known CVEs | threat_intelligence |
| `createPenTestFinding` | Persist vulnerability finding with risk rating | pen_test_findings |

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All existing agent implementations (GRC, CISO, SOC, Threat Intel) read directly from source
- `supabase/functions/_shared/agent-base.ts` -- executeAgentTask, delegateTask, approval gate integration
- `supabase/functions/_shared/ciso-tools.ts` -- CISO delegation pattern with 3 existing tools
- `supabase/functions/_shared/approval-gate.ts` -- checkApprovalRequired, createApprovalRequest
- `supabase/functions/agent-worker/index.ts` -- AGENT_FUNCTION_MAP already includes incident-response, appsec, pen-test
- `src/types/agent.ts` -- AgentType enum already includes all 7 agent types

### Secondary (MEDIUM confidence)
- [NIST SP 800-61r2](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r2.pdf) -- Incident Response lifecycle phases (withdrawn April 2025, but CMMC still references 800-171r2 which aligns with r2)
- [NIST SP 800-171 3.6.x requirements](https://www.lakeridge.io/nist-sp-800-171-and-cmmc/domains/incident-response) -- CMMC IR control requirements
- [OWASP Dependency-Check methodology](https://owasp.org/www-project-dependency-check/) -- CPE/CVE matching approach for dependency scanning
- [CISA Incident Response Playbooks](https://www.cisa.gov/sites/default/files/2024-08/Federal_Government_Cybersecurity_Incident_and_Vulnerability_Response_Playbooks_508C.pdf) -- Federal playbook structure

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- identical stack to Phases 1-5, no new libraries
- Architecture: HIGH -- proven patterns from 4 existing agents (391 tests passing)
- Pitfalls: HIGH -- derived from actual codebase analysis (approval gate defaults, prompt growth patterns)
- IR domain: MEDIUM -- NIST framework is well-documented but LLM-generated playbooks need validation
- AppSec manifest parsing: MEDIUM -- straightforward for top-level deps, edge cases exist
- Pen Test passive scope: HIGH -- constraints are clear, implementation is conservative

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- all infrastructure is locked, only domain logic changes)
