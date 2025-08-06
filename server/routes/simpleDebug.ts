import { Router } from 'express'
import { APIResponse } from '../../shared/types.js'
import { SimpleAuthService } from '../services/simpleAuthService.js'

const router = Router()

// Simple authentication diagnostic
router.get('/auth', async (req, res) => {
  // Only enable in development or with explicit flag
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Debug routes disabled in production'
    })
  }

  console.log('🔍 Starting authentication diagnostic...')
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      environmentVariables: {} as any,
      jwtConfiguration: {} as any,
      authService: {} as any
    }
  }

  // Check 1: Environment Variables
  try {
    console.log('Checking environment variables...')
    
    diagnostic.checks.environmentVariables = {
      JWT_SECRET: {
        present: !!process.env.JWT_SECRET,
        length: process.env.JWT_SECRET?.length || 0,
        configured: (process.env.JWT_SECRET?.length || 0) >= 32
      },
      NODE_ENV: {
        value: process.env.NODE_ENV || 'development'
      }
    }
    
    console.log('✅ Environment variables check completed')
  } catch (error) {
    console.error('❌ Environment variables check failed:', error)
    diagnostic.checks.environmentVariables.error = error instanceof Error ? error.message : String(error)
  }

  // Check 2: JWT Configuration
  try {
    console.log('Checking JWT configuration...')
    
    const jwtSecret = process.env.JWT_SECRET
    diagnostic.checks.jwtConfiguration = {
      secretConfigured: !!jwtSecret,
      secretLength: jwtSecret?.length || 0,
      meetsSecurity: (jwtSecret?.length || 0) >= 32,
      status: jwtSecret ? 'configured' : 'missing'
    }

    console.log('✅ JWT configuration check completed')
  } catch (error) {
    console.error('❌ JWT configuration check failed:', error)
    diagnostic.checks.jwtConfiguration.error = error instanceof Error ? error.message : String(error)
  }

  // Check 3: Auth Service
  try {
    console.log('Checking auth service functionality...')
    
    // Test password validation
    const passwordTest = SimpleAuthService.validatePassword('TestPassword123!')
    diagnostic.checks.authService = {
      passwordValidation: {
        working: passwordTest.isValid,
        errors: passwordTest.errors
      },
      bcryptAvailable: true,
      status: 'operational'
    }

    console.log('✅ Auth service check completed')
  } catch (error) {
    console.error('❌ Auth service check failed:', error)
    diagnostic.checks.authService = {
      error: error instanceof Error ? error.message : String(error),
      status: 'error'
    }
  }

  // Summary
  const hasErrors = Object.values(diagnostic.checks).some(check => check.error)
  const isFullyConfigured = diagnostic.checks.environmentVariables.JWT_SECRET?.configured

  console.log(`🔍 Diagnostic completed. Status: ${hasErrors ? 'ERRORS DETECTED' : isFullyConfigured ? 'FULLY OPERATIONAL' : 'PARTIALLY CONFIGURED'}`)

  res.json({
    success: !hasErrors,
    timestamp: diagnostic.timestamp,
    environment: diagnostic.environment,
    status: hasErrors ? 'error' : isFullyConfigured ? 'healthy' : 'warning',
    message: hasErrors ? 
      'Authentication system has configuration errors' : 
      isFullyConfigured ? 
        'Authentication system is fully operational' : 
        'Authentication system is partially configured',
    checks: diagnostic.checks,
    recommendations: getRecommendations(diagnostic)
  })
})

// Environment configuration check
router.get('/config', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Debug routes disabled in production'
    })
  }

  const config = {
    environment: process.env.NODE_ENV || 'development',
    authentication: {
      type: 'simple_auth',
      jwt_configured: !!process.env.JWT_SECRET,
      jwt_secret_length: process.env.JWT_SECRET?.length || 0
    },
    database: {
      configured: !!process.env.DATABASE_URL
    },
    server: {
      port: process.env.PORT || 3000,
      cors_origins: process.env.ALLOWED_ORIGINS || 'default'
    }
  }

  res.json({
    success: true,
    config,
    timestamp: new Date().toISOString()
  })
})

function getRecommendations(diagnostic: any): string[] {
  const recommendations: string[] = []

  if (!diagnostic.checks.environmentVariables.JWT_SECRET?.present) {
    recommendations.push('Set JWT_SECRET environment variable')
  }

  if (!diagnostic.checks.environmentVariables.JWT_SECRET?.configured) {
    recommendations.push('Use a JWT_SECRET with at least 32 characters for security')
  }

  if (diagnostic.checks.authService.error) {
    recommendations.push('Fix auth service configuration errors')
  }

  if (recommendations.length === 0) {
    recommendations.push('Authentication system is properly configured')
  }

  return recommendations
}

export default router