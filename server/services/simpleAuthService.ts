import bcrypt from 'bcrypt'
import { UserService, PsychologicalProfileService } from './database.js'
import { logBusinessEvent, logSecurityEvent } from '../middleware/logging.js'
import { AuthenticationError, ValidationError } from '../middleware/errorHandler.js'
import { NewUser } from '../db/sqlite-schema.js'
import { generateJWTToken } from '../middleware/simpleAuth.js'

// Simple authentication service without Firebase
export class SimpleAuthService {
  private static readonly SALT_ROUNDS = 12

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS)
    } catch (error) {
      throw new AuthenticationError('Failed to hash password')
    }
  }

  /**
   * Verify password using bcrypt
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
      return false
    }
  }

  /**
   * Register new user with email/password
   */
  static async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }, ipAddress: string): Promise<{
    user: any
    token: string
    isNewUser: boolean
  }> {
    const { email, password, firstName, lastName } = userData

    try {
      // Check if user already exists
      const existingUser = await UserService.findByEmail(email)
      if (existingUser) {
        throw new ValidationError('User with this email already exists')
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password)

      // Create new user
      const newUser = await UserService.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: false // Will be true once user verifies email (if we implement that)
      } as NewUser)

      // Initialize psychological profile for new user
      await PsychologicalProfileService.createOrUpdate(newUser.id, {
        riskTolerance: 'medium',
        creativityLevel: 'balanced',
        preferredCategories: [],
        contentStyle: 'mixed',
        urgencyPreference: 'moderate'
      })

      // Generate JWT token
      const token = generateJWTToken(newUser.id)

      logBusinessEvent('new_user_registered', {
        userId: newUser.id,
        email: newUser.email,
        registrationMethod: 'email_password',
        ipAddress
      })

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          subscriptionStatus: newUser.subscriptionStatus || 'free',
          isPremium: newUser.isPremium || false
        },
        token,
        isNewUser: true
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      
      logSecurityEvent('registration_failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress
      })
      
      throw new AuthenticationError('Registration failed')
    }
  }

  /**
   * Login user with email/password
   */
  static async login(credentials: {
    email: string
    password: string
  }, ipAddress: string): Promise<{
    user: any
    token: string
  }> {
    const { email, password } = credentials

    try {
      // Find user by email
      const user = await UserService.findByEmail(email)
      if (!user || !user.password) {
        throw new AuthenticationError('Invalid email or password')
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password)
      if (!isValidPassword) {
        logSecurityEvent('login_failed', {
          email,
          reason: 'invalid_password',
          ipAddress
        })
        throw new AuthenticationError('Invalid email or password')
      }

      // Generate JWT token
      const token = generateJWTToken(user.id)

      logBusinessEvent('user_login', {
        userId: user.id,
        email: user.email,
        loginMethod: 'email_password',
        ipAddress
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriptionStatus: user.subscriptionStatus || 'free',
          isPremium: user.isPremium || false
        },
        token
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }
      
      logSecurityEvent('login_error', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress
      })
      
      throw new AuthenticationError('Login failed')
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Find user
      const user = await UserService.findById(userId)
      if (!user || !user.password) {
        throw new AuthenticationError('User not found')
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(currentPassword, user.password)
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect')
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword)

      // Update password
      await UserService.update(userId, {
        password: hashedPassword
      })

      logBusinessEvent('password_updated', {
        userId,
        email: user.email
      })
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }
      throw new AuthenticationError('Failed to update password')
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(userId: string): Promise<void> {
    try {
      const user = await UserService.findById(userId)
      if (!user) {
        throw new AuthenticationError('User not found')
      }

      // In a production system, you might want to anonymize rather than delete
      // to preserve analytics data while complying with GDPR
      await this.anonymizeUserData(userId)

      logBusinessEvent('user_account_deleted', {
        userId,
        email: user.email
      })
    } catch (error) {
      throw new AuthenticationError('Failed to delete account')
    }
  }

  /**
   * GDPR compliance: Anonymize user data
   */
  private static async anonymizeUserData(userId: string): Promise<void> {
    try {
      await UserService.update(userId, {
        email: `deleted-user-${userId}@deleted.local`,
        firstName: null,
        lastName: null,
        password: null,
        company: null,
        industry: null,
        role: null,
        audience: null
      })

      logBusinessEvent('user_data_anonymized', {
        userId,
        reason: 'account_deletion'
      })
    } catch (error) {
      console.error('Failed to anonymize user data:', error)
      throw error
    }
  }

  /**
   * Get authentication status
   */
  static async getAuthStatus(token?: string): Promise<{
    isAuthenticated: boolean
    user?: any
  }> {
    if (!token) {
      return { isAuthenticated: false }
    }

    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        return { isAuthenticated: false }
      }

      const jwt = await import('jsonwebtoken')
      const decoded = jwt.verify(token, secret) as any
      
      const user = await UserService.findById(decoded.userId)
      if (!user) {
        return { isAuthenticated: false }
      }

      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriptionStatus: user.subscriptionStatus || 'free',
          isPremium: user.isPremium || false
        }
      }
    } catch {
      return { isAuthenticated: false }
    }
  }

  /**
   * Logout user (invalidate token - in a full implementation you'd maintain a token blacklist)
   */
  static async logout(userId: string, ipAddress: string): Promise<void> {
    try {
      const user = await UserService.findById(userId)
      if (user) {
        logBusinessEvent('user_logout', {
          userId,
          email: user.email,
          ipAddress
        })
      }
      
      // In a full implementation, you would maintain a token blacklist
      // For now, we rely on short token expiry times
    } catch (error) {
      console.error('Logout error:', error)
      // Don't throw error for logout failures
    }
  }
}