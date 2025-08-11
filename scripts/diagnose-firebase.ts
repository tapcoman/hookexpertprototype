#!/usr/bin/env node

/**
 * Firebase Configuration Diagnostic Script
 * 
 * This script helps diagnose Firebase configuration issues that cause
 * the "Too few bytes to read ASN.1 value" error and similar problems.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })

interface DiagnosticResult {
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

class FirebaseDiagnostic {
  private results: DiagnosticResult[] = []

  diagnose(): void {
    console.log('🔍 Firebase Configuration Diagnostic Tool')
    console.log('==========================================\n')

    this.checkEnvironmentVariables()
    this.checkServiceAccountKey()
    this.checkPrivateKeyFormat()
    this.checkProjectIdMatch()
    this.generateReport()
  }

  private checkEnvironmentVariables(): void {
    console.log('1. Checking Environment Variables...')
    
    const projectId = process.env.FIREBASE_PROJECT_ID
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

    if (!projectId) {
      this.results.push({
        status: 'fail',
        message: 'FIREBASE_PROJECT_ID is missing',
        details: 'Set FIREBASE_PROJECT_ID in your environment variables'
      })
    } else {
      this.results.push({
        status: 'pass',
        message: `FIREBASE_PROJECT_ID is set: ${projectId.substring(0, 20)}...`
      })
    }

    if (!serviceAccountKey) {
      this.results.push({
        status: 'fail',
        message: 'FIREBASE_SERVICE_ACCOUNT_KEY is missing',
        details: 'Set FIREBASE_SERVICE_ACCOUNT_KEY in your environment variables'
      })
    } else {
      this.results.push({
        status: 'pass',
        message: `FIREBASE_SERVICE_ACCOUNT_KEY is set (${serviceAccountKey.length} characters)`
      })
    }

    console.log('   ✓ Environment variables checked\n')
  }

  private checkServiceAccountKey(): void {
    console.log('2. Validating Service Account Key JSON...')
    
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
      console.log('   ⏭ Skipped (service account key not set)\n')
      return
    }

    try {
      const parsed = JSON.parse(serviceAccountKey)
      
      // Check required fields
      const requiredFields = [
        'type', 'project_id', 'private_key_id', 'private_key', 
        'client_email', 'client_id', 'auth_uri', 'token_uri'
      ]

      const missingFields = requiredFields.filter(field => !parsed[field])
      
      if (missingFields.length > 0) {
        this.results.push({
          status: 'fail',
          message: `Service account key missing required fields: ${missingFields.join(', ')}`,
          details: 'Regenerate the service account key from Firebase Console'
        })
      } else {
        this.results.push({
          status: 'pass',
          message: 'Service account key has all required fields'
        })
      }

      // Validate field values
      if (parsed.type !== 'service_account') {
        this.results.push({
          status: 'fail',
          message: `Invalid type: expected 'service_account', got '${parsed.type}'`
        })
      }

      if (!parsed.client_email?.includes('@')) {
        this.results.push({
          status: 'fail',
          message: 'Invalid client_email format'
        })
      } else {
        this.results.push({
          status: 'pass',
          message: `Valid client_email: ${parsed.client_email}`
        })
      }

      console.log('   ✓ Service account key JSON is valid\n')

    } catch (error) {
      this.results.push({
        status: 'fail',
        message: 'Service account key is not valid JSON',
        details: error instanceof Error ? error.message : 'Unknown parsing error'
      })
      console.log('   ❌ Service account key JSON parsing failed\n')
    }
  }

  private checkPrivateKeyFormat(): void {
    console.log('3. Validating Private Key Format...')
    
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
      console.log('   ⏭ Skipped (service account key not set)\n')
      return
    }

    try {
      const parsed = JSON.parse(serviceAccountKey)
      const privateKey = parsed.private_key

      if (!privateKey) {
        this.results.push({
          status: 'fail',
          message: 'Private key is missing from service account'
        })
        return
      }

      // Check private key format
      const issues: string[] = []
      
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        issues.push('Missing "-----BEGIN PRIVATE KEY-----" header')
      }
      
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        issues.push('Missing "-----END PRIVATE KEY-----" footer')
      }

      // Check for newline characters
      if (!privateKey.includes('\\n')) {
        issues.push('Private key may be missing newline characters (should contain \\n)')
      }

      // Check length (RSA private keys are typically 1600+ chars)
      if (privateKey.length < 1000) {
        issues.push(`Private key seems too short (${privateKey.length} chars)`)
      }

      // Basic ASN.1 format check - look for characteristic patterns
      const keyContent = privateKey.replace(/-----[^-]+-----/g, '').replace(/\\n/g, '')
      if (keyContent.length === 0) {
        issues.push('Private key content is empty')
      }

      if (issues.length > 0) {
        this.results.push({
          status: 'fail',
          message: 'Private key format issues detected',
          details: issues
        })
      } else {
        this.results.push({
          status: 'pass',
          message: `Private key format appears valid (${privateKey.length} chars)`
        })
      }

      console.log('   ✓ Private key format checked\n')

    } catch (error) {
      console.log('   ⏭ Skipped (could not parse service account key)\n')
    }
  }

  private checkProjectIdMatch(): void {
    console.log('4. Checking Project ID Consistency...')
    
    const envProjectId = process.env.FIREBASE_PROJECT_ID
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

    if (!envProjectId || !serviceAccountKey) {
      console.log('   ⏭ Skipped (missing required variables)\n')
      return
    }

    try {
      const parsed = JSON.parse(serviceAccountKey)
      const keyProjectId = parsed.project_id

      if (envProjectId !== keyProjectId) {
        this.results.push({
          status: 'fail',
          message: 'Project ID mismatch',
          details: {
            envProjectId,
            keyProjectId,
            solution: 'Ensure FIREBASE_PROJECT_ID matches the project_id in the service account key'
          }
        })
      } else {
        this.results.push({
          status: 'pass',
          message: `Project IDs match: ${envProjectId}`
        })
      }

      console.log('   ✓ Project ID consistency checked\n')

    } catch (error) {
      console.log('   ⏭ Skipped (could not parse service account key)\n')
    }
  }

  private generateReport(): void {
    console.log('📊 Diagnostic Report')
    console.log('===================')

    const passCount = this.results.filter(r => r.status === 'pass').length
    const failCount = this.results.filter(r => r.status === 'fail').length
    const warningCount = this.results.filter(r => r.status === 'warning').length

    console.log(`\nSummary: ${passCount} passed, ${failCount} failed, ${warningCount} warnings\n`)

    // Group results by status
    const failedTests = this.results.filter(r => r.status === 'fail')
    const warningTests = this.results.filter(r => r.status === 'warning')
    const passedTests = this.results.filter(r => r.status === 'pass')

    if (failedTests.length > 0) {
      console.log('❌ FAILED CHECKS:')
      failedTests.forEach(result => {
        console.log(`   • ${result.message}`)
        if (result.details) {
          if (Array.isArray(result.details)) {
            result.details.forEach(detail => console.log(`     - ${detail}`))
          } else {
            console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`)
          }
        }
      })
      console.log()
    }

    if (warningTests.length > 0) {
      console.log('⚠️  WARNINGS:')
      warningTests.forEach(result => {
        console.log(`   • ${result.message}`)
        if (result.details) {
          console.log(`     Details: ${result.details}`)
        }
      })
      console.log()
    }

    if (passedTests.length > 0) {
      console.log('✅ PASSED CHECKS:')
      passedTests.forEach(result => {
        console.log(`   • ${result.message}`)
      })
      console.log()
    }

    // Recommendations
    if (failCount > 0) {
      console.log('🔧 RECOMMENDED ACTIONS:')
      console.log('1. Go to Firebase Console > Project Settings > Service Accounts')
      console.log('2. Click "Generate new private key"')
      console.log('3. Download the JSON file')
      console.log('4. Copy the ENTIRE JSON content (including \\n characters in private_key)')
      console.log('5. Update FIREBASE_SERVICE_ACCOUNT_KEY in your deployment environment')
      console.log('6. Redeploy your application')
      console.log('7. Re-run this diagnostic to verify the fix')
      console.log()
    }

    // Exit code
    process.exit(failCount > 0 ? 1 : 0)
  }
}

// Run diagnostic
const diagnostic = new FirebaseDiagnostic()
diagnostic.diagnose()