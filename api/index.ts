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
    
    // Handle auth endpoints
    if (req.url === '/api/auth/register' || req.url?.endsWith('/auth/register')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }
      
      try {
        // For now, return a mock successful registration
        return res.status(200).json({
          success: true,
          message: 'Registration endpoint working',
          user: { email: 'test@example.com', id: '123' },
          token: 'mock-jwt-token'
        })
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Registration failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
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
      availableRoutes: ['/api/health', '/api/auth/*']
    })
    
  } catch (error) {
    console.error('Function error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}