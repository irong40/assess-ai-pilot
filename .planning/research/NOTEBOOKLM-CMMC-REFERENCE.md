# NotebookLM Research: CMMC Assessment Reference

**Source:** NotebookLM notebook (CMMC & NIST Security Frameworks)
**Queried:** 2026-03-26
**Purpose:** Inform GRC Analyst agent logic and compliance output generation

## SSP Structure (CMMC Level 2)

The SSP is the foundational document evaluated by C3PAO assessors. Required sections:

1. **System Boundary and Assessment Scope** — All assets within scope, exact system boundaries
2. **Environment of Operation** — Physical surroundings, technical environment for CUI processing/storage/transmission
3. **Identified Security Requirements** — Specific requirements mapped to 110 NIST SP 800-171 controls
4. **Security Control Implementation** — Detailed statements: how, where, when each requirement is implemented, and who is responsible
5. **Connections and Interdependencies** — Relationships, dependencies, interconnected systems/networks
6. **Roles and Responsibilities** — System owner, custodian, authorizing officials
7. **Continuous Monitoring and Update Frequency** — Strategy for monitoring controls, annual SSP review commitment

### Assessor Expectations
- "You do what you document, and document what you do"
- **Highly specific implementation details** — not "We limit system access" but "Access requires MFA using Yubikey hardware tokens with 12-character passwords"
- **Direct evidence referencing** — evidence map linking policies, SOPs, config settings, log files to each control
- **Structured alignment to NIST 800-171** — organized by 14 control families for traceability
- **Cloud/supply chain documentation** — Shared Responsibility Model for cloud services, which controls inherited vs internal

## POA&M Structure

Required fields:
1. **Control Identifier** — Specific NIST 800-171/CMMC control not fully implemented
2. **Current State / Weakness** — Detailed description without minimizing impact
3. **Risk/Impact Assessment** — How weakness impacts system or CUI environment
4. **Remediation Action and Milestones** — Technical and procedural steps, broken into trackable milestones
5. **Resources Required** — Funding, tools, personnel needed
6. **Owner / Responsibility** — Specific individual or role accountable
7. **Scheduled Due Dates** — Realistic timelines per milestone

### Critical POA&M Rules for CMMC Level 2
- **Minimum score of 80/110** to be eligible for POA&M usage
- **No deferrals for critical controls** — MFA, FIPS encryption, incident response, audit logging, SSP = automatic fail if missing
- **180-day deadline** — All POA&M items must be remediated within 180 days or conditional certification is revoked

## Assessment Methodology (NIST 800-171A)

### Finding Types
- **MET** — All applicable assessment objectives satisfied with finalized, approved evidence
- **NOT MET** — One or more objectives not satisfied (single NOT MET objective = entire requirement fails)
- **NOT APPLICABLE** — Requirement doesn't apply to environment (equivalent to MET, requires explanation)

### Assessment Methods

| Method | Description | Evidence Types |
|--------|-------------|---------------|
| **Examine** | Review, inspect, observe, analyze artifacts | Policies, SOPs, SSPs, network diagrams, config settings, audit logs, training materials |
| **Interview** | Discussions with individuals/groups | System admins, network engineers, security personnel, general users |
| **Test** | Exercise systems under specified conditions | Live demonstrations of hardware/software/firmware mechanisms |

### Examples by Control Family

**Access Control (AC.L2-3.1.1)**
- Examine: Access control policies, active accounts lists, config settings
- Interview: Account management / infosec personnel
- Test: Demonstrate failed login by unauthorized device

**Audit & Accountability (AU.L2-3.3.1)**
- Examine: Audit policies, auditable events list, incident reports, audit logs
- Interview: Audit review personnel, network admins
- Test: Exercise automated audit logging mechanisms

**Incident Response (IR.L2-3.6.1)**
- Examine: IR policies, contingency plans, training records, past incident records
- Interview: Incident monitoring and response personnel
- Test: Demonstrate monitoring capability, exercise IR processes

## Implications for GRC Agent Design

1. **Gap analysis must evaluate at the assessment objective level** — a single failed objective means the entire requirement is NOT MET
2. **GRC agent should categorize evidence by method** (examine/interview/test) to help users understand what types of proof they need
3. **SSP generation must be control-family-aligned** — organized by 14 NIST 800-171 families, not custom groupings
4. **POA&M generation must enforce the 80/110 minimum score rule** and flag critical controls that cannot be deferred
5. **Evidence tracking should map documents to specific controls** with an "evidence map" pattern assessors expect
6. **Implementation statements must be specific and actionable** — the GRC agent should flag vague descriptions and suggest concrete alternatives

---
*Research from NotebookLM, 2026-03-26*
