import { z } from 'zod'

// Environment variable schema validation
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Database
  DATABASE_URL: z.string().url().refine(url => url.startsWith('postgresql://'), {
    message: 'DATABASE_URL must be a PostgreSQL connection string'
  }),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  
  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON' })
      return z.NEVER
    }
  }),
  FIREBASE_WEBHOOK_SECRET: z.string().optional(),
  REQUIRE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').default('false'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().regex(/^sk_(test_|live_)/, 'STRIPE_SECRET_KEY must be a valid Stripe secret key'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
  STRIPE_PUBLISHABLE_KEY: z.string().regex(/^pk_(test_|live_)/, 'STRIPE_PUBLISHABLE_KEY must be a valid Stripe publishable key'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().transform(str => str.split(',').map(s => s.trim())).default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Analytics
  ANALYTICS_RETENTION_DAYS: z.string().transform(Number).default('90'),
  PERFORMANCE_TRACKING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  
  // Feature Flags
  FEATURE_PSYCHOLOGICAL_PROFILING: z.string().transform(val => val === 'true').default('true'),
  FEATURE_AB_TESTING: z.string().transform(val => val === 'true').default('true'),
  FEATURE_ADVANCED_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  FEATURE_PREMIUM_MODELS: z.string().transform(val => val === 'true').default('true'),
  
  // Security
  HELMET_CSP_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),
  TRUST_PROXY: z.string().transform(Number).default('1'),
  
  // Optional Services
  REDIS_URL: z.string().url().optional(),
  CACHE_TTL: z.string().transform(Number).default('3600'),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).default('0.1'),
  
  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Vercel Specific
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
  VERCEL_REGION: z.string().optional(),
  
  // Development
  DEBUG: z.string().optional(),
  MOCK_AI_RESPONSES: z.string().transform(val => val === 'true').default('false'),
  SKIP_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').default('false'),
})

// Environment variable validation and parsing
export function validateEnvironment() {
  console.log('🔍 Validating environment variables...')
  
  try {
    const env = envSchema.parse(process.env)
    console.log('✅ Environment validation passed')
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('❌ Environment validation error:', error)
    }
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    } else {
      console.warn('⚠️  Continuing with invalid environment in development mode')
      return {} as any
    }
  }
}

// Get validated environment variables
export const env = validateEnvironment()

// Environment-specific configurations
export const config = {
  app: {
    name: 'Hook Line Studio',
    version: '2.0.0',
    environment: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    isServerless: env.VERCEL === '1'
  },
  
  database: {
    url: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production',
    maxConnections: env.NODE_ENV === 'production' ? 20 : 5,
    idleTimeout: env.NODE_ENV === 'production' ? 30000 : 10000,
    connectionTimeout: env.NODE_ENV === 'production' ? 15000 : 5000
  },
  
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: '7d',
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION
  },
  
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    serviceAccount: env.FIREBASE_SERVICE_ACCOUNT_KEY,
    webhookSecret: env.FIREBASE_WEBHOOK_SECRET
  },
  
  openai: {
    apiKey: env.OPENAI_API_KEY,
    maxRetries: 3,
    timeout: 30000
  },
  
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY
  },
  
  cors: {
    origins: env.ALLOWED_ORIGINS,
    credentials: env.CORS_CREDENTIALS
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS
  },
  
  analytics: {
    retentionDays: env.ANALYTICS_RETENTION_DAYS,
    performanceTracking: env.PERFORMANCE_TRACKING_ENABLED
  },
  
  features: {
    psychologicalProfiling: env.FEATURE_PSYCHOLOGICAL_PROFILING,
    abTesting: env.FEATURE_AB_TESTING,
    advancedAnalytics: env.FEATURE_ADVANCED_ANALYTICS,
    premiumModels: env.FEATURE_PREMIUM_MODELS
  },
  
  security: {
    helmetCsp: env.HELMET_CSP_ENABLED,
    trustProxy: env.TRUST_PROXY
  },
  
  cache: {
    redisUrl: env.REDIS_URL,
    ttl: env.CACHE_TTL
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    sentryEnvironment: env.SENTRY_ENVIRONMENT,
    sentryTracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE
  },
  
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.FROM_EMAIL
  },
  
  development: {
    debug: env.DEBUG,
    mockAiResponses: env.MOCK_AI_RESPONSES,
    skipEmailVerification: env.SKIP_EMAIL_VERIFICATION
  }
}

// Runtime configuration checks
export function performRuntimeChecks() {
  console.log('🔍 Performing runtime configuration checks...')
  
  const warnings: string[] = []
  const errors: string[] = []
  
  // Production-specific checks
  if (config.app.isProduction) {
    if (!config.monitoring.sentryDsn) {
      warnings.push('SENTRY_DSN not configured - error tracking will be limited')
    }
    
    if (!config.cache.redisUrl) {
      warnings.push('REDIS_URL not configured - caching will be limited')
    }
    
    if (!config.email.host) {
      warnings.push('Email configuration missing - email notifications disabled')
    }
    
    if (config.stripe.secretKey.includes('test_')) {
      errors.push('Using test Stripe keys in production environment')
    }
    
    if (config.cors.origins.includes('localhost')) {
      warnings.push('Localhost origins configured in production')
    }
  }
  
  // Development-specific checks
  if (config.app.isDevelopment) {
    if (config.stripe.secretKey.includes('live_')) {
      warnings.push('Using live Stripe keys in development environment')
    }
  }
  
  // Display warnings and errors
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:')
    errors.forEach(error => console.error(`  - ${error}`))
    
    if (config.app.isProduction) {
      process.exit(1)
    }
  }
  
  if (warnings.length === 0 && errors.length === 0) {
    console.log('✅ Runtime configuration checks passed')
  }
}

// Export type for use in other modules
export type Environment = typeof env
export type Config = typeof config