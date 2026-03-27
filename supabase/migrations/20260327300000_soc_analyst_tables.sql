-- SOC Analyst Agent Tables
-- Creates soc_alerts and soc_alert_correlations for CVE triage,
-- false positive classification, and cross-source correlation.

-- =================================================================
-- Table: soc_alerts
-- Stores triaged CVE alerts with classification and escalation status.
-- Each alert links to a company (multi-tenant), an agent task, and
-- optionally to a threat_intelligence row for source tracing.
-- =================================================================
CREATE TABLE soc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  threat_intel_id UUID REFERENCES threat_intelligence(id),
  external_cve_id TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  cvss_score DECIMAL(3,1),
  tech_stack_match BOOLEAN NOT NULL DEFAULT false,
  relevance_score INTEGER NOT NULL DEFAULT 0 CHECK (relevance_score BETWEEN 0 AND 100),
  classification TEXT NOT NULL DEFAULT 'unclassified'
    CHECK (classification IN ('true_positive', 'false_positive', 'unclassified', 'needs_investigation')),
  classification_reasoning TEXT,
  escalation_status TEXT DEFAULT 'none'
    CHECK (escalation_status IN ('none', 'needs_ir_review', 'escalated_to_ciso', 'resolved')),
  affected_controls TEXT[] DEFAULT '{}',
  correlation_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_soc_alerts_company ON soc_alerts(company_id, created_at DESC);
CREATE INDEX idx_soc_alerts_classification ON soc_alerts(company_id, classification);
CREATE INDEX idx_soc_alerts_severity ON soc_alerts(company_id, severity, cvss_score DESC);
CREATE INDEX idx_soc_alerts_escalation ON soc_alerts(company_id, escalation_status)
  WHERE escalation_status != 'none';

-- RLS
ALTER TABLE soc_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read alerts for their own company
CREATE POLICY "Users can view own company SOC alerts"
  ON soc_alerts FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Service role can insert (agent writes)
CREATE POLICY "Service role can insert SOC alerts"
  ON soc_alerts FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update (agent updates classification)
CREATE POLICY "Service role can update SOC alerts"
  ON soc_alerts FOR UPDATE
  USING (true);

-- =================================================================
-- Table: soc_alert_correlations
-- Links SOC alerts to related findings from multiple data sources
-- (CVEs, assessment gaps, threat briefs, other SOC alerts).
-- =================================================================
CREATE TABLE soc_alert_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_alert_id UUID NOT NULL REFERENCES soc_alerts(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('cve', 'assessment_gap', 'threat_brief', 'soc_alert')),
  source_id UUID NOT NULL,
  relevance_score INTEGER DEFAULT 0 CHECK (relevance_score BETWEEN 0 AND 100),
  correlation_reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookups by alert
CREATE INDEX idx_soc_correlations_alert ON soc_alert_correlations(soc_alert_id);

-- RLS
ALTER TABLE soc_alert_correlations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read correlations for alerts they can see
CREATE POLICY "Users can view SOC alert correlations"
  ON soc_alert_correlations FOR SELECT
  USING (soc_alert_id IN (
    SELECT id FROM soc_alerts WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- Policy: Service role can insert correlations
CREATE POLICY "Service role can insert SOC correlations"
  ON soc_alert_correlations FOR INSERT
  WITH CHECK (true);
