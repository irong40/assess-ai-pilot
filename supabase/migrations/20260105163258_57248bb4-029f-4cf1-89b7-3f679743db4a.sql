-- Phase 1: Questionnaire-Based Self-Assessment Schema
-- Creates tables for questions, responses, and auto-generated findings

-- 1. Create question response type enum
CREATE TYPE public.question_response_type AS ENUM (
  'yes_no',
  'yes_no_partial',
  'yes_no_na',
  'scale',
  'text'
);

-- 2. Create finding status enum
CREATE TYPE public.finding_status AS ENUM (
  'open',
  'in_progress',
  'remediated',
  'accepted'
);

-- 3. Create assessment_questions table (question bank)
CREATE TABLE public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id TEXT NOT NULL,
  domain_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  help_text TEXT,
  control_id TEXT NOT NULL,
  response_type public.question_response_type NOT NULL DEFAULT 'yes_no_partial',
  risk_weight INTEGER NOT NULL DEFAULT 5 CHECK (risk_weight >= 1 AND risk_weight <= 10),
  order_index INTEGER NOT NULL DEFAULT 0,
  finding_template TEXT,
  remediation_template TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient domain queries
CREATE INDEX idx_assessment_questions_domain ON public.assessment_questions(domain_id, order_index);
CREATE INDEX idx_assessment_questions_control ON public.assessment_questions(control_id);

-- 4. Create assessment_responses table (user answers)
CREATE TABLE public.assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  response_value TEXT NOT NULL,
  notes TEXT,
  creates_finding BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, question_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_assessment_responses_assessment ON public.assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_company ON public.assessment_responses(company_id);
CREATE INDEX idx_assessment_responses_finding ON public.assessment_responses(creates_finding) WHERE creates_finding = true;

-- 5. Create assessment_findings table (auto-generated gaps)
CREATE TABLE public.assessment_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE RESTRICT,
  response_id UUID REFERENCES public.assessment_responses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  severity public.risk_level NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  status public.finding_status NOT NULL DEFAULT 'open',
  poam_entry_id UUID REFERENCES public.poam_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_assessment_findings_assessment ON public.assessment_findings(assessment_id);
CREATE INDEX idx_assessment_findings_company ON public.assessment_findings(company_id);
CREATE INDEX idx_assessment_findings_status ON public.assessment_findings(status);
CREATE INDEX idx_assessment_findings_severity ON public.assessment_findings(severity);

-- 6. Add wizard progress columns to assessments table
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS current_domain TEXT,
  ADD COLUMN IF NOT EXISTS completed_domains JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS domain_scores JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS overall_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS wizard_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wizard_completed_at TIMESTAMPTZ;

-- 7. Enable RLS on new tables
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_findings ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for assessment_questions (public read, admin write)
CREATE POLICY "Questions are publicly readable"
  ON public.assessment_questions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage questions"
  ON public.assessment_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- 9. RLS Policies for assessment_responses (company scoped)
CREATE POLICY "Users can view their company responses"
  ON public.assessment_responses
  FOR SELECT
  USING (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert responses for their company"
  ON public.assessment_responses
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company responses"
  ON public.assessment_responses
  FOR UPDATE
  USING (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company responses"
  ON public.assessment_responses
  FOR DELETE
  USING (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- 10. RLS Policies for assessment_findings (company scoped)
CREATE POLICY "Users can view their company findings"
  ON public.assessment_findings
  FOR SELECT
  USING (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert findings for their company"
  ON public.assessment_findings
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company findings"
  ON public.assessment_findings
  FOR UPDATE
  USING (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company findings"
  ON public.assessment_findings
  FOR DELETE
  USING (
    company_id = (
      SELECT profiles.company_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- 11. Create updated_at triggers
CREATE TRIGGER update_assessment_questions_updated_at
  BEFORE UPDATE ON public.assessment_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_responses_updated_at
  BEFORE UPDATE ON public.assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_findings_updated_at
  BEFORE UPDATE ON public.assessment_findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Add comments for documentation
COMMENT ON TABLE public.assessment_questions IS 'Question bank for self-assessment wizard (80-100 questions across 8 security domains)';
COMMENT ON TABLE public.assessment_responses IS 'User responses to assessment questions';
COMMENT ON TABLE public.assessment_findings IS 'Auto-generated findings/gaps from questionnaire responses';
COMMENT ON COLUMN public.assessments.current_domain IS 'Current domain being assessed in wizard';
COMMENT ON COLUMN public.assessments.completed_domains IS 'Array of completed domain IDs';
COMMENT ON COLUMN public.assessments.domain_scores IS 'Object with compliance scores per domain';
COMMENT ON COLUMN public.assessments.overall_score IS 'Calculated overall compliance score (0-100)';