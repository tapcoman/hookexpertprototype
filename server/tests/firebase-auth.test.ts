import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { FirebaseService } from '../services/firebaseService.js'
import { AuthService } from '../services/authService.js'
import { UserService } from '../services/database.js'
import { FirebaseConfig } from '../config/firebase.js'

// Mock Firebase Admin SDK for testing
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: () => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    createCustomToken: jest.fn(),
    revokeRefreshTokens: jest.fn(),
    setCustomUserClaims: jest.fn()
  })
}))

describe('Firebase Authentication Integration', () => {
  let app: express.Application

  beforeAll(async () => {
    // Set up test environment variables
    process.env.NODE_ENV = 'test'
    process.env.FIREBASE_PROJECT_ID = 'test-project'
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: '-----BEGIN PRIVATE KEY-----\\ntest-key\\n-----END PRIVATE KEY-----\\n',
      client_email: 'test@test-project.iam.gserviceaccount.com',
      client_id: 'test-client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token'
    })
    process.env.JWT_SECRET = 'test-jwt-secret-key-with-sufficient-length'

    // Initialize test app
    app = express()
    app.use(express.json())
  })

  afterAll(() => {
    // Clean up test environment
    delete process.env.NODE_ENV
    delete process.env.FIREBASE_PROJECT_ID
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    delete process.env.JWT_SECRET
  })

  describe('FirebaseConfig', () => {
    it('should validate environment configuration', () => {
      const validation = FirebaseConfig.validateEnvironment()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing environment variables', () => {
      const originalProjectId = process.env.FIREBASE_PROJECT_ID
      delete process.env.FIREBASE_PROJECT_ID

      const validation = FirebaseConfig.validateEnvironment()
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('FIREBASE_PROJECT_ID is required')

      process.env.FIREBASE_PROJECT_ID = originalProjectId
    })

    it('should provide security recommendations', () => {
      const recommendations = FirebaseConfig.getSecurityRecommendations()
      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.length).toBeGreaterThan(0)
    })

    it('should export safe client configuration', () => {
      const clientConfig = FirebaseConfig.getClientConfig()
      expect(clientConfig).toHaveProperty('projectId')
      expect(clientConfig).toHaveProperty('authEnabled')
      expect(clientConfig).toHaveProperty('requireEmailVerification')
      expect(clientConfig).toHaveProperty('environment')
      
      // Should not expose sensitive data
      expect(clientConfig).not.toHaveProperty('serviceAccountKey')
      expect(clientConfig).not.toHaveProperty('privateKey')
    })
  })

  describe('FirebaseService', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should initialize Firebase correctly', () => {
      const result = FirebaseService.initialize()
      expect(result).toBe(true)
    })

    it('should check if Firebase is configured', () => {
      expect(FirebaseService.isConfigured()).toBe(true)
    })

    it('should return project ID', () => {
      expect(FirebaseService.getProjectId()).toBe('test-project')
    })

    it('should handle health check', async () => {
      const healthStatus = await FirebaseService.healthCheck()
      expect(healthStatus).toHaveProperty('status')
    })
  })

  describe('Authentication Flow', () => {
    const mockUserData = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      firebaseToken: 'mock-firebase-token'
    }

    const mockDecodedToken = {
      uid: 'test-firebase-uid',
      email: 'test@example.com',
      email_verified: true,
      aud: 'test-project',
      iss: 'https://securetoken.google.com/test-project',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    }

    beforeEach(() => {
      // Mock Firebase token verification
      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().verifyIdToken.mockResolvedValue(mockDecodedToken)
    })

    it('should register a new user successfully', async () => {
      // Mock database operations
      jest.spyOn(UserService, 'findByEmail').mockResolvedValue(null)
      jest.spyOn(UserService, 'findByFirebaseUid').mockResolvedValue(null)
      jest.spyOn(UserService, 'create').mockResolvedValue({
        id: 'test-user-id',
        email: mockUserData.email,
        firstName: mockUserData.firstName,
        lastName: mockUserData.lastName,
        firebaseUid: mockDecodedToken.uid,
        emailVerified: true,
        subscriptionStatus: 'free',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      const result = await AuthService.register(mockUserData, '127.0.0.1')

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('isNewUser', true)
      expect(result.user.email).toBe(mockUserData.email)
    })

    it('should prevent duplicate email registration', async () => {
      // Mock existing user
      jest.spyOn(UserService, 'findByEmail').mockResolvedValue({
        id: 'existing-user',
        email: mockUserData.email
      } as any)

      await expect(
        AuthService.register(mockUserData, '127.0.0.1')
      ).rejects.toThrow('User already exists with this email address')
    })

    it('should login existing user successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: mockUserData.email,
        firstName: mockUserData.firstName,
        lastName: mockUserData.lastName,
        firebaseUid: mockDecodedToken.uid,
        emailVerified: true,
        subscriptionStatus: 'free',
        isPremium: false
      }

      jest.spyOn(FirebaseService, 'syncUserWithDatabase').mockResolvedValue(mockUser as any)

      const result = await AuthService.login(
        { firebaseToken: mockUserData.firebaseToken },
        '127.0.0.1'
      )

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUserData.email)
    })

    it('should handle email mismatch security violation', async () => {
      const mismatchedUserData = {
        ...mockUserData,
        email: 'different@example.com'
      }

      await expect(
        AuthService.register(mismatchedUserData, '127.0.0.1')
      ).rejects.toThrow('Email mismatch with authentication token')
    })

    it('should refresh authentication successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: mockUserData.email,
        emailVerified: true,
        subscriptionStatus: 'free',
        isPremium: false
      }

      jest.spyOn(UserService, 'findByFirebaseUid').mockResolvedValue(mockUser as any)
      jest.spyOn(UserService, 'update').mockResolvedValue(mockUser as any)

      const result = await AuthService.refreshAuth(mockUserData.firebaseToken, '127.0.0.1')

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result.user.email).toBe(mockUserData.email)
    })

    it('should sync user data correctly', async () => {
      const syncData = {
        firebaseToken: mockUserData.firebaseToken,
        userData: {
          email: mockUserData.email,
          firstName: 'Updated',
          lastName: 'Name'
        }
      }

      jest.spyOn(UserService, 'syncFirebaseUser').mockResolvedValue({
        id: 'test-user-id',
        email: mockUserData.email,
        firstName: 'Updated',
        lastName: 'Name',
        emailVerified: true,
        subscriptionStatus: 'free',
        isPremium: false
      } as any)

      const result = await AuthService.syncUser(syncData, '127.0.0.1')

      expect(result.user.firstName).toBe('Updated')
      expect(result.user.lastName).toBe('Name')
    })
  })

  describe('Security Features', () => {
    it('should handle token expiration', async () => {
      const expiredToken = {
        ...mockDecodedToken,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      }

      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().verifyIdToken.mockRejectedValue({
        code: 'auth/id-token-expired',
        message: 'Token expired'
      })

      await expect(
        FirebaseService.verifyIdToken('expired-token')
      ).rejects.toThrow('Authentication token has expired')
    })

    it('should handle revoked tokens', async () => {
      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().verifyIdToken.mockRejectedValue({
        code: 'auth/id-token-revoked',
        message: 'Token revoked'
      })

      await expect(
        FirebaseService.verifyIdToken('revoked-token')
      ).rejects.toThrow('Authentication token has been revoked')
    })

    it('should validate token audience', async () => {
      const invalidAudienceToken = {
        ...mockDecodedToken,
        aud: 'wrong-project-id'
      }

      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().verifyIdToken.mockResolvedValue(invalidAudienceToken)

      await expect(
        FirebaseService.verifyIdToken('invalid-audience-token')
      ).rejects.toThrow('Invalid token audience')
    })
  })

  describe('User Management', () => {
    const mockFirebaseUser = {
      uid: 'test-firebase-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true
    }

    it('should create Firebase user', async () => {
      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().createUser.mockResolvedValue(mockFirebaseUser)

      const result = await FirebaseService.createUser({
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true
      })

      expect(result).toMatchObject(mockFirebaseUser)
    })

    it('should update Firebase user', async () => {
      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().updateUser.mockResolvedValue({
        ...mockFirebaseUser,
        displayName: 'Updated Name'
      })

      const result = await FirebaseService.updateUser('test-firebase-uid', {
        displayName: 'Updated Name'
      })

      expect(result.displayName).toBe('Updated Name')
    })

    it('should delete Firebase user', async () => {
      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().deleteUser.mockResolvedValue(undefined)

      jest.spyOn(UserService, 'findByFirebaseUid').mockResolvedValue({
        id: 'test-user-id'
      } as any)
      
      jest.spyOn(UserService, 'update').mockResolvedValue({} as any)

      await expect(
        FirebaseService.deleteUser('test-firebase-uid')
      ).resolves.not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle Firebase initialization failure', () => {
      const originalKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = 'invalid-json'

      const result = FirebaseService.initialize()
      expect(result).toBe(false)

      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = originalKey
    })

    it('should handle missing configuration gracefully', () => {
      const originalProjectId = process.env.FIREBASE_PROJECT_ID
      delete process.env.FIREBASE_PROJECT_ID

      const result = FirebaseService.isConfigured()
      expect(result).toBe(false)

      process.env.FIREBASE_PROJECT_ID = originalProjectId
    })

    it('should provide meaningful error messages', async () => {
      const mockAuth = require('firebase-admin').auth as jest.Mock
      mockAuth().verifyIdToken.mockRejectedValue({
        code: 'auth/invalid-id-token',
        message: 'Invalid token format'
      })

      await expect(
        FirebaseService.verifyIdToken('invalid-token')
      ).rejects.toThrow('Invalid authentication token format')
    })
  })
})

// Integration test helper
export const createTestUser = async (userData: any) => {
  const mockAuth = require('firebase-admin').auth as jest.Mock
  mockAuth().verifyIdToken.mockResolvedValue({
    uid: 'test-uid',
    email: userData.email,
    email_verified: true,
    aud: 'test-project'
  })

  jest.spyOn(UserService, 'findByEmail').mockResolvedValue(null)
  jest.spyOn(UserService, 'findByFirebaseUid').mockResolvedValue(null)
  jest.spyOn(UserService, 'create').mockResolvedValue({
    id: 'test-user-id',
    ...userData,
    firebaseUid: 'test-uid',
    subscriptionStatus: 'free',
    isPremium: false
  } as any)

  return await AuthService.register({
    ...userData,
    firebaseToken: 'mock-token'
  }, '127.0.0.1')
}