-- Agent Settings Migration
-- Creates the agent_settings table for per-company agent configuration.
-- Part of Phase 3 Plan 01: Agent Dashboard
--
-- Tables: agent_settings
-- Default settings shape: { notifications: { approval_needed: true, drift_alert: true, task_complete: false }, auto_approve_threshold: "low" }

CREATE TABLE public.agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{"notifications": {"approval_needed": true, "drift_alert": true, "task_complete": false}, "auto_approve_threshold": "low"}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_type)
);

COMMENT ON TABLE public.agent_settings IS
  'Per-company agent configuration. Each row stores notification preferences '
  'and auto-approve thresholds for a specific agent type (or "global" for company-wide defaults).';

-- Row Level Security
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users in the company can view settings
CREATE POLICY "Users view own company settings"
  ON public.agent_settings
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Admin and ISSM can insert/update/delete settings for their company
CREATE POLICY "Admin and ISSM manage settings"
  ON public.agent_settings
  FOR ALL
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );
