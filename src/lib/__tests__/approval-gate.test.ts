import { describe, it, expect } from 'vitest';
import {
  classifyRisk,
  isApprovalRequired,
  APPROVAL_ROLES,
  APPROVAL_STATUS_TRANSITIONS,
} from '@/lib/approval-gate';
import type { AgentType, RiskLevel } from '@/types/agent';

describe('Approval Gate - Risk Classification', () => {
  describe('classifyRisk', () => {
    // High risk: destructive actions
    it('returns "high" for delete actions', () => {
      expect(classifyRisk('grc-analyst', 'delete_finding')).toBe('high');
    });

    it('returns "high" for modify_policy actions', () => {
      expect(classifyRisk('ciso-orchestrator', 'modify_policy')).toBe('high');
    });

    it('returns "high" for override_control actions', () => {
      expect(classifyRisk('grc-analyst', 'override_control')).toBe('high');
    });

    it('returns "high" for revoke actions', () => {
      expect(classifyRisk('soc-analyst', 'revoke_access')).toBe('high');
    });

    it('returns "high" for disable actions', () => {
      expect(classifyRisk('incident-response', 'disable_monitoring')).toBe('high');
    });

    // Medium risk: analytical actions
    it('returns "medium" for gap_analysis actions', () => {
      expect(classifyRisk('grc-analyst', 'analyze_gaps')).toBe('medium');
    });

    it('returns "medium" for generate_report actions', () => {
      expect(classifyRisk('grc-analyst', 'generate_report')).toBe('medium');
    });

    it('returns "medium" for assess actions', () => {
      expect(classifyRisk('grc-analyst', 'assess_compliance')).toBe('medium');
    });

    it('returns "medium" for report actions', () => {
      expect(classifyRisk('ciso-orchestrator', 'report_risk_posture')).toBe('medium');
    });

    // Low risk: read-only actions
    it('returns "low" for query actions', () => {
      expect(classifyRisk('grc-analyst', 'query_control')).toBe('low');
    });

    it('returns "low" for check_status actions', () => {
      expect(classifyRisk('soc-analyst', 'check_status')).toBe('low');
    });

    it('returns "low" for list actions', () => {
      expect(classifyRisk('threat-intel', 'list_threats')).toBe('low');
    });

    it('returns "low" for view actions', () => {
      expect(classifyRisk('grc-analyst', 'view_assessment')).toBe('low');
    });

    // Default behavior for unknown actions
    it('returns "medium" for unknown actions', () => {
      expect(classifyRisk('grc-analyst', 'unknown_action_xyz')).toBe('medium');
    });

    // Works for all agent types
    it('classifies risk consistently across agent types', () => {
      const agentTypes: AgentType[] = [
        'ciso-orchestrator',
        'grc-analyst',
        'soc-analyst',
        'threat-intel',
        'incident-response',
        'appsec',
        'pen-test',
      ];

      for (const agentType of agentTypes) {
        expect(classifyRisk(agentType, 'delete_item')).toBe('high');
        expect(classifyRisk(agentType, 'query_data')).toBe('low');
        expect(classifyRisk(agentType, 'analyze_results')).toBe('medium');
      }
    });
  });

  describe('isApprovalRequired', () => {
    it('returns true for high risk', () => {
      expect(isApprovalRequired('high')).toBe(true);
    });

    it('returns false for medium risk', () => {
      expect(isApprovalRequired('medium')).toBe(false);
    });

    it('returns false for low risk', () => {
      expect(isApprovalRequired('low')).toBe(false);
    });
  });

  describe('APPROVAL_ROLES', () => {
    it('includes admin role', () => {
      expect(APPROVAL_ROLES).toContain('admin');
    });

    it('includes issm role', () => {
      expect(APPROVAL_ROLES).toContain('issm');
    });

    it('has exactly 2 roles', () => {
      expect(APPROVAL_ROLES).toHaveLength(2);
    });

    it('does not include user or isso', () => {
      expect(APPROVAL_ROLES).not.toContain('user');
      expect(APPROVAL_ROLES).not.toContain('isso');
    });
  });

  describe('APPROVAL_STATUS_TRANSITIONS (state machine)', () => {
    it('pending can transition to approved or rejected', () => {
      expect(APPROVAL_STATUS_TRANSITIONS.pending).toContain('approved');
      expect(APPROVAL_STATUS_TRANSITIONS.pending).toContain('rejected');
    });

    it('approved can transition to executed', () => {
      expect(APPROVAL_STATUS_TRANSITIONS.approved).toContain('executed');
    });

    it('rejected can transition to cancelled', () => {
      expect(APPROVAL_STATUS_TRANSITIONS.rejected).toContain('cancelled');
    });

    it('expired transitions to cancelled', () => {
      expect(APPROVAL_STATUS_TRANSITIONS.expired).toContain('cancelled');
    });

    it('executed is a terminal state', () => {
      expect(APPROVAL_STATUS_TRANSITIONS.executed).toEqual([]);
    });

    it('cancelled is a terminal state', () => {
      expect(APPROVAL_STATUS_TRANSITIONS.cancelled).toEqual([]);
    });
  });
});
