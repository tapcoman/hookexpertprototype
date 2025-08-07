// Vercel serverless API with real database authentication
import { createUser, loginUser, findUserById, verifyToken, generateToken } from './lib/auth.js'
import { testConnection } from './lib/db.js'

export default async function handler(req, res) {
  try {
    // Set basic headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }
    
    // For now, return a simple response to test if basic function works
    if (req.url === '/api/health' || req.url === '/health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        serverless: true,
        message: 'Basic function working'
      })
    }
    
    // Handle auth endpoints
    if (req.url === '/api/auth/register' || req.url?.endsWith('/auth/register')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        const { email, password, firstName, lastName } = req.body
        
        if (!email || !password || !firstName || !lastName) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'Email, password, firstName, and lastName are required'
          })
        }
        
        // Create user in database
        const user = await createUser({ email, password, firstName, lastName })
        
        if (!user) {
          return res.status(409).json({
            success: false,
            error: 'User already exists',
            message: 'A user with this email already exists'
          })
        }
        
        // Generate token
        const token = generateToken(user.id)
        
        return res.status(200).json({
          success: true,
          message: 'User registered successfully',
          data: {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              emailVerified: user.emailVerified,
              freeCredits: user.freeCredits || 5,
              usedCredits: user.usedCredits || 0,
              subscriptionStatus: user.subscriptionStatus || 'free',
              createdAt: user.createdAt
            },
            token,
            isNewUser: true
          }
        })
      } catch (error) {
        console.error('Registration error:', error)
        return res.status(500).json({
          success: false,
          error: 'Registration failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Handle auth verify endpoint
    if (req.url === '/api/auth/verify' || req.url?.endsWith('/auth/verify')) {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'No token provided',
            message: 'Authorization header with Bearer token is required'
          })
        }
        
        const token = authHeader.substring(7)
        const decoded = verifyToken(token)
        
        if (!decoded) {
          return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: 'Token is invalid or expired'
          })
        }
        
        // Get user from database
        const user = await findUserById(decoded.userId)
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'User not found',
            message: 'User associated with this token no longer exists'
          })
        }
        
        return res.status(200).json({
          success: true,
          message: 'Token verified successfully',
          data: {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              emailVerified: user.emailVerified,
              freeCredits: user.freeCredits || 5,
              usedCredits: user.usedCredits || 0,
              subscriptionStatus: user.subscriptionStatus,
              createdAt: user.createdAt
            },
            isAuthenticated: true
          }
        })
      } catch (error) {
        console.error('Token verification error:', error)
        return res.status(500).json({
          success: false,
          error: 'Token verification failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Handle auth login endpoint
    if (req.url === '/api/auth/login' || req.url?.endsWith('/auth/login')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        const { email, password } = req.body
        
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'Email and password are required'
          })
        }
        
        // Attempt login
        const result = await loginUser(email, password)
        
        if (!result) {
          return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
            message: 'Email or password is incorrect'
          })
        }
        
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              emailVerified: result.user.emailVerified,
              freeCredits: result.user.freeCredits || 5,
              usedCredits: result.user.usedCredits || 0,
              subscriptionStatus: result.user.subscriptionStatus,
              createdAt: result.user.createdAt
            },
            token: result.token
          }
        })
      } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({
          success: false,
          error: 'Login failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Handle onboarding endpoint
    if (req.url === '/api/users/onboarding' || req.url?.endsWith('/users/onboarding')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'No token provided',
            message: 'Authorization required'
          })
        }
        
        const token = authHeader.substring(7)
        const decoded = verifyToken(token)
        
        if (!decoded) {
          return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: 'Token is invalid or expired'
          })
        }
        
        // Get the onboarding data
        const onboardingData = req.body
        
        console.log('Processing onboarding for userId:', decoded.userId)
        console.log('Onboarding request body:', onboardingData)
        
        // Validate required onboarding fields
        if (!onboardingData.company || !onboardingData.industry || !onboardingData.role) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'Company, industry, and role are required for onboarding'
          })
        }
        
        // Update user with onboarding data
        const { updateUserOnboarding } = await import('./lib/auth.js')
        const updatedUser = await updateUserOnboarding(decoded.userId, onboardingData)
        
        if (!updatedUser) {
          console.error('updateUserOnboarding returned null for userId:', decoded.userId)
          return res.status(400).json({
            success: false,
            error: 'Onboarding failed',
            message: 'Failed to update user profile - user not found or update failed'
          })
        }
        
        // Ensure all necessary fields are present for frontend
        const responseData = {
          ...updatedUser,
          // Ensure these critical fields exist
          company: updatedUser.company || onboardingData.company,
          industry: updatedUser.industry || onboardingData.industry,
          role: updatedUser.role || onboardingData.role,
          voice: updatedUser.voice || onboardingData.voice,
          audience: updatedUser.audience || onboardingData.audience,
          safety: updatedUser.safety || 'standard',
          bannedTerms: updatedUser.bannedTerms || [],
          // Credit system defaults
          freeCredits: updatedUser.freeCredits ?? 5,
          usedCredits: updatedUser.usedCredits ?? 0,
          subscriptionStatus: updatedUser.subscriptionStatus || 'free',
          subscriptionPlan: updatedUser.subscriptionPlan || 'free',
          isPremium: updatedUser.isPremium || false,
          // Psychological defaults
          preferredHookCategories: updatedUser.preferredHookCategories || [],
          psychologicalRiskTolerance: updatedUser.psychologicalRiskTolerance || 'medium',
          creativityPreference: updatedUser.creativityPreference || 'balanced',
          urgencyPreference: updatedUser.urgencyPreference || 'moderate',
          personalityInsights: updatedUser.personalityInsights || {}
        }
        
        console.log('Onboarding completed successfully for user:', responseData.id)
        console.log('Response data includes required fields:', {
          hasCompany: !!responseData.company,
          hasIndustry: !!responseData.industry,
          hasRole: !!responseData.role,
          hasVoice: !!responseData.voice
        })
        
        return res.status(200).json({
          success: true,
          message: 'Onboarding completed successfully',
          data: responseData
        })
      } catch (error) {
        console.error('Onboarding error:', error)
        return res.status(500).json({
          success: false,
          error: 'Onboarding failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Handle analytics endpoints (to prevent infinite loop)
    if (req.url?.includes('/analytics/track')) {
      // Just return success to stop the infinite loop - don't actually track for now
      return res.status(200).json({
        success: true,
        message: 'Event tracked (mock)'
      })
    }
    
    if (req.url?.includes('/auth/')) {
      return res.status(503).json({
        error: 'Other auth endpoints temporarily unavailable',
        message: 'Setting up serverless environment'
      })
    }
    
    // Debug: show what URL we're getting
    console.log('Request URL:', req.url, 'Method:', req.method)
    
    return res.status(404).json({ 
      error: 'Not found',
      url: req.url,
      method: req.method,
      availableRoutes: ['/api/health', '/api/auth/*', '/api/users/onboarding', '/api/analytics/track']
    })
    
  } catch (error) {
    console.error('Function error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}