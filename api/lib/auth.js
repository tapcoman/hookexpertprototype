import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createClerkClient } from '@clerk/clerk-sdk-node'
import { db } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-for-testing-minimum-32-characters'

// Initialize Clerk client for serverless functions
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Hash password
async function hashPassword(password) {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token (supports both Clerk tokens and legacy JWT)
async function verifyToken(token) {
  try {
    console.log('🔐 [Auth] Verifying token, length:', token.length)

    // Try Clerk verification first (Clerk tokens are longer, typically 400+ chars)
    if (token.length > 200) {
      try {
        console.log('🔐 [Auth] Attempting Clerk verification...')
        const verifiedToken = await clerkClient.verifyToken(token)
        const clerkUserId = verifiedToken.sub

        console.log('✅ [Auth] Clerk token verified, user ID:', clerkUserId)

        // Find user in database by Clerk ID (stored in firebaseUid for now)
        const user = await db.sql`
          SELECT id FROM users WHERE firebase_uid = ${clerkUserId} LIMIT 1
        `

        if (user && user[0]) {
          console.log('✅ [Auth] User found in DB:', user[0].id)
          return { userId: user[0].id, clerkUserId }
        } else {
          // User not in database yet - this might happen during onboarding
          console.log('⚠️ [Auth] Clerk user not in DB yet, will need to create')
          return { clerkUserId, userId: null }
        }
      } catch (clerkError) {
        console.warn('⚠️ [Auth] Clerk verification failed, trying legacy JWT:', clerkError.message)
        // Fall through to legacy JWT verification
      }
    }

    // Legacy JWT verification
    console.log('🔐 [Auth] Attempting legacy JWT verification...')
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('✅ [Auth] Legacy JWT verified, user ID:', decoded.userId)
    return { userId: decoded.userId }
  } catch (error) {
    console.error('❌ [Auth] Token verification failed:', error.message)
    return null
  }
}

// Find user by email
async function findUserByEmail(email) {
  try {
    if (!db.sql) {
      console.error('Database not initialized')
      return null
    }
    const result = await db.sql`
      SELECT 
        id,
        email,
        password,
        firebase_uid as "firebaseUid",
        first_name as "firstName",
        last_name as "lastName",
        email_verified as "emailVerified",
        company,
        industry,
        role,
        audience,
        voice,
        banned_terms as "bannedTerms",
        safety,
        preferred_hook_categories as "preferredHookCategories",
        psychological_risk_tolerance as "psychologicalRiskTolerance",
        creativity_preference as "creativityPreference",
        urgency_preference as "urgencyPreference",
        personality_insights as "personalityInsights",
        pro_generations_used as "proGenerationsUsed",
        draft_generations_used as "draftGenerationsUsed",
        weekly_draft_reset as "weeklyDraftReset",
        free_credits as "freeCredits",
        used_credits as "usedCredits",
        is_premium as "isPremium",
        stripe_customer_id as "stripeCustomerId",
        stripe_subscription_id as "stripeSubscriptionId",
        subscription_status as "subscriptionStatus",
        subscription_plan as "subscriptionPlan",
        current_period_end as "currentPeriodEnd",
        cancel_at_period_end as "cancelAtPeriodEnd",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error('Error finding user by email:', error)
    return null
  }
}

// Find user by ID
async function findUserById(id) {
  try {
    if (!db.sql) {
      console.error('Database not initialized')
      return null
    }
    const result = await db.sql`
      SELECT 
        id,
        email,
        password,
        firebase_uid as "firebaseUid",
        first_name as "firstName",
        last_name as "lastName",
        email_verified as "emailVerified",
        company,
        industry,
        role,
        audience,
        voice,
        banned_terms as "bannedTerms",
        safety,
        preferred_hook_categories as "preferredHookCategories",
        psychological_risk_tolerance as "psychologicalRiskTolerance",
        creativity_preference as "creativityPreference",
        urgency_preference as "urgencyPreference",
        personality_insights as "personalityInsights",
        pro_generations_used as "proGenerationsUsed",
        draft_generations_used as "draftGenerationsUsed",
        weekly_draft_reset as "weeklyDraftReset",
        free_credits as "freeCredits",
        used_credits as "usedCredits",
        is_premium as "isPremium",
        stripe_customer_id as "stripeCustomerId",
        stripe_subscription_id as "stripeSubscriptionId",
        subscription_status as "subscriptionStatus",
        subscription_plan as "subscriptionPlan",
        current_period_end as "currentPeriodEnd",
        cancel_at_period_end as "cancelAtPeriodEnd",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users 
      WHERE id = ${id} 
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error('Error finding user by ID:', error)
    return null
  }
}

// Create new user
async function createUser(userData) {
  try {
    if (!db.sql) {
      console.error('Database not initialized')
      return null
    }
    
    const hashedPassword = await hashPassword(userData.password)
    const email = userData.email.toLowerCase()
    const firstName = userData.firstName
    const lastName = userData.lastName
    
    const result = await db.sql`
      INSERT INTO users (
        email, 
        password, 
        first_name, 
        last_name, 
        email_verified, 
        free_credits, 
        used_credits
      )
      VALUES (
        ${email},
        ${hashedPassword},
        ${firstName},
        ${lastName},
        ${false},
        ${5},
        ${0}
      )
      RETURNING *
    `
    
    return result[0] || null
  } catch (error) {
    console.error('Error creating user:', error)
    // Check if it's a unique constraint error
    if (error.code === '23505') {
      return null // User already exists
    }
    throw error
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const user = await findUserByEmail(email)
    if (!user || !user.password) {
      return null
    }
    
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return null
    }
    
    const token = generateToken(user.id)
    
    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      token
    }
  } catch (error) {
    console.error('Error logging in user:', error)
    return null
  }
}

// Update user onboarding data
async function updateUserOnboarding(userId, onboardingData) {
  try {
    if (!db.sql) {
      console.error('Database not initialized')
      return null
    }
    
    console.log('Updating user onboarding for userId:', userId)
    console.log('Onboarding data received:', onboardingData)
    
    // Extract data from onboarding with proper defaults
    const {
      company,
      industry,
      role,
      audience,
      voice,
      bannedTerms,
      safety,
      primaryPlatforms,
      contentGoals,
      successfulHooks
    } = onboardingData
    
    // Update user with onboarding data and return complete user object
    const result = await db.sql`
      UPDATE users 
      SET 
        company = ${company || null},
        industry = ${industry || null},
        role = ${role || null},
        audience = ${audience || null},
        voice = ${voice || null},
        banned_terms = ${JSON.stringify(bannedTerms || [])},
        safety = ${safety || 'standard'},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING 
        id,
        email,
        firebase_uid as "firebaseUid",
        first_name as "firstName",
        last_name as "lastName",
        email_verified as "emailVerified",
        company,
        industry,
        role,
        audience,
        voice,
        banned_terms as "bannedTerms",
        safety,
        preferred_hook_categories as "preferredHookCategories",
        psychological_risk_tolerance as "psychologicalRiskTolerance",
        creativity_preference as "creativityPreference",
        urgency_preference as "urgencyPreference",
        personality_insights as "personalityInsights",
        pro_generations_used as "proGenerationsUsed",
        draft_generations_used as "draftGenerationsUsed",
        weekly_draft_reset as "weeklyDraftReset",
        free_credits as "freeCredits",
        used_credits as "usedCredits",
        is_premium as "isPremium",
        stripe_customer_id as "stripeCustomerId",
        stripe_subscription_id as "stripeSubscriptionId",
        subscription_status as "subscriptionStatus",
        subscription_plan as "subscriptionPlan",
        current_period_end as "currentPeriodEnd",
        cancel_at_period_end as "cancelAtPeriodEnd",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `
    
    const updatedUser = result[0]
    
    if (updatedUser) {
      console.log('User successfully updated:', {
        id: updatedUser.id,
        company: updatedUser.company,
        industry: updatedUser.industry,
        role: updatedUser.role,
        voice: updatedUser.voice
      })
    } else {
      console.error('No user returned after update for userId:', userId)
    }
    
    return updatedUser || null
  } catch (error) {
    console.error('Error updating user onboarding:', error)
    console.error('Error details:', {
      userId,
      onboardingData,
      errorMessage: error.message,
      errorStack: error.stack
    })
    throw error
  }
}

export {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  findUserByEmail,
  findUserById,
  createUser,
  loginUser,
  updateUserOnboarding
}