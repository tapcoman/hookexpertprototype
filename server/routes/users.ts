import { Router, Response, Request } from 'express'
import { z } from 'zod'
import { clerkAuth, AuthenticatedRequest } from '../middleware/clerkAuth.js'
import { validateRequest } from '../middleware/validation.js'
import { apiRateLimit } from '../middleware/rateLimiting.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js'
import { logBusinessEvent } from '../middleware/logging.js'
import { 
  UserService, 
  PsychologicalProfileService,
  AnalyticsService
} from '../services/database.js'
import { APIResponse } from '../../shared/types.js'

const router = Router()

// All routes require Clerk authentication
router.use(clerkAuth)
router.use(apiRateLimit)

// Validation schemas
const profileUpdateSchema = z.object({
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

const onboardingSchema = z.object({
  // Step 1: About Your Work
  company: z.string().min(1, 'Company name is required'),
  industry: z.enum([
    'agency', 'creator', 'ecommerce', 'saas', 'local-business',
    'education', 'healthcare', 'finance', 'fitness', 'beauty',
    'food', 'technology', 'real-estate', 'consulting', 'other'
  ]),
  role: z.enum([
    'founder-ceo', 'marketing-manager', 'content-creator',
    'social-media-manager', 'video-editor', 'freelancer',
    'agency-owner', 'student', 'other'
  ]),
  audience: z.string().min(10, 'Please describe your audience'),
  
  // Step 2: How You Sound
  voice: z.enum([
    'authoritative', 'friendly', 'playful', 'contrarian',
    'luxury', 'minimal', 'educational', 'inspirational'
  ]),
  bannedTerms: z.array(z.string()).default([]),
  safety: z.enum(['family-friendly', 'standard', 'edgy']),
  
  // Step 3: What You Make
  primaryPlatforms: z.array(z.enum(['tiktok', 'instagram', 'youtube'])).min(1, 'Select at least one platform'),
  contentGoals: z.array(z.enum(['watch_time', 'shares', 'saves', 'ctr', 'follows'])).min(1, 'Select at least one goal').max(3, 'Select up to 3 goals'),
  successfulHooks: z.array(z.string()).optional(),
  
  // Step 4: Psychological Preferences (optional)
  preferredTriggers: z.array(z.enum([
    'curiosity-gap', 'pain-point', 'value-hit', 'surprise-shock',
    'social-proof', 'urgency-fomo', 'authority-credibility', 'emotional-connection'
  ])).optional(),
  avoidedTriggers: z.array(z.enum([
    'curiosity-gap', 'pain-point', 'value-hit', 'surprise-shock',
    'social-proof', 'urgency-fomo', 'authority-credibility', 'emotional-connection'
  ])).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  creativityLevel: z.enum(['conservative', 'balanced', 'experimental']).optional()
})

const psychologicalPreferencesSchema = z.object({
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

// GET /api/users/profile - Get user profile
router.get('/profile',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    
    const user = await UserService.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Get psychological profile
    const psychProfile = await PsychologicalProfileService.findByUserId(userId)
    
    // Get generation status
    const generationStatus = await UserService.getGenerationStatus(userId)

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          company: user.company,
          industry: user.industry,
          role: user.role,
          audience: user.audience,
          voice: user.voice,
          bannedTerms: user.bannedTerms,
          safety: user.safety,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionPlan: user.subscriptionPlan,
          isPremium: user.isPremium,
          currentPeriodEnd: user.currentPeriodEnd?.toISOString(),
          createdAt: user.createdAt?.toISOString(),
          updatedAt: user.updatedAt?.toISOString()
        },
        psychologicalProfile: psychProfile ? {
          preferredTriggers: psychProfile.preferredTriggers,
          avoidedTriggers: psychProfile.avoidedTriggers,
          riskTolerance: psychProfile.riskTolerance,
          creativityLevel: psychProfile.creativityLevel,
          preferredCategories: psychProfile.preferredCategories,
          contentStyle: psychProfile.contentStyle,
          urgencyPreference: psychProfile.urgencyPreference,
          profileCompleteness: psychProfile.profileCompleteness,
          lastUpdated: psychProfile.lastUpdated?.toISOString()
        } : null,
        generationStatus
      },
      message: 'Profile retrieved successfully'
    })
  })
)

// PUT /api/users/profile - Update user profile
router.put('/profile',
  validateRequest(profileUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const updateData = req.body

    const updatedUser = await UserService.update(userId, updateData)

    logBusinessEvent('profile_updated', {
      userId,
      updatedFields: Object.keys(updateData)
    }, userId)

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          company: updatedUser.company,
          industry: updatedUser.industry,
          role: updatedUser.role,
          audience: updatedUser.audience,
          voice: updatedUser.voice,
          bannedTerms: updatedUser.bannedTerms,
          safety: updatedUser.safety,
          updatedAt: updatedUser.updatedAt?.toISOString()
        }
      },
      message: 'Profile updated successfully'
    })
  })
)

// POST /api/users/onboarding - Complete onboarding flow
router.post('/onboarding',
  validateRequest(onboardingSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const onboardingData = req.body

    // Update user profile with onboarding data
    const userUpdateData = {
      company: onboardingData.company,
      industry: onboardingData.industry,
      role: onboardingData.role,
      audience: onboardingData.audience,
      voice: onboardingData.voice,
      bannedTerms: onboardingData.bannedTerms,
      safety: onboardingData.safety,
      // Store platform and goal preferences in user profile
      preferredHookCategories: onboardingData.primaryPlatforms,
    }

    const updatedUser = await UserService.update(userId, userUpdateData)

    // Create or update psychological profile if preferences provided
    if (onboardingData.preferredTriggers || onboardingData.avoidedTriggers || 
        onboardingData.riskTolerance || onboardingData.creativityLevel) {
      
      const psychProfileData = {
        preferredTriggers: onboardingData.preferredTriggers,
        avoidedTriggers: onboardingData.avoidedTriggers,
        riskTolerance: onboardingData.riskTolerance || 'medium',
        creativityLevel: onboardingData.creativityLevel || 'balanced',
        preferredCategories: ['question-based', 'statement-based'], // Default categories
        contentStyle: 'mixed' as const,
        urgencyPreference: 'moderate' as const,
        profileCompleteness: 75 // Base completion score
      }

      await PsychologicalProfileService.createOrUpdate(userId, psychProfileData)
    }

    logBusinessEvent('onboarding_completed', {
      userId,
      industry: onboardingData.industry,
      role: onboardingData.role,
      platforms: onboardingData.primaryPlatforms,
      goals: onboardingData.contentGoals,
      hasPsychPreferences: !!(onboardingData.preferredTriggers || onboardingData.avoidedTriggers)
    }, userId)

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          company: updatedUser.company,
          industry: updatedUser.industry,
          role: updatedUser.role,
          audience: updatedUser.audience,
          voice: updatedUser.voice,
          safety: updatedUser.safety
        },
        onboardingComplete: true
      },
      message: 'Onboarding completed successfully'
    })
  })
)

// GET /api/users/psychological-preferences - Get psychological profile
router.get('/psychological-preferences',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    
    const profile = await PsychologicalProfileService.findByUserId(userId)

    res.json({
      success: true,
      data: profile ? {
        preferredTriggers: profile.preferredTriggers,
        avoidedTriggers: profile.avoidedTriggers,
        riskTolerance: profile.riskTolerance,
        creativityLevel: profile.creativityLevel,
        preferredCategories: profile.preferredCategories,
        contentStyle: profile.contentStyle,
        urgencyPreference: profile.urgencyPreference,
        successfulFormulas: profile.successfulFormulas,
        underperformingFormulas: profile.underperformingFormulas,
        profileCompleteness: profile.profileCompleteness,
        lastUpdated: profile.lastUpdated?.toISOString()
      } : null,
      message: profile ? 'Psychological preferences retrieved' : 'No psychological profile found'
    })
  })
)

// PUT /api/users/psychological-preferences - Update psychological preferences
router.put('/psychological-preferences',
  validateRequest(psychologicalPreferencesSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const preferencesData = req.body

    // Calculate profile completeness
    const completenessScore = calculateProfileCompleteness(preferencesData)
    
    const updatedProfile = await PsychologicalProfileService.createOrUpdate(userId, {
      ...preferencesData,
      profileCompleteness: completenessScore
    })

    logBusinessEvent('psychological_preferences_updated', {
      userId,
      completeness: completenessScore,
      updatedFields: Object.keys(preferencesData)
    }, userId)

    res.json({
      success: true,
      data: {
        preferredTriggers: updatedProfile.preferredTriggers,
        avoidedTriggers: updatedProfile.avoidedTriggers,
        riskTolerance: updatedProfile.riskTolerance,
        creativityLevel: updatedProfile.creativityLevel,
        preferredCategories: updatedProfile.preferredCategories,
        contentStyle: updatedProfile.contentStyle,
        urgencyPreference: updatedProfile.urgencyPreference,
        profileCompleteness: updatedProfile.profileCompleteness,
        lastUpdated: updatedProfile.lastUpdated?.toISOString()
      },
      message: 'Psychological preferences updated successfully'
    })
  })
)

// GET /api/users/subscription - Get subscription status
router.get('/subscription',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    
    const user = await UserService.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const generationStatus = await UserService.getGenerationStatus(userId)

    res.json({
      success: true,
      data: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        isPremium: user.isPremium,
        currentPeriodEnd: user.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        stripeCustomerId: user.stripeCustomerId,
        generationStatus,
        usage: {
          proGenerationsUsed: user.proGenerationsUsed,
          draftGenerationsUsed: user.draftGenerationsUsed,
          weeklyDraftReset: user.weeklyDraftReset?.toISOString(),
          freeCredits: user.freeCredits,
          usedCredits: user.usedCredits
        }
      },
      message: 'Subscription status retrieved'
    })
  })
)

// GET /api/users/stats - Get user engagement statistics
router.get('/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const days = parseInt(req.query.days as string) || 30

    const stats = await AnalyticsService.getUserEngagementStats(userId, days)

    res.json({
      success: true,
      data: stats,
      message: `Retrieved user statistics for ${days} days`
    })
  })
)

// DELETE /api/users/account - Delete user account (soft delete)
router.delete('/account',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    
    // In a real implementation, this would be a soft delete or account deactivation
    // For now, we'll just log the request
    logBusinessEvent('account_deletion_requested', {
      userId
    }, userId)

    res.json({
      success: true,
      message: 'Account deletion request received. Please contact support to complete the process.'
    })
  })
)

// Helper function to calculate profile completeness
function calculateProfileCompleteness(preferences: any): number {
  let score = 0
  const maxScore = 7
  
  if (preferences.preferredTriggers?.length > 0) score += 2
  if (preferences.avoidedTriggers?.length > 0) score += 1
  if (preferences.riskTolerance) score += 1
  if (preferences.creativityLevel) score += 1
  if (preferences.preferredCategories?.length > 0) score += 1
  if (preferences.contentStyle) score += 1
  
  return Math.round((score / maxScore) * 100)
}

export default router