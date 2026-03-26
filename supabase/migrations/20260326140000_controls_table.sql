-- Migration: Create controls table for CMMC/NIST 800-171 Rev 2 control data
-- Phase 1, Plan 01: CMMC Control Data Seeding
--
-- The controls table stores public reference data (NIST 800-171 controls).
-- It is NOT scoped by company_id -- all tenants read the same NIST controls.
-- This is by design: CUI-free architecture per DATA-01.

CREATE TABLE IF NOT EXISTS controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id TEXT UNIQUE NOT NULL,           -- e.g. "3.1.1"
  family_id TEXT NOT NULL,                   -- e.g. "3.1"
  family_name TEXT NOT NULL,                 -- e.g. "Access Control"
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assessment_objectives TEXT[] NOT NULL DEFAULT '{}',
  cmmc_level INTEGER NOT NULL CHECK (cmmc_level IN (1, 2)),
  sprs_weight INTEGER NOT NULL DEFAULT 1 CHECK (sprs_weight IN (1, 3, 5)),
  nist_800_53_mapping TEXT[] DEFAULT '{}',
  framework TEXT NOT NULL DEFAULT 'NIST-800-171',
  framework_version TEXT NOT NULL DEFAULT 'r2',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Any authenticated user can SELECT controls (public reference data)
CREATE POLICY "controls_select_authenticated"
  ON controls
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_controls_control_id ON controls (control_id);
CREATE INDEX IF NOT EXISTS idx_controls_framework_level ON controls (framework, cmmc_level);

-- Comment on table purpose
COMMENT ON TABLE controls IS 'NIST 800-171 Rev 2 controls mapped to CMMC Levels 1 and 2. Public reference data, not tenant-scoped.';
