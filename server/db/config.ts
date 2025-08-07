import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from project root
const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '../../')
config({ path: join(projectRoot, '.env') })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './sqlite-schema.js'

export interface DatabaseConfig {
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  url?: string
  ssl?: boolean | 'require' | 'prefer'
  max?: number
  idle_timeout?: number
  connect_timeout?: number
}

export const defaultConfig: DatabaseConfig = {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: false
}

export const productionConfig: DatabaseConfig = {
  ...defaultConfig,
  max: 50,
  idle_timeout: 30,
  connect_timeout: 15,
  ssl: 'require'
}

export const developmentConfig: DatabaseConfig = {
  ...defaultConfig,
  max: 10,
  idle_timeout: 10,
  connect_timeout: 5,
  ssl: 'require' // Enable SSL for Neon in development
}

export const testConfig: DatabaseConfig = {
  ...defaultConfig,
  max: 5,
  idle_timeout: 5,
  connect_timeout: 3,
  ssl: false
}

export function getEnvironmentConfig(): DatabaseConfig {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return productionConfig
    case 'test':
      return testConfig
    case 'development':
    default:
      return developmentConfig
  }
}

export function createDatabaseConnection(config?: DatabaseConfig) {
  const finalConfig = { ...getEnvironmentConfig(), ...config }
  
  // Get connection string from environment or construct from parts
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${finalConfig.username}:${finalConfig.password}@${finalConfig.host}:${finalConfig.port}/${finalConfig.database}`
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required or provide connection config')
  }
  
  // Create postgres client with enhanced configuration
  const client = postgres(connectionString, {
    max: finalConfig.max,
    idle_timeout: finalConfig.idle_timeout,
    connect_timeout: finalConfig.connect_timeout,
    ssl: finalConfig.ssl,
    onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
    debug: process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true',
    // Enhanced error handling
    onclose: function(connection_id) {
      console.log(`Database connection ${connection_id} closed`)
    },
    onconnect: function(connection) {
      console.log(`Database connection established`)
    }
  })
  
  // Create drizzle instance
  return {
    db: drizzle(client, { schema }),
    client,
    async close() {
      await client.end()
    },
    async healthCheck() {
      const maxRetries = 3
      const retryDelay = 1000
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const start = Date.now()
          await client`SELECT 1 as health_check`
          const duration = Date.now() - start
          
          return { 
            connected: true, 
            timestamp: new Date().toISOString(),
            responseTime: duration,
            attempt,
            connectionString: connectionString.replace(/:[^:]*@/, ':***@') // Hide password
          }
        } catch (error) {
          if (attempt === maxRetries) {
            return { 
              connected: false, 
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
              attempts: attempt,
              connectionString: connectionString.replace(/:[^:]*@/, ':***@') // Hide password
            }
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
      
      // This should never be reached, but TypeScript needs it
      return { connected: false, error: 'Unexpected error', timestamp: new Date().toISOString() }
    }
  }
}

// Connection pool management
class ConnectionPool {
  private connections: Map<string, ReturnType<typeof createDatabaseConnection>> = new Map()
  
  getConnection(name: string = 'default', config?: DatabaseConfig) {
    if (!this.connections.has(name)) {
      this.connections.set(name, createDatabaseConnection(config))
    }
    return this.connections.get(name)!
  }
  
  async closeConnection(name: string) {
    const connection = this.connections.get(name)
    if (connection) {
      await connection.close()
      this.connections.delete(name)
    }
  }
  
  async closeAllConnections() {
    for (const [name, connection] of this.connections) {
      await connection.close()
    }
    this.connections.clear()
  }
  
  getActiveConnections() {
    return Array.from(this.connections.keys())
  }
}

export const connectionPool = new ConnectionPool()

// Migration utilities
export interface MigrationConfig {
  migrationsFolder?: string
  migrationsTable?: string
  schemaName?: string
}

export const migrationConfig: MigrationConfig = {
  migrationsFolder: './migrations',
  migrationsTable: '__drizzle_migrations',
  schemaName: 'public'
}

// Database monitoring utilities
export interface DatabaseMetrics {
  activeConnections: number
  totalQueries: number
  averageQueryTime: number
  slowQueries: number
  errors: number
  uptime: number
  lastHealthCheck: string
}

class DatabaseMonitor {
  private metrics: DatabaseMetrics = {
    activeConnections: 0,
    totalQueries: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    errors: 0,
    uptime: Date.now(),
    lastHealthCheck: new Date().toISOString()
  }
  
  private queryTimes: number[] = []
  private maxQueryTimeHistory = 1000
  
  recordQuery(duration: number) {
    this.metrics.totalQueries++
    this.queryTimes.push(duration)
    
    if (this.queryTimes.length > this.maxQueryTimeHistory) {
      this.queryTimes.shift()
    }
    
    if (duration > 1000) { // Slow query threshold: 1 second
      this.metrics.slowQueries++
    }
    
    this.metrics.averageQueryTime = 
      this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length
  }
  
  recordError() {
    this.metrics.errors++
  }
  
  updateConnectionCount(count: number) {
    this.metrics.activeConnections = count
  }
  
  updateHealthCheck() {
    this.metrics.lastHealthCheck = new Date().toISOString()
  }
  
  getMetrics(): DatabaseMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime
    }
  }
  
  reset() {
    this.metrics = {
      activeConnections: 0,
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      errors: 0,
      uptime: Date.now(),
      lastHealthCheck: new Date().toISOString()
    }
    this.queryTimes = []
  }
}

export const databaseMonitor = new DatabaseMonitor()

// Query interceptor for monitoring
export function createMonitoredConnection(config?: DatabaseConfig) {
  const connection = createDatabaseConnection(config)
  
  // Wrap the database proxy to monitor queries
  const originalDb = connection.db
  
  const monitoredDb = new Proxy(originalDb, {
    get(target, prop) {
      const value = target[prop as keyof typeof target]
      
      if (typeof value === 'function') {
        return function(...args: any[]) {
          const startTime = Date.now()
          
          try {
            const result = value.apply(target, args)
            
            // Handle async operations
            if (result && typeof result.then === 'function') {
              return result
                .then((res: any) => {
                  const duration = Date.now() - startTime
                  databaseMonitor.recordQuery(duration)
                  return res
                })
                .catch((error: Error) => {
                  databaseMonitor.recordError()
                  throw error
                })
            }
            
            const duration = Date.now() - startTime
            databaseMonitor.recordQuery(duration)
            return result
          } catch (error) {
            databaseMonitor.recordError()
            throw error
          }
        }
      }
      
      return value
    }
  })
  
  return {
    ...connection,
    db: monitoredDb
  }
}

// Environment-specific database setup
export function setupDatabase() {
  const env = process.env.NODE_ENV || 'development'
  
  console.log(`Setting up database for ${env} environment`)
  
  const connection = createMonitoredConnection()
  
  // Setup cleanup handlers
  process.on('SIGINT', async () => {
    console.log('Shutting down database connections...')
    await connectionPool.closeAllConnections()
    await connection.close()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    console.log('Shutting down database connections...')
    await connectionPool.closeAllConnections()
    await connection.close()
    process.exit(0)
  })
  
  return connection
}

// Database health check endpoint data
export async function getDatabaseHealth() {
  const connection = connectionPool.getConnection()
  const healthCheck = await connection.healthCheck()
  const metrics = databaseMonitor.getMetrics()
  
  return {
    ...healthCheck,
    metrics,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown'
  }
}