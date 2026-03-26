-- Audit Trail Agent Fields Migration
-- Extends the existing audit_log table with agent-specific columns
-- for tracking AI agent decisions and reasoning.
-- Part of Phase 1 Plan 03: Approval Gates and CUI-free Data Architecture
--
-- New columns: agent_id, agent_type, reasoning_summary
-- Updates: log_audit_event RPC with new optional parameters

-- Add agent-specific columns to audit_log (all nullable for backward compatibility)
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agent_tasks(id),
  ADD COLUMN IF NOT EXISTS agent_type public.agent_type,
  ADD COLUMN IF NOT EXISTS reasoning_summary TEXT;

COMMENT ON COLUMN public.audit_log.agent_id IS
  'References the agent_task that generated this audit entry. NULL for non-agent actions.';
COMMENT ON COLUMN public.audit_log.agent_type IS
  'The type of agent that generated this entry. NULL for non-agent actions.';
COMMENT ON COLUMN public.audit_log.reasoning_summary IS
  'Summary of the AI reasoning behind this action. NULL for non-agent actions.';

-- Update the log_audit_event RPC to accept the new optional agent parameters.
-- This replaces the existing function with an overloaded version that includes
-- agent_id, agent_type, and reasoning_summary as optional parameters.
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_company_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ai_reasoning TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_agent_type public.agent_type DEFAULT NULL,
  p_reasoning_summary TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    company_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ai_reasoning,
    agent_id,
    agent_type,
    reasoning_summary
  ) VALUES (
    p_company_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ai_reasoning,
    p_agent_id,
    p_agent_type,
    p_reasoning_summary
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
