// Quick debug script to test what might be failing in production

console.log('🔍 Environment Debug Check:')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING') 
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('VERCEL:', process.env.VERCEL ? 'SET' : 'NOT SET')

// Test basic imports
try {
  console.log('✅ Testing bcrypt import...')
  const bcrypt = await import('bcrypt')
  console.log('✅ bcrypt imported successfully')
  
  console.log('✅ Testing database import...')
  const { db } = await import('./server/db/index.js')
  console.log('✅ database imported successfully')
  
  console.log('✅ Testing simple connection...')
  const result = await db.execute('SELECT 1 as test')
  console.log('✅ Database connection test passed')
  
} catch (error) {
  console.error('❌ Import or connection error:', error.message)
  console.error('   Stack:', error.stack)
}