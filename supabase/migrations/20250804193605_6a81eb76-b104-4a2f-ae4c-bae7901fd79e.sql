-- Phase 1: Critical Security Fixes (Fixed)

-- 1. First, create a default company for users without one
DO $$
DECLARE
  default_company_id uuid;
BEGIN
  -- Create default company if it doesn't exist
  INSERT INTO public.companies (name, description)
  VALUES ('Default Organization', 'Default organization for users without assigned company')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO default_company_id;

  -- If the company already exists, get its ID
  IF default_company_id IS NULL THEN
    SELECT id INTO default_company_id FROM public.companies WHERE name = 'Default Organization';
  END IF;

  -- Update profiles with null company_id to use default company
  UPDATE public.profiles 
  SET company_id = default_company_id 
  WHERE company_id IS NULL;
END $$;

-- Now we can safely make company_id NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN company_id SET NOT NULL;

-- 2. Add company-based RLS policies for user_roles table
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their companies" ON public.user_roles;

CREATE POLICY "Company admins can manage roles within their company" 
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.company_id = user_roles.company_id 
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can view roles within their company only" 
ON public.user_roles
FOR SELECT
USING (
  company_id IN (
    SELECT p.company_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

-- 3. Update profiles RLS to include company-based filtering
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Company admins can view company profiles" 
ON public.profiles
FOR SELECT
USING (
  company_id IN (
    SELECT ur.company_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
  OR id = auth.uid()
);

-- 4. Fix SECURITY DEFINER functions with proper search_path
CREATE OR REPLACE FUNCTION public.has_company_permission(user_id uuid, company_id uuid, required_roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = has_company_permission.user_id
      AND user_roles.company_id = has_company_permission.company_id
      AND role = ANY(required_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;