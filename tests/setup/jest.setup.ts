import { jest } from '@jest/globals'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hooklinestudio_test'

// Mock external services
jest.mock('../mocks/stripe.mock')
jest.mock('../mocks/firebase.mock')
jest.mock('../mocks/openai.mock')

// Global test timeout
jest.setTimeout(30000)

// Suppress console logs during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}

// Global teardown for database connections
afterAll(async () => {
  // Close database connections
  await new Promise(resolve => setTimeout(resolve, 500))
});