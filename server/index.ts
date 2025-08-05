import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'

// Import essential middleware
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Import basic routes  
import authRoutes from './routes/auth.js'
import hookRoutes from './routes/hooks.js'
import userRoutes from './routes/users.js'

// Load environment variables
dotenv.config()

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

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      serverless: Boolean(process.env.VERCEL),
      services: {
        database: 'healthy', // Simplified check
        ai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        firebase: {
          configured: Boolean(process.env.FIREBASE_PROJECT_ID),
          initialized: true,
          projectId: process.env.FIREBASE_PROJECT_ID
        },
        stripe: {
          configured: Boolean(process.env.STRIPE_SECRET_KEY),
          initialized: true,
          webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET)
        }
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service health check failed'
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/hooks', hookRoutes)  
app.use('/api/users', userRoutes)

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