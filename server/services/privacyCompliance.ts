import { db } from '../db/index.js'
import { userConsent } from '../db/sqlite-schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../middleware/logging.js'

export class PrivacyComplianceService {
  
  // ==================== CONSENT MANAGEMENT ====================
  
  static async recordConsent(
    userId: string | null,
    sessionId: string | null,
    consentType: 'analytics' | 'marketing' | 'functional' | 'performance',
    consented: boolean,
    consentData?: any
  ) {
    try {
      const consentRecord = {
        id: uuidv4(),
        userId,
        sessionId,
        consentType,
        consented,
        consentData: consentData || null
      }

      const result = await db.insert(userConsent).values(consentRecord).returning()
      return result[0]
    } catch (error) {
      logger.error('Failed to record user consent:', error)
      throw error
    }
  }

  static async getConsent(userId: string | null, sessionId: string | null, consentType: string) {
    try {
      const query = db.select()
        .from(userConsent)
        .where(
          and(
            eq(userConsent.consentType, consentType),
            userId ? eq(userConsent.userId, userId) : (sessionId ? eq(userConsent.sessionId, sessionId) : sql`false`)
          )
        )
        .orderBy(desc(userConsent.createdAt))
        .limit(1)

      const result = await query
      return result[0] || null
    } catch (error) {
      logger.error('Failed to get user consent:', error)
      return null
    }
  }

  static async hasAnalyticsConsent(userId: string | null, sessionId: string | null): Promise<boolean> {
    const consent = await this.getConsent(userId, sessionId, 'analytics')
    return consent?.consented || false
  }

  static async hasPerformanceConsent(userId: string | null, sessionId: string | null): Promise<boolean> {
    const consent = await this.getConsent(userId, sessionId, 'performance')
    return consent?.consented || false
  }

  static async getUserConsentProfile(userId: string) {
    try {
      const consents = await db.select()
        .from(userConsent)
        .where(eq(userConsent.userId, userId))
        .orderBy(desc(userConsent.createdAt))

      const consentProfile = {
        analytics: false,
        marketing: false,
        functional: true, // Always true for essential functionality
        performance: false
      }

      // Get the latest consent for each type
      const latestConsents = new Map()
      for (const consent of consents) {
        if (!latestConsents.has(consent.consentType)) {
          latestConsents.set(consent.consentType, consent)
        }
      }

      for (const [type, consent] of latestConsents.entries()) {
        if (type in consentProfile) {
          consentProfile[type as keyof typeof consentProfile] = consent.consented
        }
      }

      return consentProfile
    } catch (error) {
      logger.error('Failed to get user consent profile:', error)
      return {
        analytics: false,
        marketing: false,
        functional: true,
        performance: false
      }
    }
  }

  // ==================== DATA RETENTION & CLEANUP ====================
  
  static async cleanupExpiredData(retentionDays: number = 365) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      // Clean up analytics events for users who withdrew consent
      const analyticsCleanup = await db.execute(sql`
        DELETE FROM analytics_events 
        WHERE user_id IN (
          SELECT DISTINCT user_id 
          FROM user_consent 
          WHERE consent_type = 'analytics' 
          AND consented = false 
          AND created_at >= ${cutoffDate}
        )
      `)

      // Clean up web vitals data
      const webVitalsCleanup = await db.execute(sql`
        DELETE FROM web_vitals 
        WHERE user_id IN (
          SELECT DISTINCT user_id 
          FROM user_consent 
          WHERE consent_type = 'performance' 
          AND consented = false 
          AND created_at >= ${cutoffDate}
        )
      `)

      // Clean up user journey tracking
      const journeyCleanup = await db.execute(sql`
        DELETE FROM user_journey_tracking 
        WHERE user_id IN (
          SELECT DISTINCT user_id 
          FROM user_consent 
          WHERE consent_type = 'analytics' 
          AND consented = false 
          AND created_at >= ${cutoffDate}
        )
      `)

      logger.info('Privacy compliance cleanup completed', {
        analyticsRecordsDeleted: 'completed',
        webVitalsRecordsDeleted: 'completed',
        journeyRecordsDeleted: 'completed'
      })

      return {
        analyticsRecordsDeleted: 0, // Placeholder count
        webVitalsRecordsDeleted: 0, // Placeholder count
        journeyRecordsDeleted: 0 // Placeholder count
      }
    } catch (error) {
      logger.error('Failed to cleanup expired data:', error)
      throw error
    }
  }

  static async anonymizeUserData(userId: string) {
    try {
      // Anonymize analytics events
      await db.execute(sql`
        UPDATE analytics_events 
        SET user_id = NULL, 
            event_data = jsonb_set(event_data, '{user_anonymized}', 'true')
        WHERE user_id = ${userId}
      `)

      // Anonymize web vitals
      await db.execute(sql`
        UPDATE web_vitals 
        SET user_id = NULL, 
            user_agent = 'anonymized'
        WHERE user_id = ${userId}
      `)

      // Anonymize user journey tracking
      await db.execute(sql`
        UPDATE user_journey_tracking 
        SET user_id = NULL,
            metadata = jsonb_set(metadata, '{user_anonymized}', 'true')
        WHERE user_id = ${userId}
      `)

      // Anonymize API usage tracking
      await db.execute(sql`
        UPDATE api_usage_tracking 
        SET user_id = NULL,
            user_agent = 'anonymized',
            ip_address = '0.0.0.0'
        WHERE user_id = ${userId}
      `)

      logger.info('User data anonymized successfully', { userId })
      
      return { success: true }
    } catch (error) {
      logger.error('Failed to anonymize user data:', error)
      throw error
    }
  }

  // ==================== GDPR COMPLIANCE ====================
  
  static async handleDataSubjectRequest(
    userId: string, 
    requestType: 'access' | 'portability' | 'erasure' | 'rectification'
  ) {
    try {
      switch (requestType) {
        case 'access':
        case 'portability':
          return await this.exportUserData(userId)
          
        case 'erasure':
          return await this.deleteUserData(userId)
          
        case 'rectification':
          // This would typically involve allowing the user to update their data
          // For now, we'll just log the request
          logger.info('Data rectification request received', { userId })
          return { success: true, message: 'Rectification request logged' }
          
        default:
          throw new Error(`Unsupported request type: ${requestType}`)
      }
    } catch (error) {
      logger.error('Failed to handle data subject request:', error)
      throw error
    }
  }

  private static async exportUserData(userId: string) {
    try {
      // Get user profile data
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      // Get analytics data
      const analyticsData = await db.select()
        .from(analyticsEvents)
        .where(eq(analyticsEvents.userId, userId))
        .orderBy(desc(analyticsEvents.createdAt))

      // Get hook generations
      const hookData = await db.select()
        .from(hookGenerations)
        .where(eq(hookGenerations.userId, userId))
        .orderBy(desc(hookGenerations.createdAt))

      // Get consent history
      const consentData = await db.select()
        .from(userConsent)
        .where(eq(userConsent.userId, userId))
        .orderBy(desc(userConsent.createdAt))

      const exportData = {
        exportDate: new Date().toISOString(),
        user: user[0],
        analytics: analyticsData,
        hookGenerations: hookData,
        consentHistory: consentData,
        metadata: {
          totalRecords: analyticsData.length + hookData.length + consentData.length,
          dataTypes: ['profile', 'analytics', 'hook_generations', 'consent_history']
        }
      }

      logger.info('User data exported successfully', { 
        userId, 
        recordCount: exportData.metadata.totalRecords 
      })

      return exportData
    } catch (error) {
      logger.error('Failed to export user data:', error)
      throw error
    }
  }

  private static async deleteUserData(userId: string) {
    try {
      // Delete in reverse order of dependencies
      await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, userId))
      await db.delete(webVitals).where(eq(webVitals.userId, userId))
      await db.delete(userJourneyTracking).where(eq(userJourneyTracking.userId, userId))
      await db.delete(apiUsageTracking).where(eq(apiUsageTracking.userId, userId))
      await db.delete(errorTracking).where(eq(errorTracking.userId, userId))
      await db.delete(hookPerformanceAnalytics).where(eq(hookPerformanceAnalytics.userId, userId))
      await db.delete(favoriteHooks).where(eq(favoriteHooks.userId, userId))
      await db.delete(hookGenerations).where(eq(hookGenerations.userId, userId))
      await db.delete(psychologicalProfiles).where(eq(psychologicalProfiles.userId, userId))
      await db.delete(userConsent).where(eq(userConsent.userId, userId))
      await db.delete(paymentHistory).where(eq(paymentHistory.userId, userId))
      await db.delete(usageTracking).where(eq(usageTracking.userId, userId))
      
      // Finally delete the user account
      await db.delete(users).where(eq(users.id, userId))

      logger.info('User data deleted successfully', { userId })
      
      return { success: true, message: 'All user data has been permanently deleted' }
    } catch (error) {
      logger.error('Failed to delete user data:', error)
      throw error
    }
  }

  // ==================== CONSENT VALIDATION MIDDLEWARE ====================
  
  static createConsentMiddleware() {
    return async (req: any, res: any, next: any) => {
      const userId = req.user?.id
      const sessionId = req.sessionID
      const path = req.path

      // Skip consent check for essential endpoints
      const essentialPaths = ['/api/auth', '/api/health', '/api/analytics/consent']
      if (essentialPaths.some(p => path.startsWith(p))) {
        return next()
      }

      // Check if analytics consent is required for this endpoint
      const analyticsEndpoints = ['/api/analytics', '/api/hooks/generate']
      const requiresAnalyticsConsent = analyticsEndpoints.some(p => path.startsWith(p))

      if (requiresAnalyticsConsent) {
        const hasConsent = await this.hasAnalyticsConsent(userId, sessionId)
        if (!hasConsent) {
          return res.status(403).json({
            success: false,
            error: 'Analytics consent required',
            message: 'This feature requires consent to analytics data collection'
          })
        }
      }

      next()
    }
  }
}

// Fix missing imports
import { sql } from 'drizzle-orm'
import { 
  users, 
  hookGenerations, 
  favoriteHooks, 
  psychologicalProfiles,
  hookPerformanceAnalytics,
  analyticsEvents,
  webVitals,
  userJourneyTracking,
  apiUsageTracking,
  errorTracking,
  paymentHistory,
  usageTracking
} from '../db/sqlite-schema.js'