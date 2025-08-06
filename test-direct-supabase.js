import postgres from 'postgres';

async function testDirectConnection() {
  // Based on the pattern from your Supabase dashboard
  // Direct connection typically uses postgres as username
  const connections = [
    {
      name: 'Direct with postgres user',
      url: 'postgresql://postgres:Infinateloop8@db.ckobqbxlgeuoaniavmsc.supabase.co:5432/postgres?sslmode=require'
    },
    {
      name: 'Pooler with full username',
      url: 'postgresql://postgres.ckobqbxlgeuoaniavmsc:Infinateloop8@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
      name: 'Pooler transaction mode',
      url: 'postgresql://postgres.ckobqbxlgeuoaniavmsc:Infinateloop8@aws-0-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require'
    }
  ];

  for (const conn of connections) {
    console.log(`\n🔍 Testing: ${conn.name}`);
    console.log(`📡 URL: ${conn.url.replace(/:[^@]+@/, ':****@')}`);
    
    try {
      const sql = postgres(conn.url, {
        ssl: 'require',
        connect_timeout: 10,
        max: 1,
        idle_timeout: 0
      });
      
      const result = await sql`SELECT NOW() as current_time`;
      console.log('✅ SUCCESS! Connected at:', result[0].current_time);
      
      // Check if we can see tables
      const tables = await sql`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log('📊 Public tables count:', tables[0].table_count);
      
      await sql.end();
      
      console.log('\n🎉 Use this connection string in your .env:');
      console.log(conn.url);
      return conn.url;
      
    } catch (error) {
      console.error('❌ Failed:', error.code || error.message);
    }
  }
  
  console.log('\n💡 If all connections fail, please verify:');
  console.log('1. The password "Infinateloop8" is correct');
  console.log('2. Your Supabase project ID is: ckobqbxlgeuoaniavmsc');
  console.log('3. The database is not paused in Supabase dashboard');
}

testDirectConnection();