-- Backfill missing profiles for existing auth users
-- Link them to the Default Organization
INSERT INTO public.profiles (id, email, company_id, first_name, last_name, role)
SELECT 
  u.id,
  u.email,
  'bbbd39c0-30d5-4331-b085-6dee377d4d35'::uuid as company_id,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(u.email, '@', 1)) as first_name,
  u.raw_user_meta_data->>'last_name' as last_name,
  'admin'::user_role as role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Create or replace function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_company_id uuid;
BEGIN
  -- Get or create default company
  SELECT id INTO default_company_id FROM companies LIMIT 1;
  
  IF default_company_id IS NULL THEN
    INSERT INTO companies (name, description)
    VALUES ('Default Organization', 'Auto-created organization')
    RETURNING id INTO default_company_id;
  END IF;

  -- Create profile for new user
  INSERT INTO public.profiles (id, email, company_id, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    default_company_id,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'last_name',
    'viewer'::user_role
  );
  
  RETURN new;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();