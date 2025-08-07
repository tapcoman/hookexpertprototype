const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { db } = require('./db.js')

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-for-testing-minimum-32-characters'

// Hash password
async function hashPassword(password) {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { userId: decoded.userId }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Find user by email
async function findUserByEmail(email) {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error finding user by email:', error)
    return null
  }
}

// Find user by ID
async function findUserById(id) {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error finding user by ID:', error)
    return null
  }
}

// Create new user
async function createUser(userData) {
  try {
    const hashedPassword = await hashPassword(userData.password)
    
    const result = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, email_verified, free_credits, used_credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userData.email.toLowerCase(),
        hashedPassword,
        userData.firstName,
        userData.lastName,
        false,
        5,
        0
      ]
    )
    
    return result.rows[0] || null
  } catch (error) {
    console.error('Error creating user:', error)
    // Check if it's a unique constraint error
    if (error.code === '23505') {
      return null // User already exists
    }
    throw error
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const user = await findUserByEmail(email)
    if (!user || !user.password) {
      return null
    }
    
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return null
    }
    
    const token = generateToken(user.id)
    
    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      token
    }
  } catch (error) {
    console.error('Error logging in user:', error)
    return null
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  findUserByEmail,
  findUserById,
  createUser,
  loginUser
}