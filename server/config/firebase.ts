import { FirebaseService } from '../services/firebaseService.js'

/**
 * Firebase configuration and initialization
 */
export class FirebaseConfig {
  private static initialized = false

  /**
   * Initialize Firebase with comprehensive configuration validation
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true
    }

    try {
      // Validate environment variables
      const requiredEnvVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_SERVICE_ACCOUNT_KEY'
      ]

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
      
      if (missingVars.length > 0) {
        console.warn(`⚠️ Missing Firebase environment variables: ${missingVars.join(', ')}`)
        console.warn('Firebase authentication will be disabled')
        return false
      }

      // Validate service account key format
      try {
        const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)
        
        const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
        const missingFields = requiredFields.filter(field => !serviceAccountKey[field])
        
        if (missingFields.length > 0) {
          console.error(`❌ Invalid Firebase service account key. Missing fields: ${missingFields.join(', ')}`)
          return false
        }

        if (serviceAccountKey.project_id !== process.env.FIREBASE_PROJECT_ID) {
          console.error('❌ Firebase project ID mismatch between service account and environment variable')
          return false
        }

      } catch (error) {
        console.error('❌ Invalid JSON format in FIREBASE_SERVICE_ACCOUNT_KEY')
        return false
      }

      // Initialize Firebase service
      const success = FirebaseService.initialize()
      
      if (success) {
        this.initialized = true
        console.log('✅ Firebase configuration validated and initialized')
        
        // Optional: Test connection
        if (process.env.NODE_ENV === 'development') {
          await this.testConnection()
        }
      }

      return success
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error)
      return false
    }
  }

  /**
   * Test Firebase connection and functionality
   */
  private static async testConnection(): Promise<void> {
    try {
      const healthCheck = await FirebaseService.healthCheck()
      
      if (healthCheck.status === 'connected') {
        console.log('✅ Firebase connection test successful')
      } else {
        console.warn(`⚠️ Firebase connection test failed: ${healthCheck.details}`)
      }
    } catch (error) {
      console.warn('⚠️ Firebase connection test error:', error)
    }
  }

  /**
   * Get Firebase configuration status
   */
  static getStatus(): {
    initialized: boolean
    configured: boolean
    projectId?: string
    environment: string
  } {
    return {
      initialized: this.initialized,
      configured: FirebaseService.isConfigured(),
      projectId: FirebaseService.getProjectId(),
      environment: process.env.NODE_ENV || 'development'
    }
  }

  /**
   * Validate Firebase environment configuration
   */
  static validateEnvironment(): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      errors.push('FIREBASE_PROJECT_ID is required')
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      errors.push('FIREBASE_SERVICE_ACCOUNT_KEY is required')
    }

    // Validate service account key format
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        
        if (serviceAccount.type !== 'service_account') {
          errors.push('Firebase service account key must be of type "service_account"')
        }

        if (!serviceAccount.private_key || !serviceAccount.client_email) {
          errors.push('Firebase service account key is missing required fields')
        }

        if (serviceAccount.project_id !== process.env.FIREBASE_PROJECT_ID) {
          errors.push('Firebase project ID mismatch between service account and environment variable')
        }

      } catch (error) {
        errors.push('FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON')
      }
    }

    // Check optional configurations
    if (!process.env.REQUIRE_EMAIL_VERIFICATION && process.env.NODE_ENV === 'production') {
      warnings.push('REQUIRE_EMAIL_VERIFICATION not set for production environment')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get Firebase security recommendations
   */
  static getSecurityRecommendations(): string[] {
    const recommendations: string[] = []

    // Production security checks
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.REQUIRE_EMAIL_VERIFICATION) {
        recommendations.push('Enable email verification requirement for production')
      }

      if (!process.env.HELMET_CSP_ENABLED) {
        recommendations.push('Enable Content Security Policy (CSP) for production')
      }

      if (!process.env.RATE_LIMIT_MAX_REQUESTS || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) > 1000) {
        recommendations.push('Set appropriate rate limits for authentication endpoints')
      }
    }

    // General security recommendations
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      recommendations.push('Use a strong JWT secret (minimum 32 characters)')
    }

    recommendations.push('Regularly rotate Firebase service account keys')
    recommendations.push('Monitor Firebase authentication logs for suspicious activity')
    recommendations.push('Implement proper CORS configuration for your domain')

    return recommendations
  }

  /**
   * Export Firebase configuration for client-side use (safe values only)
   */
  static getClientConfig(): {
    projectId?: string
    authEnabled: boolean
    requireEmailVerification: boolean
    environment: string
  } {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      authEnabled: this.initialized,
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
      environment: process.env.NODE_ENV || 'development'
    }
  }
}

// Auto-initialize on import in non-test environments
if (process.env.NODE_ENV !== 'test') {
  FirebaseConfig.initialize().catch(error => {
    console.error('Failed to auto-initialize Firebase:', error)
  })
}