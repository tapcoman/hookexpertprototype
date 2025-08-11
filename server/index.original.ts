import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'

// Import essential middleware
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { serviceStatusChecker } from './middleware/serviceAvailability.js'

// Import startup validation
import { validateEnvironmentAndServices } from './config/startup.js'

// Import basic routes  
import authRoutes from './routes/auth.js'
import hookRoutes from './routes/hooks.js'
import userRoutes from './routes/users.js'
import debugRoutes from './routes/debug.js'

// Load environment variables
dotenv.config()

// Perform startup validation
let startupResult: any = null
if (process.env.NODE_ENV !== 'test') {
  try {
    startupResult = await validateEnvironmentAndServices()
    
    if (!startupResult.canStart) {
      console.error('❌ Critical startup failures detected. Server cannot start.')
      console.error('Critical failures:')
      startupResult.criticalFailures.forEach((failure: string) => {
        console.error(`  - ${failure}`)
      })
      process.exit(1)
    }
  } catch (startupError) {
    console.error('❌ Fatal error during startup validation:', startupError)
    console.error('   This indicates a programming error in the startup validation system.')
    console.error('   The server will attempt to start with degraded functionality.')
    
    // Create minimal startup result for degraded mode
    startupResult = {
      success: false,
      canStart: true, // Allow startup but in degraded mode
      services: [],
      criticalFailures: ['Startup validation system failed'],
      warnings: ['Running in degraded mode due to startup validation failure']
    }
  }
}

// Create Express app
const app = express()
const PORT = process.env.PORT || 3000

// Essential middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Add service status middleware
app.use(serviceStatusChecker)

// Enhanced health check endpoint with actual service testing
app.get('/api/health', async (req, res) => {
  try {
    // Get fresh service statuses with error handling
    let currentValidation
    try {
      currentValidation = await validateEnvironmentAndServices()
    } catch (validationError) {
      console.error('Health check validation error:', validationError)
      
      // Return degraded status if validation fails
      return res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        serverless: Boolean(process.env.VERCEL),
        error: 'Service validation system failure',
        canStart: false,
        services: {},
        summary: { total: 0, healthy: 0, degraded: 0, unavailable: 0, not_configured: 0 },
        warnings: ['Health check system malfunction'],
        criticalFailures: ['Unable to validate service health'],
        details: process.env.NODE_ENV === 'development' ? {
          validationError: validationError instanceof Error ? validationError.message : validationError
        } : undefined
      })
    }
    
    // Determine overall health
    const criticalServicesDown = currentValidation.services
      .filter(s => s.critical && s.status !== 'healthy').length
    
    const overallStatus = criticalServicesDown > 0 ? 'unhealthy' : 
                         currentValidation.warnings.length > 0 ? 'degraded' : 'healthy'
    
    const statusCode = overallStatus === 'unhealthy' ? 503 : 
                      overallStatus === 'degraded' ? 200 : 200

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      serverless: Boolean(process.env.VERCEL),
      canStart: currentValidation.canStart,
      services: currentValidation.services.reduce((acc, service) => {
        acc[service.name.toLowerCase().replace(/[^a-z0-9]/g, '_')] = {
          status: service.status,
          message: service.message,
          critical: service.critical,
          lastCheck: service.lastCheck,
          details: service.details
        }
        return acc
      }, {} as any),
      summary: {
        total: currentValidation.services.length,
        healthy: currentValidation.services.filter(s => s.status === 'healthy').length,
        degraded: currentValidation.services.filter(s => s.status === 'degraded').length,
        unavailable: currentValidation.services.filter(s => s.status === 'unavailable').length,
        not_configured: currentValidation.services.filter(s => s.status === 'not_configured').length
      },
      warnings: currentValidation.warnings,
      criticalFailures: currentValidation.criticalFailures
    }

    res.status(statusCode).json(response)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/hooks', hookRoutes)  
app.use('/api/users', userRoutes)

// Debug routes (only in development or when explicitly enabled)
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG_ROUTES === 'true') {
  app.use('/api/debug', debugRoutes)
}

// Error handling
app.use(notFoundHandler)
app.use(globalErrorHandler)

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

export { app }