# ASSESS-AI: Agentic Security Operations Platform

## Vision
Transform the existing compliance assessment tool into a **full agentic AI security team** — autonomous agents that continuously monitor, assess, detect, respond, and report on an organization's security posture. Human operators supervise and approve; agents do the heavy lifting.

## Current State (v0 — Assessment Tool)
- 96 NIST 800-53 questions across 8 security domains
- Self-assessment wizard with finding auto-generation
- RAG chatbot for compliance Q&A (OpenAI embeddings + GPT-4o-mini)
- AI-powered POA&M generation from findings
- CVE feed ingestion from NVD
- Document embedding + semantic search
- Role-based access (admin, isso, issm, user)
- Audit logging with AI decision tracking
- Docker + Grafana/Prometheus monitoring

## Target State (v1 — Agentic Security Team)
A coordinated multi-agent system where each agent maps to a real security team role, operating autonomously with human-in-the-loop approval gates.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + shadcn-ui + Tailwind
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI:** Claude API (agent reasoning) + OpenAI (embeddings, existing RAG)
- **Agent Orchestration:** Custom orchestrator via Supabase Edge Functions + Realtime
- **Monitoring:** Grafana + Prometheus (existing)
- **Deployment:** Vercel (frontend) + Supabase (backend)

## Agent Architecture

```
                    ┌─────────────────────┐
                    │   CISO Orchestrator  │
                    │  (Strategy + Delegation)
                    └──────────┬──────────┘
                               │
        ┌──────────┬───────────┼───────────┬──────────┐
        │          │           │           │          │
   ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
   │  SOC   │ │ Threat │ │  GRC   │ │  IR    │ │ AppSec │
   │Analyst │ │ Intel  │ │Analyst │ │Respond │ │Engineer│
   └────┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
        │         │           │          │           │
   ┌────▼─────────▼───────────▼──────────▼───────────▼────┐
   │              Shared Services Layer                     │
   │  RAG Engine │ Finding Store │ POA&M │ Audit Log       │
   │  CVE Feed   │ Notifications │ Agent State │ Approvals │
   └──────────────────────────────────────────────────────┘
```

## Agents

### 1. CISO Orchestrator
- **Role:** Strategic oversight, task delegation, escalation, executive reporting
- **Inputs:** All agent outputs, risk scores, compliance status
- **Outputs:** Priority queue, executive summaries, agent task assignments
- **Autonomy:** High — can delegate to any agent; escalates to human for risk acceptance

### 2. SOC Analyst Agent
- **Role:** Alert triage, log correlation, threat detection
- **Inputs:** CVE feed, SIEM alerts (future), system logs, agent findings
- **Outputs:** Enriched alerts with severity + context, false-positive classifications
- **Autonomy:** Medium — can classify and enrich; escalates incidents to IR agent

### 3. Threat Intelligence Agent
- **Role:** Threat landscape monitoring, IOC tracking, attack surface mapping
- **Inputs:** NVD CVE feed (existing), OSINT feeds, VirusTotal, Shodan
- **Outputs:** Threat briefs, IOC lists, control-to-threat mappings
- **Autonomy:** High — read-only external monitoring, no system changes

### 4. GRC Analyst Agent
- **Role:** Compliance gap analysis, policy review, audit preparation
- **Inputs:** Assessment responses, uploaded documents, control frameworks
- **Outputs:** Compliance reports, gap analyses, audit-ready documentation
- **Autonomy:** Medium — can generate reports; human approves compliance status changes

### 5. Incident Response Agent
- **Role:** Containment recommendations, playbook execution, forensic guidance
- **Inputs:** Escalated incidents from SOC, threat intel context
- **Outputs:** IR playbooks, containment steps, post-incident reports
- **Autonomy:** Low — recommends actions; human approves containment steps

### 6. AppSec Engineer Agent
- **Role:** Code security review, dependency scanning, SAST/DAST
- **Inputs:** GitHub repos, PR diffs, dependency manifests
- **Outputs:** Vulnerability findings, fix suggestions, security review reports
- **Autonomy:** Medium — can scan and report; human approves code changes

### 7. Pen Test Agent
- **Role:** Automated vulnerability discovery, attack simulation
- **Inputs:** Target scope, system configs, prior findings
- **Outputs:** Vulnerability reports with POCs, risk ratings
- **Autonomy:** Low — requires explicit authorization; scoped to approved targets only

## Phases

### Phase 1: Agent Foundation (Infrastructure)
**Goal:** Build the agent runtime, state management, and orchestration layer.
- Agent state table (status, assignments, history)
- Agent message bus (Supabase Realtime channels)
- Approval gates system (human-in-the-loop)
- Agent execution engine (edge function per agent)
- Agent dashboard UI (status, logs, controls)
- CISO Orchestrator (basic delegation + priority queue)

### Phase 2: Intelligence Agents (Detection)
**Goal:** Agents that gather and analyze threat data continuously.
- SOC Analyst Agent (enhance existing CVE feed → full triage pipeline)
- Threat Intelligence Agent (OSINT enrichment, control mapping)
- Real-time alert correlation engine
- Replace mock AIRiskAnalysisService with real agent-driven analysis
- Threat dashboard with agent-generated insights

### Phase 3: Compliance Agents (Assessment)
**Goal:** Automate compliance assessment and reporting.
- GRC Analyst Agent (auto-assess from uploaded documents)
- Enhanced POA&M Agent (multi-option remediation, cost/effort ranking)
- Automated compliance gap detection (policy vs. controls)
- Audit report generation
- Compliance timeline tracking

### Phase 4: Response Agents (Action)
**Goal:** Agents that recommend and guide remediation.
- Incident Response Agent (playbooks, containment, forensics)
- AppSec Agent (GitHub integration, PR security review)
- Pen Test Agent (scoped automated scanning)
- Remediation tracking and verification
- Post-incident review automation

### Phase 5: Orchestration & Polish (Coordination)
**Goal:** Full team coordination, executive reporting, continuous improvement.
- Advanced CISO Orchestrator (cross-agent workflows, risk-based prioritization)
- Executive dashboard (board-ready reports)
- Agent performance metrics (accuracy, speed, false-positive rate)
- Agent learning from human feedback
- Multi-tenant support
- API for external tool integration (SIEM, SOAR, ticketing)

## Key Design Principles

1. **Human-in-the-loop always** — Agents recommend, humans approve. No autonomous system changes without explicit approval gates.
2. **Audit everything** — Every agent decision logged with reasoning (existing `audit_log.ai_reasoning` pattern).
3. **Progressive autonomy** — Start with low autonomy, increase as trust builds. Configurable per agent.
4. **Existing infrastructure first** — Build on Supabase, existing RAG, existing CVE feed. Don't rearchitect what works.
5. **Agent isolation** — Each agent has scoped permissions. SOC can't modify compliance status. GRC can't trigger scans.
6. **Graceful degradation** — If an agent fails, the system continues. No single point of failure.

## Environment Variables (Required)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # For agent edge functions
ANTHROPIC_API_KEY=               # Claude API for agent reasoning
OPENAI_API_KEY=                  # Embeddings + existing RAG
GRAFANA_ADMIN_USER=
GRAFANA_ADMIN_PASSWORD=
```

## Success Criteria
- [ ] All 7 agents operational with defined scopes
- [ ] CISO Orchestrator coordinates cross-agent workflows
- [ ] Human approval gates for all high-impact actions
- [ ] Real-time agent status dashboard
- [ ] AIRiskAnalysisService replaced with real agent-driven analysis
- [ ] Audit trail for every agent decision with reasoning
- [ ] Mean time to finding detection < 1 hour (for known CVE patterns)
- [ ] Compliance assessment auto-fill > 60% accuracy from uploaded docs
