-- Threat Intelligence Agent Tables
-- Creates threat_briefs and ioc_tracking for strategic threat analysis,
-- CWE-to-CMMC control mapping, IOC tracking with TTL, and attack surface mapping.

-- =================================================================
-- Table: threat_briefs
-- Stores generated threat intelligence briefs with affected CMMC controls.
-- Each brief links to a company (multi-tenant) and an agent task.
-- affected_controls is JSONB containing control_id, family_id, threat_description, risk_level.
-- =================================================================
CREATE TABLE threat_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  title TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  threat_count INTEGER NOT NULL DEFAULT 0,
  affected_controls JSONB DEFAULT '[]',
  risk_summary JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying threat briefs by company, most recent first
CREATE INDEX idx_threat_briefs_company ON threat_briefs(company_id, generated_at DESC);

-- RLS
ALTER TABLE threat_briefs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read threat briefs for their own company
CREATE POLICY "Users can view own company threat briefs"
  ON threat_briefs FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Service role can insert (agent writes)
CREATE POLICY "Service role can insert threat briefs"
  ON threat_briefs FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update (agent updates)
CREATE POLICY "Service role can update threat briefs"
  ON threat_briefs FOR UPDATE
  USING (true);

-- =================================================================
-- Table: ioc_tracking
-- Tracks indicators of compromise (IOCs) extracted from threat analysis.
-- IOCs have a 90-day TTL via expires_at default.
-- UNIQUE constraint on (company_id, indicator_type, indicator_value) for deduplication.
-- ON CONFLICT updates last_seen for re-observed IOCs.
-- =================================================================
CREATE TABLE ioc_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  threat_brief_id UUID REFERENCES threat_briefs(id) ON DELETE SET NULL,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain', 'hash', 'url', 'email')),
  indicator_value TEXT NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  source_cve TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, indicator_type, indicator_value)
);

-- Partial index for active IOCs (most common query pattern)
CREATE INDEX idx_ioc_tracking_active ON ioc_tracking(company_id, indicator_type)
  WHERE is_active = true;

-- Index for IOC expiry cleanup (pg_cron or manual cleanup queries)
CREATE INDEX idx_ioc_tracking_expiry ON ioc_tracking(expires_at)
  WHERE is_active = true;

-- Index for lookups by threat brief
CREATE INDEX idx_ioc_tracking_brief ON ioc_tracking(threat_brief_id);

-- RLS
ALTER TABLE ioc_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read IOCs for their own company
CREATE POLICY "Users can view own company IOCs"
  ON ioc_tracking FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Service role can insert IOCs
CREATE POLICY "Service role can insert IOCs"
  ON ioc_tracking FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update IOCs (deduplication via ON CONFLICT)
CREATE POLICY "Service role can update IOCs"
  ON ioc_tracking FOR UPDATE
  USING (true);

-- Note: IOC TTL cleanup can be handled by pg_cron if available:
-- SELECT cron.schedule('cleanup-expired-iocs', '0 3 * * *',
--   $$UPDATE ioc_tracking SET is_active = false WHERE expires_at < now() AND is_active = true$$
-- );
