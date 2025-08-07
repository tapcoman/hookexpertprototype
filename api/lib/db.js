const { neon } = require('@neondatabase/serverless')

// Simple database setup for Vercel serverless functions
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  // Return a mock connection for now to prevent crashes
  module.exports = {
    db: {
      query: async () => ({ rows: [] })
    },
    testConnection: async () => ({ success: false, error: 'No database URL configured' })
  }
  return
}

// Create Neon SQL connection
const sql = neon(process.env.DATABASE_URL)

// Create a simple query interface
const db = {
  query: async (text, params) => {
    try {
      const result = await sql(text, params)
      return { rows: result }
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }
}

// Simple health check
async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`
    return { success: true, result }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

module.exports = {
  db,
  testConnection
}