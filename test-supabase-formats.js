import postgres from 'postgres';

async function testSupabaseFormats() {
  const projectId = 'cjemfldnkimsutggahbz';
  const password = 'Infinateloop8/';
  const encodedPassword = encodeURIComponent(password);
  
  console.log('🔍 Testing Supabase connection formats...\n');
  console.log(`📋 Project ID: ${projectId}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
  
  const formats = [
    {
      name: 'Direct connection (port 5432)',
      url: `postgresql://postgres:${encodedPassword}@db.${projectId}.supabase.co:5432/postgres`
    },
    {
      name: 'Pooler connection (port 6543)',
      url: `postgresql://postgres.${projectId}:${encodedPassword}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`
    },
    {
      name: 'Transaction pooler (port 5432)',
      url: `postgresql://postgres.${projectId}:${encodedPassword}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres`
    },
    {
      name: 'Direct with SSL mode',
      url: `postgresql://postgres:${encodedPassword}@db.${projectId}.supabase.co:5432/postgres?sslmode=require`
    }
  ];
  
  for (const format of formats) {
    console.log(`📝 Testing: ${format.name}`);
    console.log(`📡 URL: ${format.url.replace(/:[^@]+@/, ':****@')}`);
    
    try {
      const sql = postgres(format.url, {
        ssl: 'require',
        connect_timeout: 10,
        max: 1
      });
      
      const result = await sql`SELECT version()`;
      console.log('✅ SUCCESS! Connected to database');
      console.log('📊 Version:', result[0].version.substring(0, 50) + '...');
      
      await sql.end();
      
      console.log(`\n🎉 WORKING CONNECTION:\n${format.url}\n`);
      return format.url;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.code || error.message.substring(0, 50)}`);
      if (error.code === 'ENOTFOUND') {
        console.log('   → Host not found - wrong project ID or region');
      } else if (error.code === 'SASL_SIGNATURE_MISMATCH') {
        console.log('   → Authentication failed - wrong username/password');
      } else if (error.code === 'EHOSTUNREACH') {
        console.log('   → Network unreachable - possibly IPv6 issue');
      }
      console.log('');
    }
  }
  
  console.log('❌ All connection attempts failed');
  console.log('\n💡 Next steps:');
  console.log('1. Go to Supabase Dashboard → Project Settings → Database');
  console.log('2. Find "Connection string" section');
  console.log('3. Copy the exact PostgreSQL connection string');
  console.log('4. Make sure the database password is correct');
  
  return null;
}

testSupabaseFormats();