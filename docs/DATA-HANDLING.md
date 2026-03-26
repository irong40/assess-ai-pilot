# ASSESS-AI Data Handling Policy

This document describes what data ASSESS-AI stores, what it does not store, and how data is isolated between organizations. It is intended for customers evaluating the platform for compliance-sensitive environments.

## What We Store

ASSESS-AI stores **assessment metadata** -- the structured results of your compliance evaluation, not the underlying sensitive documents themselves.

- **CMMC/NIST 800-171 control reference data** -- The 110 NIST 800-171 Rev 2 controls mapped to CMMC Levels 1 and 2. This is publicly available government data, not proprietary or classified.
- **Assessment responses** -- Your compliance status per control (e.g., "implemented", "not implemented", "partially implemented"). These are status values, not document content.
- **SPRS scores** -- The calculated Supplier Performance Risk System score derived from your assessment responses.
- **Agent analysis results** -- AI-generated gap analysis findings, remediation recommendations, and risk assessments produced by ASSESS-AI agents.
- **Approval decisions** -- Records of human approval or rejection of high-risk agent actions, including the approver identity and reasoning.
- **Audit trail** -- A complete log of every significant action (human and AI) including timestamps, actor identity, and AI reasoning summaries.
- **User profiles** -- Name, email address, organizational role (admin, ISSM, ISSO, viewer), and company association.

## What We Do NOT Store

ASSESS-AI does **not** store Controlled Unclassified Information (CUI) or any sensitive document content.

- **Actual CUI documents** -- System Security Plans (SSPs), vulnerability assessment reports, network diagrams, and other documents containing CUI are never uploaded to or stored by ASSESS-AI.
- **Classified information** -- ASSESS-AI has no mechanism to receive, process, or store classified data of any kind.
- **System Security Plans with sensitive details** -- While ASSESS-AI helps you track compliance status, the actual SSP document with sensitive technical details remains in your secure document management system.
- **Network diagrams or architecture details** -- ASSESS-AI tracks which controls are implemented, not the technical details of how your network is configured.
- **Vulnerability scan raw data** -- ASSESS-AI does not ingest or store raw vulnerability scan output files.
- **Evidence document files** -- Evidence references in ASSESS-AI are URLs or pointers to your existing secure document store, not file uploads. We do not provide file storage for CUI documents.

## Multi-Tenant Isolation

All customer data is scoped by a unique `company_id` identifier. This isolation is enforced at multiple levels:

- **Database level** -- Row Level Security (RLS) policies on every tenant-scoped table ensure that database queries only return rows matching the authenticated user's company.
- **Application level** -- Every agent database query includes a mandatory company_id filter. The shared agent framework enforces this as a non-negotiable requirement.
- **Agent level** -- AI agents cannot access data across tenant boundaries. Each agent task is bound to a specific company_id, and all agent operations are scoped accordingly.
- **Audit enforcement** -- The audit trail records which company each action belongs to, providing a verifiable record of data access.

The only shared data is the NIST 800-171 control reference table, which contains publicly available government standards data and is accessible to all authenticated users by design.

## Agent Data Handling

ASSESS-AI uses AI agents to analyze your assessment responses and produce compliance recommendations. Here is how agents handle data:

- **Input** -- Agents receive assessment metadata (compliance status per control, risk levels, organizational context). Agents never receive or process actual CUI.
- **Processing** -- Agents analyze patterns in your assessment responses, identify compliance gaps, and generate remediation recommendations using the NIST 800-171 control framework.
- **Output** -- Agent results include gap analysis reports, remediation options ranked by cost and effort, risk posture summaries, and executive briefings. All outputs are assessment metadata.
- **Reasoning** -- Every agent decision is logged in the audit trail with a summary of the AI reasoning, providing transparency into how recommendations were generated.
- **Approval gates** -- High-risk agent actions (modifications, deletions, policy changes) require human approval from an authorized administrator or ISSM before execution.

## Your Responsibilities

To maintain the CUI-free architecture of ASSESS-AI:

- **Do not paste CUI into free-text fields.** Assessment responses should capture compliance status, not the content of sensitive documents.
- **Do not upload CUI documents.** Evidence references should be links or identifiers pointing to your secure document management system (e.g., a SharePoint URL, document ID).
- **Use ASSESS-AI for compliance tracking, not document storage.** The platform is designed to track *whether* you meet each control requirement, not to store the technical details of *how* you meet them.

---

*ASSESS-AI is designed to help small defense contractors achieve and maintain CMMC compliance without requiring them to expose sensitive data to a cloud platform. The CUI-free architecture is a deliberate design decision that ensures the platform itself does not become a compliance liability.*
