import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { sql } from 'drizzle-orm'
import * as schema from '../../server/db/schema.js'

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hooklinestudio_test'

// Create separate connections for setup operations
const setupClient = postgres(TEST_DATABASE_URL, { max: 1 })
const db = drizzle(setupClient, { schema })

export async function setupTestDatabase() {
  try {
    console.log('Setting up test database...')
    
    // Run migrations
    await migrate(db, { migrationsFolder: './migrations' })
    console.log('✅ Migrations completed')
    
    // Seed test data
    await seedTestData()
    console.log('✅ Test data seeded')
    
  } catch (error) {
    console.error('❌ Test database setup failed:', error)
    throw error
  }
}

export async function teardownTestDatabase() {
  try {
    console.log('Tearing down test database...')
    
    // Drop all tables in reverse dependency order
    const tables = [
      'webhook_events',
      'api_usage_tracking',
      'user_journey_tracking',
      'business_intelligence',
      'error_tracking',
      'web_vitals',
      'system_metrics',
      'hook_trend_tracking',
      'ab_test_results',
      'analytics_events',
      'hook_performance_analytics',
      'psychological_profiles',
      'hook_formulas',
      'favorite_hooks',
      'hook_generations',
      'payment_history',
      'usage_tracking',
      'subscription_plans',
      'users'
    ]
    
    for (const table of tables) {
      await setupClient`DROP TABLE IF EXISTS ${setupClient(table)} CASCADE`
    }
    
    console.log('✅ Test database cleaned up')
  } catch (error) {
    console.error('❌ Test database teardown failed:', error)
    throw error
  } finally {
    await setupClient.end()
  }
}

export async function clearTestData() {
  try {
    // Clear all tables except schema migrations
    const tables = [
      'webhook_events',
      'api_usage_tracking', 
      'user_journey_tracking',
      'business_intelligence',
      'error_tracking',
      'web_vitals',
      'system_metrics',  
      'hook_trend_tracking',
      'ab_test_results',
      'analytics_events',
      'hook_performance_analytics',
      'psychological_profiles',
      'favorite_hooks',
      'hook_generations',
      'payment_history',
      'usage_tracking',
      'users'
    ]
    
    for (const table of tables) {
      await db.execute(sql.raw(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`))
    }
    
    console.log('✅ Test data cleared')
  } catch (error) {
    console.error('❌ Failed to clear test data:', error)
    throw error
  }
}

async function seedTestData() {
  // Insert subscription plans
  await db.insert(schema.subscriptionPlans).values([
    {
      id: 'plan_free',
      name: 'Free',
      stripePriceId: null,
      price: 0,
      currency: 'usd',
      interval: 'month',
      features: ['20 draft generations per week', 'Basic AI models'],
      isActive: true
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      stripePriceId: 'price_pro_monthly',
      price: 2900,
      currency: 'usd', 
      interval: 'month',
      features: ['Unlimited generations', 'Advanced AI models', 'Priority support'],
      isActive: true
    }
  ])

  // Insert hook formulas
  await db.insert(schema.hookFormulas).values([
    {
      code: 'QH-01',
      name: 'Curiosity Question Hook',
      template: 'What if I told you {value}?',
      category: 'question-based',
      psychologicalTriggers: ['curiosity-gap', 'value-hit'],
      platform: 'universal',
      objective: 'watch_time',
      effectivenessRating: 8.5,
      riskLevel: 'medium',
      isActive: true
    },
    {
      code: 'ST-01', 
      name: 'Authority Statement Hook',
      template: 'After {experience}, here\'s what I learned',
      category: 'statement-based',
      psychologicalTriggers: ['authority-credibility', 'social-proof'],
      platform: 'universal',
      objective: 'click_through', 
      effectivenessRating: 9.2,
      riskLevel: 'low',
      isActive: true
    },
    {
      code: 'NA-01',
      name: 'Personal Story Hook',
      template: 'I tried {action} for {timeframe} and {result}',
      category: 'narrative',
      psychologicalTriggers: ['curiosity-gap', 'social-proof', 'storytelling'],
      platform: 'universal',
      objective: 'engagement',
      effectivenessRating: 9.0,
      riskLevel: 'low', 
      isActive: true
    }
  ])

  // Insert test users
  await db.insert(schema.users).values([
    {
      id: 'user-free-test',
      firebaseUid: 'firebase-free-test',
      email: 'free@test.com',
      firstName: 'Free',
      lastName: 'User',
      emailVerified: true,
      safety: 'standard', 
      freeCredits: 5,
      subscriptionStatus: 'free',
      isPremium: false,
      draftGenerationsUsed: 0,
      proGenerationsUsed: 0,
      weeklyDraftReset: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'user-premium-test',
      firebaseUid: 'firebase-premium-test', 
      email: 'premium@test.com',
      firstName: 'Premium',
      lastName: 'User',
      emailVerified: true,
      safety: 'standard',
      freeCredits: 0,
      subscriptionStatus: 'active',
      subscriptionPlan: 'pro',
      isPremium: true,
      stripeCustomerId: 'cus_test_premium',
      stripeSubscriptionId: 'sub_test_premium',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      draftGenerationsUsed: 0,
      proGenerationsUsed: 25
    }
  ])

  console.log('✅ Basic test data seeded')
}

// Utility function to create isolated test transaction
export async function withTestTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    const result = await callback(tx)
    // Transaction will be rolled back automatically after test
    throw new Error('ROLLBACK') // Force rollback
  }).catch((error) => {
    if (error.message === 'ROLLBACK') {
      // This is expected, return the result
      return callback(db) // Run again without transaction for the actual result
    }
    throw error
  })
}

// Helper to get fresh database instance for tests
export function getTestDb() {
  const client = postgres(TEST_DATABASE_URL, { max: 1 })
  return drizzle(client, { schema })
}

// Global setup and teardown for Jest
export default async function globalSetup() {
  await setupTestDatabase()
}

export async function globalTeardown() {
  await teardownTestDatabase()
}