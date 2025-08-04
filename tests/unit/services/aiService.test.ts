import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { generateHooksWithAI, detectContentStrategy, selectOptimalFormulas } from '../../../server/services/aiService.js'
import { mockOpenAI } from '../../mocks/openai.mock.js'

// Mock logger
jest.mock('../../../server/middleware/logging.js', () => ({
  logAIServiceCall: jest.fn(),
  logPerformanceMetric: jest.fn(),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateHooksWithAI', () => {
    it('should generate hooks successfully', async () => {
      const request = {
        platform: 'tiktok' as const,
        objective: 'watch_time' as const,
        topic: 'productivity tips for remote workers',
        modelType: 'gpt-4o-mini' as const,
      }

      const result = await generateHooksWithAI(request)

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('You are an expert hook writer'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('productivity tips for remote workers'),
          }),
        ]),
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })

      expect(result.hooks).toHaveLength(2)
      expect(result.topThreeVariants).toHaveLength(1)
      expect(result.strategy).toMatchObject({
        primaryTrigger: 'curiosity-gap',
        confidence: 85,
      })
    })

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'))

      const request = {
        platform: 'tiktok' as const,
        objective: 'watch_time' as const,
        topic: 'test topic',
        modelType: 'gpt-4o-mini' as const,
      }

      await expect(generateHooksWithAI(request)).rejects.toThrow('API Error')
    })

    it('should handle invalid JSON responses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response',
          },
        }],
        usage: { total_tokens: 100 },
      })

      const request = {
        platform: 'tiktok' as const,
        objective: 'watch_time' as const,
        topic: 'test topic',
        modelType: 'gpt-4o-mini' as const,
      }

      await expect(generateHooksWithAI(request)).rejects.toThrow()
    })
  })

  describe('detectContentStrategy', () => {
    it('should detect educational content strategy', () => {
      const topic = 'How to improve your productivity with these 5 simple methods'
      
      const result = detectContentStrategy(topic)

      expect(result.primaryCategory).toBe('educational')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.suggestedFormulas).toContain('EF-01')
    })

    it('should detect entertainment content strategy', () => {
      const topic = 'Funny moments from my daily life that will make you laugh'
      
      const result = detectContentStrategy(topic)

      expect(result.primaryCategory).toBe('entertainment')
      expect(result.confidence).toBeGreaterThan(0.6)
      expect(result.suggestedFormulas).toContain('NA-01')
    })

    it('should detect personal story strategy', () => {
      const topic = 'My journey from broke to millionaire in 3 years'
      
      const result = detectContentStrategy(topic)

      expect(result.primaryCategory).toBe('personal')
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.suggestedFormulas).toContain('NA-01')
    })

    it('should handle generic topics', () => {
      const topic = 'random topic'
      
      const result = detectContentStrategy(topic)

      expect(result.primaryCategory).toBe('mixed')
      expect(result.confidence).toBeLessThan(0.6)
      expect(result.suggestedFormulas.length).toBeGreaterThan(0)
    })
  })

  describe('selectOptimalFormulas', () => {
    const mockProfile = {
      successfulFormulas: ['QH-01', 'ST-02'],
      underperformingFormulas: ['AD-03'],
      preferredCategories: ['question-based', 'statement-based'],
      riskTolerance: 'medium' as const,
      preferredTriggers: ['curiosity-gap', 'value-hit'],
    }

    it('should prioritize successful formulas', () => {
      const result = selectOptimalFormulas(
        'tiktok',
        'watch_time',
        mockProfile,
        ['QH-01', 'QH-02', 'ST-01']
      )

      expect(result.selectedFormulas).toContain('QH-01')
      expect(result.reasoning).toContain('successful')
    })

    it('should avoid underperforming formulas', () => {
      const result = selectOptimalFormulas(
        'tiktok',
        'watch_time',
        mockProfile,
        ['AD-03', 'QH-01', 'ST-01']
      )

      expect(result.selectedFormulas).not.toContain('AD-03')
      expect(result.reasoning).toContain('avoiding')
    })

    it('should respect risk tolerance', () => {
      const conservativeProfile = {
        ...mockProfile,
        riskTolerance: 'conservative' as const,
      }

      const result = selectOptimalFormulas(
        'tiktok',
        'watch_time',
        conservativeProfile,
        ['QH-04', 'AD-02', 'ST-01'] // High-risk formulas
      )

      expect(result.selectedFormulas).toContain('ST-01') // Lower risk
      expect(result.adaptationStrategy).toContain('conservative')
    })

    it('should handle empty profile gracefully', () => {
      const emptyProfile = {
        successfulFormulas: [],
        underperformingFormulas: [],
        preferredCategories: [],
        riskTolerance: 'medium' as const,
        preferredTriggers: [],
      }

      const result = selectOptimalFormulas(
        'tiktok',
        'watch_time',
        emptyProfile,
        ['QH-01', 'ST-01']
      )

      expect(result.selectedFormulas.length).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThan(0.8) // Lower confidence due to lack of data
    })

    it('should adapt for different platforms', () => {
      const instagramResult = selectOptimalFormulas(
        'instagram',
        'engagement',
        mockProfile,
        ['QH-01', 'ST-01', 'NA-01']
      )

      const tiktokResult = selectOptimalFormulas(
        'tiktok',
        'watch_time',
        mockProfile,
        ['QH-01', 'ST-01', 'NA-01']
      )

      expect(instagramResult.platformOptimizations).toContain('Instagram')
      expect(tiktokResult.platformOptimizations).toContain('TikTok')
    })

    it('should limit formula selection appropriately', () => {
      const manyFormulas = Array.from({ length: 20 }, (_, i) => `QH-${i.toString().padStart(2, '0')}`)
      
      const result = selectOptimalFormulas(
        'tiktok',
        'watch_time',
        mockProfile,
        manyFormulas
      )

      expect(result.selectedFormulas.length).toBeLessThanOrEqual(12) // Should limit to reasonable number
    })
  })
})