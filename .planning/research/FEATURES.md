# Feature Landscape: AI Security Team for CMMC Compliance

**Domain:** AI-powered GRC / Security Operations Platform
**Researched:** 2026-03-26

## Table Stakes

Features users expect from an AI-powered CMMC compliance platform. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| CMMC Level 1 + Level 2 control mapping | This IS the product. Defense contractors need CMMC, not generic compliance. | Medium | 17 controls (L1) + 110 controls (L2, maps to NIST 800-171 Rev 2). Seed from OSCAL JSON. |
| Gap analysis against CMMC controls | Competitors all offer this. Without it, you're just a checklist. | Medium | GRC Analyst agent compares current assessment answers against control requirements. |
| POA&M generation from gaps | Already exists in v0. Must continue working with new CMMC data. | Low | Extend existing POA&M generation to reference CMMC control IDs, not just NIST 800-53. |
| Compliance dashboard with maturity scoring | Every GRC tool has a dashboard. Users need a single-screen summary. | Medium | Percentage complete per domain, overall readiness score, trend over time. |
| Evidence collection tracking | C3PAO assessors ask "show me the evidence." You need to track what evidence maps to what control. | Medium | Upload docs, link to system configs, associate with specific controls. |
| Human approval gates | "AI made a security decision without my approval" is a liability nightmare. | High | Every high-impact agent action queued for human review. Must be fast and frictionless. |
| Audit-ready documentation export | The whole point is passing a CMMC audit. If you can't export the package, the product fails. | High | SSP (System Security Plan), POA&Ms, evidence matrix, assessment results -- all exportable. |
| Executive summary reports | CISOs and business owners don't read raw control data. They need board-ready summaries. | Medium | CISO Orchestrator agent generates these from all agent outputs. |
| Role-based access control | Already exists. Must extend to agent-specific permissions. | Low | Who can approve agent actions? Who can see what agent data? |
| Multi-tenant isolation | Already exists via company_id. Must extend to agent data. | Low | Agent tasks, messages, and results are company-scoped. No cross-tenant data leakage. |

## Differentiators

Features that set ASSESS-AI apart from FutureFeed, Risk Cognizance, ZenGRC, and other CMMC tools. Not expected, but create the "replace your security team" value prop.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Autonomous security team (7 agents) | No other CMMC tool has AI agents that actively work. Competitors offer checklists, you offer a team. | Very High | This is the core differentiator. Each agent has a defined role, tools, and can take action. |
| SOC Analyst agent (alert triage) | Competitors don't do threat detection. They only assess compliance. You detect AND comply. | High | Ingests alerts/logs, correlates patterns, escalates real threats. Bridges the "compliance != security" gap. |
| Threat Intelligence agent | Proactive threat monitoring vs. reactive checklist completion. | High | Monitors threat landscape relevant to customer's industry/tech stack. Feeds SOC and GRC agents. |
| Pen Test agent (automated vuln discovery) | Automated vulnerability scanning scoped to the customer's environment. | Very High | Must be carefully scoped -- biggest liability risk. Start with dependency scanning and config review, NOT active exploitation. |
| Incident Response playbooks | When something goes wrong, the IR agent guides response. No other CMMC tool does this. | High | Playbook-based: detect -> contain -> eradicate -> recover. Agent generates step-by-step guidance. |
| Agent-to-agent collaboration visible to user | Transparency into how agents work together builds trust. | Medium | Show CISO delegating to SOC, GRC feeding findings to CISO report. Users see the "team" working. |
| Continuous compliance monitoring | GRC tools are point-in-time. ASSESS-AI runs continuously. | High | Agents periodically re-check controls, update scores, flag drift. |
| Natural language security Q&A (existing RAG) | Already built. Upgrade from GPT-4o-mini chatbot to agent-aware Q&A that can query any agent's findings. | Medium | Connect RAG to agent output tables so users can ask "What did the threat intel agent find this week?" |

## Anti-Features

Features to explicitly NOT build. Each would waste time or create liability.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Active exploitation / real pen testing | Legal liability. One misconfigured test takes down a customer's production system. | Passive scanning only: dependency audit, config review, known CVE matching. Label it "vulnerability discovery" not "penetration testing." |
| Multi-framework support (SOC 2, FedRAMP, ISO) | Scope creep. CMMC is hard enough. Adding frameworks dilutes focus and delays shipping. | Build the control mapping architecture to support multiple frameworks LATER. Use a generic `controls` table with a `framework` column. But only populate CMMC for v1. |
| SIEM/SOAR integration | Enterprise integration is a rabbit hole. Each SIEM has different APIs, data formats, auth. | Define the integration API contract now but do NOT implement connectors. Let the SOC agent work with data users manually provide or from NVD/public feeds. |
| Free tier / freemium | At $2-5k/month, you're selling to businesses with compliance budgets. Free users consume support and infrastructure without converting. | Offer a demo/trial period (14-30 days) with full access, then paid. No feature-gated free tier. |
| Self-hosted deployment | On-prem means supporting customer infrastructure. Multiplies engineering effort. | SaaS only. If a customer demands on-prem, that's an enterprise contract conversation, not a product feature. |
| Custom agent creation by users | Letting users define their own agents is a massive engineering surface. | Fixed 7-agent team. Users configure agents (thresholds, notification preferences) but don't create new ones. |
| Real-time SIEM log streaming | Would require infrastructure to ingest customer log volumes. Way too early. | Agents analyze uploaded log snapshots or pull from defined endpoints on a schedule. |

## Feature Dependencies

```
CMMC Control Data (seeded) --> GRC Analyst Agent --> Gap Analysis --> POA&M Generation
                           --> Compliance Dashboard
                           --> Audit Documentation Export

Agent Runtime Infrastructure --> All 7 Agents
  |
  +--> Agent Message Bus (Realtime) --> Agent-to-Agent Communication
  +--> Agent State Tables --> Agent Dashboard UI
  +--> Approval Gates --> Human-in-the-Loop

CISO Orchestrator Agent --> Delegates to all other agents
                       --> Executive Reporting Dashboard

SOC Analyst Agent --> Requires: Threat Intel Agent (feeds), Alert data
Threat Intel Agent --> Requires: NVD API (existing), external threat feeds
GRC Analyst Agent --> Requires: CMMC control data, assessment responses (existing)
IR Agent --> Requires: SOC Analyst findings, playbook templates
AppSec Agent --> Requires: Customer tech stack info, dependency lists
Pen Test Agent --> Requires: Customer asset inventory, scoped permissions

Subscription/Payment (Stripe) --> Onboarding Flow --> Agent Access Control
                              --> Subscription status gates feature access
```

## MVP Recommendation

**Prioritize (must ship for v1):**

1. CMMC Level 1 + Level 2 control data seeding (foundation for everything)
2. Agent runtime infrastructure (message bus, state management, approval gates)
3. GRC Analyst agent (gap analysis is the core value -- compliance assessment with AI)
4. CISO Orchestrator agent (delegates work, generates executive reports)
5. Compliance dashboard with maturity scoring
6. Subscription/payment system (you need revenue)
7. Audit-ready documentation export (closes the "pass your CMMC audit" loop)

**Ship second (high value but can follow fast):**

8. SOC Analyst agent (alert triage)
9. Threat Intelligence agent (threat landscape)
10. Agent dashboard UI (real-time agent status)

**Defer (complex, high-risk, or dependent on v1 learnings):**

11. Incident Response agent -- needs SOC + Threat Intel to be useful
12. AppSec Engineer agent -- needs customer tech stack integration
13. Pen Test agent -- highest liability risk, needs careful scoping
14. Continuous compliance monitoring -- scheduled re-runs, needs stable agent layer first

**Rationale:** Ship the compliance core (CMMC + GRC + CISO + dashboard + payment) first because that's what customers are buying. Security operations agents (SOC, Threat Intel, IR, AppSec, Pen Test) add the "replace your team" value but are layered on top.

## Sources

- [CMMC Level 2 Requirements Guide](https://delve.co/learn/cmmc/cmmc-level-2-requirements)
- [Top CMMC Compliance Software 2025](https://riskcognizance.com/blog/top-5-cmmc-compliance-software-in-2025) -- competitor landscape
- [7 Top CMMC Compliance Software Platforms](https://www.kiteworks.com/cmmc-compliance/cmmc-compliance-software-audit-readiness/) -- feature benchmarking
- [CMMC Assessment Guide Level 2](https://dodcio.defense.gov/Portals/0/Documents/CMMC/AssessmentGuideL2v2.pdf) -- what assessors actually check
- [Multi-Agent Framework Comparison 2026](https://www.adopt.ai/blog/multi-agent-frameworks) -- agent capability patterns

---

*Feature research: 2026-03-26*
