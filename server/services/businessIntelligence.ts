import { db } from '../db/index.js'
import { 
  businessIntelligence,
  users,
  hookGenerations,
  paymentHistory,
  usageTracking,
  NewBusinessIntelligence
} from '../db/sqlite-schema.js'
import { eq, desc, and, gte, lte, count, sql, avg, sum } from 'drizzle-orm'
import { logger } from '../middleware/logging.js'
import { v4 as uuidv4 } from 'uuid'

export class BusinessIntelligenceService {
  
  // ==================== REVENUE ANALYTICS ====================
  
  static async calculateRevenueMetrics(periodType: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const now = new Date()
    const periods = this.getPeriods(periodType, 30) // Get last 30 periods
    
    for (const period of periods) {
      try {
        // Total revenue
        const totalRevenue = await db.select({
          revenue: sum(paymentHistory.amount)
        })
        .from(paymentHistory)
        .where(
          and(
            eq(paymentHistory.status, 'succeeded'),
            gte(paymentHistory.paidAt, period.start),
            lte(paymentHistory.paidAt, period.end)
          )
        )

        // New customer revenue
        const newCustomerRevenue = await db.select({
          revenue: sum(paymentHistory.amount),
          customers: count()
        })
        .from(paymentHistory)
        .innerJoin(users, eq(paymentHistory.userId, users.id))
        .where(
          and(
            eq(paymentHistory.status, 'succeeded'),
            gte(paymentHistory.paidAt, period.start),
            lte(paymentHistory.paidAt, period.end),
            gte(users.createdAt, period.start) // New customers only
          )
        )

        // Recurring revenue
        const recurringRevenue = await db.select({
          revenue: sum(paymentHistory.amount),
          customers: count()
        })
        .from(paymentHistory)
        .innerJoin(users, eq(paymentHistory.userId, users.id))
        .where(
          and(
            eq(paymentHistory.status, 'succeeded'),
            gte(paymentHistory.paidAt, period.start),
            lte(paymentHistory.paidAt, period.end),
            sql`${users.createdAt} < ${period.start}` // Existing customers only
          )
        )

        // Store metrics
        const metrics: NewBusinessIntelligence[] = [
          {
            id: uuidv4(),
            metricName: 'total_revenue',
            metricValue: Math.round(totalRevenue[0].revenue || 0),
            metricType: 'revenue',
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: { currency: 'USD' }
          },
          {
            id: uuidv4(),
            metricName: 'new_customer_revenue',
            metricValue: Math.round(newCustomerRevenue[0].revenue || 0),
            metricType: 'revenue',
            dimension: 'customer_type',
            dimensionValue: 'new',
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: { 
              currency: 'USD',
              customers: newCustomerRevenue[0].customers
            }
          },
          {
            id: uuidv4(),
            metricName: 'recurring_revenue',
            metricValue: Math.round(recurringRevenue[0].revenue || 0),
            metricType: 'revenue',
            dimension: 'customer_type',
            dimensionValue: 'recurring',
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: { 
              currency: 'USD',
              customers: recurringRevenue[0].customers
            }
          }
        ]

        await db.insert(businessIntelligence).values(metrics)
        
      } catch (error) {
        logger.error(`Failed to calculate revenue metrics for period ${period.start} - ${period.end}:`, error)
      }
    }
  }

  // ==================== USAGE ANALYTICS ====================
  
  static async calculateUsageMetrics(periodType: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const periods = this.getPeriods(periodType, 30)
    
    for (const period of periods) {
      try {
        // Active users
        const activeUsers = await db.select({
          count: sql<number>`COUNT(DISTINCT ${hookGenerations.userId})`
        })
        .from(hookGenerations)
        .where(
          and(
            gte(hookGenerations.createdAt, period.start),
            lte(hookGenerations.createdAt, period.end)
          )
        )

        // Hook generations by platform
        const platformUsage = await db.select({
          platform: hookGenerations.platform,
          count: count()
        })
        .from(hookGenerations)
        .where(
          and(
            gte(hookGenerations.createdAt, period.start),
            lte(hookGenerations.createdAt, period.end)
          )
        )
        .groupBy(hookGenerations.platform)

        // Hook generations by subscription plan
        const planUsage = await db.select({
          plan: users.subscriptionPlan,
          count: count()
        })
        .from(hookGenerations)
        .innerJoin(users, eq(hookGenerations.userId, users.id))
        .where(
          and(
            gte(hookGenerations.createdAt, period.start),
            lte(hookGenerations.createdAt, period.end)
          )
        )
        .groupBy(users.subscriptionPlan)

        // Store active users metric
        await db.insert(businessIntelligence).values({
          id: uuidv4(),
          metricName: 'active_users',
          metricValue: activeUsers[0].count,
          metricType: 'usage',
          periodType,
          periodStart: period.start,
          periodEnd: period.end,
          metadata: {}
        } as NewBusinessIntelligence)

        // Store platform usage metrics
        for (const platform of platformUsage) {
          await db.insert(businessIntelligence).values({
            id: uuidv4(),
            metricName: 'hook_generations',
            metricValue: platform.count,
            metricType: 'usage',
            dimension: 'platform',
            dimensionValue: platform.platform,
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: {}
          } as NewBusinessIntelligence)
        }

        // Store plan usage metrics
        for (const plan of planUsage) {
          await db.insert(businessIntelligence).values({
            id: uuidv4(),
            metricName: 'hook_generations',
            metricValue: plan.count,
            metricType: 'usage',
            dimension: 'subscription_plan',
            dimensionValue: plan.plan || 'free',
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: {}
          } as NewBusinessIntelligence)
        }

      } catch (error) {
        logger.error(`Failed to calculate usage metrics for period ${period.start} - ${period.end}:`, error)
      }
    }
  }

  // ==================== CONVERSION ANALYTICS ====================
  
  static async calculateConversionMetrics(periodType: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const periods = this.getPeriods(periodType, 30)
    
    for (const period of periods) {
      try {
        // New signups
        const newSignups = await db.select({
          count: count()
        })
        .from(users)
        .where(
          and(
            gte(users.createdAt, period.start),
            lte(users.createdAt, period.end)
          )
        )

        // Trial to paid conversions
        const trialConversions = await db.select({
          count: count()
        })
        .from(users)
        .where(
          and(
            eq(users.isPremium, true),
            gte(users.updatedAt, period.start),
            lte(users.updatedAt, period.end),
            sql`${users.createdAt} < ${period.start}` // Existing trial users
          )
        )

        // Free to paid conversions
        const freeConversions = await db.select({
          count: count()
        })
        .from(paymentHistory)
        .innerJoin(users, eq(paymentHistory.userId, users.id))
        .where(
          and(
            eq(paymentHistory.status, 'succeeded'),
            gte(paymentHistory.paidAt, period.start),
            lte(paymentHistory.paidAt, period.end),
            sql`NOT EXISTS (
              SELECT 1 FROM ${paymentHistory} ph2 
              WHERE ph2.user_id = ${paymentHistory.userId} 
              AND ph2.paid_at < ${period.start}
              AND ph2.status = 'succeeded'
            )`
          )
        )

        // Store conversion metrics
        const metrics: NewBusinessIntelligence[] = [
          {
            id: uuidv4(),
            metricName: 'new_signups',
            metricValue: newSignups[0].count,
            metricType: 'conversion',
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: {}
          },
          {
            id: uuidv4(),
            metricName: 'trial_to_paid_conversions',
            metricValue: trialConversions[0].count,
            metricType: 'conversion',
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: {}
          },
          {
            id: uuidv4(),
            metricName: 'free_to_paid_conversions',
            metricValue: freeConversions[0].count,
            metricType: 'conversion',
            periodType,
            periodStart: period.start,
            periodEnd: period.end,
            metadata: {}
          }
        ]

        await db.insert(businessIntelligence).values(metrics)

      } catch (error) {
        logger.error(`Failed to calculate conversion metrics for period ${period.start} - ${period.end}:`, error)
      }
    }
  }

  // ==================== CHURN ANALYTICS ====================
  
  static async calculateChurnMetrics(periodType: 'monthly' = 'monthly') {
    const periods = this.getPeriods(periodType, 12) // Last 12 months
    
    for (const period of periods) {
      try {
        // Customer churn
        const churnedCustomers = await db.select({
          count: count()
        })
        .from(users)
        .where(
          and(
            eq(users.cancelAtPeriodEnd, true),
            gte(users.currentPeriodEnd, period.start),
            lte(users.currentPeriodEnd, period.end)
          )
        )

        // Total active customers at start of period
        const activeCustomersStart = await db.select({
          count: count()
        })
        .from(users)
        .where(
          and(
            eq(users.isPremium, true),
            sql`${users.createdAt} < ${period.start}`
          )
        )

        const churnRate = activeCustomersStart[0].count > 0 
          ? (churnedCustomers[0].count / activeCustomersStart[0].count) * 100 
          : 0

        // Store churn metrics
        await db.insert(businessIntelligence).values({
          id: uuidv4(),
          metricName: 'customer_churn_rate',
          metricValue: Math.round(churnRate * 100), // Store as basis points
          metricType: 'conversion',
          periodType,
          periodStart: period.start,
          periodEnd: period.end,
          metadata: {
            churnedCustomers: churnedCustomers[0].count,
            activeCustomersStart: activeCustomersStart[0].count
          }
        } as NewBusinessIntelligence)

      } catch (error) {
        logger.error(`Failed to calculate churn metrics for period ${period.start} - ${period.end}:`, error)
      }
    }
  }

  // ==================== DASHBOARD DATA ====================
  
  static async getDashboardData(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const [revenue, usage, conversions] = await Promise.all([
      // Revenue metrics
      db.select({
        metricName: businessIntelligence.metricName,
        metricValue: sum(businessIntelligence.metricValue),
        dimension: businessIntelligence.dimension,
        dimensionValue: businessIntelligence.dimensionValue
      })
      .from(businessIntelligence)
      .where(
        and(
          eq(businessIntelligence.metricType, 'revenue'),
          gte(businessIntelligence.periodStart, cutoffDate)
        )
      )
      .groupBy(
        businessIntelligence.metricName,
        businessIntelligence.dimension,
        businessIntelligence.dimensionValue
      ),

      // Usage metrics
      db.select({
        metricName: businessIntelligence.metricName,
        metricValue: sum(businessIntelligence.metricValue),
        dimension: businessIntelligence.dimension,
        dimensionValue: businessIntelligence.dimensionValue
      })
      .from(businessIntelligence)
      .where(
        and(
          eq(businessIntelligence.metricType, 'usage'),
          gte(businessIntelligence.periodStart, cutoffDate)
        )
      )
      .groupBy(
        businessIntelligence.metricName,
        businessIntelligence.dimension,
        businessIntelligence.dimensionValue
      ),

      // Conversion metrics
      db.select({
        metricName: businessIntelligence.metricName,
        metricValue: sum(businessIntelligence.metricValue)
      })
      .from(businessIntelligence)
      .where(
        and(
          eq(businessIntelligence.metricType, 'conversion'),
          gte(businessIntelligence.periodStart, cutoffDate)
        )
      )
      .groupBy(businessIntelligence.metricName)
    ])

    return {
      revenue,
      usage,
      conversions,
      periodDays: days
    }
  }

  static async getTrendData(metricName: string, days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return await db.select({
      date: sql<string>`DATE(${businessIntelligence.periodStart})`,
      value: sum(businessIntelligence.metricValue),
      dimension: businessIntelligence.dimension,
      dimensionValue: businessIntelligence.dimensionValue
    })
    .from(businessIntelligence)
    .where(
      and(
        eq(businessIntelligence.metricName, metricName),
        gte(businessIntelligence.periodStart, cutoffDate)
      )
    )
    .groupBy(
      sql`DATE(${businessIntelligence.periodStart})`,
      businessIntelligence.dimension,
      businessIntelligence.dimensionValue
    )
    .orderBy(sql`DATE(${businessIntelligence.periodStart})`)
  }

  // ==================== HELPER METHODS ====================
  
  private static getPeriods(periodType: 'daily' | 'weekly' | 'monthly', count: number) {
    const periods = []
    const now = new Date()
    
    for (let i = count - 1; i >= 0; i--) {
      let start: Date, end: Date
      
      switch (periodType) {
        case 'daily':
          start = new Date(now)
          start.setDate(now.getDate() - i)
          start.setHours(0, 0, 0, 0)
          end = new Date(start)
          end.setHours(23, 59, 59, 999)
          break
          
        case 'weekly':
          start = new Date(now)
          start.setDate(now.getDate() - (i * 7))
          start.setDate(start.getDate() - start.getDay()) // Start of week (Sunday)
          start.setHours(0, 0, 0, 0)
          end = new Date(start)
          end.setDate(start.getDate() + 6) // End of week (Saturday)
          end.setHours(23, 59, 59, 999)
          break
          
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0)
          end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
          break
          
        default:
          throw new Error(`Unsupported period type: ${periodType}`)
      }
      
      periods.push({ start, end })
    }
    
    return periods
  }

  // ==================== AUTOMATED CALCULATIONS ====================
  
  static async runDailyCalculations() {
    logger.info('Starting daily BI calculations...')
    
    try {
      await Promise.all([
        this.calculateRevenueMetrics('daily'),
        this.calculateUsageMetrics('daily'),
        this.calculateConversionMetrics('daily')
      ])
      
      logger.info('Daily BI calculations completed successfully')
    } catch (error) {
      logger.error('Failed to run daily BI calculations:', error)
    }
  }

  static async runWeeklyCalculations() {
    logger.info('Starting weekly BI calculations...')
    
    try {
      await Promise.all([
        this.calculateRevenueMetrics('weekly'),
        this.calculateUsageMetrics('weekly'),
        this.calculateConversionMetrics('weekly')
      ])
      
      logger.info('Weekly BI calculations completed successfully')
    } catch (error) {
      logger.error('Failed to run weekly BI calculations:', error)
    }
  }

  static async runMonthlyCalculations() {
    logger.info('Starting monthly BI calculations...')
    
    try {
      await Promise.all([
        this.calculateRevenueMetrics('monthly'),
        this.calculateUsageMetrics('monthly'),
        this.calculateConversionMetrics('monthly'),
        this.calculateChurnMetrics('monthly')
      ])
      
      logger.info('Monthly BI calculations completed successfully')
    } catch (error) {
      logger.error('Failed to run monthly BI calculations:', error)
    }
  }
}