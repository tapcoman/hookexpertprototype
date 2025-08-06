import postgres from 'postgres';

async function testConnection() {
  const sql = postgres('postgresql://postgres:Infinateloop8%40@db.ckobqbxlgeuoaniavmsc.supabase.co:5432/postgres', {
    ssl: 'require',
    connect_timeout: 10
  });

  try {
    console.log('🔍 Testing Supabase connection...');
    const result = await sql`SELECT version()`;
    console.log('✅ Connection successful!');
    console.log('📊 Database version:', result[0].version);
    await sql.end();
    console.log('✅ Ready for migration!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔧 Error code:', error.code);
    console.error('🔧 Error details:', error);
    process.exit(1);
  }
}

testConnection();