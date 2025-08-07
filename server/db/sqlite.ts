import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema.js'
import path from 'path'
import fs from 'fs'

// SQLite database file path (relative to project root)
const DB_PATH = path.join(process.cwd(), 'database.sqlite')

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Create SQLite connection
const sqlite = new Database(DB_PATH)

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('foreign_keys = ON')

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema })

// Health check function
export async function checkDatabaseConnection() {
  try {
    // Simple health check query
    const result = db.run('SELECT 1 as test')
    return {
      connected: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: {
        database: 'SQLite',
        path: DB_PATH,
        size: fs.statSync(DB_PATH).size + ' bytes'
      }
    }
  } catch (error) {
    console.error('SQLite connection failed:', error)
    return {
      connected: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Close database connection
export async function closeDatabaseConnection() {
  try {
    sqlite.close()
    console.log('SQLite database connection closed')
  } catch (error) {
    console.error('Error closing SQLite connection:', error)
    throw error
  }
}

// Export SQLite instance for direct access if needed
export { sqlite }

console.log('✅ SQLite database initialized at:', DB_PATH)