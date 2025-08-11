import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkUsersTable() {
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    max: 1
  });
  
  console.log('🔍 Checking users table structure...\n');
  
  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log(`📋 Users table has ${columns.length} columns:\n`);
    
    columns.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? 'nullable' : 'not null';
      const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
    });
    
    // Test with correct columns
    console.log('\n🧪 Testing basic operations with correct schema...');
    
    const testUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      firebase_uid: 'firebase-test-' + Date.now()
    };
    
    await sql`
      INSERT INTO users (id, email, firebase_uid, created_at, updated_at)
      VALUES (${testUser.id}, ${testUser.email}, ${testUser.firebase_uid}, NOW(), NOW())
    `;
    console.log('✅ INSERT operation successful');
    
    const result = await sql`
      SELECT id, email, firebase_uid, created_at
      FROM users 
      WHERE id = ${testUser.id}
    `;
    console.log('✅ SELECT operation successful');
    console.log(`   Found user: ${result[0].email} (Firebase UID: ${result[0].firebase_uid})`);
    
    await sql`DELETE FROM users WHERE id = ${testUser.id}`;
    console.log('✅ DELETE operation successful');
    
    await sql.end();
    
    console.log('\n🎉 Users table validation completed successfully!');
    console.log('✅ Schema is correct and operations working');
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    throw error;
  }
}

checkUsersTable();