import { z } from 'zod';
// ==================== USER TYPES ====================
export const UserRoleSchema = z.enum([
    'founder-ceo',
    'marketing-manager',
    'content-creator',
    'social-media-manager',
    'video-editor',
    'freelancer',
    'agency-owner',
    'student',
    'other'
]);
export const IndustrySchema = z.enum([
    'agency',
    'creator',
    'ecommerce',
    'saas',
    'local-business',
    'education',
    'healthcare',
    'finance',
    'fitness',
    'beauty',
    'food',
    'technology',
    'real-estate',
    'consulting',
    'other'
]);
export const VoiceSchema = z.enum([
    'authoritative',
    'friendly',
    'playful',
    'contrarian',
    'luxury',
    'minimal',
    'educational',
    'inspirational'
]);
export const SafetyModeSchema = z.enum([
    'family-friendly',
    'standard',
    'edgy'
]);
export const PlatformSchema = z.enum([
    'tiktok',
    'instagram',
    'youtube'
]);
export const ObjectiveSchema = z.enum([
    'watch_time',
    'shares',
    'saves',
    'ctr',
    'follows'
]);
export const SubscriptionPlanSchema = z.enum([
    'free',
    'starter',
    'creator',
    'pro',
    'teams'
]);
export const SubscriptionStatusSchema = z.enum([
    'free',
    'active',
    'canceled',
    'past_due',
    'incomplete',
    'trialing'
]);
// ==================== HOOK GENERATION TYPES ====================
export const HookCategorySchema = z.enum([
    'question-based',
    'statement-based',
    'narrative',
    'urgency-exclusivity',
    'efficiency'
]);
export const PsychologicalDriverSchema = z.enum([
    'curiosity-gap',
    'pain-point',
    'value-hit',
    'surprise-shock',
    'social-proof',
    'urgency-fomo',
    'authority-credibility',
    'emotional-connection'
]);
export const RiskFactorSchema = z.enum([
    'low',
    'medium',
    'high'
]);
export const ContentTypeSchema = z.enum([
    'educational',
    'storytelling',
    'mixed'
]);
export const ModelTypeSchema = z.enum([
    'gpt-4o',
    'gpt-4o-mini'
]);
// ==================== HOOK OBJECT SCHEMA ====================
export const HookObjectSchema = z.object({
    // Tri-modal components
    verbalHook: z.string().min(1, 'Verbal hook is required'),
    visualHook: z.string().optional(),
    textualHook: z.string().optional(),
    // Framework and psychology
    framework: z.string().min(1, 'Framework is required'),
    psychologicalDriver: PsychologicalDriverSchema,
    hookCategory: HookCategorySchema,
    riskFactor: RiskFactorSchema,
    // Quality metrics
    score: z.number().min(0).max(5),
    wordCount: z.number().min(1),
    scoreBreakdown: z.string(),
    // Context
    rationale: z.string(),
    platformNotes: z.string(),
    contentTypeStrategy: z.enum(['curiosity_gap', 'value_hit']),
    // Platform-specific data
    platformSpecific: z.object({
        tiktokColdOpen: z.string().optional(),
        instagramOverlay: z.string().optional(),
        youtubeProofCue: z.string().optional(),
    }).optional(),
    // Quality assurance
    promiseContentMatch: z.boolean(),
    specificityScore: z.number().min(0).max(1),
    freshnessScore: z.number().min(0).max(1),
});
// ==================== API REQUEST/RESPONSE SCHEMAS ====================
export const GenerateHooksRequestSchema = z.object({
    platform: PlatformSchema,
    objective: ObjectiveSchema,
    topic: z.string().min(10, 'Topic must be at least 10 characters').max(1000, 'Topic too long'),
    modelType: ModelTypeSchema.optional().default('gpt-4o-mini'),
});
export const GenerateHooksResponseSchema = z.object({
    id: z.string(),
    hooks: z.array(HookObjectSchema),
    topThreeVariants: z.array(HookObjectSchema).optional(),
    platform: PlatformSchema,
    objective: ObjectiveSchema,
    topic: z.string(),
    modelType: ModelTypeSchema,
    createdAt: z.string(),
});
export const UserProfileSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    firebaseUid: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    emailVerified: z.boolean().default(false),
    // Profile Information
    company: z.string().optional(),
    industry: IndustrySchema.optional(),
    role: UserRoleSchema.optional(),
    audience: z.string().optional(),
    voice: VoiceSchema.optional(),
    bannedTerms: z.array(z.string()).default([]),
    safety: SafetyModeSchema.default('standard'),
    // Credit System
    proGenerationsUsed: z.number().default(0),
    draftGenerationsUsed: z.number().default(0),
    weeklyDraftReset: z.string().optional(),
    freeCredits: z.number().default(5),
    usedCredits: z.number().default(0),
    isPremium: z.boolean().default(false),
    // Subscription Data
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
    subscriptionStatus: SubscriptionStatusSchema.default('free'),
    subscriptionPlan: SubscriptionPlanSchema.default('free'),
    currentPeriodEnd: z.string().optional(),
    cancelAtPeriodEnd: z.boolean().default(false),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const OnboardingDataSchema = z.object({
    // Step 1: About Your Work
    company: z.string().min(1, 'Company name is required'),
    industry: IndustrySchema,
    role: UserRoleSchema,
    audience: z.string().min(10, 'Please describe your audience'),
    // Step 2: How You Sound
    voice: VoiceSchema,
    bannedTerms: z.array(z.string()).default([]),
    safety: SafetyModeSchema,
    // Step 3: What You Make
    primaryPlatforms: z.array(PlatformSchema).min(1, 'Select at least one platform'),
    contentGoals: z.array(ObjectiveSchema).min(1, 'Select at least one goal').max(3, 'Select up to 3 goals'),
    successfulHooks: z.array(z.string()).optional(),
});
// ==================== PSYCHOLOGICAL FRAMEWORK TYPES ====================
export const PsychologicalFrameworkSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: HookCategorySchema,
    psychologicalTriggers: z.array(PsychologicalDriverSchema),
    effectivenessScore: z.number().min(0).max(1),
    riskFactor: RiskFactorSchema,
    optimalContexts: z.array(z.string()),
    template: z.string(),
    examples: z.array(z.string()),
});
export const HookTaxonomySchema = z.object({
    id: z.string(),
    category: HookCategorySchema,
    formula: z.string(),
    primaryDriver: PsychologicalDriverSchema,
    structuralTemplate: z.string(),
    exampleVariations: z.array(z.string()),
    optimalNiches: z.array(z.string()),
    riskFactor: RiskFactorSchema,
    effectivenessRating: z.number().min(0).max(1),
});
// ==================== ANALYTICS TYPES ====================
export const AnalyticsEventSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    userId: z.string().optional(),
    eventType: z.string(),
    eventData: z.record(z.any()).default({}),
    deviceInfo: z.object({
        userAgent: z.string(),
        platform: z.enum(['desktop', 'mobile', 'tablet']),
        screenResolution: z.tuple([z.number(), z.number()]).optional(),
    }),
    pageInfo: z.object({
        pathname: z.string(),
        referrer: z.string().optional(),
        source: z.string().optional(),
    }),
    createdAt: z.string(),
});
// ==================== STRIPE PAYMENT TYPES ====================
export const PaymentStatusSchema = z.enum([
    'succeeded',
    'failed',
    'pending',
    'canceled',
    'requires_action'
]);
export const BillingIntervalSchema = z.enum([
    'month',
    'year'
]);
export const SubscriptionPlanDetailsSchema = z.object({
    id: z.string(),
    stripePriceId: z.string(),
    stripeProductId: z.string(),
    name: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    price: z.number(), // in cents
    currency: z.string().default('usd'),
    interval: BillingIntervalSchema,
    intervalCount: z.number().default(1),
    proGenerationsLimit: z.number().nullable(),
    draftGenerationsLimit: z.number().nullable(),
    teamSeats: z.number().default(1),
    hasAdvancedAnalytics: z.boolean().default(false),
    hasPrioritySupport: z.boolean().default(false),
    trialPeriodDays: z.number().default(0),
    isActive: z.boolean().default(true),
    isPopular: z.boolean().default(false),
});
export const PaymentHistorySchema = z.object({
    id: z.string(),
    userId: z.string(),
    stripePaymentIntentId: z.string().optional(),
    stripeInvoiceId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
    amount: z.number(), // in cents
    currency: z.string().default('usd'),
    status: PaymentStatusSchema,
    paymentMethod: z.string().optional(),
    planName: z.string().optional(),
    billingPeriod: z.string().optional(),
    description: z.string().optional(),
    receiptUrl: z.string().optional(),
    refunded: z.boolean().default(false),
    refundedAmount: z.number().default(0),
    paidAt: z.string().optional(),
    failedAt: z.string().optional(),
    createdAt: z.string(),
});
export const UsageTrackingSchema = z.object({
    id: z.string(),
    userId: z.string(),
    periodStart: z.string(),
    periodEnd: z.string(),
    proGenerationsUsed: z.number().default(0),
    draftGenerationsUsed: z.number().default(0),
    proGenerationsLimit: z.number().nullable(),
    draftGenerationsLimit: z.number().nullable(),
    subscriptionPlan: SubscriptionPlanSchema,
    stripeSubscriptionId: z.string().optional(),
    proOverageUsed: z.number().default(0),
    overageCharges: z.number().default(0),
    lastResetAt: z.string(),
    nextResetAt: z.string(),
});
export const CreateCheckoutSessionSchema = z.object({
    priceId: z.string(),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
    trialPeriodDays: z.number().optional(),
});
export const BillingPortalSessionSchema = z.object({
    returnUrl: z.string().url(),
});
//# sourceMappingURL=types.js.map