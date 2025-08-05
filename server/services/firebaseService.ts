import admin from 'firebase-admin'
import { UserService, PsychologicalProfileService } from './database.js'
import { logBusinessEvent, logSecurityEvent } from '../middleware/logging.js'
import { AuthenticationError, ValidationError } from '../middleware/errorHandler.js'
import { NewUser } from '../db/schema.js'

// Enhanced Firebase service with comprehensive user management
export class FirebaseService {
  private static app: admin.app.App | null = null

  /**
   * Initialize Firebase Admin SDK with enhanced error handling
   */
  static initialize(): boolean {
    if (this.app) {
      return true
    }

    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      const projectId = process.env.FIREBASE_PROJECT_ID

      if (!serviceAccountKey || !projectId) {
        console.warn('⚠️ Firebase credentials not found - authentication will be limited')
        return false
      }

      const serviceAccount = JSON.parse(serviceAccountKey)
      
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      })

      console.log('✅ Firebase Admin SDK initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error)
      return false
    }
  }

  /**
   * Verify Firebase ID token with enhanced validation
   */
  static async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken, true) // Check revoked tokens
      
      // Additional security validations
      if (!decodedToken.email_verified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        throw new AuthenticationError('Email must be verified to access the application')
      }

      if (decodedToken.aud !== process.env.FIREBASE_PROJECT_ID) {
        throw new AuthenticationError('Invalid token audience')
      }

      return decodedToken
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        logSecurityEvent('firebase_token_verification_failed', {
          error: error.message,
          errorCode: error.code
        })
        
        switch (error.code) {
          case 'auth/id-token-expired':
            throw new AuthenticationError('Authentication token has expired')
          case 'auth/id-token-revoked':
            throw new AuthenticationError('Authentication token has been revoked')
          case 'auth/invalid-id-token':
            throw new AuthenticationError('Invalid authentication token format')
          case 'auth/user-disabled':
            throw new AuthenticationError('User account has been disabled')
          default:
            throw new AuthenticationError('Authentication token verification failed')
        }
      }
      throw error
    }
  }

  /**
   * Create Firebase user account
   */
  static async createUser(userData: {
    email: string
    password?: string
    displayName?: string
    emailVerified?: boolean
  }): Promise<admin.auth.UserRecord> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      const userRecord = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: userData.emailVerified || false
      })

      logBusinessEvent('firebase_user_created', {
        firebaseUid: userRecord.uid,
        email: userRecord.email
      })

      return userRecord
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        switch (error.code) {
          case 'auth/email-already-exists':
            throw new ValidationError('Email address is already in use')
          case 'auth/invalid-email':
            throw new ValidationError('Invalid email address')
          case 'auth/weak-password':
            throw new ValidationError('Password is too weak')
          default:
            throw new AuthenticationError(`Failed to create user: ${error.message}`)
        }
      }
      throw error
    }
  }

  /**
   * Get Firebase user by UID
   */
  static async getUser(uid: string): Promise<admin.auth.UserRecord> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      return await admin.auth().getUser(uid)
    } catch (error) {
      if (error instanceof admin.auth.AuthError && error.code === 'auth/user-not-found') {
        throw new AuthenticationError('Firebase user not found')
      }
      throw error
    }
  }

  /**
   * Update Firebase user
   */
  static async updateUser(uid: string, updates: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      const userRecord = await admin.auth().updateUser(uid, updates)
      
      logBusinessEvent('firebase_user_updated', {
        firebaseUid: uid,
        updates: Object.keys(updates)
      })

      return userRecord
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        throw new AuthenticationError(`Failed to update user: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Delete Firebase user and clean up associated data
   */
  static async deleteUser(uid: string): Promise<void> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      // First delete from Firebase
      await admin.auth().deleteUser(uid)
      
      // Then clean up PostgreSQL data
      const user = await UserService.findByFirebaseUid(uid)
      if (user) {
        // In a production system, you might want to anonymize rather than delete
        // to preserve analytics data while complying with GDPR
        await this.anonymizeUserData(user.id)
      }

      logBusinessEvent('firebase_user_deleted', {
        firebaseUid: uid
      })
    } catch (error) {
      if (error instanceof Error && (error as any).code) {
        throw new AuthenticationError(`Failed to delete user: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Sync Firebase user with PostgreSQL database
   */
  static async syncUserWithDatabase(decodedToken: admin.auth.DecodedIdToken): Promise<any> {
    try {
      // Extract user data from Firebase token
      const firebaseUserData = {
        email: decodedToken.email!,
        firstName: decodedToken.name?.split(' ')[0],
        lastName: decodedToken.name?.split(' ').slice(1).join(' '),
        emailVerified: decodedToken.email_verified
      }

      // Check if user exists in database
      let user = await UserService.findByFirebaseUid(decodedToken.uid)
      
      if (!user) {
        // Check if user exists by email (migration case)
        user = await UserService.findByEmail(decodedToken.email!)
        
        if (user) {
          // Update existing user with Firebase UID
          user = await UserService.update(user.id, {
            firebaseUid: decodedToken.uid,
            ...firebaseUserData
          })
        } else {
          // Create new user
          user = await UserService.create({
            firebaseUid: decodedToken.uid,
            ...firebaseUserData
          } as NewUser)

          // Initialize psychological profile for new user
          await PsychologicalProfileService.createOrUpdate(user.id, {
            riskTolerance: 'medium',
            creativityLevel: 'balanced',
            preferredCategories: [],
            contentStyle: 'mixed',
            urgencyPreference: 'moderate'
          })

          logBusinessEvent('new_user_onboarded', {
            userId: user.id,
            email: user.email,
            registrationMethod: 'firebase'
          })
        }
      } else {
        // Update existing user data
        user = await UserService.update(user.id, firebaseUserData)
      }

      return user
    } catch (error) {
      console.error('Error syncing Firebase user with database:', error)
      throw error
    }
  }

  /**
   * Generate custom Firebase token for user
   */
  static async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      return await admin.auth().createCustomToken(uid, additionalClaims)
    } catch (error) {
      throw new AuthenticationError('Failed to create custom token')
    }
  }

  /**
   * Revoke refresh tokens for user (sign out all devices)
   */
  static async revokeRefreshTokens(uid: string): Promise<void> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      await admin.auth().revokeRefreshTokens(uid)
      
      logSecurityEvent('firebase_tokens_revoked', {
        firebaseUid: uid
      })
    } catch (error) {
      throw new AuthenticationError('Failed to revoke refresh tokens')
    }
  }

  /**
   * Set custom user claims (for role-based access control)
   */
  static async setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      await admin.auth().setCustomUserClaims(uid, customClaims)
      
      logBusinessEvent('firebase_custom_claims_set', {
        firebaseUid: uid,
        claims: Object.keys(customClaims)
      })
    } catch (error) {
      throw new AuthenticationError('Failed to set custom user claims')
    }
  }

  /**
   * Get user's custom claims
   */
  static async getUserClaims(uid: string): Promise<object> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      const user = await admin.auth().getUser(uid)
      return user.customClaims || {}
    } catch (error) {
      throw new AuthenticationError('Failed to get user claims')
    }
  }

  /**
   * Batch operations for user management
   */
  static async batchGetUsers(uids: string[]): Promise<admin.auth.GetUsersResult> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      return await admin.auth().getUsers(uids.map(uid => ({ uid })))
    } catch (error) {
      throw new AuthenticationError('Failed to batch get users')
    }
  }

  /**
   * List users with pagination (admin functionality)
   */
  static async listUsers(maxResults: number = 1000, pageToken?: string): Promise<admin.auth.ListUsersResult> {
    if (!this.app) {
      throw new AuthenticationError('Firebase not initialized')
    }

    try {
      return await admin.auth().listUsers(maxResults, pageToken)
    } catch (error) {
      throw new AuthenticationError('Failed to list users')
    }
  }

  /**
   * GDPR compliance: Anonymize user data
   */
  private static async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Anonymize user profile while preserving analytics
      await UserService.update(userId, {
        email: `deleted-user-${userId}@deleted.local`,
        firstName: null,
        lastName: null,
        company: null,
        industry: null,
        role: null,
        audience: null,
        firebaseUid: null
      })

      logBusinessEvent('user_data_anonymized', {
        userId,
        reason: 'gdpr_deletion'
      })
    } catch (error) {
      console.error('Failed to anonymize user data:', error)
      throw error
    }
  }

  /**
   * Health check for Firebase connection
   */
  static async healthCheck(): Promise<{ status: string; details?: any }> {
    if (!this.app) {
      return { status: 'disconnected', details: 'Firebase not initialized' }
    }

    try {
      // Try to verify a dummy token to test connection
      await admin.auth().verifyIdToken('dummy-token').catch(() => {
        // Expected to fail, we just want to test connectivity
      })
      
      return { status: 'connected', details: 'Firebase Admin SDK operational' }
    } catch (error) {
      return { status: 'error', details: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  static isConfigured(): boolean {
    return !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_PROJECT_ID)
  }

  /**
   * Get Firebase project ID
   */
  static getProjectId(): string | undefined {
    return process.env.FIREBASE_PROJECT_ID
  }
}