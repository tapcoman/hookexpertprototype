// Hook history endpoint for Vercel
import { verifyToken } from '../lib/auth.js'
import { getUserHookGenerations } from '../lib/hooksData.js'

export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
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