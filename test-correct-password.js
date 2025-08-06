import postgres from 'postgres';

async function testConnection() {
  // Password with forward slash
  const password = 'Infinateloop8/';
  const encodedPassword = encodeURIComponent(password);
  
  console.log('🔍 Testing Supabase connection with correct password...');
  console.log('🔑 Password includes forward slash: Infinateloop8/');
  console.log('🔐 URL-encoded password:', encodedPassword);
  
  const connectionString = `postgresql://postgres.cjemfldnkimsutggahbz:${encodedPassword}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`;
  
  console.log('📡 Full connection string (password hidden):');
  console.log(connectionString.replace(/:([^@]+)@/, ':****@'));
  
  try {
    const sql = postgres(connectionString, {
      ssl: 'require',
      connect_timeout: 10
    });
    
    const result = await sql`SELECT version()`;
    console.log('\n✅ CONNECTION SUCCESSFUL!');
    console.log('📊 Database version:', result[0].version);
    
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n📋 Found ${tables.length} tables in public schema`);
    if (tables.length > 0) {
      console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
    } else {
      console.log('No tables found - ready for migration!');
    }
    
    await sql.end();
    
    console.log('\n🎉 SUCCESS! Database connection verified.');
    console.log('\n📝 Use this DATABASE_URL in your .env:');
    console.log(connectionString);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('🔧 Error code:', error.code);
    
    if (error.code === 'SASL_SIGNATURE_MISMATCH') {
      console.log('\n💡 This error means authentication failed. Check:');
      console.log('1. Password is exactly: Infinateloop8/');
      console.log('2. Username format is correct');
      console.log('3. The project ID in username matches your Supabase project');
    }
    
    return false;
  }
}

testConnection();