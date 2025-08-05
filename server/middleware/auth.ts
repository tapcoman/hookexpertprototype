import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import admin from 'firebase-admin'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { APIResponse } from '../../shared/types.js'
import { FirebaseService } from '../services/firebaseService.js'
import { logSecurityEvent } from './logging.js'

// Initialize Firebase Admin SDK
export function initializeFirebase() {
  return FirebaseService.initialize()
}

// Extended Request interface with user data
export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    firebaseUid?: string
    subscriptionStatus: string
    isPremium: boolean
  }
}

// Middleware to verify Firebase ID token
export async function verifyFirebaseToken(
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction
) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      logSecurityEvent('missing_auth_token', {
        endpoint: req.path,
        method: req.method,
        ipAddress: req.ip
      })
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        errorCode: 'TOKEN_MISSING',
        userMessage: 'Please sign in to access this resource.',
        canRetry: false,
        actionRequired: ['Sign in to your account']
      })
    }

    // Development bypass mode for Firebase authentication
    if (process.env.FIREBASE_BYPASS_MODE === 'true') {
      console.log('🚧 Firebase bypass mode active - creating mock user for development')
      
      // Create or get mock user from database
      let mockUser
      try {
        const existingUsers = await db.select().from(users).where(eq(users.email, 'dev@hookline.studio')).limit(1)
        
        if (existingUsers.length > 0) {
          mockUser = existingUsers[0]
        } else {
          // Create mock user
          const newUser = await db.insert(users).values({
            email: 'dev@hookline.studio',
            firebaseUid: 'mock-firebase-uid-dev',
            displayName: 'Development User',
            subscriptionStatus: 'premium',
            createdAt: new Date(),
            lastLoginAt: new Date()
          }).returning()
          mockUser = newUser[0]
        }
        
        // Attach mock user to request
        (req as AuthenticatedRequest).user = {
          id: mockUser.id,
          email: mockUser.email,
          firebaseUid: mockUser.firebaseUid || 'mock-firebase-uid-dev',
          subscriptionStatus: mockUser.subscriptionStatus,
          isPremium: mockUser.subscriptionStatus === 'premium' || mockUser.subscriptionStatus === 'pro'
        }
        
        console.log('✅ Mock user authenticated:', mockUser.email)
        return next()
        
      } catch (error) {
        console.error('Error creating mock user:', error)
        // Fall through to normal Firebase auth if mock fails
      }
    }

    if (!FirebaseService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Authentication service unavailable',
        errorCode: 'FIREBASE_CONFIG_ERROR',
        userMessage: 'Authentication service is temporarily unavailable. Please try again later.',
        canRetry: true,
        retryAfter: 60,
        actionRequired: ['Try again in a few minutes', 'Contact support if issue persists']
      })
    }

    // Verify Firebase token using enhanced service
    const decodedToken = await FirebaseService.verifyIdToken(token)
    
    // Sync user with database
    const user = await FirebaseService.syncUserWithDatabase(decodedToken)
    
    if (!user) {
      logSecurityEvent('user_not_found_after_sync', {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        ipAddress: req.ip
      })
      return res.status(401).json({
        success: false,
        error: 'User synchronization failed',
        errorCode: 'USER_SYNC_FAILED',
        userMessage: 'Unable to sync your user data. Please try signing in again.',
        canRetry: false,
        actionRequired: ['Sign out and sign in again', 'Contact support if issue persists']
      })
    }

    // Attach enhanced user data to request
    ;(req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      firebaseUid: user.firebaseUid || undefined,
      subscriptionStatus: user.subscriptionStatus || 'free',
      isPremium: user.isPremium || false
    }

    next()
  } catch (error) {
    console.error('Firebase authentication error:', error)
    
    logSecurityEvent('firebase_auth_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      ipAddress: req.ip
    })

    // Enhanced error responses based on Firebase error codes
    let errorResponse = {
      success: false,
      error: 'Authentication failed',
      errorCode: 'TOKEN_INVALID',
      userMessage: 'Your session is invalid. Please sign in again.',
      canRetry: false,
      actionRequired: ['Sign in again']
    }

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('expired') || error.message.includes('exp')) {
        errorResponse = {
          success: false,
          error: 'Token expired',
          errorCode: 'TOKEN_EXPIRED',
          userMessage: 'Your session has expired. Please sign in again.',
          canRetry: false,
          actionRequired: ['Sign in again']
        }
      } else if (errorMessage.includes('revoked')) {
        errorResponse = {
          success: false,
          error: 'Token revoked',
          errorCode: 'TOKEN_REVOKED',
          userMessage: 'Your session has been revoked. Please sign in again.',
          canRetry: false,
          actionRequired: ['Sign in again']
        }
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorResponse = {
          success: false,
          error: 'Firebase service error',
          errorCode: 'FIREBASE_UNAVAILABLE',
          userMessage: 'Authentication service is temporarily unavailable. Please try again.',
          canRetry: true,
          retryAfter: 30,
          actionRequired: ['Try again in a few moments', 'Check your internet connection']
        }
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        errorResponse = {
          success: false,
          error: 'Service quota exceeded',
          errorCode: 'FIREBASE_QUOTA_EXCEEDED',
          userMessage: 'Authentication service is temporarily overloaded. Please try again later.',
          canRetry: true,
          retryAfter: 300,
          actionRequired: ['Try again in a few minutes']
        }
      }
    }

    return res.status(401).json(errorResponse)
  }
}

// Middleware to verify JWT token (for API keys or internal tokens)
export async function verifyJWTToken(
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction
) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      return res.status(500).json({
        success: false,
        error: 'JWT secret not configured'
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, secret) as any
    
    // Find user in database
    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1)
    
    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      })
    }

    const user = userResult[0]
    
    // Attach user to request
    ;(req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      firebaseUid: user.firebaseUid || undefined,
      subscriptionStatus: user.subscriptionStatus || 'free',
      isPremium: user.isPremium || false
    }

    next()
  } catch (error) {
    console.error('JWT verification error:', error)
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    })
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return next() // Continue without authentication
    }

    // Try Firebase authentication first
    if (FirebaseService.isConfigured()) {
      try {
        const decodedToken = await FirebaseService.verifyIdToken(token)
        const user = await FirebaseService.syncUserWithDatabase(decodedToken)
        
        if (user) {
          ;(req as AuthenticatedRequest).user = {
            id: user.id,
            email: user.email,
            firebaseUid: user.firebaseUid || undefined,
            subscriptionStatus: user.subscriptionStatus || 'free',
            isPremium: user.isPremium || false
          }
        }
      } catch {
        // Try JWT authentication as fallback
        const secret = process.env.JWT_SECRET
        if (secret) {
          try {
            const decoded = jwt.verify(token, secret) as any
            const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1)
            
            if (userResult.length > 0) {
              const user = userResult[0]
              ;(req as AuthenticatedRequest).user = {
                id: user.id,
                email: user.email,
                firebaseUid: user.firebaseUid || undefined,
                subscriptionStatus: user.subscriptionStatus || 'free',
                isPremium: user.isPremium || false
              }
            }
          } catch {
            // Ignore authentication errors in optional auth
          }
        }
      }
    }

    next()
  } catch (error) {
    // Don't fail on optional auth errors
    next()
  }
}

// Check if user has premium subscription
export function requirePremium(
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction
) {
  const authReq = req as AuthenticatedRequest
  
  if (!authReq.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }

  if (!authReq.user.isPremium && authReq.user.subscriptionStatus === 'free') {
    return res.status(403).json({
      success: false,
      error: 'Premium subscription required'
    })
  }

  next()
}

// Extract token from Authorization header or query parameter
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check query parameter
  const queryToken = req.query.token as string
  if (queryToken) {
    return queryToken
  }

  return null
}

// Generate JWT token for user
export function generateJWTToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT secret not configured')
  }

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' }
  )
}