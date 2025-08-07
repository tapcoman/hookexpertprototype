import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { users, type User, type NewUser } from './schema'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-for-testing-minimum-32-characters'

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, type: string }
    return { userId: decoded.userId }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return result[0] || null
  } catch (error) {
    console.error('Error finding user by email:', error)
    return null
  }
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] || null
  } catch (error) {
    console.error('Error finding user by ID:', error)
    return null
  }
}

// Create new user
export async function createUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(userData.password)
    
    const newUser: NewUser = {
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailVerified: false,
      freeCredits: 5,
      usedCredits: 0
    }
    
    const result = await db.insert(users).values(newUser).returning()
    return result[0] || null
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
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
      user: userWithoutPassword as User,
      token
    }
  } catch (error) {
    console.error('Error logging in user:', error)
    return null
  }
}