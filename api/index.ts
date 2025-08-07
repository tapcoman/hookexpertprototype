// Simple Vercel API entry point 
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
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
    
    // For auth endpoints, return a temporary response
    if (req.url?.includes('/auth/')) {
      return res.status(503).json({
        error: 'Authentication service temporarily unavailable',
        message: 'Setting up serverless environment'
      })
    }
    
    return res.status(404).json({ error: 'Not found' })
    
  } catch (error) {
    console.error('Function error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}