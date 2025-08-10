import OpenAI from 'openai'
import { HookObject, Platform, Objective, ModelType, HookCategory, PsychologicalDriver } from '../../shared/types.js'
import { HookFormulaService, PsychologicalProfileService } from './database.js'
import { ExternalServiceError, ValidationError } from '../middleware/errorHandler.js'
import { logAIServiceCall, logPerformanceMetric } from '../middleware/logging.js'
import { trackAIUsage } from '../middleware/analytics.js'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// OpenAI pricing (in cents per 1K tokens) - updated for 2025
const OPENAI_PRICING = {
  // Current models (2024-2025)
  'gpt-4o-mini': { input: 0.015, output: 0.06 }, // per 1K tokens
  'gpt-4o': { input: 0.3, output: 1.2 },
  'gpt-4-turbo': { input: 1.0, output: 3.0 },
  'gpt-4-turbo-preview': { input: 1.0, output: 3.0 },
  'gpt-4': { input: 3.0, output: 6.0 },
  'gpt-3.5-turbo': { input: 0.05, output: 0.15 },
  
  // ChatGPT-5 models (released)
  'gpt-5-2025-08-07': { input: 0.5, output: 1.5 }, // Will be updated with actual pricing
  'gpt-5-mini-2025-08-07': { input: 0.02, output: 0.08 }, // Will be updated with actual pricing
  
  // Legacy names for compatibility
  'gpt-5': { input: 0.5, output: 1.5 }, // Maps to gpt-5-2025-08-07
  'gpt-5-mini': { input: 0.02, output: 0.08 } // Maps to gpt-5-mini-2025-08-07
}

// Map model names to actual OpenAI API model identifiers
function mapToOpenAIModel(modelType: string): string {
  const modelMapping: Record<string, string> = {
    // GPT-5 models (primary models in use)
    'gpt-5-2025-08-07': 'gpt-5-2025-08-07',
    'gpt-5-mini-2025-08-07': 'gpt-5-mini-2025-08-07',
    
    // Legacy names mapping to actual models (for backward compatibility)
    'gpt-5': 'gpt-5-2025-08-07',
    'gpt-5-mini': 'gpt-5-mini-2025-08-07',
    
    // Deprecated models (for compatibility during migration)
    'gpt-4o': 'gpt-5-2025-08-07', // Map old pro model to GPT-5
    'gpt-4o-mini': 'gpt-5-mini-2025-08-07', // Map old mini model to GPT-5-mini
    'gpt-4-turbo': 'gpt-5-2025-08-07',
    'gpt-4-turbo-preview': 'gpt-5-2025-08-07',
    'gpt-4': 'gpt-5-2025-08-07',
    'gpt-3.5-turbo': 'gpt-5-mini-2025-08-07'
  }
  
  const mappedModel = modelMapping[modelType]
  if (!mappedModel) {
    console.warn(`Unknown model type: ${modelType}, falling back to gpt-5-mini-2025-08-07`)
    return 'gpt-5-mini-2025-08-07'
  }
  
  // Log model usage for monitoring
  if (modelType.includes('5')) {
    console.log(`ChatGPT-5 model requested: ${modelType} -> using: ${mappedModel}`)
  }
  
  return mappedModel
}

// Calculate estimated cost for OpenAI API call
function calculateOpenAICost(model: string, totalTokens: number): number {
  const pricing = OPENAI_PRICING[model as keyof typeof OPENAI_PRICING]
  if (!pricing) {
    return 0 // Unknown model, return 0 cost
  }
  
  // Estimate input/output token split (roughly 80% input, 20% output for hook generation)
  const inputTokens = Math.round(totalTokens * 0.8)
  const outputTokens = Math.round(totalTokens * 0.2)
  
  const inputCost = (inputTokens / 1000) * pricing.input
  const outputCost = (outputTokens / 1000) * pricing.output
  
  return Math.round((inputCost + outputCost) * 100) // Return in cents
}

// BLOCK 1: Master HookBot Persona System
const HOOKBOT_MASTER_PROMPT = `You are HookBot, a world-class viral video strategist with deep expertise in psychological engagement frameworks and human attention patterns. Your core competencies:

**PSYCHOLOGICAL MASTERY:**
- Advanced understanding of cognitive biases: FOMO, social proof, authority, instant gratification, pattern interrupts
- Emotional trigger expertise: pain/empathy, humor, surprise/shock, personal connection, urgency
- Curiosity gap mechanics: open loops, incomplete information, knowledge gaps, surprise elements
- Value proposition psychology: immediate utility, social status, problem-solving, transformation promises

**STRATEGIC FRAMEWORKS:**
- Value Hit Strategy: For educational/tutorial content - builds trust through immediate utility
- Curiosity Gap Strategy: For storytelling/entertainment - builds intrigue through information gaps
- Hook Taxonomy Mastery: 24+ proven formulas across question-based, statement-based, narrative, urgency-exclusivity, and efficiency categories

**TRI-MODAL COORDINATION:**
- Visual Hook: First-frame optimization, cold-opens, proof elements, aesthetic composition
- Textual Hook: On-screen overlays with platform-specific constraints (Instagram 24-char limit)
- Verbal Hook: Spoken opening lines with psychological resonance and platform word-count optimization

**QUALITY ASSURANCE SYSTEMS:**
- Base scoring: 2.5/5 foundation with enhancement factors
- Word count optimization: Gaussian curves for platform-specific lengths
- Framework effectiveness bonuses: Open Loop (+0.8), PPP (+0.7), etc.
- Promise-content mismatch detection and risk assessment
- Hook fatigue prevention through trend analysis and fresh twist generation

Generate strategically sound, psychologically grounded hooks that create synergistic tri-modal experiences while maintaining ethical standards and authentic value delivery.`

// BLOCK 2: Enhanced Psychological Strategy Selection Engine
export function detectContentStrategy(topic: string, objective: Objective): {
  contentType: 'educational' | 'storytelling' | 'mixed'
  primaryStrategy: 'curiosity_gap' | 'value_hit'
  suggestedCategories: HookCategory[]
  emotionalTriggers: PsychologicalDriver[]
  cognitiveBiases: string[]
  riskProfile: 'conservative' | 'balanced' | 'aggressive'
} {
  const topicLower = topic.toLowerCase()
  
  // Enhanced keyword detection with psychological insights
  const educationalKeywords = ['how to', 'guide', 'tutorial', 'learn', 'steps', 'tips', 'technique', 'method', 'way to', 'teach', 'explain', 'show you']
  const storytellingKeywords = ['story', 'experience', 'journey', 'transformation', 'happened', 'changed', 'when i', 'my', 'once', 'before', 'after']
  const urgencyKeywords = ['now', 'today', 'urgent', 'deadline', 'limited', 'ending', 'closing', 'last chance', 'only']
  const authorityKeywords = ['expert', 'proven', 'research', 'study', 'scientist', 'doctor', 'ceo', 'millionaire']
  
  const hasEducational = educationalKeywords.some(keyword => topicLower.includes(keyword))
  const hasStorytelling = storytellingKeywords.some(keyword => topicLower.includes(keyword))
  const hasUrgency = urgencyKeywords.some(keyword => topicLower.includes(keyword))
  const hasAuthority = authorityKeywords.some(keyword => topicLower.includes(keyword))
  
  let contentType: 'educational' | 'storytelling' | 'mixed'
  let suggestedCategories: HookCategory[]
  let emotionalTriggers: PsychologicalDriver[]
  let cognitiveBiases: string[]
  let riskProfile: 'conservative' | 'balanced' | 'aggressive'
  
  // Content type and category selection
  if (hasEducational && hasStorytelling) {
    contentType = 'mixed'
    suggestedCategories = ['question-based', 'statement-based', 'narrative']
  } else if (hasEducational || objective === 'saves') {
    contentType = 'educational'
    suggestedCategories = ['statement-based', 'efficiency', 'question-based']
  } else if (hasStorytelling || objective === 'shares') {
    contentType = 'storytelling'
    suggestedCategories = ['narrative', 'question-based', 'urgency-exclusivity']
  } else {
    contentType = 'mixed'
    suggestedCategories = ['question-based', 'statement-based']
  }
  
  // Emotional trigger selection based on content analysis
  emotionalTriggers = ['curiosity-gap'] // Base trigger
  
  if (hasAuthority) emotionalTriggers.push('authority-credibility')
  if (hasUrgency) emotionalTriggers.push('urgency-fomo')
  if (contentType === 'educational') emotionalTriggers.push('value-hit')
  if (contentType === 'storytelling') emotionalTriggers.push('emotional-connection')
  if (objective === 'shares') emotionalTriggers.push('social-proof')
  
  // Cognitive bias integration based on objective
  cognitiveBiases = []
  if (objective === 'shares') cognitiveBiases.push('social-proof', 'FOMO')
  if (objective === 'saves') cognitiveBiases.push('instant-gratification', 'authority')
  if (objective === 'ctr') cognitiveBiases.push('curiosity-gap', 'pattern-interrupt')
  if (objective === 'watch_time') cognitiveBiases.push('open-loop', 'emotional-investment')
  
  // Risk profile assessment
  if (hasUrgency || objective === 'shares') {
    riskProfile = 'aggressive'
  } else if (hasAuthority || contentType === 'educational') {
    riskProfile = 'conservative'
  } else {
    riskProfile = 'balanced'
  }
  
  // Primary strategy based on enhanced analysis
  const primaryStrategy = (['saves', 'ctr'].includes(objective) && contentType === 'educational') ? 'value_hit' : 'curiosity_gap'
  
  return { 
    contentType, 
    primaryStrategy, 
    suggestedCategories,
    emotionalTriggers,
    cognitiveBiases,
    riskProfile
  }
}

// BLOCK 3: Hook Taxonomy Engine with Advanced Formula Selection
export async function selectOptimalFormulas(
  userId: string,
  contentStrategy: ReturnType<typeof detectContentStrategy>,
  platform: Platform,
  riskTolerance: 'low' | 'medium' | 'high' = 'medium'
): Promise<any[]> {
  // Get user's psychological profile
  const profile = await PsychologicalProfileService.findByUserId(userId)
  
  // Get all available formulas
  const allFormulas = await HookFormulaService.findAll()
  
  // HOOK TAXONOMY ENGINE: Filter by 24+ formula categories
  let candidateFormulas = allFormulas.filter(formula => {
    // Primary category filtering
    const categoryMatch = contentStrategy.suggestedCategories.includes(formula.category as HookCategory)
    
    // Secondary psychological driver alignment
    const driverMatch = contentStrategy.emotionalTriggers.includes(formula.primaryDriver as PsychologicalDriver)
    
    return categoryMatch || driverMatch
  })
  
  // HOOK FATIGUE PREVENTION: Check trend tracking
  const currentTrends = await HookFormulaService.getTrendAnalysis(platform)
  candidateFormulas = candidateFormulas.map(formula => {
    const trendData = currentTrends.find(t => t.formulaCode === formula.code)
    return {
      ...formula,
      currentFatigueLevel: trendData?.fatigueLevel || 0,
      trendDirection: trendData?.trendDirection || 'stable',
      weeklyUsage: trendData?.weeklyUsage || 0
    }
  })
  
  // Apply psychological preferences if profile exists
  if (profile) {
    // Prioritize successful formulas with exponential weighting
    if (profile.successfulFormulas && Array.isArray(profile.successfulFormulas)) {
      const successfulCodes = profile.successfulFormulas as string[]
      candidateFormulas = candidateFormulas.sort((a, b) => {
        const aSuccessWeight = successfulCodes.includes(a.code) ? 2.0 : 1.0
        const bSuccessWeight = successfulCodes.includes(b.code) ? 2.0 : 1.0
        return (b.effectivenessRating * bSuccessWeight) - (a.effectivenessRating * aSuccessWeight)
      })
    }
    
    // Filter out underperforming formulas
    if (profile.underperformingFormulas && Array.isArray(profile.underperformingFormulas)) {
      const underperformingCodes = profile.underperformingFormulas as string[]
      candidateFormulas = candidateFormulas.filter(formula => 
        !underperformingCodes.includes(formula.code)
      )
    }
    
    // Enhanced risk tolerance with psychological profile integration
    const userRiskTolerance = profile.riskTolerance || contentStrategy.riskProfile || riskTolerance
    candidateFormulas = candidateFormulas.filter(formula => {
      if (userRiskTolerance === 'conservative') return formula.riskFactor === 'low'
      if (userRiskTolerance === 'aggressive') return true
      return formula.riskFactor !== 'high'
    })
  }
  
  // PLATFORM-SPECIFIC OPTIMIZATION with psychological alignment
  candidateFormulas = candidateFormulas.filter(formula => {
    if (platform === 'tiktok') {
      // TikTok: High-energy, trend-sensitive, pattern-interrupt friendly
      const tiktokOptimal = ['question-based', 'narrative', 'urgency-exclusivity'].includes(formula.category)
      const lowFatigue = (formula as any).currentFatigueLevel < 70
      return tiktokOptimal && lowFatigue
    }
    if (platform === 'instagram') {
      // Instagram: Visual-first, lifestyle, aesthetic appeal
      return true // All categories work but prioritize visual compatibility
    }
    if (platform === 'youtube') {
      // YouTube: Value-driven, searchable, authority-building
      const youtubeOptimal = ['statement-based', 'efficiency', 'question-based'].includes(formula.category)
      const hasAuthority = formula.primaryDriver === 'authority-credibility' || formula.primaryDriver === 'value-hit'
      return youtubeOptimal || hasAuthority
    }
    return true
  })
  
  // ADVANCED QUALITY SCORING with fatigue resistance
  candidateFormulas = candidateFormulas.map(formula => {
    let adjustedScore = formula.effectivenessRating
    
    // Fatigue penalty
    const fatiguePenalty = Math.max(0, ((formula as any).currentFatigueLevel - 50) / 100)
    adjustedScore *= (1 - fatiguePenalty)
    
    // Platform alignment bonus
    if (platform === 'tiktok' && formula.category === 'urgency-exclusivity') adjustedScore *= 1.2
    if (platform === 'youtube' && formula.primaryDriver === 'value-hit') adjustedScore *= 1.15
    if (platform === 'instagram' && formula.category === 'narrative') adjustedScore *= 1.1
    
    // Cognitive bias alignment bonus
    const biasAlignment = contentStrategy.cognitiveBiases.some(bias => 
      formula.psychologicalTriggers?.includes(bias.toLowerCase().replace('-','_'))
    )
    if (biasAlignment) adjustedScore *= 1.1
    
    return { ...formula, adjustedScore }
  })
  
  // Sort by adjusted effectiveness and return top candidates with diversity
  const sortedFormulas = candidateFormulas
    .sort((a, b) => (b as any).adjustedScore - (a as any).adjustedScore)
  
  // Ensure diversity across categories (max 2 per category)
  const diverseFormulas: any[] = []
  const categoryCount: Record<string, number> = {}
  
  for (const formula of sortedFormulas) {
    const currentCount = categoryCount[formula.category] || 0
    if (currentCount < 2 && diverseFormulas.length < 8) {
      diverseFormulas.push(formula)
      categoryCount[formula.category] = currentCount + 1
    }
  }
  
  return diverseFormulas
}

// Generate hooks using AI with psychological framework
export async function generateHooksWithAI(params: {
  topic: string
  platform: Platform
  objective: Objective
  modelType: ModelType
  userId: string
  userContext?: {
    company?: string
    industry?: string
    voice?: string
    audience?: string
    bannedTerms?: string[]
    safety?: string
  }
}): Promise<HookObject[]> {
  const startTime = Date.now()
  
  try {
    // Detect content strategy
    const contentStrategy = detectContentStrategy(params.topic, params.objective)
    
    // Select optimal formulas
    const selectedFormulas = await selectOptimalFormulas(
      params.userId,
      contentStrategy,
      params.platform
    )
    
    if (selectedFormulas.length === 0) {
      throw new ValidationError('No suitable hook formulas found for the given parameters')
    }
    
    // Build AI prompt
    const prompt = buildAIPrompt({
      ...params,
      contentStrategy,
      selectedFormulas: selectedFormulas.slice(0, 5) // Use top 5 formulas
    })
    
    logAIServiceCall('openai-hook-generation', {
      model: params.modelType,
      platform: params.platform,
      objective: params.objective,
      formulaCount: selectedFormulas.length,
      promptLength: prompt.length
    }, params.userId)
    
    // Map requested model to actual OpenAI model identifier
    const actualModel = mapToOpenAIModel(params.modelType)
    
    // Call OpenAI API with HookBot Master Prompt System
    const completion = await openai.chat.completions.create({
      model: actualModel,
      messages: [
        { role: 'system', content: HOOKBOT_MASTER_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8, // Balanced creativity for psychological authenticity
      max_tokens: 4000, // Increased for comprehensive tri-modal analysis
      response_format: { type: 'json_object' },
      // Enhanced sampling for psychological variety and hook fatigue prevention
      top_p: 0.9,
      frequency_penalty: 0.3, // Reduce repetitive patterns for freshness
      presence_penalty: 0.2 // Encourage diverse psychological approaches
    })
    
    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new ExternalServiceError('OpenAI', 'No response received from AI service')
    }

    // Track AI usage metrics
    const tokensUsed = completion.usage?.total_tokens || 0
    const estimatedCost = calculateOpenAICost(params.modelType, tokensUsed)
    await trackAIUsage('openai', params.modelType, tokensUsed, estimatedCost, params.userId)
    
    // Parse AI response
    let aiResponse
    try {
      aiResponse = JSON.parse(responseContent)
    } catch (error) {
      throw new ExternalServiceError('OpenAI', 'Invalid JSON response from AI service')
    }
    
    // Validate and process hooks with enhanced psychological scoring
    const hooks = await processAIHooks(aiResponse.hooks || [], {
      platform: params.platform,
      objective: params.objective,
      topic: params.topic,
      selectedFormulas,
      contentStrategy
    })
    
    // Log performance metrics
    const duration = Date.now() - startTime
    logPerformanceMetric('ai-hook-generation-duration', duration, {
      platform: params.platform,
      hookCount: hooks.length,
      model: params.modelType
    }, params.userId)
    
    return hooks
    
  } catch (error) {
    const duration = Date.now() - startTime
    logPerformanceMetric('ai-hook-generation-error', duration, {
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: params.platform
    }, params.userId)
    
    if (error instanceof ExternalServiceError || error instanceof ValidationError) {
      throw error
    }
    
    throw new ExternalServiceError('OpenAI', `Hook generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// BLOCK 4: Master Prompt Blueprint with Tri-Modal Output Coordination
function buildAIPrompt(params: {
  topic: string
  platform: Platform
  objective: Objective
  userId: string
  contentStrategy: ReturnType<typeof detectContentStrategy>
  selectedFormulas: any[]
  userContext?: {
    company?: string
    industry?: string
    voice?: string
    audience?: string
    bannedTerms?: string[]
    safety?: string
  }
}): string {
  const { topic, platform, objective, contentStrategy, selectedFormulas, userContext } = params
  
  // BLOCK 2: Input Variables with Enhanced Context
  const inputVariables = `
**CORE INPUT VARIABLES:**
- Video_Topic: ${topic}
- Target_Audience: ${userContext?.audience || 'General audience'}
- Audience_Pain_Point: ${inferPainPoints(topic, contentStrategy)}
- Video_Goal: ${objective}
- Content_Type: ${contentStrategy.contentType}
- Platform: ${platform}
- Psychological_Triggers: ${contentStrategy.emotionalTriggers.join(', ')}
- Cognitive_Biases: ${contentStrategy.cognitiveBiases.join(', ')}
- Risk_Profile: ${contentStrategy.riskProfile}`
  
  // Enhanced formula descriptions with psychological insights
  const formulaDescriptions = selectedFormulas.map(formula => 
    `**${formula.code} - ${formula.name}** (${formula.category})
    - Template: ${formula.structuralTemplate}
    - Primary Driver: ${formula.primaryDriver}
    - Psychological Triggers: ${Array.isArray(formula.psychologicalTriggers) ? formula.psychologicalTriggers.join(', ') : 'N/A'}
    - Risk Factor: ${formula.riskFactor}
    - Effectiveness: ${formula.effectivenessRating}% (Fatigue Resistance: ${formula.fatigueResistance || 'N/A'}%)
    - Current Trend: ${(formula as any).trendDirection || 'stable'} (Usage: ${(formula as any).weeklyUsage || '0'}/week)
    - Example: ${Array.isArray(formula.exampleVariations) ? formula.exampleVariations[0] : 'N/A'}
    - Strategic Use: ${formula.usageGuidelines || 'General purpose'}
    - Cautions: ${formula.cautionaryNotes || 'Standard precautions'}`
  ).join('\n\n')
  
  // Enhanced context section
  let contextSection = ''
  if (userContext) {
    contextSection = `
**BRAND VOICE & CONTEXT:**
${userContext.company ? `- Company: ${userContext.company}` : ''}
${userContext.industry ? `- Industry: ${userContext.industry}` : ''}
${userContext.voice ? `- Voice: ${userContext.voice}` : ''}
${userContext.audience ? `- Target Audience: ${userContext.audience}` : ''}
${userContext.safety ? `- Safety Level: ${userContext.safety}` : ''}
${userContext.bannedTerms?.length ? `- Prohibited Terms: ${userContext.bannedTerms.join(', ')}` : ''}
`
  }
  
  // BLOCK 3: Knowledge Base & Core Instructions with Strategic Sequencing
  const knowledgeBase = `
**PSYCHOLOGICAL STRATEGY IMPLEMENTATION:**
1. **Primary Strategy**: ${contentStrategy.primaryStrategy === 'value_hit' ? 
    'VALUE HIT - Lead with immediate utility, build trust through educational value' : 
    'CURIOSITY GAP - Create intrigue through strategic information withholding'}
2. **Emotional Sequence**: ${getEmotionalSequence(contentStrategy.emotionalTriggers)}
3. **Cognitive Bias Application**: ${getCognitiveBiasStrategy(contentStrategy.cognitiveBiases)}
4. **Hook Fatigue Prevention**: Apply fresh twists to established formulas, avoid oversaturated patterns
5. **Platform Psychology**: ${getPlatformPsychology(platform)}`
  
  return `${inputVariables}

${contextSection}

${knowledgeBase}

**AVAILABLE HOOK FORMULAS (24+ Taxonomy):**
${formulaDescriptions}

**PLATFORM OPTIMIZATION:**
${getPlatformRequirements(platform)}

**TRI-MODAL OUTPUT REQUIREMENTS:**
${getTriModalRequirements(platform)}

**RESPONSE FORMAT (JSON):**
{
  "hooks": [
    {
      "verbalHook": "Main spoken opening line (platform-optimized word count)",
      "visualHook": "First-frame visual direction with specific composition/element guidance",
      "textualHook": "On-screen text overlay (Instagram: max 24 chars, others: concise)",
      "framework": "Formula code and name used",
      "psychologicalDriver": "Primary psychological trigger from available options",
      "hookCategory": "Category from taxonomy",
      "riskFactor": "low/medium/high",
      "score": "Calculated using advanced quality scoring (base 2.5 + enhancements)",
      "wordCount": "Exact word count of verbal hook",
      "scoreBreakdown": "Detailed explanation: word count optimization + framework effectiveness + platform alignment + psychological resonance",
      "rationale": "Deep psychological analysis: why this specific combination of triggers/biases creates engagement",
      "platformNotes": "Platform-specific optimization and execution notes",
      "contentTypeStrategy": "curiosity_gap or value_hit with justification",
      "platformSpecific": {
        "tiktokColdOpen": "Specific cold-open visual suggestion",
        "instagramOverlay": "Instagram story/reel text overlay (24 char max)",
        "youtubeProofCue": "YouTube proof element or credibility indicator"
      },
      "promiseContentMatch": "Boolean + explanation of content-promise alignment",
      "specificityScore": "0-1 score based on topic relevance and concrete details",
      "freshnessScore": "0-1 score based on pattern novelty and trend awareness",
      "psychologicalResonance": "0-1 score based on emotional trigger effectiveness",
      "cognitiveAlignment": "How well hook aligns with identified cognitive biases",
      "fatigueRisk": "Assessment of formula oversaturation risk",
      "synergisticElements": "How verbal/visual/textual elements reinforce each other"
    }
  ],
  "strategicAnalysis": {
    "selectedStrategy": "Overall approach chosen and justification",
    "psychologicalReasoning": "Why these specific triggers/biases were emphasized",
    "platformOptimization": "How hooks were tailored for platform psychology",
    "diversityApproach": "How formula variety prevents fatigue",
    "riskMitigation": "How potential risks were addressed"
  }
}

**CRITICAL REQUIREMENTS:**
1. Use ONLY provided psychological frameworks from the 24+ formula taxonomy
2. Ensure tri-modal synergy - all three elements must reinforce the same psychological message
3. Apply advanced quality scoring: Base 2.5 + word count optimization + framework effectiveness + platform alignment + psychological resonance
4. Implement hook fatigue prevention through trend awareness and fresh twists
5. Maintain authentic psychological application - no manipulative tactics
6. Respect banned terms and safety levels while maximizing engagement
7. Generate strategic diversity across different formulas and approaches
8. Provide detailed psychological rationale for each hook's effectiveness
9. Ensure promise-content match to maintain credibility and trust
10. Optimize for platform-specific psychology and user behavior patterns`
}

// Enhanced platform requirements with psychological insights
function getPlatformRequirements(platform: Platform): string {
  const requirements = {
    tiktok: `
**TikTok Optimization:**
- Word Count: 6-12 words optimal (Gaussian peak at 9 words)
- Psychological Style: High-energy, trend-responsive, pattern-interrupt friendly
- Visual Priority: Dynamic cold-opens, movement-based attention capture
- Text Strategy: Minimal overlays, emoji-enhanced, trending terminology
- Audio Psychology: Hook within 3 seconds, music-sync opportunities
- Cognitive Biases: FOMO, social proof, instant gratification
- Attention Span: 2-3 second capture window, maintain high stimulation`,
    
    instagram: `
**Instagram Optimization:**
- Word Count: 6-15 words optimal (Gaussian peak at 10 words)
- Psychological Style: Aesthetic-driven, lifestyle aspirational, authentic personal
- Visual Priority: High-quality first frame, aesthetically pleasing composition
- Text Strategy: Engaging overlays (MAX 24 characters), emoji-strategic, brand-consistent
- Audio Psychology: Music-compatible narration, lifestyle-appropriate tone
- Cognitive Biases: Social proof, authority, aesthetic appeal
- Attention Span: 3-5 second window, visual-first engagement`,
    
    youtube: `
**YouTube Optimization:**
- Word Count: 4-8 words optimal (Gaussian peak at 6 words)
- Psychological Style: Value-driven, authority-building, searchable content
- Visual Priority: Thumbnail-worthy opening, professional credibility indicators
- Text Strategy: Minimal text focus, verbal content prioritized
- Audio Psychology: Clear narration, proof elements, expertise demonstration
- Cognitive Biases: Authority, value proposition, educational appeal
- Attention Span: 5-8 second window, content value emphasis`
  }
  
  return requirements[platform]
}

// Helper functions for enhanced prompting
function inferPainPoints(topic: string, strategy: ReturnType<typeof detectContentStrategy>): string {
  const topicLower = topic.toLowerCase()
  
  if (topicLower.includes('productivity') || topicLower.includes('time')) {
    return 'Time scarcity, inefficiency, overwhelm'
  }
  if (topicLower.includes('money') || topicLower.includes('business')) {
    return 'Financial insecurity, lack of growth, competitive pressure'
  }
  if (topicLower.includes('social') || topicLower.includes('relationship')) {
    return 'Social anxiety, connection issues, authenticity struggles'
  }
  
  return 'General improvement, efficiency, achievement'
}

function getEmotionalSequence(triggers: PsychologicalDriver[]): string {
  const sequences = {
    'curiosity-gap': 'Create intrigue → Build investment → Promise resolution',
    'value-hit': 'Promise utility → Demonstrate value → Deliver insight',
    'pain-point': 'Identify problem → Amplify urgency → Offer solution',
    'urgency-fomo': 'Create scarcity → Amplify consequences → Drive action'
  }
  
  return triggers.map(trigger => sequences[trigger] || 'Standard engagement sequence').join(' | ')
}

function getCognitiveBiasStrategy(biases: string[]): string {
  const strategies = {
    'social-proof': 'Leverage crowd behavior and authority endorsement',
    'FOMO': 'Emphasize limited availability and opportunity cost',
    'authority': 'Establish credibility through expertise and results',
    'instant-gratification': 'Promise quick wins and immediate value'
  }
  
  return biases.map(bias => strategies[bias] || 'Standard persuasion').join(' + ')
}

function getPlatformPsychology(platform: Platform): string {
  const psychology = {
    tiktok: 'Entertainment-first mindset, trend participation, community belonging',
    instagram: 'Lifestyle aspiration, aesthetic appreciation, personal brand building',
    youtube: 'Learning orientation, value seeking, long-form engagement'
  }
  
  return psychology[platform]
}

function getTriModalRequirements(platform: Platform): string {
  return `
**Tri-Modal Synergy Requirements:**
1. **Verbal Hook**: Primary attention grabber with platform-optimized word count
2. **Visual Hook**: First-frame direction that reinforces verbal message
3. **Textual Hook**: On-screen overlay that amplifies psychological impact
4. **Synergistic Design**: All three elements must reinforce the same psychological trigger
5. **Platform Adaptation**: Each mode optimized for platform-specific consumption patterns
6. **Psychological Coherence**: Consistent emotional tone across all three modalities`
}

// BLOCK 5: Advanced Quality Scoring & Hook Processing Engine
async function processAIHooks(
  rawHooks: any[], 
  context: {
    platform: Platform
    objective: Objective
    topic: string
    selectedFormulas: any[]
    contentStrategy: ReturnType<typeof detectContentStrategy>
  }
): Promise<HookObject[]> {
  const processedHooks: HookObject[] = []
  
  for (const rawHook of rawHooks) {
    try {
      // Enhanced validation with tri-modal requirements
      if (!rawHook.verbalHook || !rawHook.framework) {
        continue
      }
      
      // Validate tri-modal synergy
      const triModalSynergy = validateTriModalSynergy(rawHook)
      
      // Calculate word count with platform awareness
      const wordCount = rawHook.verbalHook.split(/\s+/).length
      
      // ADVANCED QUALITY SCORING SYSTEM
      const baseScore = 2.5 // Starting foundation
      
      // Word Count Optimization (Gaussian curves)
      const wordCountScore = calculateWordCountScore(wordCount, context.platform)
      const wordCountBonus = (wordCountScore - 0.5) * 1.0 // Up to +0.5 bonus
      
      // Framework Effectiveness Bonus
      const frameworkEffectiveness = getFrameworkEffectiveness(rawHook.framework, context.selectedFormulas) / 100
      const frameworkBonus = getFrameworkTypeBonus(rawHook.framework)
      
      // Platform-Objective Alignment
      const platformObjectiveAlignment = calculatePlatformObjectiveAlignment(context.platform, context.objective, rawHook)
      
      // Psychological Resonance Scoring
      const psychologicalResonance = calculatePsychologicalResonance(rawHook, context.contentStrategy)
      
      // Risk Assessment
      const riskPenalty = calculateRiskPenalty(rawHook, context.contentStrategy)
      
      // Specificity and Freshness (enhanced)
      const specificityScore = calculateSpecificityScore(rawHook.verbalHook, context.topic)
      const freshnessScore = calculateFreshnessScore(rawHook.verbalHook, context.selectedFormulas)
      
      // Promise-Content Match Assessment
      const promiseContentMatch = assessPromiseContentMatch(rawHook, context.topic)
      
      // COMPOSITE SCORE CALCULATION
      const compositeScore = Math.min(5.0, Math.max(0, 
        baseScore + 
        wordCountBonus + 
        (frameworkEffectiveness * 0.8) + 
        frameworkBonus + 
        (platformObjectiveAlignment * 0.6) + 
        (psychologicalResonance * 0.7) + 
        (specificityScore * 0.5) + 
        (freshnessScore * 0.4) + 
        (triModalSynergy * 0.3) + 
        (promiseContentMatch * 0.2) - 
        riskPenalty
      ))
      
      const processedHook: HookObject = {
        verbalHook: rawHook.verbalHook,
        visualHook: rawHook.visualHook || 'Dynamic opening visual',
        textualHook: rawHook.textualHook || '',
        framework: rawHook.framework,
        psychologicalDriver: rawHook.psychologicalDriver as PsychologicalDriver,
        hookCategory: rawHook.hookCategory as HookCategory,
        riskFactor: rawHook.riskFactor,
        score: compositeScore,
        wordCount,
        scoreBreakdown: createEnhancedScoreBreakdown({
          baseScore,
          wordCountScore: wordCountBonus,
          frameworkEffectiveness,
          frameworkBonus,
          platformAlignment: platformObjectiveAlignment,
          psychologicalResonance,
          specificityScore,
          freshnessScore,
          triModalSynergy,
          promiseContentMatch,
          riskPenalty
        }),
        rationale: rawHook.rationale || 'AI-generated psychological hook with strategic formula application',
        platformNotes: rawHook.platformNotes || `Optimized for ${context.platform} psychology and ${context.objective} objective`,
        contentTypeStrategy: rawHook.contentTypeStrategy || context.contentStrategy.primaryStrategy,
        platformSpecific: rawHook.platformSpecific || {},
        promiseContentMatch: promiseContentMatch > 0.7,
        specificityScore,
        freshnessScore
      }
      
      processedHooks.push(processedHook)
      
    } catch (error) {
      console.error('Error processing hook:', error)
      continue
    }
  }
  
  // Sort by composite score and return top hooks with diversity
  const sortedHooks = processedHooks.sort((a, b) => b.score - a.score)
  
  // Ensure diversity across psychological drivers and categories
  const diverseHooks = ensureHookDiversity(sortedHooks)
  
  return diverseHooks.slice(0, 5)
}

// Enhanced Quality Scoring Functions with Psychological Framework Integration
function calculateSpecificityScore(hook: string, topic: string): number {
  const hookLower = hook.toLowerCase()
  const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  
  let exactMatches = 0
  let semanticMatches = 0
  
  for (const word of topicWords) {
    if (hookLower.includes(word)) {
      exactMatches++
    } else {
      // Check for semantic similarity (basic implementation)
      const semanticWords = getSemanticWords(word)
      if (semanticWords.some(sw => hookLower.includes(sw))) {
        semanticMatches++
      }
    }
  }
  
  const totalRelevance = (exactMatches + semanticMatches * 0.7) / Math.max(1, topicWords.length)
  return Math.min(1, totalRelevance)
}

function calculateFreshnessScore(hook: string, formulas: any[]): number {
  const hookLower = hook.toLowerCase()
  
  // Expanded overused patterns with trend awareness
  const overusedPatterns = [
    'did you know', 'this will', 'you need to', 'here is how', 'the secret',
    'this one trick', 'you won\'t believe', 'shocking truth', 'game changer',
    'life hack', 'stop doing this', 'everyone is doing this wrong'
  ]
  
  // Check for pattern fatigue
  const patternFatigue = overusedPatterns.filter(pattern => hookLower.includes(pattern)).length
  
  // Check for formula freshness
  const hasNovelElements = checkNovelElements(hookLower)
  
  // Base freshness with penalties
  let freshness = 0.9
  freshness -= (patternFatigue * 0.15) // Penalty for overused patterns
  freshness += (hasNovelElements ? 0.1 : 0) // Bonus for novel elements
  
  return Math.max(0.3, Math.min(1, freshness))
}

function calculateWordCountScore(wordCount: number, platform: Platform): number {
  // Enhanced Gaussian curves based on platform psychology research
  const optimal = {
    tiktok: { min: 6, max: 12, peak: 9, variance: 4 },
    instagram: { min: 6, max: 15, peak: 10, variance: 6 },
    youtube: { min: 4, max: 8, peak: 6, variance: 3 }
  }
  
  const config = optimal[platform]
  const variance = config.variance
  const gaussianScore = Math.exp(-Math.pow(wordCount - config.peak, 2) / (2 * variance))
  
  return Math.max(0, Math.min(1, gaussianScore))
}

function getFrameworkEffectiveness(framework: string, formulas: any[]): number {
  const formula = formulas.find(f => 
    f.name === framework || 
    f.code === framework || 
    framework.includes(f.code) || 
    framework.includes(f.name)
  )
  return formula ? formula.effectivenessRating : 75
}

function getFrameworkTypeBonus(framework: string): number {
  // Framework effectiveness bonuses based on psychological research
  const bonuses = {
    'Open Loop': 0.8,
    'Cliffhanger': 0.8,
    'PPP': 0.7, // Pain-Promise-Proof
    'Before & After': 0.7,
    'Pattern Interrupt': 0.6,
    'Authority Challenge': 0.6,
    'Curiosity Gap': 0.5,
    'Social Proof': 0.5
  }
  
  for (const [type, bonus] of Object.entries(bonuses)) {
    if (framework.toLowerCase().includes(type.toLowerCase())) {
      return bonus
    }
  }
  
  return 0.3 // Base bonus for any structured framework
}

function calculatePlatformObjectiveAlignment(platform: Platform, objective: Objective, hook: any): number {
  const alignmentMatrix = {
    tiktok: {
      'shares': 0.9, 'watch_time': 0.8, 'follows': 0.7, 'ctr': 0.6, 'saves': 0.5
    },
    instagram: {
      'saves': 0.9, 'shares': 0.8, 'follows': 0.7, 'ctr': 0.6, 'watch_time': 0.5
    },
    youtube: {
      'ctr': 0.9, 'watch_time': 0.8, 'saves': 0.7, 'follows': 0.6, 'shares': 0.5
    }
  }
  
  return alignmentMatrix[platform]?.[objective] || 0.6
}

function calculatePsychologicalResonance(hook: any, contentStrategy: ReturnType<typeof detectContentStrategy>): number {
  let resonance = 0.5 // Base resonance
  
  // Driver alignment bonus
  if (contentStrategy.emotionalTriggers.includes(hook.psychologicalDriver)) {
    resonance += 0.3
  }
  
  // Cognitive bias alignment
  const biasAlignment = contentStrategy.cognitiveBiases.some(bias => 
    hook.rationale?.toLowerCase().includes(bias.toLowerCase()) ||
    hook.psychologicalDriver === bias.replace('-', '_')
  )
  if (biasAlignment) resonance += 0.2
  
  // Strategy consistency
  if (hook.contentTypeStrategy === contentStrategy.primaryStrategy) {
    resonance += 0.2
  }
  
  return Math.min(1, resonance)
}

function calculateRiskPenalty(hook: any, contentStrategy: ReturnType<typeof detectContentStrategy>): number {
  let penalty = 0
  
  // Risk factor penalties
  if (hook.riskFactor === 'high' && contentStrategy.riskProfile === 'conservative') {
    penalty += 0.4
  } else if (hook.riskFactor === 'medium' && contentStrategy.riskProfile === 'conservative') {
    penalty += 0.2
  }
  
  // Promise-content mismatch penalty
  if (hook.promiseContentMatch === false) {
    penalty += 0.3
  }
  
  // Manipulation detection penalty
  if (detectManipulativeTactics(hook.verbalHook)) {
    penalty += 0.5
  }
  
  return penalty
}

function validateTriModalSynergy(hook: any): number {
  let synergy = 0.5 // Base synergy
  
  // Check if all three modalities are present
  const hasVerbal = !!hook.verbalHook
  const hasVisual = !!hook.visualHook
  const hasTextual = !!hook.textualHook
  
  if (hasVerbal && hasVisual && hasTextual) {
    synergy += 0.3
  } else if (hasVerbal && (hasVisual || hasTextual)) {
    synergy += 0.2
  }
  
  // Check for message consistency across modalities
  if (checkMessageConsistency(hook)) {
    synergy += 0.2
  }
  
  return Math.min(1, synergy)
}

function assessPromiseContentMatch(hook: any, topic: string): number {
  // Basic implementation - would be enhanced with more sophisticated NLP
  const hookPromises = extractPromises(hook.verbalHook)
  const topicElements = topic.toLowerCase().split(/\s+/)
  
  let matchScore = 0.7 // Base assumption of match
  
  // Check for overpromising indicators
  const overpromiseIndicators = ['secret', 'never', 'always', 'guaranteed', 'instant', 'overnight']
  const hasOverpromise = overpromiseIndicators.some(indicator => 
    hook.verbalHook.toLowerCase().includes(indicator)
  )
  
  if (hasOverpromise) matchScore -= 0.3
  
  // Check for specific, deliverable promises
  if (hookPromises.some(promise => topicElements.some(element => promise.includes(element)))) {
    matchScore += 0.2
  }
  
  return Math.max(0, Math.min(1, matchScore))
}

// Helper functions
function getSemanticWords(word: string): string[] {
  const semanticMap: Record<string, string[]> = {
    'productivity': ['efficiency', 'performance', 'output'],
    'money': ['income', 'profit', 'wealth', 'revenue'],
    'business': ['company', 'startup', 'entrepreneur'],
    'social': ['networking', 'relationships', 'community']
  }
  
  return semanticMap[word] || []
}

function checkNovelElements(hook: string): boolean {
  // Check for creative elements, unique phrasing, fresh angles
  const novelIndicators = ['twist', 'paradox', 'counterintuitive', 'unexpected', 'surprising']
  return novelIndicators.some(indicator => hook.includes(indicator))
}

function detectManipulativeTactics(hook: string): boolean {
  const manipulativePatterns = [
    'you must', 'you have to', 'don\'t miss out', 'act now or',
    'last chance', 'final warning', 'this will disappear'
  ]
  
  return manipulativePatterns.some(pattern => hook.toLowerCase().includes(pattern))
}

function checkMessageConsistency(hook: any): boolean {
  // Basic consistency check across modalities
  if (!hook.verbalHook || !hook.visualHook) return false
  
  const verbalTone = extractTone(hook.verbalHook)
  const visualTone = extractTone(hook.visualHook)
  
  return verbalTone === visualTone
}

function extractTone(text: string): string {
  if (!text) return 'neutral'
  
  const urgentWords = ['now', 'urgent', 'quick', 'fast', 'immediately']
  const calmWords = ['gentle', 'easy', 'simple', 'comfortable']
  
  if (urgentWords.some(word => text.toLowerCase().includes(word))) return 'urgent'
  if (calmWords.some(word => text.toLowerCase().includes(word))) return 'calm'
  
  return 'neutral'
}

function extractPromises(hook: string): string[] {
  // Extract explicit promises from hook text
  const promisePatterns = [
    /will (\w+)/g,
    /going to (\w+)/g,
    /you'll (\w+)/g,
    /guarantee (\w+)/g
  ]
  
  const promises: string[] = []
  for (const pattern of promisePatterns) {
    const matches = hook.match(pattern)
    if (matches) promises.push(...matches)
  }
  
  return promises
}

function createEnhancedScoreBreakdown(scores: any): string {
  return `Base: ${scores.baseScore.toFixed(1)} | Word Count: +${(scores.wordCountScore).toFixed(2)} | Framework: +${(scores.frameworkEffectiveness * 0.8).toFixed(2)} | Platform Alignment: +${(scores.platformAlignment * 0.6).toFixed(2)} | Psychology: +${(scores.psychologicalResonance * 0.7).toFixed(2)} | Risk: -${scores.riskPenalty.toFixed(2)}`
}

function ensureHookDiversity(hooks: HookObject[]): HookObject[] {
  const diverseHooks: HookObject[] = []
  const usedDrivers = new Set<string>()
  const usedCategories = new Set<string>()
  
  for (const hook of hooks) {
    const driverUsed = usedDrivers.has(hook.psychologicalDriver)
    const categoryUsed = usedCategories.has(hook.hookCategory)
    
    // Prioritize diversity while maintaining quality
    if (!driverUsed || !categoryUsed || diverseHooks.length < 3) {
      diverseHooks.push(hook)
      usedDrivers.add(hook.psychologicalDriver)
      usedCategories.add(hook.hookCategory)
    }
    
    if (diverseHooks.length >= 8) break
  }
  
  return diverseHooks
}