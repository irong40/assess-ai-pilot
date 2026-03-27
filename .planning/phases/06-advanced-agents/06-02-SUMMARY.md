---
phase: 06-advanced-agents
plan: 02
subsystem: agents
tags: [appsec, dependency-scanning, config-review, manifest-parser, vulnerability-findings, security-review, ciso-delegation, zod, edge-function]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: agent-base.ts (executeAgentTask, delegateTask), agent-types.ts, controls table
  - phase: 02-core-agents
    provides: GRC Analyst agent, CISO Orchestrator with delegateToGRC, dual-module pattern, tool factory pattern
  - phase: 05-security-operations-agents
    provides: SOC Analyst agent (05-01), Threat Intel agent (05-02), CISO delegateToSOC/delegateToThreatIntel, soc_alerts table
  - phase: 06-advanced-agents/01
    provides: IR agent with delegateToIR, ir_incidents table, mandatory approval via risk_level='high'
provides:
  - AppSec Edge Function with scan-dependencies/review-config/generate-security-report actions
  - 5 AppSec tools (parseDependencyManifest, matchDependencyVulnerabilities, reviewConfigFile, createAppSecFinding, getCompanyTechStack)
  - Zod schemas for manifest dependencies, AppSec findings, config issues, security review reports
  - appsec_findings database table with finding_type/severity/status lifecycle, RLS, 3 indexes
  - CISO Orchestrator extended with delegateToAppSec tool (informational risk level)
  - CONFIG_SECURITY_RULES checklist (7 rules for common misconfigurations)
  - parseDependencyManifest pure function handling package.json, requirements.txt, pom.xml
  - Frontend TypeScript types for AppSec output
affects: [06-03-pen-test-agent]

# Tech tracking
tech-stack:
  added: []
  patterns: [CONFIG_SECURITY_RULES regex checklist, stripVersionRange normalizer, manifest-type dispatch (JSON.parse / line-split / regex), CORS JSON-key-aware regex patterns]

key-files:
  created:
    - supabase/functions/agent-appsec/index.ts
    - supabase/functions/_shared/appsec-schemas.ts
    - supabase/functions/_shared/appsec-tools.ts
    - src/lib/appsec-schemas-frontend.ts
    - src/lib/appsec-tools-testable.ts
    - src/types/appsec-output.ts
    - supabase/migrations/20260327400001_appsec_agent_tables.sql
    - src/lib/__tests__/appsec-schemas.test.ts
    - src/lib/__tests__/appsec-agent.test.ts
    - src/lib/__tests__/appsec-migration.test.ts
  modified:
    - supabase/functions/_shared/ciso-tools.ts
    - src/lib/ciso-tools.ts
    - src/lib/__tests__/ciso-agent.test.ts

key-decisions:
  - "AppSec agent uses maxSteps: 8 consistent with SOC, Threat Intel, and IR agents for Edge Function timeout avoidance"
  - "AppSec tasks use default risk_level (not hardcoded high like IR) -- findings are informational"
  - "CISO delegation extension appends AppSec rules to existing prompt (does not rewrite) -- preserves GRC, SOC, Threat Intel, and IR delegation rules"
  - "parseDependencyManifest is a pure function: package.json via JSON.parse, requirements.txt via line-split, pom.xml via regex"
  - "CONFIG_SECURITY_RULES uses JSON-key-aware regex patterns (optional trailing quote before colon) for reliable detection in JSON configs"
  - "AppSec findings persist via createAppSecFinding during execution -- no separate storeResult needed"
  - "reviewConfigFile is a pure function applying CONFIG_SECURITY_RULES line-by-line with one issue per rule per file"

patterns-established:
  - "CISO delegation extension: add delegateToX tool, update CISO_TOOL_NAMES, append delegation rules, add buildCisoPrompt cases"
  - "Pure function manifest parsing: dispatches by manifest_type, normalizes versions with stripVersionRange"
  - "CONFIG_SECURITY_RULES: regex-based config review with JSON-key-aware patterns"

requirements-completed: [ASEC-01, ASEC-02, ASEC-03, ASEC-04]

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 6 Plan 02: AppSec Engineer Agent Summary

**AppSec agent with dependency manifest scanning (package.json, requirements.txt, pom.xml), configuration file review using CONFIG_SECURITY_RULES, vulnerability findings with fix suggestions and CMMC control mapping, and security review reports**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-27T17:55:00Z
- **Completed:** 2026-03-27T18:01:00Z
- **Tasks:** 2
- **Files created:** 11
- **Files modified:** 3

## Accomplishments
- AppSec Edge Function operational at supabase/functions/agent-appsec/index.ts following established agent skeleton with maxSteps: 8
- APPSEC_SYSTEM_PROMPT references CMMC control families AC (access control), SI (system/info integrity), and CM (configuration management)
- 5 domain-specific tools: parseDependencyManifest (pure function, 3 manifest types), matchDependencyVulnerabilities (queries threat_intelligence), reviewConfigFile (pure function, 7 rules), createAppSecFinding (inserts appsec_findings), getCompanyTechStack (queries onboarding_profiles)
- Zod schemas: ManifestDependencySchema (name/version/dep_type), AppSecFindingSchema (4 finding types, severity, CVE, fix, CMMC controls), ConfigIssueSchema (rule_id, severity, file_path, fix), SecurityReviewReportSchema (findings + config_issues + summary + risk_score + remediation_priority)
- Database migration: appsec_findings table with finding_type CHECK (4 values), severity CHECK (4 values), status CHECK (4 values: open/fixed/accepted_risk/false_positive), cmmc_controls TEXT[], RLS, 3 indexes
- CONFIG_SECURITY_RULES: 7 rules covering hardcoded secrets, debug mode, permissive CORS, default credentials, insecure protocols, missing security headers, verbose error messages
- parseDependencyManifest handles package.json (JSON.parse + dependencies/devDependencies), requirements.txt (line-split with operator parsing), pom.xml (regex groupId/artifactId/version extraction)
- stripVersionRange normalizes ^, ~, >=, <=, > prefixes from version strings
- CISO Orchestrator extended with delegateToAppSec tool alongside existing delegateToGRC/delegateToSOC/delegateToThreatIntel/delegateToIR -- hub-and-spoke topology maintained with 5 specialist agents
- 125 new tests across 4 test files (104 AppSec-specific + 21 updated CISO), 609 total suite passing

## Task Commits

Each task was committed atomically:

1. **Task 1: AppSec schemas, tools, manifest parser, migration, and test suite**
   - `85d0978` (feat: AppSec Zod schemas, 5 tools, CONFIG_SECURITY_RULES, parseDependencyManifest, appsec_findings migration, Node mirrors, 104 tests passing)
2. **Task 2: AppSec Edge Function and CISO delegateToAppSec extension**
   - `98879ee` (feat: AppSec Edge Function, CISO delegateToAppSec with informational risk level, 609 tests passing)

## Files Created/Modified
- `supabase/functions/agent-appsec/index.ts` - AppSec Edge Function handler (3 actions, maxSteps: 8)
- `supabase/functions/_shared/appsec-schemas.ts` - Deno Zod schemas for AppSec structured output
- `supabase/functions/_shared/appsec-tools.ts` - APPSEC_SYSTEM_PROMPT, CONFIG_SECURITY_RULES, 5 tool definitions, parseDependencyManifest, reviewConfigFile, prompt builder (Deno)
- `src/lib/appsec-schemas-frontend.ts` - Vitest-compatible Zod schema re-exports
- `src/lib/appsec-tools-testable.ts` - Vitest-compatible tool logic re-exports with pure functions
- `src/types/appsec-output.ts` - Frontend TypeScript types for AppSec output
- `supabase/migrations/20260327400001_appsec_agent_tables.sql` - appsec_findings table with lifecycle status
- `src/lib/__tests__/appsec-schemas.test.ts` - 39 schema validation tests
- `src/lib/__tests__/appsec-agent.test.ts` - 45 agent handler, tool, manifest parser, and structural parity tests
- `src/lib/__tests__/appsec-migration.test.ts` - 20 structural migration tests
- `supabase/functions/_shared/ciso-tools.ts` - Extended with delegateToAppSec tool and AppSec delegation prompt rules
- `src/lib/ciso-tools.ts` - Node mirror updated with matching CISO_TOOL_NAMES and AppSec delegation prompt
- `src/lib/__tests__/ciso-agent.test.ts` - Updated to validate delegateToAppSec, AppSec delegation, and AppSec Edge Function structure

## Decisions Made
- **maxSteps: 8 for AppSec agent:** Consistent with SOC, Threat Intel, and IR agents (Pitfall 5). Limits multi-step tool usage to stay within the 150-second Edge Function timeout.
- **Informational risk_level for AppSec:** Unlike IR (which hardcodes risk_level='high'), AppSec findings are informational -- the delegateToAppSec tool does NOT override risk_level. This means AppSec tasks proceed automatically without mandatory human approval.
- **CISO prompt append-only:** Added AppSec Engineer Delegation rules as a new section appended to existing CISO_SYSTEM_PROMPT after IR Delegation. Did NOT rewrite existing GRC, SOC, Threat Intel, or IR delegation rules.
- **JSON-key-aware regex patterns:** CONFIG_SECURITY_RULES patterns include optional trailing quote before colon (`["']?\s*[=:]`) to reliably detect patterns in both JSON (`"key": "value"`) and INI/env (`key=value`) config formats.
- **Pure function manifest parsing:** parseDependencyManifest dispatches by manifest_type and is fully testable without database dependencies.
- **Tool-based persistence:** AppSec agent stores findings via createAppSecFinding during execution. No separate storeResult function needed -- same pattern as SOC, Threat Intel, and IR.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- CONFIG_SECURITY_RULES regex patterns initially failed to detect patterns in JSON configs because they did not account for quoted keys. Fixed by adding optional trailing quote (`["']?`) before the colon/equals matcher in HARDCODED_SECRET and CORS_WILDCARD patterns.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AppSec agent operational with dependency scanning, configuration review, and security report generation
- CISO Orchestrator can now delegate to GRC, SOC, Threat Intel, IR, and AppSec -- 5 specialist agents in hub-and-spoke topology
- appsec_findings table ready for compliance dashboard integration
- CONFIG_SECURITY_RULES extensible for future rule additions
- parseDependencyManifest extensible for additional manifest types
- Phase 6 can continue with Pen Test agent (06-03)

## Self-Check: PASSED

- 11/11 created files exist
- 3/3 modified files verified
- 2/2 commits verified (85d0978, 98879ee)
- 609/609 tests passing (full suite)

---
*Phase: 06-advanced-agents*
*Completed: 2026-03-27*
