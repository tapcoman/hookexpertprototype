import { Request, Response, NextFunction } from 'express'
import { createClerkClient } from '@clerk/clerk-sdk-node'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { APIResponse } from '../../shared/types.js'
import { logSecurityEvent } from './logging.js'

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Extended Request interface for Clerk authentication
export interface ClerkAuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    subscriptionStatus: string
    isPremium: boolean
  }
  clerkUserId?: string
}

/**
 * Extract Clerk token from Authorization header
 * Clerk tokens start with "Bearer " and typically contain a JWT
 */
function extractClerkToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

/**
 * Check if token is a Clerk token vs legacy JWT
 * Clerk session tokens are longer and have different structure
 * @deprecated No longer needed - only Clerk authentication is supported
 */
function isClerkToken(token: string): boolean {
  // Clerk tokens are typically longer (>200 chars) and contain specific prefixes in payload
  // Legacy JWTs are shorter and simpler
  // This is a heuristic - actual verification happens in clerkAuth
  return token.length > 200
}

/**
 * Middleware to verify Clerk session token
 *
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify session token with Clerk
 * 3. Get user data from Clerk
 * 4. Find or sync user in local database by clerkId
 * 5. Attach user to req.user
 */
export async function verifyClerkToken(
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction
) {
  try {
    console.log('🔍 [ClerkAuth] Middleware called for:', req.method, req.path)
    console.log('🔍 [ClerkAuth] Authorization header:', req.headers.authorization ? 'Present' : 'Missing')

    const token = extractClerkToken(req)

    if (!token) {
      console.error('❌ [ClerkAuth] No token extracted from request')
      logSecurityEvent('clerk_token_missing', {
        endpoint: req.path,
        method: req.method,
        ipAddress: req.ip,
        authHeader: req.headers.authorization
      })

      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        errorCode: 'TOKEN_MISSING',
        userMessage: 'Please sign in to access this resource.',
        canRetry: false,
        actionRequired: ['Sign in to your account']
      } as any)
    }

    console.log('✓ [ClerkAuth] Token extracted successfully')

    // Check if Clerk is configured
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      console.error('CLERK_SECRET_KEY not configured')
      return res.status(500).json({
        success: false,
        error: 'Authentication service configuration error',
        errorCode: 'CLERK_NOT_CONFIGURED',
        userMessage: 'Authentication service is temporarily unavailable.',
        canRetry: true,
        actionRequired: ['Try again later', 'Contact support if issue persists']
      } as any)
    }

    // Verify the session token with Clerk
    // The token is a JWT that contains the session ID
    let clerkUserId: string
    let clerkUser

    try {
      // Clerk session tokens are JWTs that can be verified
      // Use verifyToken to check signature and extract claims
      console.log('🔐 [ClerkAuth] Verifying token:', token.substring(0, 30) + '...')
      console.log('🔐 [ClerkAuth] Token length:', token.length)

      const verifiedToken = await clerkClient.verifyToken(token)

      console.log('✅ [ClerkAuth] Token verified successfully')
      console.log('📋 [ClerkAuth] Verified token payload:', JSON.stringify(verifiedToken, null, 2))

      // Extract user ID from verified token
      clerkUserId = verifiedToken.sub as string

      if (!clerkUserId) {
        console.error('❌ [ClerkAuth] No user ID in verified token')
        throw new Error('No user ID in token')
      }

      console.log('👤 [ClerkAuth] Clerk user ID:', clerkUserId)

      // Get user details from Clerk
      clerkUser = await clerkClient.users.getUser(clerkUserId)
      console.log('✅ [ClerkAuth] User fetched from Clerk:', clerkUser.id, clerkUser.primaryEmailAddressId)
    } catch (clerkError: any) {
      console.error('❌ [ClerkAuth] Token verification failed:', {
        error: clerkError.message,
        stack: clerkError.stack,
        name: clerkError.name,
        endpoint: req.path
      })

      logSecurityEvent('clerk_verification_failed', {
        error: clerkError.message,
        errorName: clerkError.name,
        endpoint: req.path,
        ipAddress: req.ip
      })

      return res.status(401).json({
        success: false,
        error: 'Invalid Clerk session',
        errorCode: 'CLERK_VERIFICATION_FAILED',
        userMessage: 'Your session is invalid. Please sign in again.',
        canRetry: false,
        debugInfo: process.env.NODE_ENV === 'development' ? clerkError.message : undefined
      } as any)
    }

    // Extract email from Clerk user
    const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'No email address found',
        errorCode: 'CLERK_NO_EMAIL',
        userMessage: 'Your account does not have an email address.',
        canRetry: false,
        actionRequired: ['Contact support']
      } as any)
    }

    // Find user in local database by Clerk ID or email
    // First try by clerkId (firebaseUid column repurposed), then by email
    let userResult = await db.select()
      .from(users)
      .where(eq(users.firebaseUid, clerkUserId))
      .limit(1)

    let user
    if (userResult.length === 0) {
      // User not found by clerkId, try by email
      userResult = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (userResult.length === 0) {
        // User doesn't exist - this should be created by webhook
        // For now, return a minimal user object
        // In production, webhook should create user before they can authenticate
        logSecurityEvent('clerk_user_not_synced', {
          clerkUserId,
          email,
          endpoint: req.path,
          ipAddress: req.ip
        })

        // Attach minimal user data for now
        // The webhook should sync the user properly
        ;(req as ClerkAuthenticatedRequest).user = {
          id: clerkUserId, // Temporary - use Clerk ID
          email: email,
          subscriptionStatus: 'free',
          isPremium: false
        }
        ;(req as ClerkAuthenticatedRequest).clerkUserId = clerkUserId

        return next()
      }

      // User found by email but not clerkId - update the clerkId
      user = userResult[0]
      await db.update(users)
        .set({ firebaseUid: clerkUserId })
        .where(eq(users.id, user.id))

      logSecurityEvent('clerk_user_linked', {
        userId: user.id,
        clerkUserId,
        email,
        endpoint: req.path
      })
    } else {
      user = userResult[0]
    }

    // Attach user to request
    ;(req as ClerkAuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus || 'free',
      isPremium: user.isPremium || false
    }
    ;(req as ClerkAuthenticatedRequest).clerkUserId = clerkUserId

    next()
  } catch (error) {
    console.error('Clerk authentication error:', error)

    logSecurityEvent('clerk_auth_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      ipAddress: req.ip
    })

    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      errorCode: 'CLERK_AUTH_ERROR',
      userMessage: 'An error occurred during authentication. Please try again.',
      canRetry: true,
      actionRequired: ['Try again', 'Contact support if issue persists']
    } as any)
  }
}

/**
 * Optional Clerk authentication middleware
 * Doesn't fail if no token or invalid token, but attaches user if valid
 * Useful for endpoints that work with or without authentication
 */
export async function optionalClerkAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractClerkToken(req)

    if (!token) {
      return next() // Continue without authentication
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      return next() // Continue without authentication if Clerk not configured
    }

    try {
      // Verify the session token with Clerk
      const verifiedToken = await clerkClient.verifyToken(token)
      const clerkUserId = verifiedToken.sub as string

      if (!clerkUserId) {
        return next() // Continue without authentication
      }

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId)
      const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress

      if (!email) {
        return next() // Continue without authentication
      }

      // Find user in local database
      let userResult = await db.select()
        .from(users)
        .where(eq(users.firebaseUid, clerkUserId))
        .limit(1)

      if (userResult.length === 0) {
        // Try by email
        userResult = await db.select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (userResult.length === 0) {
          // User doesn't exist, create minimal object
          ;(req as ClerkAuthenticatedRequest).user = {
            id: clerkUserId,
            email: email,
            subscriptionStatus: 'free',
            isPremium: false
          }
          ;(req as ClerkAuthenticatedRequest).clerkUserId = clerkUserId
          return next()
        }

        // Update clerkId if found by email
        const user = userResult[0]
        await db.update(users)
          .set({ firebaseUid: clerkUserId })
          .where(eq(users.id, user.id))

        ;(req as ClerkAuthenticatedRequest).user = {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus || 'free',
          isPremium: user.isPremium || false
        }
        ;(req as ClerkAuthenticatedRequest).clerkUserId = clerkUserId
      } else {
        const user = userResult[0]
        ;(req as ClerkAuthenticatedRequest).user = {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus || 'free',
          isPremium: user.isPremium || false
        }
        ;(req as ClerkAuthenticatedRequest).clerkUserId = clerkUserId
      }

      next()
    } catch (clerkError) {
      // Ignore Clerk errors in optional auth
      next()
    }
  } catch (error) {
    // Don't fail on optional auth errors
    next()
  }
}

/**
 * Primary authentication middleware - renamed for clarity
 */
export const clerkAuth = verifyClerkToken

/**
 * Type alias for backwards compatibility
 */
export type AuthenticatedRequest = ClerkAuthenticatedRequest

/**
 * Helper function to check if a token appears to be a Clerk token
 * @deprecated No longer needed - only Clerk authentication is supported
 */
export { isClerkToken }
