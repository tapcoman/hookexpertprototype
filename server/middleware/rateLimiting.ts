import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import { AuthenticatedRequest } from './auth.js'
import { APIResponse } from '../../shared/types.js'

// Global rate limiting
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Authentication rate limiting
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
})

// Hook generation rate limiting (stricter for free users)
export const hookGenerationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    if (!authReq.user) return 2 // Anonymous users
    if (authReq.user.isPremium) return 10 // Premium users
    return 3 // Free users
  },
  message: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    const isPremium = authReq.user?.isPremium
    return {
      success: false,
      error: isPremium 
        ? 'Rate limit exceeded. Premium users can generate up to 10 hooks per minute.'
        : 'Rate limit exceeded. Free users can generate up to 3 hooks per minute. Upgrade to Premium for higher limits.'
    }
  },
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    return authReq.user?.id || req.ip
  },
})

// API endpoint rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    if (!authReq.user) return 20 // Anonymous users
    if (authReq.user.isPremium) return 200 // Premium users
    return 60 // Free users
  },
  message: {
    success: false,
    error: 'API rate limit exceeded. Please try again later.'
  },
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    return authReq.user?.id || req.ip
  },
})

// Analytics events rate limiting
export const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 events per minute
  message: {
    success: false,
    error: 'Analytics rate limit exceeded.'
  },
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    return authReq.user?.id || req.ip
  },
})

// Heavy operation rate limiting (for computationally expensive endpoints)
export const heavyOperationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    if (!authReq.user) return 1 // Anonymous users
    if (authReq.user.isPremium) return 10 // Premium users
    return 3 // Free users
  },
  message: {
    success: false,
    error: 'Heavy operation rate limit exceeded. Please wait before trying again.'
  },
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest
    return authReq.user?.id || req.ip
  },
})

// Create dynamic rate limiter based on subscription tier
export function createTieredRateLimit(options: {
  windowMs: number
  anonymousMax: number
  freeMax: number
  premiumMax: number
  message?: string
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: (req: Request) => {
      const authReq = req as AuthenticatedRequest
      if (!authReq.user) return options.anonymousMax
      if (authReq.user.isPremium) return options.premiumMax
      return options.freeMax
    },
    message: {
      success: false,
      error: options.message || 'Rate limit exceeded'
    },
    keyGenerator: (req: Request) => {
      const authReq = req as AuthenticatedRequest
      return authReq.user?.id || req.ip
    },
  })
}