import postgres from 'postgres';

async function testCredentials() {
  console.log('🔍 Testing Supabase credentials...\n');
  
  // Test different credential combinations
  const testCases = [
    {
      name: 'Current .env format',
      user: 'postgres.cjemfldnkimsutggahbz',
      pass: 'Infinateloop8/',
      encoded: false
    },
    {
      name: 'URL-encoded password',
      user: 'postgres.cjemfldnkimsutggahbz', 
      pass: 'Infinateloop8%2F',
      encoded: true
    },
    {
      name: 'Without trailing slash',
      user: 'postgres.cjemfldnkimsutggahbz',
      pass: 'Infinateloop8',
      encoded: false
    }
  ];
  
  for (const test of testCases) {
    console.log(`📝 Testing: ${test.name}`);
    console.log(`   Username: ${test.user}`);
    console.log(`   Password: ${test.pass.replace(/./g, '*')}`);
    
    const connStr = `postgresql://${test.user}:${test.pass}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`;
    
    try {
      const sql = postgres(connStr, {
        ssl: 'require',
        connect_timeout: 5,
        max: 1
      });
      
      await sql`SELECT 1`;
      console.log('   ✅ SUCCESS!\n');
      
      await sql.end();
      console.log(`🎉 Working connection string:\n${connStr}\n`);
      return connStr;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.code || error.message}\n`);
    }
  }
  
  console.log('💡 All credential combinations failed.');
  console.log('Please verify from your Supabase dashboard:');
  console.log('1. Project Settings → Database → Connection string');
  console.log('2. The exact username and password format');
  console.log('3. Whether the database is active and not paused');
  
  return null;
}

testCredentials();