-- COMPLETE DATABASE RESET - Phase 1 Clean Schema (Fixed Array Types)
-- This drops all existing tables and creates a clean, working schema

-- Drop all existing tables and dependencies
DROP VIEW IF EXISTS public.high_priority_notifications CASCADE;
DROP TABLE IF EXISTS public.notification_correlations CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notification_intelligence CASCADE;
DROP TABLE IF EXISTS public.workflow_executions CASCADE;
DROP TABLE IF EXISTS public.workflow_execution_summary CASCADE;
DROP TABLE IF EXISTS public.agent_assessments CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.proposal_sections CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.contract_signatures CASCADE;
DROP TABLE IF EXISTS public.contract_templates CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.company_past_performance CASCADE;
DROP TABLE IF EXISTS public.company_certifications CASCADE;
DROP TABLE IF EXISTS public.company_capabilities CASCADE;
DROP TABLE IF EXISTS public.company_naics CASCADE;
DROP TABLE IF EXISTS public.company_invitations CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.notification_priority CASCADE;
DROP TYPE IF EXISTS public.notification_category CASCADE;
DROP TYPE IF EXISTS public.actionability_level CASCADE;
DROP TYPE IF EXISTS public.risk_level CASCADE;
DROP TYPE IF EXISTS public.workflow_status CASCADE;
DROP TYPE IF EXISTS public.contract_status CASCADE;
DROP TYPE IF EXISTS public.proposal_status CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_company_permission(uuid, uuid, user_role[]) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_company_with_admin(text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_workflow_duration() CASCADE;

-- Create clean enums
CREATE TYPE public.user_role AS ENUM ('admin', 'issm', 'isso', 'viewer');
CREATE TYPE public.notification_type AS ENUM ('security_alert', 'compliance_finding', 'assessment_reminder', 'poam_update', 'system_status');
CREATE TYPE public.notification_priority AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE public.notification_category AS ENUM ('security_incident', 'compliance_alert', 'assessment_update', 'poam_reminder', 'system_maintenance');
CREATE TYPE public.actionability_level AS ENUM ('immediate', 'urgent', 'routine', 'informational');
CREATE TYPE public.risk_level AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.workflow_status AS ENUM ('running', 'completed', 'error', 'timeout');
CREATE TYPE public.assessment_status AS ENUM ('not_started', 'in_progress', 'completed', 'needs_review');

-- 1. COMPANIES TABLE
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PROFILES TABLE 
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role public.user_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ASSESSMENTS TABLE (Core functionality)
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    system_name TEXT NOT NULL,
    environment TEXT NOT NULL,
    compliance_scope TEXT NOT NULL,
    status public.assessment_status NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. NOTIFICATION_INTELLIGENCE TABLE (Phase 1 Core Feature)
CREATE TABLE public.notification_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    notification_type public.notification_type NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'sentinel-ai',
    ai_priority public.notification_priority NOT NULL,
    category public.notification_category NOT NULL,
    actionability public.actionability_level NOT NULL,
    risk_level public.risk_level NOT NULL,
    requires_immediate_attention BOOLEAN DEFAULT false,
    reasoning TEXT NOT NULL,
    recommended_actions TEXT[],
    raw_payload JSONB NOT NULL DEFAULT '{}',
    correlation_data JSONB DEFAULT '{}',
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    real_time_sent BOOLEAN DEFAULT false,
    real_time_sent_at TIMESTAMPTZ,
    workflow_execution_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. NOTIFICATION_PREFERENCES TABLE (Phase 1 Core Feature)
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    priority_threshold public.notification_priority DEFAULT '3',
    enabled_categories public.notification_category[],
    email_enabled BOOLEAN DEFAULT true,
    real_time_enabled BOOLEAN DEFAULT true,
    ai_filtering_enabled BOOLEAN DEFAULT true,
    immediate_attention_override BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- 6. WORKFLOW_EXECUTIONS TABLE (Phase 1 Core Feature)
CREATE TABLE public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    workflow_type VARCHAR(100) NOT NULL,
    workflow_name VARCHAR(255),
    execution_id VARCHAR(255),
    status public.workflow_status NOT NULL DEFAULT 'running',
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    processing_duration_ms INTEGER,
    tokens_used INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. POAM_ENTRIES TABLE (Phase 1 Core Feature)
CREATE TABLE public.poam_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    assessment_id UUID REFERENCES public.assessments(id),
    control_id TEXT NOT NULL,
    weakness_description TEXT NOT NULL,
    risk_level public.risk_level NOT NULL,
    planned_completion_date DATE NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'open',
    auto_generated BOOLEAN DEFAULT false,
    ai_confidence_score DECIMAL(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. COMPLIANCE_METRICS TABLE (Phase 1 Core Feature)
CREATE TABLE public.compliance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    assessment_id UUID REFERENCES public.assessments(id),
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(5,2) NOT NULL,
    target_value DECIMAL(5,2),
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create utility functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.calculate_workflow_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'error', 'timeout') AND NEW.completed_at IS NOT NULL THEN
    NEW.processing_duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user management function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for role checking
CREATE OR REPLACE FUNCTION public.get_user_company_role(user_id UUID)
RETURNS public.user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_intelligence_updated_at BEFORE UPDATE ON public.notification_intelligence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workflow_executions_updated_at BEFORE UPDATE ON public.workflow_executions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_poam_entries_updated_at BEFORE UPDATE ON public.poam_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER calculate_workflow_duration_trigger BEFORE UPDATE ON public.workflow_executions FOR EACH ROW EXECUTE FUNCTION public.calculate_workflow_duration();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poam_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_metrics ENABLE ROW LEVEL SECURITY;

-- SIMPLE, NON-RECURSIVE RLS POLICIES

-- Companies policies
CREATE POLICY "Users can view their company" ON public.companies
FOR SELECT USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update their company" ON public.companies
FOR UPDATE USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles policies  
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles  
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view company profiles" ON public.profiles
FOR SELECT USING (public.get_user_company_role(auth.uid()) = 'admin' AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Assessments policies
CREATE POLICY "Users can manage their company assessments" ON public.assessments
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Notification intelligence policies
CREATE POLICY "Users can view their company notifications" ON public.notification_intelligence
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Service role can manage notifications" ON public.notification_intelligence
FOR ALL USING (true);

-- Notification preferences policies
CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences
FOR ALL USING (user_id = auth.uid());

-- Workflow executions policies
CREATE POLICY "Users can view their company workflows" ON public.workflow_executions
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Service role can manage workflow executions" ON public.workflow_executions
FOR ALL USING (true);

-- POA&M entries policies  
CREATE POLICY "Users can manage their company poam entries" ON public.poam_entries
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Compliance metrics policies
CREATE POLICY "Users can view their company metrics" ON public.compliance_metrics
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ISSMs and ISSOs can manage compliance metrics" ON public.compliance_metrics
FOR ALL USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) 
    AND public.get_user_company_role(auth.uid()) IN ('issm', 'isso', 'admin')
);

-- Create high priority notifications view
CREATE VIEW public.high_priority_notifications AS
SELECT 
    ni.*,
    p.first_name || ' ' || p.last_name AS user_name,
    c.name AS company_name
FROM public.notification_intelligence ni
JOIN public.companies c ON ni.company_id = c.id
LEFT JOIN public.profiles p ON c.id = p.company_id AND p.role = 'admin'
WHERE ni.ai_priority IN ('1', '2') OR ni.requires_immediate_attention = true;

-- Insert default company if it doesn't exist
INSERT INTO public.companies (name, description) 
VALUES ('Default Organization', 'Default organization for new users')
ON CONFLICT DO NOTHING;