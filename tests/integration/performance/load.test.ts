import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { performance } from 'perf_hooks'
import { app } from '../../../server/index.js'

// Mock external dependencies for performance testing
jest.mock('../../../server/services/aiService.js', () => ({
  generateHooksWithAI: jest.fn().mockResolvedValue({
    hooks: [
      {
        id: 'perf-hook-1',
        text: 'Performance test hook',
        formula: 'QH-01',
        confidence: 85
      }
    ],
    strategy: { primaryTrigger: 'curiosity-gap', confidence: 85 }
  })
}))

jest.mock('../../../server/config/firebase.js', () => ({
  firebaseAdmin: {
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'perf-test-uid',
        email: 'perf@test.com'
      })
    })
  }
}))

jest.mock('../../../server/db/index.js', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{
      id: 'perf-user',
      email: 'perf@test.com',
      isPremium: true,
      subscriptionStatus: 'active'
    }]),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}))

describe('Performance Tests', () => {
  const authHeaders = { Authorization: 'Bearer mock-token' }
  const testTimeout = 60000 // 1 minute timeout for performance tests

  describe('API Response Times', () => {
    it('should respond to hook generation within 2 seconds', async () => {
      const startTime = performance.now()
      
      const response = await request(app)
        .post('/api/hooks/generate')
        .set(authHeaders)
        .send({
          platform: 'tiktok',
          objective: 'watch_time',
          topic: 'productivity tips for remote workers'
        })
        .expect(200)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(response.body.success).toBe(true)
      expect(responseTime).toBeLessThan(2000) // 2 seconds max
      
      console.log(`Hook generation response time: ${responseTime.toFixed(2)}ms`)
    }, testTimeout)

    it('should handle concurrent hook generations efficiently', async () => {
      const concurrentRequests = 10
      const maxAcceptableTime = 5000 // 5 seconds for all requests
      
      const startTime = performance.now()
      
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/hooks/generate')
          .set(authHeaders)
          .send({
            platform: 'tiktok',
            objective: 'watch_time',
            topic: `productivity tips batch ${i}`
          })
      )
      
      const responses = await Promise.all(requests)
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
      
      expect(totalTime).toBeLessThan(maxAcceptableTime)
      
      console.log(`${concurrentRequests} concurrent requests completed in: ${totalTime.toFixed(2)}ms`)
      console.log(`Average response time: ${(totalTime / concurrentRequests).toFixed(2)}ms`)
    }, testTimeout)

    it('should respond to user profile requests within 500ms', async () => {
      const startTime = performance.now()
      
      const response = await request(app)
        .get('/api/users/profile')
        .set(authHeaders)
        .expect(200)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(responseTime).toBeLessThan(500) // 500ms max for simple queries
      
      console.log(`Profile request response time: ${responseTime.toFixed(2)}ms`)
    }, testTimeout)

    it('should handle favorites operations efficiently', async () => {
      const operations = [
        { method: 'GET', path: '/api/hooks/favorites/perf-user' },
        { method: 'POST', path: '/api/hooks/favorites', body: { generationId: 'gen-1', hookId: 'hook-1' } },
        { method: 'DELETE', path: '/api/hooks/favorites/fav-1' },
      ]
      
      const startTime = performance.now()
      
      for (const op of operations) {
        const req = request(app)[op.method.toLowerCase()](op.path).set(authHeaders)
        if (op.body) req.send(op.body)
        await req
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1500) // All operations should complete in 1.5s
      
      console.log(`Favorites operations completed in: ${totalTime.toFixed(2)}ms`)
    }, testTimeout)
  })

  describe('Memory Usage', () => {
    it('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage()
      
      // Make 50 requests to test memory usage
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/api/hooks/generate')
          .set(authHeaders)
          .send({
            platform: 'tiktok',
            objective: 'watch_time',
            topic: `memory test request ${i}`
          })
          .expect(200)
        
        // Force garbage collection every 10 requests
        if (i % 10 === 0 && global.gc) {
          global.gc()
        }
      }
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100
      
      console.log(`Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`)
      
      // Memory increase should be reasonable (less than 100% increase)
      expect(memoryIncreasePercent).toBeLessThan(100)
    }, testTimeout)
  })

  describe('Database Performance', () => {
    it('should handle user lookup queries efficiently', async () => {
      const iterations = 100
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        await request(app)
          .get('/api/users/profile')
          .set(authHeaders)
          .expect(200)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const avgTime = totalTime / iterations
      
      expect(avgTime).toBeLessThan(50) // Average should be under 50ms
      
      console.log(`${iterations} user lookups: avg ${avgTime.toFixed(2)}ms per request`)
    }, testTimeout)

    it('should handle pagination efficiently for large datasets', async () => {
      const pages = [1, 2, 3, 4, 5]
      const startTime = performance.now()
      
      for (const page of pages) {
        await request(app)
          .get(`/api/hooks/history/perf-user?page=${page}&limit=20`)
          .set(authHeaders)
          .expect(200)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const avgTime = totalTime / pages.length
      
      expect(avgTime).toBeLessThan(200) // Pagination should be under 200ms per page
      
      console.log(`Pagination performance: avg ${avgTime.toFixed(2)}ms per page`)
    }, testTimeout)
  })

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits without significant overhead', async () => {
      const requestsPerSecond = 20
      const testDuration = 2000 // 2 seconds
      const expectedRequests = (requestsPerSecond * testDuration) / 1000
      
      const startTime = performance.now()
      const promises = []
      
      // Send requests at controlled rate
      for (let i = 0; i < expectedRequests; i++) {
        const delay = (i * 1000) / requestsPerSecond
        promises.push(
          new Promise(resolve => {
            setTimeout(async () => {
              const response = await request(app)
                .get('/api/users/profile')
                .set(authHeaders)
              resolve(response.status)
            }, delay)
          })
        )
      }
      
      const responses = await Promise.all(promises)
      const endTime = performance.now()
      const actualDuration = endTime - startTime
      
      // Most requests should succeed (200), some might be rate limited (429)
      const successfulRequests = responses.filter(status => status === 200).length
      const rateLimitedRequests = responses.filter(status => status === 429).length
      
      console.log(`Rate limiting test: ${successfulRequests} successful, ${rateLimitedRequests} rate limited`)
      console.log(`Test duration: ${actualDuration.toFixed(2)}ms`)
      
      expect(successfulRequests).toBeGreaterThan(0)
      expect(actualDuration).toBeLessThan(testDuration + 500) // Allow 500ms buffer
    }, testTimeout)
  })

  describe('Error Handling Performance', () => {
    it('should handle invalid requests efficiently', async () => {
      const invalidRequests = [
        { path: '/api/hooks/generate', body: {} }, // Missing required fields
        { path: '/api/hooks/generate', body: { platform: 'invalid' } }, // Invalid platform
        { path: '/api/hooks/nonexistent', body: {} }, // 404
      ]
      
      const startTime = performance.now()
      
      for (const req of invalidRequests) {
        await request(app)
          .post(req.path)
          .set(authHeaders)
          .send(req.body)
        // Don't expect specific status - just measure response time
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const avgTime = totalTime / invalidRequests.length
      
      expect(avgTime).toBeLessThan(100) // Error responses should be fast
      
      console.log(`Error handling performance: avg ${avgTime.toFixed(2)}ms per error`)
    }, testTimeout)
  })

  describe('Payload Size Handling', () => {
    it('should handle large topic inputs efficiently', async () => {
      const largeTopic = 'a'.repeat(2000) // 2KB topic
      
      const startTime = performance.now()
      
      const response = await request(app)
        .post('/api/hooks/generate')
        .set(authHeaders)
        .send({
          platform: 'tiktok',
          objective: 'watch_time',
          topic: largeTopic
        })
        .expect(400) // Should be rejected due to size
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(responseTime).toBeLessThan(500) // Fast rejection
      
      console.log(`Large payload rejection time: ${responseTime.toFixed(2)}ms`)
    }, testTimeout)
  })
})