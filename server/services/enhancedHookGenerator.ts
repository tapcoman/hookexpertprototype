import { 
  generateHooksWithAI, 
  detectContentStrategy, 
  selectOptimalFormulas 
} from './aiService.js'
import { 
  HookFormulaService, 
  PsychologicalProfileService, 
  AnalyticsService 
} from './database.js'
import { 
  HookObject, 
  Platform, 
  Objective, 
  ModelType,
  PsychologicalDriver,
  HookCategory 
} from '../../shared/types.js'
import { ValidationError, ExternalServiceError } from '../middleware/errorHandler.js'
import { logAIServiceCall, logPerformanceMetric } from '../middleware/logging.js'

// Enhanced Hook Generation Interface
export interface EnhancedHookGenerationRequest {
  userId: string
  platform: Platform
  objective: Objective
  topic: string
  modelType?: ModelType
  adaptationLevel?: number // 0-100, how much to personalize
  forceCategories?: HookCategory[]
  userContext?: {
    company?: string
    industry?: string
    voice?: string
    audience?: string
    bannedTerms?: string[]
    safety?: string
  }
  psychologicalPreferences?: {
    riskTolerance?: 'conservative' | 'balanced' | 'aggressive'
    preferredTriggers?: PsychologicalDriver[]
    avoidedTriggers?: PsychologicalDriver[]
  }
}

export interface EnhancedHookGenerationResponse {
  id: string
  hooks: HookObject[]
  topThreeVariants: HookObject[]
  psychologicalStrategy: {
    selectedStrategy: string
    psychologicalReasoning: string
    platformOptimization: string
    diversityApproach: string
    riskMitigation: string
    adaptationLevel: number
    confidenceScore: number
  }
  hookTaxonomyAnalysis: {
    formulasUsed: string[]
    categoryDistribution: Record<HookCategory, number>
    driverDistribution: Record<PsychologicalDriver, number>
    riskProfile: string
    fatiguePreventionApplied: boolean
  }
  triModalCoordination: {
    synergisticElements: string[]
    platformSpecificOptimizations: Record<string, string>
    modalityBalance: {
      verbal: number
      visual: number
      textual: number
    }
  }
  qualityAssessment: {
    averageScore: number
    scoreDistribution: number[]
    promiseContentMatchRate: number
    specificityAverage: number
    freshnessAverage: number
    psychologicalResonanceAverage: number
  }
  freshTwistElements: string[]
  recommendedFollowUps: string[]
}

export class EnhancedHookGenerator {
  
  /**
   * Master Hook Generation with Full Psychological Framework Integration
   */
  async generateEnhancedHooks(request: EnhancedHookGenerationRequest): Promise<EnhancedHookGenerationResponse> {
    const startTime = Date.now()
    
    try {
      // BLOCK 1: Psychological Strategy Detection
      const contentStrategy = detectContentStrategy(request.topic, request.objective)
      
      // BLOCK 2: User Profile Integration
      const userProfile = await PsychologicalProfileService.findByUserId(request.userId)
      const adaptationLevel = request.adaptationLevel || (userProfile ? 70 : 30)
      
      // BLOCK 3: Hook Taxonomy Selection with Fatigue Prevention
      const selectedFormulas = await selectOptimalFormulas(
        request.userId,
        contentStrategy,
        request.platform,
        request.psychologicalPreferences?.riskTolerance || 'medium'
      )
      
      if (selectedFormulas.length === 0) {
        throw new ValidationError('No suitable hook formulas found for the given parameters')
      }
      
      // BLOCK 4: AI Generation with Master Prompt System
      const hooks = await generateHooksWithAI({
        topic: request.topic,
        platform: request.platform,
        objective: request.objective,
        modelType: request.modelType || 'gpt-4o-mini',
        userId: request.userId,
        userContext: request.userContext
      })
      
      // BLOCK 5: Enhanced Post-Processing
      const processedHooks = await this.enhanceHooksWithPsychologicalAnalysis(
        hooks,
        contentStrategy,
        selectedFormulas,
        userProfile
      )
      
      // BLOCK 6: Tri-Modal Coordination Analysis
      const triModalAnalysis = this.analyzeTriModalCoordination(processedHooks, request.platform)
      
      // BLOCK 7: Quality Assessment
      const qualityAssessment = this.performQualityAssessment(processedHooks)
      
      // BLOCK 8: Hook Taxonomy Analysis
      const taxonomyAnalysis = this.analyzeHookTaxonomy(processedHooks, selectedFormulas)
      
      // BLOCK 9: Generate Psychological Strategy Explanation
      const psychologicalStrategy = this.generatePsychologicalStrategy(
        contentStrategy,
        selectedFormulas,
        userProfile,
        adaptationLevel,
        processedHooks
      )
      
      // BLOCK 10: Fresh Twist Detection
      const freshTwistElements = this.detectFreshTwistElements(processedHooks)
      
      // BLOCK 11: Recommended Follow-ups
      const recommendedFollowUps = await this.generateRecommendedFollowUps(
        request,
        processedHooks,
        contentStrategy
      )
      
      // Select top three variants for enhanced display
      const topThreeVariants = this.selectTopVariants(processedHooks, 3)
      
      // Performance logging
      const duration = Date.now() - startTime
      logPerformanceMetric('enhanced-hook-generation-duration', duration, {
        platform: request.platform,
        hookCount: processedHooks.length,
        adaptationLevel,
        formulasUsed: selectedFormulas.length
      }, request.userId)
      
      // Generate response ID
      const responseId = `enh_${Date.now()}_${request.userId.slice(0, 8)}`
      
      return {
        id: responseId,
        hooks: processedHooks,
        topThreeVariants,
        psychologicalStrategy,
        hookTaxonomyAnalysis: taxonomyAnalysis,
        triModalCoordination: triModalAnalysis,
        qualityAssessment,
        freshTwistElements,
        recommendedFollowUps
      }
      
    } catch (error) {
      const duration = Date.now() - startTime
      logPerformanceMetric('enhanced-hook-generation-error', duration, {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: request.platform
      }, request.userId)
      
      if (error instanceof ValidationError || error instanceof ExternalServiceError) {
        throw error
      }
      
      throw new ExternalServiceError('EnhancedHookGenerator', 
        `Enhanced hook generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
  
  /**
   * Enhance hooks with psychological analysis
   */
  private async enhanceHooksWithPsychologicalAnalysis(
    hooks: HookObject[],
    contentStrategy: ReturnType<typeof detectContentStrategy>,
    selectedFormulas: any[],
    userProfile: any
  ): Promise<HookObject[]> {
    return hooks.map(hook => {
      // Add psychological resonance scoring
      const psychologicalResonance = this.calculatePsychologicalResonance(hook, contentStrategy)
      
      // Add cognitive bias alignment
      const cognitiveAlignment = this.calculateCognitiveAlignment(hook, contentStrategy.cognitiveBiases)
      
      // Add personalization factors
      const personalizationBonus = userProfile ? this.calculatePersonalizationBonus(hook, userProfile) : 0
      
      // Enhance score with psychological factors
      const enhancedScore = Math.min(5.0, hook.score + psychologicalResonance * 0.3 + personalizationBonus)
      
      return {
        ...hook,
        score: enhancedScore,
        scoreBreakdown: `${hook.scoreBreakdown} | Psychology: +${(psychologicalResonance * 0.3).toFixed(2)} | Personal: +${personalizationBonus.toFixed(2)}`,
        // Add enhanced metadata
        psychologicalResonance,
        cognitiveAlignment,
        personalizationScore: personalizationBonus
      } as HookObject & {
        psychologicalResonance: number
        cognitiveAlignment: number
        personalizationScore: number
      }
    })
  }
  
  /**
   * Analyze tri-modal coordination
   */
  private analyzeTriModalCoordination(hooks: HookObject[], platform: Platform) {
    const synergisticElements: string[] = []
    const platformOptimizations: Record<string, string> = {}
    
    // Analyze synergy across hooks
    hooks.forEach((hook, index) => {
      if (hook.verbalHook && hook.visualHook && hook.textualHook) {
        synergisticElements.push(`Hook ${index + 1}: Full tri-modal integration with consistent ${hook.psychologicalDriver} messaging`)
      }
    })
    
    // Platform-specific optimizations
    platformOptimizations[platform] = this.getPlatformOptimizationNote(platform, hooks)
    
    // Calculate modality balance
    const modalityBalance = {
      verbal: hooks.filter(h => h.verbalHook).length / hooks.length,
      visual: hooks.filter(h => h.visualHook).length / hooks.length,
      textual: hooks.filter(h => h.textualHook).length / hooks.length
    }
    
    return {
      synergisticElements,
      platformSpecificOptimizations: platformOptimizations,
      modalityBalance
    }
  }
  
  /**
   * Perform comprehensive quality assessment
   */
  private performQualityAssessment(hooks: HookObject[]) {
    const scores = hooks.map(h => h.score)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    const promiseContentMatchRate = hooks.filter(h => h.promiseContentMatch).length / hooks.length
    const specificityAverage = hooks.reduce((acc, h) => acc + h.specificityScore, 0) / hooks.length
    const freshnessAverage = hooks.reduce((acc, h) => acc + h.freshnessScore, 0) / hooks.length
    
    // Calculate psychological resonance average
    const psychologicalResonanceAverage = hooks.reduce((acc, h) => {
      return acc + ((h as any).psychologicalResonance || 0.5)
    }, 0) / hooks.length
    
    return {
      averageScore,
      scoreDistribution: scores,
      promiseContentMatchRate,
      specificityAverage,
      freshnessAverage,
      psychologicalResonanceAverage
    }
  }
  
  /**
   * Analyze hook taxonomy distribution
   */
  private analyzeHookTaxonomy(hooks: HookObject[], selectedFormulas: any[]) {
    const formulasUsed = [...new Set(hooks.map(h => h.framework))]
    
    // Category distribution
    const categoryDistribution: Record<HookCategory, number> = {
      'question-based': 0,
      'statement-based': 0,
      'narrative': 0,
      'urgency-exclusivity': 0,
      'efficiency': 0
    }
    
    hooks.forEach(hook => {
      if (hook.hookCategory in categoryDistribution) {
        categoryDistribution[hook.hookCategory]++
      }
    })
    
    // Driver distribution
    const driverDistribution: Record<PsychologicalDriver, number> = {
      'curiosity-gap': 0,
      'pain-point': 0,
      'value-hit': 0,
      'surprise-shock': 0,
      'social-proof': 0,
      'urgency-fomo': 0,
      'authority-credibility': 0,
      'emotional-connection': 0
    }
    
    hooks.forEach(hook => {
      if (hook.psychologicalDriver in driverDistribution) {
        driverDistribution[hook.psychologicalDriver]++
      }
    })
    
    // Risk profile analysis
    const riskCounts = { low: 0, medium: 0, high: 0 }
    hooks.forEach(hook => {
      if (hook.riskFactor in riskCounts) {
        riskCounts[hook.riskFactor as keyof typeof riskCounts]++
      }
    })
    
    const dominantRisk = Object.entries(riskCounts).reduce((a, b) => 
      riskCounts[a[0] as keyof typeof riskCounts] > riskCounts[b[0] as keyof typeof riskCounts] ? a : b
    )[0]
    
    return {
      formulasUsed,
      categoryDistribution,
      driverDistribution,
      riskProfile: dominantRisk,
      fatiguePreventionApplied: selectedFormulas.some(f => (f as any).currentFatigueLevel < 50)
    }
  }
  
  /**
   * Generate psychological strategy explanation
   */
  private generatePsychologicalStrategy(
    contentStrategy: ReturnType<typeof detectContentStrategy>,
    selectedFormulas: any[],
    userProfile: any,
    adaptationLevel: number,
    hooks: HookObject[]
  ) {
    const selectedStrategy = contentStrategy.primaryStrategy === 'value_hit' ? 
      'Value Hit Strategy - Building trust through immediate educational utility' :
      'Curiosity Gap Strategy - Creating intrigue through strategic information gaps'
    
    const psychologicalReasoning = `Selected ${contentStrategy.emotionalTriggers.join(', ')} as primary triggers based on ${contentStrategy.contentType} content analysis. Integrated ${contentStrategy.cognitiveBiases.join(', ')} cognitive biases for enhanced persuasion.`
    
    const platformOptimization = `Optimized for ${contentStrategy.riskProfile} risk profile with platform-specific psychological adaptations`
    
    const diversityApproach = `Applied ${selectedFormulas.length} different formulas across ${[...new Set(hooks.map(h => h.hookCategory))].length} categories to prevent pattern fatigue`
    
    const riskMitigation = userProfile ? 
      `Personalized risk tolerance based on user's ${userProfile.riskTolerance || 'balanced'} preference` :
      'Applied balanced risk approach for new user profile'
    
    const confidenceScore = Math.min(95, Math.max(60, 
      75 + (adaptationLevel * 0.2) + (userProfile ? 15 : 0) + (hooks.length * 2)
    ))
    
    return {
      selectedStrategy,
      psychologicalReasoning,
      platformOptimization,
      diversityApproach,
      riskMitigation,
      adaptationLevel,
      confidenceScore
    }
  }
  
  /**
   * Detect fresh twist elements in generated hooks
   */
  private detectFreshTwistElements(hooks: HookObject[]): string[] {
    const freshElements: string[] = []
    
    hooks.forEach((hook, index) => {
      // Check for novel approaches
      if (hook.freshnessScore > 0.8) {
        freshElements.push(`Hook ${index + 1}: High novelty with ${hook.freshnessScore.toFixed(2)} freshness score`)
      }
      
      // Check for creative pattern breaks
      if (hook.verbalHook.toLowerCase().includes('paradox') || 
          hook.verbalHook.toLowerCase().includes('counterintuitive')) {
        freshElements.push(`Hook ${index + 1}: Pattern interrupt with paradoxical framing`)
      }
      
      // Check for unique psychological combinations
      if (hook.riskFactor === 'high' && hook.score > 4.0) {
        freshElements.push(`Hook ${index + 1}: High-risk, high-reward psychological combination`)
      }
    })
    
    return freshElements
  }
  
  /**
   * Generate recommended follow-up actions
   */
  private async generateRecommendedFollowUps(
    request: EnhancedHookGenerationRequest,
    hooks: HookObject[],
    contentStrategy: ReturnType<typeof detectContentStrategy>
  ): Promise<string[]> {
    const recommendations: string[] = []
    
    // Test top performers
    const topHook = hooks[0]
    if (topHook && topHook.score > 4.0) {
      recommendations.push(`A/B test "${topHook.verbalHook}" against current top performer`)
    }
    
    // Explore different categories
    const usedCategories = [...new Set(hooks.map(h => h.hookCategory))]
    const allCategories: HookCategory[] = ['question-based', 'statement-based', 'narrative', 'urgency-exclusivity', 'efficiency']
    const unusedCategories = allCategories.filter(cat => !usedCategories.includes(cat))
    
    if (unusedCategories.length > 0) {
      recommendations.push(`Generate variations using ${unusedCategories[0]} category for different psychological approach`)
    }
    
    // Platform expansion
    const otherPlatforms: Platform[] = (['tiktok', 'instagram', 'youtube'] as Platform[]).filter(p => p !== request.platform)
    if (otherPlatforms.length > 0) {
      recommendations.push(`Adapt top-performing hooks for ${otherPlatforms[0]} with platform-specific optimization`)
    }
    
    // Risk level experimentation
    const riskLevels = [...new Set(hooks.map(h => h.riskFactor))]
    if (!riskLevels.includes('high') && contentStrategy.riskProfile !== 'conservative') {
      recommendations.push('Experiment with higher-risk formulas for potentially higher engagement')
    }
    
    return recommendations
  }
  
  /**
   * Select top variants with diversity considerations
   */
  private selectTopVariants(hooks: HookObject[], count: number): HookObject[] {
    // Sort by score
    const sortedHooks = [...hooks].sort((a, b) => b.score - a.score)
    
    // Ensure diversity in top variants
    const diverseHooks: HookObject[] = []
    const usedCategories = new Set<HookCategory>()
    const usedDrivers = new Set<PsychologicalDriver>()
    
    for (const hook of sortedHooks) {
      if (diverseHooks.length >= count) break
      
      const categoryUsed = usedCategories.has(hook.hookCategory)
      const driverUsed = usedDrivers.has(hook.psychologicalDriver)
      
      // Prioritize diversity for top variants
      if (!categoryUsed || !driverUsed || diverseHooks.length < 2) {
        diverseHooks.push(hook)
        usedCategories.add(hook.hookCategory)
        usedDrivers.add(hook.psychologicalDriver)
      }
    }
    
    // Fill remaining slots with highest scoring hooks if needed
    while (diverseHooks.length < count && diverseHooks.length < hooks.length) {
      const remaining = sortedHooks.find(h => !diverseHooks.includes(h))
      if (remaining) diverseHooks.push(remaining)
    }
    
    return diverseHooks
  }
  
  // Helper methods for psychological analysis
  private calculatePsychologicalResonance(hook: HookObject, contentStrategy: ReturnType<typeof detectContentStrategy>): number {
    let resonance = 0.5
    
    if (contentStrategy.emotionalTriggers.includes(hook.psychologicalDriver)) {
      resonance += 0.3
    }
    
    if (hook.contentTypeStrategy === contentStrategy.primaryStrategy) {
      resonance += 0.2
    }
    
    return Math.min(1, resonance)
  }
  
  private calculateCognitiveAlignment(hook: HookObject, cognitiveBiases: string[]): number {
    const hookText = `${hook.verbalHook} ${hook.rationale || ''}`.toLowerCase()
    
    let alignment = 0
    cognitiveBiases.forEach(bias => {
      if (hookText.includes(bias.toLowerCase().replace('-', ' '))) {
        alignment += 0.25
      }
    })
    
    return Math.min(1, alignment)
  }
  
  private calculatePersonalizationBonus(hook: HookObject, userProfile: any): number {
    let bonus = 0
    
    // Successful formula bonus
    if (userProfile.successfulFormulas?.includes(hook.framework)) {
      bonus += 0.2
    }
    
    // Preferred category bonus
    if (userProfile.preferredCategories?.includes(hook.hookCategory)) {
      bonus += 0.15
    }
    
    // Risk tolerance alignment
    if (userProfile.riskTolerance === hook.riskFactor) {
      bonus += 0.1
    }
    
    return Math.min(0.5, bonus)
  }
  
  private getPlatformOptimizationNote(platform: Platform, hooks: HookObject[]): string {
    const avgWordCount = hooks.reduce((acc, h) => acc + h.wordCount, 0) / hooks.length
    
    switch (platform) {
      case 'tiktok':
        return `Optimized for TikTok with average ${avgWordCount.toFixed(1)} words, high-energy psychological triggers`
      case 'instagram':
        return `Optimized for Instagram with visual-first approach and ${avgWordCount.toFixed(1)} word hooks`
      case 'youtube':
        return `Optimized for YouTube with authority-building and ${avgWordCount.toFixed(1)} word professional hooks`
      default:
        return 'Platform-generic optimization applied'
    }
  }
}

// Export singleton instance
export const enhancedHookGenerator = new EnhancedHookGenerator()