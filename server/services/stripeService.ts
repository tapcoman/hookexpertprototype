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
} from '../db/sqlite-schema.js'
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
   * Check if user can generate hooks
   */
  static async checkGenerationLimits(userId: string, modelType: 'gpt-4o' | 'gpt-4o-mini'): Promise<GenerationStatus> {
    try {
      const usage = await this.getCurrentUsageTracking(userId)
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
      if (!user.length || !usage) {
        return {
          canGenerate: false,
          reason: 'User or usage data not found',
          remainingProGenerations: 0,
          remainingDraftGenerations: 0,
          subscriptionPlan: 'free',
          usagePercentage: 0,
        }
      }

      const isPro = modelType === 'gpt-4o'
      const planName = user[0].subscriptionPlan || 'free'

      // Check if current period has expired
      if (new Date() > usage.periodEnd) {
        await this.resetUsageTracking(userId)
        // Refetch after reset
        const updatedUsage = await this.getCurrentUsageTracking(userId)
        if (!updatedUsage) {
          throw new Error('Failed to reset usage tracking')
        }
        return this.checkGenerationLimits(userId, modelType)
      }

      if (isPro) {
        const limit = usage.proGenerationsLimit
        const used = usage.proGenerationsUsed || 0
        const remaining = limit ? Math.max(0, limit - used) : Infinity
        const canGenerate = limit === null || used < limit

        // Check for overage allowance if at limit
        if (!canGenerate && limit !== null) {
          const maxOverage = Math.floor(limit * StripeConfig.USAGE_LIMITS.MAX_OVERAGE_PERCENTAGE)
          const overageUsed = usage.proOverageUsed || 0
          const overageRemaining = Math.max(0, maxOverage - overageUsed)
          
          return {
            canGenerate: overageRemaining > 0,
            reason: overageRemaining > 0 ? 'Using overage allowance' : 'Pro generation limit exceeded',
            remainingProGenerations: overageRemaining,
            remainingDraftGenerations: usage.draftGenerationsLimit ? 
              Math.max(0, usage.draftGenerationsLimit - (usage.draftGenerationsUsed || 0)) : Infinity,
            subscriptionPlan: planName as SubscriptionPlanName,
            usagePercentage: (used / limit) * 100,
          }
        }

        return {
          canGenerate,
          reason: canGenerate ? '' : 'Pro generation limit exceeded',
          remainingProGenerations: remaining === Infinity ? 999999 : remaining,
          remainingDraftGenerations: usage.draftGenerationsLimit ? 
            Math.max(0, usage.draftGenerationsLimit - (usage.draftGenerationsUsed || 0)) : Infinity,
          subscriptionPlan: planName as SubscriptionPlanName,
          usagePercentage: limit ? (used / limit) * 100 : 0,
        }
      } else {
        // Draft generations (gpt-4o-mini)
        const limit = usage.draftGenerationsLimit
        const used = usage.draftGenerationsUsed || 0
        const remaining = limit ? Math.max(0, limit - used) : Infinity
        const canGenerate = limit === null || used < limit

        return {
          canGenerate,
          reason: canGenerate ? '' : 'Draft generation limit exceeded',
          remainingProGenerations: usage.proGenerationsLimit ? 
            Math.max(0, usage.proGenerationsLimit - (usage.proGenerationsUsed || 0)) : Infinity,
          remainingDraftGenerations: remaining === Infinity ? 999999 : remaining,
          subscriptionPlan: planName as SubscriptionPlanName,
          usagePercentage: limit ? (used / limit) * 100 : 0,
        }
      }
    } catch (error) {
      logger.error('Failed to check generation limits', { userId, modelType, error: error instanceof Error ? error.message : String(error) })
      return {
        canGenerate: false,
        reason: 'Error checking limits',
        remainingProGenerations: 0,
        remainingDraftGenerations: 0,
        subscriptionPlan: 'free',
        usagePercentage: 0,
      }
    }
  }

  /**
   * Record hook generation usage
   */
  static async recordGeneration(userId: string, modelType: 'gpt-4o' | 'gpt-4o-mini'): Promise<void> {
    try {
      const isPro = modelType === 'gpt-4o'
      const usage = await this.getCurrentUsageTracking(userId)
      
      if (!usage) {
        throw new Error('Usage tracking not found')
      }

      if (isPro) {
        const currentUsed = usage.proGenerationsUsed || 0
        const limit = usage.proGenerationsLimit
        
        if (limit && currentUsed >= limit) {
          // Use overage
          await db
            .update(usageTracking)
            .set({ 
              proOverageUsed: (usage.proOverageUsed || 0) + 1,
              overageCharges: (usage.overageCharges || 0) + StripeConfig.USAGE_LIMITS.OVERAGE_PRICE_PER_GENERATION,
              updatedAt: sql`NOW()`
            })
            .where(eq(usageTracking.id, usage.id))
        } else {
          await db
            .update(usageTracking)
            .set({ 
              proGenerationsUsed: currentUsed + 1,
              updatedAt: sql`NOW()`
            })
            .where(eq(usageTracking.id, usage.id))
        }
      } else {
        await db
          .update(usageTracking)
          .set({ 
            draftGenerationsUsed: (usage.draftGenerationsUsed || 0) + 1,
            updatedAt: sql`NOW()`
          })
          .where(eq(usageTracking.id, usage.id))
      }

      // Also update user table for backward compatibility
      await db
        .update(users)
        .set({
          proGenerationsUsed: isPro ? (usage.proGenerationsUsed || 0) + 1 : usage.proGenerationsUsed,
          draftGenerationsUsed: !isPro ? (usage.draftGenerationsUsed || 0) + 1 : usage.draftGenerationsUsed,
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, userId))

      logger.info(`Recorded generation usage for user ${userId}`, { 
        modelType, 
        isPro,
        newUsage: isPro ? (usage.proGenerationsUsed || 0) + 1 : (usage.draftGenerationsUsed || 0) + 1
      })
    } catch (error) {
      logger.error('Failed to record generation usage', { 
        userId, 
        modelType, 
        error: error instanceof Error ? error.message : String(error) 
      })
      throw error
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