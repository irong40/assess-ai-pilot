# Roadmap: ASSESS-AI

## Overview

ASSESS-AI delivers an AI-powered security operations platform for small defense contractors who need CMMC compliance. The build progresses from foundational data and agent infrastructure, through the core compliance agents (GRC + CISO), to user-facing dashboards and exports, customer onboarding, and finally the full 7-agent security team. Each phase delivers a coherent, verifiable capability that builds on the last -- the product becomes sellable after Phase 4 and reaches full value at Phase 6.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - CMMC control data, agent runtime infrastructure, and CUI-free data architecture
- [ ] **Phase 2: Core Agents** - GRC Analyst and CISO Orchestrator deliver the minimum viable AI security team
- [ ] **Phase 3: Dashboards and Compliance Outputs** - Agent dashboard, compliance reporting, evidence management, and audit-ready exports
- [ ] **Phase 4: Onboarding and Access** - New customer sign-up, guided onboarding, and agent-aware permissions
- [ ] **Phase 5: Security Operations Agents** - SOC Analyst and Threat Intelligence agents add continuous monitoring
- [ ] **Phase 6: Advanced Agents** - Incident Response, AppSec Engineer, and Pen Test agents complete the 7-agent team

## Phase Details

### Phase 1: Foundation
**Goal**: The platform has seeded CMMC control data (NIST 800-171r2), a working agent runtime with message bus and approval gates, and a CUI-free data architecture -- so that agents can be built on a solid, multi-tenant, auditable foundation.
**Depends on**: Nothing (first phase)
**Requirements**: CMMC-01, CMMC-02, CMMC-03, CMMC-04, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. User can browse all 17 CMMC Level 1 practices and all 110 CMMC Level 2 practices mapped from NIST 800-171 Rev 2
  2. User can calculate their SPRS score from assessment responses against CMMC controls
  3. A test agent can be dispatched via the message bus, execute a task in an Edge Function, persist its state and result to PostgreSQL, and appear in the audit trail with AI reasoning
  4. The approval gate system blocks a high-risk test action until a human approves it, and auto-approves a low-risk action
  5. All agent data is scoped by company_id with no cross-tenant leakage, and the platform stores zero CUI (assessment metadata only)
**Plans**: TBD

Plans:
- [ ] 01-01: CMMC control data seeding and SPRS scoring
- [ ] 01-02: Agent runtime infrastructure (state, message bus, execution engine)
- [ ] 01-03: Approval gates, audit trail, and CUI-free data architecture

### Phase 2: Core Agents
**Goal**: The GRC Analyst and CISO Orchestrator agents are operational -- the GRC agent performs compliance gap analysis and generates remediation recommendations, while the CISO Orchestrator delegates tasks, maintains risk posture, and produces executive summaries. This is the minimum viable "AI security team."
**Depends on**: Phase 1
**Requirements**: CISO-01, CISO-02, CISO-03, CISO-04, CISO-05, GRC-01, GRC-02, GRC-03, GRC-04, GRC-05, CMMC-05
**Success Criteria** (what must be TRUE):
  1. GRC agent auto-assesses uploaded documents against CMMC L1/L2 controls and produces a gap analysis report with multi-option remediation recommendations ranked by cost and effort
  2. CISO Orchestrator agent delegates tasks to the GRC agent, escalates high-risk findings for human approval, and generates an executive summary from agent outputs
  3. User can view the CISO agent's current task queue and delegation status
  4. GRC agent tracks compliance status changes over time and prepares audit-ready documentation packages
  5. Hub-and-spoke topology is enforced -- all cross-agent communication routes through the CISO Orchestrator
**Plans**: TBD

Plans:
- [ ] 02-01: GRC Analyst agent (gap analysis, remediation, compliance tracking)
- [ ] 02-02: CISO Orchestrator agent (delegation, risk posture, executive reporting)
- [ ] 02-03: Replace mock AIRiskAnalysisService with agent-driven analysis

### Phase 3: Dashboards and Compliance Outputs
**Goal**: Users can see what their AI security team is doing (agent dashboard), view their compliance posture (compliance dashboard), manage evidence, and export audit-ready documents -- closing the loop between agent analysis and user-consumable outputs.
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, REPT-01, REPT-02, REPT-03, REPT-04, REPT-05, REPT-06, CMMC-06, CMMC-07, CMMC-08, CMMC-09, CMMC-10
**Success Criteria** (what must be TRUE):
  1. User can view real-time status of all agents, read activity logs with AI reasoning, and approve or reject pending actions from the agent dashboard
  2. User can view compliance maturity score, domain-level progress, and compliance trend over time on the compliance dashboard
  3. User can upload evidence documents, associate them with specific CMMC controls, and track evidence completeness per control
  4. User can export an audit-ready SSP, POA&M package with CMMC control references, and an evidence matrix mapping documents to controls
  5. System continuously monitors compliance posture and alerts on drift, and user can schedule periodic re-assessments
**Plans**: TBD

Plans:
- [ ] 03-01: Agent dashboard (status, logs, approval actions, configuration)
- [ ] 03-02: Compliance dashboard and reporting (maturity score, trends, drift alerts)
- [ ] 03-03: Evidence management and audit-ready document export (SSP, POA&M, evidence matrix)

### Phase 4: Onboarding and Access
**Goal**: New customer organizations can sign up for a trial, go through a guided onboarding flow that seeds their initial assessment, and have role-based access extended to agent-specific permissions -- making the product ready for external customers.
**Depends on**: Phase 3
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04
**Success Criteria** (what must be TRUE):
  1. A new organization can sign up and receive a 14-30 day trial with full platform access including all agents
  2. Guided onboarding captures organization profile, tech stack, and compliance goals, then seeds an initial assessment from that data
  3. Role-based access controls include agent-specific permissions (who can configure agents, approve actions, view logs)
**Plans**: TBD

Plans:
- [ ] 04-01: Trial sign-up and guided onboarding flow
- [ ] 04-02: Agent-specific permissions and initial assessment seeding

### Phase 5: Security Operations Agents
**Goal**: The SOC Analyst and Threat Intelligence agents are operational -- adding continuous security monitoring, alert triage, threat landscape awareness, and IOC tracking that feeds into the existing GRC and CISO agent workflows.
**Depends on**: Phase 2 (agents), Phase 3 (dashboard to display results)
**Requirements**: SOC-01, SOC-02, SOC-03, SOC-04, THRT-01, THRT-02, THRT-03, THRT-04
**Success Criteria** (what must be TRUE):
  1. SOC agent triages CVE alerts with severity and context, correlates findings across data sources, and classifies false positives with reasoning
  2. Threat Intel agent generates threat briefs relevant to the customer's tech stack and maps threats to specific CMMC controls at risk
  3. SOC agent escalates confirmed incidents to the IR agent (or flags for Phase 6) via the CISO Orchestrator
  4. Threat Intel agent tracks IOCs and provides attack surface mapping visible on the agent dashboard
**Plans**: TBD

Plans:
- [ ] 05-01: SOC Analyst agent (alert triage, correlation, false positive classification)
- [ ] 05-02: Threat Intelligence agent (threat briefs, IOC tracking, attack surface mapping)

### Phase 6: Advanced Agents
**Goal**: Incident Response, AppSec Engineer, and Pen Test agents complete the full 7-agent security team -- delivering containment playbooks, code/config security review, and passive vulnerability discovery. The "replace your security team" value proposition is fully realized.
**Depends on**: Phase 5 (SOC/Threat Intel findings feed IR; AppSec/PenTest benefit from threat context)
**Requirements**: IR-01, IR-02, IR-03, IR-04, ASEC-01, ASEC-02, ASEC-03, ASEC-04, PENT-01, PENT-02, PENT-03, PENT-04
**Success Criteria** (what must be TRUE):
  1. IR agent generates containment recommendations and step-by-step playbook guidance, with human approval required before any action
  2. AppSec agent scans dependency manifests and configuration files, generating vulnerability findings with fix suggestions and security review reports
  3. Pen Test agent performs passive vulnerability discovery and scans for known CVE patterns in the customer's declared tech stack, with explicit authorization and scoped permissions required before any scan
  4. IR agent generates post-incident reports that feed into the compliance dashboard
  5. All three agents route through the CISO Orchestrator and appear with full activity and reasoning on the agent dashboard
**Plans**: TBD

Plans:
- [ ] 06-01: Incident Response agent (containment, playbooks, post-incident reports)
- [ ] 06-02: AppSec Engineer agent (dependency scanning, config review, vulnerability reports)
- [ ] 06-03: Pen Test agent (passive discovery, CVE pattern scanning, authorization gates)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Core Agents | 0/3 | Not started | - |
| 3. Dashboards and Compliance Outputs | 0/3 | Not started | - |
| 4. Onboarding and Access | 0/2 | Not started | - |
| 5. Security Operations Agents | 0/2 | Not started | - |
| 6. Advanced Agents | 0/3 | Not started | - |
