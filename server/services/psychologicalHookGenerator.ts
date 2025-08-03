import { HookObject, Platform, Objective, ContentType, HookCategory } from '../../shared/types.js'
import { 
  getPersonalizedHookFormulas, 
  getPsychologicalProfile, 
  recordHookPerformance,
  updateHookFormulaTrends,
  getHookFormulaByCode
} from '../db/utils.js'
import { generateTriModalHook, detectContentType, selectHookCategories } from './hookGenerator.js'

export interface PsychologicalHookRequest {
  userId: string
  platform: Platform
  objective: Objective
  topic: string
  modelType?: 'gpt-4o' | 'gpt-4o-mini'
  forceCategories?: HookCategory[]
  adaptationLevel?: number // 0-100, how much to personalize
}

export interface PsychologicalStrategy {
  selectedFormulas: string[]
  reasoning: string
  adaptationApplied: string[]
  riskMitigation: string[]
  confidenceScore: number
}

export interface EnhancedHookGeneration {
  hooks: HookObject[]
  psychologicalStrategy: PsychologicalStrategy
  adaptationLevel: number
  usedFormulas: string[]
  topThreeVariants: HookObject[]
}

export class PsychologicalHookGenerator {
  
  /**
   * Generate personalized hooks based on user's psychological profile
   */
  async generatePersonalizedHooks(request: PsychologicalHookRequest): Promise<EnhancedHookGeneration> {
    // Get user's psychological profile
    const profile = await getPsychologicalProfile(request.userId)
    
    // Get personalized hook formulas
    const availableFormulas = await getPersonalizedHookFormulas(request.userId)
    
    // Detect content type
    const contentType = detectContentType(request.topic, request.objective)
    
    // Select appropriate categories
    const suggestedCategories = request.forceCategories || selectHookCategories(contentType, request.objective)
    
    // Filter formulas by suggested categories and user preferences
    const relevantFormulas = this.filterFormulasByPreferences(
      availableFormulas,
      suggestedCategories,
      profile,
      request.adaptationLevel || 50
    )
    
    if (relevantFormulas.length === 0) {
      throw new Error('No suitable hook formulas found for user preferences')
    }
    
    // Generate hooks using selected formulas
    const hooks: HookObject[] = []
    const usedFormulas: string[] = []
    
    // Generate 8-12 hooks using different formulas
    const targetHookCount = Math.min(12, Math.max(8, relevantFormulas.length))
    
    for (let i = 0; i < targetHookCount; i++) {
      const formula = relevantFormulas[i % relevantFormulas.length]
      
      try {
        // In production, this would use AI with the formula template
        const hook = await this.generateHookWithFormula(
          request.topic,
          request.platform,
          request.objective,
          formula,
          profile
        )
        
        hooks.push(hook)
        if (!usedFormulas.includes(formula.code)) {
          usedFormulas.push(formula.code)
        }
      } catch (error) {
        console.error(`Failed to generate hook with formula ${formula.code}:`, error)
      }
    }
    
    if (hooks.length === 0) {
      throw new Error('Failed to generate any hooks')
    }
    
    // Select top 3 variants
    const topThreeVariants = this.selectTopVariants(hooks, 3)
    
    // Create psychological strategy
    const psychologicalStrategy = this.createPsychologicalStrategy(
      relevantFormulas,
      usedFormulas,
      profile,
      request.adaptationLevel || 50
    )
    
    return {
      hooks,
      psychologicalStrategy,
      adaptationLevel: request.adaptationLevel || 50,
      usedFormulas,
      topThreeVariants
    }
  }
  
  /**
   * Filter formulas based on user preferences and psychological profile
   */
  private filterFormulasByPreferences(
    formulas: any[],
    suggestedCategories: HookCategory[],
    profile: any,
    adaptationLevel: number
  ) {
    let filtered = formulas.filter(formula => 
      suggestedCategories.includes(formula.category as HookCategory)
    )
    
    if (profile && adaptationLevel > 30) {
      // Apply preference filtering if adaptation level is significant
      
      // Filter by preferred categories
      if (profile.preferredCategories?.length > 0) {
        const preferred = filtered.filter(formula =>
          profile.preferredCategories.includes(formula.category)
        )
        if (preferred.length > 0) {
          filtered = preferred
        }
      }
      
      // Filter by successful formulas
      if (profile.successfulFormulas?.length > 0) {
        const successful = filtered.filter(formula =>
          profile.successfulFormulas.includes(formula.code)
        )
        if (successful.length >= 3) { // Only if we have enough successful ones
          filtered = successful
        }
      }
      
      // Avoid underperforming formulas
      if (profile.underperformingFormulas?.length > 0) {
        filtered = filtered.filter(formula =>
          !profile.underperformingFormulas.includes(formula.code)
        )
      }
      
      // Filter by risk tolerance
      if (profile.riskTolerance) {
        const riskMap = {
          'low': ['low'],
          'medium': ['low', 'medium'],
          'high': ['low', 'medium', 'high']
        }
        const allowedRisk = riskMap[profile.riskTolerance as keyof typeof riskMap] || ['low', 'medium']
        filtered = filtered.filter(formula =>
          allowedRisk.includes(formula.riskFactor)
        )
      }
    }
    
    // Sort by effectiveness rating
    return filtered.sort((a, b) => b.effectivenessRating - a.effectivenessRating)
  }
  
  /**
   * Generate a hook using a specific formula
   */
  private async generateHookWithFormula(
    topic: string,
    platform: Platform,
    objective: Objective,
    formula: any,
    profile: any
  ): Promise<HookObject> {
    // This would typically call an AI service with the formula template
    // For now, we'll use the existing generation logic but enhance it
    
    const hook = await generateTriModalHook(
      topic,
      platform,
      objective,
      formula.category as HookCategory
    )
    
    // Enhance with formula-specific data
    hook.framework = `${formula.code}: ${formula.name}`
    hook.psychologicalDriver = formula.primaryDriver
    hook.riskFactor = formula.riskFactor
    
    // Apply psychological personalization
    if (profile) {
      hook.rationale = this.personalizeRationale(hook.rationale, formula, profile)
      hook.platformNotes = this.personalizePlatformNotes(hook.platformNotes, profile)
    }
    
    return hook
  }
  
  /**
   * Select top performing variants
   */
  private selectTopVariants(hooks: HookObject[], count: number): HookObject[] {
    return hooks
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
  }
  
  /**
   * Create psychological strategy explanation
   */
  private createPsychologicalStrategy(
    relevantFormulas: any[],
    usedFormulas: string[],
    profile: any,
    adaptationLevel: number
  ): PsychologicalStrategy {
    const selectedFormulas = usedFormulas
    
    let reasoning = `Selected ${selectedFormulas.length} formulas based on `
    const factors: string[] = []
    
    if (adaptationLevel > 50 && profile) {
      factors.push('your psychological profile')
      factors.push('your past performance data')
    }
    factors.push('content type analysis')
    factors.push('platform optimization')
    
    reasoning += factors.join(', ')
    
    const adaptationApplied: string[] = []
    if (profile && adaptationLevel > 30) {
      if (profile.preferredCategories?.length > 0) {
        adaptationApplied.push('Filtered by preferred hook categories')
      }
      if (profile.riskTolerance) {
        adaptationApplied.push(`Matched risk tolerance: ${profile.riskTolerance}`)
      }
      if (profile.successfulFormulas?.length > 0) {
        adaptationApplied.push('Prioritized previously successful formulas')
      }
    }
    
    const riskMitigation: string[] = []
    const highRiskFormulas = relevantFormulas.filter(f => f.riskFactor === 'high')
    if (highRiskFormulas.length > 0) {
      riskMitigation.push('Balanced high-risk formulas with proven performers')
    }
    
    const confidenceScore = Math.min(95, Math.max(60, 
      75 + (adaptationLevel * 0.2) + (profile ? 10 : 0)
    ))
    
    return {
      selectedFormulas,
      reasoning,
      adaptationApplied,
      riskMitigation,
      confidenceScore
    }
  }
  
  /**
   * Personalize hook rationale based on profile
   */
  private personalizeRationale(rationale: string, formula: any, profile: any): string {
    if (!profile) return rationale
    
    let personalized = rationale
    
    // Add profile-specific reasoning
    if (profile.contentStyle) {
      personalized += ` This aligns with your ${profile.contentStyle} content style.`
    }
    
    if (profile.successfulFormulas?.includes(formula.code)) {
      personalized += ` This formula has performed well for you previously.`
    }
    
    return personalized
  }
  
  /**
   * Personalize platform notes based on profile
   */
  private personalizePlatformNotes(notes: string, profile: any): string {
    if (!profile) return notes
    
    let personalized = notes
    
    if (profile.urgencyPreference === 'high') {
      personalized += ' Emphasized urgency based on your preference.'
    } else if (profile.urgencyPreference === 'low') {
      personalized += ' Reduced urgency to match your style.'
    }
    
    return personalized
  }
  
  /**
   * Record performance feedback for learning
   */
  async recordHookFeedback(
    userId: string,
    generationId: string,
    hookIndex: number,
    feedback: {
      rating?: number
      wasUsed?: boolean
      wasFavorited?: boolean
      wasShared?: boolean
      actualViews?: number
      actualEngagement?: number
      actualConversions?: number
      notes?: string
    }
  ) {
    const performance = await recordHookPerformance({
      userId,
      generationId,
      hookIndex,
      userRating: feedback.rating,
      wasUsed: feedback.wasUsed,
      wasFavorited: feedback.wasFavorited,
      wasShared: feedback.wasShared,
      actualViews: feedback.actualViews,
      actualEngagement: feedback.actualEngagement,
      actualConversions: feedback.actualConversions,
      performanceNotes: feedback.notes,
      platform: 'unknown', // Would be provided in real implementation
      objective: 'unknown' // Would be provided in real implementation
    })
    
    // Update trend tracking
    await updateHookFormulaTrends()
    
    return performance
  }
  
  /**
   * Get hook formula insights for user
   */
  async getFormulaInsights(userId: string, formulaCode: string) {
    const formula = await getHookFormulaByCode(formulaCode)
    if (!formula) {
      throw new Error(`Formula ${formulaCode} not found`)
    }
    
    const profile = await getPsychologicalProfile(userId)
    
    // Calculate personalized insights
    const insights = {
      formula,
      personalizedRecommendation: this.getPersonalizedRecommendation(formula, profile),
      usageGuidelines: formula.usageGuidelines,
      cautionaryNotes: formula.cautionaryNotes,
      expectedPerformance: this.calculateExpectedPerformance(formula, profile),
      alternativeFormulas: [] // Would suggest similar formulas
    }
    
    return insights
  }
  
  private getPersonalizedRecommendation(formula: any, profile: any): string {
    if (!profile) {
      return `This ${formula.category} hook uses ${formula.primaryDriver} psychology to capture attention.`
    }
    
    let recommendation = `Based on your profile, this ${formula.category} hook `
    
    if (profile.successfulFormulas?.includes(formula.code)) {
      recommendation += 'has been successful for you before and '
    }
    
    if (profile.riskTolerance === formula.riskFactor) {
      recommendation += 'matches your risk tolerance perfectly.'
    } else if (profile.riskTolerance === 'low' && formula.riskFactor === 'high') {
      recommendation += 'is riskier than your usual preference, but could provide high rewards.'
    } else {
      recommendation += 'aligns well with your preferences.'
    }
    
    return recommendation
  }
  
  private calculateExpectedPerformance(formula: any, profile: any): {
    engagementRate: number
    conversionRate: number
    confidenceLevel: number
  } {
    let baseEngagement = formula.avgEngagementRate || 0
    let baseConversion = formula.avgConversionRate || 0
    let confidence = 75
    
    if (profile) {
      // Adjust based on profile match
      if (profile.successfulFormulas?.includes(formula.code)) {
        baseEngagement *= 1.2
        baseConversion *= 1.3
        confidence += 15
      }
      
      if (profile.riskTolerance === formula.riskFactor) {
        confidence += 10
      }
    }
    
    return {
      engagementRate: Math.min(100, baseEngagement),
      conversionRate: Math.min(100, baseConversion),
      confidenceLevel: Math.min(95, confidence)
    }
  }
}

// Export singleton instance
export const psychologicalHookGenerator = new PsychologicalHookGenerator()