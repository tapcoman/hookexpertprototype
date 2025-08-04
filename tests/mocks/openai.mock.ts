import { jest } from '@jest/globals'

// Mock OpenAI SDK
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                hooks: [
                  {
                    id: 'hook-1',
                    text: 'This one weird trick will change your life forever',
                    formula: 'QH-01',
                    category: 'question-based',
                    confidence: 85,
                    psychologicalDrivers: ['curiosity-gap', 'value-hit'],
                    platform: 'tiktok',
                    objective: 'watch_time',
                  },
                  {
                    id: 'hook-2',
                    text: 'Why nobody talks about this simple method',
                    formula: 'QH-02',
                    category: 'question-based',
                    confidence: 78,
                    psychologicalDrivers: ['curiosity-gap', 'social-proof'],
                    platform: 'tiktok',
                    objective: 'watch_time',
                  },
                ],
                topThreeVariants: [
                  {
                    id: 'variant-1',
                    text: 'The secret method everyone ignores',
                    formula: 'ST-01',
                    category: 'statement-based',
                    confidence: 88,
                    psychologicalDrivers: ['authority-credibility', 'curiosity-gap'],
                    platform: 'tiktok',
                    objective: 'watch_time',
                  },
                ],
                strategy: {
                  primaryTrigger: 'curiosity-gap',
                  secondaryTriggers: ['value-hit', 'social-proof'],
                  confidence: 85,
                  adaptationNotes: 'Optimized for TikTok watch time',
                },
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 300,
          total_tokens: 450,
        },
      }),
    },
  },
}

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAI),
  }
})

export { mockOpenAI }