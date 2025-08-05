import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { logger, logSecurityEvent } from './logging.js'
import { APIResponse } from '../../shared/types.js'

// Custom error classes
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.name = 'AppError'

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429)
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  public service: string
  public canRetry: boolean
  public retryAfter?: number

  constructor(service: string, message: string = 'External service error', canRetry: boolean = true, retryAfter?: number) {
    super(`${service}: ${message}`, 502)
    this.name = 'ExternalServiceError'
    this.service = service
    this.canRetry = canRetry
    this.retryAfter = retryAfter
  }
}

export class ServiceUnavailableError extends AppError {
  public service: string
  public canRetry: boolean
  public retryAfter?: number

  constructor(service: string, message: string = 'Service temporarily unavailable', retryAfter: number = 60) {
    super(`${service} service: ${message}`, 503)
    this.name = 'ServiceUnavailableError'
    this.service = service
    this.canRetry = true
    this.retryAfter = retryAfter
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message: string = 'Database connection failed') {
    super(message, 503)
    this.name = 'DatabaseConnectionError'
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Authentication token has expired') {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

// Global error handler
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction
) {
  // Set default error values
  let statusCode = 500
  let message = 'Internal server error'
  let isOperational = false

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    isOperational = err.isOperational
  } else if (err instanceof z.ZodError) {
    statusCode = 400
    message = 'Validation error'
    isOperational = true
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Authentication required'
    isOperational = true
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413
    message = 'File too large'
    isOperational = true
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400
    message = 'Invalid JSON in request body'
    isOperational = true
  }

  // Log security events for certain errors
  if (statusCode === 401 || statusCode === 403) {
    logSecurityEvent('authentication_failure', {
      error: message,
      statusCode,
      path: req.path,
      method: req.method
    }, req)
  }

  // Log the error (operational errors at info level, programming errors at error level)
  if (isOperational) {
    logger.info('Operational error', {
      message,
      statusCode,
      path: req.path,
      method: req.method,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  } else {
    logger.error('Programming error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    })
  }

  // Create enhanced error response
  const response: APIResponse & {
    errorCode?: string
    userMessage?: string
    canRetry?: boolean
    retryAfter?: number
    actionRequired?: string[]
  } = {
    success: false,
    error: message
  }

  // Add user-friendly error information
  if (err instanceof AuthenticationError) {
    response.errorCode = 'AUTHENTICATION_REQUIRED'
    response.userMessage = 'Please sign in to access this resource.'
    response.canRetry = false
    response.actionRequired = ['Sign in to your account']
  } else if (err instanceof AuthorizationError) {
    response.errorCode = 'INSUFFICIENT_PERMISSIONS'
    response.userMessage = 'You don\'t have permission to perform this action.'
    response.canRetry = false
    response.actionRequired = ['Contact support if you believe this is an error']
  } else if (err instanceof ValidationError) {
    response.errorCode = 'VALIDATION_ERROR'
    response.userMessage = 'The information provided is invalid. Please check and try again.'
    response.canRetry = true
    response.actionRequired = ['Check your input and try again']
  } else if (err instanceof RateLimitError) {
    response.errorCode = 'RATE_LIMITED'
    response.userMessage = 'Too many requests. Please wait before trying again.'
    response.canRetry = true
    response.retryAfter = 60
    response.actionRequired = ['Wait a moment before trying again']
  } else if (err instanceof ExternalServiceError) {
    response.errorCode = 'EXTERNAL_SERVICE_ERROR'
    response.userMessage = `${err.service} service is temporarily unavailable. Please try again.`
    response.canRetry = err.canRetry
    response.retryAfter = err.retryAfter
    response.actionRequired = ['Try again in a few moments', 'Contact support if issue persists']
  } else if (err instanceof ServiceUnavailableError) {
    response.errorCode = 'SERVICE_UNAVAILABLE'
    response.userMessage = `${err.service} is temporarily unavailable. Please try again later.`
    response.canRetry = err.canRetry
    response.retryAfter = err.retryAfter
    response.actionRequired = ['Try again in a few minutes']
  } else if (err instanceof DatabaseConnectionError) {
    response.errorCode = 'DATABASE_CONNECTION'
    response.userMessage = 'Our servers are experiencing database issues. Please try again shortly.'
    response.canRetry = true
    response.retryAfter = 30
    response.actionRequired = ['Try again in a few minutes', 'Contact support if issue persists']
  } else if (err instanceof TokenExpiredError) {
    response.errorCode = 'TOKEN_EXPIRED'
    response.userMessage = 'Your session has expired. Please sign in again.'
    response.canRetry = false
    response.actionRequired = ['Sign in again']
  } else if (err instanceof NotFoundError) {
    response.errorCode = 'NOT_FOUND'
    response.userMessage = 'The requested resource was not found.'
    response.canRetry = false
    response.actionRequired = ['Check the URL and try again']
  } else if (statusCode === 500) {
    response.errorCode = 'INTERNAL_SERVER_ERROR'
    response.userMessage = 'Something went wrong on our end. Please try again later.'
    response.canRetry = true
    response.retryAfter = 60
    response.actionRequired = ['Try again later', 'Contact support if issue persists']
  } else if (statusCode >= 500) {
    response.errorCode = 'SERVER_ERROR'
    response.userMessage = 'Our servers are experiencing issues. Please try again later.'
    response.canRetry = true
    response.retryAfter = 60
    response.actionRequired = ['Try again later']
  }

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    response.data = {
      stack: err.stack,
      details: err
    }
  }

  // Add Zod validation details
  if (err instanceof z.ZodError) {
    response.errorCode = 'VALIDATION_ERROR'
    response.userMessage = 'The information provided is invalid. Please check and try again.'
    response.canRetry = true
    response.data = {
      issues: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    }
    response.actionRequired = ['Check the highlighted fields and try again']
  }

  res.status(statusCode).json(response)
}

// 404 handler
export function notFoundHandler(req: Request, res: Response<APIResponse>) {
  const message = `Route ${req.originalUrl} not found`
  
  logger.info('Route not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  })

  res.status(404).json({
    success: false,
    error: message
  })
}

// Async error wrapper
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise
  })
  
  // Don't exit in production to avoid downtime
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  })
  
  // Exit process for uncaught exceptions
  process.exit(1)
})