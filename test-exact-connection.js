import postgres from 'postgres';

async function testExactConnection() {
  // Using the EXACT connection string you provided
  // Note: The username includes a different project ID
  const connectionString = 'postgresql://postgres.cjemfldnkimsutggahbz:Infinateloop8@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';
  
  console.log('🔍 Testing with your exact connection string...');
  console.log('📡 Project ID in username: cjemfldnkimsutggahbz');
  console.log('📡 Previous project ID: ckobqbxlgeuoaniavmsc');
  console.log('⚠️  These are different projects!\n');
  
  try {
    const sql = postgres(connectionString, {
      ssl: 'require',
      connect_timeout: 10
    });
    
    const result = await sql`SELECT version()`;
    console.log('✅ Connection successful!');
    console.log('📊 Database version:', result[0].version);
    
    // List tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n📋 Found ${tables.length} tables in public schema`);
    if (tables.length > 0) {
      console.log('Tables:', tables.map(t => t.table_name).join(', '));
    }
    
    await sql.end();
    
    console.log('\n✅ SUCCESS! This is the correct connection string.');
    console.log('\n🎯 Next steps:');
    console.log('1. Update .env with this connection string');
    console.log('2. Run database migrations');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔧 Error code:', error.code);
    return false;
  }
}

testExactConnection();