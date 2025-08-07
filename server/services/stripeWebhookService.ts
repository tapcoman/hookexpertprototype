import Stripe from 'stripe'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { 
  users, 
  paymentHistory, 
  usageTracking, 
  webhookEvents,
  subscriptionPlans,
  type User
} from '../db/sqlite-schema.js'
import { stripe, StripeConfig } from '../config/stripe.js'
import { logger } from '../middleware/logging.js'
import type { SubscriptionStatus, SubscriptionPlan as SubscriptionPlanName } from '../../shared/types.js'

export class StripeWebhookService {
  /**
   * Verify and construct webhook event from Stripe
   */
  static constructEvent(body: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured')
    }

    try {
      return stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      logger.error('Webhook signature verification failed', { error: error.message })
      throw new Error('Invalid webhook signature')
    }
  }

  /**
   * Handle incoming webhook event
   */
  static async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      // Store webhook event for processing
      await this.storeWebhookEvent(event)

      // Process event based on type
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
          break

        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object as Stripe.Customer)
          break

        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod)
          break

        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`)
      }

      // Mark event as processed
      await this.markEventProcessed(event.id)

      logger.info(`Successfully processed webhook event: ${event.type}`, { eventId: event.id })
    } catch (error) {
      logger.error(`Failed to process webhook event: ${event.type}`, { 
        eventId: event.id, 
        error: error instanceof Error ? error.message : String(error) 
      })
      
      // Update event with processing error
      await this.markEventFailed(event.id, error.message)
      throw error
    }
  }

  // ==================== SUBSCRIPTION EVENTS ====================

  /**
   * Handle subscription created event
   */
  private static async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(subscription.customer as string)
      if (!user) {
        logger.warn(`User not found for customer: ${subscription.customer}`)
        return
      }

      const planName = subscription.metadata.plan_name || 'starter'
      const plan = await this.getPlanByName(planName)
      
      if (!plan) {
        logger.error(`Plan not found: ${planName}`)
        return
      }

      // Update user subscription status
      await db
        .update(users)
        .set({
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status as SubscriptionStatus,
          subscriptionPlan: planName as SubscriptionPlanName,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          isPremium: subscription.status === 'active' || subscription.status === 'trialing',
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, user.id))

      // Initialize usage tracking
      await this.initializeUsageTracking(user.id, plan, subscription)

      logger.info(`Subscription created for user ${user.id}`, { 
        subscriptionId: subscription.id,
        planName,
        status: subscription.status
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle subscription created', { 
        subscriptionId: subscription.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  /**
   * Handle subscription updated event
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(subscription.customer as string)
      if (!user) {
        logger.warn(`User not found for customer: ${subscription.customer}`)
        return
      }

      const planName = subscription.metadata.plan_name || user.subscriptionPlan || 'free'
      const isPremium = subscription.status === 'active' || subscription.status === 'trialing'

      // Update user subscription status
      await db
        .update(users)
        .set({
          subscriptionStatus: subscription.status as SubscriptionStatus,
          subscriptionPlan: planName as SubscriptionPlanName,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          isPremium,
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, user.id))

      // If subscription became active, ensure usage tracking exists
      if (subscription.status === 'active') {
        const plan = await this.getPlanByName(planName)
        if (plan) {
          await this.ensureUsageTracking(user.id, plan, subscription)
        }
      }

      // If subscription was cancelled immediately, handle cleanup
      if (subscription.status === 'canceled') {
        await this.handleSubscriptionCancellation(user.id)
      }

      logger.info(`Subscription updated for user ${user.id}`, { 
        subscriptionId: subscription.id,
        planName,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle subscription updated', { 
        subscriptionId: subscription.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  /**
   * Handle subscription deleted event
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(subscription.customer as string)
      if (!user) {
        logger.warn(`User not found for customer: ${subscription.customer}`)
        return
      }

      // Downgrade user to free plan
      await db
        .update(users)
        .set({
          subscriptionStatus: 'free' as SubscriptionStatus,
          subscriptionPlan: 'free' as SubscriptionPlanName,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          isPremium: false,
          stripeSubscriptionId: null,
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, user.id))

      // Initialize free plan usage tracking
      const freePlan = await this.getPlanByName('free')
      if (freePlan) {
        await this.initializeFreeUsageTracking(user.id, freePlan)
      }

      logger.info(`Subscription deleted for user ${user.id}`, { 
        subscriptionId: subscription.id
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle subscription deleted', { 
        subscriptionId: subscription.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  // ==================== PAYMENT EVENTS ====================

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(invoice.customer as string)
      if (!user) {
        logger.warn(`User not found for customer: ${invoice.customer}`)
        return
      }

      // Record payment in history
      await db.insert(paymentHistory).values({
        userId: user.id,
        stripeInvoiceId: invoice.id || null,
        stripeSubscriptionId: (invoice as any).subscription as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paymentMethod: (invoice as any).payment_intent ? 'card' : 'unknown',
        description: invoice.description || `Payment for subscription`,
        receiptUrl: invoice.hosted_invoice_url || null,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      })

      // If this is a subscription renewal, reset usage tracking
      if ((invoice as any).subscription && (invoice as any).billing_reason === 'subscription_cycle') {
        await this.resetUsageForBillingCycle(user.id)
      }

      logger.info(`Payment succeeded for user ${user.id}`, { 
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle payment succeeded', { 
        invoiceId: invoice.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(invoice.customer as string)
      if (!user) {
        logger.warn(`User not found for customer: ${invoice.customer}`)
        return
      }

      // Record failed payment in history
      await db.insert(paymentHistory).values({
        userId: user.id,
        stripeInvoiceId: invoice.id || null,
        stripeSubscriptionId: (invoice as any).subscription as string,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        description: `Failed payment for subscription`,
        failedAt: new Date(),
      })

      // Update user subscription status to past_due
      await db
        .update(users)
        .set({
          subscriptionStatus: 'past_due' as SubscriptionStatus,
          updatedAt: sql`NOW()`
        })
        .where(eq(users.id, user.id))

      logger.warn(`Payment failed for user ${user.id}`, { 
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency
      })

      // TODO: Send email notification about failed payment
      // await this.sendPaymentFailedNotification(user)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle payment failed', { 
        invoiceId: invoice.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  // ==================== CUSTOMER EVENTS ====================

  /**
   * Handle customer updated event
   */
  private static async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(customer.id)
      if (!user) {
        logger.warn(`User not found for customer: ${customer.id}`)
        return
      }

      // Update user information if changed
      const updates: Partial<User> = {}
      
      if (customer.email && customer.email !== user.email) {
        updates.email = customer.email
      }

      if (customer.name) {
        const nameParts = customer.name.split(' ')
        if (nameParts.length >= 2) {
          updates.firstName = nameParts[0]
          updates.lastName = nameParts.slice(1).join(' ')
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date()
        await db
          .update(users)
          .set(updates)
          .where(eq(users.id, user.id))

        logger.info(`Customer updated for user ${user.id}`, { updates })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle customer updated', { 
        customerId: customer.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  // ==================== PAYMENT METHOD EVENTS ====================

  /**
   * Handle payment method attached event
   */
  private static async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(paymentMethod.customer as string)
      if (!user) {
        logger.warn(`User not found for customer: ${paymentMethod.customer}`)
        return
      }

      logger.info(`Payment method attached for user ${user.id}`, { 
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type
      })

      // TODO: Send confirmation email about new payment method
      // await this.sendPaymentMethodAddedNotification(user, paymentMethod)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle payment method attached', { 
        paymentMethodId: paymentMethod.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  // ==================== CHECKOUT EVENTS ====================

  /**
   * Handle checkout session completed event
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const user = await this.findUserByCustomerId(session.customer as string)
      if (!user) {
        logger.warn(`User not found for customer: ${session.customer}`)
        return
      }

      // If this is a subscription checkout, the subscription events will handle the updates
      if (session.mode === 'subscription' && session.subscription) {
        logger.info(`Checkout completed for user ${user.id}`, { 
          sessionId: session.id,
          subscriptionId: session.subscription
        })
        return
      }

      // Handle one-time payment checkouts if needed
      if (session.mode === 'payment' && session.payment_intent) {
        await db.insert(paymentHistory).values({
          userId: user.id,
          stripePaymentIntentId: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: 'succeeded',
          description: 'One-time payment',
          paidAt: new Date(),
        })

        logger.info(`One-time payment completed for user ${user.id}`, { 
          sessionId: session.id,
          amount: session.amount_total
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to handle checkout completed', { 
        sessionId: session.id, 
        error: errorMessage 
      })
      throw error
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Store webhook event in database
   */
  private static async storeWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      await db.insert(webhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        eventData: event.data as any,
        processed: false,
        userId: await this.extractUserIdFromEvent(event),
        stripeCustomerId: this.extractCustomerIdFromEvent(event),
        stripeSubscriptionId: this.extractSubscriptionIdFromEvent(event),
      })
    } catch (error) {
      logger.error('Failed to store webhook event', { 
        eventId: event.id, 
        type: event.type,
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }

  /**
   * Mark webhook event as processed
   */
  private static async markEventProcessed(eventId: string): Promise<void> {
    await db
      .update(webhookEvents)
      .set({ 
        processed: true, 
        processedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(webhookEvents.stripeEventId, eventId))
  }

  /**
   * Mark webhook event as failed
   */
  private static async markEventFailed(eventId: string, error: string): Promise<void> {
    await db
      .update(webhookEvents)
      .set({ 
        processingError: error,
        retryCount: sql`retry_count + 1`,
        updatedAt: new Date()
      })
      .where(eq(webhookEvents.stripeEventId, eventId))
  }

  /**
   * Find user by Stripe customer ID
   */
  private static async findUserByCustomerId(customerId: string): Promise<User | null> {
    const users_result = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1)

    return users_result.length > 0 ? users_result[0] : null
  }

  /**
   * Get plan by name
   */
  private static async getPlanByName(name: string) {
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
   * Initialize usage tracking for new subscription
   */
  private static async initializeUsageTracking(userId: string, plan: any, subscription: Stripe.Subscription): Promise<void> {
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
   * Ensure usage tracking exists for active subscription
   */
  private static async ensureUsageTracking(userId: string, plan: any, subscription: Stripe.Subscription): Promise<void> {
    const existing = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.stripeSubscriptionId, subscription.id)
      ))
      .limit(1)

    if (!existing.length) {
      await this.initializeUsageTracking(userId, plan, subscription as any)
    }
  }

  /**
   * Initialize free plan usage tracking
   */
  private static async initializeFreeUsageTracking(userId: string, freePlan: any): Promise<void> {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    await db.insert(usageTracking).values({
      userId,
      periodStart: now,
      periodEnd: nextWeek,
      proGenerationsUsed: 0,
      draftGenerationsUsed: 0,
      proGenerationsLimit: freePlan.proGenerationsLimit,
      draftGenerationsLimit: freePlan.draftGenerationsLimit,
      subscriptionPlan: 'free',
      stripeSubscriptionId: null,
      proOverageUsed: 0,
      overageCharges: 0,
      lastResetAt: now,
      nextResetAt: nextWeek,
    })
  }

  /**
   * Handle subscription cancellation cleanup
   */
  private static async handleSubscriptionCancellation(userId: string): Promise<void> {
    // Reset to free plan limits immediately
    const freePlan = await this.getPlanByName('free')
    if (freePlan) {
      await this.initializeFreeUsageTracking(userId, freePlan)
    }

    logger.info(`Processed subscription cancellation for user ${userId}`)
  }

  /**
   * Reset usage tracking for new billing cycle
   */
  private static async resetUsageForBillingCycle(userId: string): Promise<void> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user.length) return

    const userData = user[0]
    const plan = await this.getPlanByName(userData.subscriptionPlan || 'free')
    if (!plan) return

    const now = new Date()
    let nextReset: Date

    if (plan.interval === 'month') {
      nextReset = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    } else {
      nextReset = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
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
        updatedAt: sql`NOW()`
      })
      .where(eq(users.id, userId))

    logger.info(`Reset usage tracking for billing cycle for user ${userId}`)
  }

  /**
   * Extract user ID from webhook event
   */
  private static async extractUserIdFromEvent(event: Stripe.Event): Promise<string | null> {
    try {
      const customerId = this.extractCustomerIdFromEvent(event)
      if (!customerId) return null

      const user = await this.findUserByCustomerId(customerId)
      return user?.id || null
    } catch {
      return null
    }
  }

  /**
   * Extract customer ID from webhook event
   */
  private static extractCustomerIdFromEvent(event: Stripe.Event): string | null {
    const obj = event.data.object as any
    
    if (obj.customer) {
      return typeof obj.customer === 'string' ? obj.customer : obj.customer.id
    }
    
    return null
  }

  /**
   * Extract subscription ID from webhook event
   */
  private static extractSubscriptionIdFromEvent(event: Stripe.Event): string | null {
    const obj = event.data.object as any
    
    if (obj.id && event.type.includes('subscription')) {
      return obj.id
    }
    
    if (obj.subscription) {
      return typeof obj.subscription === 'string' ? obj.subscription : obj.subscription.id
    }
    
    return null
  }
}