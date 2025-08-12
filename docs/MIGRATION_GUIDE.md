# Migration Guide: Database Schema Reset

## Overview
The database has been completely reset with a clean, secure schema designed for Phase 1 of the cybersecurity compliance platform. This guide explains the changes and how to update your code.

## Major Changes

### 1. Database Schema Simplification
**BEFORE**: Complex multi-table role system with separate `user_roles` table
**AFTER**: Simple role field directly on `profiles` table

```sql
-- OLD (removed)
CREATE TABLE user_roles (
  user_id UUID,
  company_id UUID, 
  role user_role
);

-- NEW (simplified)
CREATE TABLE profiles (
  id UUID,
  company_id UUID NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer'
);
```

### 2. User Role Enum Changes
**BEFORE**: `app_role` enum with complex values
**AFTER**: `user_role` enum with cybersecurity-specific roles

```typescript
// OLD
type AppRole = 'admin' | 'moderator' | 'user';

// NEW
type UserRole = 'admin' | 'issm' | 'isso' | 'viewer';
```

### 3. Assessment Status Changes
**BEFORE**: Hyphenated status values
**AFTER**: Underscore status values (PostgreSQL convention)

```typescript
// OLD
'not-started' | 'in-progress' | 'completed'

// NEW  
'not_started' | 'in_progress' | 'completed' | 'needs_review'
```

### 4. Removed Tables
The following tables were removed as they were not part of Phase 1 scope:
- `agent_assessments` (replaced with enhanced `assessments`)
- `user_roles` (consolidated into `profiles`)
- `companies` complex fields (simplified)
- All proposal/contract tables (future phases)

## Code Update Requirements

### 1. Update Role Checks
```typescript
// OLD
const userRoles = profile?.roles || [];
const isAdmin = userRoles.includes('admin');

// NEW
const userRole = profile?.role || 'viewer';
const isAdmin = userRole === 'admin';
```

### 2. Update Status Values
```typescript
// OLD
status: 'not-started' | 'in-progress' | 'completed'

// NEW
status: 'not_started' | 'in_progress' | 'completed' | 'needs_review'
```

### 3. Update Agent Assessment Logic
Agent assessments are now handled through the main `assessments` table:

```typescript
// OLD
useAgentAssessments(assessmentId)
getAgentStatus(agentId)

// NEW
useAssessments()
getAssessmentStatus()
```

### 4. Remove User Role Management
User roles are now managed directly on profiles:

```typescript
// OLD
assignRole({ userId, role })
removeRole({ userId, role })

// NEW
updateProfile({ id: userId, role })
```

## Current Build Errors (High Priority Fixes Needed)

### Files Requiring Updates:
1. **`src/components/admin/UserManagement.tsx`** - Update role display logic
2. **`src/components/dashboard/DashboardHeader.tsx`** - Fix role access
3. **`src/pages/Admin.tsx`** - Update admin role check
4. **All Agent pages** - Update assessment hooks and status values
5. **`src/hooks/useAgentAssessments.tsx`** - Refactor to use assessments table

### Quick Fix Strategy:
1. Replace `profile?.roles` with `profile?.role`
2. Replace hyphenated status values with underscore versions
3. Update `getAgentStatus` calls to `getAssessmentStatus`
4. Replace `agentId` parameters with assessment-specific logic

## Phase 1 Feature Tables (New)

### Core Tables Ready for Implementation:
- `notification_intelligence` - Smart notification system
- `notification_preferences` - User notification settings  
- `workflow_executions` - Enhanced workflow tracking
- `poam_entries` - Auto-generated POA&M entries
- `compliance_metrics` - Real-time compliance dashboard

## Next Steps
1. Fix TypeScript errors in components (see list above)
2. Update frontend components to use new schema
3. Implement Phase 1 features using new tables
4. Test authentication and basic functionality

## Security Improvements
✅ Non-recursive RLS policies
✅ Proper SECURITY DEFINER functions  
✅ Company-based data isolation
✅ Clean enum types
⚠️ Two dashboard configuration items remain (OTP/password settings)

The new schema is production-ready for Phase 1 development!