#!/usr/bin/env tsx

/**
 * Script to create subscription plans in Stripe
 * Run this after setting up Stripe credentials
 * Usage: npm run setup:stripe-plans
 */

import dotenv from 'dotenv'
import { stripe, StripeConfig } from '../server/config/stripe.js'

dotenv.config()

async function createStripeProducts() {
  console.log('🚀 Creating Stripe products and prices...')

  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      description: 'Perfect for getting started with AI hook generation',
      price: 0, // Free plan
      features: [
        '10 hooks per month',
        'Basic hook formulas',
        'Community support'
      ]
    },
    {
      name: 'starter',
      displayName: 'Starter',
      description: 'Great for content creators and small businesses',
      price: 900, // $9.00
      features: [
        '100 hooks per month',
        'Unlimited draft generations',
        'All hook formulas',
        'Email support',
        '7-day free trial'
      ]
    },
    {
      name: 'creator',
      displayName: 'Creator',
      description: 'Most popular - Perfect for serious content creators',
      price: 1500, // $15.00
      features: [
        '300 hooks per month',
        'Unlimited draft generations',
        'All hook formulas',
        'Priority email support',
        'Advanced analytics',
        '7-day free trial'
      ]
    },
    {
      name: 'pro',
      displayName: 'Pro', 
      description: 'Advanced features for power users and agencies',
      price: 2400, // $24.00
      features: [
        '1,000 hooks per month',
        'Unlimited draft generations',
        'All hook formulas',
        'Advanced analytics',
        'Performance insights',
        'Priority support',
        '7-day free trial'
      ]
    },
    {
      name: 'teams',
      displayName: 'Teams',
      description: 'Perfect for teams and agencies with collaboration features',
      price: 5900, // $59.00
      features: [
        'Unlimited hooks per month',
        'Unlimited draft generations',
        'All hook formulas',
        '3 team seats',
        'Advanced analytics',
        'Performance insights',
        'Priority support',
        'Team collaboration',
        '7-day free trial'
      ]
    }
  ]

  const createdPlans = []

  for (const plan of plans) {
    try {
      console.log(`\n📦 Creating product: ${plan.displayName}`)

      // Create product
      const product = await stripe.products.create({
        name: plan.displayName,
        description: plan.description,
        metadata: StripeConfig.getPlanMetadata(plan.name),
        features: plan.features.map(feature => ({ name: feature })),
      })

      console.log(`✅ Product created: ${product.id}`)

      let price = null

      // Create price (skip for free plan)
      if (plan.price > 0) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          metadata: StripeConfig.getPlanMetadata(plan.name),
        })

        console.log(`✅ Price created: ${price.id} ($${plan.price / 100}/month)`)
      }

      createdPlans.push({
        name: plan.name,
        displayName: plan.displayName,
        productId: product.id,
        priceId: price?.id || 'free',
        price: plan.price,
      })

    } catch (error) {
      console.error(`❌ Error creating plan ${plan.name}:`, error.message)
    }
  }

  console.log('\n🎉 Stripe products and prices created successfully!')
  console.log('\n📋 Update your database seed file with these IDs:')
  console.log('=' .repeat(60))

  createdPlans.forEach(plan => {
    console.log(`${plan.name.toUpperCase()}:`)
    console.log(`  Product ID: ${plan.productId}`)
    console.log(`  Price ID: ${plan.priceId}`)
    console.log(`  Amount: $${plan.price / 100}/month`)
    console.log('')
  })

  console.log('💡 Don\'t forget to:')
  console.log('1. Update the subscription_plans seed data with these IDs')
  console.log('2. Configure your webhook endpoint in Stripe Dashboard')
  console.log('3. Add the webhook secret to your environment variables')
  console.log('')
  
  return createdPlans
}

async function setupWebhooks() {
  console.log('🔗 Setting up webhook endpoints...')
  
  const webhookUrl = process.env.WEBHOOK_URL || 'https://your-domain.com/api/payments/webhooks/stripe'
  
  try {
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated', 
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.updated',
        'payment_method.attached',
        'checkout.session.completed',
      ],
    })

    console.log(`✅ Webhook endpoint created: ${webhook.id}`)
    console.log(`📎 Webhook URL: ${webhook.url}`)
    console.log(`🔐 Webhook Secret: ${webhook.secret}`)
    console.log('')
    console.log('⚠️  IMPORTANT: Add this webhook secret to your .env file:')
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`)
    
  } catch (error) {
    if (error.code === 'url_invalid') {
      console.log('⚠️  Webhook URL invalid. Update WEBHOOK_URL in .env and run again.')
      console.log(`Current URL: ${webhookUrl}`)
    } else {
      console.error('❌ Error creating webhook:', error.message)
    }
  }
}

async function main() {
  try {
    console.log('🔑 Stripe Setup Script')
    console.log('====================')
    
    // Verify Stripe credentials
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment variables')
      console.log('Please add your Stripe secret key to .env file:')
      console.log('STRIPE_SECRET_KEY=sk_test_...')
      process.exit(1)
    }

    await createStripeProducts()
    
    if (process.env.WEBHOOK_URL) {
      await setupWebhooks()
    } else {
      console.log('💡 To create webhooks, add WEBHOOK_URL to .env and run again')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)