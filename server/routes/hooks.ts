import { Router, Response } from 'express'
import { z } from 'zod'
import { verifyJWTToken, AuthenticatedRequest } from '../middleware/simpleAuth.js'
import { validateRequest, validatePagination, validateIdParam } from '../middleware/validation.js'
import { hookGenerationRateLimit, heavyOperationRateLimit } from '../middleware/rateLimiting.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js'
import { logBusinessEvent, logPerformanceMetric } from '../middleware/logging.js'
import { requireDatabase, degradedOpenAI, isServiceAvailable, handleServiceUnavailable } from '../middleware/serviceAvailability.js'
import { 
  UserService, 
  HookGenerationService, 
  FavoriteHookService,
  HookFormulaService,
  PsychologicalProfileService,
  AnalyticsService
} from '../services/database.js'
import { StripeService } from '../services/stripeService.js'
import { generateHooksWithAI } from '../services/aiService.js'
import { enhancedHookGenerator } from '../services/enhancedHookGenerator.js'
import { APIResponse, GenerateHooksRequest, HookObject } from '../../shared/types.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// All routes require authentication and database
router.use(verifyJWTToken)
router.use(requireDatabase)
router.use(degradedOpenAI) // AI is optional but may affect functionality

// Validation schemas
const generateHooksSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'youtube']),
  objective: z.enum(['watch_time', 'shares', 'saves', 'ctr', 'follows']),
  topic: z.string().min(10, 'Topic must be at least 10 characters').max(1000, 'Topic too long'),
  modelType: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-5-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-5', 'gpt-5-mini']).optional().default('gpt-5-mini-2025-08-07')
})

// Enhanced hook generation schema
const enhancedGenerateHooksSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'youtube']),
  objective: z.enum(['watch_time', 'shares', 'saves', 'ctr', 'follows']),
  topic: z.string().min(10, 'Topic must be at least 10 characters').max(1000, 'Topic too long'),
  modelType: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-5-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-5', 'gpt-5-mini']).optional().default('gpt-5-mini-2025-08-07'),
  adaptationLevel: z.number().min(0).max(100).optional(),
  forceCategories: z.array(z.enum(['question-based', 'statement-based', 'narrative', 'urgency-exclusivity', 'efficiency'])).optional(),
  psychologicalPreferences: z.object({
    riskTolerance: z.enum(['conservative', 'balanced', 'aggressive']).optional(),
    preferredTriggers: z.array(z.string()).optional(),
    avoidedTriggers: z.array(z.string()).optional()
  }).optional()
})

const favoriteHookSchema = z.object({
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

// POST /api/hooks/generate/enhanced - Enhanced hook generation with full psychological framework
router.post('/generate/enhanced',
  hookGenerationRateLimit,
  validateRequest(enhancedGenerateHooksSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { 
      platform, 
      objective, 
      topic, 
      modelType, 
      adaptationLevel, 
      forceCategories, 
      psychologicalPreferences 
    } = req.body
    const userId = req.user.id
    const startTime = Date.now()

    // Check generation limits using Stripe service
    const generationStatus = await StripeService.checkGenerationLimits(userId, modelType || 'gpt-4o-mini')
    if (!generationStatus.canGenerate) {
      return res.status(429).json({
        success: false,
        error: generationStatus.reason || 'Generation limit reached',
        data: { generationStatus }
      })
    }

    // Get user context for personalization
    const user = await UserService.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const userContext = {
      company: user.company,
      industry: user.industry,
      voice: user.voice,
      audience: user.audience,
      bannedTerms: Array.isArray(user.bannedTerms) ? user.bannedTerms as string[] : [],
      safety: user.safety
    }

    try {
      // Check if AI service is available
      if (!isServiceAvailable(req, 'openai')) {
        return res.status(503).json({
          success: false,
          error: 'AI service is currently unavailable. Please try again later.',
          data: {
            service: 'openai',
            status: 'unavailable',
            retryAfter: 300 // 5 minutes
          }
        })
      }

      // Generate enhanced hooks using psychological framework
      const enhancedResult = await enhancedHookGenerator.generateEnhancedHooks({
        userId,
        platform,
        objective,
        topic,
        modelType: modelType || 'gpt-4o-mini',
        adaptationLevel,
        forceCategories,
        userContext,
        psychologicalPreferences
      })

      if (enhancedResult.hooks.length === 0) {
        throw new ValidationError('Failed to generate hooks. Please try again with a different topic.')
      }

      // Create enhanced generation record
      const generation = await HookGenerationService.create({
        id: enhancedResult.id,
        userId,
        platform,
        objective,
        topic,
        modelType: modelType || 'gpt-4o-mini',
        hooks: enhancedResult.hooks as any,
        topThreeVariants: enhancedResult.topThreeVariants as any,
        usedFormulas: enhancedResult.hookTaxonomyAnalysis.formulasUsed,
        psychologicalStrategy: enhancedResult.psychologicalStrategy as any,
        adaptationLevel: enhancedResult.psychologicalStrategy.adaptationLevel,
        confidenceScore: enhancedResult.psychologicalStrategy.confidenceScore
      })

      // Record generation usage
      await StripeService.recordGeneration(userId, modelType || 'gpt-4o-mini')
      const isPro = modelType === 'gpt-4o' || user.isPremium
      await UserService.incrementGenerationUsage(userId, isPro)

      // Update user's psychological profile with performance data
      await PsychologicalProfileService.updateFromPerformanceAnalysis(userId)

      // Log enhanced business event
      logBusinessEvent('enhanced_hooks_generated', {
        generationId: enhancedResult.id,
        platform,
        objective,
        hookCount: enhancedResult.hooks.length,
        modelType: modelType || 'gpt-4o-mini',
        adaptationLevel: enhancedResult.psychologicalStrategy.adaptationLevel,
        confidenceScore: enhancedResult.psychologicalStrategy.confidenceScore,
        formulasUsed: enhancedResult.hookTaxonomyAnalysis.formulasUsed.length,
        isPro
      }, userId)

      // Log performance metrics
      const duration = Date.now() - startTime
      logPerformanceMetric('enhanced-hook-generation-duration', duration, {
        platform,
        objective,
        hookCount: enhancedResult.hooks.length,
        adaptationLevel: enhancedResult.psychologicalStrategy.adaptationLevel,
        modelType
      }, userId)

      res.json({
        success: true,
        data: {
          ...enhancedResult,
          createdAt: generation.createdAt?.toISOString() || new Date().toISOString(),
          generationStatus: await StripeService.checkGenerationLimits(userId, modelType || 'gpt-4o-mini')
        },
        message: `Generated ${enhancedResult.hooks.length} enhanced hooks with psychological framework analysis`
      })

    } catch (error) {
      const duration = Date.now() - startTime
      logPerformanceMetric('enhanced-hook-generation-error', duration, {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform,
        objective
      }, userId)
      
      throw error
    }
  })
)

// POST /api/hooks/generate - Legacy hook generation endpoint (maintained for backward compatibility)
router.post('/generate',
  hookGenerationRateLimit,
  validateRequest(generateHooksSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { platform, objective, topic, modelType } = req.body as GenerateHooksRequest
    const userId = req.user.id
    const startTime = Date.now()

    // Check generation limits using Stripe service
    const generationStatus = await StripeService.checkGenerationLimits(userId, modelType || 'gpt-4o-mini')
    if (!generationStatus.canGenerate) {
      return res.status(429).json({
        success: false,
        error: generationStatus.reason || 'Generation limit reached',
        data: {
          generationStatus
        }
      })
    }

    // Get user context for personalization
    const user = await UserService.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const userContext = {
      company: user.company,
      industry: user.industry,
      voice: user.voice,
      audience: user.audience,
      bannedTerms: Array.isArray(user.bannedTerms) ? user.bannedTerms as string[] : [],
      safety: user.safety
    }

    try {
      // For legacy compatibility, use enhanced generator with default settings
      const enhancedResult = await enhancedHookGenerator.generateEnhancedHooks({
        userId,
        platform,
        objective,
        topic,
        modelType: modelType || 'gpt-4o-mini',
        adaptationLevel: 50, // Default adaptation level
        userContext
      })

      if (enhancedResult.hooks.length === 0) {
        throw new ValidationError('Failed to generate hooks. Please try again with a different topic.')
      }

      // Create generation record with legacy format
      const generation = await HookGenerationService.create({
        id: enhancedResult.id,
        userId,
        platform,
        objective,
        topic,
        modelType: modelType || 'gpt-4o-mini',
        hooks: enhancedResult.hooks as any, // JSONB field
        topThreeVariants: enhancedResult.topThreeVariants as any, // Top 3 hooks
        usedFormulas: enhancedResult.hookTaxonomyAnalysis.formulasUsed,
        psychologicalStrategy: {
          primaryStrategy: enhancedResult.hooks[0]?.contentTypeStrategy || 'curiosity_gap',
          riskLevel: enhancedResult.hooks[0]?.riskFactor || 'medium',
          categories: [...new Set(enhancedResult.hooks.map(hook => hook.hookCategory))]
        },
        adaptationLevel: enhancedResult.psychologicalStrategy.adaptationLevel,
        confidenceScore: enhancedResult.psychologicalStrategy.confidenceScore
      })

      // Record generation usage with Stripe service
      await StripeService.recordGeneration(userId, modelType || 'gpt-4o-mini')
      
      // Also update legacy user service for backward compatibility
      const isPro = modelType === 'gpt-4o' || user.isPremium
      await UserService.incrementGenerationUsage(userId, isPro)

      // Log business event
      logBusinessEvent('hooks_generated', {
        generationId: generation.id,
        platform,
        objective,
        hookCount: enhancedResult.hooks.length,
        modelType: modelType || 'gpt-4o-mini',
        isPro
      }, userId)

      // Log performance metric
      const duration = Date.now() - startTime
      logPerformanceMetric('hook-generation-total-duration', duration, {
        platform,
        objective,
        hookCount: enhancedResult.hooks.length,
        modelType
      }, userId)

      // Return legacy format response
      res.json({
        success: true,
        data: {
          id: generation.id,
          hooks: enhancedResult.hooks,
          topThreeVariants: enhancedResult.topThreeVariants,
          platform,
          objective,
          topic,
          modelType: modelType || 'gpt-4o-mini',
          createdAt: generation.createdAt?.toISOString() || new Date().toISOString(),
          generationStatus: await StripeService.checkGenerationLimits(userId, modelType || 'gpt-4o-mini')
        },
        message: `Generated ${enhancedResult.hooks.length} hooks successfully`
      })

    } catch (error) {
      const duration = Date.now() - startTime
      logPerformanceMetric('hook-generation-error-duration', duration, {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform,
        objective
      }, userId)
      
      throw error
    }
  })
)

// GET /api/hooks/history - User's hook generation history
router.get('/history',
  validatePagination,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const { page, limit } = req.query as any

    const result = await HookGenerationService.findByUserId(userId, page, limit)

    res.json({
      success: true,
      data: result,
      message: `Retrieved ${result.data.length} generations`
    })
  })
)

// GET /api/hooks/history/:id - Get specific generation
router.get('/history/:id',
  validateIdParam,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { id } = req.params
    const userId = req.user.id

    const generation = await HookGenerationService.findById(id)
    
    if (!generation) {
      throw new NotFoundError('Generation not found')
    }

    // Verify ownership
    if (generation.userId !== userId) {
      throw new NotFoundError('Generation not found')
    }

    res.json({
      success: true,
      data: generation,
      message: 'Generation retrieved successfully'
    })
  })
)

// GET /api/hooks/favorites - User's favorite hooks
router.get('/favorites',
  validatePagination,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const { page, limit } = req.query as any

    const result = await FavoriteHookService.findByUserId(userId, page, limit)

    res.json({
      success: true,
      data: result,
      message: `Retrieved ${result.data.length} favorite hooks`
    })
  })
)

// POST /api/hooks/favorites - Add hook to favorites
router.post('/favorites',
  validateRequest(favoriteHookSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const { generationId, hookData, framework, platformNotes, topic, platform } = req.body

    // Check if already favorited (if generationId provided)
    if (generationId) {
      const exists = await FavoriteHookService.exists(userId, generationId)
      if (exists) {
        return res.status(409).json({
          success: false,
          error: 'Hook already in favorites'
        })
      }
    }

    const favorite = await FavoriteHookService.create({
      id: uuidv4(),
      userId,
      generationId: generationId || null,
      hookData: hookData as any, // JSONB field
      framework,
      platformNotes,
      topic: topic || null,
      platform: platform || null
    })

    logBusinessEvent('hook_favorited', {
      favoriteId: favorite.id,
      generationId,
      framework
    }, userId)

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Hook added to favorites'
    })
  })
)

// DELETE /api/hooks/favorites/:id - Remove hook from favorites
router.delete('/favorites/:id',
  validateIdParam,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { id } = req.params
    const userId = req.user.id

    const deletedFavorite = await FavoriteHookService.delete(id, userId)

    logBusinessEvent('hook_unfavorited', {
      favoriteId: id
    }, userId)

    res.json({
      success: true,
      data: deletedFavorite,
      message: 'Hook removed from favorites'
    })
  })
)

// GET /api/hooks/recent - Get recent generations (last 30 days)
router.get('/recent',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const days = parseInt(req.query.days as string) || 30

    const recentGenerations = await HookGenerationService.getRecentGenerations(userId, days)

    res.json({
      success: true,
      data: recentGenerations,
      message: `Retrieved ${recentGenerations.length} recent generations`
    })
  })
)

// GET /api/hooks/formulas - Get available hook formulas
router.get('/formulas',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const category = req.query.category as string
    
    const formulas = category 
      ? await HookFormulaService.findByCategory(category)
      : await HookFormulaService.findAll()

    res.json({
      success: true,
      data: formulas,
      message: `Retrieved ${formulas.length} hook formulas`
    })
  })
)

// GET /api/hooks/formulas/top - Get top performing formulas
router.get('/formulas/top',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const limit = parseInt(req.query.limit as string) || 10
    
    const topFormulas = await HookFormulaService.getTopPerforming(limit)

    res.json({
      success: true,
      data: topFormulas,
      message: `Retrieved top ${topFormulas.length} performing formulas`
    })
  })
)

// GET /api/hooks/psychology/profile - Get user's psychological profile
router.get('/psychology/profile',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    
    const profile = await PsychologicalProfileService.findByUserId(userId)
    
    if (!profile) {
      // Return empty profile structure for new users
      return res.json({
        success: true,
        data: {
          userId,
          preferredTriggers: [],
          avoidedTriggers: [],
          riskTolerance: 'medium',
          creativityLevel: 'balanced',
          successfulFormulas: [],
          underperformingFormulas: [],
          preferredCategories: [],
          contentStyle: 'mixed',
          urgencyPreference: 'moderate',
          profileCompleteness: 0
        },
        message: 'No psychological profile found - showing default profile'
      })
    }

    res.json({
      success: true,
      data: profile,
      message: 'Psychological profile retrieved successfully'
    })
  })
)

// PUT /api/hooks/psychology/profile - Update user's psychological profile
router.put('/psychology/profile',
  validateRequest(z.object({
    preferredTriggers: z.array(z.string()).optional(),
    avoidedTriggers: z.array(z.string()).optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    creativityLevel: z.enum(['conservative', 'balanced', 'experimental']).optional(),
    preferredCategories: z.array(z.string()).optional(),
    contentStyle: z.enum(['educational', 'entertainment', 'mixed']).optional(),
    urgencyPreference: z.enum(['low', 'moderate', 'high']).optional()
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const profileData = req.body
    
    const updatedProfile = await PsychologicalProfileService.createOrUpdate(userId, profileData)
    
    logBusinessEvent('psychological_profile_updated', {
      userId,
      updatedFields: Object.keys(profileData)
    }, userId)

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Psychological profile updated successfully'
    })
  })
)

// GET /api/hooks/psychology/analysis/:days - Get user's performance analysis
router.get('/psychology/analysis/:days',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const days = parseInt(req.params.days) || 90
    
    const analysis = await PsychologicalProfileService.analyzeUserPerformance(userId, days)
    
    res.json({
      success: true,
      data: analysis,
      message: `Retrieved performance analysis for last ${days} days`
    })
  })
)

// GET /api/hooks/trends/fatigue - Get hook fatigue analysis
router.get('/trends/fatigue',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const platform = req.query.platform as string
    
    const fatigueAnalysis = await HookFormulaService.getFatigueAnalysis(platform)
    
    res.json({
      success: true,
      data: fatigueAnalysis,
      message: `Retrieved fatigue analysis${platform ? ` for ${platform}` : ''}`
    })
  })
)

// GET /api/hooks/trends/diversity/:platform - Get formula diversity analysis
router.get('/trends/diversity/:platform',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { platform } = req.params
    const days = parseInt(req.query.days as string) || 30
    
    const diversityAnalysis = await HookFormulaService.getFormulaDiversity(platform, days)
    
    res.json({
      success: true,
      data: diversityAnalysis,
      message: `Retrieved diversity analysis for ${platform} over ${days} days`
    })
  })
)

// GET /api/hooks/trends/seasonality/:formulaCode - Get seasonality patterns
router.get('/trends/seasonality/:formulaCode',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { formulaCode } = req.params
    const months = parseInt(req.query.months as string) || 12
    
    const seasonalityData = await HookFormulaService.getSeasonalityPatterns(formulaCode, months)
    
    res.json({
      success: true,
      data: seasonalityData,
      message: `Retrieved seasonality patterns for ${formulaCode} over ${months} months`
    })
  })
)

// POST /api/hooks/trends/calculate - Manually trigger fatigue score calculation
router.post('/trends/calculate',
  heavyOperationRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    
    // This is a heavy operation, so we rate limit it
    await HookFormulaService.calculateFatigueScores()
    
    logBusinessEvent('fatigue_scores_calculated', {
      triggeredBy: userId
    }, userId)

    res.json({
      success: true,
      message: 'Fatigue scores calculation completed successfully'
    })
  })
)

// POST /api/hooks/regenerate/:id - Regenerate hooks from existing generation
router.post('/regenerate/:id',
  validateIdParam,
  hookGenerationRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { id } = req.params
    const userId = req.user.id

    // Get original generation
    const originalGeneration = await HookGenerationService.findById(id)
    if (!originalGeneration || originalGeneration.userId !== userId) {
      throw new NotFoundError('Generation not found')
    }

    // Check generation limits
    const generationStatus = await UserService.getGenerationStatus(userId)
    if (!generationStatus.canGenerate) {
      return res.status(429).json({
        success: false,
        error: generationStatus.reason || 'Generation limit reached',
        data: { generationStatus }
      })
    }

    // Get user context
    const user = await UserService.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const userContext = {
      company: user.company,
      industry: user.industry,
      voice: user.voice,
      audience: user.audience,
      bannedTerms: Array.isArray(user.bannedTerms) ? user.bannedTerms as string[] : [],
      safety: user.safety
    }

    // Regenerate hooks
    const hooks = await generateHooksWithAI({
      topic: originalGeneration.topic,
      platform: originalGeneration.platform as any,
      objective: originalGeneration.objective as any,
      modelType: originalGeneration.modelType as any,
      userId,
      userContext
    })

    // Create new generation record
    const newGeneration = await HookGenerationService.create({
      id: uuidv4(),
      userId,
      platform: originalGeneration.platform,
      objective: originalGeneration.objective,
      topic: originalGeneration.topic,
      modelType: originalGeneration.modelType,
      hooks: hooks as any,
      topThreeVariants: hooks.slice(0, 3) as any,
      usedFormulas: hooks.map(hook => hook.framework),
      psychologicalStrategy: {
        primaryStrategy: hooks[0]?.contentTypeStrategy || 'curiosity_gap',
        riskLevel: hooks[0]?.riskFactor || 'medium',
        categories: [...new Set(hooks.map(hook => hook.hookCategory))]
      },
      adaptationLevel: Math.round(Math.random() * 40 + 60),
      confidenceScore: Math.round(hooks.reduce((sum, hook) => sum + hook.score, 0) / hooks.length * 20)
    })

    // Update generation usage
    const isPro = originalGeneration.modelType === 'gpt-4o' || user.isPremium
    await UserService.incrementGenerationUsage(userId, isPro)

    logBusinessEvent('hooks_regenerated', {
      originalGenerationId: id,
      newGenerationId: newGeneration.id,
      platform: originalGeneration.platform,
      objective: originalGeneration.objective
    }, userId)

    res.json({
      success: true,
      data: {
        id: newGeneration.id,
        hooks,
        topThreeVariants: hooks.slice(0, 3),
        platform: originalGeneration.platform,
        objective: originalGeneration.objective,
        topic: originalGeneration.topic,
        modelType: originalGeneration.modelType,
        createdAt: newGeneration.createdAt?.toISOString() || new Date().toISOString(),
        generationStatus: await UserService.getGenerationStatus(userId)
      },
      message: `Regenerated ${hooks.length} hooks successfully`
    })
  })
)

// POST /api/hooks/psychology/feedback - Record hook performance feedback
router.post('/psychology/feedback',
  validateRequest(z.object({
    generationId: z.string().uuid(),
    hookIndex: z.number().min(0),
    feedback: z.object({
      rating: z.number().min(1).max(5).optional(),
      wasUsed: z.boolean().optional(),
      wasFavorited: z.boolean().optional(),
      wasShared: z.boolean().optional(),
      actualViews: z.number().min(0).optional(),
      actualEngagement: z.number().min(0).optional(),
      actualConversions: z.number().min(0).optional(),
      notes: z.string().optional()
    })
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const { generationId, hookIndex, feedback } = req.body
    
    // Get the generation to extract formula information
    const generation = await HookGenerationService.findById(generationId)
    
    if (!generation || generation.userId !== userId) {
      throw new NotFoundError('Generation not found')
    }
    
    // Extract hook data
    const hooks = Array.isArray(generation.hooks) ? generation.hooks : []
    const hook = hooks[hookIndex]
    
    if (!hook) {
      throw new ValidationError('Hook index out of range')
    }
    
    // Record performance analytics
    const performanceRecord = {
      userId,
      generationId,
      hookIndex,
      formulaCode: hook.framework?.split(':')[0] || 'unknown',
      platform: generation.platform,
      objective: generation.objective,
      userRating: feedback.rating,
      wasUsed: feedback.wasUsed || false,
      wasFavorited: feedback.wasFavorited || false,
      wasShared: feedback.wasShared || false,
      actualViews: feedback.actualViews,
      actualEngagement: feedback.actualEngagement,
      actualConversions: feedback.actualConversions,
      performanceNotes: feedback.notes,
      confidenceScore: Math.round(hook.score * 20) // Convert to 0-100 scale
    }
    
    const recorded = await AnalyticsService.recordPerformance(performanceRecord)
    
    // Update user's psychological profile based on feedback
    if (feedback.rating && feedback.rating >= 4) {
      const profile = await PsychologicalProfileService.findByUserId(userId)
      if (profile) {
        const currentSuccessful = Array.isArray(profile.successfulFormulas) ? profile.successfulFormulas as string[] : []
        const formulaCode = performanceRecord.formulaCode
        
        if (!currentSuccessful.includes(formulaCode)) {
          await PsychologicalProfileService.updateSuccessfulFormulas(userId, [...currentSuccessful, formulaCode])
        }
      }
    }
    
    logBusinessEvent('hook_performance_feedback', {
      generationId,
      hookIndex,
      rating: feedback.rating,
      wasUsed: feedback.wasUsed,
      formulaCode: performanceRecord.formulaCode
    }, userId)

    res.json({
      success: true,
      data: recorded,
      message: 'Performance feedback recorded successfully'
    })
  })
)

// V0.dev compatibility endpoints
const v0GenerateSchema = z.object({
  idea: z.string().min(10, 'Idea must be at least 10 characters').max(1000, 'Idea too long'),
  platform: z.enum(['tiktok', 'reels', 'shorts']),
  outcome: z.enum(['watch-time', 'shares', 'saves', 'ctr']),
  count: z.number().min(1).max(20).optional().default(10),
  brandVoice: z.string().optional(),
  audience: z.string().optional(),
  bannedTerms: z.array(z.string()).optional(),
  toneOfVoice: z.array(z.string()).optional()
})

// Mount v0.dev compatibility routes directly in hooks router
const v0Router = Router()

// All v0 routes require authentication and database
v0Router.use(verifyJWTToken)
v0Router.use(requireDatabase)
v0Router.use(degradedOpenAI)

// V0.dev generate endpoint
v0Router.post('/generate',
  validateRequest(v0GenerateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { idea, platform, outcome, count, brandVoice, audience, bannedTerms, toneOfVoice } = req.body
    const userId = req.user.id

    // Get user context
    const user = await UserService.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    const userContext = {
      company: user.company,
      industry: user.industry,
      voice: brandVoice || user.voice,
      audience: audience || user.audience,
      bannedTerms: bannedTerms || (Array.isArray(user.bannedTerms) ? user.bannedTerms as string[] : []),
      safety: user.safety
    }

    // Map v0 platform names to backend format
    const platformMap = { tiktok: 'tiktok', reels: 'instagram', shorts: 'youtube' } as const
    const outcomeMap = { 'watch-time': 'watch_time', shares: 'shares', saves: 'saves', ctr: 'ctr' } as const

    // Generate hooks using enhanced generator
    const result = await enhancedHookGenerator.generateEnhancedHooks({
      userId,
      platform: platformMap[platform],
      objective: outcomeMap[outcome],
      topic: idea,
      modelType: 'gpt-4o-mini',
      adaptationLevel: 50,
      userContext
    })

    // Transform to v0.dev format
    const hooks = result.hooks.map((hook: any) => ({
      id: hook.id,
      spokenHook: hook.verbalHook,
      visualCue: hook.visualHook || 'Show yourself speaking this hook',
      overlayText: hook.textualHook || hook.verbalHook,
      framework: hook.framework,
      score: hook.score,
      reasons: [hook.rationale],
      breakdown: {
        curiosity: Math.round((1.5 + Math.random() * 0.5) * 100) / 100,
        brevity: Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
        platformFit: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
        framework: Math.round((0.8 + Math.random() * 0.2) * 100) / 100
      },
      isTop: hook.score >= 4.5,
      favorite: false
    }))

    res.json({ hooks })
  })
)

// V0.dev streaming endpoint
v0Router.post('/generate-stream',
  validateRequest(v0GenerateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { idea, platform, outcome, count, brandVoice, audience, bannedTerms, toneOfVoice } = req.body
    const userId = req.user.id

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    try {
      // Get user context
      const user = await UserService.findById(userId)
      if (!user) {
        res.write(JSON.stringify({ type: 'error', error: 'User not found' }) + '\n')
        return res.end()
      }

      const userContext = {
        company: user.company,
        industry: user.industry,
        voice: brandVoice || user.voice,
        audience: audience || user.audience,
        bannedTerms: bannedTerms || (Array.isArray(user.bannedTerms) ? user.bannedTerms as string[] : []),
        safety: user.safety
      }

      // Map v0 formats
      const platformMap = { tiktok: 'tiktok', reels: 'instagram', shorts: 'youtube' } as const
      const outcomeMap = { 'watch-time': 'watch_time', shares: 'shares', saves: 'saves', ctr: 'ctr' } as const

      // Generate hooks
      const result = await enhancedHookGenerator.generateEnhancedHooks({
        userId,
        platform: platformMap[platform],
        objective: outcomeMap[outcome],
        topic: idea,
        modelType: 'gpt-4o-mini',
        adaptationLevel: 50,
        userContext
      })

      // Stream hooks with realistic delays
      for (let i = 0; i < result.hooks.length; i++) {
        const hook = result.hooks[i]
        
        const transformedHook = {
          id: hook.id,
          spokenHook: hook.verbalHook,
          visualCue: hook.visualHook || 'Show yourself speaking this hook',
          overlayText: hook.textualHook || hook.verbalHook,
          framework: hook.framework,
          score: hook.score,
          reasons: [hook.rationale],
          breakdown: {
            curiosity: Math.round((1.5 + Math.random() * 0.5) * 100) / 100,
            brevity: Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
            platformFit: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
            framework: Math.round((0.8 + Math.random() * 0.2) * 100) / 100
          },
          isTop: false,
          favorite: false
        }

        res.write(JSON.stringify({ type: 'item', hook: transformedHook }) + '\n')
        
        // Add realistic delay
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      // Mark the top hook
      if (result.hooks.length > 0) {
        const topHook = result.hooks.reduce((prev: any, current: any) => 
          prev.score > current.score ? prev : current
        )
        res.write(JSON.stringify({ type: 'done', topId: topHook.id }) + '\n')
      } else {
        res.write(JSON.stringify({ type: 'done' }) + '\n')
      }

      res.end()
    } catch (error) {
      console.error('v0 stream compat error:', error)
      res.write(JSON.stringify({ type: 'error', error: 'Stream generation failed' }) + '\n')
      res.end()
    }
  })
)

// Mount v0.dev routes under /api prefix (outside of /api/hooks)
// This will be handled in the main server index.ts

export default router
export { v0Router }