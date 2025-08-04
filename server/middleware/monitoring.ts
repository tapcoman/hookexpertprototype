import { Request, Response, NextFunction } from 'express'

// Performance monitoring
interface PerformanceMetrics {
  requestCount: number
  averageResponseTime: number
  errorCount: number
  slowRequests: number
  memoryUsage: NodeJS.MemoryUsage
  uptime: number
}

class ProductionMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorCount: 0,
    slowRequests: 0,
    memoryUsage: process.memoryUsage(),
    uptime: Date.now()
  }

  private responseTimes: number[] = []
  private readonly maxResponseTimeHistory = 1000

  recordRequest(responseTime: number) {
    this.metrics.requestCount++
    this.responseTimes.push(responseTime)

    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift()
    }

    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length

    if (responseTime > 3000) { // Slow request threshold: 3 seconds
      this.metrics.slowRequests++
    }
  }

  recordError() {
    this.metrics.errorCount++
  }

  updateMemoryUsage() {
    this.metrics.memoryUsage = process.memoryUsage()
  }

  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage()
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime
    }
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const errorRate = this.metrics.errorCount / Math.max(this.metrics.requestCount, 1)
    const slowRequestRate = this.metrics.slowRequests / Math.max(this.metrics.requestCount, 1)
    const memoryUsageMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024

    if (errorRate > 0.1 || slowRequestRate > 0.2 || memoryUsageMB > 512) {
      return 'critical'
    }

    if (errorRate > 0.05 || slowRequestRate > 0.1 || memoryUsageMB > 256) {
      return 'warning'
    }

    return 'healthy'
  }

  reset() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      slowRequests: 0,
      memoryUsage: process.memoryUsage(),
      uptime: Date.now()
    }
    this.responseTimes = []
  }
}

export const productionMonitor = new ProductionMonitor()

// Request performance tracking middleware
export function performanceTracking(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  
  // Track when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime
    productionMonitor.recordRequest(responseTime)
    
    // Log slow requests in production
    if (responseTime > 3000 && process.env.NODE_ENV === 'production') {
      console.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`)
    }
  })
  
  next()
}

// Error tracking middleware
export function errorTracking(error: Error, req: Request, res: Response, next: NextFunction) {
  productionMonitor.recordError()
  
  // Log error details in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Production error:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    })
    
    // Send to external error tracking service (Sentry, etc.)
    if (process.env.SENTRY_DSN) {
      // Sentry error reporting would go here
      // Example: Sentry.captureException(error, { extra: { req } })
    }
  }
  
  next(error)
}

// Health check endpoint with detailed metrics
export function healthCheckEndpoint(req: Request, res: Response) {
  const metrics = productionMonitor.getMetrics()
  const healthStatus = productionMonitor.getHealthStatus()
  
  const responseCode = healthStatus === 'critical' ? 503 : 200
  
  res.status(responseCode).json({
    status: healthStatus,
    timestamp: new Date().toISOString(),
    metrics: {
      requests: {
        total: metrics.requestCount,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        slowRequests: metrics.slowRequests,
        errorCount: metrics.errorCount,
        errorRate: metrics.requestCount > 0 ? 
          ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) + '%' : '0%'
      },
      system: {
        uptime: Math.round(metrics.uptime / 1000) + 's',
        memoryUsage: {
          heapUsed: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(metrics.memoryUsage.external / 1024 / 1024) + 'MB'
        },
        nodeVersion: process.version,
        platform: process.platform
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isServerless: process.env.VERCEL === '1',
        region: process.env.VERCEL_REGION || 'unknown'
      }
    }
  })
}

// Memory leak detection
export function memoryLeakDetection() {
  const memoryThreshold = 512 * 1024 * 1024 // 512MB threshold
  
  setInterval(() => {
    const memUsage = process.memoryUsage()
    
    if (memUsage.heapUsed > memoryThreshold) {
      console.warn('Memory usage warning:', {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        timestamp: new Date().toISOString()
      })
      
      // Force garbage collection if available
      if (global?.gc) {
        global.gc()
        console.log('Forced garbage collection')
      }
    }
  }, 30000) // Check every 30 seconds
}

// Request logging for production
export function productionRequestLogging(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  
  // Only log important requests in production
  const shouldLog = req.path.startsWith('/api/') && 
                   !req.path.includes('/api/health') &&
                   process.env.NODE_ENV === 'production'
  
  if (shouldLog) {
    console.log(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    })
  }
  
  res.on('finish', () => {
    if (shouldLog) {
      const duration = Date.now() - startTime
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
    }
  })
  
  next()
}

// Database connection monitoring
export function databaseConnectionMonitoring() {
  let consecutiveFailures = 0
  
  return async function checkDatabaseHealth() {
    try {
      // This would be implemented with your database health check
      // const isHealthy = await checkDatabaseConnection()
      
      consecutiveFailures = 0
      return true
    } catch (error) {
      consecutiveFailures++
      
      console.error('Database health check failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        consecutiveFailures,
        timestamp: new Date().toISOString()
      })
      
      if (consecutiveFailures >= 5) {
        console.error('CRITICAL: Database connection has failed 5 consecutive times')
        // Implement alerting mechanism here
      }
      
      return false
    }
  }
}

// Export monitoring utilities
export function getProductionMetrics() {
  return productionMonitor.getMetrics()
}

export function resetProductionMetrics() {
  productionMonitor.reset()
}