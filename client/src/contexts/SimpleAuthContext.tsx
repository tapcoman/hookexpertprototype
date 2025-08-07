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
  handleOnboardingComplete: () => Promise<void>
  
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
      console.log('[SimpleAuthContext] Fetching user profile...')
      const response = await authApi.verifyToken()
      const user = response.data?.user
      
      if (!user) {
        console.error('[SimpleAuthContext] No user data received from server')
        throw new Error('No user data received from server')
      }
      
      console.log('[SimpleAuthContext] User profile fetched:', {
        userId: user.id,
        email: user.email,
        hasCompany: Boolean(user.company),
        hasIndustry: Boolean(user.industry),
        hasRole: Boolean(user.role),
        onboardingComplete: Boolean(user.company && user.industry && user.role)
      })
      
      return user as UserProfile
    },
    enabled: !!simpleAuth.getCurrentUserToken() && !error,
    retry: (failureCount, error: any) => {
      console.log(`[SimpleAuthContext] User query retry attempt ${failureCount + 1}:`, error)
      
      // Don't retry on authentication errors
      if (error?.response?.data?.errorCode === 'TOKEN_EXPIRED' || 
          error?.response?.data?.errorCode === 'TOKEN_INVALID' ||
          error?.response?.data?.errorCode === 'TOKEN_REVOKED') {
        console.log('[SimpleAuthContext] Not retrying due to auth error')
        return false
      }
      
      // Retry on network/server errors up to 3 times
      const shouldRetry = failureCount < 3 && (
        error?.response?.status >= 500 ||
        error?.code === 'NETWORK_ERROR'
      )
      
      console.log(`[SimpleAuthContext] Should retry: ${shouldRetry}`)
      return shouldRetry
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 10000)
      console.log(`[SimpleAuthContext] Retry delay: ${delay}ms`)
      return delay
    },
    // Note: onError is handled via useEffect below for React Query v4+
    // The error is captured via userQueryError
  })

  // Monitor user query errors and update auth error state
  useEffect(() => {
    if (userQueryError && !error) {
      console.error('[SimpleAuthContext] User profile query error:', userQueryError)
      handleAuthError(userQueryError, 'user_profile_query')
    }
  }, [userQueryError, error])

  // Log user state changes for debugging
  useEffect(() => {
    if (user) {
      console.log('[SimpleAuthContext] User context updated:', {
        userId: user.id,
        email: user.email,
        hasCompany: Boolean(user.company),
        hasIndustry: Boolean(user.industry),
        hasRole: Boolean(user.role),
        onboardingComplete: Boolean(user.company && user.industry && user.role),
        company: user.company || 'not set',
        industry: user.industry || 'not set',
        role: user.role || 'not set'
      })
    } else {
      console.log('[SimpleAuthContext] User context cleared')
    }
  }, [user])

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
      console.log('[SimpleAuthContext] Sign in successful:', {
        userId: user.id,
        email: user.email,
        hasCompany: Boolean(user.company),
        hasIndustry: Boolean(user.industry),
        hasRole: Boolean(user.role)
      })
      
      analytics.track('user_sign_in', { method: 'email' })
      analytics.init(user.id, 'analytics')
      setError(null)
      
      // Invalidate and trigger user profile refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
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
      console.log('[SimpleAuthContext] Sign up successful:', {
        userId: user.id,
        email: user.email,
        hasCompany: Boolean(user.company),
        hasIndustry: Boolean(user.industry),
        hasRole: Boolean(user.role)
      })
      
      analytics.track('user_sign_up', { method: 'email' })
      analytics.init(user.id, 'analytics')
      setError(null)
      
      // Invalidate and trigger user profile refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
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
      console.log('[SimpleAuthContext] Starting profile update:', { 
        updates: Object.keys(data),
        hasCompany: Boolean(data.company),
        hasIndustry: Boolean(data.industry),
        hasRole: Boolean(data.role)
      })
      const response = await api.user.updateProfile(data)
      return response.data
    },
    onSuccess: (updatedUser) => {
      console.log('[SimpleAuthContext] Profile update successful:', {
        userId: updatedUser?.id,
        hasCompany: Boolean(updatedUser?.company),
        hasIndustry: Boolean(updatedUser?.industry),
        hasRole: Boolean(updatedUser?.role),
        updatedFields: updatedUser ? Object.keys(updatedUser).filter(key => 
          ['company', 'industry', 'role'].includes(key) && updatedUser[key as keyof UserProfile]
        ) : []
      })
      
      if (updatedUser) {
        // Update the cached user data
        queryClient.setQueryData(queryKeys.userProfile(), updatedUser)
        
        // Track analytics for profile completion
        analytics.track('profile_updated', {
          hasCompany: Boolean(updatedUser.company),
          hasIndustry: Boolean(updatedUser.industry),
          hasRole: Boolean(updatedUser.role)
        })
      }
      setError(null)
    },
    onError: (error: any) => {
      console.error('[SimpleAuthContext] Profile update failed:', error)
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

  const refreshUser = async (): Promise<void> => {
    console.log('[SimpleAuthContext] Refreshing user profile...')
    console.log('[SimpleAuthContext] Current user before refresh:', {
      userId: user?.id,
      hasCompany: Boolean(user?.company),
      hasIndustry: Boolean(user?.industry),
      hasRole: Boolean(user?.role),
      company: user?.company || 'not set',
      industry: user?.industry || 'not set', 
      role: user?.role || 'not set'
    })
    
    try {
      // Force clear cache first
      queryClient.removeQueries({ queryKey: queryKeys.userProfile() })
      console.log('[SimpleAuthContext] Cache cleared, invalidating queries...')
      
      // Invalidate and refetch user profile
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
      console.log('[SimpleAuthContext] Queries invalidated, refetching...')
      
      const result = await refetchUser()
      
      console.log('[SimpleAuthContext] User profile refreshed:', {
        success: Boolean(result.data),
        userId: result.data?.id,
        hasCompany: Boolean(result.data?.company),
        hasIndustry: Boolean(result.data?.industry),
        hasRole: Boolean(result.data?.role),
        company: result.data?.company || 'not set',
        industry: result.data?.industry || 'not set',
        role: result.data?.role || 'not set',
        onboardingComplete: Boolean(result.data?.company && result.data?.industry && result.data?.role)
      })
      
      // Additional verification - check if the data actually changed in context
      setTimeout(() => {
        console.log('[SimpleAuthContext] Final user context after refresh:', {
          userId: user?.id,
          hasCompany: Boolean(user?.company),
          hasIndustry: Boolean(user?.industry),
          hasRole: Boolean(user?.role),
          company: user?.company || 'not set',
          industry: user?.industry || 'not set',
          role: user?.role || 'not set',
          onboardingComplete: Boolean(user?.company && user?.industry && user?.role)
        })
      }, 100)
      
      return Promise.resolve()
    } catch (error) {
      console.error('[SimpleAuthContext] Failed to refresh user profile:', error)
      throw error
    }
  }

  const retryAuth = async (): Promise<void> => {
    const token = simpleAuth.getCurrentUserToken()
    if (!token) {
      console.log('[SimpleAuthContext] No token available for retry')
      return
    }
    
    console.log('[SimpleAuthContext] Retrying authentication...')
    
    try {
      setIsRetrying(true)
      setError(null)
      
      // Retry token verification
      const result = await simpleAuth.verifyToken()
      
      if (result.isAuthenticated) {
        console.log('[SimpleAuthContext] Token verification successful, refreshing user profile')
        
        // Invalidate cache and retry user profile fetch
        await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
        await refetchUser()
        
        console.log('[SimpleAuthContext] Auth retry completed successfully')
      } else {
        console.warn('[SimpleAuthContext] Token verification failed during retry')
      }
    } catch (error: any) {
      console.error('[SimpleAuthContext] Auth retry failed:', error)
      handleAuthError(error, 'auth_retry')
    } finally {
      setIsRetrying(false)
    }
  }

  const handleOnboardingComplete = async (): Promise<void> => {
    console.log('[SimpleAuthContext] Handling onboarding completion...')
    
    try {
      // Force invalidate and refetch user profile to get updated onboarding fields
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
      const result = await refetchUser()
      
      console.log('[SimpleAuthContext] Onboarding complete - user profile updated:', {
        success: Boolean(result.data),
        userId: result.data?.id,
        hasCompany: Boolean(result.data?.company),
        hasIndustry: Boolean(result.data?.industry),
        hasRole: Boolean(result.data?.role),
        onboardingComplete: Boolean(
          result.data?.company && result.data?.industry && result.data?.role
        )
      })
      
      // Track onboarding completion
      analytics.track('onboarding_completed', {
        company: result.data?.company || 'unknown',
        industry: result.data?.industry || 'unknown',
        role: result.data?.role || 'unknown'
      })
      
      return Promise.resolve()
    } catch (error) {
      console.error('[SimpleAuthContext] Failed to handle onboarding completion:', error)
      throw error
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
    handleOnboardingComplete,

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
    handleOnboardingComplete,
    clearError,
  } = useAuth()
  
  return {
    signIn,
    signUp,
    signOut,
    updatePassword,
    updateProfile,
    refreshUser,
    handleOnboardingComplete,
    clearError,
  }
}

// Custom hook for auth utilities
export const useAuthUtils = () => {
  const { canGenerateHooks, hasActiveSubscription } = useAuth()
  return { canGenerateHooks, hasActiveSubscription }
}