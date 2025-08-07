import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

// Stripe configuration and initialization
export class StripeConfig {
  private static instance: Stripe | null = null
  private static initialized = false

  static initialize(): Stripe {
    if (!this.instance) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY
      
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required')
      }

      this.instance = new Stripe(stripeSecretKey, {
        apiVersion: '2025-07-30.basil',
        typescript: true,
        telemetry: false, // Disable telemetry for better performance
      })

      this.initialized = true
      console.log('✅ Stripe SDK initialized successfully')
    }

    return this.instance
  }

  static getInstance(): Stripe {
    if (!this.instance) {
      return this.initialize()
    }
    return this.instance
  }

  static getStatus() {
    return {
      initialized: this.initialized,
      configured: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    }
  }

  // Subscription plan configurations - Updated to match pricing requirements
  static readonly PLAN_CONFIGURATIONS = {
    free: {
      name: 'free',
      displayName: 'Free',
      price: 0,
      proGenerationsLimit: 0, // No GPT-4o generations on free plan
      draftGenerationsLimit: 5, // 5 Draft generations/month (GPT-4o-mini only)
      teamSeats: 1,
      trialPeriodDays: 0,
      resetInterval: 'month' as const,
      allowedModels: ['gpt-4o-mini'], // Only GPT-4o-mini allowed
    },
    starter: {
      name: 'starter',
      displayName: 'Starter',
      price: 900, // $9.00
      proGenerationsLimit: 100, // 100 Pro generations/month (GPT-4o)
      draftGenerationsLimit: null, // Unlimited Draft generations
      teamSeats: 1,
      trialPeriodDays: 7,
      resetInterval: 'month' as const,
      allowedModels: ['gpt-4o', 'gpt-4o-mini'], // Both models allowed
    },
    creator: {
      name: 'creator',
      displayName: 'Creator',
      price: 1500, // $15.00
      proGenerationsLimit: 200, // 200 Pro generations/month (GPT-4o)
      draftGenerationsLimit: null, // Unlimited Draft generations
      teamSeats: 1,
      trialPeriodDays: 7,
      resetInterval: 'month' as const,
      isPopular: true,
      allowedModels: ['gpt-4o', 'gpt-4o-mini'], // Both models allowed
    },
    pro: {
      name: 'pro',
      displayName: 'Pro',
      price: 2400, // $24.00
      proGenerationsLimit: 400, // 400 Pro generations/month (GPT-4o)
      draftGenerationsLimit: null, // Unlimited Draft generations
      teamSeats: 1,
      trialPeriodDays: 7,
      resetInterval: 'month' as const,
      hasAdvancedAnalytics: true,
      allowedModels: ['gpt-4o', 'gpt-4o-mini'], // Both models allowed
    },
    teams: {
      name: 'teams',
      displayName: 'Teams',
      price: 5900, // $59.00
      proGenerationsLimit: null, // Unlimited Pro generations
      draftGenerationsLimit: null, // Unlimited Draft generations
      teamSeats: 3,
      trialPeriodDays: 7,
      resetInterval: 'month' as const,
      hasAdvancedAnalytics: true,
      hasPrioritySupport: true,
      allowedModels: ['gpt-4o', 'gpt-4o-mini'], // Both models allowed
    },
  } as const

  // Webhook event types we handle
  static readonly WEBHOOK_EVENTS = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.updated',
    'payment_method.attached',
    'setup_intent.succeeded',
    'checkout.session.completed',
  ] as const

  // Error codes and messages
  static readonly ERROR_CODES = {
    CUSTOMER_NOT_FOUND: 'customer_not_found',
    SUBSCRIPTION_NOT_FOUND: 'subscription_not_found',
    PAYMENT_METHOD_REQUIRED: 'payment_method_required',
    SUBSCRIPTION_ALREADY_EXISTS: 'subscription_already_exists',
    INVALID_PLAN: 'invalid_plan',
    WEBHOOK_VERIFICATION_FAILED: 'webhook_verification_failed',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    OVERAGE_LIMIT_EXCEEDED: 'overage_limit_exceeded',
  } as const

  // Usage limits and pricing
  static readonly USAGE_LIMITS = {
    MAX_OVERAGE_PERCENTAGE: 0.5, // 50% overage allowed
    OVERAGE_PRICE_PER_GENERATION: 10, // $0.10 per generation in cents
    WARNING_THRESHOLD: 0.8, // Warn at 80% usage
    CRITICAL_THRESHOLD: 0.95, // Critical warning at 95% usage
  } as const

  // Plan metadata for Stripe
  static getPlanMetadata(planName: string) {
    const config = this.PLAN_CONFIGURATIONS[planName as keyof typeof this.PLAN_CONFIGURATIONS]
    if (!config) {
      throw new Error(`Invalid plan name: ${planName}`)
    }

    return {
      plan_name: config.name,
      display_name: config.displayName,
      pro_generations_limit: config.proGenerationsLimit?.toString() || 'unlimited',
      draft_generations_limit: config.draftGenerationsLimit?.toString() || 'unlimited',
      team_seats: config.teamSeats.toString(),
      reset_interval: config.resetInterval,
      has_advanced_analytics: (config as any).hasAdvancedAnalytics?.toString() || 'false',
      has_priority_support: (config as any).hasPrioritySupport?.toString() || 'false',
    }
  }
}

// Export configured Stripe instance
export const stripe = StripeConfig.getInstance()