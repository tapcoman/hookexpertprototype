import { Router, Response } from 'express'
import { verifyJWTToken, AuthenticatedRequest } from '../middleware/simpleAuth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

// All routes require authentication
router.use(verifyJWTToken)

// Proxy /api/generate to /api/hooks/generate for v0.dev compatibility
router.post('/generate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Forward the request to the hooks generation endpoint
    const hookRes = await fetch(`${req.protocol}://${req.get('host')}/api/hooks/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        platform: req.body.platform,
        objective: req.body.outcome, // map outcome to objective
        topic: req.body.idea, // map idea to topic
        modelType: 'gpt-5-mini-2025-08-07'
      })
    })

    const data = await hookRes.json()
    
    if (!hookRes.ok) {
      return res.status(hookRes.status).json(data)
    }

    // Transform response to v0.dev format
    res.json({
      hooks: data.data.hooks.map((hook: any) => ({
        id: hook.id,
        spokenHook: hook.verbalHook,
        visualCue: hook.visualHook || 'Show yourself speaking this hook',
        overlayText: hook.textualHook || hook.verbalHook,
        framework: hook.framework,
        score: hook.score,
        reasons: [hook.rationale],
        breakdown: {
          curiosity: Math.random() * 2,
          brevity: Math.random(),
          platformFit: Math.random(),
          framework: Math.random()
        },
        isTop: hook.score >= 4.5,
        favorite: false
      }))
    })
  } catch (error) {
    console.error('v0 compat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Stream endpoint for v0.dev compatibility
router.post('/generate-stream', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    // Generate hooks using regular endpoint first
    const hookRes = await fetch(`${req.protocol}://${req.get('host')}/api/hooks/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        platform: req.body.platform,
        objective: req.body.outcome,
        topic: req.body.idea,
        modelType: 'gpt-5-mini-2025-08-07'
      })
    })

    const data = await hookRes.json()
    
    if (!hookRes.ok) {
      res.write(JSON.stringify({ type: 'error', error: data.error || 'Generation failed' }) + '\n')
      return res.end()
    }

    // Stream hooks one by one with delays
    const hooks = data.data.hooks.map((hook: any, index: number) => ({
      id: hook.id || `hook-${index}`,
      spokenHook: hook.verbalHook,
      visualCue: hook.visualHook || 'Show yourself speaking this hook',
      overlayText: hook.textualHook || hook.verbalHook,
      framework: hook.framework,
      score: hook.score,
      reasons: [hook.rationale],
      breakdown: {
        curiosity: Math.random() * 2,
        brevity: Math.random(),
        platformFit: Math.random(),
        framework: Math.random()
      },
      isTop: false,
      favorite: false
    }))

    // Stream each hook
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i]
      res.write(JSON.stringify({ type: 'item', hook }) + '\n')
      
      // Add delay between hooks for realistic streaming
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Mark the top hook
    if (hooks.length > 0) {
      const topHookId = hooks.reduce((prev: any, current: any) => 
        prev.score > current.score ? prev : current
      ).id
      
      res.write(JSON.stringify({ type: 'done', topId: topHookId }) + '\n')
    } else {
      res.write(JSON.stringify({ type: 'done' }) + '\n')
    }

    res.end()
  } catch (error) {
    console.error('v0 stream compat error:', error)
    res.write(JSON.stringify({ type: 'error', error: 'Stream generation failed' }) + '\n')
    res.end()
  }
}))

export default router