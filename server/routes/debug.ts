import { Router } from 'express'
import { FirebaseService } from '../services/firebaseService.js'
import { APIResponse } from '../../shared/types.js'

const router = Router()

// Comprehensive Firebase configuration diagnostic
router.get('/firebase', async (req, res) => {
  // Only enable in development or with explicit flag
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Debug routes disabled in production'
    })
  }

  console.log('🔍 Starting Firebase diagnostic...')
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      environmentVariables: {} as any,
      jsonParsing: {} as any,
      firebaseService: {} as any,
      connectivity: {} as any
    }
  }

  // Check 1: Environment Variables
  try {
    console.log('Checking environment variables...')
    
    diagnostic.checks.environmentVariables = {
      FIREBASE_PROJECT_ID: {
        present: !!process.env.FIREBASE_PROJECT_ID,
        value: process.env.FIREBASE_PROJECT_ID || 'MISSING',
        length: process.env.FIREBASE_PROJECT_ID?.length || 0
      },
      FIREBASE_SERVICE_ACCOUNT_KEY: {
        present: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        length: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
        startsWithBrace: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.startsWith('{') || false,
        endsWithBrace: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.endsWith('}') || false
      }
    }
    
    console.log('✅ Environment variables check completed')
  } catch (error) {
    console.error('❌ Environment variables check failed:', error)
    diagnostic.checks.environmentVariables.error = error instanceof Error ? error.message : 'Unknown error'
  }

  // Check 2: JSON Parsing
  try {
    console.log('Testing JSON parsing...')
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      
      diagnostic.checks.jsonParsing = {
        success: true,
        hasType: 'type' in parsed,
        typeValue: parsed.type,
        hasProjectId: 'project_id' in parsed,
        projectIdValue: parsed.project_id,
        hasPrivateKey: 'private_key' in parsed,
        privateKeyLength: parsed.private_key?.length || 0,
        privateKeyStartsCorrect: parsed.private_key?.startsWith('-----BEGIN PRIVATE KEY-----') || false,
        privateKeyEndsCorrect: parsed.private_key?.endsWith('-----END PRIVATE KEY-----\n') || false,
        privateKeyHasNewlines: parsed.private_key?.includes('\n') || false,
        hasClientEmail: 'client_email' in parsed,
        clientEmailValue: parsed.client_email,
        allRequiredFields: ['type', 'project_id', 'private_key', 'client_email', 'client_id'].every(field => field in parsed)
      }
      
      console.log('✅ JSON parsing completed successfully')
    } else {
      diagnostic.checks.jsonParsing = {
        success: false,
        error: 'FIREBASE_SERVICE_ACCOUNT_KEY not found'
      }
    }
  } catch (error) {
    console.error('❌ JSON parsing failed:', error)
    diagnostic.checks.jsonParsing = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown JSON parsing error'
    }
  }

  // Check 3: Firebase Service Status
  try {
    console.log('Testing Firebase service status...')
    
    diagnostic.checks.firebaseService = {
      isConfigured: FirebaseService.isConfigured(),
      initializationAttempted: true
    }
    
    // Try to get the status
    const status = FirebaseService.getStatus()
    diagnostic.checks.firebaseService.status = status
    
    console.log('✅ Firebase service check completed')
  } catch (error) {
    console.error('❌ Firebase service check failed:', error)
    diagnostic.checks.firebaseService = {
      isConfigured: false,
      error: error instanceof Error ? error.message : 'Unknown Firebase service error'
    }
  }

  // Check 4: Firebase Connectivity Test
  try {
    console.log('Testing Firebase connectivity...')
    
    if (FirebaseService.isConfigured()) {
      // Try to verify a dummy token to test connectivity
      try {
        await FirebaseService.verifyIdToken('dummy-token')
      } catch (verifyError: any) {
        // We expect this to fail, but it should fail with a specific Firebase error
        // not an initialization error
        if (verifyError.code === 'auth/argument-error') {
          diagnostic.checks.connectivity = {
            success: true,
            message: 'Firebase Admin SDK is properly initialized (dummy token correctly rejected)'
          }
        } else {
          diagnostic.checks.connectivity = {
            success: false,
            firebaseError: verifyError.code,
            message: verifyError.message
          }
        }
      }
    } else {
      diagnostic.checks.connectivity = {
        success: false,
        error: 'Firebase service not configured, cannot test connectivity'
      }
    }
    
    console.log('✅ Firebase connectivity test completed')
  } catch (error) {
    console.error('❌ Firebase connectivity test failed:', error)
    diagnostic.checks.connectivity = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connectivity error'
    }
  }

  console.log('🔍 Firebase diagnostic completed')
  console.log('Full diagnostic results:', JSON.stringify(diagnostic, null, 2))

  res.json({
    success: true,
    diagnostic
  })
})

// Simple Firebase health endpoint
router.get('/firebase/simple', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return res.status(403).json({ success: false, error: 'Debug routes disabled' })
  }

  try {
    const isConfigured = FirebaseService.isConfigured()
    const status = FirebaseService.getStatus()
    
    res.json({
      success: true,
      firebase: {
        configured: isConfigured,
        status: status,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router