// Hook favorites endpoint for Vercel
import { verifyToken } from '../lib/auth.js'
import { getUserFavoriteHooks, addToFavorites, removeFromFavorites } from '../lib/hooksData.js'

export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // Check authentication
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

    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Get favorites with pagination
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
      // Add to favorites
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

    if (req.method === 'DELETE') {
      // Remove from favorites - extract ID from URL path or query
      const url = new URL(req.url, `https://${req.headers.host}`)
      const favoriteId = url.searchParams.get('id') || req.query?.id
      
      if (!favoriteId) {
        return res.status(400).json({
          success: false,
          error: 'Missing favorite ID',
          message: 'Favorite ID is required for deletion'
        })
      }
      
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