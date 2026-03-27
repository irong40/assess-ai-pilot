-- AppSec Engineer Agent Tables
-- Creates appsec_findings for tracking dependency vulnerabilities,
-- configuration misconfigurations, hardcoded secrets, and deprecated packages.

-- =================================================================
-- Table: appsec_findings
-- Stores AppSec findings with finding type classification, severity,
-- fix suggestions, CVE references, and CMMC control mapping.
-- Each finding links to a company (multi-tenant) and an agent task.
-- =================================================================
CREATE TABLE appsec_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  finding_type TEXT NOT NULL CHECK (finding_type IN (
    'dependency_vulnerability', 'config_misconfiguration', 'hardcoded_secret', 'deprecated_package'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  affected_component TEXT NOT NULL,
  fix_suggestion TEXT NOT NULL,
  fix_version TEXT,
  cve_id TEXT,
  cmmc_controls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'fixed', 'accepted_risk', 'false_positive'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_appsec_findings_company_status ON appsec_findings(company_id, status);
CREATE INDEX idx_appsec_findings_company_severity ON appsec_findings(company_id, severity);
CREATE INDEX idx_appsec_findings_cve_id ON appsec_findings(cve_id);

-- RLS
ALTER TABLE appsec_findings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read findings for their own company
CREATE POLICY "Users can view own company AppSec findings"
  ON appsec_findings FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Service role can insert (agent writes)
CREATE POLICY "Service role can insert AppSec findings"
  ON appsec_findings FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update (agent updates status)
CREATE POLICY "Service role can update AppSec findings"
  ON appsec_findings FOR UPDATE
  USING (true);
