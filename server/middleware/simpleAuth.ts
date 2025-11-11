/**
 * @deprecated This file is DEPRECATED and should not be used.
 *
 * Legacy JWT authentication has been replaced with Clerk authentication.
 * Use clerkAuth from './clerkAuth.js' instead.
 *
 * This file is kept for reference only and may be removed in a future release.
 * Migration completed: 2025-01-11
 *
 * @see server/middleware/clerkAuth.ts
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { APIResponse } from '../../shared/types.js'
import { logSecurityEvent } from './logging.js'

// Extended Request interface with user data
export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    subscriptionStatus: string
    isPremium: boolean
  }
}

// Middleware to verify JWT token
export async function verifyJWTToken(
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

    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET not configured')
      return res.status(500).json({
        success: false,
        error: 'Authentication service configuration error',
        errorCode: 'JWT_SECRET_MISSING',
        userMessage: 'Authentication service is temporarily unavailable.',
        canRetry: true,
        actionRequired: ['Try again later', 'Contact support if issue persists']
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, secret) as any
    
    // Find user in database
    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1)
    
    if (userResult.length === 0) {
      logSecurityEvent('user_not_found', {
        userId: decoded.userId,
        endpoint: req.path,
        ipAddress: req.ip
      })
      return res.status(401).json({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
        userMessage: 'Your account could not be found. Please sign in again.',
        canRetry: false,
        actionRequired: ['Sign in again', 'Contact support if you believe this is an error']
      })
    }

    const user = userResult[0]
    
    // Attach user to request
    ;(req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus || 'free',
      isPremium: user.isPremium || false
    }

    next()
  } catch (error) {
    console.error('JWT verification error:', error)
    
    logSecurityEvent('jwt_verification_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      ipAddress: req.ip,
      tokenPresent: !!extractToken(req)
    })

    // Enhanced error responses based on JWT error types
    let errorResponse = {
      success: false,
      error: 'Authentication failed',
      errorCode: 'TOKEN_INVALID',
      userMessage: 'Your session is invalid. Please sign in again.',
      canRetry: false,
      actionRequired: ['Sign in again']
    }

    if (error instanceof jwt.TokenExpiredError) {
      errorResponse = {
        success: false,
        error: 'Token expired',
        errorCode: 'TOKEN_EXPIRED',
        userMessage: 'Your session has expired. Please sign in again.',
        canRetry: false,
        actionRequired: ['Sign in again']
      }
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorResponse = {
        success: false,
        error: 'Invalid token',
        errorCode: 'TOKEN_MALFORMED',
        userMessage: 'Your session is invalid. Please sign in again.',
        canRetry: false,
        actionRequired: ['Sign in again']
      }
    }

    return res.status(401).json(errorResponse)
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

    const secret = process.env.JWT_SECRET
    if (!secret) {
      return next() // Continue without authentication if JWT secret not configured
    }

    try {
      const decoded = jwt.verify(token, secret) as any
      const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1)
      
      if (userResult.length > 0) {
        const user = userResult[0]
        ;(req as AuthenticatedRequest).user = {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus || 'free',
          isPremium: user.isPremium || false
        }
      }
    } catch {
      // Ignore authentication errors in optional auth
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
      error: 'Authentication required',
      errorCode: 'AUTH_REQUIRED',
      userMessage: 'Please sign in to access premium features.',
      canRetry: false,
      actionRequired: ['Sign in to your account']
    })
  }

  if (!authReq.user.isPremium && authReq.user.subscriptionStatus === 'free') {
    return res.status(403).json({
      success: false,
      error: 'Premium subscription required',
      errorCode: 'PREMIUM_REQUIRED',
      userMessage: 'This feature requires a premium subscription.',
      canRetry: false,
      actionRequired: ['Upgrade to premium', 'View pricing plans']
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