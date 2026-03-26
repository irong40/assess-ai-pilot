-- Approval Gates Migration
-- Creates the agent_approvals table and supporting functions for human-in-the-loop
-- approval of high-risk agent actions.
-- Part of Phase 1 Plan 03: Approval Gates and CUI-free Data Architecture
--
-- Tables: agent_approvals
-- Enums: approval_status
-- Functions: notify_approval_needed (Realtime Broadcast)
-- Indexes: (company_id, status), (task_id)

-- Approval status enum for the approval gate state machine
-- pending -> approved|rejected
-- approved -> executed
-- rejected -> cancelled
-- expired -> cancelled (checked by application, not DB)
CREATE TYPE public.approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired',
  'executed',
  'cancelled'
);

-- Agent approvals table: tracks human approval decisions for high-risk agent actions
CREATE TABLE public.agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_type public.agent_type NOT NULL,
  action_description TEXT NOT NULL,
  risk_level public.agent_risk_level NOT NULL,
  status public.approval_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  decided_by UUID REFERENCES public.profiles(id),
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agent_approvals IS
  'Tracks human approval decisions for high-risk agent actions. '
  'Only actions classified as high risk require approval. '
  'Approvals expire after 24 hours if no decision is made.';

-- Indexes for common query patterns
-- Dashboard: list pending approvals for a company
CREATE INDEX idx_agent_approvals_company_status
  ON public.agent_approvals (company_id, status);

-- Lookup: find approval for a specific task
CREATE INDEX idx_agent_approvals_task
  ON public.agent_approvals (task_id);

-- Row Level Security
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;

-- All authenticated users in the company can view approvals
CREATE POLICY "Users can view their company approvals"
  ON public.agent_approvals
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Only admin and issm can update (approve/reject) approvals
CREATE POLICY "Admin and ISSM can update approvals"
  ON public.agent_approvals
  FOR UPDATE
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    ) IN ('admin', 'issm')
  )
  WITH CHECK (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    ) IN ('admin', 'issm')
  );

-- Insert policy for service role (Edge Functions create approval requests)
-- Authenticated users can also create approvals for their company
CREATE POLICY "Users can create approvals for their company"
  ON public.agent_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Realtime notification function: broadcasts approval_needed event
-- Called by server-side approval gate when a high-risk action needs approval
CREATE OR REPLACE FUNCTION public.notify_approval_needed(
  p_company_id UUID,
  p_approval_id UUID,
  p_agent_type TEXT,
  p_action_description TEXT,
  p_risk_level TEXT
) RETURNS void AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object(
      'approval_id', p_approval_id,
      'agent_type', p_agent_type,
      'action', p_action_description,
      'risk_level', p_risk_level,
      'company_id', p_company_id
    ),
    'approval_needed',
    'company:' || p_company_id::text,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (Edge Functions use service role anyway)
GRANT EXECUTE ON FUNCTION public.notify_approval_needed TO authenticated;
