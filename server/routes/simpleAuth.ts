import { Router, Response } from 'express'
import { z } from 'zod'
import { SimpleAuthService } from '../services/simpleAuthService.js'
import { verifyJWTToken } from '../middleware/simpleAuth.js'
import { validateRequest } from '../middleware/validation.js'
import { authRateLimit } from '../middleware/rateLimiting.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { AuthenticationError, ValidationError } from '../middleware/errorHandler.js'
import { APIResponse } from '../../shared/types.js'

const router = Router()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50)
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password must be less than 128 characters')
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required')
})

// POST /api/auth/register - User registration with email/password
router.post('/register', 
  authRateLimit,
  validateRequest(registerSchema),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { email, password, firstName, lastName } = req.body
    const ipAddress = req.ip || 'unknown'

    // Validate password strength
    const passwordValidation = SimpleAuthService.validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        errorCode: 'WEAK_PASSWORD',
        userMessage: passwordValidation.errors.join('. '),
        canRetry: true,
        actionRequired: ['Use a stronger password']
      })
    }

    try {
      const authResult = await SimpleAuthService.register(
        { email, password, firstName, lastName },
        ipAddress
      )

      res.status(201).json({
        success: true,
        data: authResult,
        message: 'User registered successfully'
      })

    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(409).json({
          success: false,
          error: error.message,
          errorCode: 'EMAIL_EXISTS',
          userMessage: 'An account with this email already exists.',
          canRetry: false,
          actionRequired: ['Sign in instead', 'Use a different email address', 'Reset your password if you forgot it']
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
    const { email, password } = req.body
    const ipAddress = req.ip || 'unknown'

    const authResult = await SimpleAuthService.login({ email, password }, ipAddress)

    res.json({
      success: true,
      data: authResult,
      message: 'Login successful'
    })
  })
)

// GET /api/auth/verify - Verify current authentication status
router.get('/verify',
  verifyJWTToken,
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

// POST /api/auth/logout - Logout user (mainly for logging purposes)
router.post('/logout',
  verifyJWTToken,
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const authReq = req as any
    const ipAddress = req.ip || 'unknown'

    await SimpleAuthService.logout(authReq.user.id, ipAddress)

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  })
)

// POST /api/auth/update-password - Update user password
router.post('/update-password',
  authRateLimit,
  verifyJWTToken,
  validateRequest(updatePasswordSchema),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { currentPassword, newPassword } = req.body
    const authReq = req as any

    // Validate new password strength
    const passwordValidation = SimpleAuthService.validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        errorCode: 'WEAK_PASSWORD',
        userMessage: passwordValidation.errors.join('. '),
        canRetry: true,
        actionRequired: ['Use a stronger password']
      })
    }

    await SimpleAuthService.updatePassword(authReq.user.id, currentPassword, newPassword)

    res.json({
      success: true,
      message: 'Password updated successfully'
    })
  })
)

// DELETE /api/auth/account - Delete user account (GDPR compliance)
router.delete('/account',
  authRateLimit,
  verifyJWTToken,
  validateRequest(z.object({
    confirmEmail: z.string().email('Valid email required for confirmation')
  })),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { confirmEmail } = req.body
    const authReq = req as any
    
    // Security: Ensure email matches current user
    if (confirmEmail !== authReq.user.email) {
      return res.status(400).json({
        success: false,
        error: 'Email confirmation does not match current user',
        errorCode: 'EMAIL_MISMATCH',
        userMessage: 'Please enter your current email address to confirm account deletion.',
        canRetry: true,
        actionRequired: ['Enter your correct email address']
      })
    }

    await SimpleAuthService.deleteAccount(authReq.user.id)

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

    const status = await SimpleAuthService.getAuthStatus(token)

    res.json({
      success: true,
      data: status,
      message: status.isAuthenticated ? 'User is authenticated' : 'User is not authenticated'
    })
  })
)

// POST /api/auth/forgot-password - Initiate password reset (placeholder for future implementation)
router.post('/forgot-password',
  authRateLimit,
  validateRequest(forgotPasswordSchema),
  asyncHandler(async (req, res: Response<APIResponse>) => {
    const { email } = req.body

    // TODO: Implement email-based password reset
    // For now, return a message indicating this feature is not yet available
    
    res.json({
      success: false,
      error: 'Password reset not yet implemented',
      errorCode: 'FEATURE_NOT_AVAILABLE',
      userMessage: 'Password reset via email is not yet available. Please contact support for assistance.',
      canRetry: false,
      actionRequired: ['Contact support for password reset']
    })
  })
)

export default router