import { drizzle } from 'drizzle-orm/neon-serverless'
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import * as schema from './schema.js'

// Load environment variables from the project root
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')
dotenv.config({ path: join(projectRoot, '.env') })

console.log('Neon DB initialization debug:')
console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('- DATABASE_URL starts with postgresql:', process.env.DATABASE_URL?.startsWith('postgresql'))

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing. Current environment variables:')
  console.error('- NODE_ENV:', process.env.NODE_ENV)
  console.error('- Available env vars starting with DB:', Object.keys(process.env).filter(k => k.startsWith('DB')))
  throw new Error('DATABASE_URL environment variable is required')
}

// Create Neon SQL connection
const sql = neon(process.env.DATABASE_URL)

// Create Drizzle database instance with Neon
export const db = drizzle(sql, { schema })

// Health check function
export async function checkDatabaseConnection() {
  try {
    const result = await sql`SELECT 1 as test`
    return {
      connected: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: {
        database: 'Neon PostgreSQL',
        driver: 'serverless',
        result: result[0]
      }
    }
  } catch (error) {
    console.error('Neon connection failed:', error)
    return {
      connected: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Close function (no-op for serverless)
export async function closeDatabaseConnection() {
  // Neon serverless connections don't need explicit closing
  console.log('Neon serverless connection - no explicit close needed')
}

console.log('✅ Neon PostgreSQL database initialized')