#!/usr/bin/env tsx

import { seedDatabase } from '../server/db/seed.js'
import { checkDatabaseConnection, getDatabaseStats } from '../server/db/index.js'
import { updateHookFormulaTrends } from '../server/db/utils.js'

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n')
  
  try {
    // 1. Check database connection
    console.log('1. Checking database connection...')
    const healthCheck = await checkDatabaseConnection()
    
    if (!healthCheck.connected) {
      console.error('❌ Database connection failed:', healthCheck.error)
      process.exit(1)
    }
    
    console.log('✅ Database connection successful')
    console.log(`   Environment: ${healthCheck.environment || 'unknown'}`)
    console.log(`   Timestamp: ${healthCheck.timestamp}\n`)
    
    // 2. Seed hook formulas
    console.log('2. Seeding hook formulas...')
    await seedDatabase()
    console.log('✅ Hook formulas seeded successfully\n')
    
    // 3. Initialize trend tracking
    console.log('3. Initializing trend tracking...')
    await updateHookFormulaTrends()
    console.log('✅ Trend tracking initialized\n')
    
    // 4. Get database statistics
    console.log('4. Database statistics:')
    const stats = await getDatabaseStats()
    console.log(`   Users: ${stats.users}`)
    console.log(`   Hook Formulas: ${stats.hookFormulas}`)
    console.log(`   Generations: ${stats.generations}`)
    console.log(`   Performance Records: ${stats.performanceRecords}`)
    console.log(`   Last Updated: ${stats.lastUpdated}\n`)
    
    console.log('🎉 Database setup completed successfully!')
    console.log('\nNext steps:')
    console.log('- Run `npm run dev` to start the development server')
    console.log('- Run `npm run db:studio` to explore the database')
    console.log('- Check the API at /api/health for system status')
    
  } catch (error) {
    console.error('💥 Database setup failed:', error)
    process.exit(1)
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
}

export { setupDatabase }