import { 
  pgTable, 
  varchar, 
  text, 
  boolean, 
  integer, 
  timestamp, 
  jsonb, 
  index 
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Simplified schema for serverless functions - only what we need for auth

export const users = pgTable('users', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').notNull().unique(),
  password: text('password'), // bcrypt hashed password
  firebaseUid: varchar('firebase_uid').unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  emailVerified: boolean('email_verified').default(false),
  
  // Profile Information
  company: text('company'),
  industry: text('industry'),
  role: text('role'),
  audience: text('audience'),
  voice: text('voice'),
  bannedTerms: jsonb('banned_terms').default([]),
  safety: text('safety').default('standard'),
  
  // Credit System
  proGenerationsUsed: integer('pro_generations_used').default(0),
  draftGenerationsUsed: integer('draft_generations_used').default(0),
  weeklyDraftReset: timestamp('weekly_draft_reset').default(sql`NOW()`),
  freeCredits: integer('free_credits').default(5),
  usedCredits: integer('used_credits').default(0),
  isPremium: boolean('is_premium').default(false),
  
  // Subscription Data
  stripeCustomerId: varchar('stripe_customer_id'),
  stripeSubscriptionId: varchar('stripe_subscription_id'),
  subscriptionStatus: varchar('subscription_status').default('free'),
  subscriptionPlan: varchar('subscription_plan').default('free'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  
  createdAt: timestamp('created_at').default(sql`NOW()`),
  updatedAt: timestamp('updated_at').default(sql`NOW()`),
}, (table) => {
  return {
    emailIdx: index('users_email_idx').on(table.email),
    firebaseUidIdx: index('users_firebase_uid_idx').on(table.firebaseUid),
    subscriptionStatusIdx: index('users_subscription_status_idx').on(table.subscriptionStatus),
  }
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert