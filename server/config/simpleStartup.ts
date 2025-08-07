import { z } from 'zod'
import { logger } from '../middleware/logging.js'
import { checkDatabaseConnection } from '../db/index.js'

// Service status tracking
export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unavailable' | 'not_configured'
  message: string
  critical: boolean
  lastCheck: string
  details?: any
}

export interface StartupValidationResult {
  success: boolean
  services: ServiceStatus[]
  criticalFailures: string[]
  warnings: string[]
  canStart: boolean
}

// Environment validation with graceful degradation
const criticalEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
})

const optionalEnvSchema = z.object({
  // OpenAI (optional but limits functionality)
  OPENAI_API_KEY: z.string().optional(),
  
  // Stripe (optional but limits payment functionality)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // JWT (required for authentication)
  JWT_SECRET: z.string().optional(),
})

export class StartupValidator {
  private static services: Map<string, ServiceStatus> = new Map()

  static async validateEnvironmentAndServices(): Promise<StartupValidationResult> {
    const criticalFailures: string[] = []
    const warnings: string[] = []
    
    console.log('🚀 Starting comprehensive startup validation...')
    
    // 1. Validate critical environment variables
    try {
      criticalEnvSchema.parse(process.env)
      console.log('✅ Critical environment variables validated')
    } catch (error) {
      const message = 'Critical environment variables validation failed'
      criticalFailures.push(message)
      logger.error(message, { error })
    }

    // 2. Validate optional environment variables (with warnings)
    try {
      optionalEnvSchema.parse(process.env)
      console.log('✅ Optional environment variables validated')
    } catch (error) {
      warnings.push('Some optional environment variables are missing or invalid')
      console.warn('⚠️ Optional environment variables issues:', error)
    }

    // 3. Test database connection
    await this.validateDatabase()

    // 4. Test authentication configuration
    await this.validateAuthentication()

    // 5. Test OpenAI service
    await this.validateOpenAI()

    // 6. Test Stripe service (if configured)
    await this.validateStripe()

    const services = Array.from(this.services.values())
    const success = criticalFailures.length === 0
    const canStart = criticalFailures.length === 0

    // Log summary
    const summary = this.generateSummary(services)
    console.log('📊 Service Health Summary:')
    console.log(`   Total: ${summary.total}`)
    console.log(`   Healthy: ${summary.healthy}`)
    console.log(`   Degraded: ${summary.degraded}`)
    console.log(`   Unavailable: ${summary.unavailable}`)
    console.log(`   Not Configured: ${summary.not_configured}`)

    if (criticalFailures.length > 0) {
      console.log('❌ Critical failures:')
      criticalFailures.forEach(failure => console.log(`   - ${failure}`))
    }

    if (warnings.length > 0) {
      console.log('⚠️ Warnings:')
      warnings.forEach(warning => console.log(`   - ${warning}`))
    }

    return {
      success,
      services,
      criticalFailures,
      warnings,
      canStart
    }
  }

  private static async validateDatabase(): Promise<void> {
    const serviceName = 'SQLite Database'
    
    try {
      console.log('🔍 Testing SQLite database...')
      
      const healthCheck = await checkDatabaseConnection()
      
      if (healthCheck && healthCheck.connected) {
        this.setServiceStatus(serviceName, {
          status: 'healthy',
          message: 'SQLite database ready',
          critical: false, // SQLite is always available
          details: healthCheck.details || { type: 'SQLite' }
        })
        console.log('✅ SQLite database validated')
      } else {
        this.setServiceStatus(serviceName, {
          status: 'unavailable',
          message: 'SQLite database failed',
          critical: false, // Non-critical for startup
          details: { error: 'Connection test failed' }
        })
        console.log('❌ Database connection failed')
      }
    } catch (error) {
      this.setServiceStatus(serviceName, {
        status: 'unavailable',
        message: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true,
        details: { error: error instanceof Error ? error.message : String(error) }
      })
      console.log('❌ Database validation error:', error)
    }
  }

  private static async validateAuthentication(): Promise<void> {
    const serviceName = 'JWT Authentication'
    
    try {
      console.log('🔍 Testing authentication configuration...')
      
      const jwtSecret = process.env.JWT_SECRET
      
      if (!jwtSecret) {
        this.setServiceStatus(serviceName, {
          status: process.env.NODE_ENV === 'production' ? 'unavailable' : 'degraded',
          message: process.env.NODE_ENV === 'production' 
            ? 'JWT_SECRET is required in production' 
            : 'JWT_SECRET not set (using fallback in development)',
          critical: process.env.NODE_ENV === 'production',
          details: { configured: false }
        })
        return
      }

      if (jwtSecret.length < 32) {
        this.setServiceStatus(serviceName, {
          status: 'degraded',
          message: 'JWT_SECRET should be at least 32 characters for optimal security',
          critical: false,
          details: { length: jwtSecret.length }
        })
      } else {
        this.setServiceStatus(serviceName, {
          status: 'healthy',
          message: 'JWT authentication properly configured',
          critical: true,
          details: { configured: true, length: jwtSecret.length }
        })
      }
      
      console.log('✅ Authentication configuration validated')
    } catch (error) {
      this.setServiceStatus(serviceName, {
        status: 'unavailable',
        message: `Authentication configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true,
        details: { error: error instanceof Error ? error.message : String(error) }
      })
      console.log('❌ Authentication validation error:', error)
    }
  }

  private static async validateOpenAI(): Promise<void> {
    const serviceName = 'OpenAI API'
    
    try {
      console.log('🔍 Testing OpenAI configuration...')
      
      if (!process.env.OPENAI_API_KEY) {
        this.setServiceStatus(serviceName, {
          status: 'not_configured',
          message: 'OpenAI API key not configured - hook generation will be unavailable',
          critical: false,
          details: { configured: false }
        })
        return
      }

      // Simple validation - just check if key looks valid
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey.startsWith('sk-')) {
        this.setServiceStatus(serviceName, {
          status: 'degraded',
          message: 'OpenAI API key format appears invalid',
          critical: false,
          details: { keyFormat: 'invalid' }
        })
      } else {
        this.setServiceStatus(serviceName, {
          status: 'healthy',
          message: 'OpenAI API key configured',
          critical: false,
          details: { configured: true, keyPrefix: apiKey.substring(0, 8) + '...' }
        })
      }
      
      console.log('✅ OpenAI configuration validated')
    } catch (error) {
      this.setServiceStatus(serviceName, {
        status: 'unavailable',
        message: `OpenAI configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false,
        details: { error: error instanceof Error ? error.message : String(error) }
      })
      console.log('❌ OpenAI validation error:', error)
    }
  }

  private static async validateStripe(): Promise<void> {
    const serviceName = 'Stripe Payments'
    
    try {
      console.log('🔍 Testing Stripe configuration...')
      
      const secretKey = process.env.STRIPE_SECRET_KEY
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      
      if (!secretKey) {
        this.setServiceStatus(serviceName, {
          status: 'not_configured',
          message: 'Stripe not configured - payment features will be unavailable',
          critical: false,
          details: { configured: false }
        })
        return
      }

      const issues: string[] = []
      if (!secretKey.startsWith('sk_')) issues.push('Invalid secret key format')
      if (!webhookSecret) issues.push('Webhook secret not configured')

      if (issues.length > 0) {
        this.setServiceStatus(serviceName, {
          status: 'degraded',
          message: `Stripe configuration issues: ${issues.join(', ')}`,
          critical: false,
          details: { issues }
        })
      } else {
        this.setServiceStatus(serviceName, {
          status: 'healthy',
          message: 'Stripe payments properly configured',
          critical: false,
          details: { 
            configured: true, 
            secretKeyPrefix: secretKey.substring(0, 8) + '...',
            webhookConfigured: !!webhookSecret
          }
        })
      }
      
      console.log('✅ Stripe configuration validated')
    } catch (error) {
      this.setServiceStatus(serviceName, {
        status: 'unavailable',
        message: `Stripe configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: false,
        details: { error: error instanceof Error ? error.message : String(error) }
      })
      console.log('❌ Stripe validation error:', error)
    }
  }

  private static setServiceStatus(serviceName: string, status: Omit<ServiceStatus, 'name' | 'lastCheck'>): void {
    this.services.set(serviceName, {
      name: serviceName,
      lastCheck: new Date().toISOString(),
      ...status
    })
  }

  private static generateSummary(services: ServiceStatus[]) {
    return {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      unavailable: services.filter(s => s.status === 'unavailable').length,
      not_configured: services.filter(s => s.status === 'not_configured').length
    }
  }

  static getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.services.get(serviceName)
  }

  static getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.services.values())
  }

  static isServiceHealthy(serviceName: string): boolean {
    const status = this.services.get(serviceName)
    return status?.status === 'healthy'
  }

  static areCriticalServicesHealthy(): boolean {
    const criticalServices = Array.from(this.services.values()).filter(s => s.critical)
    return criticalServices.every(s => s.status === 'healthy')
  }
}

// Export the main validation function for backward compatibility
export const validateEnvironmentAndServices = StartupValidator.validateEnvironmentAndServices.bind(StartupValidator)