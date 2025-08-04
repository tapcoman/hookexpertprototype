#!/usr/bin/env tsx
/**
 * Production Deployment Script for Hook Line Studio
 * Handles database migrations, environment validation, and deployment preparation
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, existsSync } from 'fs'
import { config } from 'dotenv'

const execAsync = promisify(exec)

// Load environment variables
config()

interface DeploymentConfig {
  environment: 'staging' | 'production'
  skipMigrations: boolean
  skipTests: boolean
  verbose: boolean
}

class ProductionDeployer {
  private config: DeploymentConfig

  constructor(config: DeploymentConfig) {
    this.config = config
  }

  async deploy() {
    console.log('🚀 Starting Hook Line Studio deployment...')
    console.log(`Environment: ${this.config.environment}`)
    
    try {
      await this.validateEnvironment()
      await this.validateDependencies()
      
      if (!this.config.skipTests) {
        await this.runTests()
      }
      
      await this.buildApplication()
      
      if (!this.config.skipMigrations) {
        await this.runMigrations()
      }
      
      await this.validateDeployment()
      
      console.log('✅ Deployment completed successfully!')
      
    } catch (error) {
      console.error('❌ Deployment failed:', error)
      process.exit(1)
    }
  }

  private async validateEnvironment() {
    console.log('🔍 Validating environment variables...')
    
    const requiredVars = [
      'DATABASE_URL',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      'OPENAI_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'JWT_SECRET'
    ]

    const missingVars = requiredVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
    }

    // Validate JWT secret length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long')
    }

    // Validate database URL format
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
    }

    console.log('✅ Environment validation passed')
  }

  private async validateDependencies() {
    console.log('📦 Validating dependencies...')
    
    if (!existsSync('package.json')) {
      throw new Error('package.json not found')
    }

    if (!existsSync('client/package.json')) {
      throw new Error('client/package.json not found')
    }

    // Check for package-lock.json files
    if (!existsSync('package-lock.json')) {
      console.warn('⚠️  Root package-lock.json not found - this may cause inconsistent builds')
    }

    if (!existsSync('client/package-lock.json')) {
      console.warn('⚠️  Client package-lock.json not found - this may cause inconsistent builds')
    }

    console.log('✅ Dependencies validation passed')
  }

  private async runTests() {
    console.log('🧪 Running test suite...')
    
    try {
      // Run unit tests
      await execAsync('npm run test:unit', { cwd: process.cwd() })
      console.log('✅ Unit tests passed')

      // Run integration tests
      await execAsync('npm run test:integration', { cwd: process.cwd() })
      console.log('✅ Integration tests passed')

      // Type checking
      await execAsync('npm run type-check', { cwd: process.cwd() })
      console.log('✅ Type checking passed')

    } catch (error) {
      throw new Error(`Tests failed: ${error}`)
    }
  }

  private async buildApplication() {
    console.log('🏗️  Building application...')
    
    try {
      // Install dependencies
      console.log('Installing root dependencies...')
      await execAsync('npm ci', { cwd: process.cwd() })

      console.log('Installing client dependencies...')
      await execAsync('npm ci', { cwd: 'client' })

      // Build client
      console.log('Building client application...')
      await execAsync('npm run build', { cwd: 'client' })

      // Verify build output
      if (!existsSync('client/dist/index.html')) {
        throw new Error('Client build failed - index.html not found')
      }

      console.log('✅ Application build completed')

    } catch (error) {
      throw new Error(`Build failed: ${error}`)
    }
  }

  private async runMigrations() {
    console.log('🗄️  Running database migrations...')
    
    try {
      // Generate migrations if needed
      await execAsync('npm run db:generate', { cwd: process.cwd() })
      
      // Run migrations
      await execAsync('npm run db:migrate', { cwd: process.cwd() })
      
      console.log('✅ Database migrations completed')

    } catch (error) {
      if (this.config.environment === 'production') {
        throw new Error(`Migration failed: ${error}`)
      } else {
        console.warn(`⚠️  Migration warning: ${error}`)
      }
    }
  }

  private async validateDeployment() {
    console.log('🔍 Validating deployment...')
    
    // Check if all required files exist
    const requiredFiles = [
      'client/dist/index.html',
      'client/dist/assets',
      'api/index.ts',
      'vercel.json'
    ]

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required file missing: ${file}`)
      }
    }

    // Validate vercel.json
    try {
      const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf-8'))
      
      if (!vercelConfig.functions || !vercelConfig.functions['api/index.ts']) {
        throw new Error('vercel.json missing function configuration')
      }

      if (!vercelConfig.routes) {
        throw new Error('vercel.json missing routes configuration')
      }

    } catch (error) {
      throw new Error(`Invalid vercel.json: ${error}`)
    }

    console.log('✅ Deployment validation passed')
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  const config: DeploymentConfig = {
    environment: args.includes('--staging') ? 'staging' : 'production',
    skipMigrations: args.includes('--skip-migrations'),
    skipTests: args.includes('--skip-tests'),
    verbose: args.includes('--verbose')
  }

  if (args.includes('--help')) {
    console.log(`
Hook Line Studio Production Deployment Script

Usage: tsx scripts/deploy-production.ts [options]

Options:
  --staging           Deploy to staging environment
  --skip-migrations   Skip database migrations
  --skip-tests        Skip test suite
  --verbose           Enable verbose logging
  --help             Show this help message

Environment Variables Required:
  DATABASE_URL                PostgreSQL connection string
  FIREBASE_PROJECT_ID         Firebase project ID
  FIREBASE_SERVICE_ACCOUNT_KEY Firebase service account JSON
  OPENAI_API_KEY             OpenAI API key
  STRIPE_SECRET_KEY          Stripe secret key
  STRIPE_WEBHOOK_SECRET      Stripe webhook secret
  JWT_SECRET                 JWT signing secret (32+ characters)

Example:
  tsx scripts/deploy-production.ts --staging
  tsx scripts/deploy-production.ts --skip-tests
    `)
    process.exit(0)
  }

  const deployer = new ProductionDeployer(config)
  await deployer.deploy()
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Deployment script failed:', error)
    process.exit(1)
  })
}

export { ProductionDeployer }