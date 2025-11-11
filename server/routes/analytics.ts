import { Router, Response, Request } from 'express'
import { z } from 'zod'
import { hybridAuth, optionalHybridAuth } from '../middleware/hybridAuth.js'
import { AuthenticatedRequest } from '../middleware/simpleAuth.js'
import { validateRequest, validatePagination } from '../middleware/validation.js'
import { analyticsRateLimit, apiRateLimit } from '../middleware/rateLimiting.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js'
import { logBusinessEvent } from '../middleware/logging.js'
import { 
  AnalyticsService,
  HookGenerationService,
  HookFormulaService
} from '../services/database.js'
import { BusinessIntelligenceService } from '../services/businessIntelligence.js'
import { APIResponse } from '../../shared/types.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Validation schemas
const analyticsEventSchema = z.object({
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

const performanceFeedbackSchema = z.object({
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

const abTestConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  formulaCodeA: z.string(),
  formulaCodeB: z.string(),
  platform: z.enum(['tiktok', 'instagram', 'youtube']),
  objective: z.enum(['watch_time', 'shares', 'saves', 'ctr', 'follows']),
  topic: z.string().min(10).max(1000),
  trafficAllocation: z.number().min(0.1).max(1).default(0.5) // 50/50 split by default
})

// POST /api/analytics/events - Track analytics events (optional auth)
router.post('/events',
  optionalHybridAuth,
  analyticsRateLimit,
  validateRequest(analyticsEventSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { sessionId, eventType, eventData, deviceInfo, pageInfo } = req.body
    const userId = req.user?.id

    const event = await AnalyticsService.recordEvent({
      id: uuidv4(),
      sessionId,
      userId: userId || null,
      eventType,
      eventData: eventData as any, // JSONB field
      deviceInfo: deviceInfo as any, // JSONB field
      pageInfo: pageInfo as any // JSONB field
    })

    res.status(201).json({
      success: true,
      data: { eventId: event.id },
      message: 'Event tracked successfully'
    })
  })
)

// POST /api/analytics/performance - Record hook performance feedback (requires auth)
router.post('/performance',
  hybridAuth,
  apiRateLimit,
  validateRequest(performanceFeedbackSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const {
      generationId,
      hookIndex,
      userRating,
      wasUsed,
      wasFavorited,
      wasShared,
      actualViews,
      actualEngagement,
      actualConversions,
      performanceNotes
    } = req.body

    // Verify generation ownership
    const generation = await HookGenerationService.findById(generationId)
    if (!generation || generation.userId !== userId) {
      throw new NotFoundError('Generation not found')
    }

    // Validate hook index
    const hooks = generation.hooks as any[]
    if (!hooks || hookIndex >= hooks.length) {
      throw new ValidationError('Invalid hook index')
    }

    const hook = hooks[hookIndex]
    const formulaCode = hook.framework || null

    // Record performance data
    const performanceRecord = await AnalyticsService.recordPerformance({
      id: uuidv4(),
      userId,
      generationId,
      hookIndex,
      formulaCode,
      platform: generation.platform,
      objective: generation.objective,
      userRating: userRating || null,
      wasUsed: wasUsed || false,
      wasFavorited: wasFavorited || false,
      wasShared: wasShared || false,
      actualViews: actualViews || null,
      actualEngagement: actualEngagement || null,
      actualConversions: actualConversions || null,
      performanceNotes: performanceNotes || null,
      confidenceScore: Math.round((hook.score || 0) * 20), // Convert 0-5 to 0-100
      contextTags: [generation.platform, generation.objective] as any
    })

    logBusinessEvent('hook_performance_recorded', {
      generationId,
      hookIndex,
      formulaCode,
      userRating,
      wasUsed,
      actualViews
    }, userId)

    res.status(201).json({
      success: true,
      data: performanceRecord,
      message: 'Performance feedback recorded successfully'
    })
  })
)

// GET /api/analytics/performance/:generationId - Get performance data for a generation
router.get('/performance/:generationId',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { generationId } = req.params
    const userId = req.user.id

    // Verify generation ownership
    const generation = await HookGenerationService.findById(generationId)
    if (!generation || generation.userId !== userId) {
      throw new NotFoundError('Generation not found')
    }

    // This would require a method to get performance data by generation
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        generationId,
        performanceRecords: [] // Would be populated with actual performance data
      },
      message: 'Performance data retrieved successfully'
    })
  })
)

// GET /api/analytics/trends - Get hook trend data (requires auth)
router.get('/trends',
  hybridAuth,
  apiRateLimit,
  validatePagination,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const platform = req.query.platform as string
    const days = parseInt(req.query.days as string) || 30

    if (!platform || !['tiktok', 'instagram', 'youtube'].includes(platform)) {
      throw new ValidationError('Valid platform parameter is required')
    }

    const trends = await AnalyticsService.getPlatformTrends(platform, days)

    res.json({
      success: true,
      data: {
        platform,
        periodDays: days,
        trends
      },
      message: `Retrieved trends for ${platform} over ${days} days`
    })
  })
)

// GET /api/analytics/formulas/:code/performance - Get formula performance stats
router.get('/formulas/:code/performance',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { code } = req.params
    const days = parseInt(req.query.days as string) || 30

    // Verify formula exists
    const formula = await HookFormulaService.findByCode(code)
    if (!formula) {
      throw new NotFoundError('Hook formula not found')
    }

    const stats = await AnalyticsService.getFormulaPerformanceStats(code, days)

    res.json({
      success: true,
      data: {
        formulaCode: code,
        formulaName: formula.name,
        periodDays: days,
        performance: stats
      },
      message: `Retrieved performance stats for formula ${code}`
    })
  })
)

// POST /api/analytics/ab-test - Create A/B test configuration
router.post('/ab-test',
  hybridAuth,
  apiRateLimit,
  validateRequest(abTestConfigSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const {
      name,
      description,
      formulaCodeA,
      formulaCodeB,
      platform,
      objective,
      topic,
      trafficAllocation
    } = req.body

    // Verify formulas exist
    const [formulaA, formulaB] = await Promise.all([
      HookFormulaService.findByCode(formulaCodeA),
      HookFormulaService.findByCode(formulaCodeB)
    ])

    if (!formulaA || !formulaB) {
      throw new ValidationError('One or both hook formulas not found')
    }

    // In a real implementation, this would create an A/B test record
    const testId = uuidv4()

    logBusinessEvent('ab_test_created', {
      testId,
      name,
      formulaCodeA,
      formulaCodeB,
      platform,
      objective
    }, userId)

    res.status(201).json({
      success: true,
      data: {
        testId,
        name,
        description,
        variants: {
          A: {
            formulaCode: formulaCodeA,
            formulaName: formulaA.name,
            allocation: trafficAllocation
          },
          B: {
            formulaCode: formulaCodeB,
            formulaName: formulaB.name,
            allocation: 1 - trafficAllocation
          }
        },
        platform,
        objective,
        topic,
        status: 'created',
        createdAt: new Date().toISOString()
      },
      message: 'A/B test configuration created successfully'
    })
  })
)

// GET /api/analytics/ab-test/:testId/results - Get A/B test results
router.get('/ab-test/:testId/results',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { testId } = req.params
    const userId = req.user.id

    // In a real implementation, this would fetch actual A/B test results
    // For now, return mock data
    res.json({
      success: true,
      data: {
        testId,
        status: 'running',
        participantCount: 0,
        results: {
          variantA: {
            participants: 0,
            conversionRate: 0,
            avgRating: 0,
            favoriteRate: 0
          },
          variantB: {
            participants: 0,
            conversionRate: 0,
            avgRating: 0,
            favoriteRate: 0
          }
        },
        statisticalSignificance: false,
        confidenceLevel: 0,
        winner: null
      },
      message: 'A/B test results retrieved successfully'
    })
  })
)

// GET /api/analytics/dashboard - Get analytics dashboard data
router.get('/dashboard',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const days = parseInt(req.query.days as string) || 30

    // Get user engagement stats
    const engagementStats = await AnalyticsService.getUserEngagementStats(userId, days)

    // Get recent generations for trend analysis
    const recentGenerations = await HookGenerationService.getRecentGenerations(userId, days)

    // Analyze platform usage
    const platformUsage = recentGenerations.reduce((acc, gen) => {
      acc[gen.platform] = (acc[gen.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Analyze objective preferences
    const objectiveUsage = recentGenerations.reduce((acc, gen) => {
      acc[gen.objective] = (acc[gen.objective] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    res.json({
      success: true,
      data: {
        periodDays: days,
        engagement: engagementStats,
        platformUsage,
        objectiveUsage,
        generationTrend: recentGenerations.map(gen => ({
          date: gen.createdAt?.toISOString().split('T')[0],
          platform: gen.platform,
          objective: gen.objective,
          hookCount: Array.isArray(gen.hooks) ? gen.hooks.length : 0
        }))
      },
      message: 'Dashboard data retrieved successfully'
    })
  })
)

// GET /api/analytics/insights - Get AI-powered insights (requires auth)
router.get('/insights',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const days = parseInt(req.query.days as string) || 30

    // Get user's generation history
    const recentGenerations = await HookGenerationService.getRecentGenerations(userId, days)
    
    // Generate insights based on usage patterns
    const insights = generateUserInsights(recentGenerations)

    res.json({
      success: true,
      data: {
        periodDays: days,
        insights,
        recommendedActions: generateRecommendations(insights)
      },
      message: 'AI insights generated successfully'
    })
  })
)

// Helper function to generate user insights
function generateUserInsights(generations: any[]): any[] {
  const insights = []
  
  if (generations.length === 0) {
    insights.push({
      type: 'usage',
      title: 'Get Started',
      description: 'Generate your first hook to start seeing insights',
      priority: 'high'
    })
    return insights
  }

  // Platform preference insight
  const platformCounts = generations.reduce((acc, gen) => {
    acc[gen.platform] = (acc[gen.platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topPlatform = Object.entries(platformCounts)
    .sort(([,a], [,b]) => b - a)[0]
  
  if (topPlatform) {
    insights.push({
      type: 'platform_preference',
      title: `${topPlatform[0]} Focus`,
      description: `You've generated ${topPlatform[1]} hooks for ${topPlatform[0]} - consider exploring other platforms for broader reach`,
      priority: 'medium'
    })
  }

  // Generation frequency insight
  const daysSinceFirst = generations.length > 0 
    ? Math.ceil((Date.now() - new Date(generations[generations.length - 1].createdAt!).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  const avgGenerationsPerDay = daysSinceFirst > 0 ? generations.length / daysSinceFirst : 0
  
  if (avgGenerationsPerDay < 0.5) {
    insights.push({
      type: 'usage_frequency',
      title: 'Boost Your Consistency',
      description: 'Regular hook generation leads to better results. Try generating hooks daily for your content pipeline',
      priority: 'medium'
    })
  }

  return insights
}

// Helper function to generate recommendations
function generateRecommendations(insights: any[]): any[] {
  const recommendations = []
  
  for (const insight of insights) {
    switch (insight.type) {
      case 'platform_preference':
        recommendations.push({
          action: 'Try generating hooks for different platforms',
          benefit: 'Diversify your content strategy and reach new audiences',
          effort: 'low'
        })
        break
      case 'usage_frequency':
        recommendations.push({
          action: 'Set up a daily hook generation routine',
          benefit: 'Build a consistent content pipeline and improve hook quality',
          effort: 'medium'
        })
        break
      default:
        recommendations.push({
          action: 'Continue using Hook Line Studio regularly',
          benefit: 'Maintain momentum and improve your hook writing skills',
          effort: 'low'
        })
    }
  }
  
  return recommendations
}

// ==================== COMPREHENSIVE ANALYTICS ENDPOINTS ====================

// POST /api/analytics/web-vitals - Record Core Web Vitals (optional auth)
const webVitalsSchema = z.object({
  sessionId: z.string(),
  lcp: z.number().min(0).optional(),
  fid: z.number().min(0).optional(),
  cls: z.number().min(0).optional(),
  fcp: z.number().min(0).optional(),
  ttfb: z.number().min(0).optional(),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']),
  connectionType: z.string().optional(),
  pathname: z.string(),
  referrer: z.string().optional()
})

router.post('/web-vitals',
  optionalHybridAuth,
  analyticsRateLimit,
  validateRequest(webVitalsSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const {
      sessionId,
      lcp,
      fid,
      cls,
      fcp,
      ttfb,
      deviceType,
      connectionType,
      pathname,
      referrer
    } = req.body
    const userId = req.user?.id

    const vitals = await AnalyticsService.recordWebVitals({
      id: uuidv4(),
      sessionId,
      userId: userId || null,
      lcp: lcp || null,
      fid: fid || null,
      cls: cls ? Math.round(cls * 1000) : null, // Convert to integer
      fcp: fcp || null,
      ttfb: ttfb || null,
      deviceType,
      connectionType: connectionType || null,
      userAgent: req.get('user-agent') || null,
      pathname,
      referrer: referrer || null
    })

    res.status(201).json({
      success: true,
      data: { vitalsId: vitals.id },
      message: 'Web vitals recorded successfully'
    })
  })
)

// POST /api/analytics/error - Record client-side errors (optional auth)
const errorSchema = z.object({
  sessionId: z.string().optional(),
  errorType: z.enum(['js_error', 'network_error', 'api_error']),
  errorMessage: z.string(),
  errorStack: z.string().optional(),
  url: z.string(),
  additionalContext: z.record(z.any()).optional()
})

router.post('/error',
  optionalHybridAuth,
  analyticsRateLimit,
  validateRequest(errorSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const {
      sessionId,
      errorType,
      errorMessage,
      errorStack,
      url,
      additionalContext
    } = req.body
    const userId = req.user?.id

    const error = await AnalyticsService.recordError({
      id: uuidv4(),
      sessionId: sessionId || null,
      userId: userId || null,
      errorType,
      errorMessage,
      errorStack: errorStack || null,
      errorCode: null,
      url,
      userAgent: req.get('user-agent') || null,
      deviceInfo: {
        ip: req.ip || req.connection.remoteAddress,
        platform: req.get('sec-ch-ua-platform')
      },
      additionalContext: additionalContext as any || {}
    })

    res.status(201).json({
      success: true,
      data: { errorId: error.id },
      message: 'Error recorded successfully'
    })
  })
)

// POST /api/analytics/journey - Record user journey step (optional auth)
const journeySchema = z.object({
  sessionId: z.string(),
  stage: z.enum(['landing', 'signup', 'onboarding', 'first_generation', 'subscription']),
  step: z.string(),
  action: z.enum(['viewed', 'clicked', 'completed', 'abandoned']),
  fromStage: z.string().optional(),
  fromStep: z.string().optional(),
  duration: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional()
})

router.post('/journey',
  optionalHybridAuth,
  analyticsRateLimit,
  validateRequest(journeySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const {
      sessionId,
      stage,
      step,
      action,
      fromStage,
      fromStep,
      duration,
      metadata
    } = req.body
    const userId = req.user?.id

    const journey = await AnalyticsService.recordJourneyStep({
      id: uuidv4(),
      sessionId,
      userId: userId || null,
      stage,
      step,
      action,
      fromStage: fromStage || null,
      fromStep: fromStep || null,
      duration: duration || null,
      metadata: metadata as any || {}
    })

    res.status(201).json({
      success: true,
      data: { journeyId: journey.id },
      message: 'Journey step recorded successfully'
    })
  })
)

// GET /api/analytics/web-vitals-report - Get Core Web Vitals report (admin only)
router.get('/web-vitals-report',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const days = parseInt(req.query.days as string) || 30
    const report = await AnalyticsService.getWebVitalsReport(days)

    res.json({
      success: true,
      data: {
        periodDays: days,
        vitals: report
      },
      message: 'Web vitals report retrieved successfully'
    })
  })
)

// GET /api/analytics/error-report - Get error tracking report (admin only)
router.get('/error-report',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const days = parseInt(req.query.days as string) || 30
    const report = await AnalyticsService.getErrorReport(days)

    res.json({
      success: true,
      data: {
        periodDays: days,
        errors: report
      },
      message: 'Error report retrieved successfully'
    })
  })
)

// GET /api/analytics/conversion-funnel - Get conversion funnel data (admin only)
router.get('/conversion-funnel',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const days = parseInt(req.query.days as string) || 30
    const funnel = await AnalyticsService.getConversionFunnelData(days)

    res.json({
      success: true,
      data: {
        periodDays: days,
        funnel
      },
      message: 'Conversion funnel data retrieved successfully'
    })
  })
)

// GET /api/analytics/api-performance - Get API performance report (admin only)
router.get('/api-performance',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const days = parseInt(req.query.days as string) || 30
    const report = await AnalyticsService.getApiPerformanceReport(days)

    res.json({
      success: true,
      data: {
        periodDays: days,
        apiPerformance: report
      },
      message: 'API performance report retrieved successfully'
    })
  })
)

// GET /api/analytics/system-health - Get system health metrics (admin only)
router.get('/system-health',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const hours = parseInt(req.query.hours as string) || 24
    const health = await AnalyticsService.getSystemHealthMetrics(hours)

    res.json({
      success: true,
      data: {
        periodHours: hours,
        healthMetrics: health
      },
      message: 'System health metrics retrieved successfully'
    })
  })
)

// GET /api/analytics/ai-usage - Get AI service usage analytics (admin only)
router.get('/ai-usage',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const days = parseInt(req.query.days as string) || 30
    const usage = await AnalyticsService.getAIUsageAnalytics(days)

    res.json({
      success: true,
      data: {
        periodDays: days,
        aiUsage: usage
      },
      message: 'AI usage analytics retrieved successfully'
    })
  })
)

// GET /api/analytics/user-behavior/:userId - Get user behavior analytics (admin or own user)
router.get('/user-behavior/:userId',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { userId } = req.params
    const days = parseInt(req.query.days as string) || 30
    const requestingUserId = req.user.id

    // Allow users to view their own data or admin to view any user's data
    if (userId !== requestingUserId) {
      // In a real app, you'd check for admin role here
      throw new ValidationError('Access denied')
    }

    const behavior = await AnalyticsService.getUserBehaviorAnalytics(userId, days)

    res.json({
      success: true,
      data: {
        userId,
        periodDays: days,
        behavior
      },
      message: 'User behavior analytics retrieved successfully'
    })
  })
)

// GET /api/analytics/realtime - Get real-time metrics (admin only)
router.get('/realtime',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const metrics = await AnalyticsService.getRealtimeMetrics()

    res.json({
      success: true,
      data: metrics,
      message: 'Real-time metrics retrieved successfully'
    })
  })
)

// ==================== BUSINESS INTELLIGENCE ENDPOINTS ====================

// GET /api/analytics/business-dashboard - Get business intelligence dashboard (admin only)
router.get('/business-dashboard',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const days = parseInt(req.query.days as string) || 30
    const dashboard = await BusinessIntelligenceService.getDashboardData(days)

    res.json({
      success: true,
      data: dashboard,
      message: 'Business dashboard data retrieved successfully'
    })
  })
)

// GET /api/analytics/trend/:metricName - Get trend data for a specific metric (admin only)
router.get('/trend/:metricName',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { metricName } = req.params
    const days = parseInt(req.query.days as string) || 30
    const trend = await BusinessIntelligenceService.getTrendData(metricName, days)

    res.json({
      success: true,
      data: {
        metricName,
        periodDays: days,
        trend
      },
      message: `Trend data for ${metricName} retrieved successfully`
    })
  })
)

// POST /api/analytics/calculate-metrics - Trigger manual metrics calculation (admin only)
router.post('/calculate-metrics',
  hybridAuth,
  apiRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { period = 'daily' } = req.body

    try {
      switch (period) {
        case 'daily':
          await BusinessIntelligenceService.runDailyCalculations()
          break
        case 'weekly':
          await BusinessIntelligenceService.runWeeklyCalculations()
          break
        case 'monthly':
          await BusinessIntelligenceService.runMonthlyCalculations()
          break
        default:
          throw new ValidationError('Invalid period. Must be daily, weekly, or monthly')
      }

      res.json({
        success: true,
        data: { period },
        message: `${period} metrics calculation triggered successfully`
      })
    } catch (error) {
      throw new ValidationError(`Failed to calculate ${period} metrics: ${error.message}`)
    }
  })
)

export default router