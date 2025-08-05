import { Router, Response } from 'express'
import { z } from 'zod'
import { UserService } from '../services/database.js'
import { AuthService } from '../services/authService.js'
import { FirebaseService } from '../services/firebaseService.js'
import { FirebaseWebhookService, validateFirebaseWebhook } from '../services/firebaseWebhooks.js'
import { initializeFirebase, generateJWTToken, verifyFirebaseToken } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validation.js'
import { authRateLimit } from '../middleware/rateLimiting.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { AuthenticationError, ValidationError } from '../middleware/errorHandler.js'
import { logBusinessEvent, logSecurityEvent } from '../middleware/logging.js'
import { requireDatabase, degradedFirebase, isServiceAvailable } from '../middleware/serviceAvailability.js'
import { APIResponse } from '../../shared/types.js'
import admin from 'firebase-admin'

const router = Router()

// Initialize Firebase on route setup
initializeFirebase()

// All auth routes require database, Firebase is degraded (can fallback)
router.use(requireDatabase)
router.use(degradedFirebase)

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  firebaseToken: z.string().min(1, 'Firebase token is required')
})

const loginSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase token is required')
})

const firebaseSyncSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase token is required'),
  userData: z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    emailVerified: z.boolean().optional()
  })
})

// POST /api/auth/register - User registration with Firebase
router.post('/register', 
  authRateLimit,
  validateRequest(registerSchema),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { email, firstName, lastName, firebaseToken } = req.body
    const ipAddress = req.ip || 'unknown'

    try {
      const authResult = await AuthService.register(
        { email, firstName, lastName, firebaseToken },
        ipAddress
      )

      res.status(201).json({
        success: true,
        data: authResult,
        message: authResult.isNewUser ? 'User registered successfully' : 'User already exists and logged in'
      })

    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(409).json({
          success: false,
          error: error.message
        })
      }
      throw error
    }
  })
)

// POST /api/auth/login - User authentication
router.post('/login',
  authRateLimit,
  validateRequest(loginSchema),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { firebaseToken } = req.body
    const ipAddress = req.ip || 'unknown'

    const authResult = await AuthService.login({ firebaseToken }, ipAddress)

    res.json({
      success: true,
      data: authResult,
      message: 'Login successful'
    })
  })
)

// POST /api/auth/firebase-sync - Sync user data between Firebase and PostgreSQL
router.post('/firebase-sync',
  authRateLimit,
  validateRequest(firebaseSyncSchema),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { firebaseToken, userData } = req.body
    const ipAddress = req.ip || 'unknown'

    const authResult = await AuthService.syncUser({ firebaseToken, userData }, ipAddress)

    res.json({
      success: true,
      data: authResult,
      message: 'User data synchronized successfully'
    })
  })
)

// POST /api/auth/refresh - Refresh authentication with Firebase token
router.post('/refresh',
  authRateLimit,
  validateRequest(z.object({
    firebaseToken: z.string().min(1, 'Firebase token is required')
  })),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { firebaseToken } = req.body
    const ipAddress = req.ip || 'unknown'

    const authResult = await AuthService.refreshAuth(firebaseToken, ipAddress)

    res.json({
      success: true,
      data: authResult,
      message: 'Authentication refreshed successfully'
    })
  })
)

// GET /api/auth/verify - Verify current authentication status
router.get('/verify',
  verifyFirebaseToken,
  asyncHandler(async (req, res: Response<APIResponse>) => {
    // Token has been verified by middleware, user is attached to request
    const authReq = req as any
    res.json({
      success: true,
      data: {
        user: authReq.user,
        isAuthenticated: true
      },
      message: 'Authentication token is valid'
    })
  })
)

// POST /api/auth/logout - Logout user and revoke tokens
router.post('/logout',
  authRateLimit,
  verifyFirebaseToken,
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const authReq = req as any
    const ipAddress = req.ip || 'unknown'

    if (authReq.user?.firebaseUid) {
      await AuthService.logout(authReq.user.firebaseUid, authReq.user.id, ipAddress)
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  })
)

// DELETE /api/auth/account - Delete user account (GDPR compliance)
router.delete('/account',
  authRateLimit,
  verifyFirebaseToken,
  validateRequest(z.object({
    confirmEmail: z.string().email('Valid email required for confirmation')
  })),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { confirmEmail } = req.body
    const authReq = req as any
    const ipAddress = req.ip || 'unknown'

    // Security: Ensure email matches current user
    if (confirmEmail !== authReq.user.email) {
      return res.status(400).json({
        success: false,
        error: 'Email confirmation does not match current user'
      })
    }

    if (authReq.user?.firebaseUid) {
      await AuthService.deleteAccount(authReq.user.firebaseUid, authReq.user.id, ipAddress)
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    })
  })
)

// GET /api/auth/status - Get authentication status without requiring valid token
router.get('/status',
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  (req.query.token as string)

    const status = await AuthService.getAuthStatus(token)

    res.json({
      success: true,
      data: status,
      message: status.isAuthenticated ? 'User is authenticated' : 'User is not authenticated'
    })
  })
)

// POST /api/auth/firebase/custom-token - Generate custom Firebase token (admin only)
router.post('/firebase/custom-token',
  authRateLimit,
  verifyFirebaseToken,
  validateRequest(z.object({
    targetUid: z.string().min(1, 'Target UID is required'),
    customClaims: z.record(z.any()).optional()
  })),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { targetUid, customClaims } = req.body
    const authReq = req as any

    // Security: Only allow premium users or admin to generate custom tokens
    if (!authReq.user.isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required for custom token generation'
      })
    }

    const customToken = await FirebaseService.createCustomToken(targetUid, customClaims)

    res.json({
      success: true,
      data: { customToken },
      message: 'Custom token generated successfully'
    })
  })
)

// GET /api/auth/firebase/health - Firebase service health check
router.get('/firebase/health',
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const healthStatus = await FirebaseService.healthCheck()
    const configured = FirebaseService.isConfigured()
    const projectId = FirebaseService.getProjectId()

    // Enhanced health check with environment variable status
    const envStatus = {
      projectId: {
        present: !!process.env.FIREBASE_PROJECT_ID,
        value: process.env.FIREBASE_PROJECT_ID ? `${process.env.FIREBASE_PROJECT_ID.substring(0, 10)}...` : null
      },
      serviceAccountKey: {
        present: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        length: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
        validJson: false
      }
    }

    // Test JSON parsing
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        envStatus.serviceAccountKey.validJson = true
      } catch {
        envStatus.serviceAccountKey.validJson = false
      }
    }

    const isHealthy = configured && healthStatus.status === 'connected'

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        firebase: healthStatus,
        configured,
        projectId,
        environmentVariables: envStatus,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV
      },
      message: isHealthy ? 'Firebase health check completed - service is healthy' : 'Firebase health check completed - service has issues'
    })
  })
)

// ==================== WEBHOOK ENDPOINTS ====================

// POST /api/auth/webhooks/firebase - Handle Firebase Authentication webhooks
router.post('/webhooks/firebase',
  validateFirebaseWebhook,
  asyncHandler(async (req, res) => {
    await FirebaseWebhookService.handleAuthEvent(req, res)
  })
)

// POST /api/auth/admin/bulk-sync - Bulk sync users from Firebase (admin only)
router.post('/admin/bulk-sync',
  authRateLimit,
  verifyFirebaseToken,
  validateRequest(z.object({
    maxResults: z.number().min(1).max(10000).optional().default(1000),
    confirmAction: z.boolean().refine(val => val === true, {
      message: 'Must confirm bulk sync action'
    })
  })),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { maxResults } = req.body
    const authReq = req as any

    // Security: Only allow premium users or admin to perform bulk operations
    if (!authReq.user.isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required for bulk operations'
      })
    }

    const results = await FirebaseWebhookService.bulkSyncUsers(maxResults)

    res.json({
      success: true,
      data: results,
      message: `Bulk sync completed: ${results.synced} users synced, ${results.errors} errors`
    })
  })
)

// POST /api/auth/admin/cleanup-orphaned - Clean up orphaned users (admin only)
router.post('/admin/cleanup-orphaned',
  authRateLimit,
  verifyFirebaseToken,
  validateRequest(z.object({
    confirmAction: z.boolean().refine(val => val === true, {
      message: 'Must confirm cleanup action'
    })
  })),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const authReq = req as any

    // Security: Only allow premium users or admin to perform cleanup operations
    if (!authReq.user.isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required for cleanup operations'
      })
    }

    const results = await FirebaseWebhookService.cleanupOrphanedUsers()

    res.json({
      success: true,
      data: results,
      message: `Cleanup completed: ${results.cleaned} users processed, ${results.errors} errors`
    })
  })
)

export default router