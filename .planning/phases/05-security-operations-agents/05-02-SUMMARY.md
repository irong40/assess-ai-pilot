---
phase: 05-security-operations-agents
plan: 02
subsystem: agents
tags: [threat-intel, cve-analysis, cwe-mapping, ioc-tracking, attack-surface, cmmc, zod, edge-function, ciso-delegation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: agent-base.ts (executeAgentTask, delegateTask), agent-types.ts, controls table
  - phase: 02-core-agents
    provides: GRC Analyst agent, CISO Orchestrator with delegateToGRC, dual-module pattern, tool factory pattern
  - phase: 05-security-operations-agents
    provides: SOC Analyst agent (05-01), CISO delegateToSOC, soc_alerts table
provides:
  - Threat Intelligence Edge Function with generate-threat-brief/scan-iocs/map-attack-surface actions
  - 6 Threat Intel tools (queryRecentCVEs, getCompanyTechStack, saveThreatBrief, trackIOCs, getControlsByFamily, getCweToCmmcMapping)
  - CWE-to-CMMC-family heuristic mapping (20 entries covering common vulnerability categories)
  - Zod schemas for threat briefs, IOC tracking, attack surface mapping, analysis results
  - threat_briefs and ioc_tracking database tables with RLS, 90-day TTL, UNIQUE deduplication
  - CISO Orchestrator extended with delegateToThreatIntel tool
  - Frontend TypeScript types for Threat Intel output
affects: [06-incident-response]

# Tech tracking
tech-stack:
  added: []
  patterns: [CWE-to-CMMC heuristic mapping for threat-to-control correlation, IOC tracking with 90-day TTL and UNIQUE deduplication via ON CONFLICT]

key-files:
  created:
    - supabase/functions/agent-threat-intel/index.ts
    - supabase/functions/_shared/threat-intel-schemas.ts
    - supabase/functions/_shared/threat-intel-tools.ts
    - src/lib/threat-intel-schemas-frontend.ts
    - src/lib/threat-intel-tools-testable.ts
    - src/types/threat-intel-output.ts
    - supabase/migrations/20260327300001_threat_intel_tables.sql
    - src/lib/__tests__/threat-intel-schemas.test.ts
    - src/lib/__tests__/threat-intel-agent.test.ts
    - src/lib/__tests__/threat-intel-migration.test.ts
  modified:
    - supabase/functions/_shared/ciso-tools.ts
    - src/lib/ciso-tools.ts
    - src/lib/__tests__/ciso-agent.test.ts

key-decisions:
  - "CWE_TO_CMMC_FAMILY uses 20 entries (not 25+) per Pitfall 3 -- LLM reasons about unmapped CWEs using control descriptions"
  - "Threat Intel agent uses maxSteps: 8 consistent with SOC agent for Edge Function timeout avoidance"
  - "CISO delegation extension appends Threat Intel rules to existing prompt (does not rewrite) -- preserves GRC and SOC delegation rules"
  - "IOC deduplication via UNIQUE(company_id, indicator_type, indicator_value) with ON CONFLICT UPDATE last_seen"
  - "Threat briefs persist via saveThreatBrief tool during execution -- no separate storeResult needed (same pattern as SOC)"
  - "ioc_tracking.expires_at defaults to now() + 90 days for automatic TTL"

patterns-established:
  - "CWE-to-CMMC mapping: Record<string, { families: string[]; description: string }> with ~20 entries covering OWASP Top 10 and common vulnerability classes"
  - "IOC tracking with TTL: UNIQUE constraint for dedup, expires_at for cleanup, partial indexes for active-only queries"
  - "CISO delegation extension: add delegateToX tool, update CISO_TOOL_NAMES, append delegation rules to CISO_SYSTEM_PROMPT, add buildCisoPrompt cases"

requirements-completed: [THRT-01, THRT-02, THRT-03, THRT-04]

# Metrics
duration: 10min
completed: 2026-03-27
---

# Phase 5 Plan 02: Threat Intelligence Agent Summary

**Threat Intel agent with CWE-to-CMMC heuristic mapping, tech-stack-relevant threat briefs, IOC tracking with 90-day TTL, and CISO delegateToThreatIntel orchestration**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-27T20:38:14Z
- **Completed:** 2026-03-27T20:48:00Z
- **Tasks:** 2
- **Files created:** 10
- **Files modified:** 3

## Accomplishments
- Threat Intelligence Edge Function operational at supabase/functions/agent-threat-intel/index.ts following established agent skeleton with maxSteps: 8
- THREAT_INTEL_SYSTEM_PROMPT with enhanced CVE analysis methodology: tech stack relevance scoring, CWE-to-CMMC control mapping instructions, IOC extraction with confidence rating, and attack surface mapping from three data sources
- CWE_TO_CMMC_FAMILY: 20-entry heuristic mapping covering OWASP Top 10 and common CWE categories (CWE-79 XSS -> SI/SC, CWE-287 auth -> IA/AC, CWE-89 SQLi -> SI, etc.)
- 6 domain-specific tools (queryRecentCVEs with extended fields, getCompanyTechStack, saveThreatBrief, trackIOCs with ON CONFLICT dedup, getControlsByFamily, getCweToCmmcMapping) all scoped by company_id
- Zod schemas: ThreatBriefSchema with affected_controls array, IocEntrySchema with indicator types and confidence levels, AttackSurfaceSchema with risk_score, ThreatAnalysisResultSchema aggregating all output
- Database migration: threat_briefs (company-scoped threat reports with JSONB affected_controls) and ioc_tracking (IOCs with 90-day TTL, UNIQUE dedup constraint, partial indexes for active IOCs and expiry cleanup)
- CISO Orchestrator extended with delegateToThreatIntel tool alongside existing delegateToGRC and delegateToSOC -- hub-and-spoke topology maintained with 3 specialist agents
- 82 new tests across 4 test files (68 Threat Intel + 14 updated CISO), 391 total suite passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Threat Intel schemas, tools, CWE mapping, migration, and test suite**
   - `068d123` (feat: schemas, tools, CWE_TO_CMMC_FAMILY, migration, 68 tests passing)
2. **Task 2: Threat Intel Edge Function and CISO delegateToThreatIntel extension**
   - `bb4a473` (feat: Edge Function, CISO extension, 391 tests passing)

## Files Created/Modified
- `supabase/functions/agent-threat-intel/index.ts` - Threat Intel Edge Function handler (3 actions, maxSteps: 8)
- `supabase/functions/_shared/threat-intel-schemas.ts` - Deno Zod schemas for Threat Intel structured output
- `supabase/functions/_shared/threat-intel-tools.ts` - THREAT_INTEL_SYSTEM_PROMPT, CWE_TO_CMMC_FAMILY, 6 tool definitions, prompt builder (Deno)
- `src/lib/threat-intel-schemas-frontend.ts` - Vitest-compatible Zod schema re-exports
- `src/lib/threat-intel-tools-testable.ts` - Vitest-compatible tool logic re-exports
- `src/types/threat-intel-output.ts` - Frontend TypeScript types for Threat Intel output
- `supabase/migrations/20260327300001_threat_intel_tables.sql` - threat_briefs and ioc_tracking tables
- `src/lib/__tests__/threat-intel-schemas.test.ts` - 21 schema validation tests
- `src/lib/__tests__/threat-intel-agent.test.ts` - 22 agent handler, tool, and CWE mapping tests
- `src/lib/__tests__/threat-intel-migration.test.ts` - 25 structural migration tests
- `supabase/functions/_shared/ciso-tools.ts` - Extended with delegateToThreatIntel tool and Threat Intel delegation prompt rules
- `src/lib/ciso-tools.ts` - Node mirror updated with matching CISO_TOOL_NAMES and Threat Intel delegation prompt
- `src/lib/__tests__/ciso-agent.test.ts` - Updated to validate delegateToThreatIntel, Threat Intel delegation, and Edge Function structure

## Decisions Made
- **CWE_TO_CMMC_FAMILY with 20 entries:** Per research Pitfall 3, limited to 20 entries (not 50+). Covers OWASP Top 10, memory safety, crypto, and auth-related CWEs. The LLM reasons about unmapped CWEs using control family descriptions -- the mapping is a starting point, not exhaustive.
- **maxSteps: 8 for Threat Intel agent:** Consistent with SOC agent (Pitfall 5). Limits multi-step tool usage to stay within the 150-second Edge Function timeout.
- **CISO prompt append-only:** Added Threat Intel delegation rules as a new section appended to existing CISO_SYSTEM_PROMPT. Did NOT rewrite existing GRC or SOC delegation rules. Same pattern established in 05-01.
- **IOC deduplication via UNIQUE + ON CONFLICT:** ioc_tracking uses UNIQUE(company_id, indicator_type, indicator_value) so the trackIOCs tool can use upsert with ON CONFLICT to update last_seen for re-observed IOCs instead of creating duplicates.
- **90-day TTL default:** ioc_tracking.expires_at defaults to now() + INTERVAL '90 days'. Stale IOCs can be cleaned up via pg_cron (documented as SQL comment in migration).
- **Tool-based persistence:** Threat Intel agent stores briefs via saveThreatBrief and IOCs via trackIOCs tools during execution. No separate storeResult function needed -- same pattern as SOC.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 (Security Operations Agents) is now complete: SOC Analyst (05-01) + Threat Intel (05-02) both operational
- CISO Orchestrator can now delegate to GRC Analyst, SOC Analyst, and Threat Intel -- 3 specialist agents in hub-and-spoke topology
- threat_briefs table ready for correlation with soc_alerts via soc_alert_correlations.source_type='threat_brief'
- ioc_tracking enables cross-company IOC dedup and TTL-based lifecycle management
- CWE_TO_CMMC_FAMILY mapping available for future agents to use in threat-to-control correlation
- agent-worker already routes threat-intel to agent-threat-intel Edge Function (pre-registered)
- Phase 6 (Incident Response) can leverage: SOC escalation flags, Threat Intel briefs, IOC data, and attack surface assessments

## Self-Check: PASSED

- 10/10 files exist
- 2/2 commits verified (068d123, bb4a473)
- 391/391 tests passing (full suite)

---
*Phase: 05-security-operations-agents*
*Completed: 2026-03-27*
