import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthenticatedRequest } from './auth.js'
import { db } from '../db/index.js'
import { 
  systemMetrics, 
  apiUsageTracking, 
  errorTracking,
  NewSystemMetric,
  NewApiUsageTracking,
  NewErrorTracking
} from '../db/schema.js'
import { logger } from './logging.js'

// Performance tracking middleware
export function performanceTracker(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  const requestId = uuidv4()
  
  // Add request ID to request object
  req.requestId = requestId
  
  // Track request start
  const originalSend = res.send
  const originalJson = res.json
  
  let responseSize = 0
  let responseSent = false
  
  // Override send to capture response data
  res.send = function(body) {
    if (!responseSent) {
      responseSent = true
      responseSize = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body || '', 'utf8')
      trackApiUsage()
    }
    return originalSend.call(this, body)
  }
  
  // Override json to capture response data
  res.json = function(obj) {
    if (!responseSent) {
      responseSent = true
      responseSize = Buffer.byteLength(JSON.stringify(obj), 'utf8')
      trackApiUsage()
    }
    return originalJson.call(this, obj)
  }
  
  async function trackApiUsage() {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    const authReq = req as AuthenticatedRequest
    
    try {
      const requestSize = parseInt(req.get('content-length') || '0')
      
      const trackingData: NewApiUsageTracking = {
        id: requestId,
        userId: authReq.user?.id || null,
        endpoint: req.route?.path || req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('user-agent') || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        requestSize: requestSize || null,
        responseSize,
        createdAt: new Date(startTime)
      }
      
      // Track API usage asynchronously
      await db.insert(apiUsageTracking).values(trackingData)
      
      // Track system metrics for response time
      await db.insert(systemMetrics).values({
        id: uuidv4(),
        metricType: 'api_response',
        metricName: `${req.method} ${req.route?.path || req.path}`,
        value: responseTime,
        metadata: {
          statusCode: res.statusCode,
          endpoint: req.route?.path || req.path,
          userId: authReq.user?.id
        },
        timestamp: new Date()
      } as NewSystemMetric)
      
    } catch (error) {
      logger.error('Failed to track API usage:', error)
    }
  }
  
  next()
}

// Error tracking middleware
export function errorTracker(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = req.requestId || uuidv4()
  const authReq = req as AuthenticatedRequest
  
  // Track error asynchronously
  trackError(err, req, authReq.user?.id).catch(trackingError => {
    logger.error('Failed to track error:', trackingError)
  })
  
  next(err)
}

async function trackError(error: any, req: Request, userId?: string) {
  try {
    const errorData: NewErrorTracking = {
      id: uuidv4(),
      sessionId: req.sessionID || null,
      userId: userId || null,
      errorType: 'api_error',
      errorMessage: error.message || 'Unknown error',
      errorStack: error.stack || null,
      errorCode: error.code || error.statusCode?.toString() || null,
      url: req.originalUrl,
      userAgent: req.get('user-agent') || null,
      deviceInfo: {
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
        headers: req.headers
      },
      additionalContext: {
        body: req.body,
        query: req.query,
        params: req.params,
        requestId: req.requestId
      }
    }
    
    await db.insert(errorTracking).values(errorData)
  } catch (trackingError) {
    logger.error('Error tracking failed:', trackingError)
  }
}

// AI service usage tracker
export async function trackAIUsage(
  service: string, 
  model: string, 
  tokensUsed: number, 
  cost: number, 
  userId?: string
) {
  try {
    await db.insert(systemMetrics).values({
      id: uuidv4(),
      metricType: 'ai_usage',
      metricName: `${service}_${model}`,
      value: tokensUsed,
      metadata: {
        service,
        model,
        cost,
        userId
      },
      timestamp: new Date()
    } as NewSystemMetric)
  } catch (error) {
    logger.error('Failed to track AI usage:', error)
  }
}

// Database query performance tracker
export function trackDatabaseQuery(queryName: string, duration: number, metadata?: any) {
  // Track asynchronously to avoid blocking queries
  db.insert(systemMetrics).values({
    id: uuidv4(),
    metricType: 'db_query',
    metricName: queryName,
    value: duration,
    metadata: metadata || {},
    timestamp: new Date()
  } as NewSystemMetric).catch(error => {
    logger.error('Failed to track database query:', error)
  })
}

// System health metrics tracker
export async function trackSystemHealth() {
  try {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    const metrics: NewSystemMetric[] = [
      {
        id: uuidv4(),
        metricType: 'memory',
        metricName: 'heap_used',
        value: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        metadata: { unit: 'MB' },
        timestamp: new Date()
      },
      {
        id: uuidv4(),
        metricType: 'memory',
        metricName: 'heap_total',
        value: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        metadata: { unit: 'MB' },
        timestamp: new Date()
      },
      {
        id: uuidv4(),
        metricType: 'memory',
        metricName: 'external',
        value: Math.round(memoryUsage.external / 1024 / 1024), // MB
        metadata: { unit: 'MB' },
        timestamp: new Date()
      },
      {
        id: uuidv4(),
        metricType: 'cpu',
        metricName: 'user_cpu_time',
        value: Math.round(cpuUsage.user / 1000), // milliseconds
        metadata: { unit: 'ms' },
        timestamp: new Date()
      },
      {
        id: uuidv4(),
        metricType: 'cpu',
        metricName: 'system_cpu_time',
        value: Math.round(cpuUsage.system / 1000), // milliseconds
        metadata: { unit: 'ms' },
        timestamp: new Date()
      }
    ]
    
    await db.insert(systemMetrics).values(metrics)
  } catch (error) {
    logger.error('Failed to track system health:', error)
  }
}

// Cleanup old metrics (run periodically)
export async function cleanupOldMetrics(daysToKeep: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    // Clean up old system metrics
    await db.delete(systemMetrics)
      .where(sql`${systemMetrics.timestamp} < ${cutoffDate}`)
    
    // Clean up old API usage tracking
    await db.delete(apiUsageTracking)
      .where(sql`${apiUsageTracking.createdAt} < ${cutoffDate}`)
      
    logger.info(`Cleaned up metrics older than ${daysToKeep} days`)
  } catch (error) {
    logger.error('Failed to cleanup old metrics:', error)
  }
}

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string
    }
  }
}