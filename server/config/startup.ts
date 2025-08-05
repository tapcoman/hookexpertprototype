import { z } from 'zod'
import { logger } from '../middleware/logging.js'
import { FirebaseService } from '../services/firebaseService.js'
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
  // Database (critical in production, optional in development)
  DATABASE_URL: z.string().url().optional(),
  
  // Firebase (optional but limits functionality)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  
  // OpenAI (optional but limits functionality)
  OPENAI_API_KEY: z.string().optional(),
  
  // Stripe (optional but limits payment functionality)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // JWT (falls back to a default in development)
  JWT_SECRET: z.string().optional(),
})

export class StartupValidator {
  private services: Map<string, ServiceStatus> = new Map()

  /**
   * Perform comprehensive startup validation
   */
  async validateStartup(): Promise<StartupValidationResult> {
    logger.info('🔍 Starting comprehensive environment and service validation...')
    
    const result: StartupValidationResult = {
      success: true,
      services: [],
      criticalFailures: [],
      warnings: [],
      canStart: true
    }

    try {
      // 1. Validate critical environment variables
      await this.validateCriticalEnvironment(result)
      
      // 2. Validate optional environment variables
      await this.validateOptionalEnvironment(result)
      
      // 3. Test database connectivity
      await this.validateDatabaseConnection(result)
      
      // 4. Test Firebase connectivity
      await this.validateFirebaseConnection(result)
      
      // 5. Validate Stripe configuration
      await this.validateStripeConfiguration(result)
      
      // 6. Validate OpenAI configuration
      await this.validateOpenAIConfiguration(result)
      
      // 7. Determine if we can start the server
      this.determineStartupFeasibility(result)
      
      // 8. Log results
      this.logValidationResults(result)
      
      return result
    } catch (error) {
      logger.error('Fatal error during startup validation:', error)
      result.success = false
      result.canStart = false
      result.criticalFailures.push('Unexpected error during startup validation')
      return result
    }
  }

  /**
   * Validate critical environment variables that are required for basic operation
   */
  private async validateCriticalEnvironment(result: StartupValidationResult): Promise<void> {
    try {
      criticalEnvSchema.parse(process.env)
      this.addServiceStatus('Environment (Critical)', 'healthy', 'All critical environment variables present', false)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        result.criticalFailures.push(`Critical environment validation failed: ${issues}`)
        this.addServiceStatus('Environment (Critical)', 'unavailable', `Missing critical variables: ${issues}`, true)
      }
    }
  }

  /**
   * Validate optional environment variables with warnings
   */
  private async validateOptionalEnvironment(result: StartupValidationResult): Promise<void> {
    try {
      optionalEnvSchema.parse(process.env)
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          result.warnings.push(`Optional configuration missing: ${issue.path.join('.')}: ${issue.message}`)
        }
      }
    }

    // Production-specific validation
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        result.criticalFailures.push('JWT_SECRET must be at least 32 characters in production')
      }
      
      if (!process.env.DATABASE_URL) {
        result.criticalFailures.push('DATABASE_URL is required in production')
      }
    }

    this.addServiceStatus('Environment (Optional)', 'healthy', 'Environment validation completed', false)
  }

  /**
   * Test actual database connectivity with retry logic
   */
  private async validateDatabaseConnection(result: StartupValidationResult): Promise<void> {
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === 'production') {
        this.addServiceStatus('Database', 'unavailable', 'DATABASE_URL not configured (required in production)', true)
        result.criticalFailures.push('Database connection required in production')
      } else {
        this.addServiceStatus('Database', 'not_configured', 'DATABASE_URL not configured (optional in development)', false)
        result.warnings.push('Database not configured - some features will be unavailable')
      }
      return
    }

    const maxRetries = 3
    const retryDelay = 2000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Testing database connection (attempt ${attempt}/${maxRetries})...`)
        const healthCheck = await checkDatabaseConnection()
        
        if (healthCheck.connected) {
          this.addServiceStatus('Database', 'healthy', 'Database connection established', true, {
            attempt,
            connectionDetails: healthCheck
          })
          return
        } else {
          throw new Error(healthCheck.error || 'Connection failed')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (attempt === maxRetries) {
          // Final attempt failed
          if (process.env.NODE_ENV === 'production') {
            this.addServiceStatus('Database', 'unavailable', `Failed after ${maxRetries} attempts: ${errorMessage}`, true)
            result.criticalFailures.push(`Database connectivity failed: ${errorMessage}`)
          } else {
            this.addServiceStatus('Database', 'degraded', `Connection failed: ${errorMessage}`, false)
            result.warnings.push(`Database connection failed - running in degraded mode`)
          }
        } else {
          // Retry
          logger.warn(`Database connection attempt ${attempt} failed: ${errorMessage}. Retrying in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }
  }

  /**
   * Test Firebase connectivity and configuration
   */
  private async validateFirebaseConnection(result: StartupValidationResult): Promise<void> {
    if (!FirebaseService.isConfigured()) {
      this.addServiceStatus('Firebase', 'not_configured', 'Firebase credentials missing (authentication features limited)', false)
      result.warnings.push('Firebase not configured - authentication features will be limited')
      return
    }

    try {
      const initialized = FirebaseService.initialize()
      if (!initialized) {
        this.addServiceStatus('Firebase', 'unavailable', 'Firebase initialization failed', false)
        result.warnings.push('Firebase initialization failed - authentication features unavailable')
        return
      }

      // Test Firebase connectivity
      const healthCheck = await FirebaseService.healthCheck()
      
      if (healthCheck.status === 'connected') {
        this.addServiceStatus('Firebase', 'healthy', 'Firebase Admin SDK operational', false, {
          projectId: FirebaseService.getProjectId(),
          details: healthCheck
        })
      } else {
        this.addServiceStatus('Firebase', 'degraded', `Firebase connection issues: ${healthCheck.details}`, false)
        result.warnings.push('Firebase connection issues - authentication may be unreliable')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.addServiceStatus('Firebase', 'unavailable', `Firebase validation failed: ${errorMessage}`, false)
      result.warnings.push(`Firebase validation failed: ${errorMessage}`)
    }
  }

  /**
   * Validate Stripe configuration
   */
  private async validateStripeConfiguration(result: StartupValidationResult): Promise<void> {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
    const hasPublishableKey = !!process.env.STRIPE_PUBLISHABLE_KEY

    if (!hasSecretKey) {
      this.addServiceStatus('Stripe', 'not_configured', 'Stripe not configured (payment features disabled)', false)
      result.warnings.push('Stripe not configured - payment features will be disabled')
      return
    }

    // Check key format
    const isTestKey = process.env.STRIPE_SECRET_KEY?.includes('test_')
    const isLiveKey = process.env.STRIPE_SECRET_KEY?.includes('live_')
    
    if (!isTestKey && !isLiveKey) {
      this.addServiceStatus('Stripe', 'unavailable', 'Invalid Stripe secret key format', false)
      result.warnings.push('Invalid Stripe secret key format')
      return
    }

    // Environment-specific validation
    if (process.env.NODE_ENV === 'production' && isTestKey) {
      this.addServiceStatus('Stripe', 'degraded', 'Using test keys in production environment', false)
      result.warnings.push('Using Stripe test keys in production - payments will not work')
    } else if (process.env.NODE_ENV === 'development' && isLiveKey) {
      this.addServiceStatus('Stripe', 'degraded', 'Using live keys in development environment', false)
      result.warnings.push('Using Stripe live keys in development - be careful with real transactions')
    }

    const missingParts: string[] = []
    if (!hasWebhookSecret) missingParts.push('webhook secret')
    if (!hasPublishableKey) missingParts.push('publishable key')

    if (missingParts.length > 0) {
      this.addServiceStatus('Stripe', 'degraded', `Stripe partially configured (missing: ${missingParts.join(', ')})`, false)
      result.warnings.push(`Stripe partially configured - missing: ${missingParts.join(', ')}`)
    } else {
      this.addServiceStatus('Stripe', 'healthy', 'Stripe fully configured', false, {
        keyType: isTestKey ? 'test' : 'live',
        webhookConfigured: hasWebhookSecret
      })
    }
  }

  /**
   * Validate OpenAI configuration
   */
  private async validateOpenAIConfiguration(result: StartupValidationResult): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      this.addServiceStatus('OpenAI', 'not_configured', 'OpenAI API key missing (AI features disabled)', false)
      result.warnings.push('OpenAI not configured - AI hook generation will be disabled')
      return
    }

    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      this.addServiceStatus('OpenAI', 'unavailable', 'Invalid OpenAI API key format', false)
      result.warnings.push('Invalid OpenAI API key format - AI features may not work')
      return
    }

    // We could test the API key here, but that would make a request to OpenAI on every startup
    // Instead, we'll just validate the format and defer the actual test to first use
    this.addServiceStatus('OpenAI', 'healthy', 'OpenAI API key configured', false, {
      keyFormat: 'valid'
    })
  }

  /**
   * Determine if the server can start based on validation results
   */
  private determineStartupFeasibility(result: StartupValidationResult): void {
    // Server can start if there are no critical failures
    result.canStart = result.criticalFailures.length === 0
    result.success = result.canStart

    // Collect service statuses
    result.services = Array.from(this.services.values())
  }

  /**
   * Log validation results
   */
  private logValidationResults(result: StartupValidationResult): void {
    if (result.success) {
      logger.info('✅ Startup validation completed successfully')
    } else {
      logger.error('❌ Startup validation failed')
    }

    // Log service statuses
    for (const service of result.services) {
      const emoji = this.getStatusEmoji(service.status)
      const criticality = service.critical ? '[CRITICAL]' : '[OPTIONAL]'
      logger.info(`${emoji} ${service.name} ${criticality}: ${service.message}`)
    }

    // Log warnings
    if (result.warnings.length > 0) {
      logger.warn('⚠️  Configuration warnings:')
      result.warnings.forEach(warning => logger.warn(`  - ${warning}`))
    }

    // Log critical failures
    if (result.criticalFailures.length > 0) {
      logger.error('❌ Critical failures preventing startup:')
      result.criticalFailures.forEach(failure => logger.error(`  - ${failure}`))
    }

    // Summary
    const healthyServices = result.services.filter(s => s.status === 'healthy').length
    const totalServices = result.services.length
    logger.info(`📊 Service status: ${healthyServices}/${totalServices} healthy`)
  }

  /**
   * Add service status to tracking
   */
  private addServiceStatus(
    name: string, 
    status: ServiceStatus['status'], 
    message: string, 
    critical: boolean, 
    details?: any
  ): void {
    this.services.set(name, {
      name,
      status,
      message,
      critical,
      lastCheck: new Date().toISOString(),
      details
    })
  }

  /**
   * Get emoji for service status
   */
  private getStatusEmoji(status: ServiceStatus['status']): string {
    switch (status) {
      case 'healthy': return '✅'
      case 'degraded': return '⚠️'
      case 'unavailable': return '❌'
      case 'not_configured': return '🔵'
      default: return '❓'
    }
  }

  /**
   * Get current service statuses
   */
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.services.values())
  }

  /**
   * Check if a specific service is healthy
   */
  isServiceHealthy(serviceName: string): boolean {
    const service = this.services.get(serviceName)
    return service?.status === 'healthy'
  }

  /**
   * Check if a specific service is available (healthy or degraded)
   */
  isServiceAvailable(serviceName: string): boolean {
    const service = this.services.get(serviceName)
    return service?.status === 'healthy' || service?.status === 'degraded'
  }
}

// Singleton instance
export const startupValidator = new StartupValidator()

// Convenience function for external use
export async function validateEnvironmentAndServices(): Promise<StartupValidationResult> {
  return startupValidator.validateStartup()
}