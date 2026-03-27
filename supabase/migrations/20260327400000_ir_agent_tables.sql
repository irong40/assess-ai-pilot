-- Incident Response Agent Tables
-- Creates ir_incidents for tracking the full IR lifecycle from SOC escalation
-- through containment, eradication, recovery, and post-incident reporting.

-- =================================================================
-- Table: ir_incidents
-- Stores IR incidents with lifecycle status tracking, containment plans,
-- playbooks, and post-incident reports. Each incident links to a company
-- (multi-tenant), an agent task, and optionally to a SOC alert.
-- =================================================================
CREATE TABLE ir_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_task_id UUID REFERENCES agent_tasks(id),
  soc_alert_id UUID REFERENCES soc_alerts(id),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'malware', 'unauthorized_access', 'denial_of_service', 'data_breach',
    'insider_threat', 'supply_chain', 'misconfiguration', 'policy_violation', 'unknown'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed'
  )),
  containment_plan JSONB,
  playbook JSONB,
  post_incident_report JSONB,
  compliance_impact JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_ir_incidents_company_status ON ir_incidents(company_id, status);
CREATE INDEX idx_ir_incidents_company_created ON ir_incidents(company_id, created_at DESC);
CREATE INDEX idx_ir_incidents_soc_alert ON ir_incidents(soc_alert_id);

-- RLS
ALTER TABLE ir_incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read incidents for their own company
CREATE POLICY "Users can view own company IR incidents"
  ON ir_incidents FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Service role can insert (agent writes)
CREATE POLICY "Service role can insert IR incidents"
  ON ir_incidents FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update (agent updates status, containment plan, report)
CREATE POLICY "Service role can update IR incidents"
  ON ir_incidents FOR UPDATE
  USING (true);
