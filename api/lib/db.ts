import { drizzle } from 'drizzle-orm/neon-serverless'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Simple database setup for Vercel serverless functions
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create Neon SQL connection
const sql = neon(process.env.DATABASE_URL)

// Create Drizzle database instance with schema
export const db = drizzle(sql, { schema })

// Simple health check
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`
    return { success: true, result }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}