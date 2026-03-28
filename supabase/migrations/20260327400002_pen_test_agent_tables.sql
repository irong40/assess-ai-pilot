-- Pen Test Agent Tables
-- Creates pen_test_findings for tracking passive vulnerability discovery results.
-- Finding types: known_cve, version_mismatch, eol_software, missing_patch.
-- Supports CMMC controls 3.11.2 (scan for vulnerabilities) and 3.11.3 (remediate vulnerabilities).

-- =================================================================
-- Table: pen_test_findings
-- Stores Pen Test findings with finding type classification, risk rating,
-- exploitability score, business impact, remediation, and CMMC control mapping.
-- Each finding links to a company (multi-tenant), an agent task, and a
-- scan authorization record (double-gate: agent_permissions + approval).
-- =================================================================
CREATE TABLE pen_test_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  finding_type TEXT NOT NULL CHECK (finding_type IN (
    'known_cve', 'version_mismatch', 'eol_software', 'missing_patch'
  )),
  risk_rating TEXT NOT NULL CHECK (risk_rating IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  affected_technology TEXT NOT NULL,
  matched_cve_ids TEXT[] DEFAULT '{}',
  exploitability_score DECIMAL,
  business_impact TEXT NOT NULL,
  remediation TEXT NOT NULL,
  cmmc_controls TEXT[] DEFAULT '{}',
  scan_authorization_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'remediated', 'accepted_risk', 'false_positive'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_pen_test_findings_company_status ON pen_test_findings(company_id, status);
CREATE INDEX idx_pen_test_findings_company_risk_rating ON pen_test_findings(company_id, risk_rating);
CREATE INDEX idx_pen_test_findings_affected_technology ON pen_test_findings(affected_technology);

-- RLS
ALTER TABLE pen_test_findings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read findings for their own company
CREATE POLICY "Users can view own company Pen Test findings"
  ON pen_test_findings FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Service role can insert (agent writes)
CREATE POLICY "Service role can insert Pen Test findings"
  ON pen_test_findings FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update (agent updates status)
CREATE POLICY "Service role can update Pen Test findings"
  ON pen_test_findings FOR UPDATE
  USING (true);
