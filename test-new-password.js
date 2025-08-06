import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function testNewPassword() {
  const connectionString = process.env.DATABASE_URL;
  
  console.log('🔍 Testing Supabase with new password...');
  console.log('📡 Connection string from .env (password hidden):');
  console.log(connectionString.replace(/:[^@]+@/, ':****@'));
  
  try {
    const sql = postgres(connectionString, {
      ssl: 'require',
      connect_timeout: 10
    });
    
    const result = await sql`SELECT version()`;
    console.log('\n✅ CONNECTION SUCCESSFUL!');
    console.log('📊 Database version:', result[0].version);
    
    // Check existing tables
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
      console.log('✅ No tables found - perfect for fresh migration!');
    }
    
    await sql.end();
    
    console.log('\n🎉 Database connection verified!');
    console.log('🚀 Ready to run Drizzle migrations...');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('🔧 Error code:', error.code);
    
    if (error.code === 'SASL_SIGNATURE_MISMATCH') {
      console.log('\n💡 Authentication failed. Please verify:');
      console.log('1. Username: postgres.cjemfldnkimsutggahbz');
      console.log('2. Password: fjJRMJg0owF0XZBy');
      console.log('3. Host: aws-0-eu-west-2.pooler.supabase.com');
      console.log('4. Port: 6543');
    }
    
    return false;
  }
}

testNewPassword();