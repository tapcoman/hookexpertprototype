import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'
import { APIResponse } from '../../shared/types.js'

// Generic validation middleware factory
export function validateRequest<T extends ZodSchema>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response<APIResponse>, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params
      const validatedData = schema.parse(data)
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validatedData
      } else if (source === 'query') {
        req.query = validatedData as any
      } else {
        req.params = validatedData as any
      }
      
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          data: {
            issues: error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            }))
          }
        })
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      })
    }
  }
}

// Specific validation schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
})

export const userUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  company: z.string().max(100).optional(),
  industry: z.enum([
    'agency', 'creator', 'ecommerce', 'saas', 'local-business',
    'education', 'healthcare', 'finance', 'fitness', 'beauty',
    'food', 'technology', 'real-estate', 'consulting', 'other'
  ]).optional(),
  role: z.enum([
    'founder-ceo', 'marketing-manager', 'content-creator',
    'social-media-manager', 'video-editor', 'freelancer',
    'agency-owner', 'student', 'other'
  ]).optional(),
  audience: z.string().max(500).optional(),
  voice: z.enum([
    'authoritative', 'friendly', 'playful', 'contrarian',
    'luxury', 'minimal', 'educational', 'inspirational'
  ]).optional(),
  bannedTerms: z.array(z.string().max(50)).max(20).optional(),
  safety: z.enum(['family-friendly', 'standard', 'edgy']).optional()
})

export const hookGenerationSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'youtube']),
  objective: z.enum(['watch_time', 'shares', 'saves', 'ctr', 'follows']),
  topic: z.string().min(10, 'Topic must be at least 10 characters').max(1000, 'Topic too long'),
  modelType: z.enum(['gpt-4o', 'gpt-4o-mini']).optional().default('gpt-4o-mini')
})

export const favoriteHookSchema = z.object({
  generationId: z.string().uuid().optional(),
  hookData: z.object({
    verbalHook: z.string(),
    visualHook: z.string().optional(),
    textualHook: z.string().optional(),
    framework: z.string(),
    psychologicalDriver: z.string(),
    hookCategory: z.string(),
    riskFactor: z.string(),
    score: z.number(),
    rationale: z.string(),
    platformNotes: z.string()
  }),
  framework: z.string(),
  platformNotes: z.string(),
  topic: z.string().optional(),
  platform: z.string().optional()
})

export const analyticsEventSchema = z.object({
  sessionId: z.string(),
  eventType: z.string(),
  eventData: z.record(z.any()).default({}),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.enum(['desktop', 'mobile', 'tablet']),
    screenResolution: z.tuple([z.number(), z.number()]).optional()
  }),
  pageInfo: z.object({
    pathname: z.string(),
    referrer: z.string().optional(),
    source: z.string().optional()
  })
})

export const performanceFeedbackSchema = z.object({
  generationId: z.string().uuid(),
  hookIndex: z.number().min(0),
  userRating: z.number().min(1).max(5).optional(),
  wasUsed: z.boolean().optional(),
  wasFavorited: z.boolean().optional(),
  wasShared: z.boolean().optional(),
  actualViews: z.number().min(0).optional(),
  actualEngagement: z.number().min(0).optional(),
  actualConversions: z.number().min(0).optional(),
  performanceNotes: z.string().max(1000).optional()
})

export const psychologicalPreferencesSchema = z.object({
  preferredTriggers: z.array(z.enum([
    'curiosity-gap', 'pain-point', 'value-hit', 'surprise-shock',
    'social-proof', 'urgency-fomo', 'authority-credibility', 'emotional-connection'
  ])).optional(),
  avoidedTriggers: z.array(z.enum([
    'curiosity-gap', 'pain-point', 'value-hit', 'surprise-shock',
    'social-proof', 'urgency-fomo', 'authority-credibility', 'emotional-connection'
  ])).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  creativityLevel: z.enum(['conservative', 'balanced', 'experimental']).optional(),
  preferredCategories: z.array(z.enum([
    'question-based', 'statement-based', 'narrative', 'urgency-exclusivity', 'efficiency'
  ])).optional(),
  contentStyle: z.enum(['educational', 'entertainment', 'mixed']).optional(),
  urgencyPreference: z.enum(['low', 'moderate', 'high']).optional()
})

// Validation middleware instances
export const validatePagination = validateRequest(paginationSchema, 'query')
export const validateIdParam = validateRequest(idParamSchema, 'params')
export const validateUserUpdate = validateRequest(userUpdateSchema)
export const validateHookGeneration = validateRequest(hookGenerationSchema)
export const validateFavoriteHook = validateRequest(favoriteHookSchema)
export const validateAnalyticsEvent = validateRequest(analyticsEventSchema)
export const validatePerformanceFeedback = validateRequest(performanceFeedbackSchema)
export const validatePsychologicalPreferences = validateRequest(psychologicalPreferencesSchema)