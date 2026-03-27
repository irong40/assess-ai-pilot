-- Reassessment Schedules table
--
-- Stores per-company recurring reassessment configuration.
-- The frontend writes frequency_label + cron_expression; a pg_cron job
-- (configured separately in Supabase Dashboard) reads enabled rows and
-- dispatches CISO assessment tasks on schedule.
--
-- NOTE: pg_cron setup requires Supabase Dashboard or manual SQL execution.
-- The following pg_cron command should be run in the SQL Editor:
--
--   SELECT cron.schedule(
--     'reassessment-dispatcher',
--     '*/15 * * * *',  -- check every 15 minutes
--     $$
--     SELECT net.http_post(
--       url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-worker',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--         'Content-Type', 'application/json'
--       ),
--       body := jsonb_build_object(
--         'action', 'check-reassessment-schedules'
--       )
--     )
--     $$
--   );

CREATE TABLE public.reassessment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cmmc_level INT NOT NULL CHECK (cmmc_level IN (1, 2)),
  cron_expression TEXT NOT NULL DEFAULT '0 0 * * 1',
  frequency_label TEXT NOT NULL DEFAULT 'weekly',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.reassessment_schedules ENABLE ROW LEVEL SECURITY;

-- Read policy: users can view their own company schedule
CREATE POLICY "Users view own company schedule"
  ON public.reassessment_schedules
  FOR SELECT TO authenticated
  USING (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()));

-- Write policy: admin/ISSM roles manage schedule
CREATE POLICY "Admin/ISSM manage schedule"
  ON public.reassessment_schedules
  FOR ALL TO authenticated
  USING (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()))
  WITH CHECK (company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()));

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION public.update_reassessment_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reassessment_schedules_updated_at
  BEFORE UPDATE ON public.reassessment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reassessment_schedules_updated_at();
