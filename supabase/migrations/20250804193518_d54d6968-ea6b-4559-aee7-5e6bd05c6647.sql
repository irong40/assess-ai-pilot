-- Phase 1: Critical Security Fixes

-- 1. Fix User Management Authorization - Add company-based filtering
-- Update profiles table to ensure proper company association
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

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid, company_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_roles.user_id = get_user_role.user_id
    AND user_roles.company_id = get_user_role.company_id;
$$;

-- 5. Add secure file upload storage policies
-- Create policies for assessment-documents bucket with proper isolation
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assessment-documents', 'assessment-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Remove existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Users can upload files to assessment-documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in assessment-documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from assessment-documents bucket" ON storage.objects;

-- Add secure storage policies with user isolation
CREATE POLICY "Users can upload files to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assessment-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND array_length(string_to_array(name, '/'), 1) = 2
);

CREATE POLICY "Users can view files in their own folder" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assessment-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete files from their own folder" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'assessment-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Add audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view audit logs for their company" 
ON public.security_audit_log
FOR SELECT
USING (
  company_id IN (
    SELECT ur.company_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- 7. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action_type text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Get user's company_id
  SELECT company_id INTO v_company_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  INSERT INTO public.security_audit_log (
    user_id,
    company_id,
    action_type,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    v_company_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$;