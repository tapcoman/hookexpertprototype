import { test, expect } from '@playwright/test'

test.describe('Subscription and Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('firebase:authUser:mock-api-key:[DEFAULT]', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com',
        stsTokenManager: {
          accessToken: 'mock-token',
          expirationTime: Date.now() + 3600000
        }
      }))
    })
  })

  test('should display pricing page with available plans', async ({ page }) => {
    // Mock pricing API
    await page.route('**/api/payments/plans', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'prod_pro',
              name: 'Pro Plan',
              description: 'Unlimited hook generations',
              prices: [
                {
                  id: 'price_pro_monthly',
                  amount: 29,
                  currency: 'usd',
                  interval: 'month'
                },
                {
                  id: 'price_pro_yearly',
                  amount: 290,
                  currency: 'usd',
                  interval: 'year'
                }
              ],
              features: [
                'Unlimited hook generations',
                'Advanced AI models',
                'Priority support',
                'Analytics dashboard'
              ]
            }
          ]
        })
      })
    })

    await page.goto('/pricing')

    // Should show plan details
    await expect(page.locator('text=Pro Plan')).toBeVisible()
    await expect(page.locator('text=Unlimited hook generations')).toBeVisible()
    await expect(page.locator('text=$29')).toBeVisible()
    await expect(page.locator('text=$290')).toBeVisible()
    
    // Should show features
    await expect(page.locator('text=Advanced AI models')).toBeVisible()
    await expect(page.locator('text=Priority support')).toBeVisible()
    await expect(page.locator('text=Analytics dashboard')).toBeVisible()
  })

  test('should initiate subscription process for free user', async ({ page }) => {
    // Mock user subscription status
    await page.route('**/api/payments/subscription-status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'free',
            plan: 'free',
            currentPeriodEnd: null
          }
        })
      })
    })

    await page.goto('/billing')

    // Should show free plan status
    await expect(page.locator('text=Free Plan')).toBeVisible()
    await expect(page.locator('text=Upgrade to Pro')).toBeVisible()

    // Click upgrade button
    await page.click('button:has-text("Upgrade to Pro")')

    // Should navigate to pricing or show upgrade modal
    await expect(page.locator('text=Choose Your Plan')).toBeVisible()
  })

  test('should handle subscription creation with Stripe', async ({ page }) => {
    // Mock subscription creation
    await page.route('**/api/payments/create-subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            subscriptionId: 'sub_test123',
            clientSecret: 'pi_test123_secret_test',
            status: 'requires_payment_method'
          }
        })
      })
    })

    await page.goto('/pricing')

    // Click on monthly Pro plan
    await page.click('button:has-text("Subscribe Monthly")')

    // Should redirect to payment page or show payment form
    await expect(page.locator('#card-element')).toBeVisible() // Stripe card element
    await expect(page.locator('text=Payment Details')).toBeVisible()
  })

  test('should display current subscription for premium user', async ({ page }) => {
    // Mock premium user subscription status
    await page.route('**/api/payments/subscription-status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'active',
            plan: 'pro',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false
          }
        })
      })
    })

    await page.goto('/billing')

    // Should show active subscription details
    await expect(page.locator('text=Pro Plan')).toBeVisible()
    await expect(page.locator('text=Active')).toBeVisible()
    await expect(page.locator('text=Next billing')).toBeVisible()
    await expect(page.locator('button:has-text("Cancel Subscription")')).toBeVisible()
  })

  test('should handle subscription cancellation', async ({ page }) => {
    // Mock active subscription
    await page.route('**/api/payments/subscription-status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'active',
            plan: 'pro',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false
          }
        })
      })
    })

    // Mock cancellation API
    await page.route('**/api/payments/cancel-subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'active',
            cancelAtPeriodEnd: true
          }
        })
      })
    })

    await page.goto('/billing')

    // Click cancel subscription
    await page.click('button:has-text("Cancel Subscription")')

    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure you want to cancel')).toBeVisible()
    
    // Choose to cancel at period end
    await page.click('button:has-text("Cancel at Period End")')

    // Should show success message
    await expect(page.locator('text=Subscription will be canceled')).toBeVisible()
    await expect(page.locator('text=You can continue using Pro features until')).toBeVisible()
  })

  test('should show generation limits and upgrade prompts for free users', async ({ page }) => {
    // Mock generation limit response
    await page.route('**/api/hooks/generate', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Weekly draft limit reached. Upgrade to Pro for unlimited generations.',
          remainingGenerations: 0,
          resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    await page.goto('/app')

    // Try to generate hooks
    await page.fill('textarea[name="topic"]', 'productivity tips for remote workers')
    await page.click('button[type="submit"]')

    // Should show limit reached message
    await expect(page.locator('text=Weekly draft limit reached')).toBeVisible()
    await expect(page.locator('text=Upgrade to Pro for unlimited generations')).toBeVisible()
    
    // Should show upgrade button
    await expect(page.locator('button:has-text("Upgrade Now")')).toBeVisible()
    
    // Click upgrade button
    await page.click('button:has-text("Upgrade Now")')
    
    // Should redirect to pricing
    await expect(page).toHaveURL(/\/pricing/)
  })

  test('should handle payment failures gracefully', async ({ page }) => {
    // Mock payment failure
    await page.route('**/api/payments/create-subscription', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Your card was declined. Please try a different payment method.'
        })
      })
    })

    await page.goto('/pricing')
    await page.click('button:has-text("Subscribe Monthly")')

    // Fill in payment details (mock)
    await page.fill('#card-number', '4000000000000002') // Declined card number
    await page.fill('#card-expiry', '12/25')
    await page.fill('#card-cvc', '123')

    await page.click('button:has-text("Subscribe")')

    // Should show error message
    await expect(page.locator('text=Your card was declined')).toBeVisible()
    await expect(page.locator('text=Please try a different payment method')).toBeVisible()
  })

  test('should show billing history for premium users', async ({ page }) => {
    // Mock billing history
    await page.route('**/api/payments/history', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'pay_123',
              amount: 2900,
              currency: 'usd',
              status: 'succeeded',
              date: new Date('2024-01-15').toISOString(),
              description: 'Pro Plan - Monthly'
            },
            {
              id: 'pay_124',
              amount: 2900,
              currency: 'usd',
              status: 'succeeded',
              date: new Date('2023-12-15').toISOString(),
              description: 'Pro Plan - Monthly'
            }
          ]
        })
      })
    })

    await page.goto('/billing')

    // Should show billing history section
    await expect(page.locator('text=Billing History')).toBeVisible()
    await expect(page.locator('text=$29.00')).toBeVisible()
    await expect(page.locator('text=Pro Plan - Monthly')).toBeVisible()
    await expect(page.locator('text=January 15, 2024')).toBeVisible()
    await expect(page.locator('text=Succeeded')).toBeVisible()
  })

  test('should handle subscription reactivation', async ({ page }) => {
    // Mock canceled subscription
    await page.route('**/api/payments/subscription-status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'active',
            plan: 'pro',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: true
          }
        })
      })
    })

    // Mock reactivation API
    await page.route('**/api/payments/reactivate-subscription', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'active',
            cancelAtPeriodEnd: false
          }
        })
      })
    })

    await page.goto('/billing')

    // Should show reactivation option
    await expect(page.locator('text=Scheduled for cancellation')).toBeVisible()
    await expect(page.locator('button:has-text("Reactivate Subscription")')).toBeVisible()

    // Click reactivate
    await page.click('button:has-text("Reactivate Subscription")')

    // Should show success message
    await expect(page.locator('text=Subscription reactivated successfully')).toBeVisible()
  })

  test('should display usage statistics for current billing period', async ({ page }) => {
    // Mock usage stats
    await page.route('**/api/users/usage-stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            currentPeriod: {
              hookGenerations: 127,
              favoriteHooks: 23,
              apiRequests: 145
            },
            limits: {
              hookGenerations: 1000,
              apiRequests: 5000
            },
            resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
      })
    })

    await page.goto('/billing')

    // Should show usage statistics
    await expect(page.locator('text=Usage This Period')).toBeVisible()
    await expect(page.locator('text=127 / 1,000')).toBeVisible() // Hook generations
    await expect(page.locator('text=23')).toBeVisible() // Favorite hooks
    await expect(page.locator('text=145 / 5,000')).toBeVisible() // API requests
    
    // Should show reset date
    await expect(page.locator('text=Resets in 15 days')).toBeVisible()
  })
})