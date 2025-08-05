import { validateEnvironmentAndServices, StartupValidator } from '../config/startup.js'

describe('Startup Validation', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = process.env
    // Reset to minimal environment
    process.env = {
      NODE_ENV: 'test'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Environment Validation', () => {
    it('should pass with minimal configuration in test environment', async () => {
      const result = await validateEnvironmentAndServices()
      expect(result.success).toBe(true)
      expect(result.canStart).toBe(true)
      expect(result.criticalFailures).toHaveLength(0)
    })

    it('should handle missing DATABASE_URL gracefully in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const result = await validateEnvironmentAndServices()
      expect(result.canStart).toBe(true)
      expect(result.warnings.some(w => w.includes('Database not configured'))).toBe(true)
    })

    it('should fail in production without DATABASE_URL', async () => {
      process.env.NODE_ENV = 'production'
      // Missing DATABASE_URL in production should be critical
      
      const result = await validateEnvironmentAndServices()
      expect(result.canStart).toBe(false)
      expect(result.criticalFailures.some(f => f.includes('DATABASE_URL is required in production'))).toBe(true)
    })

    it('should handle missing Firebase configuration gracefully', async () => {
      const result = await validateEnvironmentAndServices()
      expect(result.canStart).toBe(true)
      
      const firebaseService = result.services.find(s => s.name === 'Firebase')
      expect(firebaseService?.status).toBe('not_configured')
      expect(result.warnings.some(w => w.includes('Firebase not configured'))).toBe(true)
    })

    it('should handle missing OpenAI configuration gracefully', async () => {
      const result = await validateEnvironmentAndServices()
      expect(result.canStart).toBe(true)
      
      const openaiService = result.services.find(s => s.name === 'OpenAI')
      expect(openaiService?.status).toBe('not_configured')
      expect(result.warnings.some(w => w.includes('OpenAI not configured'))).toBe(true)
    })

    it('should handle missing Stripe configuration gracefully', async () => {
      const result = await validateEnvironmentAndServices()
      expect(result.canStart).toBe(true)
      
      const stripeService = result.services.find(s => s.name === 'Stripe')
      expect(stripeService?.status).toBe('not_configured')
      expect(result.warnings.some(w => w.includes('Stripe not configured'))).toBe(true)
    })
  })

  describe('Service Status Tracking', () => {
    it('should track service statuses correctly', async () => {
      const validator = new StartupValidator()
      const result = await validator.validateStartup()
      
      const statuses = validator.getServiceStatuses()
      expect(statuses.length).toBeGreaterThan(0)
      
      // Should have environment service at minimum
      const envService = statuses.find(s => s.name.includes('Environment'))
      expect(envService).toBeDefined()
      expect(envService?.lastCheck).toBeDefined()
    })

    it('should provide helper methods for service availability', async () => {
      const validator = new StartupValidator()
      await validator.validateStartup()
      
      // These should work without throwing
      const isHealthy = validator.isServiceHealthy('Database')
      const isAvailable = validator.isServiceAvailable('Database')
      
      expect(typeof isHealthy).toBe('boolean')
      expect(typeof isAvailable).toBe('boolean')
    })
  })

  describe('Configuration Warnings', () => {
    it('should warn about test keys in production', async () => {
      process.env.NODE_ENV = 'production'
      process.env.STRIPE_SECRET_KEY = 'sk_test_123456'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      
      const result = await validateEnvironmentAndServices()
      expect(result.warnings.some(w => w.includes('test keys in production'))).toBe(true)
    })

    it('should warn about live keys in development', async () => {
      process.env.NODE_ENV = 'development'
      process.env.STRIPE_SECRET_KEY = 'sk_live_123456'
      
      const result = await validateEnvironmentAndServices()
      expect(result.warnings.some(w => w.includes('live keys in development'))).toBe(true)
    })

    it('should validate JWT secret length in production', async () => {
      process.env.NODE_ENV = 'production'
      process.env.JWT_SECRET = 'short'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      
      const result = await validateEnvironmentAndServices()
      expect(result.criticalFailures.some(f => f.includes('JWT_SECRET must be at least 32 characters'))).toBe(true)
    })
  })

  describe('Service Health Status', () => {
    it('should return proper status responses', async () => {
      const result = await validateEnvironmentAndServices()
      
      result.services.forEach(service => {
        expect(service.name).toBeDefined()
        expect(['healthy', 'degraded', 'unavailable', 'not_configured']).toContain(service.status)
        expect(service.message).toBeDefined()
        expect(typeof service.critical).toBe('boolean')
        expect(service.lastCheck).toBeDefined()
      })
    })

    it('should have proper service summary', async () => {
      const result = await validateEnvironmentAndServices()
      
      const healthyCount = result.services.filter(s => s.status === 'healthy').length
      const totalCount = result.services.length
      
      expect(healthyCount).toBeGreaterThanOrEqual(0)
      expect(totalCount).toBeGreaterThan(0)
      expect(healthyCount).toBeLessThanOrEqual(totalCount)
    })
  })
})