import { FirebaseService } from './firebaseService.js'
import { UserService, PsychologicalProfileService } from './database.js'
import { generateJWTToken } from '../middleware/auth.js'
import { logBusinessEvent, logSecurityEvent } from '../middleware/logging.js'
import { AuthenticationError, ValidationError } from '../middleware/errorHandler.js'
import { NewUser } from '../db/schema.js'
import admin from 'firebase-admin'

export interface AuthResult {
  user: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    emailVerified: boolean
    subscriptionStatus: string
    isPremium: boolean
    firebaseUid?: string
    company?: string | null
    industry?: string | null
    role?: string | null
    voice?: string | null
  }
  token: string
  isNewUser?: boolean
}

export interface RegistrationData {
  email: string
  firstName: string
  lastName: string
  firebaseToken: string
  password?: string
}

export interface LoginData {
  firebaseToken: string
}

export interface UserSyncData {
  firebaseToken: string
  userData: {
    email: string
    firstName?: string
    lastName?: string 
    emailVerified?: boolean
  }
}

/**
 * Comprehensive authentication service that handles Firebase and database operations
 */
export class AuthService {
  
  /**
   * Register a new user with Firebase authentication
   */
  static async register(registrationData: RegistrationData, ipAddress?: string): Promise<AuthResult> {
    try {
      // Verify Firebase token first
      const decodedToken = await FirebaseService.verifyIdToken(registrationData.firebaseToken)
      
      // Security: Ensure email matches token
      if (decodedToken.email !== registrationData.email) {
        logSecurityEvent('email_mismatch_registration', {
          tokenEmail: decodedToken.email,
          providedEmail: registrationData.email,
          ipAddress
        })
        throw new AuthenticationError('Email mismatch with authentication token')
      }

      // Check if user already exists by email
      const existingUser = await UserService.findByEmail(registrationData.email)
      if (existingUser) {
        throw new ValidationError('User already exists with this email address')
      }

      // Check if Firebase UID is already registered
      const existingFirebaseUser = await UserService.findByFirebaseUid(decodedToken.uid)
      if (existingFirebaseUser) {
        throw new ValidationError('Firebase account is already registered')
      }

      // Create new user in database
      const newUser = await UserService.create({
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        firebaseUid: decodedToken.uid,
        emailVerified: decodedToken.email_verified || false,
        // Initialize with default preferences
        safety: 'standard',
        freeCredits: 5,
        subscriptionStatus: 'free',
        isPremium: false
      } as NewUser)

      // Initialize psychological profile for personalization
      await PsychologicalProfileService.createOrUpdate(newUser.id, {
        riskTolerance: 'medium',
        creativityLevel: 'balanced',
        preferredCategories: [],
        contentStyle: 'mixed',
        urgencyPreference: 'moderate',
        profileCompleteness: 25 // Basic profile created
      })

      // Generate JWT token for session management
      const jwtToken = generateJWTToken(newUser.id)

      // Log successful registration
      logBusinessEvent('user_registered', {
        userId: newUser.id,
        email: newUser.email,
        registrationMethod: 'firebase',
        ipAddress
      }, newUser.id)

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          emailVerified: newUser.emailVerified || false,
          subscriptionStatus: newUser.subscriptionStatus || 'free',
          isPremium: newUser.isPremium || false,
          firebaseUid: newUser.firebaseUid || undefined,
          company: newUser.company,
          industry: newUser.industry,
          role: newUser.role,
          voice: newUser.voice
        },
        token: jwtToken,
        isNewUser: true
      }

    } catch (error) {
      if (error instanceof admin.auth.AuthError) {
        logSecurityEvent('invalid_firebase_token_registration', {
          error: error.message,
          errorCode: error.code,
          ipAddress
        })
        throw new AuthenticationError('Invalid Firebase authentication token')
      }
      throw error
    }
  }

  /**
   * Authenticate user with Firebase token
   */
  static async login(loginData: LoginData, ipAddress?: string): Promise<AuthResult> {
    try {
      // Verify Firebase token
      const decodedToken = await FirebaseService.verifyIdToken(loginData.firebaseToken)

      // Sync user with database
      const user = await FirebaseService.syncUserWithDatabase(decodedToken)

      // Generate JWT token for session management
      const jwtToken = generateJWTToken(user.id)

      // Log successful login
      logBusinessEvent('user_logged_in', {
        userId: user.id,
        email: user.email,
        loginMethod: 'firebase',
        ipAddress
      }, user.id)

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified || false,
          subscriptionStatus: user.subscriptionStatus || 'free',
          isPremium: user.isPremium || false,
          firebaseUid: user.firebaseUid || undefined,
          company: user.company,
          industry: user.industry,
          role: user.role,
          voice: user.voice
        },
        token: jwtToken
      }

    } catch (error) {
      if (error instanceof admin.auth.AuthError) {
        logSecurityEvent('invalid_firebase_token_login', {
          error: error.message,
          errorCode: error.code,
          ipAddress
        })
        throw new AuthenticationError('Invalid Firebase authentication token')
      }
      throw error
    }
  }

  /**
   * Synchronize user data between Firebase and PostgreSQL
   */
  static async syncUser(syncData: UserSyncData, ipAddress?: string): Promise<AuthResult> {
    try {
      // Verify Firebase token
      const decodedToken = await FirebaseService.verifyIdToken(syncData.firebaseToken)

      // Security: Ensure email matches
      if (decodedToken.email !== syncData.userData.email) {
        logSecurityEvent('email_mismatch_sync', {
          tokenEmail: decodedToken.email,
          providedEmail: syncData.userData.email,
          ipAddress
        })
        throw new AuthenticationError('Email mismatch with authentication token')
      }

      // Sync user data
      const user = await UserService.syncFirebaseUser(decodedToken.uid, {
        email: syncData.userData.email,
        firstName: syncData.userData.firstName,
        lastName: syncData.userData.lastName,
        emailVerified: decodedToken.email_verified || syncData.userData.emailVerified || false
      })

      // Generate JWT token
      const jwtToken = generateJWTToken(user.id)

      // Log successful sync
      logBusinessEvent('user_synced', {
        userId: user.id,
        email: user.email,
        syncMethod: 'firebase',
        ipAddress
      }, user.id)

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified || false,
          subscriptionStatus: user.subscriptionStatus || 'free',
          isPremium: user.isPremium || false,
          firebaseUid: user.firebaseUid || undefined,
          company: user.company,
          industry: user.industry,
          role: user.role,
          voice: user.voice
        },
        token: jwtToken
      }

    } catch (error) {
      if (error instanceof admin.auth.AuthError) {
        logSecurityEvent('invalid_firebase_token_sync', {
          error: error.message,
          errorCode: error.code,
          ipAddress
        })
        throw new AuthenticationError('Invalid Firebase authentication token')
      }
      throw error
    }
  }

  /**
   * Logout user and revoke Firebase refresh tokens
   */
  static async logout(firebaseUid: string, userId: string, ipAddress?: string): Promise<void> {
    try {
      // Revoke all Firebase refresh tokens (signs out user from all devices)
      await FirebaseService.revokeRefreshTokens(firebaseUid)

      // Log logout event
      logBusinessEvent('user_logged_out', {
        userId,
        firebaseUid,
        ipAddress
      }, userId)

    } catch (error) {
      console.error('Logout error:', error)
      // Don't throw error for logout issues - user is already signing out
    }
  }

  /**
   * Delete user account and all associated data (GDPR compliance)
   */
  static async deleteAccount(firebaseUid: string, userId: string, ipAddress?: string): Promise<void> {
    try {
      // Delete from Firebase (this also handles PostgreSQL cleanup via FirebaseService)
      await FirebaseService.deleteUser(firebaseUid)

      // Log account deletion
      logBusinessEvent('user_account_deleted', {
        userId,
        firebaseUid,
        ipAddress,
        reason: 'user_request'
      }, userId)

    } catch (error) {
      console.error('Account deletion error:', error)
      throw new AuthenticationError('Failed to delete user account')
    }
  }

  /**
   * Update user subscription status and sync with Firebase custom claims
   */
  static async updateSubscriptionStatus(
    userId: string, 
    subscriptionStatus: string, 
    isPremium: boolean,
    planDetails?: any
  ): Promise<void> {
    try {
      // Update database
      const user = await UserService.update(userId, {
        subscriptionStatus,
        isPremium,
        subscriptionPlan: planDetails?.plan || 'free',
        stripeCustomerId: planDetails?.stripeCustomerId,
        stripeSubscriptionId: planDetails?.stripeSubscriptionId,
        currentPeriodEnd: planDetails?.currentPeriodEnd ? new Date(planDetails.currentPeriodEnd) : undefined,
        cancelAtPeriodEnd: planDetails?.cancelAtPeriodEnd || false
      })

      // Update Firebase custom claims for client-side access control
      if (user.firebaseUid) {
        await FirebaseService.setCustomUserClaims(user.firebaseUid, {
          subscriptionStatus,
          isPremium,
          subscriptionPlan: planDetails?.plan || 'free'
        })
      }

      // Log subscription change
      logBusinessEvent('subscription_updated', {
        userId,
        subscriptionStatus,
        isPremium,
        plan: planDetails?.plan || 'free'
      }, userId)

    } catch (error) {
      console.error('Subscription update error:', error)
      throw new AuthenticationError('Failed to update subscription status')
    }
  }

  /**
   * Refresh user authentication status and sync data
   */
  static async refreshAuth(firebaseToken: string, ipAddress?: string): Promise<AuthResult> {
    try {
      // Verify current token
      const decodedToken = await FirebaseService.verifyIdToken(firebaseToken)

      // Get latest user data from database
      const user = await UserService.findByFirebaseUid(decodedToken.uid)
      if (!user) {
        throw new AuthenticationError('User not found in database')
      }

      // Update user data from Firebase token if needed
      const updatedUser = await UserService.update(user.id, {
        emailVerified: decodedToken.email_verified || user.emailVerified
      })

      // Generate new JWT token
      const jwtToken = generateJWTToken(user.id)

      return {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          emailVerified: updatedUser.emailVerified || false,
          subscriptionStatus: updatedUser.subscriptionStatus || 'free',
          isPremium: updatedUser.isPremium || false,
          firebaseUid: updatedUser.firebaseUid || undefined,
          company: updatedUser.company,
          industry: updatedUser.industry,
          role: updatedUser.role,
          voice: updatedUser.voice
        },
        token: jwtToken
      }

    } catch (error) {
      if (error instanceof admin.auth.AuthError) {
        throw new AuthenticationError('Authentication token has expired or is invalid')
      }
      throw error
    }
  }

  /**
   * Get authentication status without requiring a valid token
   */
  static async getAuthStatus(firebaseToken?: string): Promise<{
    isAuthenticated: boolean
    user?: AuthResult['user']
    error?: string
  }> {
    if (!firebaseToken) {
      return { isAuthenticated: false }
    }

    try {
      const authResult = await this.refreshAuth(firebaseToken)
      return {
        isAuthenticated: true,
        user: authResult.user
      }
    } catch (error) {
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }
}