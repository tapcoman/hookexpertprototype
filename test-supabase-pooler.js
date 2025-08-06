import postgres from 'postgres';

async function testConnection() {
  // URL-encode the password to handle special characters
  const password = encodeURIComponent('Infinateloop8');
  const connectionString = `postgresql://postgres.cjemfldnkimsutggahbz:${password}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`;
  
  console.log('🔍 Testing Supabase Pooler connection...');
  console.log('📡 Using connection string with encoded password');
  
  const sql = postgres(connectionString, {
    ssl: 'require',
    connect_timeout: 10
  });

  try {
    const result = await sql`SELECT version()`;
    console.log('✅ Connection successful!');
    console.log('📊 Database version:', result[0].version);
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Current tables in database:', tables.length);
    if (tables.length > 0) {
      console.log('Tables:', tables.map(t => t.table_name).join(', '));
    }
    
    await sql.end();
    console.log('✅ Ready for migration!');
    return connectionString;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔧 Error details:', error);
    throw error;
  }
}

testConnection()
  .then(connStr => {
    console.log('\n✅ SUCCESS! Use this connection string:');
    console.log(connStr);
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });