import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import { checkDatabaseConnection } from './db/index.js'
import { checkServerlessConnection, getServerlessStats } from './db/serverless.js'

// Import middleware
import { globalRateLimit } from './middleware/rateLimiting.js'
import { requestLogger, errorLogger } from './middleware/logging.js'
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { initializeFirebase } from './middleware/auth.js'
import { performanceTracker, errorTracker, trackSystemHealth } from './middleware/analytics.js'

// Import configuration
import { FirebaseConfig } from './config/firebase.js'
import { StripeConfig } from './config/stripe.js'

// Import routes
import authRoutes from './routes/auth.js'
import hookRoutes from './routes/hooks.js'
import userRoutes from './routes/users.js'
import analyticsRoutes from './routes/analytics.js'
import paymentRoutes from './routes/payments.js'

// Import services
import { initializeCronJobs } from './services/cronJobs.js'
import { BusinessIntelligenceService } from './services/businessIntelligence.js'

// Load environment variables
dotenv.config()

// Initialize Firebase with enhanced configuration
async function initializeServices() {
  const firebaseInitialized = await FirebaseConfig.initialize()
  
  if (!firebaseInitialized) {
    console.warn('⚠️ Firebase initialization failed - authentication features will be limited')
  }

  // Initialize cron jobs in production
  if (process.env.NODE_ENV === 'production') {
    initializeCronJobs()
  }

  // Start system health tracking
  setInterval(() => {
    trackSystemHealth().catch(error => {
      console.error('System health tracking failed:', error)
    })
  }, 5 * 60 * 1000) // Every 5 minutes

  // Start business intelligence calculations
  if (process.env.NODE_ENV === 'production') {
    // Run daily calculations every hour (to handle timezone differences)
    setInterval(() => {
      BusinessIntelligenceService.runDailyCalculations().catch(error => {
        console.error('Daily BI calculations failed:', error)
      })
    }, 60 * 60 * 1000) // Every hour
  }
}

// Initialize services
initializeServices().catch(error => {
  console.error('Service initialization failed:', error)
  process.exit(1)
})

const app = express()
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']

// Trust proxy (important for Railway and other hosting platforms)
app.set('trust proxy', 1)

// Global rate limiting
app.use(globalRateLimit)

// Request logging
app.use(requestLogger)

// Performance tracking middleware
app.use(performanceTracker)

// Compression middleware
app.use(compression())

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Stripe webhook endpoint needs raw body - handle before general body parsing
app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }))

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}))
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}))

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Use serverless connection for Vercel, regular connection otherwise
    const isServerless = process.env.VERCEL === '1'
    const dbStatus = isServerless 
      ? await checkServerlessConnection()
      : await checkDatabaseConnection()
    
    const firebaseStatus = FirebaseConfig.getStatus()
    const stripeStatus = StripeConfig.getStatus()
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus.connected ? 'connected' : 'disconnected',
      environment: NODE_ENV,
      version: '2.0.0',
      serverless: isServerless,
      services: {
        database: dbStatus.connected ? 'operational' : 'down',
        ai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
        firebase: {
          configured: firebaseStatus.configured,
          initialized: firebaseStatus.initialized,
          projectId: firebaseStatus.projectId
        },
        stripe: {
          configured: stripeStatus.configured,
          initialized: stripeStatus.initialized,
          webhookSecret: stripeStatus.webhookSecret
        }
      }
    }

    // Add serverless-specific stats if available
    if (isServerless) {
      response.serverless_stats = getServerlessStats()
    }

    res.json(response)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      environment: NODE_ENV,
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Hook Line Studio API v2.0',
    version: '2.0.0',
    documentation: {
      authentication: '/api/auth',
      hooks: '/api/hooks',
      users: '/api/users',
      analytics: '/api/analytics',
      payments: '/api/payments',
      health: '/api/health'
    },
    features: [
      'Firebase Authentication',
      'AI-Powered Hook Generation',
      'Psychological Framework Integration',
      'Analytics & Performance Tracking',
      'A/B Testing Framework',
      'User Profiling & Personalization',
      'Stripe Payment Integration',
      'Subscription Management',
      'Usage Tracking & Limits'
    ]
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/hooks', hookRoutes)
app.use('/api/users', userRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/payments', paymentRoutes)

// Error logging middleware (before error handler)
app.use(errorLogger)

// Error tracking middleware
app.use(errorTracker)

// Global error handler
app.use(globalErrorHandler)

// 404 handler
app.use('*', notFoundHandler)

// Export the app for Vercel serverless deployment
export { app }

// Start server (only when not in serverless environment)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('🚀 Hook Line Studio server running on port', PORT)
    console.log('📍 Environment:', NODE_ENV)
    console.log('🔗 Health check: http://localhost:' + PORT + '/api/health')
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    process.exit(0)
  })
}