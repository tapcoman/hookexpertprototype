import { db } from './db.js'

// Subscription plan configurations for serverless environment
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'free',
    displayName: 'Free',
    description: '5 monthly Draft generations with GPT-4o-mini',
    price: 0,
    currency: 'usd',
    interval: 'month',
    proGenerationsLimit: 0,
    draftGenerationsLimit: 5,
    teamSeats: 1,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    trialPeriodDays: 0,
    isActive: true,
    isPopular: false,
    features: [
      '5 Draft AI generations/month',
      'GPT-4o-mini model only',
      'Basic hook templates',
      'Community support'
    ]
  },
  starter: {
    name: 'starter',
    displayName: 'Starter',
    description: '100 Smart AI generations + unlimited Draft generations',
    price: 900, // $9.00
    currency: 'usd',
    interval: 'month',
    proGenerationsLimit: 100,
    draftGenerationsLimit: null,
    teamSeats: 1,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    trialPeriodDays: 7,
    isActive: true,
    isPopular: false,
    features: [
      '100 Smart AI (GPT-4o) generations/month',
      'Unlimited Draft (GPT-4o-mini) generations',
      'All hook frameworks',
      'Email support',
      '7-day free trial'
    ]
  },
  creator: {
    name: 'creator',
    displayName: 'Creator',
    description: '200 Smart AI generations + unlimited Draft generations',
    price: 1500, // $15.00
    currency: 'usd',
    interval: 'month',
    proGenerationsLimit: 200,
    draftGenerationsLimit: null,
    teamSeats: 1,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: false,
    trialPeriodDays: 7,
    isActive: true,
    isPopular: true,
    features: [
      '200 Smart AI (GPT-4o) generations/month',
      'Unlimited Draft (GPT-4o-mini) generations',
      'Advanced analytics & insights',
      'Priority email support',
      'Hook performance tracking',
      '7-day free trial'
    ]
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    description: '400 Smart AI generations + unlimited Draft generations',
    price: 2400, // $24.00
    currency: 'usd',
    interval: 'month',
    proGenerationsLimit: 400,
    draftGenerationsLimit: null,
    teamSeats: 1,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    trialPeriodDays: 7,
    isActive: true,
    isPopular: false,
    features: [
      '400 Smart AI (GPT-4o) generations/month',
      'Unlimited Draft (GPT-4o-mini) generations',
      'Advanced analytics & insights',
      'Priority support with live chat',
      'Custom hook templates',
      'API access (coming soon)',
      '7-day free trial'
    ]
  }
}

// Get subscription status for a user
export async function getSubscriptionStatus(userId) {
  try {
    if (!db.sql) {
      throw new Error('Database not initialized')
    }

    // Get user data
    const userResult = await db.sql`
      SELECT 
        id,
        subscription_status as "subscriptionStatus",
        subscription_plan as "subscriptionPlan",
        current_period_end as "currentPeriodEnd",
        cancel_at_period_end as "cancelAtPeriodEnd",
        stripe_customer_id as "stripeCustomerId",
        stripe_subscription_id as "stripeSubscriptionId",
        pro_generations_used as "proGenerationsUsed",
        draft_generations_used as "draftGenerationsUsed",
        weekly_draft_reset as "weeklyDraftReset",
        is_premium as "isPremium",
        created_at as "createdAt"
      FROM users 
      WHERE id = ${userId}
      LIMIT 1
    `

    if (!userResult.length) {
      throw new Error('User not found')
    }

    const user = userResult[0]
    const planName = user.subscriptionPlan || 'free'
    const plan = SUBSCRIPTION_PLANS[planName]

    if (!plan) {
      throw new Error(`Invalid plan: ${planName}`)
    }

    // Calculate usage and limits
    const isSubscriptionActive = user.subscriptionStatus === 'active' || 
                                 user.subscriptionStatus === 'trialing' ||
                                 user.isPremium

    // Get current usage tracking
    let usage = {
      proGenerationsUsed: user.proGenerationsUsed || 0,
      draftGenerationsUsed: user.draftGenerationsUsed || 0,
      proGenerationsLimit: plan.proGenerationsLimit,
      draftGenerationsLimit: plan.draftGenerationsLimit
    }

    // For free users, check if monthly reset is needed
    if (!isSubscriptionActive && planName === 'free') {
      const weeklyReset = user.weeklyDraftReset ? new Date(user.weeklyDraftReset) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const now = new Date()
      const monthsSinceReset = (now.getTime() - weeklyReset.getTime()) / (30 * 24 * 60 * 60 * 1000)
      
      if (monthsSinceReset >= 1) {
        // Reset is needed
        await db.sql`
          UPDATE users 
          SET 
            draft_generations_used = 0,
            weekly_draft_reset = ${now.toISOString()},
            updated_at = NOW()
          WHERE id = ${userId}
        `
        usage.draftGenerationsUsed = 0
      }
    }

    // Calculate remaining generations
    const remainingProGenerations = usage.proGenerationsLimit ? 
      Math.max(0, usage.proGenerationsLimit - usage.proGenerationsUsed) : 999999
    const remainingDraftGenerations = usage.draftGenerationsLimit ? 
      Math.max(0, usage.draftGenerationsLimit - usage.draftGenerationsUsed) : 999999

    // Determine trial status
    let trialEndsAt = null
    let isTrialing = false
    
    if (user.subscriptionStatus === 'trialing' && user.currentPeriodEnd) {
      trialEndsAt = user.currentPeriodEnd
      isTrialing = true
    }

    // Determine upgrade path
    const canUpgrade = planName !== 'pro'
    const nextPlan = planName === 'free' ? 'starter' : 
                     planName === 'starter' ? 'creator' : 
                     planName === 'creator' ? 'pro' : null

    return {
      success: true,
      data: {
        currentPlan: planName,
        status: user.subscriptionStatus || 'free',
        isTrialing,
        trialEndsAt,
        limits: {
          proGenerations: usage.proGenerationsLimit,
          proGenerationsUsed: usage.proGenerationsUsed,
          proGenerationsRemaining: remainingProGenerations,
          draftGenerations: usage.draftGenerationsLimit || 'unlimited',
          draftGenerationsUsed: usage.draftGenerationsUsed,
          draftGenerationsRemaining: remainingDraftGenerations
        },
        billingPeriodEnd: user.currentPeriodEnd,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
        canUpgrade,
        nextPlan
      }
    }
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return {
      success: false,
      error: 'Failed to get subscription status',
      message: error.message
    }
  }
}

// Get available pricing plans
export async function getPricingPlans(currentPlan = 'free') {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      ...plan,
      isCurrent: plan.name === currentPlan,
      priceFormatted: plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(0)}/month`,
      upgradeFrom: currentPlan
    }))

    return {
      success: true,
      data: {
        plans,
        currentPlan,
        recommendedPlan: 'creator' // Most popular plan
      }
    }
  } catch (error) {
    console.error('Error getting pricing plans:', error)
    return {
      success: false,
      error: 'Failed to get pricing plans',
      message: error.message
    }
  }
}

// Get detailed usage analytics
export async function getUsageAnalytics(userId) {
  try {
    if (!db.sql) {
      throw new Error('Database not initialized')
    }

    // Get current user usage
    const userResult = await db.sql`
      SELECT 
        subscription_plan as "subscriptionPlan",
        subscription_status as "subscriptionStatus",
        pro_generations_used as "proGenerationsUsed",
        draft_generations_used as "draftGenerationsUsed",
        weekly_draft_reset as "weeklyDraftReset",
        current_period_end as "currentPeriodEnd",
        created_at as "createdAt"
      FROM users 
      WHERE id = ${userId}
      LIMIT 1
    `

    if (!userResult.length) {
      throw new Error('User not found')
    }

    const user = userResult[0]
    const plan = SUBSCRIPTION_PLANS[user.subscriptionPlan || 'free']

    // Get historical usage from hook_generations table if it exists
    let monthlyBreakdown = []
    try {
      const historyResult = await db.sql`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          model_type as "modelType",
          COUNT(*) as count
        FROM hook_generations 
        WHERE user_id = ${userId}
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at), model_type
        ORDER BY month DESC
      `
      
      // Process the results into monthly breakdown
      const monthlyData = {}
      historyResult.forEach(row => {
        const monthKey = row.month.toISOString().substring(0, 7) // YYYY-MM format
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, proGenerations: 0, draftGenerations: 0 }
        }
        
        if (row.modelType === 'gpt-4o') {
          monthlyData[monthKey].proGenerations = row.count
        } else {
          monthlyData[monthKey].draftGenerations = row.count
        }
      })
      
      monthlyBreakdown = Object.values(monthlyData)
    } catch (historyError) {
      console.warn('Could not fetch usage history:', historyError.message)
      // Fallback to current month data
      const currentMonth = new Date().toISOString().substring(0, 7)
      monthlyBreakdown = [{
        month: currentMonth,
        proGenerations: user.proGenerationsUsed || 0,
        draftGenerations: user.draftGenerationsUsed || 0
      }]
    }

    // Calculate current period progress
    const now = new Date()
    const periodStart = user.currentPeriodEnd ? 
      new Date(new Date(user.currentPeriodEnd).getTime() - (30 * 24 * 60 * 60 * 1000)) : 
      new Date(user.createdAt)
    const periodEnd = user.currentPeriodEnd ? new Date(user.currentPeriodEnd) : 
      new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000))
    const daysElapsed = Math.ceil((now.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000))
    const periodProgress = Math.min(100, (daysElapsed / totalDays) * 100)

    // Calculate usage efficiency
    const proUsageRate = plan.proGenerationsLimit ? 
      (user.proGenerationsUsed || 0) / plan.proGenerationsLimit : 0
    const draftUsageRate = plan.draftGenerationsLimit ? 
      (user.draftGenerationsUsed || 0) / plan.draftGenerationsLimit : 0

    return {
      success: true,
      data: {
        currentPeriod: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
          progressPercentage: Math.round(periodProgress),
          daysRemaining: Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        },
        currentUsage: {
          proGenerations: {
            used: user.proGenerationsUsed || 0,
            limit: plan.proGenerationsLimit,
            percentage: Math.round(proUsageRate * 100),
            remaining: plan.proGenerationsLimit ? Math.max(0, plan.proGenerationsLimit - (user.proGenerationsUsed || 0)) : 999999
          },
          draftGenerations: {
            used: user.draftGenerationsUsed || 0,
            limit: plan.draftGenerationsLimit,
            percentage: plan.draftGenerationsLimit ? Math.round(draftUsageRate * 100) : 0,
            remaining: plan.draftGenerationsLimit ? Math.max(0, plan.draftGenerationsLimit - (user.draftGenerationsUsed || 0)) : 999999
          }
        },
        monthlyBreakdown,
        recommendations: {
          shouldUpgrade: proUsageRate > 0.8 && plan.name !== 'pro',
          suggestedPlan: proUsageRate > 0.8 ? (plan.name === 'starter' ? 'creator' : 'pro') : null,
          efficiencyTips: [
            proUsageRate > 0.5 ? 'Consider using Draft generations for initial ideation' : null,
            draftUsageRate < 0.3 ? 'You have unused Draft generations - use them for rapid prototyping' : null
          ].filter(Boolean)
        }
      }
    }
  } catch (error) {
    console.error('Error getting usage analytics:', error)
    return {
      success: false,
      error: 'Failed to get usage analytics',
      message: error.message
    }
  }
}

// Create upgrade session (simplified for serverless)
export async function createUpgradeSession(userId, planName) {
  try {
    const plan = SUBSCRIPTION_PLANS[planName]
    if (!plan) {
      throw new Error('Invalid plan')
    }

    // In a real implementation, this would create a Stripe checkout session
    // For now, we'll return the plan information for the frontend to handle
    return {
      success: true,
      data: {
        planName: plan.name,
        price: plan.price,
        trialPeriodDays: plan.trialPeriodDays,
        checkoutUrl: `/billing?upgrade=${planName}`, // Frontend will handle the actual checkout
        message: 'Redirect to billing page for upgrade'
      }
    }
  } catch (error) {
    console.error('Error creating upgrade session:', error)
    return {
      success: false,
      error: 'Failed to create upgrade session',
      message: error.message
    }
  }
}