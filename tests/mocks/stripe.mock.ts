import { jest } from '@jest/globals'

// Mock Stripe SDK
const mockStripe = {
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
      created: Date.now(),
      metadata: {},
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
      deleted: false,
    }),
    update: jest.fn().mockResolvedValue({
      id: 'cus_test123',
      email: 'test@example.com',
    }),
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'active',
      current_period_end: Date.now() + 86400 * 30 * 1000,
      items: {
        data: [{
          price: {
            id: 'price_test123',
            product: 'prod_test123',
          },
        }],
      },
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      current_period_end: Date.now() + 86400 * 30 * 1000,
    }),
    update: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
    }),
    cancel: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'canceled',
    }),
  },
  prices: {
    list: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'price_test123',
          unit_amount: 2900,
          currency: 'usd',
          recurring: { interval: 'month' },
          product: 'prod_test123',
        },
      ],
    }),
  },
  products: {
    list: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'prod_test123',
          name: 'Pro Plan',
          metadata: { plan: 'pro' },
        },
      ],
    }),
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret_test123',
      status: 'requires_payment_method',
    }),
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      id: 'evt_test123',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
        },
      },
    }),
  },
}

// Mock the Stripe constructor
jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockStripe),
  }
})

export { mockStripe }