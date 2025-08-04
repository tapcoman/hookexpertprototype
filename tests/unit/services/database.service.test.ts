import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { UserService, HookGenerationService, FavoriteHookService } from '../../../server/services/database.js'
import { NotFoundError } from '../../../server/middleware/errorHandler.js'
import { testUsers, createTestUser } from '../../fixtures/users.fixture.js'
import { testHookGeneration } from '../../fixtures/hooks.fixture.js'

// Mock the database
jest.mock('../../../server/db/index.js', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}))

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([testUsers.freeUser])

      const result = await UserService.findByEmail('free@example.com')

      expect(result).toEqual(testUsers.freeUser)
      expect(mockDb.db.select).toHaveBeenCalled()
      expect(mockDb.db.where).toHaveBeenCalled()
      expect(mockDb.db.limit).toHaveBeenCalledWith(1)
    })

    it('should return null when user not found', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([])

      const result = await UserService.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const mockDb = await import('../../../server/db/index.js')
      const newUser = createTestUser()
      mockDb.db.returning.mockResolvedValue([{ ...newUser, id: 'new-user-123' }])

      const result = await UserService.create(newUser)

      expect(result).toEqual({ ...newUser, id: 'new-user-123' })
      expect(mockDb.db.insert).toHaveBeenCalled()
      expect(mockDb.db.values).toHaveBeenCalledWith(newUser)
      expect(mockDb.db.returning).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update an existing user', async () => {
      const mockDb = await import('../../../server/db/index.js')
      const updatedUser = { ...testUsers.freeUser, firstName: 'Updated' }
      mockDb.db.returning.mockResolvedValue([updatedUser])

      const result = await UserService.update(testUsers.freeUser.id, { firstName: 'Updated' })

      expect(result).toEqual(updatedUser)
      expect(mockDb.db.update).toHaveBeenCalled()
      expect(mockDb.db.set).toHaveBeenCalled()
      expect(mockDb.db.where).toHaveBeenCalled()
    })

    it('should throw NotFoundError when user not found', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([])

      await expect(UserService.update('nonexistent', { firstName: 'Updated' }))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe('getGenerationStatus', () => {
    it('should return generation status for free user', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([testUsers.freeUser])

      const result = await UserService.getGenerationStatus(testUsers.freeUser.id)

      expect(result).toMatchObject({
        canGenerate: true,
        remainingDraftGenerations: 20,
        remainingProGenerations: 0,
        subscriptionPlan: 'free',
      })
    })

    it('should return generation status for premium user', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([testUsers.premiumUser])

      const result = await UserService.getGenerationStatus(testUsers.premiumUser.id)

      expect(result).toMatchObject({
        canGenerate: true,
        remainingProGenerations: 1000,
        subscriptionPlan: 'pro',
      })
    })

    it('should handle weekly reset for expired free user', async () => {
      const mockDb = await import('../../../server/db/index.js')
      const expiredFreeUser = {
        ...testUsers.freeUser,
        draftGenerationsUsed: 20,
        weeklyDraftReset: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      }
      mockDb.db.returning.mockResolvedValueOnce([expiredFreeUser])
      mockDb.db.returning.mockResolvedValueOnce([{ ...expiredFreeUser, draftGenerationsUsed: 0 }])

      const result = await UserService.getGenerationStatus(expiredFreeUser.id)

      expect(result.canGenerate).toBe(true)
      expect(result.remainingDraftGenerations).toBe(20)
      expect(mockDb.db.update).toHaveBeenCalled()
    })
  })

  describe('syncFirebaseUser', () => {
    it('should create new user if not exists', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([]) // findByFirebaseUid returns empty
        .mockResolvedValueOnce([{ ...testUsers.freeUser, id: 'new-user-123' }]) // create returns new user

      const userData = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        emailVerified: true,
      }

      const result = await UserService.syncFirebaseUser('firebase-uid-123', userData)

      expect(result.email).toBe('new@example.com')
      expect(mockDb.db.insert).toHaveBeenCalled()
    })

    it('should update existing user', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid returns existing user
        .mockResolvedValueOnce([{ ...testUsers.freeUser, firstName: 'Updated' }]) // update returns updated user

      const userData = {
        email: 'free@example.com',
        firstName: 'Updated',
        lastName: 'User',
        emailVerified: true,
      }

      const result = await UserService.syncFirebaseUser(testUsers.freeUser.firebaseUid, userData)

      expect(result.firstName).toBe('Updated')
      expect(mockDb.db.update).toHaveBeenCalled()
    })
  })
})

describe('HookGenerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create hook generation', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([{ ...testHookGeneration, id: 'gen-123' }])

      const result = await HookGenerationService.create(testHookGeneration)

      expect(result.id).toBe('gen-123')
      expect(mockDb.db.insert).toHaveBeenCalled()
      expect(mockDb.db.values).toHaveBeenCalledWith(testHookGeneration)
    })
  })

  describe('findByUserId', () => {
    it('should return paginated hook generations', async () => {
      const mockDb = await import('../../../server/db/index.js')
      const mockGenerations = [{ ...testHookGeneration, id: 'gen-1' }, { ...testHookGeneration, id: 'gen-2' }]
      mockDb.db.returning
        .mockResolvedValueOnce(mockGenerations) // generations query
        .mockResolvedValueOnce([{ count: 10 }]) // count query

      const result = await HookGenerationService.findByUserId('user-123', 1, 10)

      expect(result.data).toEqual(mockGenerations)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 10,
        totalPages: 1,
      })
    })
  })
})

describe('FavoriteHookService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exists', () => {
    it('should return true when favorite exists', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([{ id: 'fav-123' }])

      const result = await FavoriteHookService.exists('user-123', 'gen-123')

      expect(result).toBe(true)
      expect(mockDb.db.select).toHaveBeenCalled()
      expect(mockDb.db.where).toHaveBeenCalled()
      expect(mockDb.db.limit).toHaveBeenCalledWith(1)
    })

    it('should return false when favorite does not exist', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([])

      const result = await FavoriteHookService.exists('user-123', 'gen-123')

      expect(result).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete favorite hook', async () => {
      const mockDb = await import('../../../server/db/index.js')
      const deletedFavorite = { id: 'fav-123', userId: 'user-123', generationId: 'gen-123' }
      mockDb.db.returning.mockResolvedValue([deletedFavorite])

      const result = await FavoriteHookService.delete('fav-123', 'user-123')

      expect(result).toEqual(deletedFavorite)
      expect(mockDb.db.delete).toHaveBeenCalled()
      expect(mockDb.db.where).toHaveBeenCalled()
    })

    it('should throw NotFoundError when favorite not found', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([])

      await expect(FavoriteHookService.delete('nonexistent', 'user-123'))
        .rejects
        .toThrow(NotFoundError)
    })
  })
})