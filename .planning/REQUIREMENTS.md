# Requirements: ASSESS-AI

**Defined:** 2026-03-26
**Core Value:** Small defense contractors can achieve and maintain CMMC compliance without hiring a security team — at $2-5k/month.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### CMMC Framework

- [x] **CMMC-01**: User can view all CMMC Level 1 controls (17 practices) mapped from NIST 800-171r2
- [x] **CMMC-02**: User can view all CMMC Level 2 controls (110 practices) mapped from NIST 800-171r2
- [x] **CMMC-03**: System seeds CMMC control data from NIST OSCAL JSON catalogs
- [x] **CMMC-04**: User can calculate their SPRS score based on assessment responses
- [x] **CMMC-05**: GRC agent identifies gaps between current posture and CMMC L1/L2 requirements
- [ ] **CMMC-06**: User can upload evidence documents and associate them with specific CMMC controls
- [ ] **CMMC-07**: User can track evidence completeness per control (what's collected vs what's needed)
- [ ] **CMMC-08**: User can export audit-ready System Security Plan (SSP) document
- [ ] **CMMC-09**: User can export POA&M package with CMMC control references
- [ ] **CMMC-10**: User can export evidence matrix mapping documents to controls

### Agent Infrastructure

- [x] **INFRA-01**: Agent state management via PostgreSQL tables (status, assignments, history)
- [x] **INFRA-02**: Agent message bus via pgmq (PostgreSQL Message Queue) with pg_cron-scheduled Edge Function worker
- [x] **INFRA-03**: Agent execution engine using Supabase Edge Functions with Vercel AI SDK
- [x] **INFRA-04**: Async task chain architecture (single-step Edge Function invocations with state persistence)
- [x] **INFRA-05**: Human approval gate system with tiered trust levels (auto-approve low risk, require approval for high risk)
- [x] **INFRA-06**: Agent audit trail — every agent decision logged with AI reasoning
- [x] **INFRA-07**: Multi-tenant agent data isolation scoped by company_id
- [x] **INFRA-08**: Hub-and-spoke agent topology enforced (all cross-agent communication via CISO Orchestrator)

### CISO Orchestrator Agent

- [x] **CISO-01**: CISO agent delegates tasks to specialist agents based on priority queue
- [x] **CISO-02**: CISO agent generates executive summary reports from all agent outputs
- [x] **CISO-03**: CISO agent escalates high-risk findings to human operators for approval
- [x] **CISO-04**: CISO agent maintains a prioritized risk assessment across all agent domains
- [x] **CISO-05**: User can view CISO agent's current task queue and delegation status

### GRC Analyst Agent

- [x] **GRC-01**: GRC agent auto-assesses compliance gaps from uploaded documents
- [x] **GRC-02**: GRC agent generates gap analysis reports against CMMC L1/L2 controls
- [x] **GRC-03**: GRC agent generates multi-option remediation recommendations with cost/effort ranking
- [x] **GRC-04**: GRC agent tracks compliance status changes over time
- [x] **GRC-05**: GRC agent prepares audit-ready documentation packages

### SOC Analyst Agent

- [ ] **SOC-01**: SOC agent triages alerts from CVE feed and enriches with severity and context
- [ ] **SOC-02**: SOC agent correlates findings across data sources (CVE, assessment gaps, threat intel)
- [ ] **SOC-03**: SOC agent classifies false positives and provides reasoning
- [ ] **SOC-04**: SOC agent escalates confirmed incidents to IR agent via CISO Orchestrator

### Threat Intelligence Agent

- [ ] **THRT-01**: Threat Intel agent monitors NVD CVE feed (existing) with enhanced analysis
- [ ] **THRT-02**: Threat Intel agent generates threat briefs relevant to customer's tech stack
- [ ] **THRT-03**: Threat Intel agent maps threats to specific CMMC controls at risk
- [ ] **THRT-04**: Threat Intel agent tracks IOCs and provides attack surface mapping

### Incident Response Agent

- [ ] **IR-01**: IR agent generates containment recommendations based on incident type
- [ ] **IR-02**: IR agent provides step-by-step playbook guidance (detect, contain, eradicate, recover)
- [ ] **IR-03**: IR agent generates post-incident reports
- [ ] **IR-04**: IR agent recommendations require human approval before any action

### AppSec Engineer Agent

- [ ] **ASEC-01**: AppSec agent scans dependency manifests for known vulnerabilities
- [ ] **ASEC-02**: AppSec agent reviews configuration files for security misconfigurations
- [ ] **ASEC-03**: AppSec agent generates vulnerability findings with fix suggestions
- [ ] **ASEC-04**: AppSec agent produces security review reports

### Pen Test Agent

- [ ] **PENT-01**: Pen Test agent performs passive vulnerability discovery (no active exploitation)
- [ ] **PENT-02**: Pen Test agent scans for known CVE patterns in customer's declared tech stack
- [ ] **PENT-03**: Pen Test agent generates vulnerability reports with risk ratings
- [ ] **PENT-04**: Pen Test agent requires explicit authorization and scoped permissions before any scan

### Agent Dashboard

- [ ] **DASH-01**: User can view real-time status of all 7 agents (running, idle, waiting for approval)
- [ ] **DASH-02**: User can view agent activity logs with AI reasoning for each action
- [ ] **DASH-03**: User can approve or reject pending agent actions from the dashboard
- [ ] **DASH-04**: User can configure agent settings (thresholds, notification preferences)

### Compliance Dashboard & Reporting

- [ ] **REPT-01**: User can view compliance maturity score across all CMMC domains
- [ ] **REPT-02**: User can view domain-level progress (percentage complete per security domain)
- [ ] **REPT-03**: User can view compliance trend over time (readiness trajectory)
- [ ] **REPT-04**: CISO agent generates board-ready executive summary reports
- [ ] **REPT-05**: System continuously monitors compliance posture and alerts on drift
- [ ] **REPT-06**: User can schedule periodic compliance re-assessments

### Onboarding & Access

- [ ] **ONBD-01**: New organizations can sign up with a 14-30 day trial period with full access
- [ ] **ONBD-02**: Guided onboarding flow captures organization profile, tech stack, and compliance goals
- [ ] **ONBD-03**: Onboarding seeds initial assessment from organization profile data
- [ ] **ONBD-04**: Existing role-based access extended to agent-specific permissions

### Data Architecture

- [x] **DATA-01**: Platform is CUI-free by design — stores assessment metadata, not actual CUI documents
- [x] **DATA-02**: Clear data handling documentation for customers explaining what is/isn't stored
- [ ] **DATA-03**: Replace mock AIRiskAnalysisService with real agent-driven analysis

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Billing & Payments

- **BILL-01**: Stripe subscription management at $2-5k/month tiers
- **BILL-02**: Subscription-gated feature access
- **BILL-03**: Usage-based billing component for API-heavy customers

### Multi-Framework

- **FRMW-01**: SOC 2 control mapping
- **FRMW-02**: FedRAMP control mapping
- **FRMW-03**: ISO 27001 control mapping
- **FRMW-04**: Cross-framework control overlap visualization

### Integrations

- **INTG-01**: SIEM log ingestion (Splunk, Sentinel, etc.)
- **INTG-02**: SOAR integration for automated response
- **INTG-03**: Ticketing system integration (Jira, ServiceNow)
- **INTG-04**: OSCAL import/export for machine-readable compliance data

### Platform

- **PLAT-01**: FedRAMP authorization for the platform itself
- **PLAT-02**: C3PAO assessor portal (read-only access for auditors)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Active exploitation / pen testing | Legal liability — passive scanning only, labeled "vulnerability discovery" |
| Multi-framework support | CMMC first; generic `controls` table supports future frameworks but only CMMC populated |
| SIEM/SOAR integration | Enterprise integration rabbit hole; define API contract later |
| Free tier / freemium | $2-5k/month product; offer trial, not free tier |
| Self-hosted deployment | SaaS only for v1; on-prem is an enterprise contract conversation |
| Custom agent creation | Fixed 7-agent team; users configure, not create |
| Real-time SIEM log streaming | Infrastructure burden; agents analyze uploaded snapshots or scheduled pulls |
| Mobile app | Web-first |
| NIST 800-171 Revision 3 | DoD locked CMMC to Rev 2 through 2026 via DFARS Class Deviation |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CMMC-01 | Phase 1: Foundation | Complete (01-01) |
| CMMC-02 | Phase 1: Foundation | Complete (01-01) |
| CMMC-03 | Phase 1: Foundation | Complete (01-01) |
| CMMC-04 | Phase 1: Foundation | Complete (01-01) |
| CMMC-05 | Phase 2: Core Agents | Complete |
| CMMC-06 | Phase 3: Dashboards and Compliance Outputs | Pending |
| CMMC-07 | Phase 3: Dashboards and Compliance Outputs | Pending |
| CMMC-08 | Phase 3: Dashboards and Compliance Outputs | Pending |
| CMMC-09 | Phase 3: Dashboards and Compliance Outputs | Pending |
| CMMC-10 | Phase 3: Dashboards and Compliance Outputs | Pending |
| INFRA-01 | Phase 1: Foundation | Complete |
| INFRA-02 | Phase 1: Foundation | Complete |
| INFRA-03 | Phase 1: Foundation | Complete |
| INFRA-04 | Phase 1: Foundation | Complete |
| INFRA-05 | Phase 1: Foundation | Complete (01-03) |
| INFRA-06 | Phase 1: Foundation | Complete (01-03) |
| INFRA-07 | Phase 1: Foundation | Complete (01-03) |
| INFRA-08 | Phase 1: Foundation | Complete |
| CISO-01 | Phase 2: Core Agents | Complete |
| CISO-02 | Phase 2: Core Agents | Complete |
| CISO-03 | Phase 2: Core Agents | Complete |
| CISO-04 | Phase 2: Core Agents | Complete |
| CISO-05 | Phase 2: Core Agents | Complete |
| GRC-01 | Phase 2: Core Agents | Complete |
| GRC-02 | Phase 2: Core Agents | Complete |
| GRC-03 | Phase 2: Core Agents | Complete |
| GRC-04 | Phase 2: Core Agents | Complete |
| GRC-05 | Phase 2: Core Agents | Complete |
| SOC-01 | Phase 5: Security Operations Agents | Pending |
| SOC-02 | Phase 5: Security Operations Agents | Pending |
| SOC-03 | Phase 5: Security Operations Agents | Pending |
| SOC-04 | Phase 5: Security Operations Agents | Pending |
| THRT-01 | Phase 5: Security Operations Agents | Pending |
| THRT-02 | Phase 5: Security Operations Agents | Pending |
| THRT-03 | Phase 5: Security Operations Agents | Pending |
| THRT-04 | Phase 5: Security Operations Agents | Pending |
| IR-01 | Phase 6: Advanced Agents | Pending |
| IR-02 | Phase 6: Advanced Agents | Pending |
| IR-03 | Phase 6: Advanced Agents | Pending |
| IR-04 | Phase 6: Advanced Agents | Pending |
| ASEC-01 | Phase 6: Advanced Agents | Pending |
| ASEC-02 | Phase 6: Advanced Agents | Pending |
| ASEC-03 | Phase 6: Advanced Agents | Pending |
| ASEC-04 | Phase 6: Advanced Agents | Pending |
| PENT-01 | Phase 6: Advanced Agents | Pending |
| PENT-02 | Phase 6: Advanced Agents | Pending |
| PENT-03 | Phase 6: Advanced Agents | Pending |
| PENT-04 | Phase 6: Advanced Agents | Pending |
| DASH-01 | Phase 3: Dashboards and Compliance Outputs | Pending |
| DASH-02 | Phase 3: Dashboards and Compliance Outputs | Pending |
| DASH-03 | Phase 3: Dashboards and Compliance Outputs | Pending |
| DASH-04 | Phase 3: Dashboards and Compliance Outputs | Pending |
| REPT-01 | Phase 3: Dashboards and Compliance Outputs | Pending |
| REPT-02 | Phase 3: Dashboards and Compliance Outputs | Pending |
| REPT-03 | Phase 3: Dashboards and Compliance Outputs | Pending |
| REPT-04 | Phase 3: Dashboards and Compliance Outputs | Pending |
| REPT-05 | Phase 3: Dashboards and Compliance Outputs | Pending |
| REPT-06 | Phase 3: Dashboards and Compliance Outputs | Pending |
| ONBD-01 | Phase 4: Onboarding and Access | Pending |
| ONBD-02 | Phase 4: Onboarding and Access | Pending |
| ONBD-03 | Phase 4: Onboarding and Access | Pending |
| ONBD-04 | Phase 4: Onboarding and Access | Pending |
| DATA-01 | Phase 1: Foundation | Complete (01-03) |
| DATA-02 | Phase 1: Foundation | Complete (01-03) |
| DATA-03 | Phase 2: Core Agents | Pending |

**Coverage:**
- v1 requirements: 65 total
- Mapped to phases: 65
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation (traceability populated, count corrected from 53 to 65)*
