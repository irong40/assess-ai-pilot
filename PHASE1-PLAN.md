# Phase 1: Agent Foundation (Infrastructure)

## Goal
Build the agent runtime, state management, orchestration layer, and dashboard so all subsequent agents have a consistent framework to operate in.

## Prerequisites
- Existing Supabase project with current schema
- Claude API key (for agent reasoning)
- OpenAI API key (existing, for embeddings)

---

## Task Breakdown

### 1.1 Database Schema — Agent Infrastructure
**New tables:**

```sql
-- Agent registry: defines each agent and its capabilities
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,           -- 'soc_analyst', 'threat_intel', etc.
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,                   -- description of agent's role
  status TEXT NOT NULL DEFAULT 'idle',  -- idle, running, paused, error, disabled
  autonomy_level TEXT NOT NULL DEFAULT 'low',  -- low, medium, high
  scope JSONB NOT NULL DEFAULT '{}',   -- permissions: what tables/actions allowed
  config JSONB NOT NULL DEFAULT '{}',  -- agent-specific settings
  last_heartbeat TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent tasks: work items assigned to agents
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  assigned_by UUID REFERENCES agents(id),  -- NULL = human, else orchestrator
  task_type TEXT NOT NULL,              -- 'triage_alert', 'assess_control', etc.
  priority INTEGER NOT NULL DEFAULT 5, -- 1=critical, 10=low
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, needs_approval
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  reasoning TEXT,                       -- agent's explanation of its work
  error TEXT,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent messages: inter-agent communication
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID REFERENCES agents(id),
  to_agent_id UUID REFERENCES agents(id),  -- NULL = broadcast
  message_type TEXT NOT NULL,           -- 'finding', 'escalation', 'request', 'response'
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval gates: human-in-the-loop decisions
CREATE TABLE approval_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES agent_tasks(id),
  agent_id UUID REFERENCES agents(id),
  action_description TEXT NOT NULL,
  risk_level TEXT NOT NULL,             -- low, medium, high, critical
  context JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent run log: execution history
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  trigger TEXT NOT NULL,                -- 'scheduled', 'event', 'manual', 'orchestrator'
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, cancelled
  tasks_processed INTEGER DEFAULT 0,
  findings_created INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**RLS policies:** Agents read via service role; users see agent data via their role level.

### 1.2 Agent Execution Engine
**File:** `supabase/functions/agent-runner/index.ts`

Core edge function that:
1. Receives agent execution requests (scheduled or triggered)
2. Loads agent config from `agents` table
3. Fetches pending tasks from `agent_tasks`
4. Calls Claude API with agent-specific system prompt + task context
5. Processes response, creates findings/messages/approvals as needed
6. Logs run to `agent_runs`
7. Updates agent heartbeat

```typescript
// Pseudocode
async function runAgent(agentName: string) {
  const agent = await getAgent(agentName);
  const tasks = await getPendingTasks(agent.id);

  for (const task of tasks) {
    const result = await callClaude({
      system: buildAgentPrompt(agent),
      messages: [{ role: 'user', content: JSON.stringify(task.input) }],
      tools: getAgentTools(agent.scope),
    });

    await processResult(agent, task, result);

    if (result.requiresApproval) {
      await createApprovalGate(agent, task, result);
    }
  }
}
```

### 1.3 CISO Orchestrator Agent
**File:** `supabase/functions/ciso-orchestrator/index.ts`

The first agent — coordinates all others:
1. Runs on schedule (every 15 min) or on-demand
2. Reviews unprocessed agent messages
3. Checks for stale/failed agent tasks
4. Prioritizes pending work across all agents
5. Assigns tasks to appropriate agents
6. Generates daily executive summary

**System prompt includes:**
- Organization's risk tolerance settings
- Agent capability matrix
- Escalation rules
- Priority framework (CVSS-based + business impact)

### 1.4 Approval Gates UI
**File:** `src/pages/ApprovalQueue.tsx`

New page for human operators:
- List pending approvals with context
- One-click approve/reject with reason
- Filter by agent, risk level, urgency
- Real-time updates via Supabase Realtime
- Expiration warnings

### 1.5 Agent Dashboard
**File:** `src/pages/AgentDashboard.tsx`

Central command view:
- Agent status cards (running/idle/error)
- Task queue visualization
- Recent agent activity feed
- Agent-to-agent message log
- Run history with token usage
- Manual agent trigger controls
- Per-agent enable/disable toggles

### 1.6 Agent Configuration UI
**File:** `src/components/agents/AgentConfig.tsx`

Per-agent settings:
- Autonomy level slider (low/medium/high)
- Schedule configuration (cron expression)
- Scope permissions editor
- Approval threshold settings
- Enable/disable toggle

### 1.7 Seed Agent Registry
Insert the 7 agent definitions into `agents` table:

| name | autonomy | scope |
|---|---|---|
| ciso_orchestrator | high | all agents, task assignment, priority |
| soc_analyst | medium | alerts, findings (read), threat_intel |
| threat_intel | high | threat_intelligence, external APIs (read-only) |
| grc_analyst | medium | assessments, findings, documents, poam |
| incident_responder | low | findings, playbooks, notifications |
| appsec_engineer | medium | findings, external repos (read-only) |
| pen_tester | low | approved targets only, findings |

### 1.8 Realtime Agent Communication
Set up Supabase Realtime channels:
- `agent:status` — agent heartbeats and status changes
- `agent:tasks` — new task assignments
- `agent:messages` — inter-agent messages
- `agent:approvals` — new approval requests → UI notifications

### 1.9 Navigation & Routes
Add to existing router:
- `/agents` — Agent Dashboard
- `/agents/:id` — Individual agent detail + config
- `/approvals` — Approval Queue
- Sidebar navigation updates

---

## Acceptance Criteria
- [ ] All 5 new tables created with RLS policies
- [ ] Agent runner edge function executes tasks via Claude API
- [ ] CISO Orchestrator runs on schedule and assigns tasks
- [ ] Approval gates block high-risk actions until human approval
- [ ] Agent Dashboard shows real-time status of all 7 agents
- [ ] Inter-agent messaging works via Supabase Realtime
- [ ] Agent config UI allows autonomy/schedule/scope changes
- [ ] All agent actions logged in audit_log with reasoning
- [ ] Existing functionality (wizard, RAG, POA&M) unaffected

## Estimated Complexity
- **Database:** 1 migration file, ~150 lines SQL
- **Edge Functions:** 2 new (agent-runner, ciso-orchestrator), ~400 lines each
- **Frontend:** 3 new pages + 4 new components, ~1200 lines
- **Integration:** Route updates, sidebar nav, notification hooks
