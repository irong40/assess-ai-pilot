import { describe, it, expect } from 'vitest';
import {
  VALID_TRANSITIONS,
  isValidTransition,
  isValidDelegation,
  isValidDelegationDepth,
  MAX_DELEGATION_DEPTH,
  AGENT_TYPES,
} from '@/types/agent';
import type { TaskStatus, AgentType } from '@/types/agent';

describe('Agent State Machine', () => {
  describe('VALID_TRANSITIONS', () => {
    it('defines transitions for all statuses', () => {
      const allStatuses: TaskStatus[] = [
        'pending',
        'running',
        'awaiting_approval',
        'approved',
        'rejected',
        'completed',
        'failed',
      ];

      for (const status of allStatuses) {
        expect(VALID_TRANSITIONS).toHaveProperty(status);
        expect(Array.isArray(VALID_TRANSITIONS[status])).toBe(true);
      }
    });

    it('pending can only transition to running', () => {
      expect(VALID_TRANSITIONS.pending).toEqual(['running']);
    });

    it('running can transition to completed, failed, or awaiting_approval', () => {
      expect(VALID_TRANSITIONS.running).toContain('completed');
      expect(VALID_TRANSITIONS.running).toContain('failed');
      expect(VALID_TRANSITIONS.running).toContain('awaiting_approval');
      expect(VALID_TRANSITIONS.running).toHaveLength(3);
    });

    it('awaiting_approval can transition to approved or rejected', () => {
      expect(VALID_TRANSITIONS.awaiting_approval).toContain('approved');
      expect(VALID_TRANSITIONS.awaiting_approval).toContain('rejected');
      expect(VALID_TRANSITIONS.awaiting_approval).toHaveLength(2);
    });

    it('approved can transition to completed or failed', () => {
      expect(VALID_TRANSITIONS.approved).toContain('completed');
      expect(VALID_TRANSITIONS.approved).toContain('failed');
      expect(VALID_TRANSITIONS.approved).toHaveLength(2);
    });

    it('rejected is a terminal state', () => {
      expect(VALID_TRANSITIONS.rejected).toEqual([]);
    });

    it('completed is a terminal state', () => {
      expect(VALID_TRANSITIONS.completed).toEqual([]);
    });

    it('failed is a terminal state', () => {
      expect(VALID_TRANSITIONS.failed).toEqual([]);
    });
  });

  describe('isValidTransition', () => {
    it('allows valid transitions', () => {
      expect(isValidTransition('pending', 'running')).toBe(true);
      expect(isValidTransition('running', 'completed')).toBe(true);
      expect(isValidTransition('running', 'failed')).toBe(true);
      expect(isValidTransition('running', 'awaiting_approval')).toBe(true);
      expect(isValidTransition('awaiting_approval', 'approved')).toBe(true);
      expect(isValidTransition('awaiting_approval', 'rejected')).toBe(true);
      expect(isValidTransition('approved', 'completed')).toBe(true);
      expect(isValidTransition('approved', 'failed')).toBe(true);
    });

    it('rejects completed -> running (invalid backward transition)', () => {
      expect(isValidTransition('completed', 'running')).toBe(false);
    });

    it('rejects failed -> approved (invalid cross transition)', () => {
      expect(isValidTransition('failed', 'approved')).toBe(false);
    });

    it('rejects pending -> completed (skipping running state)', () => {
      expect(isValidTransition('pending', 'completed')).toBe(false);
    });

    it('rejects completed -> pending (backwards from terminal)', () => {
      expect(isValidTransition('completed', 'pending')).toBe(false);
    });

    it('rejects rejected -> running (backwards from terminal)', () => {
      expect(isValidTransition('rejected', 'running')).toBe(false);
    });

    it('rejects failed -> running (backwards from terminal)', () => {
      expect(isValidTransition('failed', 'running')).toBe(false);
    });

    it('rejects awaiting_approval -> running (backwards transition)', () => {
      expect(isValidTransition('awaiting_approval', 'running')).toBe(false);
    });

    it('rejects running -> pending (backwards transition)', () => {
      expect(isValidTransition('running', 'pending')).toBe(false);
    });

    it('rejects self-transitions', () => {
      const allStatuses: TaskStatus[] = [
        'pending',
        'running',
        'awaiting_approval',
        'approved',
        'rejected',
        'completed',
        'failed',
      ];

      for (const status of allStatuses) {
        expect(isValidTransition(status, status)).toBe(false);
      }
    });
  });

  describe('Hub-and-spoke topology', () => {
    it('allows delegation from ciso-orchestrator', () => {
      expect(isValidDelegation('ciso-orchestrator')).toBe(true);
    });

    it('allows direct tasks with no source agent', () => {
      expect(isValidDelegation(null)).toBe(true);
    });

    it('rejects delegation from grc-analyst', () => {
      expect(isValidDelegation('grc-analyst')).toBe(false);
    });

    it('rejects delegation from soc-analyst', () => {
      expect(isValidDelegation('soc-analyst')).toBe(false);
    });

    it('rejects delegation from all non-orchestrator agents', () => {
      const specialistAgents: AgentType[] = [
        'grc-analyst',
        'soc-analyst',
        'threat-intel',
        'incident-response',
        'appsec',
        'pen-test',
      ];

      for (const agent of specialistAgents) {
        expect(isValidDelegation(agent)).toBe(false);
      }
    });
  });

  describe('Delegation depth', () => {
    it('allows depth 0 (direct task)', () => {
      expect(isValidDelegationDepth(0)).toBe(true);
    });

    it('allows depth 1 (single delegation)', () => {
      expect(isValidDelegationDepth(1)).toBe(true);
    });

    it('allows depth 2 (double delegation)', () => {
      expect(isValidDelegationDepth(2)).toBe(true);
    });

    it('rejects depth 3 (at the limit)', () => {
      expect(isValidDelegationDepth(3)).toBe(false);
    });

    it('rejects depth greater than 3', () => {
      expect(isValidDelegationDepth(4)).toBe(false);
      expect(isValidDelegationDepth(10)).toBe(false);
    });

    it('rejects negative depth', () => {
      expect(isValidDelegationDepth(-1)).toBe(false);
    });

    it('MAX_DELEGATION_DEPTH is 3', () => {
      expect(MAX_DELEGATION_DEPTH).toBe(3);
    });
  });

  describe('Agent types', () => {
    it('includes all 7 agent types', () => {
      expect(AGENT_TYPES).toHaveLength(7);
      expect(AGENT_TYPES).toContain('ciso-orchestrator');
      expect(AGENT_TYPES).toContain('grc-analyst');
      expect(AGENT_TYPES).toContain('soc-analyst');
      expect(AGENT_TYPES).toContain('threat-intel');
      expect(AGENT_TYPES).toContain('incident-response');
      expect(AGENT_TYPES).toContain('appsec');
      expect(AGENT_TYPES).toContain('pen-test');
    });
  });
});
