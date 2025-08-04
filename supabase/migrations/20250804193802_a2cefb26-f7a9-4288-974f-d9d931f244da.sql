-- Phase 1: Critical Security Fixes (Fixed v2)

-- 1. First, handle profiles with null company_id
DO $$
DECLARE
  default_company_id uuid;
BEGIN
  -- Check if Default Organization already exists
  SELECT id INTO default_company_id FROM public.companies WHERE name = 'Default Organization';
  
  -- If not found, create it
  IF default_company_id IS NULL THEN
    INSERT INTO public.companies (name, description)
    VALUES ('Default Organization', 'Default organization for users without assigned company')
    RETURNING id INTO default_company_id;
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