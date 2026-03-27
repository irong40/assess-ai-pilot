-- control_evidence: join table linking uploaded evidence documents to CMMC controls.
-- Enables evidence completeness tracking and evidence matrix reporting.
-- UNIQUE constraint prevents double-counting the same document for the same control.

CREATE TABLE public.control_evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  control_id  TEXT NOT NULL,
  document_id TEXT NOT NULL,
  document_name TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT 'examine'
    CHECK (evidence_type IN ('examine', 'interview', 'test')),
  notes       TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent double-counting: same document cannot be evidence for same control twice
  UNIQUE (company_id, control_id, document_id)
);

-- Performance index for completeness queries (group by company + control)
CREATE INDEX idx_control_evidence_company_control
  ON public.control_evidence (company_id, control_id);

-- Enable RLS
ALTER TABLE public.control_evidence ENABLE ROW LEVEL SECURITY;

-- SELECT policy: authenticated users can read evidence for their company
CREATE POLICY "Users can view evidence for their company"
  ON public.control_evidence FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- INSERT policy: authenticated users can add evidence for their company
CREATE POLICY "Users can add evidence for their company"
  ON public.control_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- DELETE policy: authenticated users can remove evidence for their company
CREATE POLICY "Users can delete evidence for their company"
  ON public.control_evidence FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );
