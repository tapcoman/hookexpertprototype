// Simple authentication API client
import { api } from './api'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  subscriptionStatus: string
  isPremium: boolean
}

export interface AuthResult {
  user: AuthUser
  token: string
  isNewUser?: boolean
}

export interface AuthError extends Error {
  errorCode?: string
  userMessage?: string
  canRetry?: boolean
  actionRequired?: string[]
}

// ==================== AUTHENTICATION FUNCTIONS ====================

export const simpleAuth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> => {
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed')
      }

      return response.data.data.user
    } catch (error: any) {
      console.error('Simple auth sign up error:', error)
      
      // Create a proper AuthError
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Registration failed'
      ) as AuthError
      
      authError.errorCode = error.response?.data?.errorCode
      authError.userMessage = error.response?.data?.userMessage
      authError.canRetry = error.response?.data?.canRetry
      authError.actionRequired = error.response?.data?.actionRequired
      
      throw authError
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<AuthUser> => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Login failed')
      }

      return response.data.data.user
    } catch (error: any) {
      console.error('Simple auth sign in error:', error)
      
      // Create a proper AuthError
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Login failed'
      ) as AuthError
      
      authError.errorCode = error.response?.data?.errorCode
      authError.userMessage = error.response?.data?.userMessage
      authError.canRetry = error.response?.data?.canRetry
      authError.actionRequired = error.response?.data?.actionRequired
      
      throw authError
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout')
    } catch (error: any) {
      console.error('Simple auth sign out error:', error)
      // Don't throw error for logout failures - we'll clear local state anyway
    }
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await api.post('/api/auth/update-password', {
        currentPassword,
        newPassword
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Password update failed')
      }
    } catch (error: any) {
      console.error('Simple auth update password error:', error)
      
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Password update failed'
      ) as AuthError
      
      authError.errorCode = error.response?.data?.errorCode
      authError.userMessage = error.response?.data?.userMessage
      authError.canRetry = error.response?.data?.canRetry
      authError.actionRequired = error.response?.data?.actionRequired
      
      throw authError
    }
  },

  // Get current user token (from localStorage)
  getCurrentUserToken: (): string | null => {
    return localStorage.getItem('auth_token')
  },

  // Get authentication status
  getAuthStatus: async (): Promise<{ isAuthenticated: boolean; user?: AuthUser }> => {
    try {
      const response = await api.get('/api/auth/status')
      return response.data.data
    } catch (error: any) {
      console.error('Auth status check error:', error)
      return { isAuthenticated: false }
    }
  },

  // Verify current token
  verifyToken: async (): Promise<{ user: AuthUser; isAuthenticated: boolean }> => {
    try {
      const response = await api.get('/api/auth/verify')
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Token verification failed')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Token verification error:', error)
      
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Token verification failed'
      ) as AuthError
      
      authError.errorCode = error.response?.data?.errorCode
      authError.userMessage = error.response?.data?.userMessage
      authError.canRetry = error.response?.data?.canRetry
      authError.actionRequired = error.response?.data?.actionRequired
      
      throw authError
    }
  }
}

// ==================== ERROR HANDLING ====================

export function isAuthError(error: any): error is AuthError {
  return error && typeof error === 'object' && 'errorCode' in error
}

export function getAuthErrorMessage(error: any): string {
  if (isAuthError(error) && error.userMessage) {
    return error.userMessage
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An authentication error occurred. Please try again.'
}

// ==================== UTILITY FUNCTIONS ====================

export const formatSimpleAuthUser = (user: AuthUser) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  subscriptionStatus: user.subscriptionStatus,
  isPremium: user.isPremium
})

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export simple auth as default
export default simpleAuth