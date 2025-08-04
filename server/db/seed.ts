import { config } from 'dotenv'
config() // Load environment variables

import { db } from './index.js'
import { hookFormulas, subscriptionPlans } from './schema.js'

// 24+ Psychological Hook Formulas from Research
export const hookFormulasData = [
  // ==================== QUESTION-BASED HOOKS ====================
  {
    code: 'QH-01',
    name: 'Direct Question',
    category: 'question-based',
    description: 'Opens with a direct, engaging question that immediately involves the viewer',
    structuralTemplate: '[Direct Question]? Here\'s [answer/solution]...',
    psychologicalTriggers: ['curiosity-gap', 'emotional-connection'],
    primaryDriver: 'curiosity-gap',
    effectivenessRating: 75,
    riskFactor: 'low',
    optimalNiches: ['education', 'how-to', 'advice', 'personal development'],
    exampleVariations: [
      'Have you ever wondered why some people succeed faster than others?',
      'What if I told you there\'s a simple trick that saves me 2 hours every day?',
      'Do you want to know the secret that changed everything for me?'
    ],
    usageGuidelines: 'Use questions that genuinely intrigue your target audience. Avoid obvious or rhetorical questions that feel forced.',
    cautionaryNotes: 'Overuse can feel manipulative. Ensure the question directly relates to valuable content.',
    avgEngagementRate: 68,
    avgConversionRate: 15,
    fatigueResistance: 85
  },
  {
    code: 'QH-02',
    name: 'Rhetorical Question',
    category: 'question-based',
    description: 'Uses thought-provoking rhetorical questions to create mental engagement',
    structuralTemplate: '[Rhetorical Question]? Of course not/you do. That\'s why [content]...',
    psychologicalTriggers: ['curiosity-gap', 'social-proof'],
    primaryDriver: 'curiosity-gap',
    effectivenessRating: 70,
    riskFactor: 'medium',
    optimalNiches: ['motivational', 'business', 'lifestyle', 'contrarian takes'],
    exampleVariations: [
      'Why do we always assume the hard way is the right way?',
      'When did "busy" become a badge of honor?',
      'What if everything you know about productivity is wrong?'
    ],
    usageGuidelines: 'Make questions thought-provoking and challenge common assumptions. Best for audience that enjoys intellectual engagement.',
    cautionaryNotes: 'Can feel pretentious if not authentic. Avoid overcomplex philosophical questions.',
    avgEngagementRate: 62,
    avgConversionRate: 12,
    fatigueResistance: 70
  },
  {
    code: 'QH-03',
    name: 'Hypothetical "What If"',
    category: 'question-based',
    description: 'Creates scenarios that make viewers imagine possibilities',
    structuralTemplate: 'What if [scenario]? Well, [explanation/story]...',
    psychologicalTriggers: ['curiosity-gap', 'value-hit'],
    primaryDriver: 'curiosity-gap',
    effectivenessRating: 78,
    riskFactor: 'low',
    optimalNiches: ['future-focused', 'technology', 'self-improvement', 'business strategy'],
    exampleVariations: [
      'What if you could automate 80% of your daily tasks?',
      'What if I told you the 1% use a completely different approach?',
      'What if there was a way to learn any skill in half the time?'
    ],
    usageGuidelines: 'Create believable but exciting scenarios. Connect the "what if" directly to your content value.',
    cautionaryNotes: 'Avoid unrealistic scenarios that damage credibility. Don\'t oversell the hypothetical.',
    avgEngagementRate: 74,
    avgConversionRate: 18,
    fatigueResistance: 75
  },
  {
    code: 'QH-04',
    name: 'High-Stakes Question',
    category: 'question-based',
    description: 'Poses questions with significant consequences or implications',
    structuralTemplate: 'What if [high-stakes consequence]? This [method/story] could [prevent/achieve] it...',
    psychologicalTriggers: ['urgency-fomo', 'pain-point'],
    primaryDriver: 'urgency-fomo',
    effectivenessRating: 82,
    riskFactor: 'high',
    optimalNiches: ['finance', 'health', 'career', 'relationships'],
    exampleVariations: [
      'What if your next career move determines your entire future?',
      'What if you\'re one decision away from changing everything?',
      'What if this mistake could cost you thousands?'
    ],
    usageGuidelines: 'Use when content genuinely addresses high-impact topics. Ensure authenticity and avoid fear-mongering.',
    cautionaryNotes: 'High risk of appearing manipulative. Must deliver substantial value to justify the strong opening.',
    avgEngagementRate: 85,
    avgConversionRate: 25,
    fatigueResistance: 45
  },

  // ==================== STATEMENT-BASED HOOKS ====================
  {
    code: 'ST-01',
    name: 'Direct Promise',
    category: 'statement-based',
    description: 'Makes a clear, valuable promise about what viewer will gain',
    structuralTemplate: 'I\'m going to show you [specific promise]. Here\'s how...',
    psychologicalTriggers: ['value-hit', 'authority-credibility'],
    primaryDriver: 'value-hit',
    effectivenessRating: 80,
    riskFactor: 'medium',
    optimalNiches: ['tutorials', 'education', 'skill-building', 'how-to'],
    exampleVariations: [
      'I\'m going to show you how to double your productivity in 30 days',
      'By the end of this video, you\'ll know exactly how to negotiate anything',
      'I\'ll teach you the framework that transformed my business'
    ],
    usageGuidelines: 'Be specific and deliverable. Your content must fulfill the promise completely.',
    cautionaryNotes: 'Overpromising destroys trust. Ensure you can deliver more value than promised.',
    avgEngagementRate: 71,
    avgConversionRate: 22,
    fatigueResistance: 80
  },
  {
    code: 'ST-02',
    name: 'Startling Fact',
    category: 'statement-based',
    description: 'Opens with surprising statistics or counterintuitive facts',
    structuralTemplate: '[Startling fact/statistic]. Here\'s what this means for you...',
    psychologicalTriggers: ['surprise-shock', 'curiosity-gap'],
    primaryDriver: 'surprise-shock',
    effectivenessRating: 76,
    riskFactor: 'low',
    optimalNiches: ['research-based', 'business', 'psychology', 'data-driven content'],
    exampleVariations: [
      '95% of people fail at their goals, but the 5% who succeed do this one thing differently',
      'Your phone checks you 144 times per day, and it\'s rewiring your brain',
      'Studies show that 73% of successful people wake up before 6 AM'
    ],
    usageGuidelines: 'Use verified, relevant statistics. Connect the fact directly to actionable insights.',
    cautionaryNotes: 'Verify all statistics. Avoid shock value without substance.',
    avgEngagementRate: 69,
    avgConversionRate: 16,
    fatigueResistance: 85
  },
  {
    code: 'ST-03',
    name: 'Contrarian Opinion',
    category: 'statement-based',
    description: 'Challenges conventional wisdom or popular beliefs',
    structuralTemplate: 'Everyone thinks [common belief], but [contrarian view]. Here\'s why...',
    psychologicalTriggers: ['surprise-shock', 'authority-credibility'],
    primaryDriver: 'surprise-shock',
    effectivenessRating: 73,
    riskFactor: 'high',
    optimalNiches: ['thought leadership', 'business strategy', 'personal development', 'controversial topics'],
    exampleVariations: [
      'Everyone says "follow your passion," but that\'s terrible advice',
      'The productivity gurus are wrong - being busy doesn\'t mean being productive',
      'Conventional networking is dead, and here\'s what actually works'
    ],
    usageGuidelines: 'Base contrarian views on solid evidence or experience. Be prepared to defend your position.',
    cautionaryNotes: 'High risk of alienating audience. Ensure contrarian view adds genuine value.',
    avgEngagementRate: 78,
    avgConversionRate: 14,
    fatigueResistance: 60
  },
  {
    code: 'ST-04',
    name: 'Common Mistake Identification',
    category: 'statement-based',
    description: 'Points out widespread errors people are making',
    structuralTemplate: 'Most people make this mistake when [activity]: [mistake]. Here\'s the right way...',
    psychologicalTriggers: ['pain-point', 'value-hit'],
    primaryDriver: 'pain-point',
    effectivenessRating: 77,
    riskFactor: 'low',
    optimalNiches: ['education', 'skill-building', 'problem-solving', 'improvement content'],
    exampleVariations: [
      'The biggest mistake people make when learning a new skill',
      '99% of entrepreneurs fail because they make this one error',
      'You\'re probably doing this wrong, and it\'s costing you money'
    ],
    usageGuidelines: 'Focus on genuinely common mistakes. Provide clear solutions, not just criticism.',
    cautionaryNotes: 'Avoid being condescending. Frame as helpful correction, not judgment.',
    avgEngagementRate: 72,
    avgConversionRate: 20,
    fatigueResistance: 75
  },

  // ==================== NARRATIVE HOOKS ====================
  {
    code: 'NA-01',
    name: 'In Medias Res',
    category: 'narrative',
    description: 'Starts in the middle of action or at a critical moment',
    structuralTemplate: '[Action/critical moment]. Let me explain how I got here...',
    psychologicalTriggers: ['curiosity-gap', 'emotional-connection'],
    primaryDriver: 'curiosity-gap',
    effectivenessRating: 81,
    riskFactor: 'medium',
    optimalNiches: ['storytelling', 'personal journey', 'transformation stories', 'case studies'],
    exampleVariations: [
      'I was standing in front of 500 people, completely terrified, when I realized...',
      'The moment I hit "send" on that email, I knew my life would change forever',
      'Three years ago, I was sleeping on my friend\'s couch. Today, I own three businesses'
    ],
    usageGuidelines: 'Choose genuinely dramatic or pivotal moments. Ensure the story has clear relevance to your message.',
    cautionaryNotes: 'Don\'t fabricate drama. The payoff must justify the dramatic opening.',
    avgEngagementRate: 83,
    avgConversionRate: 19,
    fatigueResistance: 70
  },
  {
    code: 'NA-02',
    name: 'Cliffhanger',
    category: 'narrative',
    description: 'Creates suspense by withholding key information',
    structuralTemplate: '[Setup with missing crucial element]. But first, let me tell you about...',
    psychologicalTriggers: ['curiosity-gap', 'urgency-fomo'],
    primaryDriver: 'curiosity-gap',
    effectivenessRating: 79,
    riskFactor: 'high',
    optimalNiches: ['storytelling', 'mystery elements', 'reveal content', 'transformation journeys'],
    exampleVariations: [
      'This one decision made me $100K in 6 months. But before I tell you what it was...',
      'She said three words that changed everything. But let me start from the beginning...',
      'The answer will surprise you, but first you need to understand...'
    ],
    usageGuidelines: 'The payoff must be worth the wait. Don\'t delay too long before delivering the promised information.',
    cautionaryNotes: 'High risk of viewer frustration if overused or if payoff disappoints.',
    avgEngagementRate: 85,
    avgConversionRate: 23,
    fatigueResistance: 40
  },
  {
    code: 'NA-03',
    name: 'Personal Confession',
    category: 'narrative',
    description: 'Shares vulnerable or unexpected personal truth',
    structuralTemplate: 'I have to confess something: [vulnerable truth]. And here\'s what it taught me...',
    psychologicalTriggers: ['emotional-connection', 'authenticity'],
    primaryDriver: 'emotional-connection',
    effectivenessRating: 74,
    riskFactor: 'medium',
    optimalNiches: ['personal development', 'authenticity content', 'life lessons', 'vulnerability'],
    exampleVariations: [
      'I have to admit, I was completely wrong about success',
      'Here\'s something I\'ve never told anyone about my business',
      'I used to be embarrassed about this, but now I realize it\'s my superpower'
    ],
    usageGuidelines: 'Share genuine vulnerabilities that connect to valuable lessons. Authenticity is crucial.',
    cautionaryNotes: 'Don\'t overshare inappropriate details. Ensure confession serves audience value, not just drama.',
    avgEngagementRate: 76,
    avgConversionRate: 17,
    fatigueResistance: 65
  },
  {
    code: 'NA-04',
    name: 'Before & After Teaser',
    category: 'narrative',
    description: 'Contrasts past and present to highlight transformation',
    structuralTemplate: '[Time period] ago, I was [before state]. Now I [after state]. Here\'s exactly what changed...',
    psychologicalTriggers: ['social-proof', 'value-hit'],
    primaryDriver: 'social-proof',
    effectivenessRating: 78,
    riskFactor: 'low',
    optimalNiches: ['transformation stories', 'success journeys', 'skill development', 'lifestyle changes'],
    exampleVariations: [
      'Two years ago, I was working 80-hour weeks for $50K. Now I work 30 hours and make $200K',
      'I used to struggle with public speaking. Last week, I gave a TEDx talk',
      'From 200 followers to 100K in 12 months - here\'s the exact strategy'
    ],
    usageGuidelines: 'Use genuine transformations with specific metrics. Focus on the process, not just the outcome.',
    cautionaryNotes: 'Avoid inflated claims. Ensure transformation is relevant and achievable for audience.',
    avgEngagementRate: 80,
    avgConversionRate: 21,
    fatigueResistance: 80
  },

  // ==================== URGENCY/EXCLUSIVITY HOOKS ====================
  {
    code: 'UE-01',
    name: 'Direct Callout',
    category: 'urgency-exclusivity',
    description: 'Directly addresses specific audience segment',
    structuralTemplate: 'If you\'re [specific audience], this is for you. Everyone else can skip...',
    psychologicalTriggers: ['social-proof', 'exclusivity'],
    primaryDriver: 'social-proof',
    effectivenessRating: 72,
    riskFactor: 'medium',
    optimalNiches: ['niche expertise', 'targeted advice', 'specific demographics', 'professional content'],
    exampleVariations: [
      'If you\'re tired of generic productivity advice, this one\'s for you',
      'Small business owners, pay attention - this could save your company',
      'Only watch this if you\'re serious about changing your life'
    ],
    usageGuidelines: 'Be specific about target audience. Ensure content genuinely serves that group better.',
    cautionaryNotes: 'Risk of excluding too many viewers. Balance specificity with broad appeal.',
    avgEngagementRate: 67,
    avgConversionRate: 24,
    fatigueResistance: 75
  },
  {
    code: 'UE-02',
    name: 'FOMO/Time Pressure',
    category: 'urgency-exclusivity',
    description: 'Creates urgency through time sensitivity or limited availability',
    structuralTemplate: '[Time-sensitive situation]. If you don\'t [action] soon/now/today, [consequence]...',
    psychologicalTriggers: ['urgency-fomo', 'pain-point'],
    primaryDriver: 'urgency-fomo',
    effectivenessRating: 84,
    riskFactor: 'high',
    optimalNiches: ['trend analysis', 'opportunity windows', 'market timing', 'deadline-driven content'],
    exampleVariations: [
      'This window of opportunity won\'t last long',
      'While everyone else is sleeping on this trend, smart people are acting now',
      'You have about 6 months before this becomes mainstream'
    ],
    usageGuidelines: 'Use genuine time sensitivity. Urgency must be authentic and relevant.',
    cautionaryNotes: 'High risk of appearing manipulative. Overuse destroys credibility.',
    avgEngagementRate: 88,
    avgConversionRate: 32,
    fatigueResistance: 30
  },
  {
    code: 'UE-03',
    name: 'Secret Reveal',
    category: 'urgency-exclusivity',
    description: 'Promises to share insider knowledge or hidden information',
    structuralTemplate: 'I\'m about to share [secret/insider info] that [authority figures] don\'t want you to know...',
    psychologicalTriggers: ['curiosity-gap', 'exclusivity'],
    primaryDriver: 'curiosity-gap',
    effectivenessRating: 75,
    riskFactor: 'high',
    optimalNiches: ['industry insights', 'behind-the-scenes', 'insider knowledge', 'contrarian approaches'],
    exampleVariations: [
      'I\'m about to reveal the strategy that top performers use but never talk about',
      'Here\'s what happens behind closed doors in successful companies',
      'The secret that influencers don\'t want you to discover'
    ],
    usageGuidelines: 'Ensure you actually have valuable insider knowledge. Don\'t oversell the "secret" nature.',
    cautionaryNotes: 'Risk of conspiracy theory vibes. Must deliver genuine insider value.',
    avgEngagementRate: 81,
    avgConversionRate: 20,
    fatigueResistance: 55
  },
  {
    code: 'UE-04',
    name: 'Warning/Preemptive',
    category: 'urgency-exclusivity',
    description: 'Warns about common mistakes or impending problems',
    structuralTemplate: 'Warning: [potential problem/mistake]. Here\'s how to avoid it...',
    psychologicalTriggers: ['pain-point', 'urgency-fomo'],
    primaryDriver: 'pain-point',
    effectivenessRating: 73,
    riskFactor: 'medium',
    optimalNiches: ['risk management', 'problem prevention', 'industry warnings', 'protective advice'],
    exampleVariations: [
      'Warning: This trend is about to destroy small businesses',
      'Stop doing this before it ruins your reputation',
      'Alert: Your competition is already using this against you'
    ],
    usageGuidelines: 'Base warnings on real risks. Provide actionable protection or solutions.',
    cautionaryNotes: 'Avoid fear-mongering without substance. Must offer genuine protective value.',
    avgEngagementRate: 74,
    avgConversionRate: 18,
    fatigueResistance: 70
  },

  // ==================== EFFICIENCY HOOKS ====================
  {
    code: 'EF-01',
    name: 'Numbered List',
    category: 'efficiency',
    description: 'Promises specific number of tips, steps, or strategies',
    structuralTemplate: '[Number] [tips/ways/steps] to [achieve outcome]. Here\'s #1...',
    psychologicalTriggers: ['value-hit', 'efficiency'],
    primaryDriver: 'value-hit',
    effectivenessRating: 68,
    riskFactor: 'low',
    optimalNiches: ['educational', 'how-to', 'productivity', 'list-based content'],
    exampleVariations: [
      '5 productivity hacks that actually work',
      '3 simple steps to double your income',
      '7 mistakes killing your social media growth'
    ],
    usageGuidelines: 'Choose optimal numbers (3, 5, 7 work well). Ensure each point delivers clear value.',
    cautionaryNotes: 'Overused format can feel generic. Make sure content justifies the list format.',
    avgEngagementRate: 64,
    avgConversionRate: 16,
    fatigueResistance: 90
  },
  {
    code: 'EF-02',
    name: 'Quick Solution/Hack',
    category: 'efficiency',
    description: 'Promises fast, efficient solution to common problem',
    structuralTemplate: 'Quick [solution/hack]: How to [achieve outcome] in [timeframe]...',
    psychologicalTriggers: ['efficiency', 'value-hit'],
    primaryDriver: 'efficiency',
    effectivenessRating: 71,
    riskFactor: 'medium',
    optimalNiches: ['productivity', 'life hacks', 'time-saving', 'efficiency content'],
    exampleVariations: [
      'Quick hack: Clean your inbox in 5 minutes',
      'Fast solution: Learn any skill 3x faster',
      'Simple trick that saves me 2 hours daily'
    ],
    usageGuidelines: 'Ensure solution is genuinely quick and effective. Avoid overselling the speed.',
    cautionaryNotes: 'Risk of oversimplifying complex topics. Must deliver on efficiency promise.',
    avgEngagementRate: 70,
    avgConversionRate: 19,
    fatigueResistance: 85
  },

  // ==================== ADDITIONAL ADVANCED FORMULAS ====================
  {
    code: 'AD-01',
    name: 'Paradox Presentation',
    category: 'statement-based',
    description: 'Presents seemingly contradictory but true statements',
    structuralTemplate: 'Here\'s the paradox: [contradictory statements]. Both are true, and here\'s why...',
    psychologicalTriggers: ['curiosity-gap', 'surprise-shock'],
    primaryDriver: 'curiosity-gap',
    effectivenessRating: 76,
    riskFactor: 'high',
    optimalNiches: ['philosophy', 'complex topics', 'thought leadership', 'counterintuitive insights'],
    exampleVariations: [
      'The paradox of success: To get what you want, stop wanting it',
      'Why working less often means earning more',
      'The confidence paradox: Act confident by admitting you don\'t know'
    ],
    usageGuidelines: 'Use genuine paradoxes with clear explanations. Complexity should lead to clarity.',
    cautionaryNotes: 'Risk of confusing audience. Ensure paradox resolution provides real value.',
    avgEngagementRate: 73,
    avgConversionRate: 15,
    fatigueResistance: 60
  },
  {
    code: 'AD-02',
    name: 'Pattern Interrupt',
    category: 'statement-based',
    description: 'Breaks expected patterns to capture attention',
    structuralTemplate: '[Unexpected statement/behavior]. Yes, you heard that right. Here\'s why...',
    psychologicalTriggers: ['surprise-shock', 'curiosity-gap'],
    primaryDriver: 'surprise-shock',
    effectivenessRating: 82,
    riskFactor: 'high',
    optimalNiches: ['contrarian content', 'attention-grabbing', 'disruptive ideas', 'unconventional approaches'],
    exampleVariations: [
      'I deleted all my social media and my business grew 300%',
      'I fired my best employee and saved my company',
      'I stopped trying to be productive and became 10x more effective'
    ],
    usageGuidelines: 'Use genuine pattern breaks with solid reasoning. Shock value must serve deeper purpose.',
    cautionaryNotes: 'High risk of seeming gimmicky. Pattern break must connect to meaningful content.',
    avgEngagementRate: 87,
    avgConversionRate: 21,
    fatigueResistance: 35
  },
  {
    code: 'AD-03',
    name: 'Authority Challenge',
    category: 'statement-based',
    description: 'Questions or challenges established authorities or conventional wisdom',
    structuralTemplate: '[Authority figure/conventional wisdom] says [belief], but they\'re missing [key point]...',
    psychologicalTriggers: ['authority-credibility', 'surprise-shock'],
    primaryDriver: 'authority-credibility',
    effectivenessRating: 74,
    riskFactor: 'high',
    optimalNiches: ['thought leadership', 'industry disruption', 'contrarian views', 'expert commentary'],
    exampleVariations: [
      'Harvard Business School teaches this, but they\'re wrong about one crucial thing',
      'Every productivity guru preaches this method, but it\'s actually counterproductive',
      'The experts all agree on this approach, but I\'ve found something better'
    ],
    usageGuidelines: 'Base challenges on solid evidence or experience. Respect while disagreeing.',
    cautionaryNotes: 'Risk of appearing arrogant. Must provide substantial evidence for challenges.',
    avgEngagementRate: 79,
    avgConversionRate: 17,
    fatigueResistance: 50
  },
  {
    code: 'AD-04',
    name: 'Micro-Story Hook',
    category: 'narrative',
    description: 'Short, punchy story that illustrates a key point',
    structuralTemplate: '[Brief story setup]. [Quick resolution]. That taught me [lesson/principle]...',
    psychologicalTriggers: ['emotional-connection', 'social-proof'],
    primaryDriver: 'emotional-connection',
    effectivenessRating: 77,
    riskFactor: 'low',
    optimalNiches: ['storytelling', 'life lessons', 'business anecdotes', 'relatable content'],
    exampleVariations: [
      'A taxi driver once told me something that changed how I think about money',
      'My 6-year-old daughter asked a question that revolutionized my business',
      'I overheard a conversation at Starbucks that taught me about success'
    ],
    usageGuidelines: 'Keep stories brief but impactful. Ensure clear connection to main message.',
    cautionaryNotes: 'Don\'t fabricate stories. Authenticity is crucial for emotional connection.',
    avgEngagementRate: 75,
    avgConversionRate: 18,
    fatigueResistance: 80
  },
  {
    code: 'AD-05',
    name: 'Future Prediction',
    category: 'urgency-exclusivity',
    description: 'Makes predictions about future trends or changes',
    structuralTemplate: 'In [timeframe], [prediction]. Here\'s how to prepare/capitalize...',
    psychologicalTriggers: ['urgency-fomo', 'authority-credibility'],
    primaryDriver: 'urgency-fomo',
    effectivenessRating: 78,
    riskFactor: 'high',
    optimalNiches: ['trend analysis', 'future planning', 'investment advice', 'industry insights'],
    exampleVariations: [
      'In 5 years, remote work will completely reshape the economy',
      'AI will eliminate 40% of jobs by 2030 - here\'s how to prepare',
      'The next economic shift is coming, and most people aren\'t ready'
    ],
    usageGuidelines: 'Base predictions on solid trends and data. Focus on actionable preparation.',
    cautionaryNotes: 'High risk if predictions fail. Avoid specific dates unless very confident.',
    avgEngagementRate: 81,
    avgConversionRate: 22,
    fatigueResistance: 45
  },
  {
    code: 'AD-06',
    name: 'Social Proof Stack',
    category: 'statement-based',
    description: 'Combines multiple forms of social proof for credibility',
    structuralTemplate: '[Number] [type of people] do [behavior]. Here\'s why, and how you can too...',
    psychologicalTriggers: ['social-proof', 'authority-credibility'],
    primaryDriver: 'social-proof',
    effectivenessRating: 75,
    riskFactor: 'low',
    optimalNiches: ['behavior change', 'social trends', 'adoption strategies', 'mainstream appeal'],
    exampleVariations: [
      '73% of Fortune 500 CEOs have this one habit in common',
      'The most successful people I know all do this daily ritual',
      'Every millionaire I\'ve met shares this unexpected trait'
    ],
    usageGuidelines: 'Use verifiable social proof with relevant authority figures. Connect to audience aspirations.',
    cautionaryNotes: 'Verify all statistics and claims. Avoid fabricated social proof.',
    avgEngagementRate: 72,
    avgConversionRate: 20,
    fatigueResistance: 85
  }
]

// Subscription Plans Data - Updated with proper credit limits as per requirements
export const subscriptionPlansData = [
  {
    stripePriceId: 'price_free_plan', // Will be updated after running setup:stripe-plans
    stripeProductId: 'prod_free_plan', // Will be updated after running setup:stripe-plans
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for getting started with AI hook generation',
    price: 0,
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    proGenerationsLimit: 0, // No pro generations on free plan
    draftGenerationsLimit: 10, // 10 hooks/month on free plan
    teamSeats: 1,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    trialPeriodDays: 0,
    isActive: true,
    isPopular: false,
  },
  {
    stripePriceId: 'price_starter_monthly', // Will be updated after running setup:stripe-plans
    stripeProductId: 'prod_starter_plan', // Will be updated after running setup:stripe-plans
    name: 'starter',
    displayName: 'Starter',
    description: 'Great for content creators and small businesses',
    price: 900, // $9.00
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    proGenerationsLimit: 100, // 100 hooks/month
    draftGenerationsLimit: null, // unlimited draft generations
    teamSeats: 1,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    trialPeriodDays: 7,
    isActive: true,
    isPopular: false,
  },
  {
    stripePriceId: 'price_creator_monthly', // Will be updated after running setup:stripe-plans
    stripeProductId: 'prod_creator_plan', // Will be updated after running setup:stripe-plans
    name: 'creator',
    displayName: 'Creator',
    description: 'Most popular - Perfect for serious content creators',
    price: 1500, // $15.00
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    proGenerationsLimit: 300, // 300 hooks/month
    draftGenerationsLimit: null, // unlimited draft generations
    teamSeats: 1,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    trialPeriodDays: 7,
    isActive: true,
    isPopular: true,
  },
  {
    stripePriceId: 'price_pro_monthly', // Will be updated after running setup:stripe-plans
    stripeProductId: 'prod_pro_plan', // Will be updated after running setup:stripe-plans
    name: 'pro',
    displayName: 'Pro',
    description: 'Advanced features for power users and agencies',
    price: 2400, // $24.00
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    proGenerationsLimit: 1000, // 1000 hooks/month
    draftGenerationsLimit: null, // unlimited draft generations
    teamSeats: 1,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: false,
    trialPeriodDays: 7,
    isActive: true,
    isPopular: false,
  },
  {
    stripePriceId: 'price_teams_monthly', // Will be updated after running setup:stripe-plans
    stripeProductId: 'prod_teams_plan', // Will be updated after running setup:stripe-plans
    name: 'teams',
    displayName: 'Teams',
    description: 'Perfect for teams and agencies with collaboration features',
    price: 5900, // $59.00
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    proGenerationsLimit: null, // Unlimited hooks for teams plan
    draftGenerationsLimit: null, // unlimited draft generations
    teamSeats: 3,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    trialPeriodDays: 7,
    isActive: true,
    isPopular: false,
  },
]

export async function seedHookFormulas() {
  try {
    console.log('Starting hook formulas seeding...')
    
    // Clear existing formulas
    await db.delete(hookFormulas)
    console.log('Cleared existing hook formulas')
    
    // Insert new formulas
    const inserted = await db.insert(hookFormulas).values(hookFormulasData).returning()
    
    console.log(`Successfully seeded ${inserted.length} hook formulas:`)
    inserted.forEach(formula => {
      console.log(`- ${formula.code}: ${formula.name} (${formula.category})`)
    })
    
    return inserted
  } catch (error) {
    console.error('Error seeding hook formulas:', error)
    throw error
  }
}

export async function seedSubscriptionPlans() {
  try {
    console.log('Starting subscription plans seeding...')
    
    // Clear existing plans
    await db.delete(subscriptionPlans)
    console.log('Cleared existing subscription plans')
    
    // Insert new plans
    const inserted = await db.insert(subscriptionPlans).values(subscriptionPlansData).returning()
    
    console.log(`Successfully seeded ${inserted.length} subscription plans:`)
    inserted.forEach(plan => {
      console.log(`- ${plan.name}: ${plan.displayName} ($${plan.price/100}/month)`)
    })
    
    return inserted
  } catch (error) {
    console.error('Error seeding subscription plans:', error)
    throw error
  }
}

export async function seedDatabase() {
  try {
    console.log('Starting complete database seeding...')
    
    await seedHookFormulas()
    await seedSubscriptionPlans()
    
    console.log('Database seeding completed successfully!')
  } catch (error) {
    console.error('Database seeding failed:', error)
    throw error
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log('Seeding completed')
    process.exit(0)
  }).catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
}