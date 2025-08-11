import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnectionString(description, connectionString) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`📡 Connection string: ${connectionString.replace(/:[^@]+@/, ':****@')}`);
  
  try {
    const sql = postgres(connectionString, {
      ssl: 'require',
      connect_timeout: 5,
      max: 1
    });
    
    const result = await sql`SELECT 1 as test`;
    console.log('✅ SUCCESS! Connection works');
    
    await sql.end();
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing various Supabase connection formats...\n');
  
  const tests = [
    {
      desc: 'Pooler with sslmode=require',
      url: 'postgresql://postgres.cjemfldnkimsutggahbz:Infinateloop8@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
      desc: 'Pooler without SSL param',
      url: 'postgresql://postgres.cjemfldnkimsutggahbz:Infinateloop8@aws-0-eu-west-2.pooler.supabase.com:6543/postgres'
    },
    {
      desc: 'Direct connection (original)',
      url: 'postgresql://postgres:Infinateloop8@db.ckobqbxlgeuoaniavmsc.supabase.co:5432/postgres?sslmode=require'
    },
    {
      desc: 'Pooler with pgbouncer mode',
      url: 'postgresql://postgres.cjemfldnkimsutggahbz:Infinateloop8@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
    },
    {
      desc: 'From .env file',
      url: process.env.DATABASE_URL
    }
  ];
  
  let successCount = 0;
  for (const test of tests) {
    if (await testConnectionString(test.desc, test.url)) {
      successCount++;
      console.log(`\n🎉 WORKING CONNECTION STRING:\n${test.url}\n`);
      break; // Stop at first success
    }
  }
  
  if (successCount === 0) {
    console.log('\n❌ All connection attempts failed');
    console.log('\n📋 Troubleshooting steps:');
    console.log('1. Check if the password is correct');
    console.log('2. Verify the project ID in the connection string');
    console.log('3. Ensure the database is active in Supabase dashboard');
    console.log('4. Check if connection pooling is enabled');
  }
}

runTests();