// Vercel API entry point for serverless deployment
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { app } from '../server/index.js'

// Handle serverless function warmup
let isWarm = false

// Serverless wrapper for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Mark as warm after first request
  if (!isWarm) {
    console.log('🔥 Serverless function warming up...')
    isWarm = true
  }

  // Add serverless-specific headers
  res.setHeader('X-Serverless-Function', 'vercel')
  res.setHeader('X-Execution-Start', Date.now().toString())

  // Handle the request through Express app
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        console.error('Serverless function error:', err)
        return reject(err)
      }
      resolve(undefined)
    })
  })
}