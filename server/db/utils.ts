import { db } from './index.js'
import { users, hookGenerations, favoriteHooks } from './sqlite-schema.js'
import { eq, desc } from 'drizzle-orm'

// Minimal database utilities for SQLite authentication system
// Only includes essential functions for auth and basic hook operations

export async function getUserById(userId: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    return user || null
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user || null
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

export async function createUser(userData: any) {
  try {
    const [newUser] = await db.insert(users).values(userData).returning()
    return newUser
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

// Stub functions for compatibility - can be implemented later
export async function getUserHookGenerations(userId: string, limit = 10) {
  return []
}

export async function getUserFavoriteHooks(userId: string, limit = 10) {
  return []
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()
    return updatedUser
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}