-- Gap Analysis Results and Compliance Snapshots tables
-- Phase 2 Plan 01: GRC Analyst agent structured output storage
--
-- gap_analysis_results: stores full gap analysis reports produced by the GRC agent
-- compliance_snapshots: point-in-time compliance scores for time-series tracking
--
-- Both tables are tenant-scoped (company_id NOT NULL) with RLS enabled.
-- Only agents (service_role) can INSERT; users can SELECT their own company data.

-- =============================================================================
-- gap_analysis_results: structured gap analysis reports
-- =============================================================================

CREATE TABLE public.gap_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  agent_task_id UUID NOT NULL REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  cmmc_level INT NOT NULL CHECK (cmmc_level IN (1, 2)),
  scope_family_id TEXT,
  report JSONB NOT NULL,
  sprs_score_at_analysis INT NOT NULL,
  findings_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gap_analysis_results IS 'Structured gap analysis reports produced by the GRC Analyst agent. CUI-free: stores assessment metadata and compliance gap findings, not customer documents.';

-- Time-series index for querying a company''s analysis history
CREATE INDEX idx_gap_analysis_results_company_time
  ON public.gap_analysis_results (company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.gap_analysis_results ENABLE ROW LEVEL SECURITY;

-- Users can read their own company's gap analysis results
CREATE POLICY "gap_analysis_results_select_own_company"
  ON public.gap_analysis_results
  FOR SELECT
  USING (
    company_id IN (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Only service_role (agents) can insert gap analysis results
CREATE POLICY "gap_analysis_results_insert_service_role"
  ON public.gap_analysis_results
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- compliance_snapshots: point-in-time compliance scores
-- =============================================================================

CREATE TABLE public.compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  sprs_score INT NOT NULL,
  total_controls INT NOT NULL DEFAULT 110,
  met_count INT NOT NULL DEFAULT 0,
  not_met_count INT NOT NULL DEFAULT 0,
  not_applicable_count INT NOT NULL DEFAULT 0,
  cmmc_level INT NOT NULL CHECK (cmmc_level IN (1, 2)),
  family_scores JSONB NOT NULL DEFAULT '{}',
  critical_controls_met BOOLEAN NOT NULL DEFAULT false,
  poam_eligible BOOLEAN NOT NULL DEFAULT false,
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  agent_task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.compliance_snapshots IS 'Point-in-time compliance snapshots for time-series tracking. Created after each GRC analysis to track SPRS score progression, POA&M eligibility, and per-family compliance scores.';

-- Time-series index for querying a company''s compliance history
CREATE INDEX idx_compliance_snapshots_company_time
  ON public.compliance_snapshots (company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.compliance_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can read their own company's compliance snapshots
CREATE POLICY "compliance_snapshots_select_own_company"
  ON public.compliance_snapshots
  FOR SELECT
  USING (
    company_id IN (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Only service_role (agents) can insert compliance snapshots
CREATE POLICY "compliance_snapshots_insert_service_role"
  ON public.compliance_snapshots
  FOR INSERT
  WITH CHECK (true);
