import { 
  pgTable, 
  varchar, 
  text, 
  boolean, 
  integer, 
  timestamp, 
  jsonb, 
  index 
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ==================== USERS TABLE ====================

export const users = pgTable('users', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').notNull().unique(),
  password: text('password'), // bcrypt hashed password for email/password auth
  firebaseUid: varchar('firebase_uid').unique(), // Keep for migration compatibility
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  emailVerified: boolean('email_verified').default(false),
  
  // Profile Information
  company: text('company'),
  industry: text('industry'),
  role: text('role'),
  audience: text('audience'),
  voice: text('voice'),
  bannedTerms: jsonb('banned_terms').default([]),
  safety: text('safety').default('standard'),
  
  // Enhanced Psychological Preferences
  preferredHookCategories: jsonb('preferred_hook_categories').default([]),
  psychologicalRiskTolerance: varchar('psychological_risk_tolerance').default('medium'),
  creativityPreference: varchar('creativity_preference').default('balanced'),
  urgencyPreference: varchar('urgency_preference').default('moderate'),
  personalityInsights: jsonb('personality_insights').default({}),
  
  // Credit System
  proGenerationsUsed: integer('pro_generations_used').default(0),
  draftGenerationsUsed: integer('draft_generations_used').default(0),
  weeklyDraftReset: timestamp('weekly_draft_reset').default(sql`NOW()`),
  freeCredits: integer('free_credits').default(5),
  usedCredits: integer('used_credits').default(0),
  isPremium: boolean('is_premium').default(false),
  
  // Subscription Data
  stripeCustomerId: varchar('stripe_customer_id'),
  stripeSubscriptionId: varchar('stripe_subscription_id'),
  subscriptionStatus: varchar('subscription_status').default('free'),
  subscriptionPlan: varchar('subscription_plan').default('free'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    emailIdx: index('users_email_idx').on(table.email),
    firebaseUidIdx: index('users_firebase_uid_idx').on(table.firebaseUid),
    subscriptionStatusIdx: index('users_subscription_status_idx').on(table.subscriptionStatus),
  }
})

// ==================== PROJECTS TABLE ====================

export const projects = pgTable('projects', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Project Details
  name: varchar('name').notNull(),
  description: text('description'),
  color: varchar('color').default('#6366f1'),
  emoji: varchar('emoji').default('📁'),
  
  // Statistics
  hookCount: integer('hook_count').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('projects_user_id_idx').on(table.userId),
    updatedAtIdx: index('projects_updated_at_idx').on(table.updatedAt),
  }
})

// ==================== HOOK GENERATIONS TABLE ====================

export const hookGenerations = pgTable('hook_generations', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // tiktok, instagram, youtube
  objective: text('objective').notNull(), // watch_time, shares, saves, ctr
  topic: text('topic').notNull(),
  modelType: text('model_type').notNull().default('gpt-4o-mini'),
  
  // Tri-modal hook data (stored as JSONB)
  hooks: jsonb('hooks').notNull(), // Array of HookObject
  topThreeVariants: jsonb('top_three_variants'), // Enhanced top performers
  
  // Psychological framework integration
  usedFormulas: jsonb('used_formulas').default([]), // Array of formula codes used
  psychologicalStrategy: jsonb('psychological_strategy').default({}), // Strategy metadata
  adaptationLevel: integer('adaptation_level').default(0), // 0-100, personalization level
  confidenceScore: integer('confidence_score').default(75), // 0-100, AI confidence
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('hook_generations_user_id_idx').on(table.userId),
    createdAtIdx: index('hook_generations_created_at_idx').on(table.createdAt),
    platformIdx: index('hook_generations_platform_idx').on(table.platform),
  }
})

// ==================== FAVORITE HOOKS TABLE ====================

export const favoriteHooks = pgTable('favorite_hooks', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  generationId: varchar('generation_id').references(() => hookGenerations.id, { onDelete: 'set null' }),
  
  // Legacy support
  hook: text('hook'),
  
  // Enhanced tri-modal data
  hookData: jsonb('hook_data'), // Full HookObject
  framework: text('framework').notNull(),
  platformNotes: text('platform_notes').notNull(),
  topic: text('topic'),
  platform: text('platform'),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('favorite_hooks_user_id_idx').on(table.userId),
    createdAtIdx: index('favorite_hooks_created_at_idx').on(table.createdAt),
  }
})

// ==================== HOOK FORMULAS TABLE ====================

export const hookFormulas = pgTable('hook_formulas', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  code: varchar('code').notNull().unique(), // QH-01, ST-01, etc.
  name: varchar('name').notNull(),
  category: varchar('category').notNull(), // question-based, statement-based, etc.
  description: text('description').notNull(),
  structuralTemplate: text('structural_template').notNull(),
  psychologicalTriggers: jsonb('psychological_triggers').notNull(), // array of triggers
  primaryDriver: varchar('primary_driver').notNull(),
  effectivenessRating: integer('effectiveness_rating').notNull(), // 0-100
  riskFactor: varchar('risk_factor').notNull(), // low, medium, high
  optimalNiches: jsonb('optimal_niches').notNull(), // array of optimal use cases
  exampleVariations: jsonb('example_variations').notNull(), // array of examples
  usageGuidelines: text('usage_guidelines'),
  cautionaryNotes: text('cautionary_notes'),
  
  // Performance metrics
  avgEngagementRate: integer('avg_engagement_rate').default(0), // 0-100
  avgConversionRate: integer('avg_conversion_rate').default(0), // 0-100
  fatigueResistance: integer('fatigue_resistance').default(50), // 0-100
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    codeIdx: index('hook_formulas_code_idx').on(table.code),
    categoryIdx: index('hook_formulas_category_idx').on(table.category),
    primaryDriverIdx: index('hook_formulas_primary_driver_idx').on(table.primaryDriver),
    effectivenessIdx: index('hook_formulas_effectiveness_idx').on(table.effectivenessRating),
    activeIdx: index('hook_formulas_active_idx').on(table.isActive),
  }
})

// ==================== PSYCHOLOGICAL PROFILES TABLE ====================

export const psychologicalProfiles = pgTable('psychological_profiles', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Psychological preferences
  preferredTriggers: jsonb('preferred_triggers').default([]), // array of psychological drivers
  avoidedTriggers: jsonb('avoided_triggers').default([]), // array of psychological drivers to avoid
  riskTolerance: varchar('risk_tolerance').default('medium'), // low, medium, high
  creativityLevel: varchar('creativity_level').default('balanced'), // conservative, balanced, experimental
  
  // Performance-based learning
  successfulFormulas: jsonb('successful_formulas').default([]), // array of formula codes
  underperformingFormulas: jsonb('underperforming_formulas').default([]), // array of formula codes
  personalityType: varchar('personality_type'), // for future MBTI/Big5 integration
  
  // Hook generation preferences
  preferredCategories: jsonb('preferred_categories').default([]), // array of hook categories
  contentStyle: varchar('content_style').default('mixed'), // educational, entertainment, mixed
  urgencyPreference: varchar('urgency_preference').default('moderate'), // low, moderate, high
  
  // Learning and adaptation
  learningRate: integer('learning_rate').default(50), // 0-100, how quickly to adapt
  lastUpdated: timestamp('last_updated').default(sql`NOW()`),
  profileCompleteness: integer('profile_completeness').default(0), // 0-100
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('psychological_profiles_user_id_idx').on(table.userId),
    riskToleranceIdx: index('psychological_profiles_risk_tolerance_idx').on(table.riskTolerance),
    updatedAtIdx: index('psychological_profiles_updated_at_idx').on(table.updatedAt),
  }
})

// ==================== HOOK PERFORMANCE ANALYTICS TABLE ====================

export const hookPerformanceAnalytics = pgTable('hook_performance_analytics', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  generationId: varchar('generation_id').references(() => hookGenerations.id, { onDelete: 'set null' }),
  hookIndex: integer('hook_index').notNull(), // index within the generation
  formulaCode: varchar('formula_code').references(() => hookFormulas.code),
  
  // Performance metrics
  platform: varchar('platform').notNull(),
  objective: varchar('objective').notNull(),
  
  // User feedback
  userRating: integer('user_rating'), // 1-5 stars
  wasUsed: boolean('was_used').default(false),
  wasFavorited: boolean('was_favorited').default(false),
  wasShared: boolean('was_shared').default(false),
  
  // Actual performance (if provided by user)
  actualViews: integer('actual_views'),
  actualEngagement: integer('actual_engagement'),
  actualConversions: integer('actual_conversions'),
  performanceNotes: text('performance_notes'),
  
  // Analysis metadata
  confidenceScore: integer('confidence_score').default(50), // 0-100
  contextTags: jsonb('context_tags').default([]), // array of context descriptors
  
  recordedAt: timestamp('recorded_at').default(sql`NOW()`),
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('hook_performance_user_id_idx').on(table.userId),
    generationIdIdx: index('hook_performance_generation_id_idx').on(table.generationId),
    formulaCodeIdx: index('hook_performance_formula_code_idx').on(table.formulaCode),
    platformIdx: index('hook_performance_platform_idx').on(table.platform),
    recordedAtIdx: index('hook_performance_recorded_at_idx').on(table.recordedAt),
    ratingIdx: index('hook_performance_rating_idx').on(table.userRating),
  }
})

// ==================== AB TEST RESULTS TABLE ====================

export const abTestResults = pgTable('ab_test_results', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar('test_id').notNull().references(() => abTests.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'set null' }),
  participantId: varchar('participant_id').references(() => abTestParticipants.id),
  
  // Test configuration
  variant: varchar('variant').notNull(),
  formulaCodeA: varchar('formula_code_a').references(() => hookFormulas.code),
  formulaCodeB: varchar('formula_code_b').references(() => hookFormulas.code),
  
  // Results
  selectedVariant: varchar('selected_variant'), // A or B
  engagementScore: integer('engagement_score'), // 0-100
  conversionScore: integer('conversion_score'), // 0-100
  userPreference: varchar('user_preference'), // A, B, or neither
  
  // Context
  platform: varchar('platform').notNull(),
  objective: varchar('objective').notNull(),
  topic: text('topic'),
  contextData: jsonb('context_data').default({}),
  
  // Statistical significance
  confidenceLevel: integer('confidence_level'), // 0-100
  sampleSize: integer('sample_size').default(1),
  
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    testIdIdx: index('ab_test_results_test_id_idx').on(table.testId),
    userIdIdx: index('ab_test_results_user_id_idx').on(table.userId),
    variantIdx: index('ab_test_results_variant_idx').on(table.variant),
    completedAtIdx: index('ab_test_results_completed_at_idx').on(table.completedAt),
  }
})

// ==================== HOOK TREND TRACKING TABLE ====================

export const hookTrendTracking = pgTable('hook_trend_tracking', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  formulaCode: varchar('formula_code').notNull().references(() => hookFormulas.code),
  platform: varchar('platform').notNull(),
  
  // Trend metrics
  weeklyUsage: integer('weekly_usage').default(0),
  monthlyUsage: integer('monthly_usage').default(0),
  avgPerformanceScore: integer('avg_performance_score').default(0), // 0-100
  trendDirection: varchar('trend_direction').default('stable'), // rising, falling, stable
  
  // Fatigue indicators
  fatigueLevel: integer('fatigue_level').default(0), // 0-100
  lastHighPerformance: timestamp('last_high_performance'),
  consecutiveLowPerformance: integer('consecutive_low_performance').default(0),
  
  // Seasonality and context
  seasonalityPattern: jsonb('seasonality_pattern').default({}),
  optimalTimeframes: jsonb('optimal_timeframes').default([]),
  contextFactors: jsonb('context_factors').default({}),
  
  // Recommendations
  recommendationStatus: varchar('recommendation_status').default('active'), // active, caution, avoid
  alternativeFormulas: jsonb('alternative_formulas').default([]), // suggested alternatives
  
  // Data freshness
  lastCalculated: timestamp('last_calculated').default(sql`NOW()`),
  dataPoints: integer('data_points').default(0),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    formulaCodeIdx: index('hook_trend_formula_code_idx').on(table.formulaCode),
    platformIdx: index('hook_trend_platform_idx').on(table.platform),
    trendDirectionIdx: index('hook_trend_direction_idx').on(table.trendDirection),
    fatigueIdx: index('hook_trend_fatigue_idx').on(table.fatigueLevel),
    recommendationIdx: index('hook_trend_recommendation_idx').on(table.recommendationStatus),
    calculatedIdx: index('hook_trend_calculated_idx').on(table.lastCalculated),
  }
})

// ==================== ANALYTICS TABLES ====================

export const analyticsEvents = pgTable('analytics_events', {
  id: varchar('id').primaryKey(),
  sessionId: varchar('session_id').notNull(),
  userId: varchar('user_id').references(() => users.id),
  eventType: varchar('event_type').notNull(),
  eventData: jsonb('event_data').notNull().default({}),
  deviceInfo: jsonb('device_info').notNull(),
  pageInfo: jsonb('page_info').notNull(),
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    sessionIdIdx: index('analytics_events_session_id_idx').on(table.sessionId),
    eventTypeIdx: index('analytics_events_event_type_idx').on(table.eventType),
    createdAtIdx: index('analytics_events_created_at_idx').on(table.createdAt),
  }
})

export const abTests = pgTable('ab_tests', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name').notNull(),
  description: text('description'),
  variants: jsonb('variants').notNull(), // array of variant configs
  trafficAllocation: jsonb('traffic_allocation').notNull(), // percentage per variant
  targetingRules: jsonb('targeting_rules'), // user segments, geo, device
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
})

export const abTestParticipants = pgTable('ab_test_participants', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar('test_id').notNull().references(() => abTests.id),
  userId: varchar('user_id').references(() => users.id),
  sessionId: varchar('session_id'),
  variant: varchar('variant').notNull(),
  assignedAt: timestamp('assigned_at').default(sql`NOW()`),
}, (table) => {
  return {
    testIdIdx: index('ab_test_participants_test_id_idx').on(table.testId),
    userIdIdx: index('ab_test_participants_user_id_idx').on(table.userId),
  }
})

export const conversionFunnels = pgTable('conversion_funnels', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name').notNull(),
  description: text('description'),
  steps: jsonb('steps').notNull(), // array of step definitions
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
})

export const funnelEvents = pgTable('funnel_events', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  funnelId: varchar('funnel_id').notNull().references(() => conversionFunnels.id),
  userId: varchar('user_id').references(() => users.id),
  sessionId: varchar('session_id').notNull(),
  stepIndex: integer('step_index').notNull(),
  stepName: varchar('step_name').notNull(),
  eventData: jsonb('event_data').default({}),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    funnelIdIdx: index('funnel_events_funnel_id_idx').on(table.funnelId),
    sessionIdIdx: index('funnel_events_session_id_idx').on(table.sessionId),
  }
})

export const userConsent = pgTable('user_consent', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id),
  sessionId: varchar('session_id'),
  consentType: varchar('consent_type').notNull(), // analytics, marketing, etc.
  consented: boolean('consented').notNull(),
  consentData: jsonb('consent_data'), // details about consent
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('user_consent_user_id_idx').on(table.userId),
    consentTypeIdx: index('user_consent_consent_type_idx').on(table.consentType),
  }
})

// ==================== PERFORMANCE MONITORING TABLES ====================

export const systemMetrics = pgTable('system_metrics', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  metricType: varchar('metric_type').notNull(), // api_response, db_query, memory, cpu
  metricName: varchar('metric_name').notNull(),
  value: integer('value').notNull(), // milliseconds for timing, percentage for usage
  metadata: jsonb('metadata').default({}),
  timestamp: timestamp('timestamp').default(sql`NOW()`),
}, (table) => {
  return {
    metricTypeIdx: index('system_metrics_metric_type_idx').on(table.metricType),
    timestampIdx: index('system_metrics_timestamp_idx').on(table.timestamp),
  }
})

export const webVitals = pgTable('web_vitals', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar('session_id').notNull(),
  userId: varchar('user_id').references(() => users.id),
  
  // Core Web Vitals
  lcp: integer('lcp'), // Largest Contentful Paint (ms)
  fid: integer('fid'), // First Input Delay (ms)
  cls: integer('cls'), // Cumulative Layout Shift (score * 1000)
  fcp: integer('fcp'), // First Contentful Paint (ms)
  ttfb: integer('ttfb'), // Time to First Byte (ms)
  
  // Device and connection info
  deviceType: varchar('device_type').notNull(), // mobile, desktop, tablet
  connectionType: varchar('connection_type'), // 4g, 3g, wifi, slow-2g
  userAgent: text('user_agent'),
  
  // Page context
  pathname: varchar('pathname').notNull(),
  referrer: varchar('referrer'),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    sessionIdIdx: index('web_vitals_session_id_idx').on(table.sessionId),
    pathnameIdx: index('web_vitals_pathname_idx').on(table.pathname),
    timestampIdx: index('web_vitals_timestamp_idx').on(table.createdAt),
  }
})

export const errorTracking = pgTable('error_tracking', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar('session_id'),
  userId: varchar('user_id').references(() => users.id),
  
  // Error details
  errorType: varchar('error_type').notNull(), // js_error, api_error, network_error
  errorMessage: text('error_message').notNull(),
  errorStack: text('error_stack'),
  errorCode: varchar('error_code'),
  
  // Context
  url: text('url').notNull(),
  userAgent: text('user_agent'),
  deviceInfo: jsonb('device_info').default({}),
  additionalContext: jsonb('additional_context').default({}),
  
  // Resolution tracking
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    errorTypeIdx: index('error_tracking_error_type_idx').on(table.errorType),
    timestampIdx: index('error_tracking_timestamp_idx').on(table.createdAt),
    resolvedIdx: index('error_tracking_resolved_idx').on(table.isResolved),
  }
})

export const businessIntelligence = pgTable('business_intelligence', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar('metric_name').notNull(),
  metricValue: integer('metric_value').notNull(),
  metricType: varchar('metric_type').notNull(), // revenue, usage, conversion
  dimension: varchar('dimension'), // plan_type, platform, user_segment
  dimensionValue: varchar('dimension_value'),
  
  // Time periods
  periodType: varchar('period_type').notNull(), // daily, weekly, monthly
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  
  calculatedAt: timestamp('calculated_at').default(sql`NOW()`),
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    metricNameIdx: index('business_intelligence_metric_name_idx').on(table.metricName),
    periodIdx: index('business_intelligence_period_idx').on(table.periodStart, table.periodEnd),
    dimensionIdx: index('business_intelligence_dimension_idx').on(table.dimension, table.dimensionValue),
  }
})

export const userJourneyTracking = pgTable('user_journey_tracking', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar('session_id').notNull(),
  userId: varchar('user_id').references(() => users.id),
  
  // Journey stage
  stage: varchar('stage').notNull(), // landing, signup, onboarding, first_generation, subscription
  step: varchar('step').notNull(), // specific step within stage
  action: varchar('action').notNull(), // viewed, clicked, completed, abandoned
  
  // Context
  fromStage: varchar('from_stage'),
  fromStep: varchar('from_step'),
  duration: integer('duration'), // time spent in step (seconds)
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    sessionIdIdx: index('user_journey_session_id_idx').on(table.sessionId),
    stageIdx: index('user_journey_stage_idx').on(table.stage),
    timestampIdx: index('user_journey_timestamp_idx').on(table.createdAt),
  }
})

export const apiUsageTracking = pgTable('api_usage_tracking', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id),
  
  // API details
  endpoint: varchar('endpoint').notNull(),
  method: varchar('method').notNull(),
  statusCode: integer('status_code').notNull(),
  responseTime: integer('response_time').notNull(), // milliseconds
  
  // Request details
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address'),
  requestSize: integer('request_size'), // bytes
  responseSize: integer('response_size'), // bytes
  
  // AI service usage (for OpenAI API calls)
  aiService: varchar('ai_service'), // openai, anthropic, etc.
  aiModel: varchar('ai_model'), // gpt-4o-mini, etc.
  aiTokensUsed: integer('ai_tokens_used'),
  aiCost: integer('ai_cost'), // in cents
  
  // Error details (if any)
  errorType: varchar('error_type'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    endpointIdx: index('api_usage_endpoint_idx').on(table.endpoint),
    timestampIdx: index('api_usage_timestamp_idx').on(table.createdAt),
    statusCodeIdx: index('api_usage_status_code_idx').on(table.statusCode),
  }
})

// ==================== TYPE EXPORTS ====================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type HookGeneration = typeof hookGenerations.$inferSelect
export type NewHookGeneration = typeof hookGenerations.$inferInsert

export type FavoriteHook = typeof favoriteHooks.$inferSelect
export type NewFavoriteHook = typeof favoriteHooks.$inferInsert

export type HookFormula = typeof hookFormulas.$inferSelect
export type NewHookFormula = typeof hookFormulas.$inferInsert

export type PsychologicalProfile = typeof psychologicalProfiles.$inferSelect
export type NewPsychologicalProfile = typeof psychologicalProfiles.$inferInsert

export type HookPerformanceAnalytics = typeof hookPerformanceAnalytics.$inferSelect
export type NewHookPerformanceAnalytics = typeof hookPerformanceAnalytics.$inferInsert

export type AbTestResult = typeof abTestResults.$inferSelect
export type NewAbTestResult = typeof abTestResults.$inferInsert

export type HookTrendTracking = typeof hookTrendTracking.$inferSelect
export type NewHookTrendTracking = typeof hookTrendTracking.$inferInsert

export type AnalyticsEventDB = typeof analyticsEvents.$inferSelect
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert

export type SystemMetric = typeof systemMetrics.$inferSelect
export type NewSystemMetric = typeof systemMetrics.$inferInsert

export type WebVital = typeof webVitals.$inferSelect
export type NewWebVital = typeof webVitals.$inferInsert

export type ErrorTracking = typeof errorTracking.$inferSelect
export type NewErrorTracking = typeof errorTracking.$inferInsert

export type BusinessIntelligence = typeof businessIntelligence.$inferSelect
export type NewBusinessIntelligence = typeof businessIntelligence.$inferInsert

export type UserJourneyTracking = typeof userJourneyTracking.$inferSelect
export type NewUserJourneyTracking = typeof userJourneyTracking.$inferInsert

export type ApiUsageTracking = typeof apiUsageTracking.$inferSelect
export type NewApiUsageTracking = typeof apiUsageTracking.$inferInsert

// ==================== STRIPE PAYMENT TABLES ====================

export const subscriptionPlans = pgTable('subscription_plans', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  stripePriceId: varchar('stripe_price_id').notNull().unique(),
  stripeProductId: varchar('stripe_product_id').notNull(),
  name: varchar('name').notNull(), // Free, Starter, Creator, Pro, Teams
  displayName: varchar('display_name').notNull(),
  description: text('description'),
  
  // Pricing
  price: integer('price').notNull(), // in cents
  currency: varchar('currency').default('usd'),
  interval: varchar('interval').notNull(), // month, year
  intervalCount: integer('interval_count').default(1),
  
  // Features
  proGenerationsLimit: integer('pro_generations_limit'), // null = unlimited
  draftGenerationsLimit: integer('draft_generations_limit'), // null = unlimited
  teamSeats: integer('team_seats').default(1),
  hasAdvancedAnalytics: boolean('has_advanced_analytics').default(false),
  hasPrioritySupport: boolean('has_priority_support').default(false),
  
  // Trial
  trialPeriodDays: integer('trial_period_days').default(0),
  
  // Status
  isActive: boolean('is_active').default(true),
  isPopular: boolean('is_popular').default(false),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    stripePriceIdIdx: index('subscription_plans_stripe_price_id_idx').on(table.stripePriceId),
    nameIdx: index('subscription_plans_name_idx').on(table.name),
    activeIdx: index('subscription_plans_active_idx').on(table.isActive),
  }
})

export const paymentHistory = pgTable('payment_history', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id').unique(),
  stripeInvoiceId: varchar('stripe_invoice_id').unique(),
  stripeSubscriptionId: varchar('stripe_subscription_id'),
  
  // Payment details
  amount: integer('amount').notNull(), // in cents
  currency: varchar('currency').default('usd'),
  status: varchar('status').notNull(), // succeeded, failed, pending, canceled
  paymentMethod: varchar('payment_method'), // card, bank_transfer, etc.
  
  // Plan information
  planId: varchar('plan_id').references(() => subscriptionPlans.id),
  planName: varchar('plan_name'),
  billingPeriod: varchar('billing_period'), // month, year
  
  // Metadata
  description: text('description'),
  receiptUrl: text('receipt_url'),
  refunded: boolean('refunded').default(false),
  refundedAmount: integer('refunded_amount').default(0),
  
  // Timestamps
  paidAt: timestamp('paid_at'),
  failedAt: timestamp('failed_at'),
  createdAt: timestamp('created_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('payment_history_user_id_idx').on(table.userId),
    statusIdx: index('payment_history_status_idx').on(table.status),
    stripePaymentIntentIdx: index('payment_history_stripe_payment_intent_idx').on(table.stripePaymentIntentId),
    paidAtIdx: index('payment_history_paid_at_idx').on(table.paidAt),
  }
})

export const usageTracking = pgTable('usage_tracking', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Current period tracking
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Usage counts
  proGenerationsUsed: integer('pro_generations_used').default(0),
  draftGenerationsUsed: integer('draft_generations_used').default(0),
  
  // Limits
  proGenerationsLimit: integer('pro_generations_limit'),
  draftGenerationsLimit: integer('draft_generations_limit'),
  
  // Plan information
  subscriptionPlan: varchar('subscription_plan').notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id'),
  
  // Overage tracking
  proOverageUsed: integer('pro_overage_used').default(0),
  overageCharges: integer('overage_charges').default(0), // in cents
  
  // Reset tracking
  lastResetAt: timestamp('last_reset_at').default(sql`NOW()`),
  nextResetAt: timestamp('next_reset_at').notNull(),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    userIdIdx: index('usage_tracking_user_id_idx').on(table.userId),
    periodIdx: index('usage_tracking_period_idx').on(table.periodStart, table.periodEnd),
    subscriptionIdx: index('usage_tracking_subscription_idx').on(table.stripeSubscriptionId),
    nextResetIdx: index('usage_tracking_next_reset_idx').on(table.nextResetAt),
  }
})

export const webhookEvents = pgTable('webhook_events', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  
  // Stripe webhook data
  stripeEventId: varchar('stripe_event_id').notNull().unique(),
  eventType: varchar('event_type').notNull(),
  eventData: jsonb('event_data').notNull(),
  
  // Processing status
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  processingError: text('processing_error'),
  retryCount: integer('retry_count').default(0),
  
  // Related entities
  userId: varchar('user_id').references(() => users.id),
  stripeCustomerId: varchar('stripe_customer_id'),
  stripeSubscriptionId: varchar('stripe_subscription_id'),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    stripeEventIdIdx: index('webhook_events_stripe_event_id_idx').on(table.stripeEventId),
    eventTypeIdx: index('webhook_events_event_type_idx').on(table.eventType),
    processedIdx: index('webhook_events_processed_idx').on(table.processed),
    userIdIdx: index('webhook_events_user_id_idx').on(table.userId),
    createdAtIdx: index('webhook_events_created_at_idx').on(table.createdAt),
  }
})

// ==================== STRIPE PAYMENT TYPE EXPORTS ====================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert

export type PaymentHistory = typeof paymentHistory.$inferSelect
export type NewPaymentHistory = typeof paymentHistory.$inferInsert

export type UsageTracking = typeof usageTracking.$inferSelect
export type NewUsageTracking = typeof usageTracking.$inferInsert

export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert