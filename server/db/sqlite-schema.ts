import { 
  sqliteTable, 
  text, 
  integer
} from 'drizzle-orm/sqlite-core'

// Simple SQLite schema for authentication
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  
  // Basic user data
  company: text('company'),
  industry: text('industry'),
  role: text('role'),
  
  // Subscription info
  isPremium: integer('is_premium', { mode: 'boolean' }).default(false),
  freeCredits: integer('free_credits').default(5),
  usedCredits: integer('used_credits').default(0),
  subscriptionStatus: text('subscription_status').default('free'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Hook generations table for storing generated hooks
export const hookGenerations = sqliteTable('hook_generations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  objective: text('objective').notNull(), 
  topic: text('topic').notNull(),
  modelType: text('model_type').notNull().default('gpt-4o-mini'),
  
  // Store hooks as JSON text (SQLite doesn't have native JSON)
  hooks: text('hooks', { mode: 'json' }).notNull(),
  topThreeVariants: text('top_three_variants', { mode: 'json' }),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Favorite hooks table
export const favoriteHooks = sqliteTable('favorite_hooks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  generationId: text('generation_id').references(() => hookGenerations.id, { onDelete: 'set null' }),
  
  hook: text('hook'),
  hookData: text('hook_data', { mode: 'json' }),
  framework: text('framework').notNull(),
  platformNotes: text('platform_notes').notNull(),
  topic: text('topic'),
  platform: text('platform'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type HookGeneration = typeof hookGenerations.$inferSelect
export type NewHookGeneration = typeof hookGenerations.$inferInsert
export type FavoriteHook = typeof favoriteHooks.$inferSelect
export type NewFavoriteHook = typeof favoriteHooks.$inferInsert