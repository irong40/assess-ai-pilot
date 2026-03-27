# Phase 3: Dashboards and Compliance Outputs - Research

**Researched:** 2026-03-26
**Domain:** Dashboard UI, compliance visualization, document export, evidence management, Supabase Realtime
**Confidence:** HIGH

## Summary

Phase 3 transforms the agent analysis outputs from Phase 2 into user-facing dashboards and audit-ready document exports. The codebase already has substantial infrastructure to build on: `useAgentTasks` and `useCisoTaskQueue` TanStack Query hooks for agent data, `compliance_snapshots` and `gap_analysis_results` tables for compliance metrics, an `agent_approvals` table with Realtime broadcast for approval notifications, the `FileUpload` component and `assessment-documents` storage bucket, existing Recharts charting in `DashboardCharts.tsx`, and the `AIInsightsDashboard` component that already consumes GRC output. The existing `AuditPackageSectionSchema` Zod schema already defines SSP structure organized by the 14 NIST 800-171 control families.

The primary work divides into four areas: (1) Agent Dashboard -- surfacing real-time agent status, activity logs with reasoning, and approve/reject actions; (2) Compliance Dashboard -- visualizing SPRS score, family-level progress, and trend over time from `compliance_snapshots`; (3) Evidence Management -- a new `control_evidence` join table linking uploaded documents to specific controls; and (4) Document Export -- generating SSP, POA&M, and evidence matrix as downloadable files using client-side generation with `jspdf` + `jspdf-autotable`. For drift monitoring, pg_cron scheduling of periodic CISO assessments is the proven pattern already established in Phase 1 for the agent-worker.

**Primary recommendation:** Build on every existing hook, table, and component. No new backend AI logic is needed -- this phase is pure UI construction, database joins for evidence, client-side document generation, and a pg_cron scheduled job for drift monitoring.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | View real-time status of all 7 agents (running, idle, waiting for approval) | `useAgentTasks` hook exists; add Supabase Realtime subscription on `agent_tasks` table for live updates; render status cards per agent type |
| DASH-02 | View agent activity logs with AI reasoning | `agent_tasks.reasoning_summary` field already populated by agents; query with `useAgentTasks` + detail view via `useAgentTaskDetail` |
| DASH-03 | Approve or reject pending agent actions from dashboard | `agent_approvals` table with RLS (admin/issm only for UPDATE); `notify_approval_needed` Realtime broadcast already exists; build approve/reject mutation hook |
| DASH-04 | Configure agent settings (thresholds, notification preferences) | New `agent_settings` table scoped by company_id + agent_type; simple form persisting JSON config |
| REPT-01 | View compliance maturity score across all CMMC domains | `compliance_snapshots.family_scores` JSONB has per-family scores; `sprs_score` for overall; Recharts RadarChart or grouped BarChart |
| REPT-02 | View domain-level progress (percentage per security domain) | Same `family_scores` data; 14 control families from `controls` table; Progress bars or horizontal BarChart |
| REPT-03 | View compliance trend over time (readiness trajectory) | `compliance_snapshots` table with `created_at` time-series index; Recharts AreaChart/LineChart over time |
| REPT-04 | CISO agent generates board-ready executive summary | CISO `generate-executive-summary` action already exists from Phase 2; surface output as formatted card/printable view |
| REPT-05 | System continuously monitors compliance posture and alerts on drift | pg_cron scheduled CISO assessment (weekly/monthly); compare latest two snapshots; if SPRS delta exceeds threshold, create notification |
| REPT-06 | User can schedule periodic compliance re-assessments | `reassessment_schedule` table (company_id, cron_expression, cmmc_level, enabled); pg_cron job reads schedule and dispatches CISO tasks |
| CMMC-06 | Upload evidence documents and associate with specific CMMC controls | New `control_evidence` join table (document_id, control_id, company_id); extend existing `DocumentUpload` with control selector |
| CMMC-07 | Track evidence completeness per control | Query `controls` LEFT JOIN `control_evidence` grouped by control_id; compute coverage ratio per family |
| CMMC-08 | Export audit-ready SSP document | `AuditPackageSectionSchema` already defines SSP structure per family; `gap_analysis_results.report` has implementation data; generate with jsPDF |
| CMMC-09 | Export POA&M package with CMMC control references | `poam_entries` table + `gap_analysis_results` findings; export matching NotebookLM-defined POA&M structure (7 required fields) |
| CMMC-10 | Export evidence matrix mapping documents to controls | Query `control_evidence` joined with `controls` and `document_embeddings`; render as table, export as PDF/CSV |
</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | 2.12 | All chart visualizations (SPRS trend, family progress, risk distribution) | Already used in DashboardCharts.tsx; composable React components over SVG |
| TanStack Query | 5.56 | Data fetching for all dashboard data | Established pattern -- every data access via custom hooks |
| shadcn/ui | latest | All UI components (Card, Table, Tabs, Badge, Dialog, Sheet, Progress, DataTable) | Established pattern -- all UI built on Radix primitives via shadcn |
| Zod | 3.23 | Export data validation, form schemas | Established pattern for schema validation |
| date-fns | 3.6 | Date formatting for time-series, scheduling | Already in dependencies |
| @supabase/supabase-js | 2.49 | Realtime subscriptions, storage, queries | Primary BaaS client |

### New Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jspdf | 2.5+ | Client-side PDF generation for SSP, POA&M, evidence matrix | Document export (CMMC-08, CMMC-09, CMMC-10) |
| jspdf-autotable | 3.8+ | Table generation inside jsPDF PDFs | Structured tables in exported documents |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jspdf | html2pdf.js | html2pdf renders DOM to canvas first (slower, layout-dependent); jspdf gives programmatic control needed for structured compliance docs |
| jspdf | Server-side PDF (Edge Function) | Deno Edge Functions have limited library support; client-side avoids API latency and keeps document data local |
| Supabase Realtime | Polling with refetchInterval | Realtime gives instant updates; polling adds latency and wasted requests |
| Recharts RadarChart | Custom SVG | Recharts handles all the math; radar chart is built-in for multi-domain visualization |

**Installation:**
```bash
npm install jspdf jspdf-autotable
npm install -D @types/jspdf @types/jspdf-autotable
```

Note: Check if `@types/jspdf` is needed -- jspdf 2.5+ bundles its own TypeScript types. Install only if type resolution fails.

## Architecture Patterns

### Recommended Project Structure

```
src/
  pages/
    AgentDashboard.tsx          # DASH-01 through DASH-04
    ComplianceDashboard.tsx     # REPT-01 through REPT-03
    EvidenceManagement.tsx      # CMMC-06, CMMC-07
  components/
    agents/
      AgentStatusGrid.tsx       # 7-agent status card grid (DASH-01)
      AgentActivityLog.tsx      # Activity log with reasoning (DASH-02)
      ApprovalQueue.tsx         # Pending approvals list (DASH-03)
      AgentSettingsForm.tsx     # Settings per agent (DASH-04)
    compliance/
      SprsScoreCard.tsx         # Large SPRS score display (REPT-01)
      FamilyProgressChart.tsx   # 14-family progress bars/chart (REPT-02)
      ComplianceTrendChart.tsx  # Time-series line/area chart (REPT-03)
      ExecutiveSummaryView.tsx  # Formatted CISO summary (REPT-04)
      DriftAlertBanner.tsx      # Compliance drift alert (REPT-05)
    evidence/
      EvidenceUpload.tsx        # Upload + control association (CMMC-06)
      EvidenceCompleteness.tsx  # Coverage tracker per control (CMMC-07)
      EvidenceMatrixTable.tsx   # Full evidence-to-control grid (CMMC-10)
    export/
      SspExporter.ts            # SSP PDF generation logic (CMMC-08)
      PoamExporter.ts           # POA&M PDF generation logic (CMMC-09)
      EvidenceMatrixExporter.ts # Evidence matrix PDF/CSV (CMMC-10)
  hooks/
    useComplianceSnapshots.ts   # Query compliance_snapshots time-series
    useControlEvidence.ts       # Query control_evidence join
    useAgentApprovals.ts        # Query + mutate agent_approvals
    useRealtimeAgentStatus.ts   # Supabase Realtime subscription
    useReassessmentSchedule.ts  # Schedule CRUD
  services/
    exportService.ts            # Coordinates PDF generation
supabase/
  migrations/
    YYYYMMDD_evidence_tables.sql     # control_evidence table
    YYYYMMDD_agent_settings.sql      # agent_settings table
    YYYYMMDD_reassessment.sql        # reassessment_schedule + pg_cron
```

### Pattern 1: Supabase Realtime for Agent Status

**What:** Subscribe to `agent_tasks` table changes to update dashboard in real-time without polling.
**When to use:** Agent Dashboard page -- show live status transitions (pending -> running -> completed).

```typescript
// Source: Supabase Realtime docs
// src/hooks/useRealtimeAgentStatus.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeAgentStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('agent-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',           // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'agent_tasks',
        },
        () => {
          // Invalidate TanStack Query cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['ciso-task-queue'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

**CRITICAL prerequisite:** Enable Realtime on the `agent_tasks` table in Supabase Dashboard (Database > Replication > enable for `agent_tasks`). Same for `agent_approvals` if subscribing to approval updates.

### Pattern 2: Compliance Snapshot Time-Series Hook

**What:** Query compliance_snapshots for trend chart data, ordered by time.
**When to use:** Compliance dashboard trend view (REPT-03).

```typescript
// src/hooks/useComplianceSnapshots.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ComplianceSnapshot } from '@/types/grc-output';

interface SnapshotRow {
  id: string;
  sprs_score: number;
  met_count: number;
  not_met_count: number;
  total_controls: number;
  family_scores: Record<string, number>;
  created_at: string;
}

export function useComplianceSnapshots(limit = 20) {
  return useQuery({
    queryKey: ['compliance-snapshots', limit] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_snapshots')
        .select('id, sprs_score, met_count, not_met_count, total_controls, family_scores, created_at')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as SnapshotRow[];
    },
  });
}
```

### Pattern 3: Client-Side PDF Export

**What:** Generate structured PDF documents from database data without server round-trip.
**When to use:** SSP, POA&M, and evidence matrix exports (CMMC-08, CMMC-09, CMMC-10).

```typescript
// src/components/export/SspExporter.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditPackageSection } from '@/types/grc-output';

export function generateSspPdf(
  sections: AuditPackageSection[],
  metadata: { companyName: string; assessmentDate: string; cmmcLevel: number }
): jsPDF {
  const doc = new jsPDF();

  // Cover page
  doc.setFontSize(24);
  doc.text('System Security Plan', 105, 40, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`${metadata.companyName}`, 105, 55, { align: 'center' });
  doc.text(`CMMC Level ${metadata.cmmcLevel}`, 105, 65, { align: 'center' });
  doc.text(`Assessment Date: ${metadata.assessmentDate}`, 105, 75, { align: 'center' });

  // One section per control family
  for (const section of sections) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`${section.family_id} - ${section.family_name}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Control ID', 'Title', 'Status', 'Implementation Statement', 'Evidence']],
      body: section.controls.map(c => [
        c.control_id,
        c.title,
        c.status,
        c.implementation_statement,
        c.evidence_references.join(', '),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 18 },
        3: { cellWidth: 70 },
        4: { cellWidth: 40 },
      },
    });
  }

  return doc;
}
```

### Pattern 4: Evidence-Control Join Table

**What:** A junction table linking uploaded documents to specific CMMC controls for evidence tracking.
**When to use:** Evidence management (CMMC-06, CMMC-07, CMMC-10).

```sql
-- New migration: control_evidence join table
CREATE TABLE public.control_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,           -- e.g. "3.1.1" (matches controls.control_id)
  document_id TEXT NOT NULL,          -- matches document_embeddings.document_id
  document_name TEXT NOT NULL,        -- display name
  evidence_type TEXT NOT NULL DEFAULT 'examine',  -- examine|interview|test per NIST 800-171A
  notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for evidence completeness queries per company
CREATE INDEX idx_control_evidence_company_control
  ON public.control_evidence (company_id, control_id);

-- RLS
ALTER TABLE public.control_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company evidence"
  ON public.control_evidence FOR SELECT TO authenticated
  USING (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Users can insert evidence for their company"
  ON public.control_evidence FOR INSERT TO authenticated
  WITH CHECK (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "Users can delete their company evidence"
  ON public.control_evidence FOR DELETE TO authenticated
  USING (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()));
```

### Pattern 5: pg_cron Scheduled Drift Monitoring

**What:** Schedule periodic CISO assessments via pg_cron that invoke the agent-worker Edge Function.
**When to use:** Compliance drift monitoring (REPT-05) and scheduled re-assessments (REPT-06).

```sql
-- Create a reassessment schedule table for user-configurable schedules
CREATE TABLE public.reassessment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cmmc_level INT NOT NULL CHECK (cmmc_level IN (1, 2)),
  cron_expression TEXT NOT NULL DEFAULT '0 0 * * 1', -- weekly Monday midnight
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)  -- one schedule per company for v1
);

-- pg_cron job checks for due reassessments (runs every hour)
-- Calls a Postgres function that inserts agent_tasks for due companies
SELECT cron.schedule(
  'check-reassessment-schedules',
  '0 * * * *',  -- hourly check
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'scheduled_check', true,
      'action', 'check-reassessment-schedules'
    )
  );
  $$
);
```

### Anti-Patterns to Avoid

- **Polling agent status with setInterval:** Use Supabase Realtime subscriptions instead. Polling wastes bandwidth and adds latency.
- **Generating PDFs on the server (Edge Functions):** Deno runtime has limited library support for PDF. Client-side jsPDF is proven and avoids API call overhead.
- **Building a custom charting solution:** Recharts is already in the stack and handles all needed chart types (Line, Area, Bar, Radar, Pie).
- **Storing evidence files in a separate bucket per control:** Use a single `assessment-documents` bucket (already exists) with a join table for control associations. One document can map to multiple controls.
- **Duplicating GRC output for export:** The `gap_analysis_results.report` JSONB already contains the structured data. The SSP exporter should read it directly, not re-query the agent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom PDF renderer / canvas-to-PDF | jspdf + jspdf-autotable | PDF spec is complex; auto-table handles page breaks, column widths, multi-page tables automatically |
| Real-time data sync | setInterval polling / WebSocket from scratch | Supabase Realtime channels | Already integrated with Supabase auth, handles reconnection, built-in for postgres_changes |
| Data table with sorting/filtering | Custom table implementation | shadcn DataTable (TanStack Table v8) | Handles pagination, column sorting, filtering, row selection; well-integrated with shadcn |
| Time-series charts | D3 from scratch | Recharts LineChart/AreaChart | Recharts wraps D3 with React components; already in stack; handles responsive resizing |
| CSV export | Manual string concatenation | Array.map + Blob + URL.createObjectURL | Simple pattern, but use proper CSV escaping (fields with commas need quoting) |
| Cron scheduling UI | Custom cron expression builder | Simple dropdown (weekly/monthly/daily) mapped to known cron expressions | Users don't need raw cron syntax; map friendly labels to expressions server-side |

**Key insight:** This phase has zero novel technical problems. Every piece is connecting existing infrastructure (agent outputs, database tables, UI components) to user-visible surfaces. The risk is in correctness of CMMC document structure, not in technology choices.

## Common Pitfalls

### Pitfall 1: Supabase Realtime Not Enabled on Table
**What goes wrong:** Subscribing to `postgres_changes` on `agent_tasks` silently produces no events.
**Why it happens:** Supabase Realtime requires explicitly enabling replication per table in the Dashboard or via SQL (`alter publication supabase_realtime add table agent_tasks`).
**How to avoid:** Include a migration or setup step that enables Realtime on `agent_tasks` and `agent_approvals`. Verify in Supabase Dashboard > Database > Replication.
**Warning signs:** Subscription connects (no error) but callback never fires.

### Pitfall 2: SSP Content Not Matching Assessor Expectations
**What goes wrong:** Generated SSP is too generic ("We implement access controls") instead of specific ("MFA via Yubikey with 12-character passwords").
**Why it happens:** GRC agent implementation_statement field may contain generic language. The SSP export should surface what the agent wrote but also flag vague statements.
**How to avoid:** Per the NotebookLM research, SSP must have "highly specific implementation details" and "direct evidence referencing." Add a quality check that flags statements shorter than 50 characters or lacking tool/product names as "needs review."
**Warning signs:** Every implementation_statement reads as a policy statement rather than a technical description.

### Pitfall 3: POA&M Export Missing Required Fields
**What goes wrong:** Exported POA&M is rejected by assessors because it lacks required fields.
**Why it happens:** The NotebookLM research specifies 7 required fields; developers may omit resources_required or scheduled_due_dates thinking they're optional.
**How to avoid:** Use the POA&M structure from the research verbatim: control_identifier, current_state/weakness, risk_impact, remediation_action_and_milestones, resources_required, owner, scheduled_due_dates. Validate before export that no required field is empty.
**Warning signs:** Exported document has blank cells in the POA&M table.

### Pitfall 4: Evidence Completeness Counting Double
**What goes wrong:** One document linked to the same control twice (different upload events) inflates completeness metrics.
**Why it happens:** No UNIQUE constraint on (company_id, control_id, document_id) in the join table.
**How to avoid:** Add a UNIQUE constraint on `control_evidence(company_id, control_id, document_id)` and use `INSERT ... ON CONFLICT DO NOTHING` or check existence before insert.
**Warning signs:** Evidence completeness shows 120% for a control family.

### Pitfall 5: Recharts Performance with Many Snapshots
**What goes wrong:** Compliance trend chart lags with 100+ snapshots over months of assessments.
**Why it happens:** Recharts renders one SVG node per data point; too many points = slow rendering.
**How to avoid:** Limit query to last 20-30 snapshots by default. If historical data exceeds that, aggregate by week/month before charting. The `compliance_snapshots` query already has a `LIMIT` parameter.
**Warning signs:** Chart takes more than 500ms to render; browser becomes sluggish.

### Pitfall 6: Approval Actions Without Role Checking
**What goes wrong:** Regular users see approve/reject buttons but get 403 errors when clicking.
**Why it happens:** Frontend renders buttons for all users; RLS blocks the UPDATE on the database.
**How to avoid:** Check `useUserProfile().role` before rendering approve/reject actions. Only `admin` and `issm` roles can approve per the existing RLS policy.
**Warning signs:** Toast error "permission denied" on approve/reject click.

## Code Examples

### Recharts Compliance Trend (AreaChart with SPRS Score)

```typescript
// Source: Recharts API + existing DashboardCharts.tsx pattern
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TrendDataPoint {
  date: string;
  sprsScore: number;
  metCount: number;
}

function ComplianceTrendChart({ snapshots }: { snapshots: SnapshotRow[] }) {
  const data: TrendDataPoint[] = snapshots.map(s => ({
    date: format(new Date(s.created_at), 'MMM d'),
    sprsScore: s.sprs_score,
    metCount: s.met_count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <XAxis dataKey="date" />
        <YAxis domain={[-200, 110]} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="sprsScore"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

### Approval Action Hook

```typescript
// src/hooks/useAgentApprovals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['agent-approvals', 'pending'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_approvals')
        .select('*, agent_tasks(action, input, reasoning_summary)')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApprovalDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      approvalId,
      decision,
      reason,
    }: {
      approvalId: string;
      decision: 'approved' | 'rejected';
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('agent_approvals')
        .update({
          status: decision,
          decided_at: new Date().toISOString(),
          decision_reason: reason ?? null,
          decided_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', approvalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
    },
    onError: (error) => {
      toast({
        title: 'Decision failed',
        description: error instanceof Error ? error.message : 'Could not process decision',
        variant: 'destructive',
      });
    },
  });
}
```

### Family Progress from Compliance Snapshot

```typescript
// Transforms family_scores JSONB into chart-ready data
// The 14 NIST 800-171 control families
const NIST_FAMILIES = [
  { id: '3.1', name: 'Access Control' },
  { id: '3.2', name: 'Awareness & Training' },
  { id: '3.3', name: 'Audit & Accountability' },
  { id: '3.4', name: 'Configuration Management' },
  { id: '3.5', name: 'Identification & Authentication' },
  { id: '3.6', name: 'Incident Response' },
  { id: '3.7', name: 'Maintenance' },
  { id: '3.8', name: 'Media Protection' },
  { id: '3.9', name: 'Personnel Security' },
  { id: '3.10', name: 'Physical Protection' },
  { id: '3.11', name: 'Risk Assessment' },
  { id: '3.12', name: 'Security Assessment' },
  { id: '3.13', name: 'System & Communications Protection' },
  { id: '3.14', name: 'System & Information Integrity' },
];

function familyScoresToChartData(familyScores: Record<string, number>) {
  return NIST_FAMILIES.map(family => ({
    family: family.name,
    familyId: family.id,
    score: familyScores[family.id] ?? 0,
    // score is percentage 0-100 of controls met in this family
  }));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side PDF generation | Client-side jsPDF | 2024+ | No server dependency; works offline; faster for user |
| Polling for real-time updates | Supabase Realtime channels | Supabase 2.0+ | Native postgres_changes subscription; clean up via removeChannel |
| Custom chart implementations | Recharts composable components | Already in stack | Reduce code, leverage battle-tested SVG rendering |
| Manual evidence tracking spreadsheets | Join table + dashboard UI | This phase | Automated completeness tracking tied to actual uploads |

**Deprecated/outdated:**
- The existing `DashboardCharts.tsx` uses entirely mock data (hardcoded complianceData, riskData, trendData). This must be replaced with real data from `compliance_snapshots`.
- The existing `AIInsightsDashboard` already consumes real GRC output -- this is the model to follow for new dashboard components.
- The `averageComplianceScore = 82` hardcoded mock in `Dashboard.tsx` must be replaced with the latest `compliance_snapshots.sprs_score`.

## Open Questions

1. **POA&M Critical Controls Enforcement**
   - What we know: NotebookLM research says MFA, FIPS encryption, incident response, audit logging, and SSP cannot be deferred to POA&M. Minimum score of 80/110 required.
   - What's unclear: Whether the export should refuse to generate a POA&M for these controls or just flag them with a warning.
   - Recommendation: Flag with a prominent warning banner ("This control cannot be deferred per CMMC Level 2 rules") but still include in the export so the user sees the gap. The GRC agent already encodes these rules.

2. **Executive Summary Display (REPT-04)**
   - What we know: CISO agent's `generate-executive-summary` action produces structured output. This exists from Phase 2.
   - What's unclear: Whether it should be a separate page or embedded in the compliance dashboard.
   - Recommendation: Embed as a card/section in the compliance dashboard with a "Print" button for board-ready output.

3. **Agent Settings Scope (DASH-04)**
   - What we know: Users should configure thresholds and notification preferences.
   - What's unclear: What specific settings are meaningful for v1 when only GRC and CISO agents are active.
   - Recommendation: Keep simple for v1: notification preferences (email/in-app for approvals, drift alerts) and auto-approve threshold (risk_level below which actions auto-execute). Store as JSONB in `agent_settings` table keyed by company_id.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2 + @testing-library/react 16.3 |
| Config file | vitest.config.ts (jsdom environment, @/ alias) |
| Quick run command | `./node_modules/.bin/vitest run --bail 1` |
| Full suite command | `./node_modules/.bin/vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Agent status grid renders 7 agents with correct statuses | unit | `./node_modules/.bin/vitest run src/lib/__tests__/agent-dashboard.test.ts --bail 1` | Wave 0 |
| DASH-02 | Activity log displays reasoning_summary from task output | unit | `./node_modules/.bin/vitest run src/lib/__tests__/agent-dashboard.test.ts --bail 1` | Wave 0 |
| DASH-03 | Approval mutation sends correct status and decided_by | unit | `./node_modules/.bin/vitest run src/lib/__tests__/agent-approvals.test.ts --bail 1` | Wave 0 |
| DASH-04 | Agent settings CRUD persists and retrieves correctly | unit | `./node_modules/.bin/vitest run src/lib/__tests__/agent-settings.test.ts --bail 1` | Wave 0 |
| REPT-01 | SPRS score card renders from compliance_snapshot data | unit | `./node_modules/.bin/vitest run src/lib/__tests__/compliance-dashboard.test.ts --bail 1` | Wave 0 |
| REPT-02 | Family progress computes correct percentages from family_scores | unit | `./node_modules/.bin/vitest run src/lib/__tests__/compliance-dashboard.test.ts --bail 1` | Wave 0 |
| REPT-03 | Trend chart data transforms snapshots into time-series array | unit | `./node_modules/.bin/vitest run src/lib/__tests__/compliance-dashboard.test.ts --bail 1` | Wave 0 |
| REPT-04 | Executive summary renders CISO output fields | unit | `./node_modules/.bin/vitest run src/lib/__tests__/compliance-dashboard.test.ts --bail 1` | Wave 0 |
| REPT-05 | Drift detection compares two snapshots and returns delta | unit | `./node_modules/.bin/vitest run src/lib/__tests__/drift-monitor.test.ts --bail 1` | Wave 0 |
| REPT-06 | Reassessment schedule CRUD validates cron and persists | unit | `./node_modules/.bin/vitest run src/lib/__tests__/reassessment.test.ts --bail 1` | Wave 0 |
| CMMC-06 | Control evidence insert creates correct join record | unit | `./node_modules/.bin/vitest run src/lib/__tests__/evidence-management.test.ts --bail 1` | Wave 0 |
| CMMC-07 | Evidence completeness calculates coverage ratio per family | unit | `./node_modules/.bin/vitest run src/lib/__tests__/evidence-management.test.ts --bail 1` | Wave 0 |
| CMMC-08 | SSP PDF contains all 14 control family sections | unit | `./node_modules/.bin/vitest run src/lib/__tests__/ssp-export.test.ts --bail 1` | Wave 0 |
| CMMC-09 | POA&M PDF includes all 7 required fields per entry | unit | `./node_modules/.bin/vitest run src/lib/__tests__/poam-export.test.ts --bail 1` | Wave 0 |
| CMMC-10 | Evidence matrix CSV has correct columns and row count | unit | `./node_modules/.bin/vitest run src/lib/__tests__/evidence-matrix-export.test.ts --bail 1` | Wave 0 |

### Sampling Rate
- **Per task commit:** `./node_modules/.bin/vitest run --bail 1`
- **Per wave merge:** `./node_modules/.bin/vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/agent-dashboard.test.ts` -- covers DASH-01, DASH-02
- [ ] `src/lib/__tests__/agent-approvals.test.ts` -- covers DASH-03
- [ ] `src/lib/__tests__/agent-settings.test.ts` -- covers DASH-04
- [ ] `src/lib/__tests__/compliance-dashboard.test.ts` -- covers REPT-01, REPT-02, REPT-03, REPT-04
- [ ] `src/lib/__tests__/drift-monitor.test.ts` -- covers REPT-05
- [ ] `src/lib/__tests__/reassessment.test.ts` -- covers REPT-06
- [ ] `src/lib/__tests__/evidence-management.test.ts` -- covers CMMC-06, CMMC-07
- [ ] `src/lib/__tests__/ssp-export.test.ts` -- covers CMMC-08
- [ ] `src/lib/__tests__/poam-export.test.ts` -- covers CMMC-09
- [ ] `src/lib/__tests__/evidence-matrix-export.test.ts` -- covers CMMC-10
- [ ] Install jspdf + jspdf-autotable: `npm install jspdf jspdf-autotable`

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- All hooks, types, schemas, migrations, and components read directly from the project
- **NotebookLM CMMC Reference** -- `/d/Projects/assess-ai-pilot/.planning/research/NOTEBOOKLM-CMMC-REFERENCE.md` -- SSP structure (7 sections), POA&M required fields (7 fields), assessment methodology
- **Supabase Realtime docs** -- [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) -- postgres_changes channel API
- **Supabase pg_cron docs** -- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) -- cron.schedule + net.http_post pattern

### Secondary (MEDIUM confidence)
- **Recharts usage patterns** -- [PostHog Recharts tutorial](https://posthog.com/tutorials/recharts), [Ecosire dashboard guide](https://ecosire.com/blog/recharts-data-visualization-guide) -- verified against existing DashboardCharts.tsx in codebase
- **jsPDF + jspdf-autotable** -- [GitHub parallax/jsPDF](https://github.com/parallax/jsPDF), [npm jspdf](https://www.npmjs.com/package/jspdf) -- widely used, TypeScript typed, client-side only
- **shadcn/ui dashboard patterns** -- [shadcn dashboard tutorial](https://designrevision.com/blog/shadcn-dashboard-tutorial), [shadcn DataTable](https://ui.shadcn.com/docs/components/radix/data-table) -- verified against existing project usage

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core libraries already in project, only jspdf is new
- Architecture: HIGH -- patterns extend existing hooks/tables/components; no new paradigms
- Pitfalls: HIGH -- identified from codebase analysis (Realtime prereqs, RLS roles, mock data replacement)
- Document export structure: HIGH -- sourced from NotebookLM CMMC research which used official NIST/CMMC source documents

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- no fast-moving dependencies)
