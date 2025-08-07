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

// Hook generation with full psychological framework
export async function generateEnhancedHooks({
  userId,
  platform,
  objective,
  topic,
  modelType = 'gpt-4o-mini'
}) {
  try {
    console.log('Starting enhanced hook generation for user:', userId)
    
    // Get user context for personalization
    const user = await findUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

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
      model: modelType,
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
        modelType,
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

// Check if user can generate hooks (credits/subscription)
export async function checkGenerationLimits(userId) {
  try {
    const user = await findUserById(userId)
    if (!user) {
      return { canGenerate: false, reason: 'User not found' }
    }

    const freeCredits = user.freeCredits || 0
    const usedCredits = user.usedCredits || 0
    const subscriptionStatus = user.subscriptionStatus
    const isPremium = user.isPremium

    // Check if user has active subscription
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || isPremium) {
      return { canGenerate: true, reason: 'Active subscription' }
    }

    // Check free credits
    if (freeCredits > usedCredits) {
      return { 
        canGenerate: true, 
        reason: 'Free credits available',
        remainingCredits: freeCredits - usedCredits
      }
    }

    return { 
      canGenerate: false, 
      reason: 'No credits remaining. Please upgrade to continue generating hooks.',
      requiresUpgrade: true
    }
  } catch (error) {
    console.error('Error checking generation limits:', error)
    return { canGenerate: false, reason: 'Failed to check generation limits' }
  }
}

// Update user credits after generation
export async function updateUserCredits(userId, modelType) {
  try {
    const user = await findUserById(userId)
    if (!user) {
      return false
    }

    // Don't update credits for premium users
    if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing' || user.isPremium) {
      return true
    }

    // Increment used credits for free users
    const newUsedCredits = (user.usedCredits || 0) + 1

    await db.sql`
      UPDATE users 
      SET used_credits = ${newUsedCredits}, updated_at = NOW()
      WHERE id = ${userId}
    `

    console.log(`Updated credits for user ${userId}: used_credits = ${newUsedCredits}`)
    return true
  } catch (error) {
    console.error('Error updating user credits:', error)
    return false
  }
}