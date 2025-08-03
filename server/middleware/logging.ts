import winston from 'winston'
import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth.js'

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hook-line-studio-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
})

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const authReq = req as AuthenticatedRequest
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: authReq.user?.id,
    timestamp: new Date().toISOString()
  })

  // Override res.end to log response
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start
    
    // Log request completion
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: authReq.user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    })

    // Log slow requests
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration,
        userId: authReq.user?.id
      })
    }

    originalEnd.call(this, chunk, encoding)
  }

  next()
}

// Error logging middleware
export function errorLogger(err: any, req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest
  
  logger.error('Request error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: authReq.user?.id,
      body: req.method !== 'GET' ? req.body : undefined
    },
    timestamp: new Date().toISOString()
  })

  next(err)
}

// Security event logger
export function logSecurityEvent(event: string, details: any, req?: Request) {
  const authReq = req as AuthenticatedRequest
  
  logger.warn('Security event', {
    event,
    details,
    request: req ? {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: authReq?.user?.id
    } : undefined,
    timestamp: new Date().toISOString()
  })
}

// Business event logger
export function logBusinessEvent(event: string, details: any, userId?: string) {
  logger.info('Business event', {
    event,
    details,
    userId,
    timestamp: new Date().toISOString()
  })
}

// Performance logger
export function logPerformanceMetric(metric: string, value: number, context?: any, userId?: string) {
  logger.info('Performance metric', {
    metric,
    value,
    context,
    userId,
    timestamp: new Date().toISOString()
  })
}

// AI service logger
export function logAIServiceCall(service: string, details: any, userId?: string) {
  logger.info('AI service call', {
    service,
    details: {
      ...details,
      // Don't log sensitive data
      apiKey: details.apiKey ? '[REDACTED]' : undefined
    },
    userId,
    timestamp: new Date().toISOString()
  })
}

export { logger }