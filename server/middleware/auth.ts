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
        error: 'No authentication token provided'
      })
    }

    if (!FirebaseService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Firebase authentication not configured'
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
        error: 'User synchronization failed'
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

    return res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid authentication token'
    })
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