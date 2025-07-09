import { describe, expect, test, beforeEach, vi } from 'vitest'
import { analyzeAgent, type AnalysisResult } from './agentAnalysis'

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'test-id',
        system_name: 'Test System',
        environment: 'test',
        compliance_scope: 'nist-800-53',
      },
    }),
  },
}))

describe('analyzeAgent', () => {
  const mockFiles = [
    { name: 'test-file.pdf', size: 1024, type: 'application/pdf' },
    { name: 'config.json', size: 512, type: 'application/json' },
  ]

  const mockContext = 'Test system for security assessment'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('network agent analysis', () => {
    test('should generate network security analysis with valid inputs', async () => {
      const result = await analyzeAgent('network', mockFiles, mockContext)
      
      expect(result).toEqual(expect.any(String))
      expect(result).toContain('NETWORK SECURITY ARCHITECTURE ASSESSMENT')
      expect(result).toContain('EXECUTIVE SUMMARY')
      expect(result).toContain('KEY FINDINGS')
      expect(result).toContain('test-file.pdf, config.json')
    })

    test('should handle empty files array', async () => {
      const result = await analyzeAgent('network', [], mockContext)
      
      expect(result).toEqual(expect.any(String))
      expect(result).toContain('No files uploaded')
    })

    test('should include context in analysis', async () => {
      const customContext = 'Custom security assessment context'
      const result = await analyzeAgent('network', mockFiles, customContext)
      
      expect(result).toContain(customContext)
    })

    test('should include timestamp in analysis', async () => {
      const result = await analyzeAgent('network', mockFiles, mockContext)
      
      expect(result).toMatch(/Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('access agent analysis', () => {
    test('should generate access control analysis', async () => {
      const result = await analyzeAgent('access', mockFiles, mockContext)
      
      expect(result).toContain('ACCESS CONTROL SECURITY ASSESSMENT')
      expect(result).toContain('IDENTITY & ACCESS MANAGEMENT')
      expect(result).toContain('COMPLIANCE FRAMEWORK MAPPING')
    })
  })

  describe('privacy agent analysis', () => {
    test('should generate privacy controls analysis', async () => {
      const result = await analyzeAgent('privacy', mockFiles, mockContext)
      
      expect(result).toContain('PRIVACY CONTROLS ASSESSMENT')
      expect(result).toContain('DATA GOVERNANCE FRAMEWORK')
      expect(result).toContain('GDPR')
    })
  })

  describe('edge cases', () => {
    test('should handle invalid agent type', async () => {
      const result = await analyzeAgent('invalid-agent', mockFiles, mockContext)
      
      expect(result).toEqual(expect.any(String))
      expect(result).toContain('GENERIC SECURITY ASSESSMENT')
    })

    test('should handle large files array', async () => {
      const largeFilesArray = Array.from({ length: 100 }, (_, i) => ({
        name: `file-${i}.pdf`,
        size: 1024 * i,
        type: 'application/pdf',
      }))

      const result = await analyzeAgent('network', largeFilesArray, mockContext)
      
      expect(result).toEqual(expect.any(String))
      expect(result.length).toBeGreaterThan(1000)
    })

    test('should handle empty context', async () => {
      const result = await analyzeAgent('network', mockFiles, '')
      
      expect(result).toEqual(expect.any(String))
      expect(result).toContain('NETWORK SECURITY ARCHITECTURE ASSESSMENT')
    })

    test('should handle very long context', async () => {
      const longContext = 'A'.repeat(10000)
      const result = await analyzeAgent('network', mockFiles, longContext)
      
      expect(result).toEqual(expect.any(String))
      expect(result).toContain('NETWORK SECURITY ARCHITECTURE ASSESSMENT')
    })
  })

  describe('performance and reliability', () => {
    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now()
      await analyzeAgent('network', mockFiles, mockContext)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    test('should be deterministic for same inputs', async () => {
      // Mock Math.random to be deterministic
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      
      const result1 = await analyzeAgent('network', mockFiles, mockContext)
      const result2 = await analyzeAgent('network', mockFiles, mockContext)
      
      expect(result1).toBe(result2)
    })
  })

  describe('agent coverage', () => {
    const agentTypes = [
      'access', 'privacy', 'recovery', 'network', 'physical', 'policy',
      'data', 'configuration', 'blue-team', 'vulnerability', 'threat-intel',
      'supply-chain', 'grc', 'training', 'mobile', 'legal'
    ]

    test.each(agentTypes)('should handle %s agent type', async (agentType) => {
      const result = await analyzeAgent(agentType, mockFiles, mockContext)
      
      expect(result).toEqual(expect.any(String))
      expect(result.length).toBeGreaterThan(100)
    })
  })
})