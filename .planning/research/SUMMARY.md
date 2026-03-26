# Research Summary: ASSESS-AI Agentic Layer + CMMC Framework

**Domain:** Multi-agent AI security operations platform for CMMC compliance
**Researched:** 2026-03-26
**Overall confidence:** HIGH (stack choices well-supported by current ecosystem; CMMC data sources officially available; payment patterns production-proven)

## Executive Summary

The multi-agent AI landscape in 2025-2026 has converged on clear patterns for TypeScript-based systems. The Vercel AI SDK (v6) is the dominant TypeScript framework for building AI agents, with 20M+ monthly npm downloads, native Anthropic provider support, and built-in tool-calling loops that eliminate the need for manual orchestration code. For this project -- which runs entirely on TypeScript, Supabase Edge Functions (Deno), and React -- the AI SDK is the correct choice over Python-based alternatives like LangGraph, CrewAI, or AutoGen that would require a second runtime.

CMMC compliance data is available in machine-readable formats through NIST's OSCAL (Open Security Controls Assessment Language) ecosystem. The critical finding here is that CMMC 2.0 is legally codified around NIST 800-171 Revision 2, NOT the more recent Revision 3. Building on Rev 3 prematurely is the single highest-risk mistake for this project -- it would cause customers to fail C3PAO assessments. The OSCAL JSON catalogs for 800-53 Rev 5 are officially published by NIST; 800-171 Rev 2 has a well-maintained community OSCAL catalog from Fathom5 that can seed the controls database.

For agent-to-agent communication, the existing Supabase infrastructure provides everything needed: Realtime Broadcast for ephemeral pub/sub messaging, Realtime Presence for agent status tracking, and PostgreSQL tables for durable task queues and audit trails. Adding Kafka, RabbitMQ, or Redis Pub/Sub for 7 agents would be over-engineering. The Supabase Realtime Broadcast REST API allows Edge Functions to publish server-side, and the 1 MB message size limit far exceeds agent task payload needs.

Stripe is the clear choice for subscription billing at the $2-5k/month price point. The Stripe + Supabase integration pattern is well-documented (official Supabase examples exist for webhook handlers), and the React Stripe Elements library provides embeddable payment components. No new billing infrastructure is needed.

## Key Findings

**Stack:** Vercel AI SDK 6 + @ai-sdk/anthropic for agent reasoning, Supabase Realtime for inter-agent messaging, NIST OSCAL JSON for CMMC controls, Stripe for billing. Zero new infrastructure -- everything layers onto existing Supabase + React stack.

**Architecture:** Hierarchical agent delegation pattern with CISO Orchestrator as the single delegation authority. Each agent is a separate Supabase Edge Function sharing a common base module. State lives in PostgreSQL, never in Edge Function memory.

**Critical pitfall:** Building on NIST 800-171 Rev 3 instead of Rev 2 would cause customers to fail CMMC assessments. Rev 2 is the legally codified standard through at least November 2026.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation: CMMC Data + Agent Runtime** - Build the infrastructure before building agents
   - Addresses: CMMC control data seeding (OSCAL), agent task tables, message bus, approval gate system, shared agent base module
   - Avoids: Circular delegation (hierarchy enforced from day 1), cross-tenant leakage (company_id scoping in base module)

2. **Core Agents: GRC Analyst + CISO Orchestrator** - Ship the compliance value first
   - Addresses: Gap analysis (the primary value prop), executive reporting, task delegation pattern
   - Avoids: Shipping all 7 agents at 60% quality -- get 2 to 95% first

3. **Billing + Onboarding** - Enable revenue before adding more agents
   - Addresses: Stripe subscription system, customer onboarding flow, subscription-gated access
   - Avoids: Building 7 agents with no way to charge for them

4. **Compliance Outputs: Dashboard + Export** - Close the "pass your audit" loop
   - Addresses: Compliance dashboard with maturity scoring, audit-ready documentation export (SSP, POA&Ms, evidence matrix)
   - Avoids: Having agents that produce results with no user-facing way to consume them

5. **Security Operations Agents: SOC + Threat Intel** - Layer on the "security team" differentiators
   - Addresses: Alert triage, threat landscape monitoring, CVE correlation
   - Avoids: Building these before the compliance core is solid

6. **Advanced Agents: IR + AppSec + Pen Test** - Complete the 7-agent team
   - Addresses: Incident response playbooks, code security review, vulnerability discovery
   - Avoids: Pen Test liability (passive-only scope), shipping before other agents provide input data

**Phase ordering rationale:**
- CMMC data must exist before any agent can analyze compliance (dependency)
- Agent runtime must exist before any agent can run (dependency)
- GRC + CISO are the minimum viable "team" that delivers the compliance value prop
- Billing before more agents -- revenue validates the product, funds API costs
- SOC + Threat Intel before IR because IR depends on their findings
- Pen Test last because it has the highest liability risk and needs the most careful scoping

**Research flags for phases:**
- Phase 1: Needs deeper research on OSCAL schema mapping to simplified database model
- Phase 3: Standard Stripe patterns, unlikely to need research
- Phase 5: May need research on specific threat feed APIs beyond NVD
- Phase 6: Pen Test scoping needs legal/compliance review, not just technical research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Agent orchestration (AI SDK) | HIGH | v6 is current, 20M+ downloads, Anthropic provider verified at v3.0.64, Deno compatibility documented |
| CMMC data sources | HIGH | OSCAL JSON from NIST official repo, 800-171 Rev 2 confirmed as CMMC standard, assessment guide available |
| Agent communication | HIGH | Supabase Realtime Broadcast is official, documented, and adequate for this scale |
| Payment/billing | HIGH | Stripe is the industry standard, Supabase integration pattern is officially documented |
| Agent-in-Deno runtime | MEDIUM | AI SDK + Deno npm imports are documented and reported working, but this specific combination (7 agents in Supabase Edge Functions with AI SDK) is novel enough to warrant a proof-of-concept sprint |
| Pen Test agent scope | LOW | Need legal review, not just technical research. Liability surface is unclear without attorney input. |

## Gaps to Address

- **OSCAL -> simplified schema mapping:** The OSCAL data model is complex. Need to define exactly which fields to import and how to flatten the catalog into the `controls` table. Should be part of Phase 1 research.
- **Edge Function concurrency limits:** Supabase Edge Functions have per-project concurrency limits by plan tier. Need to verify these are adequate for 7 agents x N customers running concurrently. May require Pro plan minimum.
- **Claude API cost modeling:** Need real-world token consumption data from the GRC Analyst agent before committing to pricing. Run cost projections: what does a full 110-control analysis cost in Claude tokens?
- **Threat Intelligence feeds beyond NVD:** The existing NVD integration covers CVEs. The Threat Intel agent may need additional feeds (CISA KEV catalog, industry-specific IOCs). These sources need phase-specific research.
- **Pen Test agent legal scope:** Cannot make a technology recommendation here. Needs legal counsel on what automated security testing is permissible in a SaaS product targeting defense contractors.

---

*Research summary: 2026-03-26*
