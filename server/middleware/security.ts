import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'

// Production security headers
export function productionSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove server identification
  res.removeHeader('X-Powered-By')
  
  // Security headers for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  }
  
  next()
}

// API-specific rate limiting for production
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More restrictive in production
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health'
  }
})

// Stricter rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Very restrictive for auth
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many failed authentication attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
})

// Payment endpoint rate limiting
export const paymentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: {
    error: 'Too many payment requests',
    message: 'Payment rate limit exceeded. Please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Hook generation rate limiting (resource intensive)
export const hookGenerationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: {
    error: 'Hook generation rate limit exceeded',
    message: 'You have reached the hook generation limit. Please try again later.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// IP-based suspicious activity detection
const suspiciousIPs = new Set<string>()
const ipAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function suspiciousActivityDetection(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown'
  
  // Check if IP is already flagged as suspicious
  if (suspiciousIPs.has(clientIP)) {
    return res.status(429).json({
      error: 'Access denied',
      message: 'Your IP has been temporarily blocked due to suspicious activity.'
    })
  }
  
  // Track failed attempts
  if (req.path.includes('/auth/') && req.method === 'POST') {
    const now = Date.now()
    const attempts = ipAttempts.get(clientIP) || { count: 0, lastAttempt: now }
    
    // Reset counter if last attempt was more than 1 hour ago
    if (now - attempts.lastAttempt > 60 * 60 * 1000) {
      attempts.count = 0
    }
    
    attempts.count++
    attempts.lastAttempt = now
    ipAttempts.set(clientIP, attempts)
    
    // Flag IP as suspicious after 10 failed attempts
    if (attempts.count > 10) {
      suspiciousIPs.add(clientIP)
      
      // Auto-remove from suspicious list after 24 hours
      setTimeout(() => {
        suspiciousIPs.delete(clientIP)
        ipAttempts.delete(clientIP)
      }, 24 * 60 * 60 * 1000)
    }
  }
  
  next()
}

// Request size limiting
export function requestSizeLimit(req: Request, res: Response, next: NextFunction) {
  const contentLength = parseInt(req.headers['content-length'] || '0')
  const maxSize = 10 * 1024 * 1024 // 10MB limit
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request body exceeds maximum allowed size.',
      maxSize: '10MB'
    })
  }
  
  next()
}

// Validate content type for API endpoints
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type']
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Missing content type',
        message: 'Content-Type header is required for this request.'
      })
    }
    
    // Allow JSON and form data
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ]
    
    const isValidContentType = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type)
    )
    
    if (!isValidContentType) {
      return res.status(415).json({
        error: 'Unsupported media type',
        message: 'Content-Type not supported.',
        supported: allowedTypes
      })
    }
  }
  
  next()
}

// Sanitize request headers
export function sanitizeHeaders(req: Request, res: Response, next: NextFunction) {
  // Remove potentially dangerous headers
  const dangerousHeaders = [
    'x-forwarded-host',
    'x-forwarded-server',
    'x-real-ip'
  ]
  
  dangerousHeaders.forEach(header => {
    if (req.headers[header] && process.env.NODE_ENV === 'production') {
      delete req.headers[header]
    }
  })
  
  next()
}

// CORS security for production
export function productionCORS(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  
  if (process.env.NODE_ENV === 'production') {
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: 'CORS policy violation',
        message: 'Origin not allowed by CORS policy.'
      })
    }
  }
  
  next()
}