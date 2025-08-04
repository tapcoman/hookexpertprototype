import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { StripeService } from '../../../server/services/stripeService.js'
import { testUsers } from '../../fixtures/users.fixture.js'
import { mockStripe } from '../../mocks/stripe.mock.js'

// Mock the database
jest.mock('../../../server/db/index.js', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  },
}))

// Mock logger
jest.mock('../../../server/middleware/logging.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('StripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if stripeCustomerId exists', async () => {
      const user = testUsers.premiumUser
      mockStripe.customers.retrieve.mockResolvedValue({
        id: user.stripeCustomerId,
        email: user.email,
        deleted: false,
      })

      const result = await StripeService.getOrCreateCustomer(user)

      expect(result.id).toBe(user.stripeCustomerId)
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith(user.stripeCustomerId)
      expect(mockStripe.customers.create).not.toHaveBeenCalled()
    })

    it('should create new customer if stripeCustomerId does not exist', async () => {
      const user = testUsers.freeUser
      const newCustomer = {
        id: 'cus_new123',
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      }
      mockStripe.customers.create.mockResolvedValue(newCustomer)

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([{ ...user, stripeCustomerId: newCustomer.id }])

      const result = await StripeService.getOrCreateCustomer(user)

      expect(result.id).toBe(newCustomer.id)
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
          firebaseUid: user.firebaseUid,
        },
      })
      expect(mockDb.db.update).toHaveBeenCalled()
    })

    it('should create new customer if existing customer is deleted', async () => {
      const user = testUsers.premiumUser
      mockStripe.customers.retrieve.mockResolvedValue({
        id: user.stripeCustomerId,
        deleted: true,
      })
      
      const newCustomer = {
        id: 'cus_new123',
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      }
      mockStripe.customers.create.mockResolvedValue(newCustomer)

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([{ ...user, stripeCustomerId: newCustomer.id }])

      const result = await StripeService.getOrCreateCustomer(user)

      expect(result.id).toBe(newCustomer.id)
      expect(mockStripe.customers.create).toHaveBeenCalled()
    })
  })

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const user = testUsers.freeUser
      const customer = { id: 'cus_test123' }
      const priceId = 'price_pro_monthly'

      const subscription = {
        id: 'sub_test123',
        customer: customer.id,
        status: 'active',
        current_period_end: Date.now() + 86400 * 30 * 1000,
        items: {
          data: [{
            price: {
              id: priceId,
              product: 'prod_pro',
            },
          }],
        },
      }

      mockStripe.subscriptions.create.mockResolvedValue(subscription)

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning.mockResolvedValue([{
        id: 'payment-123',
        userId: user.id,
        amount: 2900,
        status: 'succeeded',
      }])

      const result = await StripeService.createSubscription(user, customer as any, priceId)

      expect(result.id).toBe(subscription.id)
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id,
          firebaseUid: user.firebaseUid,
        },
      })
    })
  })

  describe('handleWebhook', () => {
    it('should handle customer.subscription.created webhook', async () => {
      const event = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            current_period_end: Date.now() + 86400 * 30 * 1000,
            items: {
              data: [{
                price: {
                  id: 'price_pro_monthly',
                  product: 'prod_pro',
                },
              }],
            },
            metadata: {
              userId: 'user-123',
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(event)

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.freeUser]) // findById
        .mockResolvedValueOnce([{ ...testUsers.freeUser, isPremium: true }]) // update user

      const result = await StripeService.handleWebhook('raw-body', 'signature')

      expect(result.processed).toBe(true)
      expect(result.eventType).toBe('customer.subscription.created')
      expect(mockDb.db.update).toHaveBeenCalled()
    })

    it('should handle customer.subscription.deleted webhook', async () => {
      const event = {
        id: 'evt_test123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
            metadata: {
              userId: 'user-123',
            },
          },
        },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(event)

      const mockDb = await import('../../../server/db/index.js')
      mockDb.db.returning
        .mockResolvedValueOnce([testUsers.premiumUser]) // findById
        .mockResolvedValueOnce([{ ...testUsers.premiumUser, isPremium: false }]) // update user

      const result = await StripeService.handleWebhook('raw-body', 'signature')

      expect(result.processed).toBe(true)
      expect(result.eventType).toBe('customer.subscription.deleted')
      expect(mockDb.db.update).toHaveBeenCalled()
    })

    it('should skip unhandled webhook events', async () => {
      const event = {
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: { object: {} },
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(event)

      const result = await StripeService.handleWebhook('raw-body', 'signature')

      expect(result.processed).toBe(false)
      expect(result.eventType).toBe('invoice.payment_succeeded')
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const subscriptionId = 'sub_test123'
      const canceledSubscription = {
        id: subscriptionId,
        status: 'canceled',
        canceled_at: Date.now(),
      }

      mockStripe.subscriptions.update.mockResolvedValue(canceledSubscription)

      const result = await StripeService.cancelSubscription(subscriptionId, true)

      expect(result.status).toBe('canceled')
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(subscriptionId, {
        cancel_at_period_end: false,
      })
    })

    it('should schedule subscription cancellation at period end', async () => {
      const subscriptionId = 'sub_test123'
      const scheduledSubscription = {
        id: subscriptionId,
        status: 'active',
        cancel_at_period_end: true,
      }

      mockStripe.subscriptions.update.mockResolvedValue(scheduledSubscription)

      const result = await StripeService.cancelSubscription(subscriptionId, false)

      expect(result.cancel_at_period_end).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(subscriptionId, {
        cancel_at_period_end: true,
      })
    })
  })

  describe('getSubscriptionPlans', () => {
    it('should return available subscription plans', async () => {
      const mockProducts = [
        {
          id: 'prod_pro',
          name: 'Pro Plan',
          metadata: { plan: 'pro' },
        },
        {
          id: 'prod_enterprise',
          name: 'Enterprise Plan',
          metadata: { plan: 'enterprise' },
        },
      ]

      const mockPrices = [
        {
          id: 'price_pro_monthly',
          unit_amount: 2900,
          currency: 'usd',
          recurring: { interval: 'month' },
          product: 'prod_pro',
        },
        {
          id: 'price_pro_yearly',
          unit_amount: 29000,
          currency: 'usd',
          recurring: { interval: 'year' },
          product: 'prod_pro',
        },
      ]

      mockStripe.products.list.mockResolvedValue({ data: mockProducts })
      mockStripe.prices.list.mockResolvedValue({ data: mockPrices })

      const result = await StripeService.getSubscriptionPlans()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Pro Plan')
      expect(result[0].prices).toHaveLength(2)
      expect(result[0].prices[0].amount).toBe(29) // Converted to dollars
    })
  })
})