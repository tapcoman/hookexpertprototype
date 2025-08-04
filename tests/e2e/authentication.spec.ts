import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/app')
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/)
    expect(page.locator('h1')).toContainText(['Sign In', 'Login', 'Welcome'])
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/auth')
    
    // Check for form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check form labels/placeholders
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Password')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth')
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/auth')
    
    // Enter valid email but weak password
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123')
    await page.click('button[type="submit"]')
    
    // Should show password validation error
    await expect(page.locator('text=Password must be at least')).toBeVisible()
  })

  test('should toggle between sign in and sign up modes', async ({ page }) => {
    await page.goto('/auth')
    
    // Should start in sign in mode
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
    
    // Click to switch to sign up
    await page.click('text=Don\'t have an account?')
    await expect(page.locator('button[type="submit"]')).toContainText('Sign Up')
    
    // Should show additional fields for sign up
    await expect(page.locator('input[placeholder*="First"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="Last"]')).toBeVisible()
    
    // Switch back to sign in
    await page.click('text=Already have an account?')
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
  })

  test('should handle authentication errors', async ({ page }) => {
    await page.goto('/auth')
    
    // Mock authentication failure
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 400,
            message: 'INVALID_PASSWORD',
            errors: [{ message: 'INVALID_PASSWORD' }]
          }
        })
      })
    })
    
    // Try to sign in with wrong credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid password')).toBeVisible()
  })

  test('should show loading state during authentication', async ({ page }) => {
    await page.goto('/auth')
    
    // Mock slow authentication
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            idToken: 'mock-token',
            email: 'test@example.com',
            localId: 'test-uid',
            expiresIn: '3600'
          })
        })
      }, 2000) // 2 second delay
    })
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show loading indicator
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should redirect to app after successful authentication', async ({ page }) => {
    await page.goto('/auth')
    
    // Mock successful authentication
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          idToken: 'mock-token',
          email: 'test@example.com',
          localId: 'test-uid',
          expiresIn: '3600'
        })
      })
    })
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to main app
    await expect(page).toHaveURL(/\/app/)
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth')
    
    // Click forgot password link
    await page.click('text=Forgot password?')
    
    // Should show password reset form
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Reset Password')
    
    // Enter email and submit
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible()
  })

  test('should persist authentication state on refresh', async ({ page }) => {
    // Mock authenticated state in localStorage
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
    
    await page.goto('/app')
    
    // Should not redirect to auth page
    await expect(page).toHaveURL(/\/app/)
    await expect(page.locator('text=Generate Hooks')).toBeVisible()
  })

  test('should handle logout', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('firebase:authUser:mock-api-key:[DEFAULT]', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com'
      }))
    })
    
    await page.goto('/app')
    
    // Click user menu
    await page.click('[data-testid="user-menu"]')
    
    // Click logout
    await page.click('text=Sign Out')
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
    
    // Should clear authentication state
    const authData = await page.evaluate(() => 
      localStorage.getItem('firebase:authUser:mock-api-key:[DEFAULT]')
    )
    expect(authData).toBeNull()
  })

  test('should handle session expiration', async ({ page }) => {
    // Mock expired session
    await page.addInitScript(() => {
      localStorage.setItem('firebase:authUser:mock-api-key:[DEFAULT]', JSON.stringify({
        uid: 'test-uid',
        email: 'test@example.com',
        stsTokenManager: {
          accessToken: 'expired-token',
          expirationTime: Date.now() - 1000 // Expired
        }
      }))
    })
    
    await page.goto('/app')
    
    // Should redirect to auth page when session is expired
    await expect(page).toHaveURL(/\/auth/)
    await expect(page.locator('text=Your session has expired')).toBeVisible()
  })
})