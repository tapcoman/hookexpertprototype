// Vercel serverless API with real database authentication
import { createUser, loginUser, findUserById, verifyToken, generateToken } from './lib/auth.js'
import { testConnection } from './lib/db.js'
import { generateEnhancedHooks, checkGenerationLimits, updateUserCredits } from './lib/hookGenerator.js'
import { 
  getUserHookGenerations, 
  getHookGenerationById, 
  deleteHookGeneration,
  getUserFavoriteHooks, 
  addToFavorites, 
  removeFromFavorites 
} from './lib/hooksData.js'

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
        message: 'Hook generation API ready'
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
              // Onboarding fields - CRITICAL for auth context (null for new users)
              company: user.company || null,
              industry: user.industry || null,
              role: user.role || null,
              audience: user.audience || null,
              voice: user.voice || null,
              bannedTerms: user.bannedTerms || [],
              safety: user.safety || 'standard',
              // Credit system
              freeCredits: user.freeCredits || 5,
              usedCredits: user.usedCredits || 0,
              subscriptionStatus: user.subscriptionStatus || 'free',
              subscriptionPlan: user.subscriptionPlan || 'free',
              isPremium: user.isPremium || false,
              // Psychological preferences
              preferredHookCategories: user.preferredHookCategories || [],
              psychologicalRiskTolerance: user.psychologicalRiskTolerance || 'medium',
              creativityPreference: user.creativityPreference || 'balanced',
              urgencyPreference: user.urgencyPreference || 'moderate',
              personalityInsights: user.personalityInsights || {},
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
              // Onboarding fields - CRITICAL for auth context
              company: user.company,
              industry: user.industry,
              role: user.role,
              audience: user.audience,
              voice: user.voice,
              bannedTerms: user.bannedTerms || [],
              safety: user.safety || 'standard',
              // Credit system
              freeCredits: user.freeCredits || 5,
              usedCredits: user.usedCredits || 0,
              subscriptionStatus: user.subscriptionStatus,
              subscriptionPlan: user.subscriptionPlan || 'free',
              isPremium: user.isPremium || false,
              // Psychological preferences
              preferredHookCategories: user.preferredHookCategories || [],
              psychologicalRiskTolerance: user.psychologicalRiskTolerance || 'medium',
              creativityPreference: user.creativityPreference || 'balanced',
              urgencyPreference: user.urgencyPreference || 'moderate',
              personalityInsights: user.personalityInsights || {},
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
              // Onboarding fields - CRITICAL for auth context
              company: result.user.company,
              industry: result.user.industry,
              role: result.user.role,
              audience: result.user.audience,
              voice: result.user.voice,
              bannedTerms: result.user.bannedTerms || [],
              safety: result.user.safety || 'standard',
              // Credit system
              freeCredits: result.user.freeCredits || 5,
              usedCredits: result.user.usedCredits || 0,
              subscriptionStatus: result.user.subscriptionStatus,
              subscriptionPlan: result.user.subscriptionPlan || 'free',
              isPremium: result.user.isPremium || false,
              // Psychological preferences
              preferredHookCategories: result.user.preferredHookCategories || [],
              psychologicalRiskTolerance: result.user.psychologicalRiskTolerance || 'medium',
              creativityPreference: result.user.creativityPreference || 'balanced',
              urgencyPreference: result.user.urgencyPreference || 'moderate',
              personalityInsights: result.user.personalityInsights || {},
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
    
    // Handle hook generation endpoints
    if (req.url === '/api/hooks/generate/enhanced' || req.url?.endsWith('/hooks/generate/enhanced')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
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
        
        const { platform, objective, topic, modelType } = req.body
        
        // Validate required fields
        if (!platform || !objective || !topic) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'Platform, objective, and topic are required'
          })
        }
        
        // Validate enum values
        const validPlatforms = ['tiktok', 'instagram', 'youtube']
        const validObjectives = ['watch_time', 'shares', 'saves', 'ctr', 'follows']
        const validModels = ['gpt-4o', 'gpt-4o-mini']
        
        if (!validPlatforms.includes(platform)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid platform',
            message: `Platform must be one of: ${validPlatforms.join(', ')}`
          })
        }
        
        if (!validObjectives.includes(objective)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid objective',
            message: `Objective must be one of: ${validObjectives.join(', ')}`
          })
        }
        
        if (modelType && !validModels.includes(modelType)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid model type',
            message: `Model type must be one of: ${validModels.join(', ')}`
          })
        }
        
        if (topic.length < 10 || topic.length > 1000) {
          return res.status(400).json({
            success: false,
            error: 'Invalid topic length',
            message: 'Topic must be between 10 and 1000 characters'
          })
        }
        
        console.log('Hook generation request:', {
          userId: decoded.userId,
          platform,
          objective,
          topicLength: topic.length,
          modelType: modelType || 'gpt-4o-mini'
        })
        
        // Check generation limits
        const generationStatus = await checkGenerationLimits(decoded.userId)
        if (!generationStatus.canGenerate) {
          return res.status(429).json({
            success: false,
            error: 'Generation limit reached',
            message: generationStatus.reason,
            data: { generationStatus }
          })
        }
        
        console.log('Generation limits checked - user can generate')
        
        // Generate hooks using the enhanced generator
        const result = await generateEnhancedHooks({
          userId: decoded.userId,
          platform,
          objective,
          topic,
          modelType: modelType || 'gpt-4o-mini'
        })
        
        console.log(`Hook generation successful - generated ${result.hooks.length} hooks`)
        
        // Update user credits if needed
        await updateUserCredits(decoded.userId, modelType || 'gpt-4o-mini')
        
        return res.status(200).json({
          success: true,
          message: 'Hooks generated successfully',
          data: result
        })
        
      } catch (error) {
        console.error('Hook generation error:', error)
        return res.status(500).json({
          success: false,
          error: 'Hook generation failed',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }
    
    // Handle hook history endpoints
    if (req.url === '/api/hooks/history' || req.url?.endsWith('/hooks/history')) {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
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
        
        // Parse query parameters
        const url = new URL(req.url, `https://${req.headers.host}`)
        const page = parseInt(url.searchParams.get('page')) || 1
        const limit = parseInt(url.searchParams.get('limit')) || 10
        
        console.log('Getting hook history for user:', decoded.userId, { page, limit })
        
        const result = await getUserHookGenerations(decoded.userId, { page, limit })
        
        return res.status(200).json({
          success: true,
          message: 'Hook history retrieved successfully',
          data: result.data,
          pagination: result.pagination
        })
        
      } catch (error) {
        console.error('Hook history error:', error)
        return res.status(500).json({
          success: false,
          error: 'Failed to get hook history',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }
    
    // Handle specific hook generation by ID
    if (req.url?.match(/^\/api\/hooks\/generations\/[^/]+$/) || req.url?.match(/\/hooks\/generations\/[^/]+$/)) {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
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
        
        // Extract generation ID from URL
        const generationId = req.url.split('/').pop()
        
        if (req.method === 'GET') {
          console.log('Getting hook generation:', generationId, 'for user:', decoded.userId)
          
          const result = await getHookGenerationById(decoded.userId, generationId)
          
          if (!result) {
            return res.status(404).json({
              success: false,
              error: 'Generation not found',
              message: 'Hook generation not found or access denied'
            })
          }
          
          return res.status(200).json({
            success: true,
            message: 'Hook generation retrieved successfully',
            data: result
          })
        }
        
        if (req.method === 'DELETE') {
          console.log('Deleting hook generation:', generationId, 'for user:', decoded.userId)
          
          const result = await deleteHookGeneration(decoded.userId, generationId)
          
          if (!result) {
            return res.status(404).json({
              success: false,
              error: 'Generation not found',
              message: 'Hook generation not found or access denied'
            })
          }
          
          return res.status(200).json({
            success: true,
            message: 'Hook generation deleted successfully'
          })
        }
        
        return res.status(405).json({ error: 'Method not allowed' })
        
      } catch (error) {
        console.error('Hook generation by ID error:', error)
        return res.status(500).json({
          success: false,
          error: 'Failed to process hook generation request',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }
    
    // Handle favorites endpoints
    if (req.url === '/api/hooks/favorites' || req.url?.endsWith('/hooks/favorites')) {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
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
        
        if (req.method === 'GET') {
          // Parse query parameters
          const url = new URL(req.url, `https://${req.headers.host}`)
          const page = parseInt(url.searchParams.get('page')) || 1
          const limit = parseInt(url.searchParams.get('limit')) || 10
          
          console.log('Getting favorites for user:', decoded.userId, { page, limit })
          
          const result = await getUserFavoriteHooks(decoded.userId, { page, limit })
          
          return res.status(200).json({
            success: true,
            message: 'Favorites retrieved successfully',
            data: result.data,
            pagination: result.pagination
          })
        }
        
        if (req.method === 'POST') {
          const favoriteData = req.body
          
          if (!favoriteData.hookData || !favoriteData.framework || !favoriteData.platformNotes) {
            return res.status(400).json({
              success: false,
              error: 'Missing required fields',
              message: 'hookData, framework, and platformNotes are required'
            })
          }
          
          console.log('Adding to favorites for user:', decoded.userId)
          
          const result = await addToFavorites(decoded.userId, favoriteData)
          
          return res.status(201).json({
            success: true,
            message: 'Added to favorites successfully',
            data: result
          })
        }
        
        return res.status(405).json({ error: 'Method not allowed' })
        
      } catch (error) {
        console.error('Favorites error:', error)
        return res.status(500).json({
          success: false,
          error: 'Failed to process favorites request',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }
    
    // Handle specific favorite by ID (for deletion)
    if (req.url?.match(/^\/api\/hooks\/favorites\/[^/]+$/) || req.url?.match(/\/hooks\/favorites\/[^/]+$/)) {
      if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
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
        
        // Extract favorite ID from URL
        const favoriteId = req.url.split('/').pop()
        
        console.log('Removing from favorites:', favoriteId, 'for user:', decoded.userId)
        
        const result = await removeFromFavorites(decoded.userId, favoriteId)
        
        if (!result) {
          return res.status(404).json({
            success: false,
            error: 'Favorite not found',
            message: 'Favorite hook not found or access denied'
          })
        }
        
        return res.status(200).json({
          success: true,
          message: 'Removed from favorites successfully'
        })
        
      } catch (error) {
        console.error('Remove favorite error:', error)
        return res.status(500).json({
          success: false,
          error: 'Failed to remove from favorites',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
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
      availableRoutes: [
        '/api/health', 
        '/api/auth/*', 
        '/api/users/onboarding', 
        '/api/hooks/generate/enhanced', 
        '/api/hooks/history', 
        '/api/hooks/generations/{id}', 
        '/api/hooks/favorites', 
        '/api/hooks/favorites/{id}', 
        '/api/analytics/track'
      ]
    })
    
  } catch (error) {
    console.error('Function error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}