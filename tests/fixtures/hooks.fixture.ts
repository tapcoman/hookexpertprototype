import type { HookObject, NewHookGeneration } from '../../shared/types.js'

export const testHooks: HookObject[] = [
  {
    id: 'hook-1',
    text: 'This one weird trick will change your life forever',
    formula: 'QH-01',
    category: 'question-based',
    confidence: 85,
    psychologicalDrivers: ['curiosity-gap', 'value-hit'],
    platform: 'tiktok',
    objective: 'watch_time',
    reasoning: 'Uses curiosity gap and value proposition',
    effectiveness: 8.5,
    riskLevel: 'medium',
    adaptations: {
      instagram: 'This one trick will change your Instagram game',
      youtube: 'The life-changing trick nobody talks about',
    },
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
    reasoning: 'Leverages social proof and mystery',
    effectiveness: 7.8,
    riskLevel: 'low',
    adaptations: {
      instagram: 'The method nobody talks about',
      youtube: 'Why experts ignore this simple method',
    },
  },
  {
    id: 'hook-3',
    text: 'I tried this for 30 days and here\'s what happened',
    formula: 'NA-01',
    category: 'narrative',
    confidence: 92,
    psychologicalDrivers: ['curiosity-gap', 'social-proof', 'storytelling'],
    platform: 'youtube',
    objective: 'click_through',
    reasoning: 'Personal story creates strong engagement',
    effectiveness: 9.2,
    riskLevel: 'low',
    adaptations: {
      tiktok: '30 days of this changed everything',
      instagram: 'My 30-day transformation story',
    },
  },
]

export const testHookGeneration: NewHookGeneration = {
  userId: 'user-123',
  platform: 'tiktok',
  objective: 'watch_time',
  topic: 'productivity tips for remote workers',
  modelType: 'gpt-4o-mini',
  hooks: testHooks,
  topThreeVariants: testHooks.slice(0, 3),
  psychologicalStrategy: {
    primaryTrigger: 'curiosity-gap',
    secondaryTriggers: ['value-hit', 'social-proof'],
    confidence: 85,
    adaptationNotes: 'Optimized for TikTok watch time',
  },
}

export const createTestHook = (overrides: Partial<HookObject> = {}): HookObject => ({
  id: 'test-hook-' + Math.random().toString(36).substr(2, 9),
  text: 'Test hook content',
  formula: 'QH-01',
  category: 'question-based',
  confidence: 80,
  psychologicalDrivers: ['curiosity-gap'],
  platform: 'tiktok',
  objective: 'watch_time',
  reasoning: 'Test reasoning',
  effectiveness: 8.0,
  riskLevel: 'medium',
  ...overrides,
})