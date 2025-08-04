#!/usr/bin/env tsx

/**
 * Complete Stripe Payment System Activation Script
 * This script will guide you through activating the complete Stripe payment integration
 * 
 * Usage: npm run activate:stripe
 */

import dotenv from 'dotenv'
import { stripe, StripeConfig } from '../server/config/stripe.js'
import { db } from '../server/db/index.js'
import { subscriptionPlans } from '../server/db/schema.js'
import { seedSubscriptionPlans } from '../server/db/seed.js'
import { eq } from 'drizzle-orm'

dotenv.config()

console.log(`
🎯 Hook Line Studio - Stripe Payment Activation
===============================================

This script will activate the complete Stripe payment system for your app.
It will guide you through all necessary steps.

`)

async function checkEnvironment() {
  console.log('📋 Step 1: Checking Environment Configuration...')
  
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY', 
    'DATABASE_URL',
    'OPENAI_API_KEY'
  ]

  const missing = []
  const configured = []

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      configured.push(envVar)
    } else {
      missing.push(envVar)
    }
  }

  console.log(`✅ Configured: ${configured.join(', ')}`)
  
  if (missing.length > 0) {
    console.log(`❌ Missing: ${missing.join(', ')}`)
    console.log(`
Please add the missing environment variables to your .env file:

${missing.map(v => `${v}=your_${v.toLowerCase()}_here`).join('\n')}

For Stripe keys, get them from: https://dashboard.stripe.com/apikeys
`)
    return false
  }

  console.log('✅ All required environment variables are configured!')
  return true
}

async function testStripeConnection() {
  console.log('\n🔐 Step 2: Testing Stripe Connection...')
  
  try {
    const account = await stripe.accounts.retrieve()
    console.log(`✅ Stripe connection successful!`)
    console.log(`   Account ID: ${account.id}`)
    console.log(`   Country: ${account.country}`)
    console.log(`   Currency: ${account.default_currency}`)
    return true
  } catch (error) {
    console.log(`❌ Stripe connection failed: ${error.message}`)
    console.log('Please check your STRIPE_SECRET_KEY')
    return false
  }
}

async function createStripeProducts() {
  console.log('\n🏭 Step 3: Creating Stripe Products & Prices...')

  const plansConfig = [
    {
      name: 'free',
      displayName: 'Free',
      description: 'Perfect for getting started with AI hook generation',
      price: 0,
      features: ['10 hooks per month', 'Basic hook formulas', 'Community support']
    },
    {
      name: 'starter',
      displayName: 'Starter', 
      description: 'Great for content creators and small businesses',
      price: 900,
      features: ['100 hooks per month', 'Unlimited draft generations', 'All hook formulas', 'Email support']
    },
    {
      name: 'creator',
      displayName: 'Creator',
      description: 'Most popular - Perfect for serious content creators',
      price: 1500,
      features: ['300 hooks per month', 'Unlimited draft generations', 'All hook formulas', 'Priority support', 'Advanced analytics']
    },
    {
      name: 'pro',
      displayName: 'Pro',
      description: 'Advanced features for power users and agencies', 
      price: 2400,
      features: ['1,000 hooks per month', 'All hook formulas', 'Advanced analytics', 'Performance insights', 'Priority support']
    },
    {
      name: 'teams',
      displayName: 'Teams',
      description: 'Perfect for teams and agencies with collaboration features',
      price: 5900,
      features: ['Unlimited hooks per month', '3 team seats', 'Advanced analytics', 'Priority support', 'Team collaboration']
    }
  ]

  const createdPlans = []

  for (const planConfig of plansConfig) {
    try {
      console.log(`   Creating ${planConfig.displayName} plan...`)
      
      // Create product
      const product = await stripe.products.create({
        name: planConfig.displayName,
        description: planConfig.description,
        metadata: StripeConfig.getPlanMetadata(planConfig.name),
        features: planConfig.features.map(feature => ({ name: feature })),
      })

      let price = null

      // Create price (skip for free plan)
      if (planConfig.price > 0) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: planConfig.price,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          metadata: StripeConfig.getPlanMetadata(planConfig.name),
        })
      }

      createdPlans.push({
        name: planConfig.name,
        displayName: planConfig.displayName,
        productId: product.id,
        priceId: price?.id || 'free',
        price: planConfig.price,
      })

      console.log(`   ✅ ${planConfig.displayName}: ${product.id} / ${price?.id || 'free'}`)

    } catch (error) {
      console.log(`   ❌ Failed to create ${planConfig.name}: ${error.message}`)
      throw error
    }
  }

  console.log(`✅ Created ${createdPlans.length} Stripe products and prices`)
  return createdPlans
}

async function setupWebhooks() {
  console.log('\n🔗 Step 4: Setting up Stripe Webhooks...')

  const webhookUrl = process.env.WEBHOOK_URL || 'https://your-domain.com/api/payments/webhooks/stripe'
  
  if (!process.env.WEBHOOK_URL) {
    console.log('⚠️  WEBHOOK_URL not set in environment. Using placeholder URL.')
    console.log('Please update WEBHOOK_URL in your .env file with your actual domain.')
    return null
  }

  try {
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: StripeConfig.WEBHOOK_EVENTS,
    })

    console.log(`✅ Webhook endpoint created: ${webhook.id}`)
    console.log(`🔐 Webhook Secret: ${webhook.secret}`)
    console.log(`
⚠️  IMPORTANT: Add this webhook secret to your .env file:
STRIPE_WEBHOOK_SECRET=${webhook.secret}
`)
    
    return webhook
  } catch (error) {
    if (error.code === 'url_invalid') {
      console.log('⚠️  Webhook URL is invalid. Please check your WEBHOOK_URL setting.')
    } else {
      console.log(`❌ Error creating webhook: ${error.message}`)
    }
    return null
  }
}

async function updateDatabasePlans(striplePlans: any[]) {
  console.log('\n💾 Step 5: Updating Database with Stripe Plan IDs...')

  try {
    // First seed the database with the current structure
    await seedSubscriptionPlans()
    
    // Now update each plan with the actual Stripe IDs
    for (const stripePlan of striplePlans) {
      await db
        .update(subscriptionPlans)
        .set({
          stripePriceId: stripePlan.priceId,
          stripeProductId: stripePlan.productId,
        })
        .where(eq(subscriptionPlans.name, stripePlan.name))
      
      console.log(`   ✅ Updated ${stripePlan.name} plan with Stripe IDs`)
    }

    console.log('✅ Database plans updated with Stripe integration')
  } catch (error) {
    console.log(`❌ Error updating database: ${error.message}`)
    throw error
  }
}

async function testPaymentFlow() {
  console.log('\n🧪 Step 6: Testing Payment Flow...')

  try {
    // Get plans from database
    const plans = await db.select().from(subscriptionPlans)
    const paidPlan = plans.find(p => p.price > 0)
    
    if (!paidPlan) {
      throw new Error('No paid plans found in database')
    }

    // Create a test checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: paidPlan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: 'https://your-domain.com/success',
      cancel_url: 'https://your-domain.com/cancel',
    })

    console.log(`✅ Test checkout session created: ${session.id}`)
    console.log(`   URL: ${session.url}`)
    console.log('✅ Payment flow is working correctly!')
    
  } catch (error) {
    console.log(`❌ Payment flow test failed: ${error.message}`)
    throw error
  }
}

async function displaySetupSummary(striplePlans: any[], webhook: any) {
  console.log(`
🎉 STRIPE ACTIVATION COMPLETE!
=============================

Your Hook Line Studio payment system is now fully activated!

📊 Created Plans:
${striplePlans.map(p => `   • ${p.displayName}: $${p.price/100}/month (${p.productId})`).join('\n')}

${webhook ? `🔗 Webhook Endpoint: ${webhook.id}` : '⚠️  Webhook not created - update WEBHOOK_URL and run again'}

🚀 Next Steps:
1. Update your frontend environment with:
   VITE_STRIPE_PUBLISHABLE_KEY=${process.env.STRIPE_PUBLISHABLE_KEY}

2. Deploy your application with the updated environment variables

3. Test the payment flow:
   - Visit your pricing page
   - Try subscribing to a paid plan
   - Check the billing page for subscription management

4. Monitor webhook events in your Stripe dashboard

📚 Test Cards (for development):
   • Success: 4242 4242 4242 4242
   • Declined: 4000 0000 0000 0002
   • Requires SCA: 4000 0025 0000 3155

🔧 Troubleshooting:
   - Check logs for any errors
   - Verify webhook endpoint is accessible
   - Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe

💰 Your Hook Line Studio is now ready to generate revenue!
`)
}

async function main() {
  try {
    // Step 1: Check environment
    const envOk = await checkEnvironment()
    if (!envOk) {
      process.exit(1)
    }

    // Step 2: Test Stripe connection
    const stripeOk = await testStripeConnection()
    if (!stripeOk) {
      process.exit(1)
    }

    // Step 3: Create Stripe products
    const striplePlans = await createStripeProducts()

    // Step 4: Setup webhooks
    const webhook = await setupWebhooks()

    // Step 5: Update database
    await updateDatabasePlans(striplePlans)

    // Step 6: Test payment flow
    await testPaymentFlow()

    // Display summary
    await displaySetupSummary(striplePlans, webhook)

    console.log('✅ Stripe activation completed successfully!')
    
  } catch (error) {
    console.error(`❌ Activation failed: ${error.message}`)
    console.error('Please check the error above and try again.')
    process.exit(1)
  }
}

// Run the activation
main().catch(console.error)