import { Router, Response } from 'express'
import { body, query, param } from 'express-validator'
import { validateRequest } from '../middleware/validation.js'
import { hybridAuth } from '../middleware/hybridAuth.js'
import { AuthenticatedRequest } from '../middleware/simpleAuth.js'
import { StripeService } from '../services/stripeService.js'
import { StripeWebhookService } from '../services/stripeWebhookService.js'
import { logger } from '../middleware/logging.js'
import { requireDatabase, requireStripe } from '../middleware/serviceAvailability.js'
import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { paymentHistory, subscriptionPlans } from '../db/schema.js'
import type { Request, Response } from 'express'

const router = Router()

// All payment routes require database and Stripe
router.use(requireDatabase)
router.use(requireStripe)

// ==================== SUBSCRIPTION PLANS ====================

/**
 * Get all available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price)

    res.json({
      success: true,
      data: plans.map(plan => ({
        id: plan.id,
        stripePriceId: plan.stripePriceId,
        stripeProductId: plan.stripeProductId,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        proGenerationsLimit: plan.proGenerationsLimit,
        draftGenerationsLimit: plan.draftGenerationsLimit,
        teamSeats: plan.teamSeats,
        hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
        hasPrioritySupport: plan.hasPrioritySupport,
        trialPeriodDays: plan.trialPeriodDays,
        isPopular: plan.isPopular,
      }))
    })
  } catch (error) {
    logger.error('Failed to get subscription plans', { error: error.message })
    res.status(500).json({
      success: false,
      error: 'Failed to load subscription plans'
    })
  }
})

// ==================== SUBSCRIPTION MANAGEMENT ====================

/**
 * Get current subscription status and usage
 */
router.get('/subscription', 
  hybridAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const subscriptionOverview = await StripeService.getSubscriptionStatus(userId)

      res.json({
        success: true,
        data: subscriptionOverview
      })
    } catch (error) {
      logger.error('Failed to get subscription status', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: 'Failed to get subscription status'
      })
    }
  }
)

/**
 * Create Stripe Checkout session for new subscription
 */
router.post('/checkout',
  hybridAuth,
  [
    body('priceId').isString().notEmpty().withMessage('Price ID is required'),
    body('successUrl').isURL().withMessage('Valid success URL is required'),
    body('cancelUrl').isURL().withMessage('Valid cancel URL is required'),
    body('trialPeriodDays').optional().isInt({ min: 0, max: 30 }).withMessage('Trial period must be 0-30 days'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const { priceId, successUrl, cancelUrl, trialPeriodDays } = req.body

      const session = await StripeService.createCheckoutSession(
        userId,
        priceId,
        successUrl,
        cancelUrl,
        trialPeriodDays
      )

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url
        }
      })
    } catch (error) {
      logger.error('Failed to create checkout session', { 
        userId: req.user?.id, 
        error: error.message 
      })
      
      const statusCode = error.message.includes('already has an active subscription') ? 409 : 500
      res.status(statusCode).json({
        success: false,
        error: error.message
      })
    }
  }
)

/**
 * Create billing portal session for subscription management
 */
router.post('/billing-portal',
  hybridAuth,
  [
    body('returnUrl').isURL().withMessage('Valid return URL is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const { returnUrl } = req.body

      const session = await StripeService.createBillingPortalSession(userId, returnUrl)

      res.json({
        success: true,
        data: {
          url: session.url
        }
      })
    } catch (error) {
      logger.error('Failed to create billing portal session', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

/**
 * Cancel subscription
 */
router.post('/subscription/cancel',
  hybridAuth,
  [
    body('cancelAtPeriodEnd').optional().isBoolean().withMessage('cancelAtPeriodEnd must be boolean'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const { cancelAtPeriodEnd = true } = req.body

      const subscription = await StripeService.cancelSubscription(userId, cancelAtPeriodEnd)

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        },
        message: cancelAtPeriodEnd 
          ? 'Subscription will be cancelled at the end of current billing period'
          : 'Subscription cancelled immediately'
      })
    } catch (error) {
      logger.error('Failed to cancel subscription', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

/**
 * Reactivate cancelled subscription
 */
router.post('/subscription/reactivate',
  hybridAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id

      const subscription = await StripeService.reactivateSubscription(userId)

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        },
        message: 'Subscription reactivated successfully'
      })
    } catch (error) {
      logger.error('Failed to reactivate subscription', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

/**
 * Resume cancelled subscription (alias for reactivate)
 */
router.post('/subscription/resume',
  hybridAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id

      const subscription = await StripeService.reactivateSubscription(userId)

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        },
        message: 'Subscription resumed successfully'
      })
    } catch (error) {
      logger.error('Failed to resume subscription', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

// ==================== USAGE & GENERATION LIMITS ====================

/**
 * Check generation limits for user
 */
router.get('/usage/limits',
  hybridAuth,
  [
    query('modelType').optional().isIn(['gpt-4o', 'gpt-4o-mini']).withMessage('Invalid model type'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const modelType = (req.query.modelType as 'gpt-4o' | 'gpt-4o-mini') || 'gpt-4o-mini'

      const generationStatus = await StripeService.checkGenerationLimits(userId, modelType)

      res.json({
        success: true,
        data: generationStatus
      })
    } catch (error) {
      logger.error('Failed to check generation limits', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: 'Failed to check generation limits'
      })
    }
  }
)

/**
 * Record hook generation usage
 */
router.post('/usage/record',
  hybridAuth,
  [
    body('modelType').isIn(['gpt-4o', 'gpt-4o-mini']).withMessage('Invalid model type'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const { modelType } = req.body

      await StripeService.recordGeneration(userId, modelType)

      res.json({
        success: true,
        message: 'Generation usage recorded successfully'
      })
    } catch (error) {
      logger.error('Failed to record generation usage', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: 'Failed to record usage'
      })
    }
  }
)

// ==================== PAYMENT HISTORY ====================

/**
 * Get payment history for user
 */
router.get('/history',
  hybridAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const offset = (page - 1) * limit

      const [payments, totalCount] = await Promise.all([
        db
          .select()
          .from(paymentHistory)
          .where(eq(paymentHistory.userId, userId))
          .orderBy(desc(paymentHistory.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql`count(*)` })
          .from(paymentHistory)
          .where(eq(paymentHistory.userId, userId))
      ])

      const total = Number(totalCount[0]?.count || 0)
      const totalPages = Math.ceil(total / limit)

      res.json({
        success: true,
        data: payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          planName: payment.planName,
          billingPeriod: payment.billingPeriod,
          description: payment.description,
          receiptUrl: payment.receiptUrl,
          refunded: payment.refunded,
          refundedAmount: payment.refundedAmount,
          paidAt: payment.paidAt?.toISOString(),
          failedAt: payment.failedAt?.toISOString(),
          createdAt: payment.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      })
    } catch (error) {
      logger.error('Failed to get payment history', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: 'Failed to get payment history'
      })
    }
  }
)

// ==================== STRIPE WEBHOOKS ====================

/**
 * Handle Stripe webhooks
 * Note: This endpoint bypasses authentication as it comes from Stripe
 */
router.post('/webhooks/stripe',
  // Use raw body for webhook signature verification
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string
      
      if (!signature) {
        logger.warn('Missing Stripe signature header')
        return res.status(400).json({
          success: false,
          error: 'Missing signature header'
        })
      }

      // Get raw body - Express should provide this when properly configured
      const body = req.body

      // Construct and verify webhook event
      const event = StripeWebhookService.constructEvent(body, signature)

      // Process webhook event
      await StripeWebhookService.handleWebhook(event)

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      })
    } catch (error) {
      logger.error('Webhook processing failed', { error: error.message })
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }
)

// ==================== PAYMENT METHOD MANAGEMENT ====================

/**
 * Update payment method
 */
router.post('/payment-method',
  hybridAuth,
  [
    body('paymentMethodId').isString().notEmpty().withMessage('Payment method ID is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const { paymentMethodId } = req.body

      await StripeService.updatePaymentMethod(userId, paymentMethodId)

      res.json({
        success: true,
        message: 'Payment method updated successfully'
      })
    } catch (error) {
      logger.error('Failed to update payment method', { 
        userId: req.user?.id, 
        error: error.message 
      })
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
)

export default router