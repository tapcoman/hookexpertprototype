import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { app } from '../../../server/index.js'
import { testUsers, createTestUser } from '../../fixtures/users.fixture.js'
import { testHooks } from '../../fixtures/hooks.fixture.js'

// Mock Firebase authentication
const mockFirebaseAuth = {
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: testUsers.freeUser.firebaseUid,
    email: testUsers.freeUser.email,
  }),
}

jest.mock('../../../server/config/firebase.js', () => ({
  firebaseAdmin: {
    auth: () => mockFirebaseAuth,
  },
}))

// Mock database
jest.mock('../../../server/db/index.js', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}))

// Mock AI service
jest.mock('../../../server/services/aiService.js', () => ({
  generateHooksWithAI: jest.fn().mockResolvedValue({
    hooks: testHooks,
    topThreeVariants: testHooks.slice(0, 3),
    strategy: {
      primaryTrigger: 'curiosity-gap',
      secondaryTriggers: ['value-hit', 'social-proof'],
      confidence: 85,
      adaptationNotes: 'Optimized for TikTok',
    },
  }),
}))

describe('Hooks API', () => {
  const authToken = 'mock-firebase-token'
  const authHeaders = { Authorization: `Bearer ${authToken}` }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/hooks/generate', () => {
    it('should generate hooks successfully', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockResolvedValueOnce([testUsers.freeUser]) // getGenerationStatus check
        .mockResolvedValueOnce([{ id: 'gen-123', ...testHooks[0] }]) // create generation

      const requestBody = {
        platform: 'tiktok',
        objective: 'watch_time',
        topic: 'productivity tips for remote workers',
        modelType: 'gpt-4o-mini',
      }

      const response = await request(app)
        .post('/api/hooks/generate')
        .set(authHeaders)
        .send(requestBody)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hooks).toHaveLength(3)
      expect(response.body.data.topThreeVariants).toHaveLength(3)
      expect(response.body.data.strategy.primaryTrigger).toBe('curiosity-gap')
    })

    it('should reject request without authentication', async () => {
      const requestBody = {
        platform: 'tiktok',
        objective: 'watch_time',
        topic: 'test topic',
      }

      await request(app)
        .post('/api/hooks/generate')
        .send(requestBody)
        .expect(401)
    })

    it('should validate required fields', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValueOnce([testUsers.freeUser])

      const requestBody = {
        platform: 'tiktok',
        // Missing objective and topic
      }

      const response = await request(app)
        .post('/api/hooks/generate')
        .set(authHeaders)
        .send(requestBody)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should check generation limits for free users', async () => {
      const limitedUser = {
        ...testUsers.freeUser,
        draftGenerationsUsed: 20, // At limit
      }

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([limitedUser]) // findByFirebaseUid
        .mockResolvedValueOnce([limitedUser]) // getGenerationStatus check

      const requestBody = {
        platform: 'tiktok',
        objective: 'watch_time',
        topic: 'test topic',
      }

      const response = await request(app)
        .post('/api/hooks/generate')
        .set(authHeaders)
        .send(requestBody)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('limit')
    })

    it('should allow unlimited generations for premium users', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
        uid: testUsers.premiumUser.firebaseUid,
        email: testUsers.premiumUser.email,
      })

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.premiumUser]) // findByFirebaseUid
        .mockResolvedValueOnce([testUsers.premiumUser]) // getGenerationStatus check
        .mockResolvedValueOnce([{ id: 'gen-123', ...testHooks[0] }]) // create generation

      const requestBody = {
        platform: 'youtube',
        objective: 'click_through',
        topic: 'advanced productivity strategies',
        modelType: 'gpt-4o',
      }

      const response = await request(app)
        .post('/api/hooks/generate')
        .set(authHeaders)
        .send(requestBody)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle AI service errors', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser])
        .mockResolvedValueOnce([testUsers.freeUser])

      const mockAI = await import('../../../server/services/aiService.js')
      mockAI.generateHooksWithAI.mockRejectedValueOnce(new Error('AI service unavailable'))

      const requestBody = {
        platform: 'tiktok',
        objective: 'watch_time',
        topic: 'test topic',
      }

      const response = await request(app)
        .post('/api/hooks/generate')
        .set(authHeaders)
        .send(requestBody)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('AI service')
    })
  })

  describe('GET /api/hooks/history/:userId', () => {
    it('should return user hook history', async () => {
      const mockDb = await import('../../../server/db/index.js')
      const mockGenerations = [
        { id: 'gen-1', userId: testUsers.freeUser.id, hooks: testHooks },
        { id: 'gen-2', userId: testUsers.freeUser.id, hooks: [testHooks[0]] },
      ]
      
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockResolvedValueOnce(mockGenerations) // generations
        .mockResolvedValueOnce([{ count: 2 }]) // count

      const response = await request(app)
        .get(`/api/hooks/history/${testUsers.freeUser.id}`)
        .set(authHeaders)
        .query({ page: 1, limit: 10 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
      expect(response.body.data.pagination.total).toBe(2)
    })

    it('should prevent access to other users history', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValueOnce([testUsers.freeUser])

      const response = await request(app)
        .get(`/api/hooks/history/other-user-id`)
        .set(authHeaders)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('access')
    })
  })

  describe('POST /api/hooks/favorites', () => {
    it('should add hook to favorites', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockResolvedValueOnce([]) // check if exists (not exists)
        .mockResolvedValueOnce([{ id: 'fav-123', userId: testUsers.freeUser.id }]) // create favorite

      const requestBody = {
        generationId: 'gen-123',
        hookId: 'hook-1',
      }

      const response = await request(app)
        .post('/api/hooks/favorites')
        .set(authHeaders)
        .send(requestBody)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('fav-123')
    })

    it('should prevent duplicate favorites', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockResolvedValueOnce([{ id: 'existing-fav' }]) // check if exists (exists)

      const requestBody = {
        generationId: 'gen-123',
        hookId: 'hook-1',
      }

      const response = await request(app)
        .post('/api/hooks/favorites')
        .set(authHeaders)
        .send(requestBody)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('already')
    })
  })

  describe('DELETE /api/hooks/favorites/:id', () => {
    it('should remove hook from favorites', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockResolvedValueOnce([{ id: 'fav-123', userId: testUsers.freeUser.id }]) // delete favorite

      const response = await request(app)
        .delete('/api/hooks/favorites/fav-123')
        .set(authHeaders)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle non-existent favorites', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockRejectedValueOnce(new Error('Favorite hook not found')) // delete throws error

      const response = await request(app)
        .delete('/api/hooks/favorites/nonexistent')
        .set(authHeaders)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/hooks/favorites/:userId', () => {
    it('should return user favorites', async () => {
      const mockDb = await import('../../../server/db/index.js')
      const mockFavorites = [
        { id: 'fav-1', userId: testUsers.freeUser.id, generationId: 'gen-1' },
        { id: 'fav-2', userId: testUsers.freeUser.id, generationId: 'gen-2' },
      ]
      
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockResolvedValueOnce(mockFavorites) // favorites
        .mockResolvedValueOnce([{ count: 2 }]) // count

      const response = await request(app)
        .get(`/api/hooks/favorites/${testUsers.freeUser.id}`)
        .set(authHeaders)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toHaveLength(2)
      expect(response.body.data.pagination.total).toBe(2)
    })
  })
})