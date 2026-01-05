-- ============================================================================
-- RMF Document Type System Expansion
-- Adds comprehensive document type metadata for DCSA/RMF authorization packages
-- ============================================================================

-- Create document type metadata lookup table
CREATE TABLE IF NOT EXISTS public.document_type_metadata (
  type_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('core', 'policy', 'technical', 'agreement', 'assessment', 'reference')),
  icon_name TEXT NOT NULL,
  required_for_ato BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_type_metadata ENABLE ROW LEVEL SECURITY;

-- Public read access (reference data)
CREATE POLICY "Document type metadata is publicly readable"
  ON public.document_type_metadata FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Only admins can modify document type metadata"
  ON public.document_type_metadata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed document type metadata
INSERT INTO public.document_type_metadata (type_code, display_name, description, category, icon_name, required_for_ato, sort_order) VALUES
  -- Core Authorization Documents
  ('ssp', 'System Security Plan', 'Comprehensive security documentation describing system boundaries, controls, and implementation', 'core', 'FileText', true, 1),
  ('sar', 'Security Assessment Report', 'Results of security control assessment including findings and recommendations', 'core', 'ClipboardCheck', true, 2),
  ('poam', 'Plan of Action & Milestones', 'Documented plan for addressing security weaknesses and deficiencies', 'core', 'ListTodo', true, 3),
  ('ato', 'Authorization Decision', 'Official authorization to operate decision letter from AO', 'core', 'Award', true, 4),
  ('rar', 'Risk Assessment Report', 'Analysis of security risks and their potential impact', 'core', 'AlertTriangle', true, 5),
  ('cms', 'Continuous Monitoring Strategy', 'Ongoing assessment and authorization maintenance plan', 'core', 'Activity', false, 6),
  
  -- Security Policies & Procedures
  ('policy', 'Security Policy', 'Organizational security policies and standards', 'policy', 'Shield', false, 10),
  ('procedure', 'Procedure', 'Step-by-step operational procedures', 'policy', 'ClipboardList', false, 11),
  ('plan', 'Security Plan', 'Security-related plans (Contingency, IR, etc.)', 'policy', 'Map', false, 12),
  ('rup', 'Rules of Behavior', 'Acceptable use policies and user agreements', 'policy', 'Users', false, 13),
  
  -- Technical Documentation
  ('diagram', 'Network/Data Flow Diagram', 'System architecture and data flow visualizations', 'technical', 'Network', false, 20),
  ('inventory', 'Asset Inventory', 'Hardware and software asset documentation', 'technical', 'Package', false, 21),
  ('baseline', 'Security Baseline', 'Secure configuration standards and baselines', 'technical', 'Layers', false, 22),
  ('stig', 'STIG Checklist', 'Security Technical Implementation Guide compliance', 'technical', 'CheckSquare', false, 23),
  
  -- Agreements & External
  ('isa', 'Interconnection Security Agreement', 'Security agreements for system interconnections', 'agreement', 'Link', false, 30),
  ('mou', 'Memorandum of Understanding', 'Formal agreements between organizations', 'agreement', 'Handshake', false, 31),
  ('sla', 'Service Level Agreement', 'Service provider security requirements', 'agreement', 'FileCheck', false, 32),
  
  -- Assessment Artifacts
  ('scan_report', 'Vulnerability Scan Report', 'Automated vulnerability scanner results', 'assessment', 'Scan', false, 40),
  ('pentest', 'Penetration Test Report', 'Manual security testing results', 'assessment', 'Bug', false, 41),
  ('audit_report', 'Audit Report', 'Third-party security audit findings', 'assessment', 'FileSearch', false, 42),
  ('assessment', 'Assessment Document', 'General assessment documentation', 'assessment', 'ClipboardCheck', false, 43),
  ('finding', 'Security Finding', 'Individual security findings and observations', 'assessment', 'AlertCircle', false, 44),
  
  -- Reference Materials
  ('framework', 'Framework Reference', 'NIST, CMMC, FedRAMP framework documentation', 'reference', 'BookOpen', false, 50),
  ('guidance', 'Agency Guidance', 'Agency-specific guidance documents', 'reference', 'Info', false, 51),
  ('threat_intel', 'Threat Intelligence', 'Threat intelligence and vulnerability data', 'reference', 'ShieldAlert', false, 52),
  
  -- Other
  ('other', 'Other Document', 'Uncategorized documents', 'reference', 'File', false, 99)
ON CONFLICT (type_code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_name = EXCLUDED.icon_name,
  required_for_ato = EXCLUDED.required_for_ato,
  sort_order = EXCLUDED.sort_order;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_document_type_metadata_category 
  ON public.document_type_metadata(category);

-- Add index for ATO-required filtering
CREATE INDEX IF NOT EXISTS idx_document_type_metadata_ato_required 
  ON public.document_type_metadata(required_for_ato) WHERE required_for_ato = true;