import { setupDatabase, getDatabaseHealth, databaseMonitor, connectionPool } from './config.js'
import * as schema from './schema.js'

// Initialize database connection with monitoring
const connection = setupDatabase()

// Export the database instance
export const db = connection.db
export const client = connection.client

// Health check function with enhanced monitoring
export async function checkDatabaseConnection() {
  try {
    const health = await getDatabaseHealth()
    databaseMonitor.updateHealthCheck()
    return health
  } catch (error) {
    console.error('Database connection failed:', error)
    databaseMonitor.recordError()
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Graceful shutdown with connection pool cleanup
export async function closeDatabaseConnection() {
  try {
    await connectionPool.closeAllConnections()
    await connection.close()
    console.log('Database connections closed successfully')
  } catch (error) {
    console.error('Error closing database connections:', error)
    throw error
  }
}

// Export database utilities
export { getDatabaseHealth, databaseMonitor, connectionPool }

// Export schema for external use
export * from './schema.js'
export * from './utils.js'