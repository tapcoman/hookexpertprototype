import { db } from '../db/index.js'
import { 
  users, 
  hookGenerations, 
  favoriteHooks, 
  hookFormulas,
  psychologicalProfiles,
  hookPerformanceAnalytics,
  analyticsEvents,
  abTestResults,
  hookTrendTracking,
  systemMetrics,
  webVitals,
  errorTracking,
  businessIntelligence,
  userJourneyTracking,
  apiUsageTracking,
  NewUser,
  NewHookGeneration,
  NewFavoriteHook,
  NewPsychologicalProfile,
  NewHookPerformanceAnalytics,
  NewAnalyticsEvent,
  NewSystemMetric,
  NewWebVital,
  NewErrorTracking,
  NewBusinessIntelligence,
  NewUserJourneyTracking,
  NewApiUsageTracking
} from '../db/schema.js'
import { eq, desc, and, or, gte, lte, count, sql, avg, sum } from 'drizzle-orm'
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js'
import { PaginatedResponse, GenerationStatus } from '../../shared/types.js'

// ==================== USER SERVICES ====================

export class UserService {
  static async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return result[0] || null
  }

  static async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] || null
  }

  static async findByFirebaseUid(firebaseUid: string) {
    const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1)
    return result[0] || null
  }

  static async create(userData: NewUser) {
    const result = await db.insert(users).values(userData).returning()
    return result[0]
  }

  static async update(id: string, userData: Partial<NewUser>) {
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning()
    
    if (result.length === 0) {
      throw new NotFoundError('User not found')
    }
    
    return result[0]
  }

  static async getGenerationStatus(userId: string): Promise<GenerationStatus> {
    const user = await this.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const now = new Date()
    const weeklyReset = new Date(user.weeklyDraftReset || now)
    const needsReset = now > weeklyReset

    // Reset weekly draft count if needed
    if (needsReset) {
      await this.update(userId, {
        draftGenerationsUsed: 0,
        weeklyDraftReset: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next week
      })
      user.draftGenerationsUsed = 0
    }

    const isPremium = user.isPremium || user.subscriptionStatus === 'active'
    const remainingProGenerations = isPremium ? 1000 : 0 // Effectively unlimited for premium
    const remainingDraftGenerations = Math.max(0, 20 - (user.draftGenerationsUsed || 0)) // Increased from 10 to 20
    
    // Calculate usage percentage for enhanced status reporting
    const totalLimit = isPremium ? 1000 : 20
    const totalUsed = isPremium ? (user.proGenerationsUsed || 0) : (user.draftGenerationsUsed || 0)
    const usagePercentage = Math.min(100, (totalUsed / totalLimit) * 100)

    return {
      canGenerate: isPremium || remainingDraftGenerations > 0,
      reason: !isPremium && remainingDraftGenerations === 0 ? 'Weekly draft limit reached' : undefined,
      remainingProGenerations,
      remainingDraftGenerations,
      resetDate: needsReset ? undefined : weeklyReset,
      subscriptionPlan: user.subscriptionPlan as any || 'free',
      usagePercentage
    }
  }

  static async incrementGenerationUsage(userId: string, isPro: boolean = false) {
    const field = isPro ? 'proGenerationsUsed' : 'draftGenerationsUsed'
    await db
      .update(users)
      .set({ [field]: sql`${users[field]} + 1` })
      .where(eq(users.id, userId))
  }

  static async syncFirebaseUser(firebaseUid: string, userData: {
    email: string
    firstName?: string
    lastName?: string
    emailVerified?: boolean
  }) {
    const existingUser = await this.findByFirebaseUid(firebaseUid)
    
    if (existingUser) {
      return await this.update(existingUser.id, {
        ...userData,
        firebaseUid
      })
    } else {
      return await this.create({
        ...userData,
        firebaseUid,
        safety: 'standard',
        freeCredits: 5,
        subscriptionStatus: 'free',
        isPremium: false
      } as NewUser)
    }
  }

  static async updateSubscriptionFromFirebase(
    firebaseUid: string, 
    subscriptionData: {
      subscriptionStatus: string
      isPremium: boolean
      subscriptionPlan?: string
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      currentPeriodEnd?: Date
      cancelAtPeriodEnd?: boolean
    }
  ) {
    const user = await this.findByFirebaseUid(firebaseUid)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    return await this.update(user.id, subscriptionData)
  }

  static async findUsersBySubscriptionStatus(status: string, limit: number = 100) {
    return await db.select()
      .from(users)
      .where(eq(users.subscriptionStatus, status))
      .limit(limit)
  }

  static async getUserStats(): Promise<{
    total: number
    verified: number
    premium: number
    recentSignups: number
  }> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [totalUsers, verifiedUsers, premiumUsers, recentUsers] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.emailVerified, true)),
      db.select({ count: count() }).from(users).where(eq(users.isPremium, true)),
      db.select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo))
    ])

    return {
      total: totalUsers[0].count,
      verified: verifiedUsers[0].count,
      premium: premiumUsers[0].count,
      recentSignups: recentUsers[0].count
    }
  }
}

// ==================== HOOK GENERATION SERVICES ====================

export class HookGenerationService {
  static async create(generationData: NewHookGeneration) {
    const result = await db.insert(hookGenerations).values(generationData).returning()
    return result[0]
  }

  static async findById(id: string) {
    const result = await db.select().from(hookGenerations).where(eq(hookGenerations.id, id)).limit(1)
    return result[0] || null
  }

  static async findByUserId(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponse<typeof hookGenerations.$inferSelect>> {
    const offset = (page - 1) * limit

    const [generations, totalResult] = await Promise.all([
      db.select()
        .from(hookGenerations)
        .where(eq(hookGenerations.userId, userId))
        .orderBy(desc(hookGenerations.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(hookGenerations)
        .where(eq(hookGenerations.userId, userId))
    ])

    const total = totalResult[0].count

    return {
      data: generations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async getRecentGenerations(userId: string, days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return await db.select()
      .from(hookGenerations)
      .where(
        and(
          eq(hookGenerations.userId, userId),
          gte(hookGenerations.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(hookGenerations.createdAt))
      .limit(50)
  }
}

// ==================== FAVORITE HOOKS SERVICES ====================

export class FavoriteHookService {
  static async create(favoriteData: NewFavoriteHook) {
    const result = await db.insert(favoriteHooks).values(favoriteData).returning()
    return result[0]
  }

  static async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<typeof favoriteHooks.$inferSelect>> {
    const offset = (page - 1) * limit

    const [favorites, totalResult] = await Promise.all([
      db.select()
        .from(favoriteHooks)
        .where(eq(favoriteHooks.userId, userId))
        .orderBy(desc(favoriteHooks.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(favoriteHooks)
        .where(eq(favoriteHooks.userId, userId))
    ])

    const total = totalResult[0].count

    return {
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async delete(id: string, userId: string) {
    const result = await db
      .delete(favoriteHooks)
      .where(
        and(
          eq(favoriteHooks.id, id),
          eq(favoriteHooks.userId, userId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new NotFoundError('Favorite hook not found')
    }

    return result[0]
  }

  static async exists(userId: string, generationId: string): Promise<boolean> {
    const result = await db.select({ id: favoriteHooks.id })
      .from(favoriteHooks)
      .where(
        and(
          eq(favoriteHooks.userId, userId),
          eq(favoriteHooks.generationId, generationId)
        )
      )
      .limit(1)

    return result.length > 0
  }
}

// ==================== PSYCHOLOGICAL PROFILE SERVICES ====================

export class PsychologicalProfileService {
  static async findByUserId(userId: string) {
    const result = await db.select().from(psychologicalProfiles).where(eq(psychologicalProfiles.userId, userId)).limit(1)
    return result[0] || null
  }

  static async createOrUpdate(userId: string, profileData: Partial<NewPsychologicalProfile>) {
    const existing = await this.findByUserId(userId)
    
    if (existing) {
      const result = await db
        .update(psychologicalProfiles)
        .set({ 
          ...profileData, 
          lastUpdated: sql`NOW()`,
          updatedAt: sql`NOW()`
        })
        .where(eq(psychologicalProfiles.userId, userId))
        .returning()
      return result[0]
    } else {
      const result = await db
        .insert(psychologicalProfiles)
        .values({ 
          userId, 
          ...profileData,
          lastUpdated: sql`NOW()`
        })
        .returning()
      return result[0]
    }
  }

  static async updateSuccessfulFormulas(userId: string, formulaCodes: string[]) {
    await db
      .update(psychologicalProfiles)
      .set({
        successfulFormulas: formulaCodes,
        lastUpdated: sql`NOW()`,
        updatedAt: sql`NOW()`
      })
      .where(eq(psychologicalProfiles.userId, userId))
  }

  static async updateUnderperformingFormulas(userId: string, formulaCodes: string[]) {
    await db
      .update(psychologicalProfiles)
      .set({
        underperformingFormulas: formulaCodes,
        lastUpdated: sql`NOW()`,
        updatedAt: sql`NOW()`
      })
      .where(eq(psychologicalProfiles.userId, userId))
  }

  // Enhanced profile analysis with performance learning
  static async analyzeUserPerformance(userId: string, days: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const performanceData = await db.select({
      formulaCode: hookPerformanceAnalytics.formulaCode,
      avgRating: avg(hookPerformanceAnalytics.userRating),
      usageCount: count(),
      favoriteRate: avg(sql`CASE WHEN ${hookPerformanceAnalytics.wasFavorited} THEN 1.0 ELSE 0.0 END`),
      usageRate: avg(sql`CASE WHEN ${hookPerformanceAnalytics.wasUsed} THEN 1.0 ELSE 0.0 END`),
      platform: hookPerformanceAnalytics.platform,
      objective: hookPerformanceAnalytics.objective
    })
    .from(hookPerformanceAnalytics)
    .where(
      and(
        eq(hookPerformanceAnalytics.userId, userId),
        gte(hookPerformanceAnalytics.recordedAt, cutoffDate)
      )
    )
    .groupBy(
      hookPerformanceAnalytics.formulaCode,
      hookPerformanceAnalytics.platform,
      hookPerformanceAnalytics.objective
    )

    return this.generateProfileInsights(performanceData)
  }

  private static generateProfileInsights(performanceData: any[]) {
    const successfulFormulas = performanceData
      .filter(d => (d.avgRating || 0) >= 4 && d.usageCount >= 3)
      .map(d => d.formulaCode)
      .slice(0, 10)

    const underperformingFormulas = performanceData
      .filter(d => (d.avgRating || 0) <= 2 && d.usageCount >= 2)
      .map(d => d.formulaCode)
      .slice(0, 10)

    const preferredCategories = this.extractPreferredCategories(performanceData)
    const riskTolerance = this.determineRiskTolerance(performanceData)
    const preferredTriggers = this.extractPreferredTriggers(performanceData)

    return {
      successfulFormulas,
      underperformingFormulas,
      preferredCategories,
      riskTolerance,
      preferredTriggers,
      profileCompleteness: Math.min(100, performanceData.length * 10)
    }
  }

  private static extractPreferredCategories(performanceData: any[]): string[] {
    // This would need formula category mapping - simplified implementation
    const categoryPerformance: Record<string, number[]> = {}
    
    // Group by formula categories and calculate average performance
    for (const data of performanceData) {
      const category = this.getFormulaCategory(data.formulaCode) // Would need implementation
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = []
      }
      categoryPerformance[category].push(data.avgRating || 0)
    }

    return Object.entries(categoryPerformance)
      .map(([category, ratings]) => ({
        category,
        avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length
      }))
      .filter(c => c.avgRating >= 3.5)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3)
      .map(c => c.category)
  }

  private static determineRiskTolerance(performanceData: any[]): string {
    // Analyze preference for high-risk vs low-risk formulas
    const highRiskPerformance = performanceData
      .filter(d => this.isHighRiskFormula(d.formulaCode))
      .reduce((acc, d) => acc + (d.avgRating || 0), 0)
    
    const lowRiskPerformance = performanceData
      .filter(d => !this.isHighRiskFormula(d.formulaCode))
      .reduce((acc, d) => acc + (d.avgRating || 0), 0)

    if (highRiskPerformance > lowRiskPerformance * 1.2) return 'high'
    if (lowRiskPerformance > highRiskPerformance * 1.2) return 'low'
    return 'medium'
  }

  private static extractPreferredTriggers(performanceData: any[]): string[] {
    // Extract psychological triggers from high-performing formulas
    const triggerPerformance: Record<string, number[]> = {}
    
    for (const data of performanceData) {
      const triggers = this.getFormulaTriggers(data.formulaCode) // Would need implementation
      for (const trigger of triggers) {
        if (!triggerPerformance[trigger]) {
          triggerPerformance[trigger] = []
        }
        triggerPerformance[trigger].push(data.avgRating || 0)
      }
    }

    return Object.entries(triggerPerformance)
      .map(([trigger, ratings]) => ({
        trigger,
        avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length
      }))
      .filter(t => t.avgRating >= 3.5)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5)
      .map(t => t.trigger)
  }

  private static getFormulaCategory(formulaCode: string): string {
    // Map formula codes to categories - would be enhanced with actual mapping
    if (formulaCode.startsWith('QH')) return 'question-based'
    if (formulaCode.startsWith('ST')) return 'statement-based'
    if (formulaCode.startsWith('NA')) return 'narrative'
    if (formulaCode.startsWith('UE')) return 'urgency-exclusivity'
    if (formulaCode.startsWith('EF')) return 'efficiency'
    return 'mixed'
  }

  private static isHighRiskFormula(formulaCode: string): boolean {
    // High-risk formulas based on research data
    const highRiskCodes = ['QH-04', 'ST-03', 'NA-02', 'UE-02', 'UE-03', 'AD-02', 'AD-03', 'AD-05']
    return highRiskCodes.includes(formulaCode)
  }

  private static getFormulaTriggers(formulaCode: string): string[] {
    // Map formula codes to psychological triggers - simplified implementation
    const triggerMap: Record<string, string[]> = {
      'QH-01': ['curiosity-gap', 'emotional-connection'],
      'QH-02': ['curiosity-gap', 'social-proof'],
      'QH-03': ['curiosity-gap', 'value-hit'],
      'QH-04': ['urgency-fomo', 'pain-point'],
      'ST-01': ['value-hit', 'authority-credibility'],
      'ST-02': ['surprise-shock', 'curiosity-gap'],
      // ... would be expanded with full mapping
    }
    
    return triggerMap[formulaCode] || ['curiosity-gap']
  }

  static async updateFromPerformanceAnalysis(userId: string) {
    const insights = await this.analyzeUserPerformance(userId)
    
    return await this.createOrUpdate(userId, {
      successfulFormulas: insights.successfulFormulas,
      underperformingFormulas: insights.underperformingFormulas,
      preferredCategories: insights.preferredCategories,
      riskTolerance: insights.riskTolerance as any,
      preferredTriggers: insights.preferredTriggers,
      profileCompleteness: insights.profileCompleteness,
      learningRate: Math.min(100, insights.profileCompleteness * 0.8)
    })
  }
}

// ==================== ENHANCED HOOK FORMULA SERVICES ====================

export class HookFormulaService {
  static async findAll(isActive: boolean = true) {
    return await db.select()
      .from(hookFormulas)
      .where(eq(hookFormulas.isActive, isActive))
      .orderBy(desc(hookFormulas.effectivenessRating))
  }

  static async findByCategory(category: string, isActive: boolean = true) {
    return await db.select()
      .from(hookFormulas)
      .where(
        and(
          eq(hookFormulas.category, category),
          eq(hookFormulas.isActive, isActive)
        )
      )
      .orderBy(desc(hookFormulas.effectivenessRating))
  }

  static async findByCode(code: string) {
    const result = await db.select().from(hookFormulas).where(eq(hookFormulas.code, code)).limit(1)
    return result[0] || null
  }

  static async getTopPerforming(limit: number = 10) {
    return await db.select()
      .from(hookFormulas)
      .where(eq(hookFormulas.isActive, true))
      .orderBy(desc(hookFormulas.effectivenessRating))
      .limit(limit)
  }

  // HOOK FATIGUE PREVENTION: Trend tracking and analysis
  static async getTrendAnalysis(platform: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return await db.select()
      .from(hookTrendTracking)
      .where(
        and(
          eq(hookTrendTracking.platform, platform),
          gte(hookTrendTracking.lastCalculated, thirtyDaysAgo)
        )
      )
      .orderBy(desc(hookTrendTracking.lastCalculated))
  }

  static async updateTrendData(formulaCode: string, platform: string, trendData: {
    weeklyUsage?: number
    monthlyUsage?: number
    avgPerformanceScore?: number
    trendDirection?: string
    fatigueLevel?: number
    consecutiveLowPerformance?: number
  }) {
    const existing = await db.select()
      .from(hookTrendTracking)
      .where(
        and(
          eq(hookTrendTracking.formulaCode, formulaCode),
          eq(hookTrendTracking.platform, platform)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return await db.update(hookTrendTracking)
        .set({
          ...trendData,
          lastCalculated: sql`NOW()`,
          updatedAt: sql`NOW()`
        })
        .where(
          and(
            eq(hookTrendTracking.formulaCode, formulaCode),
            eq(hookTrendTracking.platform, platform)
          )
        )
        .returning()
    } else {
      return await db.insert(hookTrendTracking)
        .values({
          formulaCode,
          platform,
          ...trendData,
          lastCalculated: sql`NOW()`
        })
        .returning()
    }
  }

  static async getFatigueAnalysis(platform?: string) {
    const query = db.select({
      formulaCode: hookTrendTracking.formulaCode,
      platform: hookTrendTracking.platform,
      fatigueLevel: hookTrendTracking.fatigueLevel,
      trendDirection: hookTrendTracking.trendDirection,
      weeklyUsage: hookTrendTracking.weeklyUsage,
      recommendationStatus: hookTrendTracking.recommendationStatus,
      alternativeFormulas: hookTrendTracking.alternativeFormulas
    })
    .from(hookTrendTracking)
    .where(gte(hookTrendTracking.fatigueLevel, 50))
    .orderBy(desc(hookTrendTracking.fatigueLevel))
    
    if (platform) {
      query.where(eq(hookTrendTracking.platform, platform))
    }
    
    return await query
  }

  static async getFormulaDiversity(platform: string, days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return await db.select({
      formulaCode: hookPerformanceAnalytics.formulaCode,
      usageCount: count(),
      uniqueUsers: sql<number>`COUNT(DISTINCT ${hookPerformanceAnalytics.userId})`,
      avgRating: avg(hookPerformanceAnalytics.userRating)
    })
    .from(hookPerformanceAnalytics)
    .where(
      and(
        eq(hookPerformanceAnalytics.platform, platform),
        gte(hookPerformanceAnalytics.recordedAt, cutoffDate)
      )
    )
    .groupBy(hookPerformanceAnalytics.formulaCode)
    .orderBy(desc(count()))
  }

  static async getSeasonalityPatterns(formulaCode: string, months: number = 12) {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    return await db.select({
      month: sql<string>`EXTRACT(MONTH FROM ${hookPerformanceAnalytics.recordedAt})`,
      usageCount: count(),
      avgPerformance: avg(hookPerformanceAnalytics.userRating)
    })
    .from(hookPerformanceAnalytics)
    .where(
      and(
        eq(hookPerformanceAnalytics.formulaCode, formulaCode),
        gte(hookPerformanceAnalytics.recordedAt, cutoffDate)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${hookPerformanceAnalytics.recordedAt})`)
    .orderBy(sql`EXTRACT(MONTH FROM ${hookPerformanceAnalytics.recordedAt})`)
  }

  static async calculateFatigueScores() {
    // Calculate fatigue scores for all formulas based on usage patterns
    const recentUsage = await db.select({
      formulaCode: hookPerformanceAnalytics.formulaCode,
      platform: hookPerformanceAnalytics.platform,
      usageCount: count(),
      avgRating: avg(hookPerformanceAnalytics.userRating),
      recentPerformance: avg(sql`CASE WHEN ${hookPerformanceAnalytics.recordedAt} >= NOW() - INTERVAL '7 days' THEN ${hookPerformanceAnalytics.userRating} END`)
    })
    .from(hookPerformanceAnalytics)
    .where(gte(hookPerformanceAnalytics.recordedAt, sql`NOW() - INTERVAL '30 days'`))
    .groupBy(hookPerformanceAnalytics.formulaCode, hookPerformanceAnalytics.platform)

    // Update trend tracking with calculated fatigue scores
    for (const usage of recentUsage) {
      const fatigueLevel = this.calculateFatigueLevel(usage)
      const trendDirection = this.calculateTrendDirection(usage)
      
      await this.updateTrendData(usage.formulaCode, usage.platform, {
        weeklyUsage: Math.floor(usage.usageCount / 4), // Approximate weekly usage
        monthlyUsage: usage.usageCount,
        avgPerformanceScore: Math.round((usage.avgRating || 0) * 20), // Convert to 0-100 scale
        fatigueLevel,
        trendDirection
      })
    }
  }

  private static calculateFatigueLevel(usage: any): number {
    const { usageCount, avgRating, recentPerformance } = usage
    
    // High usage with declining performance indicates fatigue
    const usageFactor = Math.min(100, (usageCount / 50) * 100) // Normalize usage
    const performanceDecline = (avgRating || 3) - (recentPerformance || 3)
    const performanceFactor = Math.max(0, performanceDecline * 25)
    
    return Math.min(100, usageFactor + performanceFactor)
  }

  private static calculateTrendDirection(usage: any): string {
    const { avgRating, recentPerformance } = usage
    
    if (!avgRating || !recentPerformance) return 'stable'
    
    const difference = recentPerformance - avgRating
    
    if (difference > 0.2) return 'rising'
    if (difference < -0.2) return 'falling'
    return 'stable'
  }
}

// ==================== ANALYTICS SERVICES ====================

export class AnalyticsService {
  static async recordEvent(eventData: NewAnalyticsEvent) {
    const result = await db.insert(analyticsEvents).values(eventData).returning()
    return result[0]
  }

  static async recordPerformance(performanceData: NewHookPerformanceAnalytics) {
    const result = await db.insert(hookPerformanceAnalytics).values(performanceData).returning()
    return result[0]
  }

  static async getUserEngagementStats(userId: string, days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const [generationsCount, favoritesCount, avgRating] = await Promise.all([
      db.select({ count: count() })
        .from(hookGenerations)
        .where(
          and(
            eq(hookGenerations.userId, userId),
            gte(hookGenerations.createdAt, cutoffDate)
          )
        ),
      db.select({ count: count() })
        .from(favoriteHooks)
        .where(
          and(
            eq(favoriteHooks.userId, userId),
            gte(favoriteHooks.createdAt, cutoffDate)
          )
        ),
      db.select({ avg: avg(hookPerformanceAnalytics.userRating) })
        .from(hookPerformanceAnalytics)
        .where(
          and(
            eq(hookPerformanceAnalytics.userId, userId),
            gte(hookPerformanceAnalytics.recordedAt, cutoffDate)
          )
        )
    ])

    return {
      generationsCount: generationsCount[0].count,
      favoritesCount: favoritesCount[0].count,
      averageRating: avgRating[0].avg || 0,
      periodDays: days
    }
  }

  static async getFormulaPerformanceStats(formulaCode: string, days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const stats = await db.select({
      usageCount: count(),
      avgRating: avg(hookPerformanceAnalytics.userRating),
      favoriteRate: avg(sql`CASE WHEN ${hookPerformanceAnalytics.wasFavorited} THEN 1.0 ELSE 0.0 END`),
      usageRate: avg(sql`CASE WHEN ${hookPerformanceAnalytics.wasUsed} THEN 1.0 ELSE 0.0 END`)
    })
    .from(hookPerformanceAnalytics)
    .where(
      and(
        eq(hookPerformanceAnalytics.formulaCode, formulaCode),
        gte(hookPerformanceAnalytics.recordedAt, cutoffDate)
      )
    )

    return stats[0]
  }

  static async getPlatformTrends(platform: string, days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return await db.select({
      formulaCode: hookPerformanceAnalytics.formulaCode,
      usageCount: count(),
      avgRating: avg(hookPerformanceAnalytics.userRating),
      avgEngagement: avg(hookPerformanceAnalytics.actualEngagement)
    })
    .from(hookPerformanceAnalytics)
    .where(
      and(
        eq(hookPerformanceAnalytics.platform, platform),
        gte(hookPerformanceAnalytics.recordedAt, cutoffDate)
      )
    )
    .groupBy(hookPerformanceAnalytics.formulaCode)
    .orderBy(desc(count()))
    .limit(20)
  }

  // ==================== COMPREHENSIVE ANALYTICS ====================

  static async recordWebVitals(vitalsData: NewWebVital) {
    const result = await db.insert(webVitals).values(vitalsData).returning()
    return result[0]
  }

  static async recordError(errorData: NewErrorTracking) {
    const result = await db.insert(errorTracking).values(errorData).returning()
    return result[0]
  }

  static async recordJourneyStep(journeyData: NewUserJourneyTracking) {
    const result = await db.insert(userJourneyTracking).values(journeyData).returning()
    return result[0]
  }

  static async getWebVitalsReport(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const vitalsStats = await db.select({
      pathname: webVitals.pathname,
      deviceType: webVitals.deviceType,
      avgLCP: avg(webVitals.lcp),
      avgFID: avg(webVitals.fid),
      avgCLS: avg(webVitals.cls),
      avgFCP: avg(webVitals.fcp),
      avgTTFB: avg(webVitals.ttfb),
      sessionCount: count()
    })
    .from(webVitals)
    .where(gte(webVitals.createdAt, cutoffDate))
    .groupBy(webVitals.pathname, webVitals.deviceType)
    .orderBy(desc(count()))

    return vitalsStats
  }

  static async getErrorReport(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const errorStats = await db.select({
      errorType: errorTracking.errorType,
      errorMessage: errorTracking.errorMessage,
      url: errorTracking.url,
      occurrences: count(),
      uniqueUsers: sql<number>`COUNT(DISTINCT ${errorTracking.userId})`,
      resolved: sum(sql`CASE WHEN ${errorTracking.isResolved} THEN 1 ELSE 0 END`)
    })
    .from(errorTracking)
    .where(gte(errorTracking.createdAt, cutoffDate))
    .groupBy(errorTracking.errorType, errorTracking.errorMessage, errorTracking.url)
    .orderBy(desc(count()))
    .limit(50)

    return errorStats
  }

  static async getConversionFunnelData(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Define funnel stages
    const stages = ['landing', 'signup', 'onboarding', 'first_generation', 'subscription']
    
    const funnelData = await Promise.all(
      stages.map(async (stage) => {
        const stageData = await db.select({
          stage: userJourneyTracking.stage,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${userJourneyTracking.userId})`,
          uniqueSessions: sql<number>`COUNT(DISTINCT ${userJourneyTracking.sessionId})`,
          totalActions: count()
        })
        .from(userJourneyTracking)
        .where(
          and(
            eq(userJourneyTracking.stage, stage),
            gte(userJourneyTracking.createdAt, cutoffDate)
          )
        )
        .groupBy(userJourneyTracking.stage)

        return stageData[0] || { stage, uniqueUsers: 0, uniqueSessions: 0, totalActions: 0 }
      })
    )

    return funnelData
  }

  static async getApiPerformanceReport(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const apiStats = await db.select({
      endpoint: apiUsageTracking.endpoint,
      method: apiUsageTracking.method,
      avgResponseTime: avg(apiUsageTracking.responseTime),
      maxResponseTime: sql<number>`MAX(${apiUsageTracking.responseTime})`,
      requestCount: count(),
      errorRate: sql<number>`(COUNT(CASE WHEN ${apiUsageTracking.statusCode} >= 400 THEN 1 END)::float / COUNT(*)) * 100`,
      avgRequestSize: avg(apiUsageTracking.requestSize),
      avgResponseSize: avg(apiUsageTracking.responseSize)
    })
    .from(apiUsageTracking)
    .where(gte(apiUsageTracking.createdAt, cutoffDate))
    .groupBy(apiUsageTracking.endpoint, apiUsageTracking.method)
    .orderBy(desc(count()))

    return apiStats
  }

  static async getSystemHealthMetrics(hours: number = 24) {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    const healthMetrics = await db.select({
      metricType: systemMetrics.metricType,
      metricName: systemMetrics.metricName,
      avgValue: avg(systemMetrics.value),
      maxValue: sql<number>`MAX(${systemMetrics.value})`,
      minValue: sql<number>`MIN(${systemMetrics.value})`,
      dataPoints: count()
    })
    .from(systemMetrics)
    .where(
      and(
        gte(systemMetrics.timestamp, cutoffDate),
        or(
          eq(systemMetrics.metricType, 'memory'),
          eq(systemMetrics.metricType, 'cpu'),
          eq(systemMetrics.metricType, 'api_response')
        )
      )
    )
    .groupBy(systemMetrics.metricType, systemMetrics.metricName)
    .orderBy(systemMetrics.metricType, systemMetrics.metricName)

    return healthMetrics
  }

  static async getAIUsageAnalytics(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const aiUsage = await db.select({
      aiService: apiUsageTracking.aiService,
      aiModel: apiUsageTracking.aiModel,
      requestCount: count(),
      totalTokens: sum(apiUsageTracking.aiTokensUsed),
      totalCost: sum(apiUsageTracking.aiCost),
      avgTokensPerRequest: avg(apiUsageTracking.aiTokensUsed),
      avgCostPerRequest: avg(apiUsageTracking.aiCost)
    })
    .from(apiUsageTracking)
    .where(
      and(
        gte(apiUsageTracking.createdAt, cutoffDate),
        sql`${apiUsageTracking.aiService} IS NOT NULL`
      )
    )
    .groupBy(apiUsageTracking.aiService, apiUsageTracking.aiModel)
    .orderBy(desc(count()))

    return aiUsage
  }

  static async getUserBehaviorAnalytics(userId: string, days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get user journey data
    const journeyData = await db.select({
      stage: userJourneyTracking.stage,
      step: userJourneyTracking.step,
      action: userJourneyTracking.action,
      avgDuration: avg(userJourneyTracking.duration),
      actionCount: count()
    })
    .from(userJourneyTracking)
    .where(
      and(
        eq(userJourneyTracking.userId, userId),
        gte(userJourneyTracking.createdAt, cutoffDate)
      )
    )
    .groupBy(
      userJourneyTracking.stage,
      userJourneyTracking.step,
      userJourneyTracking.action
    )
    .orderBy(userJourneyTracking.stage, userJourneyTracking.step)

    // Get API usage patterns
    const apiUsage = await db.select({
      endpoint: apiUsageTracking.endpoint,
      requestCount: count(),
      avgResponseTime: avg(apiUsageTracking.responseTime),
      lastUsed: sql<Date>`MAX(${apiUsageTracking.createdAt})`
    })
    .from(apiUsageTracking)
    .where(
      and(
        eq(apiUsageTracking.userId, userId),
        gte(apiUsageTracking.createdAt, cutoffDate)
      )
    )
    .groupBy(apiUsageTracking.endpoint)
    .orderBy(desc(count()))

    return {
      journey: journeyData,
      apiUsage: apiUsage
    }
  }

  static async getRealtimeMetrics() {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const [activeUsers, errorRate, avgResponseTime] = await Promise.all([
      // Active users in the last hour
      db.select({ count: sql<number>`COUNT(DISTINCT ${apiUsageTracking.userId})` })
        .from(apiUsageTracking)
        .where(
          and(
            gte(apiUsageTracking.createdAt, oneHourAgo),
            sql`${apiUsageTracking.userId} IS NOT NULL`
          )
        ),

      // Error rate in the last hour
      db.select({
        errorRate: sql<number>`(COUNT(CASE WHEN ${apiUsageTracking.statusCode} >= 400 THEN 1 END)::float / COUNT(*)) * 100`
      })
        .from(apiUsageTracking)
        .where(gte(apiUsageTracking.createdAt, oneHourAgo)),

      // Average response time in the last hour
      db.select({
        avgResponseTime: avg(apiUsageTracking.responseTime)
      })
        .from(apiUsageTracking)
        .where(gte(apiUsageTracking.createdAt, oneHourAgo))
    ])

    return {
      activeUsers: activeUsers[0]?.count || 0,
      errorRate: errorRate[0]?.errorRate || 0,
      avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
      timestamp: new Date()
    }
  }
}