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
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502)
    this.name = 'ExternalServiceError'
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

  // Send error response
  const response: APIResponse = {
    success: false,
    error: message
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
    response.data = {
      issues: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    }
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