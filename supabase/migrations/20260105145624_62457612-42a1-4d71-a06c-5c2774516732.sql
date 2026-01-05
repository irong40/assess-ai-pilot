-- ============================================================================
-- SENTINEL AI: Database Migrations for RAG & Audit Infrastructure
-- ============================================================================

-- 1. Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- DOCUMENT EMBEDDINGS TABLE (RAG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_id UUID NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536),
    token_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for filtering by company
CREATE INDEX IF NOT EXISTS idx_embeddings_company 
ON document_embeddings(company_id);

-- Index for filtering by document type
CREATE INDEX IF NOT EXISTS idx_embeddings_doc_type 
ON document_embeddings(document_type);

-- RLS for document_embeddings
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings for their company"
ON document_embeddings FOR SELECT
USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can insert embeddings for their company"
ON document_embeddings FOR INSERT
WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Service role can manage embeddings"
ON document_embeddings FOR ALL
USING (true);

-- ============================================================================
-- AUDIT LOG TABLE (Immutable trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    resource_name TEXT,
    details JSONB DEFAULT '{}',
    ai_reasoning TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by company and time
CREATE INDEX IF NOT EXISTS idx_audit_company_time 
ON audit_log(company_id, created_at DESC);

-- Index for querying by resource
CREATE INDEX IF NOT EXISTS idx_audit_resource 
ON audit_log(resource_type, resource_id);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_audit_user 
ON audit_log(user_id, created_at DESC);

-- RLS for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their company"
ON audit_log FOR SELECT
USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Service role can insert audit logs"
ON audit_log FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- RAG QUERY HISTORY (for analytics and improvement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rag_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    query_text TEXT NOT NULL,
    query_embedding vector(1536),
    retrieved_chunks UUID[],
    llm_response TEXT,
    llm_model TEXT DEFAULT 'gpt-4o-mini',
    token_usage JSONB,
    latency_ms INTEGER,
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_rag_queries_company_time 
ON rag_queries(company_id, created_at DESC);

-- RLS for rag_queries
ALTER TABLE rag_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own RAG queries"
ON rag_queries FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert RAG queries"
ON rag_queries FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RAG queries"
ON rag_queries FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- THREAT INTELLIGENCE TABLE (CVE data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'unknown')),
    cvss_score DECIMAL(3,1),
    cvss_vector TEXT,
    cwe_id TEXT,
    published_date DATE,
    last_modified DATE,
    source TEXT DEFAULT 'NVD',
    reference_urls JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    is_exploited BOOLEAN DEFAULT FALSE,
    patch_available BOOLEAN DEFAULT FALSE,
    priority_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching CVEs
CREATE INDEX IF NOT EXISTS idx_threat_intel_severity 
ON threat_intelligence(severity, cvss_score DESC);

CREATE INDEX IF NOT EXISTS idx_threat_intel_external_id 
ON threat_intelligence(external_id);

-- Full text search on title and description
CREATE INDEX IF NOT EXISTS idx_threat_intel_fts 
ON threat_intelligence 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- EXTEND POAM_ENTRIES TABLE
-- ============================================================================
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS finding_id UUID;
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS remediation_plan TEXT;
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]';
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS resources_required TEXT;
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS estimated_cost TEXT;
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS responsible_party TEXT;
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS scheduled_completion_date DATE;
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS actual_completion_date DATE;
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE poam_entries ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

-- Rename auto_generated to ai_generated if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'poam_entries' AND column_name = 'auto_generated') THEN
        ALTER TABLE poam_entries RENAME COLUMN auto_generated TO ai_generated;
    END IF;
END $$;

-- ============================================================================
-- FUNCTION: Log audit event (called from Edge Functions)
-- ============================================================================
CREATE OR REPLACE FUNCTION log_audit_event(
    p_company_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_ai_reasoning TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_log (
        company_id, user_id, action, resource_type, 
        resource_id, resource_name, details, ai_reasoning
    )
    VALUES (
        p_company_id, p_user_id, p_action, p_resource_type,
        p_resource_id, p_resource_name, p_details, p_ai_reasoning
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- ============================================================================
-- FUNCTION: Semantic search for RAG
-- ============================================================================
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_company_id UUID,
    match_count INT DEFAULT 5,
    match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_name TEXT,
    document_type TEXT,
    chunk_index INTEGER,
    chunk_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        de.document_name,
        de.document_type,
        de.chunk_index,
        de.chunk_text,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    WHERE de.company_id = match_company_id
      AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;