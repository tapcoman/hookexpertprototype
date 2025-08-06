import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { simpleAuth, AuthError, isAuthError, getAuthErrorMessage } from '@/lib/simpleAuth'
import { api, authApi, setAuthToken } from '@/lib/api'
import { queryKeys } from '@/lib/react-query'
import { analytics } from '@/lib/analytics'
import type { UserProfile } from '@/types/shared'

// ==================== TYPES ====================

interface AuthState {
  // Current user
  user: UserProfile | null
  // Loading states
  isLoading: boolean
  isInitializing: boolean
  isRetrying: boolean
  // Enhanced error state
  error: AuthError | null
  // Connection status
  isOnline: boolean
}

interface AuthContextValue extends AuthState {
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  
  // User profile methods
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  refreshUser: () => Promise<void>
  
  // Utility methods
  clearError: () => void
  retryAuth: () => Promise<void>
  canGenerateHooks: () => boolean
  hasActiveSubscription: () => boolean
  
  // Error helpers
  getErrorMessage: () => string
  getRecoverySteps: () => string[]
}

// ==================== CONTEXT ====================

const SimpleAuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(SimpleAuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider')
  }
  return context
}

// ==================== PROVIDER ====================

interface SimpleAuthProviderProps {
  children: ReactNode
}

export const SimpleAuthProvider: React.FC<SimpleAuthProviderProps> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  const queryClient = useQueryClient()

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ==================== INITIALIZATION ====================

  const handleAuthError = (error: any, context: string) => {
    const authError = isAuthError(error) ? error : new Error(getAuthErrorMessage(error))
    ;(authError as any).errorCode = error.response?.data?.errorCode || error.errorCode || 'AUTH_ERROR'
    ;(authError as any).userMessage = error.response?.data?.userMessage || error.userMessage || authError.message
    ;(authError as any).canRetry = error.response?.data?.canRetry ?? error.canRetry ?? true
    ;(authError as any).actionRequired = error.response?.data?.actionRequired || error.actionRequired || ['Try again']
    
    console.error(`Auth error in ${context}:`, authError)
    setError(authError)
    
    // Clear auth token on authentication errors that require sign in
    const errorCode = (authError as any).errorCode
    if (errorCode === 'TOKEN_EXPIRED' || 
        errorCode === 'TOKEN_INVALID' ||
        errorCode === 'TOKEN_REVOKED') {
      setAuthToken(null)
    }
  }

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = simpleAuth.getCurrentUserToken()
        if (token) {
          setAuthToken(token)
          
          // Verify token is still valid
          const result = await simpleAuth.verifyToken()
          if (result.isAuthenticated && result.user) {
            // Initialize analytics with user ID
            analytics.init(result.user.id, 'analytics')
            setError(null)
          }
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error)
        // Clear invalid token
        setAuthToken(null)
        handleAuthError(error, 'initialization')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeAuth()
  }, [])

  // ==================== USER PROFILE QUERY ====================

  const {
    data: user,
    isLoading: isLoadingUser,
    refetch: refetchUser,
    error: userQueryError,
  } = useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: async () => {
      const response = await authApi.verifyToken()
      const user = response.data?.user
      if (!user) {
        throw new Error('No user data received from server')
      }
      return user as UserProfile
    },
    enabled: !!simpleAuth.getCurrentUserToken() && !error,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.data?.errorCode === 'TOKEN_EXPIRED' || 
          error?.response?.data?.errorCode === 'TOKEN_INVALID' ||
          error?.response?.data?.errorCode === 'TOKEN_REVOKED') {
        return false
      }
      // Retry on network/server errors up to 3 times
      return failureCount < 3 && (
        error?.response?.status >= 500 ||
        error?.code === 'NETWORK_ERROR'
      )
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Note: onError is handled via useEffect below for React Query v4+
    // The error is captured via userQueryError
  })

  // Monitor user query errors and update auth error state
  useEffect(() => {
    if (userQueryError && !error) {
      handleAuthError(userQueryError, 'user_profile_query')
    }
  }, [userQueryError, error])

  // ==================== AUTHENTICATION MUTATIONS ====================

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authApi.login({ email, password })
      const { user, token } = response.data || {}
      
      if (!user || !token) {
        throw new Error('Invalid response from authentication service')
      }
      
      // Set token for future requests
      setAuthToken(token)
      
      return user
    },
    onSuccess: (user: UserProfile) => {
      analytics.track('user_sign_in', { method: 'email' })
      analytics.init(user.id, 'analytics')
      setError(null)
      
      // Trigger user profile refetch
      refetchUser()
    },
    onError: (error: any) => {
      analytics.track('user_sign_in_failed', { method: 'email', error: error.message })
      handleAuthError(error, 'email_sign_in')
    },
  })

  const signUpMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      firstName, 
      lastName 
    }: { 
      email: string
      password: string
      firstName: string
      lastName: string
    }) => {
      const response = await authApi.register({ email, password, firstName, lastName })
      const { user, token } = response.data || {}
      
      if (!user || !token) {
        throw new Error('Invalid response from authentication service')
      }
      
      // Set token for future requests
      setAuthToken(token)
      
      return user
    },
    onSuccess: (user: UserProfile) => {
      analytics.track('user_sign_up', { method: 'email' })
      analytics.init(user.id, 'analytics')
      setError(null)
      
      // Trigger user profile refetch
      refetchUser()
    },
    onError: (error: any) => {
      analytics.track('user_sign_up_failed', { method: 'email', error: error.message })
      handleAuthError(error, 'email_sign_up')
    },
  })

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await simpleAuth.signOut()
    },
    onSuccess: () => {
      analytics.track('user_sign_out')
      // Clear auth token
      setAuthToken(null)
      // Clear all cached data
      queryClient.clear()
      setError(null)
    },
    onError: (error: any) => {
      // Still clear local state even if server call fails
      setAuthToken(null)
      queryClient.clear()
      handleAuthError(error, 'sign_out')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { 
      currentPassword: string
      newPassword: string
    }) => {
      await simpleAuth.updatePassword(currentPassword, newPassword)
    },
    onSuccess: () => {
      setError(null)
    },
    onError: (error: any) => {
      handleAuthError(error, 'password_update')
    },
  })

  // ==================== USER PROFILE MUTATIONS ====================

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.user.updateProfile(data)
      return response.data
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        // Update the cached user data
        queryClient.setQueryData(queryKeys.userProfile(), updatedUser)
      }
      setError(null)
    },
    onError: (error: any) => {
      handleAuthError(error, 'profile_update')
    },
  })

  // ==================== UTILITY METHODS ====================

  const canGenerateHooks = (): boolean => {
    if (!user) return false
    
    // Check if user has remaining credits or active subscription
    const userTyped = user as any
    const hasCredits = (userTyped.freeCredits || 0) > (userTyped.usedCredits || 0)
    const hasActiveSubscription = userTyped.subscriptionStatus === 'active' || userTyped.subscriptionStatus === 'trialing'
    
    return hasCredits || hasActiveSubscription
  }

  const hasActiveSubscription = (): boolean => {
    if (!user) return false
    const userTyped = user as any
    return userTyped.subscriptionStatus === 'active' || userTyped.subscriptionStatus === 'trialing'
  }

  const clearError = () => {
    setError(null)
  }

  const refreshUser = async () => {
    await refetchUser()
  }

  const retryAuth = async () => {
    const token = simpleAuth.getCurrentUserToken()
    if (!token) return
    
    try {
      setIsRetrying(true)
      setError(null)
      
      // Retry token verification
      const result = await simpleAuth.verifyToken()
      
      if (result.isAuthenticated) {
        // Retry user profile fetch
        await refetchUser()
      }
    } catch (error: any) {
      handleAuthError(error, 'auth_retry')
    } finally {
      setIsRetrying(false)
    }
  }

  // ==================== ERROR HELPER METHODS ====================

  const getErrorMessage = (): string => {
    if (!error) return ''
    
    // Show offline message if user is offline
    if (!isOnline) {
      return 'You appear to be offline. Please check your internet connection.'
    }
    
    return error.userMessage || error.message
  }

  const getRecoverySteps = (): string[] => {
    if (!error) return []
    
    // Add offline-specific steps
    if (!isOnline) {
      return [
        'Check your internet connection',
        'Try switching between WiFi and mobile data',
        'Refresh the page once you\'re back online'
      ]
    }
    
    return error.actionRequired || ['Try again', 'Contact support if the issue persists']
  }

  // ==================== CONTEXT VALUE ====================

  const contextValue: AuthContextValue = {
    // State
    user: user || null,
    isLoading: isLoadingUser || isRetrying,
    isInitializing,
    isRetrying,
    error,
    isOnline,

    // Authentication methods
    signIn: async (email: string, password: string) => {
      await signInMutation.mutateAsync({ email, password })
    },
    signUp: async (email: string, password: string, firstName: string, lastName: string) => {
      await signUpMutation.mutateAsync({ email, password, firstName, lastName })
    },
    signOut: async () => {
      await signOutMutation.mutateAsync()
    },
    updatePassword: async (currentPassword: string, newPassword: string) => {
      await updatePasswordMutation.mutateAsync({ currentPassword, newPassword })
    },

    // User profile methods
    updateProfile: async (data: Partial<UserProfile>) => {
      await updateProfileMutation.mutateAsync(data)
    },
    refreshUser,

    // Utility methods
    clearError,
    retryAuth,
    canGenerateHooks,
    hasActiveSubscription,
    
    // Error helpers
    getErrorMessage,
    getRecoverySteps,
  }

  return (
    <SimpleAuthContext.Provider value={contextValue}>
      {children}
    </SimpleAuthContext.Provider>
  )
}

// ==================== HOOKS ====================

// Custom hook for accessing auth state only
export const useAuthState = () => {
  const { user, isLoading, isInitializing, error } = useAuth()
  return { user, isLoading, isInitializing, error }
}

// Custom hook for auth actions only
export const useAuthActions = () => {
  const {
    signIn,
    signUp,
    signOut,
    updatePassword,
    updateProfile,
    refreshUser,
    clearError,
  } = useAuth()
  
  return {
    signIn,
    signUp,
    signOut,
    updatePassword,
    updateProfile,
    refreshUser,
    clearError,
  }
}

// Custom hook for auth utilities
export const useAuthUtils = () => {
  const { canGenerateHooks, hasActiveSubscription } = useAuth()
  return { canGenerateHooks, hasActiveSubscription }
}