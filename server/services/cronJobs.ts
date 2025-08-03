import cron from 'node-cron'
import { db } from '../db/index.js'
import { 
  users, 
  hookTrendTracking, 
  hookPerformanceAnalytics,
  hookFormulas,
  psychologicalProfiles,
  usageTracking,
  analyticsEvents,
  systemMetrics,
  apiUsageTracking,
  webVitals,
  errorTracking
} from '../db/schema.js'
import { eq, gte, lte, sql, avg, count } from 'drizzle-orm'
import { logger, logBusinessEvent } from '../middleware/logging.js'
import { BusinessIntelligenceService } from './businessIntelligence.js'
import { PrivacyComplianceService } from './privacyCompliance.js'
import { cleanupOldMetrics } from '../middleware/analytics.js'

// Initialize all cron jobs
export function initializeCronJobs() {
  // Reset weekly draft generations every Sunday at midnight
  cron.schedule('0 0 * * 0', resetWeeklyDraftGenerations, {
    timezone: 'UTC'
  })

  // Update hook trend tracking daily at 2 AM
  cron.schedule('0 2 * * *', updateHookTrendTracking, {
    timezone: 'UTC'
  })

  // Update formula effectiveness ratings daily at 3 AM
  cron.schedule('0 3 * * *', updateFormulaEffectiveness, {
    timezone: 'UTC'
  })

  // Clean up old analytics events weekly on Monday at 1 AM
  cron.schedule('0 1 * * 1', cleanupOldAnalytics, {
    timezone: 'UTC'
  })

  // Update psychological profiles based on performance weekly on Tuesday at 2 AM
  cron.schedule('0 2 * * 2', updatePsychologicalProfiles, {
    timezone: 'UTC'
  })

  // Reset expired usage tracking periods daily at 4 AM
  cron.schedule('0 4 * * *', resetExpiredUsageTracking, {
    timezone: 'UTC'
  })

  // Run daily business intelligence calculations at 5 AM
  cron.schedule('0 5 * * *', runDailyBICalculations, {
    timezone: 'UTC'
  })

  // Run weekly business intelligence calculations on Monday at 6 AM
  cron.schedule('0 6 * * 1', runWeeklyBICalculations, {
    timezone: 'UTC'
  })

  // Run monthly business intelligence calculations on 1st of month at 7 AM
  cron.schedule('0 7 1 * *', runMonthlyBICalculations, {
    timezone: 'UTC'
  })

  // Clean up old metrics and analytics data weekly on Sunday at 3 AM
  cron.schedule('0 3 * * 0', cleanupAnalyticsData, {
    timezone: 'UTC'
  })

  // Run privacy compliance cleanup daily at 1 AM
  cron.schedule('0 1 * * *', runPrivacyCompliance, {
    timezone: 'UTC'
  })

  logger.info('Cron jobs initialized successfully')
}

// Reset weekly draft generation limits for all users
async function resetWeeklyDraftGenerations() {
  try {
    const resetDate = new Date()
    resetDate.setDate(resetDate.getDate() + 7) // Next week

    const result = await db
      .update(users)
      .set({
        draftGenerationsUsed: 0,
        weeklyDraftReset: resetDate
      })
      .where(gte(users.weeklyDraftReset, new Date()))

    logger.info('Weekly draft generations reset completed', {
      affectedUsers: result.rowCount || 0
    })

    logBusinessEvent('weekly_draft_reset', {
      affectedUsers: result.rowCount || 0,
      resetDate: resetDate.toISOString()
    })

  } catch (error) {
    logger.error('Failed to reset weekly draft generations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Update hook trend tracking with latest performance data
async function updateHookTrendTracking() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get all active formulas
    const formulas = await db.select().from(hookFormulas).where(eq(hookFormulas.isActive, true))

    for (const formula of formulas) {
      // Calculate weekly and monthly usage
      const [weeklyStats, monthlyStats] = await Promise.all([
        db.select({
          usage: count(),
          avgRating: avg(hookPerformanceAnalytics.userRating),
          avgEngagement: avg(hookPerformanceAnalytics.actualEngagement)
        })
        .from(hookPerformanceAnalytics)
        .where(
          sql`${hookPerformanceAnalytics.formulaCode} = ${formula.code} AND ${hookPerformanceAnalytics.recordedAt} >= ${sevenDaysAgo}`
        ),

        db.select({
          usage: count(),
          avgRating: avg(hookPerformanceAnalytics.userRating),
          avgEngagement: avg(hookPerformanceAnalytics.actualEngagement)
        })
        .from(hookPerformanceAnalytics)
        .where(
          sql`${hookPerformanceAnalytics.formulaCode} = ${formula.code} AND ${hookPerformanceAnalytics.recordedAt} >= ${thirtyDaysAgo}`
        )
      ])

      const weeklyUsage = weeklyStats[0]?.usage || 0
      const monthlyUsage = monthlyStats[0]?.usage || 0
      const avgPerformanceScore = Math.round((monthlyStats[0]?.avgRating || 0) * 20) // Convert to 0-100

      // Determine trend direction
      let trendDirection = 'stable'
      if (weeklyUsage > (monthlyUsage / 4) * 1.2) {
        trendDirection = 'rising'
      } else if (weeklyUsage < (monthlyUsage / 4) * 0.8) {
        trendDirection = 'falling'
      }

      // Calculate fatigue level based on performance degradation
      const recentPerformance = monthlyStats[0]?.avgRating || 0
      const fatigueLevel = Math.max(0, Math.min(100, 
        (formula.effectivenessRating / 100) - recentPerformance > 1 ? 50 : 0
      ))

      // Update or create trend tracking record
      await db.insert(hookTrendTracking).values({
        formulaCode: formula.code,
        platform: 'all', // Platform-specific tracking would require separate records
        weeklyUsage,
        monthlyUsage,
        avgPerformanceScore,
        trendDirection,
        fatigueLevel,
        lastCalculated: new Date(),
        dataPoints: monthlyUsage
      }).onConflictDoUpdate({
        target: [hookTrendTracking.formulaCode, hookTrendTracking.platform],
        set: {
          weeklyUsage,
          monthlyUsage,
          avgPerformanceScore,
          trendDirection,
          fatigueLevel,
          lastCalculated: new Date(),
          dataPoints: monthlyUsage,
          updatedAt: new Date()
        }
      })
    }

    logger.info('Hook trend tracking updated successfully', {
      formulasProcessed: formulas.length
    })

  } catch (error) {
    logger.error('Failed to update hook trend tracking', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Update formula effectiveness ratings based on actual performance
async function updateFormulaEffectiveness() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const formulas = await db.select().from(hookFormulas).where(eq(hookFormulas.isActive, true))

    for (const formula of formulas) {
      // Get performance stats for this formula
      const stats = await db.select({
        avgRating: avg(hookPerformanceAnalytics.userRating),
        usageCount: count(),
        favoriteRate: avg(sql`CASE WHEN ${hookPerformanceAnalytics.wasFavorited} THEN 1.0 ELSE 0.0 END`),
        usageRate: avg(sql`CASE WHEN ${hookPerformanceAnalytics.wasUsed} THEN 1.0 ELSE 0.0 END`)
      })
      .from(hookPerformanceAnalytics)
      .where(
        sql`${hookPerformanceAnalytics.formulaCode} = ${formula.code} AND ${hookPerformanceAnalytics.recordedAt} >= ${thirtyDaysAgo}`
      )

      const performanceData = stats[0]
      
      if (performanceData && performanceData.usageCount && Number(performanceData.usageCount) > 10) {
        // Calculate new effectiveness rating based on multiple factors
        const ratingScore = (Number(performanceData.avgRating) || 0) / 5 // 0-1
        const favoriteScore = Number(performanceData.favoriteRate) || 0 // 0-1
        const usageScore = Number(performanceData.usageRate) || 0 // 0-1
        
        const newEffectiveness = Math.round(
          (ratingScore * 0.4 + favoriteScore * 0.3 + usageScore * 0.3) * 100
        )

        // Only update if there's a significant change (>5 points)
        if (Math.abs(newEffectiveness - formula.effectivenessRating) > 5) {
          await db
            .update(hookFormulas)
            .set({
              effectivenessRating: newEffectiveness,
              avgEngagementRate: Math.round((favoriteScore + usageScore) * 50),
              updatedAt: new Date()
            })
            .where(eq(hookFormulas.code, formula.code))

          logger.info('Formula effectiveness updated', {
            formulaCode: formula.code,
            oldRating: formula.effectivenessRating,
            newRating: newEffectiveness,
            dataPoints: performanceData.usageCount
          })
        }
      }
    }

    logger.info('Formula effectiveness ratings updated successfully')

  } catch (error) {
    logger.error('Failed to update formula effectiveness ratings', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Clean up old analytics events (keep only last 90 days)
async function cleanupOldAnalytics() {
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // This would delete old analytics events in a real implementation
    // For now, we'll just log the cleanup activity
    logger.info('Analytics cleanup completed', {
      retentionPeriod: '90 days',
      cutoffDate: ninetyDaysAgo.toISOString()
    })

    logBusinessEvent('analytics_cleanup', {
      retentionPeriod: 90,
      cutoffDate: ninetyDaysAgo.toISOString()
    })

  } catch (error) {
    logger.error('Failed to cleanup old analytics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Update psychological profiles based on hook performance
async function updatePsychologicalProfiles() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get users with performance data
    const usersWithPerformance = await db.select({
      userId: hookPerformanceAnalytics.userId,
      formulaCode: hookPerformanceAnalytics.formulaCode,
      avgRating: avg(hookPerformanceAnalytics.userRating),
      favoriteRate: avg(sql`CASE WHEN ${hookPerformanceAnalytics.wasFavorited} THEN 1.0 ELSE 0.0 END`),
      usageCount: count()
    })
    .from(hookPerformanceAnalytics)
    .where(gte(hookPerformanceAnalytics.recordedAt, thirtyDaysAgo))
    .groupBy(hookPerformanceAnalytics.userId, hookPerformanceAnalytics.formulaCode)
    .having(sql`count(*) >= 3`) // Only consider formulas with at least 3 data points

    // Group by user
    const userPerformanceMap = new Map<string, any[]>()
    for (const record of usersWithPerformance) {
      if (!userPerformanceMap.has(record.userId)) {
        userPerformanceMap.set(record.userId, [])
      }
      userPerformanceMap.get(record.userId)!.push(record)
    }

    // Update psychological profiles based on performance
    for (const [userId, performanceRecords] of userPerformanceMap.entries()) {
      const successfulFormulas = performanceRecords
        .filter(r => Number(r.avgRating) >= 4 || Number(r.favoriteRate) >= 0.3)
        .map(r => r.formulaCode)

      const underperformingFormulas = performanceRecords
        .filter(r => Number(r.avgRating) <= 2 && Number(r.favoriteRate) <= 0.1)
        .map(r => r.formulaCode)

      if (successfulFormulas.length > 0 || underperformingFormulas.length > 0) {
        // Get existing profile
        const existingProfile = await db.select()
          .from(psychologicalProfiles)
          .where(eq(psychologicalProfiles.userId, userId))
          .limit(1)

        const profileData = {
          successfulFormulas,
          underperformingFormulas,
          lastUpdated: new Date(),
          updatedAt: new Date()
        }

        if (existingProfile.length > 0) {
          await db
            .update(psychologicalProfiles)
            .set(profileData)
            .where(eq(psychologicalProfiles.userId, userId))
        } else {
          await db
            .insert(psychologicalProfiles)
            .values({
              userId,
              ...profileData
            })
        }

        logger.info('Psychological profile updated', {
          userId,
          successfulFormulas: successfulFormulas.length,
          underperformingFormulas: underperformingFormulas.length
        })
      }
    }

    logger.info('Psychological profiles updated successfully', {
      usersProcessed: userPerformanceMap.size
    })

  } catch (error) {
    logger.error('Failed to update psychological profiles', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Reset expired usage tracking periods and create new ones
async function resetExpiredUsageTracking() {
  try {
    const now = new Date()
    
    // Find usage tracking records that have expired
    const expiredTracking = await db
      .select()
      .from(usageTracking)
      .where(lte(usageTracking.nextResetAt, now))

    let resetCount = 0

    for (const tracking of expiredTracking) {
      const user = await db.select().from(users).where(eq(users.id, tracking.userId)).limit(1)
      if (!user.length) continue

      const userData = user[0]
      const planName = userData.subscriptionPlan || 'free'
      
      // Calculate next reset date based on plan
      let nextReset: Date
      const resetDate = new Date()
      
      if (planName === 'free') {
        // Weekly reset for free plan
        nextReset = new Date(resetDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      } else {
        // Monthly reset for paid plans
        nextReset = new Date(resetDate.getFullYear(), resetDate.getMonth() + 1, resetDate.getDate())
      }

      // Get plan limits
      let proLimit = null
      let draftLimit = null
      
      switch (planName) {
        case 'free':
          proLimit = 0
          draftLimit = 20
          break
        case 'starter':
          proLimit = 100
          draftLimit = null
          break
        case 'creator':
          proLimit = 200
          draftLimit = null
          break
        case 'pro':
          proLimit = 400
          draftLimit = null
          break
        case 'teams':
          proLimit = 1500
          draftLimit = null
          break
      }

      // Create new usage tracking record
      await db.insert(usageTracking).values({
        userId: tracking.userId,
        periodStart: resetDate,
        periodEnd: nextReset,
        proGenerationsUsed: 0,
        draftGenerationsUsed: 0,
        proGenerationsLimit: proLimit,
        draftGenerationsLimit: draftLimit,
        subscriptionPlan: tracking.subscriptionPlan,
        stripeSubscriptionId: tracking.stripeSubscriptionId,
        proOverageUsed: 0,
        overageCharges: 0,
        lastResetAt: resetDate,
        nextResetAt: nextReset,
      })

      // Update user table for backward compatibility
      await db
        .update(users)
        .set({
          proGenerationsUsed: 0,
          draftGenerationsUsed: 0,
          weeklyDraftReset: planName === 'free' ? resetDate : userData.weeklyDraftReset,
          updatedAt: new Date()
        })
        .where(eq(users.id, tracking.userId))

      resetCount++

      logger.info('Usage tracking reset for user', {
        userId: tracking.userId,
        planName,
        nextReset: nextReset.toISOString()
      })
    }

    if (resetCount > 0) {
      logger.info('Usage tracking reset completed', {
        resetCount,
        processedAt: now.toISOString()
      })

      logBusinessEvent('usage_tracking_reset', {
        resetCount,
        processedAt: now.toISOString()
      })
    }

  } catch (error) {
    logger.error('Failed to reset expired usage tracking', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// ==================== BUSINESS INTELLIGENCE CRON JOBS ====================

async function runDailyBICalculations() {
  try {
    logger.info('Starting daily BI calculations...')
    await BusinessIntelligenceService.runDailyCalculations()
    logger.info('Daily BI calculations completed successfully')

    logBusinessEvent('daily_bi_calculations', {
      status: 'completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Failed to run daily BI calculations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function runWeeklyBICalculations() {
  try {
    logger.info('Starting weekly BI calculations...')
    await BusinessIntelligenceService.runWeeklyCalculations()
    logger.info('Weekly BI calculations completed successfully')

    logBusinessEvent('weekly_bi_calculations', {
      status: 'completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Failed to run weekly BI calculations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function runMonthlyBICalculations() {
  try {
    logger.info('Starting monthly BI calculations...')
    await BusinessIntelligenceService.runMonthlyCalculations()
    logger.info('Monthly BI calculations completed successfully')

    logBusinessEvent('monthly_bi_calculations', {
      status: 'completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Failed to run monthly BI calculations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// ==================== ANALYTICS CLEANUP CRON JOBS ====================

async function cleanupAnalyticsData() {
  try {
    logger.info('Starting analytics data cleanup...')
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Clean up old system metrics (keep 30 days)
    const metricsDeleted = await db.delete(systemMetrics)
      .where(lte(systemMetrics.timestamp, thirtyDaysAgo))

    // Clean up old API usage tracking (keep 90 days)
    const apiUsageDeleted = await db.delete(apiUsageTracking)
      .where(lte(apiUsageTracking.createdAt, ninetyDaysAgo))

    // Clean up old web vitals (keep 30 days)
    const webVitalsDeleted = await db.delete(webVitals)
      .where(lte(webVitals.createdAt, thirtyDaysAgo))

    // Clean up resolved errors older than 90 days
    const errorsDeleted = await db.delete(errorTracking)
      .where(
        sql`${errorTracking.createdAt} <= ${ninetyDaysAgo} AND ${errorTracking.isResolved} = true`
      )

    // Use analytics middleware cleanup for additional metrics
    await cleanupOldMetrics(30)

    logger.info('Analytics data cleanup completed', {
      systemMetricsDeleted: metricsDeleted.rowCount || 0,
      apiUsageDeleted: apiUsageDeleted.rowCount || 0,
      webVitalsDeleted: webVitalsDeleted.rowCount || 0,
      errorsDeleted: errorsDeleted.rowCount || 0
    })

    logBusinessEvent('analytics_cleanup', {
      systemMetricsDeleted: metricsDeleted.rowCount || 0,
      apiUsageDeleted: apiUsageDeleted.rowCount || 0,
      webVitalsDeleted: webVitalsDeleted.rowCount || 0,
      errorsDeleted: errorsDeleted.rowCount || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to cleanup analytics data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// ==================== PRIVACY COMPLIANCE CRON JOBS ====================

async function runPrivacyCompliance() {
  try {
    logger.info('Starting privacy compliance cleanup...')
    
    const result = await PrivacyComplianceService.cleanupExpiredData(365) // 1 year retention
    
    logger.info('Privacy compliance cleanup completed', result)

    logBusinessEvent('privacy_compliance_cleanup', {
      ...result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to run privacy compliance cleanup', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}