-- Migration: Trial lifecycle and onboarding profiles
-- Plan: 04-01 (Onboarding and Access)
-- Adds trial columns to companies, creates onboarding_profiles table,
-- and updates handle_new_user trigger to create per-signup companies.

-- 1. Add trial and onboarding columns to companies
ALTER TABLE public.companies
  ADD COLUMN trial_ends_at TIMESTAMPTZ,
  ADD COLUMN trial_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (trial_status IN ('trial', 'active', 'expired', 'cancelled')),
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 2. Backfill existing companies (they skip onboarding)
UPDATE public.companies
SET
  trial_ends_at = created_at + interval '14 days',
  trial_status = 'trial',
  onboarding_completed = true
WHERE trial_ends_at IS NULL;

-- Now enforce NOT NULL
ALTER TABLE public.companies
  ALTER COLUMN trial_ends_at SET NOT NULL;

-- 3. Create onboarding_profiles table
CREATE TABLE public.onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  org_size TEXT,
  primary_tech_stack TEXT[] DEFAULT '{}',
  compliance_goals TEXT[] DEFAULT '{}',
  target_cmmc_level INT DEFAULT 1,
  system_name TEXT,
  environment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS on onboarding_profiles
ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: any user in the same company can read
CREATE POLICY "Users can view own company onboarding profile"
  ON public.onboarding_profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.company_id = onboarding_profiles.company_id
    )
  );

-- INSERT: admin users in the same company can create
CREATE POLICY "Admin users can create onboarding profile"
  ON public.onboarding_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.company_id = onboarding_profiles.company_id
        AND p.role = 'admin'
    )
  );

-- UPDATE: admin users in the same company can update
CREATE POLICY "Admin users can update onboarding profile"
  ON public.onboarding_profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.company_id = onboarding_profiles.company_id
        AND p.role = 'admin'
    )
  );

-- 5. Update handle_new_user trigger to create a NEW company per signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create a new company for each signup with 14-day trial
  INSERT INTO companies (name, description, trial_ends_at, trial_status, onboarding_completed)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)) || '''s Organization',
    'Created on signup',
    now() + interval '14 days',
    'trial',
    false
  )
  RETURNING id INTO new_company_id;

  -- Create profile for new user with admin role (they are the org owner)
  INSERT INTO public.profiles (id, email, company_id, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    new_company_id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'last_name',
    'admin'::user_role
  );

  RETURN new;
END;
$$;

-- Note: The trigger on_auth_user_created already exists pointing to handle_new_user().
-- No need to recreate the trigger since we are using CREATE OR REPLACE FUNCTION.
