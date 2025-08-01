-- =====================================================================================
-- SMART NOTIFICATION INTELLIGENCE - DATABASE SCHEMA (CORRECTED)
-- =====================================================================================

-- Create custom types for notification intelligence
CREATE TYPE notification_priority AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE notification_category AS ENUM (
  'security_incident', 
  'compliance_alert', 
  'system_status', 
  'assessment_update', 
  'threat_intelligence', 
  'user_action', 
  'general'
);
CREATE TYPE risk_level AS ENUM ('critical', 'high', 'medium', 'low', 'informational');
CREATE TYPE actionability AS ENUM ('immediate', 'within_24h', 'within_week', 'informational');
CREATE TYPE workflow_status AS ENUM ('running', 'completed', 'error', 'timeout');

-- =====================================================================================
-- NOTIFICATION INTELLIGENCE TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS notification_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Original notification data
  notification_type notification_category NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(255) NOT NULL DEFAULT 'sentinel-ai',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_role VARCHAR(50),
  raw_payload JSONB NOT NULL DEFAULT '{}',
  
  -- AI analysis results
  ai_priority notification_priority NOT NULL,
  category notification_category NOT NULL,
  actionability actionability NOT NULL,
  risk_level risk_level NOT NULL,
  reasoning TEXT NOT NULL,
  recommended_actions TEXT[] DEFAULT '{}',
  requires_immediate_attention BOOLEAN DEFAULT false,
  
  -- Correlation and context data
  correlation_data JSONB DEFAULT '{}',
  
  -- Processing metadata
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_version VARCHAR(10) DEFAULT '1.0',
  workflow_execution_id VARCHAR(255),
  
  -- Real-time delivery tracking
  real_time_sent BOOLEAN DEFAULT false,
  real_time_sent_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- WORKFLOW EXECUTIONS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Workflow identification
  workflow_type VARCHAR(100) NOT NULL,
  workflow_name VARCHAR(255),
  execution_id VARCHAR(255) UNIQUE, -- N8N execution ID
  
  -- Status tracking
  status workflow_status NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Data
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Company context
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Processing metrics
  processing_duration_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- NOTIFICATION PREFERENCES TABLE (for user customization)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Preference settings
  priority_threshold notification_priority DEFAULT '3',
  enabled_categories notification_category[] DEFAULT ARRAY['security_incident', 'compliance_alert', 'assessment_update']::notification_category[],
  
  -- Delivery preferences
  email_enabled BOOLEAN DEFAULT true,
  real_time_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Advanced settings
  correlation_enabled BOOLEAN DEFAULT true,
  ai_filtering_enabled BOOLEAN DEFAULT true,
  immediate_attention_override BOOLEAN DEFAULT true, -- Always show critical notifications
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, company_id)
);

-- =====================================================================================
-- NOTIFICATION CORRELATION TABLE (for tracking related notifications)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS notification_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Primary notification
  primary_notification_id UUID REFERENCES notification_intelligence(id) ON DELETE CASCADE,
  
  -- Related notification
  related_notification_id UUID REFERENCES notification_intelligence(id) ON DELETE CASCADE,
  
  -- Correlation details
  correlation_type VARCHAR(50) NOT NULL, -- 'similar_content', 'same_source', 'temporal', 'risk_related'
  correlation_score DECIMAL(3,2) CHECK (correlation_score >= 0 AND correlation_score <= 1),
  correlation_reason TEXT,
  
  -- Metadata
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detection_method VARCHAR(50) DEFAULT 'ai_analysis',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(primary_notification_id, related_notification_id)
);

-- =====================================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Notification intelligence indexes
CREATE INDEX IF NOT EXISTS idx_notification_intelligence_company_id ON notification_intelligence(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_intelligence_priority ON notification_intelligence(ai_priority);
CREATE INDEX IF NOT EXISTS idx_notification_intelligence_category ON notification_intelligence(category);
CREATE INDEX IF NOT EXISTS idx_notification_intelligence_timestamp ON notification_intelligence(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notification_intelligence_requires_attention ON notification_intelligence(requires_immediate_attention) WHERE requires_immediate_attention = true;
CREATE INDEX IF NOT EXISTS idx_notification_intelligence_real_time ON notification_intelligence(real_time_sent, company_id);

-- Workflow executions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_type ON workflow_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_company_id ON workflow_executions(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_execution_id ON workflow_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_company ON notification_preferences(user_id, company_id);

-- Correlation indexes
CREATE INDEX IF NOT EXISTS idx_notification_correlations_primary ON notification_correlations(primary_notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_correlations_related ON notification_correlations(related_notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_correlations_score ON notification_correlations(correlation_score DESC);

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE notification_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_correlations ENABLE ROW LEVEL SECURITY;

-- Notification intelligence policies
CREATE POLICY "Users can view notifications from their company" ON notification_intelligence
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert notifications" ON notification_intelligence
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update notifications" ON notification_intelligence
  FOR UPDATE USING (true);

-- Workflow executions policies
CREATE POLICY "Users can view workflow executions from their company" ON workflow_executions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage workflow executions" ON workflow_executions
  FOR ALL USING (true);

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Correlation policies
CREATE POLICY "Users can view correlations for their company notifications" ON notification_correlations
  FOR SELECT USING (
    primary_notification_id IN (
      SELECT id FROM notification_intelligence 
      WHERE company_id IN (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- =====================================================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================================================

-- Triggers for updated_at (using existing function)
CREATE TRIGGER update_notification_intelligence_updated_at 
  BEFORE UPDATE ON notification_intelligence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at 
  BEFORE UPDATE ON workflow_executions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate processing duration
CREATE OR REPLACE FUNCTION calculate_workflow_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'error', 'timeout') AND NEW.completed_at IS NOT NULL THEN
    NEW.processing_duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_workflow_executions_duration 
  BEFORE UPDATE ON workflow_executions 
  FOR EACH ROW EXECUTE FUNCTION calculate_workflow_duration();

-- =====================================================================================
-- INITIAL DATA
-- =====================================================================================

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, company_id, priority_threshold, enabled_categories)
SELECT 
  p.id,
  p.company_id,
  '3'::notification_priority,
  ARRAY['security_incident', 'compliance_alert', 'assessment_update']::notification_category[]
FROM profiles p
WHERE p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.user_id = p.id AND np.company_id = p.company_id
  );

-- =====================================================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================================================

-- View for high priority notifications
CREATE OR REPLACE VIEW high_priority_notifications AS
SELECT 
  ni.*,
  CONCAT(p.first_name, ' ', p.last_name) as user_name,
  c.name as company_name
FROM notification_intelligence ni
LEFT JOIN profiles p ON p.company_id = ni.company_id
LEFT JOIN companies c ON c.id = ni.company_id
WHERE ni.ai_priority >= '4'::notification_priority
  OR ni.requires_immediate_attention = true
ORDER BY ni.timestamp DESC;

-- View for workflow execution summary
CREATE OR REPLACE VIEW workflow_execution_summary AS
SELECT 
  workflow_type,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
  COUNT(*) FILTER (WHERE status = 'error') as failed_executions,
  AVG(processing_duration_ms) as avg_duration_ms,
  SUM(tokens_used) as total_tokens_used,
  MAX(started_at) as last_execution
FROM workflow_executions
GROUP BY workflow_type
ORDER BY total_executions DESC;

-- =====================================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================================

COMMENT ON TABLE notification_intelligence IS 'Stores AI-processed notifications with priority scoring and categorization';
COMMENT ON TABLE workflow_executions IS 'Tracks N8N workflow execution status and performance metrics';
COMMENT ON TABLE notification_preferences IS 'User-specific notification delivery and filtering preferences';
COMMENT ON TABLE notification_correlations IS 'Relationships between related notifications for context';

COMMENT ON COLUMN notification_intelligence.ai_priority IS 'AI-assigned priority from 1 (lowest) to 5 (highest)';
COMMENT ON COLUMN notification_intelligence.correlation_data IS 'JSON data about related notifications and context';
COMMENT ON COLUMN workflow_executions.processing_duration_ms IS 'Time taken for workflow execution in milliseconds';
COMMENT ON COLUMN notification_preferences.immediate_attention_override IS 'Always show critical notifications regardless of other settings';