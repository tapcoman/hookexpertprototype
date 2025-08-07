// Simple database configuration using SQLite
// This replaces the complex PostgreSQL setup for easy testing

import { db, checkDatabaseConnection, closeDatabaseConnection } from './sqlite.js'

// Re-export for compatibility with existing code
export { db, checkDatabaseConnection, closeDatabaseConnection }

// Export schema for external use
export * from './sqlite-schema.js'
export * from './utils.js'

// Simple health check that always works
export async function getDatabaseHealth() {
  const health = await checkDatabaseConnection()
  return health.connected
}

// Mock database monitor for compatibility
export const databaseMonitor = {
  updateHealthCheck: () => {},
  recordError: () => {},
  getStats: () => ({ healthy: true, errors: 0 })
}

// Mock connection pool for compatibility  
export const connectionPool = {
  closeAllConnections: async () => {},
  getStats: () => ({ active: 1, idle: 0 })
}

console.log('🗄️ Using SQLite database (simple setup)')