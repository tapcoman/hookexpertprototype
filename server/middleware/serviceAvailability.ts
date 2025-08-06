import { Request, Response, NextFunction } from 'express'
import { StartupValidator } from '../config/simpleStartup.js'
import { AppError } from './errorHandler.js'
import { APIResponse } from '../../shared/types.js'

// Service requirement levels
export type ServiceRequirement = 'required' | 'optional' | 'degraded'

// Service availability check middleware factory
export function requireService(serviceName: string, requirement: ServiceRequirement = 'required') {
  return (req: Request, res: Response, next: NextFunction) => {
    const serviceStatus = StartupValidator.getServiceStatus(serviceName)
    const serviceAvailable = serviceStatus?.status === 'healthy'
    
    switch (requirement) {
      case 'required':
        if (!serviceAvailable) {
          const response: APIResponse = {
            success: false,
            error: `${serviceName} service is currently unavailable. Please try again later.`,
            data: {
              service: serviceName,
              status: 'unavailable',
              retryAfter: 300 // 5 minutes
            }
          }
          return res.status(503).json(response)
        }
        break
        
      case 'degraded':
        if (!serviceAvailable) {
          // Add service unavailability to request context
          req.serviceStatus = req.serviceStatus || {}
          req.serviceStatus[serviceName] = 'unavailable'
        }
        break
        
      case 'optional':
        // Always proceed, but add service status to request context
        req.serviceStatus = req.serviceStatus || {}
        req.serviceStatus[serviceName] = serviceAvailable ? 'available' : 'unavailable'
        break
    }
    
    next()
  }
}

// Database availability middleware
export const requireDatabase = requireService('PostgreSQL Database', 'required')
export const optionalDatabase = requireService('PostgreSQL Database', 'optional')

// Authentication availability middleware  
export const requireAuth = requireService('JWT Authentication', 'required')
export const optionalAuth = requireService('JWT Authentication', 'optional')
export const degradedAuth = requireService('JWT Authentication', 'degraded')

// Stripe availability middleware
export const requireStripe = requireService('Stripe Payments', 'required')
export const optionalStripe = requireService('Stripe Payments', 'optional')
export const degradedStripe = requireService('Stripe Payments', 'degraded')

// OpenAI availability middleware
export const requireOpenAI = requireService('OpenAI API', 'required')
export const optionalOpenAI = requireService('OpenAI API', 'optional')
export const degradedOpenAI = requireService('OpenAI API', 'degraded')

// Service status checker middleware
export function serviceStatusChecker(req: Request, res: Response, next: NextFunction) {
  // Add service statuses to request for handlers to use
  req.serviceStatus = {
    database: StartupValidator.isServiceHealthy('PostgreSQL Database') ? 'available' : 'unavailable',
    auth: StartupValidator.isServiceHealthy('JWT Authentication') ? 'available' : 'unavailable',
    stripe: StartupValidator.isServiceHealthy('Stripe Payments') ? 'available' : 'unavailable',
    openai: StartupValidator.isServiceHealthy('OpenAI API') ? 'available' : 'unavailable'
  }
  
  next()
}

// Helper function to check if service is available in route handlers
export function isServiceAvailable(req: Request, serviceName: string): boolean {
  return req.serviceStatus?.[serviceName.toLowerCase()] === 'available'
}

// Helper function to handle service unavailability gracefully
export function handleServiceUnavailable(
  serviceName: string, 
  fallbackMessage?: string
): never {
  const message = fallbackMessage || `${serviceName} service is currently unavailable`
  throw new AppError(message, 503)
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      serviceStatus?: Record<string, string>
    }
  }
}