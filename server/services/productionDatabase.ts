// Production Database Service - Optimized for Serverless
import { getServerlessDB } from '../db/serverless.js'
import { users, hooks, subscriptions, analytics } from '../db/schema.js'
import { eq, desc, and, gte, lte, count, sql } from 'drizzle-orm'

class ProductionDatabaseService {
  private static instance: ProductionDatabaseService
  
  private constructor() {}
  
  static getInstance(): ProductionDatabaseService {
    if (!ProductionDatabaseService.instance) {
      ProductionDatabaseService.instance = new ProductionDatabaseService()
    }
    return ProductionDatabaseService.instance
  }

  // Optimized user operations for serverless
  async getUserById(userId: string) {
    try {
      const db = await getServerlessDB()
      const result = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      return result[0] || null
    } catch (error) {
      console.error('Error fetching user:', error)
      throw new Error('Failed to fetch user')
    }
  }

  async createUser(userData: {
    id: string
    email: string
    displayName?: string
    photoURL?: string
    subscriptionTier: 'free' | 'pro' | 'enterprise'
  }) {
    try {
      const db = await getServerlessDB()
      const result = await db.insert(users).values({
        ...userData,
        createdAt: new Date(),
        lastLoginAt: new Date()
      }).returning()
      
      return result[0]
    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user')
    }
  }

  async updateUserLogin(userId: string) {
    try {
      const db = await getServerlessDB()
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId))
    } catch (error) {
      console.error('Error updating user login:', error)
      // Don't throw error for login updates as it's not critical
    }
  }

  // Optimized hook operations
  async createHook(hookData: {
    userId: string
    content: string
    hookType: string
    psychologicalFramework?: string
    metadata?: any
  }) {
    try {
      const db = await getServerlessDB()
      const result = await db.insert(hooks).values({
        ...hookData,
        createdAt: new Date()
      }).returning()
      
      return result[0]
    } catch (error) {
      console.error('Error creating hook:', error)
      throw new Error('Failed to create hook')
    }
  }

  async getUserHooks(userId: string, limit: number = 50) {
    try {
      const db = await getServerlessDB()
      const result = await db.select()
        .from(hooks)
        .where(eq(hooks.userId, userId))
        .orderBy(desc(hooks.createdAt))
        .limit(limit)
        
      return result
    } catch (error) {
      console.error('Error fetching user hooks:', error)
      throw new Error('Failed to fetch hooks')
    }
  }

  async getHookById(hookId: string, userId: string) {
    try {
      const db = await getServerlessDB()
      const result = await db.select()
        .from(hooks)
        .where(and(eq(hooks.id, hookId), eq(hooks.userId, userId)))
        .limit(1)
        
      return result[0] || null
    } catch (error) {
      console.error('Error fetching hook:', error)
      throw new Error('Failed to fetch hook')
    }
  }

  // Subscription management
  async getUserSubscription(userId: string) {
    try {
      const db = await getServerlessDB()
      const result = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
        
      return result[0] || null
    } catch (error) {
      console.error('Error fetching subscription:', error)
      throw new Error('Failed to fetch subscription')
    }
  }

  async createSubscription(subscriptionData: {
    userId: string
    stripeCustomerId: string
    stripeSubscriptionId: string
    tier: 'pro' | 'enterprise'
    status: 'active' | 'canceled' | 'past_due'
    currentPeriodStart: Date
    currentPeriodEnd: Date
  }) {
    try {
      const db = await getServerlessDB()
      const result = await db.insert(subscriptions).values({
        ...subscriptionData,
        createdAt: new Date()
      }).returning()
      
      return result[0]
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  async updateSubscription(subscriptionId: string, updates: {
    status?: 'active' | 'canceled' | 'past_due'
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
  }) {
    try {
      const db = await getServerlessDB()
      await db.update(subscriptions)
        .set(updates)
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw new Error('Failed to update subscription')
    }
  }

  // Analytics operations
  async trackEvent(eventData: {
    userId: string
    eventType: string
    eventData?: any
    metadata?: any
  }) {
    try {
      const db = await getServerlessDB()
      await db.insert(analytics).values({
        ...eventData,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error tracking event:', error)
      // Don't throw error for analytics as it's not critical
    }
  }

  async getUserAnalytics(userId: string, startDate: Date, endDate: Date) {
    try {
      const db = await getServerlessDB()
      const result = await db.select()
        .from(analytics)
        .where(
          and(
            eq(analytics.userId, userId),
            gte(analytics.createdAt, startDate),
            lte(analytics.createdAt, endDate)
          )
        )
        .orderBy(desc(analytics.createdAt))
        
      return result
    } catch (error) {
      console.error('Error fetching analytics:', error)
      throw new Error('Failed to fetch analytics')
    }
  }

  // User usage tracking for rate limiting
  async getUserDailyUsage(userId: string, date: Date = new Date()) {
    try {
      const db = await getServerlessDB()
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      const result = await db.select({ count: count() })
        .from(hooks)
        .where(
          and(
            eq(hooks.userId, userId),
            gte(hooks.createdAt, startOfDay),
            lte(hooks.createdAt, endOfDay)
          )
        )
        
      return result[0]?.count || 0
    } catch (error) {
      console.error('Error fetching daily usage:', error)
      return 0
    }
  }

  // Database health and maintenance
  async getSystemStats() {
    try {
      const db = await getServerlessDB()
      
      const [userCount, hookCount, subscriptionCount] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(hooks),
        db.select({ count: count() }).from(subscriptions)
      ])
      
      return {
        users: userCount[0]?.count || 0,
        hooks: hookCount[0]?.count || 0,
        subscriptions: subscriptionCount[0]?.count || 0,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
      throw new Error('Failed to fetch system stats')
    }
  }

  // Cleanup operations for data retention
  async cleanupOldAnalytics(retentionDays: number = 90) {
    try {
      const db = await getServerlessDB()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      
      await db.delete(analytics)
        .where(lte(analytics.createdAt, cutoffDate))
      
      console.log(`Cleaned up analytics data older than ${retentionDays} days`)
    } catch (error) {
      console.error('Error cleaning up analytics:', error)
      throw new Error('Failed to cleanup analytics')
    }
  }

  // Batch operations for efficiency
  async batchUpdateUserActivity(userIds: string[]) {
    try {
      const db = await getServerlessDB()
      const now = new Date()
      
      // Use raw SQL for batch update efficiency
      await db.execute(
        sql`UPDATE users SET last_login_at = ${now} WHERE id = ANY(${userIds})`
      )
    } catch (error) {
      console.error('Error batch updating user activity:', error)
      // Don't throw as this is not critical
    }
  }

  // Connection testing
  async testConnection() {
    try {
      const db = await getServerlessDB()
      await db.execute(sql`SELECT 1`)
      return { connected: true, timestamp: new Date().toISOString() }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Export singleton instance
export const productionDB = ProductionDatabaseService.getInstance()

// Convenience functions for common operations
export async function getUser(userId: string) {
  return await productionDB.getUserById(userId)
}

export async function createHook(hookData: {
  userId: string
  content: string
  hookType: string
  psychologicalFramework?: string
  metadata?: any
}) {
  return await productionDB.createHook(hookData)
}

export async function getUserHooks(userId: string, limit?: number) {
  return await productionDB.getUserHooks(userId, limit)
}

export async function trackAnalytics(eventData: {
  userId: string
  eventType: string
  eventData?: any
  metadata?: any
}) {
  return await productionDB.trackEvent(eventData)
}

export async function checkDailyUsage(userId: string) {
  return await productionDB.getUserDailyUsage(userId)
}