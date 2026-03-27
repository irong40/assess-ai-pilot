-- Agent-Specific Permissions Matrix
-- Extends role-based access with granular per-agent-type permissions:
--   can_configure: create/update agent settings
--   can_approve: approve/reject agent actions
--   can_view_logs: view agent execution logs
--
-- Default matrix:
--   admin  = configure + approve + view_logs (all true)
--   issm   = approve + view_logs (can_configure = false)
--   isso   = view_logs only
--   viewer = none (all false)

-- 1. Create table
CREATE TABLE public.company_agent_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  agent_type public.agent_type NOT NULL,
  can_configure BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  can_view_logs BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, role, agent_type)
);

-- 2. Enable RLS
ALTER TABLE public.company_agent_permissions ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read permissions for their own company
CREATE POLICY "company_agent_permissions_select"
  ON public.company_agent_permissions
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- INSERT: only admin users in the same company
CREATE POLICY "company_agent_permissions_insert"
  ON public.company_agent_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- UPDATE: only admin users in the same company
CREATE POLICY "company_agent_permissions_update"
  ON public.company_agent_permissions
  FOR UPDATE
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    company_id = (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- DELETE: only admin users in the same company
CREATE POLICY "company_agent_permissions_delete"
  ON public.company_agent_permissions
  FOR DELETE
  TO authenticated
  USING (
    company_id = (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 3. Seed default permissions for ALL existing companies
-- 4 roles x 7 agent types = 28 rows per company
INSERT INTO public.company_agent_permissions
  (company_id, role, agent_type, can_configure, can_approve, can_view_logs)
SELECT
  c.id,
  r.role::public.user_role,
  a.agent_type::public.agent_type,
  CASE WHEN r.role = 'admin' THEN true ELSE false END,
  CASE WHEN r.role IN ('admin', 'issm') THEN true ELSE false END,
  CASE WHEN r.role IN ('admin', 'issm', 'isso') THEN true ELSE false END
FROM public.companies c
CROSS JOIN (VALUES ('admin'), ('issm'), ('isso'), ('viewer')) AS r(role)
CROSS JOIN (SELECT unnest(enum_range(NULL::public.agent_type)) AS agent_type) a
ON CONFLICT (company_id, role, agent_type) DO NOTHING;

-- 4. Trigger function: auto-seed permissions when a new company is created
CREATE OR REPLACE FUNCTION public.seed_agent_permissions_for_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.company_agent_permissions
    (company_id, role, agent_type, can_configure, can_approve, can_view_logs)
  SELECT
    NEW.id,
    r.role::public.user_role,
    a.agent_type::public.agent_type,
    CASE WHEN r.role = 'admin' THEN true ELSE false END,
    CASE WHEN r.role IN ('admin', 'issm') THEN true ELSE false END,
    CASE WHEN r.role IN ('admin', 'issm', 'isso') THEN true ELSE false END
  FROM (VALUES ('admin'), ('issm'), ('isso'), ('viewer')) AS r(role)
  CROSS JOIN (SELECT unnest(enum_range(NULL::public.agent_type)) AS agent_type) a
  ON CONFLICT (company_id, role, agent_type) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_agent_permissions
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_agent_permissions_for_company();
