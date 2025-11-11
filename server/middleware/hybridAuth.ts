import { Request, Response, NextFunction } from 'express'
import { verifyJWTToken, AuthenticatedRequest } from './simpleAuth.js'
import { verifyClerkToken, isClerkToken, ClerkAuthenticatedRequest } from './clerkAuth.js'
import { APIResponse } from '../../shared/types.js'
import { logSecurityEvent } from './logging.js'

/**
 * Hybrid Authentication Middleware
 *
 * Accepts BOTH legacy JWT tokens AND Clerk session tokens
 * This allows for gradual migration from custom JWT to Clerk
 *
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Determine if it's a Clerk token or legacy JWT (heuristic)
 * 3. Try Clerk verification first if token looks like Clerk token
 * 4. Fall back to legacy JWT if Clerk fails or token looks like JWT
 * 5. If both fail, return 401
 * 6. Attach user to req.user (same shape for both auth methods)
 *
 * Token Detection Strategy:
 * - Clerk tokens are typically longer (>200 chars) and have specific JWT structure
 * - Legacy JWTs are shorter and simpler
 * - First check token length/structure heuristic
 * - Then attempt verification with appropriate method
 * - Fall back to other method if first fails
 */
export async function hybridAuth(
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction
) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null

  if (!token) {
    logSecurityEvent('hybrid_auth_no_token', {
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
    } as any)
  }

  // Determine which auth method to try first based on token characteristics
  const useClerkFirst = isClerkToken(token)

  logSecurityEvent('hybrid_auth_attempt', {
    endpoint: req.path,
    method: req.method,
    tokenType: useClerkFirst ? 'clerk' : 'jwt',
    ipAddress: req.ip
  })

  // Track which auth method succeeded for logging
  let authMethod: 'clerk' | 'jwt' | 'none' = 'none'

  // Try Clerk first if token appears to be from Clerk
  if (useClerkFirst) {
    try {
      let clerkSucceeded = false
      await verifyClerkToken(req, res, () => {
        clerkSucceeded = true
        authMethod = 'clerk'
      })

      // If verifyClerkToken succeeded (didn't send response), continue
      if (clerkSucceeded && !res.headersSent) {
        logSecurityEvent('hybrid_auth_success', {
          method: 'clerk',
          userId: (req as ClerkAuthenticatedRequest).user?.id,
          endpoint: req.path
        })
        return next()
      }
    } catch (clerkError) {
      // Clerk verification failed, try JWT fallback
      console.log('Clerk verification failed, trying JWT fallback:', clerkError)
    }

    // If response was already sent by verifyClerkToken (error case), stop here
    if (res.headersSent) {
      return
    }
  }

  // Try JWT (either first if not Clerk-like, or as fallback)
  try {
    let jwtSucceeded = false
    await verifyJWTToken(req, res, () => {
      jwtSucceeded = true
      authMethod = 'jwt'
    })

    // If verifyJWTToken succeeded (didn't send response), continue
    if (jwtSucceeded && !res.headersSent) {
      logSecurityEvent('hybrid_auth_success', {
        method: 'jwt',
        userId: (req as AuthenticatedRequest).user?.id,
        endpoint: req.path
      })
      return next()
    }
  } catch (jwtError) {
    // JWT verification failed
    console.log('JWT verification failed:', jwtError)
  }

  // If response was already sent by verifyJWTToken (error case), stop here
  if (res.headersSent) {
    return
  }

  // If we tried JWT first and it failed, try Clerk as fallback
  if (!useClerkFirst) {
    try {
      let clerkSucceeded = false
      await verifyClerkToken(req, res, () => {
        clerkSucceeded = true
        authMethod = 'clerk'
      })

      // If verifyClerkToken succeeded (didn't send response), continue
      if (clerkSucceeded && !res.headersSent) {
        logSecurityEvent('hybrid_auth_success', {
          method: 'clerk',
          userId: (req as ClerkAuthenticatedRequest).user?.id,
          endpoint: req.path
        })
        return next()
      }
    } catch (clerkError) {
      // Clerk verification also failed
      console.log('Clerk verification also failed:', clerkError)
    }
  }

  // If response was already sent, stop here
  if (res.headersSent) {
    return
  }

  // Both authentication methods failed
  logSecurityEvent('hybrid_auth_failed', {
    endpoint: req.path,
    method: req.method,
    ipAddress: req.ip,
    triedClerk: true,
    triedJWT: true
  })

  return res.status(401).json({
    success: false,
    error: 'Authentication failed',
    errorCode: 'AUTH_FAILED',
    userMessage: 'Your session is invalid. Please sign in again.',
    canRetry: false,
    actionRequired: ['Sign in again']
  } as any)
}

/**
 * Optional hybrid authentication middleware
 * Similar to hybridAuth but doesn't fail if no token or invalid token
 * Useful for endpoints that work with or without authentication
 */
export async function optionalHybridAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null

  if (!token) {
    return next() // Continue without authentication
  }

  // Try authentication but don't fail if it doesn't work
  const useClerkFirst = isClerkToken(token)

  // Try Clerk first if appropriate
  if (useClerkFirst) {
    try {
      let clerkSucceeded = false
      await verifyClerkToken(req, res, () => {
        clerkSucceeded = true
      })

      if (clerkSucceeded && !res.headersSent) {
        return next()
      }

      if (res.headersSent) {
        return // Error response was sent
      }
    } catch {
      // Ignore Clerk errors in optional auth
    }
  }

  // Try JWT
  try {
    let jwtSucceeded = false
    await verifyJWTToken(req, res, () => {
      jwtSucceeded = true
    })

    if (jwtSucceeded && !res.headersSent) {
      return next()
    }

    if (res.headersSent) {
      return // Error response was sent
    }
  } catch {
    // Ignore JWT errors in optional auth
  }

  // Try Clerk as fallback if JWT was tried first
  if (!useClerkFirst) {
    try {
      let clerkSucceeded = false
      await verifyClerkToken(req, res, () => {
        clerkSucceeded = true
      })

      if (clerkSucceeded && !res.headersSent) {
        return next()
      }
    } catch {
      // Ignore Clerk errors in optional auth
    }
  }

  // Continue without authentication if all methods failed
  next()
}
