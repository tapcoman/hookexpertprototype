// Serverless-compatible enhanced hook generation service
import OpenAI from 'openai'
import { db } from './db.js'
import { findUserById } from './auth.js'
import { saveHookGeneration } from './hooksData.js'

// Initialize OpenAI client lazily to avoid issues with missing env vars at module load
let openaiClient = null
function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

// Smart model selection based on user's subscription tier
export function selectOptimalModel(user, requestedModel = null) {
  const subscriptionStatus = user.subscriptionStatus || 'free'
  const isPremium = user.isPremium
  const planName = user.subscriptionPlan || 'free'
  const isSubscriptionActive = subscriptionStatus === 'active' || 
                               subscriptionStatus === 'trialing' || 
                               isPremium

  // Free users can only use GPT-4o-mini
  if (!isSubscriptionActive && planName === 'free') {
    return {
      selectedModel: 'gpt-4o-mini',
      reason: 'Draft AI (GPT-4o-mini) for free users',
      wasDowngraded: requestedModel === 'gpt-4o'
    }
  }

  // Paid users can choose, but default to GPT-4o for better results
  if (isSubscriptionActive) {
    const defaultModel = 'gpt-4o' // Smart AI as default for paid users
    const selectedModel = requestedModel || defaultModel
    
    return {
      selectedModel,
      reason: selectedModel === 'gpt-4o' ? 
        `Smart AI (GPT-4o) - Premium quality hooks` : 
        `Draft AI (GPT-4o-mini) - Fast generation`,
      wasDowngraded: false
    }
  }

  // Fallback
  return {
    selectedModel: 'gpt-4o-mini',
    reason: 'Default model selection',
    wasDowngraded: requestedModel === 'gpt-4o'
  }
}

// Hook generation with full psychological framework
export async function generateEnhancedHooks({
  userId,
  platform,
  objective,
  topic,
  modelType = null // Allow null to enable smart selection
}) {
  try {
    console.log('Starting enhanced hook generation for user:', userId)
    
    // Get user context for personalization
    const user = await findUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Smart model selection - choose optimal model for user's plan
    const modelSelection = selectOptimalModel(user, modelType)
    const selectedModelType = modelSelection.selectedModel
    
    console.log('Model selection:', {
      requested: modelType,
      selected: selectedModelType,
      reason: modelSelection.reason,
      wasDowngraded: modelSelection.wasDowngraded
    })

    const userContext = {
      company: user.company,
      industry: user.industry,
      voice: user.voice,
      audience: user.audience,
      bannedTerms: Array.isArray(user.bannedTerms) ? user.bannedTerms : 
        (typeof user.bannedTerms === 'string' ? JSON.parse(user.bannedTerms) : []),
      safety: user.safety || 'standard'
    }

    console.log('User context for personalization:', {
      hasCompany: !!userContext.company,
      hasIndustry: !!userContext.industry,
      hasVoice: !!userContext.voice,
      bannedTermsCount: userContext.bannedTerms.length
    })

    // Create the enhanced prompt with psychological framework
    const systemPrompt = `You are an expert video hook generator with deep knowledge of psychological triggers and platform optimization.

CONTEXT:
- Platform: ${platform.toUpperCase()}
- Objective: ${objective.replace('_', ' ').toUpperCase()}
- User's Company: ${userContext.company || 'Not specified'}
- User's Industry: ${userContext.industry || 'Not specified'}
- User's Voice: ${userContext.voice || 'Not specified'}
- Target Audience: ${userContext.audience || 'General audience'}
- Safety Level: ${userContext.safety}
${userContext.bannedTerms.length > 0 ? `- Banned Terms: ${userContext.bannedTerms.join(', ')}` : ''}

PSYCHOLOGICAL FRAMEWORK:
Use these psychological drivers strategically:
1. Curiosity Gap - Create information gaps that demand closure
2. Social Proof - Leverage crowd behavior and testimonials
3. Authority - Position expertise and credibility
4. Scarcity - Limited time/availability creates urgency
5. Loss Aversion - Fear of missing out or losing something valuable
6. Pattern Interrupts - Break expected patterns to grab attention
7. Controversy - Safe controversial takes that spark engagement
8. Personal Stakes - Make it personally relevant to the viewer

HOOK CATEGORIES:
- Question-Based: Start with compelling questions
- Statement-Based: Bold declarations that stop scrolling
- Narrative: Story hooks that create immediate engagement
- Urgency-Exclusivity: Time-sensitive or exclusive information
- Efficiency: Promise quick results or shortcuts

TRI-MODAL OPTIMIZATION:
Generate hooks optimized for three modalities:
1. VERBAL: What you say (script/voiceover)
2. VISUAL: What viewers see (text overlay/graphics)
3. TEXTUAL: Caption/description text

PLATFORM OPTIMIZATION:
${platform === 'tiktok' ? 'TikTok: Fast-paced, trend-aware, authentic, vertical format' : ''}
${platform === 'instagram' ? 'Instagram: Visual-first, lifestyle-focused, aesthetic, square/vertical' : ''}
${platform === 'youtube' ? 'YouTube: Educational, searchable, longer attention span, horizontal/vertical shorts' : ''}

OUTPUT FORMAT:
For each hook, provide:
1. Verbal Hook (what to say)
2. Visual Hook (text overlay/visual element)
3. Textual Hook (caption/description)
4. Framework (which psychological principle used)
5. Hook Category
6. Risk Factor (low/medium/high based on safety level)
7. Score (1-100 based on engagement potential)
8. Rationale (why this hook works)
9. Platform Notes (platform-specific optimization tips)`

    const userPrompt = `Generate 6 highly engaging video hooks for the topic: "${topic}"

Target the "${objective.replace('_', ' ')}" objective specifically.

Requirements:
- Use diverse psychological frameworks
- Vary hook categories for maximum diversity
- Consider the user's industry (${userContext.industry}) and voice (${userContext.voice})
- Respect safety level: ${userContext.safety}
${userContext.bannedTerms.length > 0 ? `- Avoid these terms: ${userContext.bannedTerms.join(', ')}` : ''}
- Score each hook 1-100 for engagement potential
- Provide specific platform optimization for ${platform.toUpperCase()}

Format each hook as JSON:
{
  "verbalHook": "What you say in the video",
  "visualHook": "Text overlay or visual element",
  "textualHook": "Caption or description text",
  "framework": "Primary psychological principle used",
  "psychologicalDriver": "Specific driver from the framework",
  "hookCategory": "Category from the list above",
  "riskFactor": "low/medium/high",
  "score": 85,
  "rationale": "Detailed explanation of why this works",
  "platformNotes": "Platform-specific optimization tips"
}`

    console.log('Calling OpenAI for hook generation...')
    
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: selectedModelType,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    console.log('OpenAI response received, parsing hooks...')
    
    // Extract JSON objects from the response
    const jsonMatches = responseText.match(/\{[^}]*\}/g) || []
    const hooks = []
    
    for (const jsonMatch of jsonMatches) {
      try {
        const hook = JSON.parse(jsonMatch)
        if (hook.verbalHook && hook.visualHook && hook.framework) {
          hooks.push({
            ...hook,
            id: `hook_${Date.now()}_${hooks.length}`,
            platform,
            objective,
            topic,
            createdAt: new Date().toISOString()
          })
        }
      } catch (parseError) {
        console.warn('Failed to parse hook JSON:', parseError)
        continue
      }
    }

    // If JSON parsing failed, try to extract hooks using regex
    if (hooks.length === 0) {
      console.log('JSON parsing failed, trying fallback parsing...')
      const fallbackHooks = extractHooksFromText(responseText, platform, objective, topic)
      hooks.push(...fallbackHooks)
    }

    if (hooks.length === 0) {
      throw new Error('Failed to generate any valid hooks')
    }

    console.log(`Successfully generated ${hooks.length} hooks`)

    // Get top 3 variants (highest scoring)
    const topThreeVariants = hooks
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3)

    // Calculate analytics
    const averageScore = hooks.reduce((sum, hook) => sum + (hook.score || 0), 0) / hooks.length
    const categoryDistribution = hooks.reduce((dist, hook) => {
      dist[hook.hookCategory] = (dist[hook.hookCategory] || 0) + 1
      return dist
    }, {})

    const generationId = `gen_${userId}_${Date.now()}`

    // Store generation in database
    try {
      await saveHookGeneration(userId, {
        id: generationId,
        platform,
        objective,
        topic,
        modelType: selectedModelType, // Use the actually selected model
        hooks,
        topThreeVariants,
        psychologicalStrategy: {
          selectedStrategy: 'Multi-framework approach with user personalization',
          psychologicalReasoning: 'Diversified psychological triggers to maximize engagement potential',
          platformOptimization: `Optimized for ${platform} with ${objective} objective`,
          diversityApproach: 'Varied hook categories and psychological frameworks',
          riskMitigation: `Safety level: ${userContext.safety}`,
          adaptationLevel: userContext.company ? 80 : 50,
          confidenceScore: Math.min(95, averageScore + 10)
        },
        adaptationLevel: userContext.company ? 80 : 50,
        confidenceScore: Math.min(95, averageScore + 10)
      })
      console.log('Generation saved to database:', generationId)
    } catch (dbError) {
      console.warn('Failed to save generation to database:', dbError)
      // Don't fail the request if database save fails
    }

    return {
      id: generationId,
      hooks,
      topThreeVariants,
      modelType: selectedModelType,
      modelSelection: {
        requested: modelType,
        selected: selectedModelType,
        reason: modelSelection.reason,
        wasDowngraded: modelSelection.wasDowngraded
      },
      psychologicalStrategy: {
        selectedStrategy: 'Multi-framework approach with user personalization',
        psychologicalReasoning: 'Diversified psychological triggers to maximize engagement potential',
        platformOptimization: `Optimized for ${platform} with ${objective} objective`,
        diversityApproach: 'Varied hook categories and psychological frameworks',
        riskMitigation: `Safety level: ${userContext.safety}`,
        adaptationLevel: userContext.company ? 80 : 50,
        confidenceScore: Math.min(95, averageScore + 10)
      },
      hookTaxonomyAnalysis: {
        formulasUsed: [...new Set(hooks.map(h => h.framework))],
        categoryDistribution,
        averageScore,
        totalHooks: hooks.length
      },
      qualityAssessment: {
        averageScore,
        scoreDistribution: hooks.map(h => h.score || 0),
        totalGenerated: hooks.length,
        successRate: 100
      }
    }
  } catch (error) {
    console.error('Hook generation failed:', error)
    throw error
  }
}

// Fallback hook extraction for when JSON parsing fails
function extractHooksFromText(text, platform, objective, topic) {
  const hooks = []
  
  // Simple fallback - create basic hooks from the response
  const lines = text.split('\n').filter(line => line.trim())
  
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i].trim()
    if (line.length > 10) {
      hooks.push({
        id: `fallback_hook_${i}`,
        verbalHook: line,
        visualHook: line.substring(0, 50) + '...',
        textualHook: `${line} #${platform} #${objective}`,
        framework: 'Pattern Interrupt',
        psychologicalDriver: 'Curiosity Gap',
        hookCategory: 'statement-based',
        riskFactor: 'low',
        score: 70 + Math.random() * 20,
        rationale: 'Generated using fallback method',
        platformNotes: `Optimized for ${platform}`,
        platform,
        objective,
        topic,
        createdAt: new Date().toISOString()
      })
    }
  }
  
  return hooks
}

// Check if user can generate hooks with tier-based logic
export async function checkGenerationLimits(userId, modelType = 'gpt-4o-mini') {
  try {
    const user = await findUserById(userId)
    if (!user) {
      return { canGenerate: false, reason: 'User not found' }
    }

    const subscriptionStatus = user.subscriptionStatus || 'free'
    const isPremium = user.isPremium
    const planName = user.subscriptionPlan || 'free'
    const isSubscriptionActive = subscriptionStatus === 'active' || 
                                 subscriptionStatus === 'trialing' || 
                                 isPremium

    // Enhanced limits based on subscription tier
    const isPro = modelType === 'gpt-4o'
    
    // Free users logic
    if (!isSubscriptionActive && planName === 'free') {
      if (isPro) {
        return {
          canGenerate: false,
          reason: 'Smart AI (GPT-4o) requires Starter plan. Upgrade to access premium features.',
          requiresUpgrade: true,
          modelNotAllowed: true,
          upgradeMessage: 'Get 100 Smart AI generations for just $9/month with Starter plan'
        }
      }

      // Check monthly draft limit for free users
      const draftUsed = user.draftGenerationsUsed || 0
      const monthlyLimit = 5
      
      // Check if we need to reset monthly counter
      const lastReset = user.weeklyDraftReset || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysSinceReset = (now - lastReset) / (24 * 60 * 60 * 1000)
      
      let remainingDraft = monthlyLimit - draftUsed
      if (daysSinceReset >= 30) {
        // Reset monthly counter
        remainingDraft = monthlyLimit
      }

      const canGenerate = remainingDraft > 0

      return {
        canGenerate,
        reason: canGenerate ? 
          `${remainingDraft} Draft generations remaining this month` : 
          'Monthly limit reached. Upgrade to Starter for 100 Smart AI generations!',
        remainingCredits: Math.max(0, remainingDraft),
        remainingProGenerations: 0,
        remainingDraftGenerations: Math.max(0, remainingDraft),
        subscriptionPlan: 'free',
        usagePercentage: (draftUsed / monthlyLimit) * 100,
        requiresUpgrade: !canGenerate,
        upgradeMessage: !canGenerate ? 'Get 100 Smart AI generations for just $9/month' : undefined
      }
    }

    // Active subscription users - simplified limits check
    if (isSubscriptionActive) {
      // Get plan limits based on subscription
      const planLimits = {
        starter: { pro: 100, draft: null },
        creator: { pro: 200, draft: null }, 
        pro: { pro: 400, draft: null },
        teams: { pro: null, draft: null }
      }

      const limits = planLimits[planName] || { pro: 100, draft: null }

      if (isPro) {
        const proUsed = user.proGenerationsUsed || 0
        const proLimit = limits.pro
        
        if (proLimit && proUsed >= proLimit) {
          let upgradeMessage = ''
          switch (planName) {
            case 'starter':
              upgradeMessage = 'Upgrade to Creator for 200 Smart AI generations ($15/month)'
              break
            case 'creator':
              upgradeMessage = 'Upgrade to Pro for 400 Smart AI generations ($24/month)'
              break
            case 'pro':
              upgradeMessage = 'Consider Teams plan for unlimited generations ($59/month)'
              break
          }

          return {
            canGenerate: false,
            reason: `Smart AI limit reached (${proUsed}/${proLimit} this month)`,
            remainingProGenerations: 0,
            remainingDraftGenerations: 999999, // Unlimited drafts for paid users
            subscriptionPlan: planName,
            usagePercentage: (proUsed / proLimit) * 100,
            requiresUpgrade: true,
            upgradeMessage
          }
        }

        const remaining = proLimit ? Math.max(0, proLimit - proUsed) : 999999

        return {
          canGenerate: true,
          reason: proLimit ? `${remaining} Smart AI generations remaining` : 'Unlimited Smart AI generations',
          remainingProGenerations: remaining,
          remainingDraftGenerations: 999999,
          subscriptionPlan: planName,
          usagePercentage: proLimit ? (proUsed / proLimit) * 100 : 0
        }
      } else {
        // Draft generations are unlimited for paid users
        return {
          canGenerate: true,
          reason: 'Unlimited Draft generations',
          remainingProGenerations: limits.pro ? Math.max(0, limits.pro - (user.proGenerationsUsed || 0)) : 999999,
          remainingDraftGenerations: 999999,
          subscriptionPlan: planName,
          usagePercentage: 0
        }
      }
    }

    // Fallback for edge cases
    return {
      canGenerate: false,
      reason: 'Unable to determine subscription status. Please contact support.',
      requiresUpgrade: true
    }

  } catch (error) {
    console.error('Error checking generation limits:', error)
    return { 
      canGenerate: false, 
      reason: 'Failed to check generation limits. Please try again.',
      subscriptionPlan: 'free',
      usagePercentage: 0
    }
  }
}

// Update user credits after generation with tier-based tracking
export async function updateUserCredits(userId, modelType = 'gpt-4o-mini') {
  try {
    const user = await findUserById(userId)
    if (!user) {
      console.error(`User ${userId} not found for credit update`)
      return false
    }

    const subscriptionStatus = user.subscriptionStatus || 'free'
    const isPremium = user.isPremium
    const planName = user.subscriptionPlan || 'free'
    const isSubscriptionActive = subscriptionStatus === 'active' || 
                                 subscriptionStatus === 'trialing' || 
                                 isPremium

    const isPro = modelType === 'gpt-4o'

    // For free users, update legacy credits and new tracking
    if (!isSubscriptionActive && planName === 'free') {
      if (isPro) {
        // Free users shouldn't be able to use GPT-4o, but handle gracefully
        console.warn(`Free user ${userId} attempted to use GPT-4o`)
        return false
      }

      // Update draft generation counter and legacy credits
      const newDraftUsed = (user.draftGenerationsUsed || 0) + 1
      const newUsedCredits = (user.usedCredits || 0) + 1

      await db.sql`
        UPDATE users 
        SET 
          draft_generations_used = ${newDraftUsed},
          used_credits = ${newUsedCredits}, 
          updated_at = NOW()
        WHERE id = ${userId}
      `

      console.log(`Updated free user credits for ${userId}: draft_used = ${newDraftUsed}, total_used = ${newUsedCredits}`)
      return true
    }

    // For active subscription users, update appropriate counter
    if (isSubscriptionActive) {
      if (isPro) {
        // Update pro generation counter
        const newProUsed = (user.proGenerationsUsed || 0) + 1

        await db.sql`
          UPDATE users 
          SET 
            pro_generations_used = ${newProUsed},
            updated_at = NOW()
          WHERE id = ${userId}
        `

        console.log(`Updated pro credits for user ${userId}: pro_used = ${newProUsed}`)
        return true
      } else {
        // Update draft generation counter (unlimited for paid users, but track for analytics)
        const newDraftUsed = (user.draftGenerationsUsed || 0) + 1

        await db.sql`
          UPDATE users 
          SET 
            draft_generations_used = ${newDraftUsed},
            updated_at = NOW()
          WHERE id = ${userId}
        `

        console.log(`Updated draft credits for paid user ${userId}: draft_used = ${newDraftUsed}`)
        return true
      }
    }

    // Fallback - should not reach here
    console.warn(`Unexpected subscription state for user ${userId}:`, {
      subscriptionStatus,
      isPremium,
      planName,
      isSubscriptionActive
    })
    return false

  } catch (error) {
    console.error('Error updating user credits:', error)
    return false
  }
}