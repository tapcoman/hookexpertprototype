import Stripe from 'stripe'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { 
  users, 
  subscriptionPlans, 
  paymentHistory, 
  usageTracking, 
  webhookEvents,
  type User,
  type SubscriptionPlan,
  type PaymentHistory,
  type UsageTracking as UsageTrackingType,
  type WebhookEvent
} from '../db/schema.js'
import { stripe } from '../config/stripe.js'
import { StripeConfig } from '../config/stripe.js'
import { logger } from '../middleware/logging.js'
import type { 
  SubscriptionStatus, 
  SubscriptionPlan as SubscriptionPlanName,
  SubscriptionOverview,
  GenerationStatus
} from '../../shared/types.js'

export class StripeService {
  // ==================== CUSTOMER MANAGEMENT ====================

  /**
   * Get or create a Stripe customer for a user
   */
  static async getOrCreateCustomer(user: User): Promise<Stripe.Customer> {
    try {
      // If user already has a Stripe customer ID, retrieve it
      if (user.stripeCustomerId) {
        try {
          const customer = await stripe.customers.retrieve(user.stripeCustomerId)
          if (!customer.deleted) {
            return customer as Stripe.Customer
          }
        } catch (error) {
          logger.warn(`Stripe customer ${user.stripeCustomerId} not found, creating new one`, { userId: user.id, error: error instanceof Error ? error.message : String(error) })
        }
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        metadata: {
          userId: user.id,
          firebaseUid: user.firebaseUid || '',
          company: user.company || '',
        },
      })

      // Update user record with Stripe customer ID
      await db
        .update(users)
        .set({ 
          stripeCustomerId: customer.id,
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, user.id))

      logger.info(`Created Stripe customer for user ${user.id}`, { 
        customerId: customer.id,
        email: user.email 
      })

      return customer
    } catch (error) {
      logger.error('Failed to get or create Stripe customer', { 
        userId: user.id, 
        error: error instanceof Error ? error.message : String(error) 
      })
      throw new Error('Failed to create customer account')
    }
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  /**
   * Create a new subscription
   */
  static async createSubscription(
    user: User,
    priceId: string,
    paymentMethodId?: string,
    trialPeriodDays?: number
  ): Promise<Stripe.Subscription> {
    try {
      const customer = await this.getOrCreateCustomer(user)

      // Verify the price exists and get plan details
      const plan = await this.getPlanByPriceId(priceId)
      if (!plan) {
        throw new Error('Invalid subscription plan')
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        const existingSubscription = await this.getSubscriptionStatus(user.id)
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
          throw new Error('User already has an active subscription')
        }
      }

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: StripeConfig.getPlanMetadata(plan.name),
      }

      // Add trial period if specified
      if (trialPeriodDays && trialPeriodDays > 0) {
        subscriptionParams.trial_period_days = trialPeriodDays
      }

      // Add payment method if provided
      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams)

      // Update user record
      await this.updateUserSubscription(user.id, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status as SubscriptionStatus,
        subscriptionPlan: plan.name as SubscriptionPlanName,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })

      // Initialize usage tracking
      await this.initializeUsageTracking(user.id, plan, subscription)

      logger.info(`Created subscription for user ${user.id}`, { 
        subscriptionId: subscription.id,
        planName: plan.name,
        status: subscription.status
      })

      return subscription
    } catch (error) {
      logger.error('Failed to create subscription', { 
        userId: user.id, 
        priceId,
        error: error instanceof Error ? error.message : String(error) 
      })
      throw error
    }
  }

  /**
   * Get subscription status and details
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionOverview> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user.length) {
        throw new Error('User not found')
      }

      const userData = user[0]

      // Get plan details
      const plan = await this.getPlanByName(userData.subscriptionPlan || 'free')
      if (!plan) {
        throw new Error('Plan not found')
      }

      // Get usage tracking
      const usage = await this.getCurrentUsageTracking(userId)

      // Get Stripe subscription details if exists
      let stripeSubscription: Stripe.Subscription | null = null
      let hasPaymentMethod = false

      if (userData.stripeSubscriptionId) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId, {
            expand: ['default_payment_method', 'customer']
          })
          
          const customer = stripeSubscription.customer as Stripe.Customer
          hasPaymentMethod = !!stripeSubscription.default_payment_method || 
                           (customer.invoice_settings?.default_payment_method ? true : false)
        } catch (error) {
          logger.warn(`Failed to retrieve Stripe subscription ${userData.stripeSubscriptionId}`, { userId })
        }
      }

      return {
        plan: {
          id: plan.id,
          stripePriceId: plan.stripePriceId,
          stripeProductId: plan.stripeProductId,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description || undefined,
          price: plan.price,
          currency: plan.currency || 'usd',
          interval: plan.interval as 'month' | 'year',
          intervalCount: plan.intervalCount || 1,
          proGenerationsLimit: plan.proGenerationsLimit,
          draftGenerationsLimit: plan.draftGenerationsLimit,
          teamSeats: plan.teamSeats || 1,
          hasAdvancedAnalytics: plan.hasAdvancedAnalytics || false,
          hasPrioritySupport: plan.hasPrioritySupport || false,
          trialPeriodDays: plan.trialPeriodDays || 0,
          isActive: plan.isActive || false,
          isPopular: plan.isPopular || false,
        },
        status: userData.subscriptionStatus as SubscriptionStatus,
        currentPeriodEnd: userData.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: userData.cancelAtPeriodEnd || false,
        usage: usage ? {
          id: usage.id,
          userId: usage.userId,
          periodStart: usage.periodStart.toISOString(),
          periodEnd: usage.periodEnd.toISOString(),
          proGenerationsUsed: usage.proGenerationsUsed || 0,
          draftGenerationsUsed: usage.draftGenerationsUsed || 0,
          proGenerationsLimit: usage.proGenerationsLimit,
          draftGenerationsLimit: usage.draftGenerationsLimit,
          subscriptionPlan: usage.subscriptionPlan as SubscriptionPlanName,
          stripeSubscriptionId: usage.stripeSubscriptionId || undefined,
          proOverageUsed: usage.proOverageUsed || 0,
          overageCharges: usage.overageCharges || 0,
          lastResetAt: usage.lastResetAt?.toISOString() || new Date().toISOString(),
          nextResetAt: usage.nextResetAt.toISOString(),
        } : {
          id: '',
          userId,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          proGenerationsUsed: 0,
          draftGenerationsUsed: 0,
          proGenerationsLimit: null,
          draftGenerationsLimit: null,
          subscriptionPlan: 'free' as SubscriptionPlanName,
          proOverageUsed: 0,
          overageCharges: 0,
          lastResetAt: new Date().toISOString(),
          nextResetAt: new Date().toISOString(),
        },
        nextBillingAmount: stripeSubscription?.items.data[0]?.price.unit_amount || null,
        hasPaymentMethod,
      }
    } catch (error) {
      logger.error('Failed to get subscription status', { userId, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string, cancelAtPeriodEnd = true): Promise<Stripe.Subscription> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user.length || !user[0].stripeSubscriptionId) {
        throw new Error('No active subscription found')
      }

      const subscription = await stripe.subscriptions.update(user[0].stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      })

      // Update user record
      await this.updateUserSubscription(userId, {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionStatus: subscription.status as SubscriptionStatus,
      })

      logger.info(`Cancelled subscription for user ${userId}`, { 
        subscriptionId: subscription.id,
        cancelAtPeriodEnd
      })

      return subscription
    } catch (error) {
      logger.error('Failed to cancel subscription', { userId, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  static async reactivateSubscription(userId: string): Promise<Stripe.Subscription> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user.length || !user[0].stripeSubscriptionId) {
        throw new Error('No subscription found')
      }

      const subscription = await stripe.subscriptions.update(user[0].stripeSubscriptionId, {
        cancel_at_period_end: false,
      })

      // Update user record
      await this.updateUserSubscription(userId, {
        cancelAtPeriodEnd: false,
        subscriptionStatus: subscription.status as SubscriptionStatus,
      })

      logger.info(`Reactivated subscription for user ${userId}`, { 
        subscriptionId: subscription.id
      })

      return subscription
    } catch (error) {
      logger.error('Failed to reactivate subscription', { userId, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  // ==================== BILLING PORTAL & CHECKOUT ====================

  /**
   * Create Stripe Checkout session
   */
  static async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    trialPeriodDays?: number
  ): Promise<Stripe.Checkout.Session> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user.length) {
        throw new Error('User not found')
      }

      const customer = await this.getOrCreateCustomer(user[0])
      const plan = await this.getPlanByPriceId(priceId)
      
      if (!plan) {
        throw new Error('Invalid subscription plan')
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: StripeConfig.getPlanMetadata(plan.name),
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        tax_id_collection: { enabled: true },
      }

      // Add trial period if specified
      if (trialPeriodDays && trialPeriodDays > 0) {
        sessionParams.subscription_data!.trial_period_days = trialPeriodDays
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      logger.info(`Created checkout session for user ${userId}`, { 
        sessionId: session.id,
        planName: plan.name
      })

      return session
    } catch (error) {
      logger.error('Failed to create checkout session', { 
        userId, 
        priceId, 
        error: error instanceof Error ? error.message : String(error) 
      })
      throw error
    }
  }

  /**
   * Create billing portal session for customer self-service
   */
  static async createBillingPortalSession(userId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user.length || !user[0].stripeCustomerId) {
        throw new Error('No customer account found')
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user[0].stripeCustomerId,
        return_url: returnUrl,
      })

      logger.info(`Created billing portal session for user ${userId}`, { 
        sessionId: session.id
      })

      return session
    } catch (error) {
      logger.error('Failed to create billing portal session', { 
        userId, 
        error: error instanceof Error ? error.message : String(error) 
      })
      throw error
    }
  }

  // ==================== PAYMENT METHOD MANAGEMENT ====================

  /**
   * Update payment method
   */
  static async updatePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!user.length || !user[0].stripeCustomerId) {
        throw new Error('No customer account found')
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user[0].stripeCustomerId,
      })

      // Set as default payment method
      await stripe.customers.update(user[0].stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })

      // Update subscription default payment method if exists
      if (user[0].stripeSubscriptionId) {
        await stripe.subscriptions.update(user[0].stripeSubscriptionId, {
          default_payment_method: paymentMethodId,
        })
      }

      logger.info(`Updated payment method for user ${userId}`, { 
        paymentMethodId
      })
    } catch (error) {
      logger.error('Failed to update payment method', { 
        userId, 
        paymentMethodId, 
        error: error instanceof Error ? error.message : String(error) 
      })
      throw error
    }
  }

  // ==================== USAGE TRACKING & CREDIT SYSTEM ====================

  /**
   * Check if user can generate hooks with enhanced tier-based logic
   */
  static async checkGenerationLimits(userId: string, modelType: 'gpt-5-2025-08-07' | 'gpt-5-mini-2025-08-07'): Promise<GenerationStatus> {
    try {
      const usage = await this.getCurrentUsageTracking(userId)
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
      if (!user.length) {
        // Initialize new user with free plan defaults
        await this.initializeFreeUserTracking(userId)
        const newUsage = await this.getCurrentUsageTracking(userId)
        if (!newUsage) {
          return {
            canGenerate: false,
            reason: 'Failed to initialize user tracking',
            remainingProGenerations: 0,
            remainingDraftGenerations: 0,
            subscriptionPlan: 'free',
            usagePercentage: 0,
          }
        }
        return this.checkGenerationLimits(userId, modelType)
      }

      const userData = user[0]
      const planName = userData.subscriptionPlan || 'free'
      const isSubscriptionActive = userData.subscriptionStatus === 'active' || 
                                   userData.subscriptionStatus === 'trialing' || 
                                   userData.isPremium

      // Get plan configuration
      const planConfig = StripeConfig.PLAN_CONFIGURATIONS[planName as keyof typeof StripeConfig.PLAN_CONFIGURATIONS]
      if (!planConfig) {
        throw new Error(`Invalid plan configuration: ${planName}`)
      }

      // Check if model is allowed for this plan
      if (!planConfig.allowedModels.includes(modelType)) {
        const upgradePlan = modelType === 'gpt-5-2025-08-07' ? 'Starter plan' : 'any paid plan'
        return {
          canGenerate: false,
          reason: `${modelType === 'gpt-5-2025-08-07' ? 'Smart AI (GPT-5)' : 'Draft (GPT-5-mini)'} requires ${upgradePlan}. Upgrade to access this feature.`,
          remainingProGenerations: 0,
          remainingDraftGenerations: planName === 'free' ? Math.max(0, 5 - (userData.draftGenerationsUsed || 0)) : 0,
          subscriptionPlan: planName as SubscriptionPlanName,
          usagePercentage: 100,
          requiresUpgrade: true,
          modelNotAllowed: true,
        }
      }

      // For non-active subscriptions, use legacy free credits system
      if (!isSubscriptionActive && planName === 'free') {
        const freeCredits = userData.freeCredits || 5
        const usedCredits = userData.usedCredits || 0
        const draftUsed = userData.draftGenerationsUsed || 0
        
        // Check if we need to reset monthly limit
        const weeklyReset = userData.weeklyDraftReset || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const now = new Date()
        const monthsSinceReset = (now.getTime() - weeklyReset.getTime()) / (30 * 24 * 60 * 60 * 1000)
        
        if (monthsSinceReset >= 1) {
          // Reset monthly draft generations
          await db
            .update(users)
            .set({
              draftGenerationsUsed: 0,
              weeklyDraftReset: now,
              updatedAt: sql`NOW()`
            })
            .where(eq(users.id, userId))
          
          return this.checkGenerationLimits(userId, modelType)
        }

        const remainingCredits = Math.max(0, freeCredits - usedCredits)
        const remainingDraft = Math.max(0, 5 - draftUsed) // 5 monthly limit for free users

        // Free users can only use GPT-5-mini and are limited to 5/month
        const canGenerate = remainingDraft > 0
        const usagePercentage = (draftUsed / 5) * 100

        return {
          canGenerate,
          reason: canGenerate ? '' : 'Monthly limit reached. Upgrade to Starter for 100 Smart AI generations!',
          remainingProGenerations: 0, // Free users get no pro generations
          remainingDraftGenerations: remainingDraft,
          subscriptionPlan: 'free' as SubscriptionPlanName,
          usagePercentage,
          requiresUpgrade: !canGenerate,
          upgradeMessage: !canGenerate ? 'Get 100 Smart AI generations for just $9/month with Starter plan' : undefined,
        }
      }

      // For active subscriptions, use advanced usage tracking
      if (!usage) {
        // Initialize usage tracking for paid users
        await this.initializeUsageTracking(userId, planConfig as any, { 
          current_period_end: Math.floor((userData.currentPeriodEnd?.getTime() || Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          id: userData.stripeSubscriptionId || 'trial'
        } as any)
        
        const newUsage = await this.getCurrentUsageTracking(userId)
        if (!newUsage) {
          throw new Error('Failed to initialize usage tracking')
        }
        return this.checkGenerationLimits(userId, modelType)
      }

      // Check if current period has expired and reset if needed
      if (new Date() > usage.periodEnd) {
        await this.resetUsageTracking(userId)
        const updatedUsage = await this.getCurrentUsageTracking(userId)
        if (!updatedUsage) {
          throw new Error('Failed to reset usage tracking')
        }
        return this.checkGenerationLimits(userId, modelType)
      }

      const isPro = modelType === 'gpt-5-2025-08-07'
      
      if (isPro) {
        // Pro generations (GPT-5)
        const limit = usage.proGenerationsLimit
        const used = usage.proGenerationsUsed || 0
        const remaining = limit ? Math.max(0, limit - used) : Infinity
        const canGenerate = limit === null || used < limit
        
        // Enhanced messaging based on plan and usage
        let reason = ''
        let upgradeMessage = ''
        
        if (!canGenerate && limit !== null) {
          reason = `Smart AI limit reached (${used}/${limit} this month)`
          
          // Suggest upgrade based on current plan
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
        }

        // Check for overage allowance if at limit
        if (!canGenerate && limit !== null) {
          const maxOverage = Math.floor(limit * StripeConfig.USAGE_LIMITS.MAX_OVERAGE_PERCENTAGE)
          const overageUsed = usage.proOverageUsed || 0
          const overageRemaining = Math.max(0, maxOverage - overageUsed)
          
          if (overageRemaining > 0) {
            return {
              canGenerate: true,
              reason: `Using overage allowance (${overageRemaining} Smart AI generations remaining)`,
              remainingProGenerations: overageRemaining,
              remainingDraftGenerations: usage.draftGenerationsLimit ? 
                Math.max(0, usage.draftGenerationsLimit - (usage.draftGenerationsUsed || 0)) : 999999,
              subscriptionPlan: planName as SubscriptionPlanName,
              usagePercentage: ((used + overageUsed) / (limit + maxOverage)) * 100,
              isOverage: true,
            }
          }
        }

        return {
          canGenerate,
          reason,
          remainingProGenerations: remaining === Infinity ? 999999 : remaining,
          remainingDraftGenerations: usage.draftGenerationsLimit ? 
            Math.max(0, usage.draftGenerationsLimit - (usage.draftGenerationsUsed || 0)) : 999999,
          subscriptionPlan: planName as SubscriptionPlanName,
          usagePercentage: limit ? (used / limit) * 100 : 0,
          requiresUpgrade: !canGenerate,
          upgradeMessage: !canGenerate ? upgradeMessage : undefined,
        }
      } else {
        // Draft generations (GPT-5-mini) 
        const limit = usage.draftGenerationsLimit
        const used = usage.draftGenerationsUsed || 0
        const remaining = limit ? Math.max(0, limit - used) : Infinity
        const canGenerate = limit === null || used < limit
        
        let reason = ''
        if (!canGenerate && limit !== null) {
          reason = `Draft limit reached (${used}/${limit} this month)`
        }

        return {
          canGenerate,
          reason,
          remainingProGenerations: usage.proGenerationsLimit ? 
            Math.max(0, usage.proGenerationsLimit - (usage.proGenerationsUsed || 0)) : 999999,
          remainingDraftGenerations: remaining === Infinity ? 999999 : remaining,
          subscriptionPlan: planName as SubscriptionPlanName,
          usagePercentage: limit ? (used / limit) * 100 : 0,
          requiresUpgrade: false, // Draft generations typically unlimited for paid users
        }
      }
    } catch (error) {
      logger.error('Failed to check generation limits', { userId, modelType, error: error instanceof Error ? error.message : String(error) })
      return {
        canGenerate: false,
        reason: 'Error checking limits. Please try again.',
        remainingProGenerations: 0,
        remainingDraftGenerations: 0,
        subscriptionPlan: 'free',
        usagePercentage: 0,
      }
    }
  }

  /**
   * Record hook generation usage with enhanced tracking
   */
  static async recordGeneration(userId: string, modelType: 'gpt-5-2025-08-07' | 'gpt-5-mini-2025-08-07'): Promise<void> {
    try {
      const isPro = modelType === 'gpt-5-2025-08-07'
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
      if (!user.length) {
        throw new Error('User not found')
      }

      const userData = user[0]
      const planName = userData.subscriptionPlan || 'free'
      const isSubscriptionActive = userData.subscriptionStatus === 'active' || 
                                   userData.subscriptionStatus === 'trialing' || 
                                   userData.isPremium

      // For free users, update legacy counters
      if (!isSubscriptionActive && planName === 'free') {
        if (isPro) {
          // This shouldn't happen as free users can't use GPT-5, but handle gracefully
          logger.warn(`Free user ${userId} attempted to use GPT-5`, { modelType, plan: planName })
          return
        }

        // Update draft generations for free users
        const currentDraftUsed = userData.draftGenerationsUsed || 0
        await db
          .update(users)
          .set({
            draftGenerationsUsed: currentDraftUsed + 1,
            usedCredits: (userData.usedCredits || 0) + 1, // Maintain legacy counter
            updatedAt: sql`NOW()`
          })
          .where(eq(users.id, userId))

        logger.info(`Recorded free user generation for ${userId}`, { 
          modelType,
          newDraftUsage: currentDraftUsed + 1,
          newTotalUsage: (userData.usedCredits || 0) + 1
        })
        return
      }

      // For paid users, use advanced usage tracking
      const usage = await this.getCurrentUsageTracking(userId)
      if (!usage) {
        throw new Error('Usage tracking not found for paid user')
      }

      if (isPro) {
        const currentUsed = usage.proGenerationsUsed || 0
        const limit = usage.proGenerationsLimit
        
        if (limit && currentUsed >= limit) {
          // Use overage allowance
          const maxOverage = Math.floor(limit * StripeConfig.USAGE_LIMITS.MAX_OVERAGE_PERCENTAGE)
          const currentOverage = usage.proOverageUsed || 0
          
          if (currentOverage < maxOverage) {
            await db
              .update(usageTracking)
              .set({ 
                proOverageUsed: currentOverage + 1,
                overageCharges: (usage.overageCharges || 0) + StripeConfig.USAGE_LIMITS.OVERAGE_PRICE_PER_GENERATION,
                updatedAt: sql`NOW()`
              })
              .where(eq(usageTracking.id, usage.id))

            logger.info(`Recorded overage generation for user ${userId}`, { 
              modelType, 
              overageUsed: currentOverage + 1,
              maxOverage
            })
          } else {
            logger.warn(`User ${userId} exceeded overage limit for pro generations`, {
              currentUsed,
              limit,
              currentOverage,
              maxOverage
            })
            throw new Error('Overage limit exceeded')
          }
        } else {
          await db
            .update(usageTracking)
            .set({ 
              proGenerationsUsed: currentUsed + 1,
              updatedAt: sql`NOW()`
            })
            .where(eq(usageTracking.id, usage.id))

          logger.info(`Recorded pro generation for user ${userId}`, { 
            modelType, 
            newUsage: currentUsed + 1,
            limit: limit || 'unlimited'
          })
        }

        // Update user table for backward compatibility
        await db
          .update(users)
          .set({
            proGenerationsUsed: currentUsed + 1,
            updatedAt: sql`NOW()`
          })
          .where(eq(users.id, userId))

      } else {
        // Draft generations (GPT-5-mini)
        const currentUsed = usage.draftGenerationsUsed || 0
        await db
          .update(usageTracking)
          .set({ 
            draftGenerationsUsed: currentUsed + 1,
            updatedAt: sql`NOW()`
          })
          .where(eq(usageTracking.id, usage.id))

        // Update user table for backward compatibility  
        await db
          .update(users)
          .set({
            draftGenerationsUsed: currentUsed + 1,
            updatedAt: sql`NOW()`
          })
          .where(eq(users.id, userId))

        logger.info(`Recorded draft generation for user ${userId}`, { 
          modelType,
          newUsage: currentUsed + 1,
          limit: usage.draftGenerationsLimit || 'unlimited'
        })
      }

    } catch (error) {
      logger.error('Failed to record generation usage', { 
        userId, 
        modelType, 
        error: error instanceof Error ? error.message : String(error) 
      })
      throw error
    }
  }

  /**
   * Automatically determine the best GPT-5 model based on user subscription status
   */
  static async determineOptimalModel(userId: string): Promise<'gpt-5-2025-08-07' | 'gpt-5-mini-2025-08-07'> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
      if (!user.length) {
        // New users get GPT-5-mini by default
        return 'gpt-5-mini-2025-08-07'
      }

      const userData = user[0]
      const planName = userData.subscriptionPlan || 'free'
      const isSubscriptionActive = userData.subscriptionStatus === 'active' || 
                                   userData.subscriptionStatus === 'trialing' || 
                                   userData.isPremium

      // Free users always get GPT-5-mini
      if (!isSubscriptionActive && planName === 'free') {
        return 'gpt-5-mini-2025-08-07'
      }

      // For paid users, check if they have remaining GPT-5 credits
      const usage = await this.getCurrentUsageTracking(userId)
      if (!usage) {
        // No usage tracking yet, initialize and return based on plan
        return planName === 'free' ? 'gpt-5-mini-2025-08-07' : 'gpt-5-2025-08-07'
      }

      // Check if current period has expired
      if (new Date() > usage.periodEnd) {
        await this.resetUsageTracking(userId)
        const updatedUsage = await this.getCurrentUsageTracking(userId)
        if (updatedUsage) {
          usage.proGenerationsUsed = 0
          usage.proOverageUsed = 0
        }
      }

      const proLimit = usage.proGenerationsLimit
      const proUsed = (usage.proGenerationsUsed || 0) + (usage.proOverageUsed || 0)

      // If user has unlimited GPT-5 generations, use GPT-5
      if (proLimit === null) {
        return 'gpt-5-2025-08-07'
      }

      // If user has remaining GPT-5 credits (including overage allowance), use GPT-5
      const maxOverage = proLimit ? Math.floor(proLimit * StripeConfig.USAGE_LIMITS.MAX_OVERAGE_PERCENTAGE) : 0
      const totalAllowedProGenerations = proLimit + maxOverage

      if (proUsed < totalAllowedProGenerations) {
        return 'gpt-5-2025-08-07'
      }

      // Fallback to GPT-5-mini when out of credits
      return 'gpt-5-mini-2025-08-07'

    } catch (error) {
      logger.error('Failed to determine optimal model', { userId, error: error instanceof Error ? error.message : String(error) })
      // Fallback to GPT-5-mini on error
      return 'gpt-5-mini-2025-08-07'
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get plan by Stripe price ID
   */
  private static async getPlanByPriceId(priceId: string): Promise<SubscriptionPlan | null> {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(and(
        eq(subscriptionPlans.stripePriceId, priceId),
        eq(subscriptionPlans.isActive, true)
      ))
      .limit(1)

    return plans.length > 0 ? plans[0] : null
  }

  /**
   * Get plan by name
   */
  private static async getPlanByName(name: string): Promise<SubscriptionPlan | null> {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(and(
        eq(subscriptionPlans.name, name),
        eq(subscriptionPlans.isActive, true)
      ))
      .limit(1)

    return plans.length > 0 ? plans[0] : null
  }

  /**
   * Update user subscription data
   */
  private static async updateUserSubscription(userId: string, data: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set({ 
        ...data,
        updatedAt: sql`NOW()`
      })
      .where(eq(users.id, userId))
  }

  /**
   * Get current usage tracking for user
   */
  private static async getCurrentUsageTracking(userId: string): Promise<UsageTrackingType | null> {
    const tracking = await db
      .select()
      .from(usageTracking)
      .where(eq(usageTracking.userId, userId))
      .orderBy(desc(usageTracking.createdAt))
      .limit(1)

    return tracking.length > 0 ? tracking[0] : null
  }

  /**
   * Initialize usage tracking for new subscription
   */
  private static async initializeUsageTracking(
    userId: string, 
    plan: SubscriptionPlan, 
    subscription: Stripe.Subscription
  ): Promise<void> {
    const now = new Date()
    const periodEnd = new Date((subscription as any).current_period_end * 1000)

    await db.insert(usageTracking).values({
      userId,
      periodStart: now,
      periodEnd,
      proGenerationsUsed: 0,
      draftGenerationsUsed: 0,
      proGenerationsLimit: plan.proGenerationsLimit,
      draftGenerationsLimit: plan.draftGenerationsLimit,
      subscriptionPlan: plan.name,
      stripeSubscriptionId: subscription.id,
      proOverageUsed: 0,
      overageCharges: 0,
      lastResetAt: now,
      nextResetAt: periodEnd,
    })
  }

  /**
   * Initialize tracking for free users
   */
  private static async initializeFreeUserTracking(userId: string): Promise<void> {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    // Initialize basic usage tracking for free users
    await db.insert(usageTracking).values({
      userId,
      periodStart: now,
      periodEnd: nextMonth,
      proGenerationsUsed: 0,
      draftGenerationsUsed: 0,
      proGenerationsLimit: 0, // No pro generations for free
      draftGenerationsLimit: 5, // 5 draft generations per month
      subscriptionPlan: 'free',
      stripeSubscriptionId: null,
      proOverageUsed: 0,
      overageCharges: 0,
      lastResetAt: now,
      nextResetAt: nextMonth,
    })

    logger.info(`Initialized free user tracking for ${userId}`, {
      draftLimit: 5,
      resetPeriod: 'monthly'
    })
  }

  /**
   * Reset usage tracking for new billing period
   */
  private static async resetUsageTracking(userId: string): Promise<void> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user.length) return

    const userData = user[0]
    const plan = await this.getPlanByName(userData.subscriptionPlan || 'free')
    if (!plan) return

    const now = new Date()
    let nextReset: Date

    // Calculate next reset based on plan interval
    if (plan.interval === 'month') {
      nextReset = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    } else if (plan.interval === 'year') {
      nextReset = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    } else {
      // Weekly reset for free plan
      nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    await db.insert(usageTracking).values({
      userId,
      periodStart: now,
      periodEnd: nextReset,
      proGenerationsUsed: 0,
      draftGenerationsUsed: 0,
      proGenerationsLimit: plan.proGenerationsLimit,
      draftGenerationsLimit: plan.draftGenerationsLimit,
      subscriptionPlan: plan.name,
      stripeSubscriptionId: userData.stripeSubscriptionId,
      proOverageUsed: 0,
      overageCharges: 0,
      lastResetAt: now,
      nextResetAt: nextReset,
    })

    // Update user table
    await db
      .update(users)
      .set({
        proGenerationsUsed: 0,
        draftGenerationsUsed: 0,
        weeklyDraftReset: plan.name === 'free' ? now : userData.weeklyDraftReset,
        updatedAt: sql`NOW()`
      })
      .where(eq(users.id, userId))
  }
}