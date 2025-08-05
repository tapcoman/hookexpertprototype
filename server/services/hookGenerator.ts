import { HookObject, Platform, Objective, ContentType, HookCategory, PsychologicalDriver } from '../../shared/types.js'

// Enhanced hook taxonomy database based on the research
export const HOOK_TAXONOMY = {
  'question-based': [
    {
      id: 'QH-01',
      formula: 'Direct Question',
      primaryDriver: 'curiosity-gap',
      template: 'Did you know that {fact}?',
      examples: ['Did you know that 95% of people fail this simple test?'],
      riskFactor: 'low' as const,
      effectiveness: 0.75
    },
    {
      id: 'QH-02', 
      formula: 'Rhetorical Question',
      primaryDriver: 'pain-point',
      template: 'Does your {area} feel {negative_adjective}?',
      examples: ['Does your workout feel boring and repetitive?'],
      riskFactor: 'low' as const,
      effectiveness: 0.72
    },
    {
      id: 'QH-03',
      formula: 'Hypothetical What If',
      primaryDriver: 'curiosity-gap',
      template: 'What if {surprising_premise}?',
      examples: ['What if perfect form was actually easier?'],
      riskFactor: 'medium' as const,
      effectiveness: 0.78
    }
  ],
  'statement-based': [
    {
      id: 'ST-01',
      formula: 'Direct Promise',
      primaryDriver: 'value-hit',
      template: 'In this video, I am going to show you {specific_outcome}',
      examples: ['In this video, I am going to show you how to perfect your squat form'],
      riskFactor: 'low' as const,
      effectiveness: 0.73
    },
    {
      id: 'ST-02',
      formula: 'Startling Fact',
      primaryDriver: 'surprise-shock',
      template: '{percentage}% of people {common_problem}',
      examples: ['90% of people squat with poor form'],
      riskFactor: 'medium' as const,
      effectiveness: 0.80
    },
    {
      id: 'ST-03',
      formula: 'Contrarian Opinion',
      primaryDriver: 'social-proof',
      template: '{common_belief} is wrong. Here is why.',
      examples: ['Deep squats are wrong. Here is why.'],
      riskFactor: 'high' as const,
      effectiveness: 0.85
    }
  ],
  'narrative': [
    {
      id: 'NA-01',
      formula: 'In Medias Res',
      primaryDriver: 'curiosity-gap',
      template: 'Starts mid-action at point of high drama',
      examples: ['The moment my form clicked, everything changed...'],
      riskFactor: 'medium' as const,
      effectiveness: 0.82
    },
    {
      id: 'NA-02',
      formula: 'Personal Confession',
      primaryDriver: 'emotional-connection',
      template: 'I used to {struggle}, until {catalyst}',
      examples: ['I used to hate squats, until I learned this one thing'],
      riskFactor: 'low' as const,
      effectiveness: 0.76
    }
  ],
  'urgency-exclusivity': [
    {
      id: 'UE-01',
      formula: 'Direct Callout',
      primaryDriver: 'urgency-fomo',
      template: 'If you are a {target_audience}, you need to hear this',
      examples: ['If you squat regularly, you need to hear this'],
      riskFactor: 'medium' as const,
      effectiveness: 0.77
    },
    {
      id: 'UE-02',
      formula: 'Secret Reveal',
      primaryDriver: 'curiosity-gap',
      template: 'No one is telling you {hidden_truth}',
      examples: ['No one is telling you why squats feel awkward'],
      riskFactor: 'medium' as const,
      effectiveness: 0.83
    }
  ],
  'efficiency': [
    {
      id: 'EF-01',
      formula: 'Quick Solution',
      primaryDriver: 'value-hit',
      template: 'How to {achieve_goal} in {timeframe}',
      examples: ['How to perfect your squat form in 5 minutes'],
      riskFactor: 'low' as const,
      effectiveness: 0.74
    }
  ]
}

// Content type detection based on topic analysis
export function detectContentType(topic: string, objective: Objective): ContentType {
  const educationalKeywords = ['how to', 'guide', 'tutorial', 'learn', 'steps', 'tips', 'technique']
  const storytellingKeywords = ['story', 'experience', 'journey', 'transformation', 'happened', 'changed']
  
  const topicLower = topic.toLowerCase()
  
  const hasEducational = educationalKeywords.some(keyword => topicLower.includes(keyword))
  const hasStorytelling = storytellingKeywords.some(keyword => topicLower.includes(keyword))
  
  if (hasEducational && hasStorytelling) return 'mixed'
  if (hasEducational || objective === 'saves') return 'educational'
  if (hasStorytelling || objective === 'shares') return 'storytelling'
  
  return 'mixed'
}

// Select relevant hook categories based on content type and objective
export function selectHookCategories(contentType: ContentType, objective: Objective): HookCategory[] {
  const categoryMap: Record<ContentType, HookCategory[]> = {
    educational: ['statement-based', 'efficiency', 'question-based'],
    storytelling: ['narrative', 'question-based', 'urgency-exclusivity'],
    mixed: ['question-based', 'statement-based', 'narrative']
  }
  
  return categoryMap[contentType]
}

// Generate word count optimization score using Gaussian curve
export function calculateWordCountScore(wordCount: number, platform: Platform): number {
  const optimal: Record<Platform, { min: number; max: number; peak: number }> = {
    tiktok: { min: 8, max: 12, peak: 10 },
    instagram: { min: 6, max: 15, peak: 10 },
    youtube: { min: 4, max: 8, peak: 6 }
  }
  
  const config = optimal[platform]
  const variance = Math.pow((config.max - config.min) / 4, 2)
  const gaussianScore = Math.exp(-Math.pow(wordCount - config.peak, 2) / (2 * variance))
  
  return Math.max(0, Math.min(1, gaussianScore))
}

// Enhanced hook generation with tri-modal components
export async function generateTriModalHook(
  topic: string,
  platform: Platform,
  objective: Objective,
  category: HookCategory,
  userContext?: {
    company?: string
    industry?: string
    voice?: string
    audience?: string
  }
): Promise<HookObject> {
  // This is a simplified version - in production, this would call OpenAI
  const taxonomyItems = HOOK_TAXONOMY[category] || []
  const selectedFormula = taxonomyItems[Math.floor(Math.random() * taxonomyItems.length)]
  
  if (!selectedFormula) {
    throw new Error('No formulas available for category: ' + category)
  }
  
  // Generate mock hook components (in production, these would come from AI)
  const topicPreview = topic.length > 50 ? topic.substring(0, 50) + '...' : topic
  const verbalHook = selectedFormula.examples[0] + ' - ' + topicPreview
  const wordCount = verbalHook.split(' ').length
  
  const hookObject: HookObject = {
    verbalHook,
    visualHook: 'Visual: ' + (platform === 'tiktok' ? 'Fast-paced opening shot' : 'Compelling first frame'),
    textualHook: platform === 'instagram' ? 'WATCH THIS\!' : undefined,
    
    framework: selectedFormula.formula,
    psychologicalDriver: selectedFormula.primaryDriver as PsychologicalDriver,
    hookCategory: category,
    riskFactor: selectedFormula.riskFactor,
    
    score: calculateCompositeScore(wordCount, platform, selectedFormula.effectiveness),
    wordCount,
    scoreBreakdown: 'Word count optimization: ' + (calculateWordCountScore(wordCount, platform) * 100).toFixed(0) + '%, Framework effectiveness: ' + (selectedFormula.effectiveness * 100).toFixed(0) + '%',
    
    rationale: 'This ' + selectedFormula.formula.toLowerCase() + ' hook leverages ' + selectedFormula.primaryDriver.replace('-', ' ') + ' to capture attention',
    platformNotes: 'Optimized for ' + platform + ' with ' + objective + ' objective',
    contentTypeStrategy: selectedFormula.primaryDriver === 'value-hit' ? 'value_hit' : 'curiosity_gap',
    
    platformSpecific: {
      tiktokColdOpen: platform === 'tiktok' ? 'Start with dramatic action or bold statement' : undefined,
      instagramOverlay: platform === 'instagram' ? 'MUST WATCH' : undefined,
      youtubeProofCue: platform === 'youtube' ? 'Results shown at 0:30' : undefined,
    },
    
    promiseContentMatch: true,
    specificityScore: 0.8,
    freshnessScore: 0.75,
  }
  
  return hookObject
}

// Calculate composite score
function calculateCompositeScore(wordCount: number, platform: Platform, frameworkEffectiveness: number): number {
  const wordCountScore = calculateWordCountScore(wordCount, platform)
  const compositeScore = (wordCountScore * 0.3) + (frameworkEffectiveness * 0.7)
  return Math.min(5, Math.max(0, compositeScore * 5))
}

// Validate hook structure
export function validateHookStructure(hook: HookObject, platform: Platform): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  if (!hook.verbalHook?.trim()) {
    issues.push('Verbal hook is required')
  }
  
  if (hook.wordCount < 3) {
    issues.push('Hook is too short')
  }
  
  const maxWords: Record<Platform, number> = {
    tiktok: 15,
    instagram: 20,
    youtube: 12
  }
  
  if (hook.wordCount > maxWords[platform]) {
    issues.push('Hook exceeds ' + maxWords[platform] + ' words for ' + platform)
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}