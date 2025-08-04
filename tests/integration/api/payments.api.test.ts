import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import { app } from '../../../server/index.js'
import { testUsers } from '../../fixtures/users.fixture.js'
import { mockStripe } from '../../mocks/stripe.mock.js'

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

describe('Payments API', () => {
  const authToken = 'mock-firebase-token'
  const authHeaders = { Authorization: `Bearer ${authToken}` }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/payments/plans', () => {
    it('should return available subscription plans', async () => {
      mockStripe.products.list.mockResolvedValue({
        data: [
          {
            id: 'prod_pro',
            name: 'Pro Plan',
            metadata: { plan: 'pro' },
          },
        ],
      })

      mockStripe.prices.list.mockResolvedValue({
        data: [
          {
            id: 'price_pro_monthly',
            unit_amount: 2900,
            currency: 'usd',
            recurring: { interval: 'month' },
            product: 'prod_pro',
          },
        ],
      })

      const response = await request(app)
        .get('/api/payments/plans')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].name).toBe('Pro Plan')
      expect(response.body.data[0].prices[0].amount).toBe(29) // Converted to dollars
    })

    it('should handle Stripe API errors', async () => {
      mockStripe.products.list.mockRejectedValue(new Error('Stripe API error'))

      const response = await request(app)
        .get('/api/payments/plans')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Stripe')
    })
  })

  describe('POST /api/payments/create-subscription', () => {
    it('should create subscription for authenticated user', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findByFirebaseUid
        .mockResolvedValueOnce([{ ...testUsers.freeUser, stripeCustomerId: 'cus_test123' }]) // update with customer ID

      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_test123',
        email: testUsers.freeUser.email,
      })

      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_test123_secret',
          },
        },
      })

      const requestBody = {
        priceId: 'price_pro_monthly',
      }

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set(authHeaders)
        .send(requestBody)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.subscriptionId).toBe('sub_test123')
      expect(response.body.data.clientSecret).toBe('pi_test123_secret')
    })

    it('should require authentication', async () => {
      const requestBody = {
        priceId: 'price_pro_monthly',
      }

      await request(app)
        .post('/api/payments/create-subscription')
        .send(requestBody)
        .expect(401)
    })

    it('should validate price ID', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValueOnce([testUsers.freeUser])

      const requestBody = {
        priceId: '', // Empty price ID
      }

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set(authHeaders)
        .send(requestBody)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should prevent duplicate active subscriptions', async () => {
      const userWithSubscription = {
        ...testUsers.premiumUser,
        subscriptionStatus: 'active',
      }

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValueOnce([userWithSubscription])

      const requestBody = {
        priceId: 'price_pro_monthly',
      }

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set(authHeaders)
        .send(requestBody)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('active subscription')
    })
  })

  describe('POST /api/payments/cancel-subscription', () => {
    it('should cancel user subscription', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
        uid: testUsers.premiumUser.firebaseUid,
        email: testUsers.premiumUser.email,
      })

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.premiumUser]) // findByFirebaseUid
        .mockResolvedValueOnce([{ ...testUsers.premiumUser, subscriptionStatus: 'canceled' }]) // update user

      mockStripe.subscriptions.update.mockResolvedValue({
        id: testUsers.premiumUser.stripeSubscriptionId,
        status: 'canceled',
      })

      const requestBody = {
        immediately: true,
      }

      const response = await request(app)
        .post('/api/payments/cancel-subscription')
        .set(authHeaders)
        .send(requestBody)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        testUsers.premiumUser.stripeSubscriptionId,
        { cancel_at_period_end: false }
      )
    })

    it('should schedule cancellation at period end', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
        uid: testUsers.premiumUser.firebaseUid,
        email: testUsers.premiumUser.email,
      })

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.premiumUser])
        .mockResolvedValueOnce([{ ...testUsers.premiumUser, cancelAtPeriodEnd: true }])

      mockStripe.subscriptions.update.mockResolvedValue({
        id: testUsers.premiumUser.stripeSubscriptionId,
        cancel_at_period_end: true,
      })

      const requestBody = {
        immediately: false,
      }

      const response = await request(app)
        .post('/api/payments/cancel-subscription')
        .set(authHeaders)
        .send(requestBody)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        testUsers.premiumUser.stripeSubscriptionId,
        { cancel_at_period_end: true }
      )
    })

    it('should handle users without subscriptions', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValueOnce([testUsers.freeUser])

      const response = await request(app)
        .post('/api/payments/cancel-subscription')
        .set(authHeaders)
        .send({ immediately: true })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('no active subscription')
    })
  })

  describe('GET /api/payments/subscription-status', () => {
    it('should return subscription status for premium user', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValueOnce({
        uid: testUsers.premiumUser.firebaseUid,
        email: testUsers.premiumUser.email,
      })

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValueOnce([testUsers.premiumUser])

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: testUsers.premiumUser.stripeSubscriptionId,
        status: 'active',
        current_period_end: testUsers.premiumUser.currentPeriodEnd.getTime() / 1000,
        cancel_at_period_end: false,
      })

      const response = await request(app)
        .get('/api/payments/subscription-status')
        .set(authHeaders)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('active')
      expect(response.body.data.plan).toBe('pro')
      expect(response.body.data.currentPeriodEnd).toBeDefined()
    })

    it('should return free status for users without subscription', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValueOnce([testUsers.freeUser])

      const response = await request(app)
        .get('/api/payments/subscription-status')
        .set(authHeaders)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('free')
      expect(response.body.data.plan).toBe('free')
    })
  })

  describe('POST /api/payments/webhook', () => {
    it('should handle subscription created webhook', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findById
        .mockResolvedValueOnce([{ ...testUsers.freeUser, isPremium: true }]) // update user

      const webhookEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            metadata: {
              userId: testUsers.freeUser.id,
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent)

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send('webhook-body')
        .expect(200)

      expect(response.body.received).toBe(true)
      expect(mockDb.db.update).toHaveBeenCalled()
    })

    it('should handle subscription deleted webhook', async () => {
      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.premiumUser])
        .mockResolvedValueOnce([{ ...testUsers.premiumUser, isPremium: false }])

      const webhookEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
            metadata: {
              userId: testUsers.premiumUser.id,
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent)

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send('webhook-body')
        .expect(200)

      expect(response.body.received).toBe(true)
    })

    it('should handle invalid webhook signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send('webhook-body')
        .expect(400)

      expect(response.body.error).toContain('Webhook signature verification failed')
    })

    it('should skip unhandled webhook events', async () => {
      const webhookEvent = {
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: { object: {} },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent)

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send('webhook-body')
        .expect(200)

      expect(response.body.received).toBe(true)
    })
  })
})