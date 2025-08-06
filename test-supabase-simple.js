import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection with IPv4 only...');
  
  // Force IPv4 connection
  const connectionString = process.env.DATABASE_URL;
  console.log('📡 Connection string:', connectionString);
  
  const sql = postgres(connectionString, {
    ssl: 'require',
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    // Force IPv4
    host_type: 'ipv4'
  });

  try {
    // Test basic connection
    const result = await sql`SELECT version()`;
    console.log('✅ Connection successful!');
    console.log('📊 Database version:', result[0].version);
    
    // Test table listing
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Current tables:', tables.length);
    
    // Initialize Drizzle with the connection
    const db = drizzle(sql);
    console.log('✅ Drizzle ORM initialized successfully!');
    
    await sql.end();
    console.log('✅ Ready for migration!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔧 Error code:', error.code);
    
    // Try with connection pooling disabled
    console.log('🔄 Trying without connection pooling...');
    try {
      const simpleSql = postgres(connectionString, {
        ssl: 'require',
        max: 1,
        idle_timeout: 0,
        connect_timeout: 30
      });
      
      const testResult = await simpleSql`SELECT 1 as test`;
      console.log('✅ Simple connection works:', testResult[0]);
      await simpleSql.end();
      return true;
      
    } catch (simpleError) {
      console.error('❌ Simple connection also failed:', simpleError.message);
      return false;
    }
  }
}

testSupabaseConnection().then(success => {
  if (success) {
    console.log('🎉 Supabase connection verified - ready for migrations!');
    process.exit(0);
  } else {
    console.log('❌ Connection issues detected');
    process.exit(1);
  }
});