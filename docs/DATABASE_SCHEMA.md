# Database Schema Documentation

## Overview
This document describes the database schema for the cybersecurity compliance platform designed for ISSMs (Information System Security Managers) and ISSOs (Information System Security Officers). The schema supports Phase 1 features: Smart Notification Intelligence, Automated POA&M Generation, Enhanced Workflow Orchestration, and Real-Time Compliance Dashboard.

## Architecture Principles
- **Company-based multi-tenancy**: All data is scoped to companies
- **Role-based access control**: Users have roles (admin, issm, isso, viewer) within companies
- **Row Level Security (RLS)**: All tables have proper RLS policies for data isolation
- **Non-recursive policies**: All RLS policies avoid infinite recursion issues
- **Audit trails**: All tables include created_at and updated_at timestamps

## Enums

### `user_role`
User roles within a company:
- `admin` - Full administrative access
- `issm` - Information System Security Manager
- `isso` - Information System Security Officer  
- `viewer` - Read-only access

### `notification_type`
Types of security notifications:
- `security_alert` - Security incidents and alerts
- `compliance_finding` - Compliance violations or findings
- `assessment_reminder` - Assessment deadlines and reminders
- `poam_update` - POA&M status changes
- `system_status` - System health and status updates

### `notification_priority`
Priority levels (1 = highest, 5 = lowest):
- `1` - Critical (immediate attention required)
- `2` - High (urgent)
- `3` - Medium (routine)
- `4` - Low (informational)
- `5` - Lowest (background)

### `notification_category`
Notification categories for filtering:
- `security_incident` - Security breaches, threats
- `compliance_alert` - Compliance violations
- `assessment_update` - Assessment progress updates
- `poam_reminder` - POA&M deadlines and updates
- `system_maintenance` - System maintenance notifications

### `actionability_level`
How quickly action is needed:
- `immediate` - Action required within minutes/hours
- `urgent` - Action required within 24 hours
- `routine` - Action required within days/weeks
- `informational` - No action required

### `risk_level`
Risk assessment levels:
- `critical` - Critical risk requiring immediate action
- `high` - High risk requiring prompt action
- `medium` - Medium risk requiring planned action
- `low` - Low risk for monitoring

### `workflow_status`
Status of workflow executions:
- `running` - Currently executing
- `completed` - Successfully completed
- `error` - Failed with error
- `timeout` - Timed out during execution

### `assessment_status`
Status of security assessments:
- `not_started` - Not yet begun
- `in_progress` - Currently being conducted
- `completed` - Assessment finished
- `needs_review` - Requires review/approval

## Core Tables

### `companies`
Organization management table.

```sql
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose**: Central organization entity for multi-tenant architecture.

**Key Features**:
- Auto-generated UUID primary key
- Automatic timestamp management via triggers
- Simple structure for Phase 1 requirements

**RLS Policies**:
- Users can view their own company
- Admins can update their company

### `profiles`
User profile information linked to Supabase Auth.

```sql
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
```

**Purpose**: Extends Supabase Auth users with company association and roles.

**Key Features**:
- Direct reference to auth.users table
- Company-scoped user roles
- Automatic profile creation via trigger on user signup

**RLS Policies**:
- Users can view/update their own profile
- Admins can view company profiles
- Users can insert their own profile (signup)

### `assessments`
Core security assessment tracking.

```sql
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
```

**Purpose**: Track security assessments and their progress.

**Key Features**:
- Company and user scoped
- Tracks system being assessed
- Environment (prod, test, dev)
- Compliance framework scope
- Status tracking through assessment lifecycle

**RLS Policies**:
- Users can manage assessments within their company

## Phase 1 Feature Tables

### `notification_intelligence`
AI-powered smart notification system.

```sql
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
```

**Purpose**: Store AI-analyzed notifications with intelligent filtering and prioritization.

**Key Features**:
- AI-assigned priority and categorization
- Reasoning for AI decisions (explainable AI)
- Recommended actions from AI analysis
- Raw payload for audit trail
- Correlation data for related notifications
- Real-time delivery tracking

**RLS Policies**:
- Users can view notifications from their company
- Service role can manage all notifications (for AI processing)

### `notification_preferences`
User-specific notification settings.

```sql
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
```

**Purpose**: Manage user preferences for notification filtering and delivery.

**Key Features**:
- Priority threshold filtering
- Category-based filtering
- Multiple delivery channels
- AI filtering toggle
- Override for immediate attention items

**RLS Policies**:
- Users can manage their own preferences

### `workflow_executions`
Enhanced workflow tracking and orchestration.

```sql
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
```

**Purpose**: Track n8n workflow executions with AI decision logic.

**Key Features**:
- Workflow type classification
- Performance metrics (duration, tokens, API calls)
- Input/output data tracking
- Error handling and reporting
- Automatic duration calculation via trigger

**RLS Policies**:
- Users can view workflows from their company
- Service role can manage all workflow executions

### `poam_entries`
Automated Plan of Action & Milestones generation.

```sql
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
```

**Purpose**: Store POA&M entries with AI-generated templates and tracking.

**Key Features**:
- Links to assessments
- Control framework mapping
- Risk-based prioritization
- Assignment tracking
- AI generation indicators and confidence scores
- Status tracking

**RLS Policies**:
- Users can manage POA&M entries within their company

### `compliance_metrics`
Real-time compliance dashboard data.

```sql
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
```

**Purpose**: Store compliance health scores and metrics for dashboard visualization.

**Key Features**:
- Flexible metric types
- Target vs. actual tracking
- Time-series data for trends
- Assessment linkage

**RLS Policies**:
- Users can view metrics from their company
- ISSMs/ISSOs/Admins can manage metrics

## Views

### `high_priority_notifications`
Filtered view of high-priority notifications.

```sql
CREATE VIEW public.high_priority_notifications AS
SELECT 
    ni.*,
    p.first_name || ' ' || p.last_name AS user_name,
    c.name AS company_name
FROM public.notification_intelligence ni
JOIN public.companies c ON ni.company_id = c.id
LEFT JOIN public.profiles p ON c.id = p.company_id AND p.role = 'admin'
WHERE ni.ai_priority IN ('1', '2') OR ni.requires_immediate_attention = true;
```

**Purpose**: Provide quick access to critical notifications requiring immediate attention.

## Functions

### `handle_new_user()`
Trigger function for automatic profile creation.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
```

**Purpose**: Automatically create a profile when a user signs up through Supabase Auth.

**Behavior**:
- Creates default company if none exists
- Links new user to default company
- Extracts first/last name from user metadata

### `get_user_company_role(user_id UUID)`
Helper function for role-based access control.

```sql
CREATE OR REPLACE FUNCTION public.get_user_company_role(user_id UUID)
RETURNS public.user_role 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
```

**Purpose**: Safely retrieve user role for RLS policy evaluation.

### `update_updated_at_column()`
Generic trigger function for timestamp updates.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
```

**Purpose**: Automatically update `updated_at` timestamp on row modifications.

### `calculate_workflow_duration()`
Workflow performance tracking.

```sql
CREATE OR REPLACE FUNCTION public.calculate_workflow_duration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
```

**Purpose**: Calculate workflow execution duration when status changes to completed/error/timeout.

## Triggers

### Timestamp Triggers
Auto-update `updated_at` on all core tables:
- `update_companies_updated_at`
- `update_profiles_updated_at`
- `update_assessments_updated_at`
- `update_notification_intelligence_updated_at`
- `update_notification_preferences_updated_at`
- `update_workflow_executions_updated_at`
- `update_poam_entries_updated_at`

### Business Logic Triggers
- `calculate_workflow_duration_trigger` - Calculate workflow execution times
- `on_auth_user_created` - Create profile when user signs up

## Security Model

### Row Level Security (RLS)
All tables have RLS enabled with company-scoped access control.

### Key Security Patterns

1. **Company Isolation**: 
   ```sql
   company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
   ```

2. **Self-Access**: 
   ```sql
   id = auth.uid()
   ```

3. **Role-Based Access**:
   ```sql
   public.get_user_company_role(auth.uid()) = 'admin'
   ```

4. **Service Role Access**:
   ```sql
   true  -- For AI/system operations
   ```

### SECURITY DEFINER Functions
All functions use `SECURITY DEFINER` with `SET search_path = ''` to prevent privilege escalation attacks.

## Data Relationships

```
companies (1) ──── (many) profiles
    │                   │
    │                   └─── (many) assessments
    │                   └─── (many) notification_preferences
    │
    ├─── (many) notification_intelligence
    ├─── (many) workflow_executions  
    ├─── (many) poam_entries
    └─── (many) compliance_metrics

assessments (1) ──── (many) poam_entries
           (1) ──── (many) compliance_metrics

profiles (1) ──── (many) poam_entries [assigned_to]
```

## Phase 1 Implementation Status

### ✅ Completed
- Clean database schema with proper RLS
- Company-based multi-tenancy
- User role management
- Core assessment tracking
- Smart notification infrastructure
- Workflow execution tracking
- POA&M entry management
- Compliance metrics storage

### 🔄 Next Steps
1. Frontend components for Phase 1 features
2. AI integration for notification filtering
3. POA&M template generation
4. Compliance dashboard visualization
5. n8n workflow enhancements

### 📋 Outstanding Security Items
1. Configure Auth OTP expiry in Supabase dashboard
2. Enable leaked password protection in Supabase dashboard

## Migration History
- Initial schema creation with clean, non-recursive RLS policies
- Security fixes for SECURITY DEFINER functions with proper search_path
- All tables properly configured for Phase 1 cybersecurity compliance platform

This schema provides a solid foundation for the Phase 1 cybersecurity compliance platform while maintaining strict security boundaries and supporting future phase expansions.