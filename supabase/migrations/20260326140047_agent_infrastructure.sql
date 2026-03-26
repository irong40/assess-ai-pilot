-- Agent Infrastructure Migration
-- Creates the core tables and types for the ASSESS-AI multi-agent system.
-- Part of Phase 1 Plan 02: Agent Runtime Infrastructure
--
-- Tables: agent_tasks
-- Enums: agent_type, task_status (agent-specific risk_level reuses existing enum)
-- Constraints: hub-and-spoke topology, delegation depth limit, RLS
-- Indexes: compound indexes for common query patterns

-- Agent type enum (uses underscores per Postgres convention)
-- Maps to TypeScript AgentType with hyphens: ciso-orchestrator -> ciso_orchestrator
CREATE TYPE public.agent_type AS ENUM (
  'ciso_orchestrator',
  'grc_analyst',
  'soc_analyst',
  'threat_intel',
  'incident_response',
  'appsec',
  'pen_test'
);

-- Task status enum for the agent task state machine
-- State transitions: pending -> running -> completed|failed|awaiting_approval
--                    awaiting_approval -> approved|rejected
--                    approved -> completed|failed
CREATE TYPE public.task_status AS ENUM (
  'pending',
  'running',
  'awaiting_approval',
  'approved',
  'rejected',
  'completed',
  'failed'
);

-- Agent-specific risk level (separate from the existing risk_level enum
-- which includes 'critical' for findings/threat intel).
-- Agent tasks use a simpler 3-level scale for approval routing.
CREATE TYPE public.agent_risk_level AS ENUM (
  'low',
  'medium',
  'high'
);

-- Agent tasks table: core state store for all agent work
CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_type public.agent_type NOT NULL,
  action TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  status public.task_status NOT NULL DEFAULT 'pending',
  risk_level public.agent_risk_level NOT NULL DEFAULT 'low',
  error TEXT,
  reasoning_summary TEXT,
  parent_task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  source_agent public.agent_type,
  delegation_depth INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Hub-and-spoke enforcement: only ciso_orchestrator can delegate tasks
  -- source_agent is NULL for direct (non-delegated) tasks
  CONSTRAINT hub_spoke_enforcement
    CHECK (source_agent IS NULL OR source_agent = 'ciso_orchestrator'),

  -- Delegation depth limit to prevent infinite delegation loops
  CONSTRAINT delegation_depth_limit
    CHECK (delegation_depth >= 0 AND delegation_depth <= 3)
);

-- Comment explaining the table purpose
COMMENT ON TABLE public.agent_tasks IS
  'Core state store for the ASSESS-AI multi-agent system. Each row represents '
  'a task assigned to one of 7 AI agents. Tasks follow a state machine: '
  'pending -> running -> completed|failed|awaiting_approval. Hub-and-spoke '
  'topology enforced via source_agent constraint.';

-- Indexes for common query patterns
-- Most frequent: list tasks for a company filtered by status
CREATE INDEX idx_agent_tasks_company_status
  ON public.agent_tasks (company_id, status);

-- Task chaining: find child tasks of a parent
CREATE INDEX idx_agent_tasks_parent
  ON public.agent_tasks (parent_task_id)
  WHERE parent_task_id IS NOT NULL;

-- Agent dashboard: list tasks by agent type and status
CREATE INDEX idx_agent_tasks_agent_status
  ON public.agent_tasks (agent_type, status);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_agent_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_tasks_updated_at();

-- Row Level Security
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can SELECT tasks for their company
CREATE POLICY "Users can view their company agent tasks"
  ON public.agent_tasks
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Authenticated users can INSERT tasks for their company
CREATE POLICY "Users can create agent tasks for their company"
  ON public.agent_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Authenticated users can UPDATE tasks for their company
CREATE POLICY "Users can update their company agent tasks"
  ON public.agent_tasks
  FOR UPDATE
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
