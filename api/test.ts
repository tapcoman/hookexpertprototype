// Simple test endpoint to debug Vercel issues
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const debug = {
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
      },
      headers: Object.keys(req.headers),
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Test endpoint working',
      debug,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}