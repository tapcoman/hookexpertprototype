import { test, expect } from '@playwright/test'

test.describe('Hook Generation Flow', () => {
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
    
    // Navigate to main app
    await page.goto('/app')
  })

  test('should display hook generation form', async ({ page }) => {
    // Check form elements are present
    await expect(page.locator('select[name="platform"]')).toBeVisible()
    await expect(page.locator('select[name="objective"]')).toBeVisible()
    await expect(page.locator('textarea[name="topic"]')).toBeVisible()
    await expect(page.locator('select[name="modelType"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check default values
    expect(await page.locator('select[name="platform"]').inputValue()).toBe('tiktok')
    expect(await page.locator('select[name="objective"]').inputValue()).toBe('watch_time')
    expect(await page.locator('select[name="modelType"]').inputValue()).toBe('gpt-4o-mini')
  })

  test('should validate form inputs', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=Please enter a topic')).toBeVisible()
    
    // Enter topic that's too short
    await page.fill('textarea[name="topic"]', 'short')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Topic must be at least 10 characters')).toBeVisible()
  })

  test('should generate hooks successfully', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/hooks/generate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'gen-123',
            hooks: [
              {
                id: 'hook-1',
                text: 'This one weird trick will change your life forever',
                formula: 'QH-01',
                category: 'question-based',
                confidence: 85,
                psychologicalDrivers: ['curiosity-gap', 'value-hit'],
                platform: 'tiktok',
                objective: 'watch_time',
                reasoning: 'Uses curiosity gap and value proposition',
                effectiveness: 8.5,
                riskLevel: 'medium'
              },
              {
                id: 'hook-2',
                text: 'Why nobody talks about this simple method',
                formula: 'QH-02',
                category: 'question-based',
                confidence: 78,
                psychologicalDrivers: ['curiosity-gap', 'social-proof'],
                platform: 'tiktok',
                objective: 'watch_time',
                reasoning: 'Leverages social proof and mystery',
                effectiveness: 7.8,
                riskLevel: 'low'
              }
            ],
            topThreeVariants: [
              {
                id: 'variant-1',
                text: 'The secret method everyone ignores',
                formula: 'ST-01',
                category: 'statement-based',
                confidence: 88,
                psychologicalDrivers: ['authority-credibility', 'curiosity-gap'],
                platform: 'tiktok',
                objective: 'watch_time'
              }
            ],
            strategy: {
              primaryTrigger: 'curiosity-gap',
              secondaryTriggers: ['value-hit', 'social-proof'],
              confidence: 85,
              adaptationNotes: 'Optimized for TikTok watch time'
            }
          }
        })
      })
    })
    
    // Fill form
    await page.selectOption('select[name="platform"]', 'tiktok')
    await page.selectOption('select[name="objective"]', 'watch_time')
    await page.fill('textarea[name="topic"]', 'productivity tips for remote workers')
    await page.selectOption('select[name="modelType"]', 'gpt-4o-mini')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for results
    await expect(page.locator('text=This one weird trick will change your life forever')).toBeVisible()
    await expect(page.locator('text=Why nobody talks about this simple method')).toBeVisible()
    
    // Should show strategy information
    await expect(page.locator('text=Primary Trigger: curiosity-gap')).toBeVisible()
    await expect(page.locator('text=Confidence: 85%')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/hooks/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'AI service is temporarily unavailable'
        })
      })
    })
    
    // Fill and submit form
    await page.fill('textarea[name="topic"]', 'productivity tips for remote workers')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=AI service is temporarily unavailable')).toBeVisible()
    
    // Form should be re-enabled
    await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
  })

  test('should copy hooks to clipboard', async ({ page }) => {
    // Generate hooks first
    await page.route('**/api/hooks/generate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            hooks: [{
              id: 'hook-1',
              text: 'Test hook content',
              formula: 'QH-01',
              confidence: 85
            }],
            strategy: { primaryTrigger: 'curiosity-gap', confidence: 85 }
          }
        })
      })
    })
    
    await page.fill('textarea[name="topic"]', 'productivity tips for remote workers')
    await page.click('button[type="submit"]')
    
    // Wait for hooks to appear
    await expect(page.locator('text=Test hook content')).toBeVisible()
    
    // Mock clipboard API
    await page.evaluate(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      })
    })
    
    // Click copy button
    await page.click('[data-testid="copy-button"]')
    
    // Should show success toast
    await expect(page.locator('text=Copied to clipboard')).toBeVisible()
  })

  test('should add hooks to favorites', async ({ page }) => {
    // Mock hooks generation
    await page.route('**/api/hooks/generate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'gen-123',
            hooks: [{
              id: 'hook-1',
              text: 'Test hook content',
              formula: 'QH-01',
              confidence: 85
            }],
            strategy: { primaryTrigger: 'curiosity-gap', confidence: 85 }
          }
        })
      })
    })
    
    // Mock favorites API
    await page.route('**/api/hooks/favorites', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'fav-123' }
          })
        })
      }
    })
    
    // Generate hooks
    await page.fill('textarea[name="topic"]', 'productivity tips for remote workers')
    await page.click('button[type="submit"]')
    
    // Wait for hooks
    await expect(page.locator('text=Test hook content')).toBeVisible()
    
    // Click favorite button
    await page.click('[data-testid="favorite-button"]')
    
    // Should show success message
    await expect(page.locator('text=Added to favorites')).toBeVisible()
    
    // Button should change state
    await expect(page.locator('[data-testid="favorite-button"]')).toHaveClass(/favorited/)
  })

  test('should show generation limits for free users', async ({ page }) => {
    // Mock user at generation limit
    await page.route('**/api/hooks/generate', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Weekly draft limit reached. Upgrade to Pro for unlimited generations.'
        })
      })
    })
    
    await page.fill('textarea[name="topic"]', 'productivity tips for remote workers')
    await page.click('button[type="submit"]')
    
    // Should show limit message
    await expect(page.locator('text=Weekly draft limit reached')).toBeVisible()
    
    // Should show upgrade prompt
    await expect(page.locator('text=Upgrade to Pro')).toBeVisible()
    await expect(page.locator('button:has-text("Upgrade Now")')).toBeVisible()
  })

  test('should allow different platform and objective combinations', async ({ page }) => {
    // Test Instagram + Engagement
    await page.selectOption('select[name="platform"]', 'instagram')
    await page.selectOption('select[name="objective"]', 'engagement')
    
    expect(await page.locator('select[name="platform"]').inputValue()).toBe('instagram')
    expect(await page.locator('select[name="objective"]').inputValue()).toBe('engagement')
    
    // Test YouTube + Click Through
    await page.selectOption('select[name="platform"]', 'youtube')
    await page.selectOption('select[name="objective"]', 'click_through')
    
    expect(await page.locator('select[name="platform"]').inputValue()).toBe('youtube')
    expect(await page.locator('select[name="objective"]').inputValue()).toBe('click_through')
  })

  test('should show hook details and reasoning', async ({ page }) => {
    // Mock detailed hooks response
    await page.route('**/api/hooks/generate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            hooks: [{
              id: 'hook-1',
              text: 'Test hook content',
              formula: 'QH-01',
              confidence: 85,
              reasoning: 'This hook uses curiosity gap to engage viewers',
              psychologicalDrivers: ['curiosity-gap', 'value-hit'],
              effectiveness: 8.5,
              riskLevel: 'medium'
            }],
            strategy: { primaryTrigger: 'curiosity-gap', confidence: 85 }
          }
        })
      })
    })
    
    await page.fill('textarea[name="topic"]', 'productivity tips for remote workers')
    await page.click('button[type="submit"]')
    
    // Wait for hooks
    await expect(page.locator('text=Test hook content')).toBeVisible()
    
    // Should show hook details
    await expect(page.locator('text=Formula: QH-01')).toBeVisible()
    await expect(page.locator('text=85%')).toBeVisible()
    await expect(page.locator('text=This hook uses curiosity gap')).toBeVisible()
    await expect(page.locator('text=Curiosity Gap')).toBeVisible()
    await expect(page.locator('text=Value Hit')).toBeVisible()
  })

  test('should handle model type selection', async ({ page }) => {
    // Test different model types
    await page.selectOption('select[name="modelType"]', 'gpt-4o')
    expect(await page.locator('select[name="modelType"]').inputValue()).toBe('gpt-4o')
    
    await page.selectOption('select[name="modelType"]', 'gpt-4o-mini')
    expect(await page.locator('select[name="modelType"]').inputValue()).toBe('gpt-4o-mini')
  })

  test('should persist form values during session', async ({ page }) => {
    // Set form values
    await page.selectOption('select[name="platform"]', 'instagram')
    await page.selectOption('select[name="objective"]', 'engagement')
    await page.fill('textarea[name="topic"]', 'content marketing tips')
    await page.selectOption('select[name="modelType"]', 'gpt-4o')
    
    // Navigate away and back
    await page.goto('/favorites')
    await page.goto('/app')
    
    // Values should be preserved
    expect(await page.locator('select[name="platform"]').inputValue()).toBe('instagram')
    expect(await page.locator('select[name="objective"]').inputValue()).toBe('engagement')
    expect(await page.locator('textarea[name="topic"]').inputValue()).toBe('content marketing tips')
    expect(await page.locator('select[name="modelType"]').inputValue()).toBe('gpt-4o')
  })
})