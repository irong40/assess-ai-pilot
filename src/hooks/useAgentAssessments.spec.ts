import { describe, expect, test, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAgentAssessments } from './useAgentAssessments'
import type { ReactNode } from 'react'
import React from 'react'

// Mock supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

// Create wrapper component for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useAgentAssessments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('agentAssessments query', () => {
    test('should fetch agent assessments successfully', async () => {
      const mockAssessments = [
        {
          id: 'assessment-1',
          agent_id: 'network',
          assessment_id: 'test-assessment',
          status: 'completed',
          progress: 100,
          analysis_result: 'Network analysis complete',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          user_id: 'test-user-id'
        },
      ]

      mockSupabase.single.mockResolvedValue({ data: mockAssessments, error: null })

      const { result } = renderHook(() => useAgentAssessments('test-assessment'), {
        wrapper: createWrapper(),
      })

      // Wait for the query to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.agentAssessments).toEqual(mockAssessments)
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_assessments')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('assessment_id', 'test-assessment')
    })
  })

  describe('updateAgentAssessment', () => {
    test('should update agent assessment successfully', async () => {
      const mockAssessment = {
        id: 'assessment-1',
        agent_id: 'network',
        assessment_id: 'test-assessment',
        status: 'completed',
        progress: 100,
        analysis_result: 'Network analysis complete',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user_id: 'test-user-id'
      }

      mockSupabase.single.mockResolvedValue({ data: mockAssessment, error: null })

      const { result } = renderHook(() => useAgentAssessments('test-assessment'), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        const assessment = await result.current.updateAgentAssessment.mutateAsync({
          agentId: 'network',
          status: 'completed',
          progress: 100,
          analysisResult: 'Network analysis complete',
        })
        expect(assessment).toEqual(mockAssessment)
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('agent_assessments')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'completed',
        progress: 100,
        analysis_result: 'Network analysis complete',
        updated_at: expect.any(String),
      })
    })

    test('should handle update error', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Update failed' } 
      })

      const { result } = renderHook(() => useAgentAssessments('test-assessment'), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await expect(result.current.updateAgentAssessment.mutateAsync({
          agentId: 'network',
          status: 'completed',
          progress: 100,
        })).rejects.toThrow('Update failed')
      })
    })
  })

  describe('getAgentStatus', () => {
    test('should return correct status for existing agent', async () => {
      const mockAssessments = [
        {
          id: 'assessment-1',
          agent_id: 'network',
          assessment_id: 'test-assessment',
          status: 'completed',
          progress: 100,
          analysis_result: 'Network analysis complete',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          user_id: 'test-user-id'
        },
      ]

      mockSupabase.single.mockResolvedValue({ data: mockAssessments, error: null })

      const { result } = renderHook(() => useAgentAssessments('test-assessment'), {
        wrapper: createWrapper(),
      })

      // Wait for the query to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const status = result.current.getAgentStatus('network')
      expect(status).toEqual({
        status: 'completed',
        progress: 100,
        analysisResult: 'Network analysis complete',
        exists: true
      })
    })

    test('should return default status for non-existing agent', async () => {
      mockSupabase.single.mockResolvedValue({ data: [], error: null })

      const { result } = renderHook(() => useAgentAssessments('test-assessment'), {
        wrapper: createWrapper(),
      })

      // Wait for the query to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const status = result.current.getAgentStatus('non-existing-agent')
      expect(status).toEqual({
        status: 'not-started',
        progress: 0,
        analysisResult: undefined,
        exists: false
      })
    })
  })

  describe('getAssessmentProgress', () => {
    test('should calculate progress correctly', async () => {
      const mockAssessments = [
        {
          id: 'assessment-1',
          agent_id: 'network',
          assessment_id: 'test-assessment',
          status: 'completed',
          progress: 100,
          analysis_result: 'Network analysis complete',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          user_id: 'test-user-id'
        },
        {
          id: 'assessment-2',
          agent_id: 'access',
          assessment_id: 'test-assessment',
          status: 'in-progress',
          progress: 50,
          analysis_result: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          user_id: 'test-user-id'
        },
        {
          id: 'assessment-3',
          agent_id: 'privacy',
          assessment_id: 'test-assessment',
          status: 'not-started',
          progress: 0,
          analysis_result: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          user_id: 'test-user-id'
        }
      ]

      mockSupabase.single.mockResolvedValue({ data: mockAssessments, error: null })

      const { result } = renderHook(() => useAgentAssessments('test-assessment'), {
        wrapper: createWrapper(),
      })

      // Wait for the query to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const progress = result.current.getAssessmentProgress()
      expect(progress).toEqual({
        total: 3,
        completed: 1,
        inProgress: 1,
        notStarted: 1,
        overallProgress: 33.33333333333333
      })
    })
  })
})