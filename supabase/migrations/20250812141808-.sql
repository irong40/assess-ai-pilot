-- Fix Security Linter Issues
-- Fix SECURITY DEFINER functions with proper search_path

-- Update all functions to include proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_workflow_duration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IN ('completed', 'error', 'timeout') AND NEW.completed_at IS NOT NULL THEN
    NEW.processing_duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    default_company_id UUID;
BEGIN
    -- Get or create default company
    SELECT id INTO default_company_id FROM public.companies WHERE name = 'Default Organization';
    
    IF default_company_id IS NULL THEN
        INSERT INTO public.companies (name, description)
        VALUES ('Default Organization', 'Default organization for new users')
        RETURNING id INTO default_company_id;
    END IF;
    
    -- Insert profile
    INSERT INTO public.profiles (id, company_id, email, first_name, last_name)
    VALUES (
        NEW.id,
        default_company_id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_role(user_id UUID)
RETURNS public.user_role 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$$;