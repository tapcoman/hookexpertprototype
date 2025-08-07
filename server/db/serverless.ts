// Serverless Database Connection Pool for Vercel
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './sqlite-schema.js'

interface ServerlessConnectionConfig {
  connectionString: string
  maxConnections: number
  idleTimeout: number
  connectTimeout: number
  ssl: boolean | 'require'
}

class ServerlessConnectionPool {
  private static instance: ServerlessConnectionPool
  private connections: Map<string, any> = new Map()
  private connectionPromises: Map<string, Promise<any>> = new Map()
  private lastActivity: Map<string, number> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  private constructor() {
    // Start cleanup interval for idle connections
    this.startCleanupInterval()
  }

  static getInstance(): ServerlessConnectionPool {
    if (!ServerlessConnectionPool.instance) {
      ServerlessConnectionPool.instance = new ServerlessConnectionPool()
    }
    return ServerlessConnectionPool.instance
  }

  private getConfig(): ServerlessConnectionConfig {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    return {
      connectionString,
      maxConnections: process.env.VERCEL === '1' ? 1 : 5, // Single connection for serverless
      idleTimeout: 20, // 20 seconds for serverless
      connectTimeout: 10, // 10 seconds timeout
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false
    }
  }

  private createConnection(key: string): postgres.Sql {
    const config = this.getConfig()
    
    const client = postgres(config.connectionString, {
      max: config.maxConnections,
      idle_timeout: config.idleTimeout,
      connect_timeout: config.connectTimeout,
      ssl: config.ssl,
      // Serverless optimizations
      prepare: false, // Disable prepared statements for serverless
      transform: postgres.camel, // Transform snake_case to camelCase
      onnotice: () => {}, // Disable notices in production
      debug: false, // Disable debug logging
      // Connection pooling optimizations for serverless
      connection: {
        application_name: 'hook-line-studio-serverless',
        statement_timeout: 30000, // 30 second query timeout
        idle_in_transaction_session_timeout: 10000 // 10 second idle timeout
      }
    })

    return client
  }

  async getConnection(key: string = 'default'): Promise<{ db: ReturnType<typeof drizzle>; client: postgres.Sql }> {
    // Check if connection already exists and is recent
    if (this.connections.has(key)) {
      const lastActivity = this.lastActivity.get(key) || 0
      const now = Date.now()
      
      // If connection was used recently (within 30 seconds), reuse it
      if (now - lastActivity < 30000) {
        this.lastActivity.set(key, now)
        return this.connections.get(key)
      } else {
        // Connection is stale, remove it
        await this.closeConnection(key)
      }
    }

    // Check if connection is being created
    if (this.connectionPromises.has(key)) {
      return await this.connectionPromises.get(key)!
    }

    // Create new connection
    const connectionPromise = this.createConnectionAsync(key)
    this.connectionPromises.set(key, connectionPromise)

    try {
      const connection = await connectionPromise
      this.connections.set(key, connection)
      this.lastActivity.set(key, Date.now())
      this.connectionPromises.delete(key)
      return connection
    } catch (error) {
      this.connectionPromises.delete(key)
      throw error
    }
  }

  private async createConnectionAsync(key: string): Promise<{ db: ReturnType<typeof drizzle>; client: postgres.Sql }> {
    const client = this.createConnection(key)
    
    // Test connection
    try {
      await client`SELECT 1`
    } catch (error) {
      await client.end()
      throw new Error(`Failed to establish database connection: ${error}`)
    }

    const db = drizzle(client, { schema })

    return { db, client }
  }

  async closeConnection(key: string): Promise<void> {
    const connection = this.connections.get(key)
    if (connection) {
      try {
        await connection.client.end()
      } catch (error) {
        console.error(`Error closing connection ${key}:`, error)
      }
      this.connections.delete(key)
      this.lastActivity.delete(key)
    }

    const connectionPromise = this.connectionPromises.get(key)
    if (connectionPromise) {
      this.connectionPromises.delete(key)
    }
  }

  async closeAllConnections(): Promise<void> {
    const keys = Array.from(this.connections.keys())
    await Promise.all(keys.map(key => this.closeConnection(key)))
  }

  private startCleanupInterval(): void {
    // Clean up idle connections every 60 seconds
    this.cleanupInterval = setInterval(async () => {
      const now = Date.now()
      const keysToClose: string[] = []

      for (const [key, lastActivity] of this.lastActivity.entries()) {
        // Close connections idle for more than 2 minutes
        if (now - lastActivity > 120000) {
          keysToClose.push(key)
        }
      }

      for (const key of keysToClose) {
        await this.closeConnection(key)
      }
    }, 60000)
  }

  getStats(): {
    activeConnections: number
    pendingConnections: number
    connectionKeys: string[]
  } {
    return {
      activeConnections: this.connections.size,
      pendingConnections: this.connectionPromises.size,
      connectionKeys: Array.from(this.connections.keys())
    }
  }

  async healthCheck(): Promise<{
    connected: boolean
    connectionCount: number
    lastActivity: string
    error?: string
  }> {
    try {
      const { client } = await this.getConnection('health-check')
      await client`SELECT 1`
      
      return {
        connected: true,
        connectionCount: this.connections.size,
        lastActivity: new Date().toISOString()
      }
    } catch (error) {
      return {
        connected: false,
        connectionCount: this.connections.size,
        lastActivity: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Graceful shutdown for serverless environments
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    await this.closeAllConnections()
  }
}

// Export singleton instance
export const serverlessPool = ServerlessConnectionPool.getInstance()

// Convenience function to get database connection
export async function getServerlessDB() {
  const { db } = await serverlessPool.getConnection()
  return db
}

// Export for health checks
export async function checkServerlessConnection() {
  return await serverlessPool.healthCheck()
}

// Graceful shutdown for serverless
export async function closeServerlessConnections() {
  await serverlessPool.shutdown()
}

// Export stats for monitoring
export function getServerlessStats() {
  return serverlessPool.getStats()
}