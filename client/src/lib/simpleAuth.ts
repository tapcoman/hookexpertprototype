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

// Re-export AuthError from auth-errors for backward compatibility
export type { AuthError, AuthErrorType } from './auth-errors'

// ==================== AUTHENTICATION FUNCTIONS ====================

export const simpleAuth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> => {
    try {
      const response = await api.auth.register({
        email,
        password,
        firstName,
        lastName
      })

      if (!response.success) {
        throw new Error(response.error || 'Registration failed')
      }

      return response.data?.user as AuthUser
    } catch (error: any) {
      console.error('Simple auth sign up error:', error)
      
      // Create a proper Error with additional properties
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Registration failed'
      )
      
      // Add custom properties for compatibility
      ;(authError as any).errorCode = error.response?.data?.errorCode
      ;(authError as any).userMessage = error.response?.data?.userMessage
      ;(authError as any).canRetry = error.response?.data?.canRetry
      ;(authError as any).actionRequired = error.response?.data?.actionRequired
      
      throw authError
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<AuthUser> => {
    try {
      const response = await api.auth.login({
        email,
        password
      })

      if (!response.success) {
        throw new Error(response.error || 'Login failed')
      }

      return response.data?.user as AuthUser
    } catch (error: any) {
      console.error('Simple auth sign in error:', error)
      
      // Create a proper Error with additional properties
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Login failed'
      )
      
      // Add custom properties for compatibility
      ;(authError as any).errorCode = error.response?.data?.errorCode
      ;(authError as any).userMessage = error.response?.data?.userMessage
      ;(authError as any).canRetry = error.response?.data?.canRetry
      ;(authError as any).actionRequired = error.response?.data?.actionRequired
      
      throw authError
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    try {
      await api.auth.signOut()
    } catch (error: any) {
      console.error('Simple auth sign out error:', error)
      // Don't throw error for logout failures - we'll clear local state anyway
    }
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const response = await api.auth.updatePassword({
        currentPassword,
        newPassword
      })

      if (!response.success) {
        throw new Error(response.error || 'Password update failed')
      }
    } catch (error: any) {
      console.error('Simple auth update password error:', error)
      
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Password update failed'
      )
      
      // Add custom properties for compatibility
      ;(authError as any).errorCode = error.response?.data?.errorCode
      ;(authError as any).userMessage = error.response?.data?.userMessage
      ;(authError as any).canRetry = error.response?.data?.canRetry
      ;(authError as any).actionRequired = error.response?.data?.actionRequired
      
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
      const response = await api.auth.checkStatus()
      return response.data || { isAuthenticated: false }
    } catch (error: any) {
      console.error('Auth status check error:', error)
      return { isAuthenticated: false }
    }
  },

  // Verify current token
  verifyToken: async (): Promise<{ user: AuthUser; isAuthenticated: boolean }> => {
    try {
      const response = await api.auth.verifyToken()
      
      if (!response.success) {
        throw new Error(response.error || 'Token verification failed')
      }

      return response.data || { user: {} as AuthUser, isAuthenticated: false }
    } catch (error: any) {
      console.error('Token verification error:', error)
      
      const authError = new Error(
        error.response?.data?.userMessage || 
        error.response?.data?.error || 
        error.message || 
        'Token verification failed'
      )
      
      // Add custom properties for compatibility
      ;(authError as any).errorCode = error.response?.data?.errorCode
      ;(authError as any).userMessage = error.response?.data?.userMessage
      ;(authError as any).canRetry = error.response?.data?.canRetry
      ;(authError as any).actionRequired = error.response?.data?.actionRequired
      
      throw authError
    }
  }
}

// ==================== ERROR HANDLING ====================

export function isAuthError(error: any): error is any {
  return error && typeof error === 'object' && ('errorCode' in error || 'type' in error)
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