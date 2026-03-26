# ASSESS-AI: AI Security Team for CMMC Compliance

## What This Is

An AI-powered security operations platform that replaces an entire security team for small defense contractors who need CMMC compliance but can't afford traditional solutions. Seven autonomous AI agents — from a CISO orchestrator to a pen test agent — continuously monitor, assess, detect, respond, and report on an organization's security posture. Human operators supervise and approve; agents do the heavy lifting.

## Core Value

Small defense industrial base companies can achieve and maintain CMMC compliance without hiring a security team or paying $50k+/year for enterprise GRC tools — at $2-5k/month.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — existing v0 functionality. -->

- ✓ 96 NIST 800-53 assessment questions across 8 security domains — existing
- ✓ Self-assessment wizard with domain-based progression — existing
- ✓ Auto-generation of findings from assessment responses — existing
- ✓ RAG chatbot for compliance Q&A (OpenAI embeddings + GPT-4o-mini) — existing
- ✓ AI-powered POA&M generation from findings — existing
- ✓ CVE feed ingestion from NVD — existing
- ✓ Document embedding and semantic search — existing
- ✓ Role-based access control (admin, isso, issm, user) — existing
- ✓ Audit logging with AI decision reasoning — existing
- ✓ Multi-tenant data isolation by company_id — existing
- ✓ NDA gate for sensitive content — existing
- ✓ Docker + Grafana/Prometheus monitoring — existing
- ✓ DoD-compliant password enforcement — existing

### Active

<!-- v1 scope: 7 AI agents + CMMC framework + sellable product. -->

- [ ] CMMC Level 1 and Level 2 control mapping (replace/augment NIST 800-53)
- [ ] Agent runtime infrastructure (state management, message bus, execution engine)
- [ ] Agent approval gates (human-in-the-loop for high-impact actions)
- [ ] CISO Orchestrator agent (strategic oversight, task delegation, executive reporting)
- [ ] SOC Analyst agent (alert triage, log correlation, threat detection)
- [ ] Threat Intelligence agent (threat landscape monitoring, IOC tracking, attack surface mapping)
- [ ] GRC Analyst agent (compliance gap analysis, policy review, audit preparation)
- [ ] Incident Response agent (containment recommendations, playbook execution)
- [ ] AppSec Engineer agent (code security review, dependency scanning)
- [ ] Pen Test agent (automated vulnerability discovery, scoped attack simulation)
- [ ] Agent dashboard UI (real-time status, logs, controls for all agents)
- [ ] Executive reporting dashboard (board-ready compliance reports)
- [ ] Replace mock AIRiskAnalysisService with real agent-driven analysis
- [ ] Subscription/payment system for $2-5k/month pricing
- [ ] Onboarding flow for new customer organizations
- [ ] CMMC audit-ready documentation export

### Out of Scope

<!-- Explicit boundaries. -->

- Multi-framework support (SOC 2, FedRAMP, ISO 27001) — CMMC first, others later
- Mobile app — web-first
- SIEM/SOAR integration — future API expansion
- Self-hosted/on-prem deployment — SaaS only for v1
- Free tier — premium product, no freemium

## Context

**Market:** Small defense contractors (manufacturers, subcontractors) in the Defense Industrial Base (DIB) are required to achieve CMMC certification. Most have limited staff, limited funds to outsource, but a hard compliance requirement. Traditional options are hiring a CISO ($150k+/yr), engaging consultants ($200+/hr), or buying enterprise GRC tools ($50k+/yr). ASSESS-AI fills the gap at $2-5k/month.

**Existing codebase:** A working compliance assessment tool (v0) built with React + TypeScript + Vite + Supabase. Already has assessment wizard, RAG chatbot, POA&M generation, CVE feed, role-based auth, audit logging, and Docker-based monitoring. The AI layer runs via Supabase Edge Functions (Deno) calling OpenAI APIs. The `AIRiskAnalysisService` is currently a mock that needs replacement with real agent-driven analysis.

**Agent architecture:** Seven agents mapped to real security team roles (CISO, SOC, Threat Intel, GRC, IR, AppSec, Pen Test) with a shared services layer. Each agent runs as a Supabase Edge Function with Claude API for reasoning. Agents communicate via Supabase Realtime channels. All actions go through approval gates before execution.

**Timeline pressure:** Need to start selling ASAP. The product needs all 7 agents operational to deliver the "replace your security team" value proposition.

## Constraints

- **Tech stack**: React + TypeScript + Vite + Supabase (existing, don't rearchitect)
- **AI providers**: Claude API for agent reasoning, OpenAI for embeddings/existing RAG
- **Deployment**: Vercel (frontend) + Supabase (backend) for production SaaS
- **Compliance framework**: CMMC Level 1 and 2 first — must map to NIST 800-171/800-53 controls
- **Agent isolation**: Each agent has scoped permissions — no cross-agent access without orchestrator
- **Human-in-the-loop**: All high-impact agent actions require human approval
- **Audit trail**: Every agent decision logged with reasoning (existing pattern)
- **Revenue target**: $2,000-$5,000/month per customer
- **Speed**: Ship as fast as possible — this is a commercial product, not a research project

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CMMC as first framework | DIB companies have mandatory deadlines, clear buyer pain | — Pending |
| All 7 agents for v1 | "Replace your security team" requires the full team | — Pending |
| $2-5k/month pricing | Below consultant/enterprise tool cost, above commodity SaaS | — Pending |
| Claude API for agent reasoning | Advanced reasoning for security analysis; OpenAI for embeddings | — Pending |
| Supabase Edge Functions for agents | Existing infra, serverless, built-in auth/realtime | — Pending |

---
*Last updated: 2026-03-26 after initialization*
