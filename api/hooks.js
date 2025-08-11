// Separate hooks endpoint file for Vercel
import { verifyToken } from './lib/auth.js'
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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // Extract path from URL
    const path = req.url || ''
    console.log('Hooks endpoint called:', req.method, path)

    // Check authentication first
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

    // Route handling
    if (path === '/api/hooks' && req.method === 'GET') {
      // Default hooks info
      return res.status(200).json({
        success: true,
        message: 'Hooks API is working',
        availableEndpoints: [
          'GET /api/hooks/history',
          'GET /api/hooks/favorites',
          'POST /api/hooks/favorites',
          'DELETE /api/hooks/favorites/{id}',
          'GET /api/hooks/generations/{id}',
          'DELETE /api/hooks/generations/{id}'
        ]
      })
    }

    return res.status(404).json({
      error: 'Endpoint not found',
      path: path,
      method: req.method
    })

  } catch (error) {
    console.error('Hooks API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}