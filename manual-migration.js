import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  console.log('🔍 Starting manual Supabase migration...');
  console.log('📡 Connection string:', connectionString.replace(/:[^@]+@/, ':****@'));
  
  try {
    // Create postgres connection
    const sql = postgres(connectionString, {
      ssl: 'require',
      max: 1
    });
    
    console.log('✅ Connected to Supabase');
    
    // Initialize Drizzle
    const db = drizzle(sql);
    console.log('✅ Drizzle ORM initialized');
    
    // Run migrations
    console.log('📦 Running migrations from ./migrations directory...');
    await migrate(db, { migrationsFolder: './migrations' });
    
    console.log('✅ All migrations completed successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n📋 Created ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    await sql.end();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('🚀 Supabase database is now ready for production deployment');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('🔧 Error details:', error);
    
    if (error.message.includes('ENOENT') && error.message.includes('migrations')) {
      console.log('\n💡 No migrations directory found. Let me generate migrations first...');
      console.log('Run: npm run db:generate');
    }
    
    throw error;
  }
}

runMigration();