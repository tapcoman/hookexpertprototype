import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { firebaseAuth } from '@/lib/firebase'
import { api, setAuthToken } from '@/lib/api'
import { queryKeys } from '@/lib/react-query'
import { analytics } from '@/lib/analytics'
import { 
  classifyAuthError, 
  AuthError, 
  AuthErrorType, 
  requiresSignIn,
  getRecoveryInstructions,
  logAuthError
} from '@/lib/auth-errors'
import type { UserProfile } from '@/types/shared'

// ==================== TYPES ====================

interface AuthState {
  // Firebase user
  firebaseUser: User | null
  // Backend user profile
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
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
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
  shouldShowSignIn: () => boolean
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ==================== PROVIDER ====================

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
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

  // ==================== FIREBASE AUTH STATE ====================

  const handleAuthError = (error: any, context: string) => {
    const classifiedError = classifyAuthError(error)
    logAuthError(classifiedError, { context, firebaseUser: firebaseUser?.uid })
    setError(classifiedError)
    
    // Clear auth token on authentication errors
    if (requiresSignIn(classifiedError)) {
      setAuthToken(null)
    }
  }

  const verifyUserToken = async (user: User) => {
    try {
      setIsRetrying(true)
      
      // Get Firebase token and verify with backend
      const firebaseToken = await user.getIdToken(true) // Force refresh
      await api.auth.verifyToken(firebaseToken)
      
      // Set Firebase token for API calls
      setAuthToken(firebaseToken)
      
      // Initialize analytics with user ID
      analytics.init(user.uid, 'analytics')
      
      // Clear any previous errors
      setError(null)
      return true
    } catch (error: any) {
      handleAuthError(error, 'token_verification')
      return false
    } finally {
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user)
      
      if (user) {
        await verifyUserToken(user)
      } else {
        // Clear auth token when signed out
        setAuthToken(null)
        // Clear all cached data
        queryClient.clear()
        // Clear errors when signing out
        setError(null)
      }
      
      setIsInitializing(false)
    })

    return unsubscribe
  }, [queryClient])

  // ==================== USER PROFILE QUERY ====================

  const {
    data: user,
    isLoading: isLoadingUser,
    refetch: refetchUser,
    error: userQueryError,
  } = useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: async () => {
      const response = await api.user.getProfile()
      return response.data
    },
    enabled: !!firebaseUser && !error,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.type === AuthErrorType.TOKEN_EXPIRED || 
          error?.type === AuthErrorType.TOKEN_INVALID ||
          error?.type === AuthErrorType.TOKEN_REVOKED) {
        return false
      }
      // Retry on network/server errors up to 3 times
      return failureCount < 3 && (
        error?.type === AuthErrorType.NETWORK_ERROR ||
        error?.type === AuthErrorType.SERVER_UNAVAILABLE ||
        error?.type === AuthErrorType.DATABASE_CONNECTION
      )
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onError: (error: any) => {
      // Handle user profile fetch errors
      if (error?.type && error?.userMessage) {
        handleAuthError(error, 'user_profile_fetch')
      } else {
        handleAuthError(error, 'user_profile_fetch')
      }
    },
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
      const user = await firebaseAuth.signIn(email, password)
      return user
    },
    onSuccess: () => {
      analytics.track('user_sign_in', { method: 'email' })
      setError(null) // Clear any previous errors on successful sign in
    },
    onError: (error: any) => {
      analytics.track('user_sign_in_failed', { method: 'email', error: error.message })
      handleAuthError(error, 'email_sign_in')
    },
  })

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const user = await firebaseAuth.signUp(email, password)
      return user
    },
    onSuccess: () => {
      analytics.track('user_sign_up', { method: 'email' })
      setError(null)
    },
    onError: (error: any) => {
      analytics.track('user_sign_up_failed', { method: 'email', error: error.message })
      handleAuthError(error, 'email_sign_up')
    },
  })

  const signInWithGoogleMutation = useMutation({
    mutationFn: async () => {
      const user = await firebaseAuth.signInWithGoogle()
      return user
    },
    onSuccess: () => {
      analytics.track('user_sign_in', { method: 'google' })
      setError(null)
    },
    onError: (error: any) => {
      analytics.track('user_sign_in_failed', { method: 'google', error: error.message })
      handleAuthError(error, 'google_sign_in')
    },
  })

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await firebaseAuth.signOut()
    },
    onSuccess: () => {
      analytics.track('user_sign_out')
      // Clear all cached data
      queryClient.clear()
      setError(null)
    },
    onError: (error: any) => {
      handleAuthError(error, 'sign_out')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      await firebaseAuth.resetPassword(email)
    },
    onSuccess: () => {
      setError(null)
    },
    onError: (error: any) => {
      handleAuthError(error, 'password_reset')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { 
      currentPassword: string
      newPassword: string
    }) => {
      await firebaseAuth.updatePassword(currentPassword, newPassword)
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
      // Update the cached user data
      queryClient.setQueryData(queryKeys.userProfile(), updatedUser)
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
    const hasCredits = user.freeCredits > user.usedCredits
    const hasActiveSubscription = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
    
    return hasCredits || hasActiveSubscription
  }

  const hasActiveSubscription = (): boolean => {
    if (!user) return false
    return user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
  }

  const clearError = () => {
    setError(null)
  }

  const refreshUser = async () => {
    await refetchUser()
  }

  const retryAuth = async () => {
    if (!firebaseUser) return
    
    try {
      setIsRetrying(true)
      setError(null)
      
      // Force refresh Firebase token and retry verification
      const success = await verifyUserToken(firebaseUser)
      
      if (success) {
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
    
    return error.userMessage
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
    
    return getRecoveryInstructions(error)
  }

  const shouldShowSignIn = (): boolean => {
    return !!error && requiresSignIn(error)
  }

  // ==================== CONTEXT VALUE ====================

  const contextValue: AuthContextValue = {
    // State
    firebaseUser,
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
    signUp: async (email: string, password: string) => {
      await signUpMutation.mutateAsync({ email, password })
    },
    signInWithGoogle: async () => {
      await signInWithGoogleMutation.mutateAsync()
    },
    signOut: async () => {
      await signOutMutation.mutateAsync()
    },
    resetPassword: async (email: string) => {
      await resetPasswordMutation.mutateAsync(email)
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
    shouldShowSignIn,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// ==================== HOOKS ====================

// Custom hook for accessing auth state only
export const useAuthState = () => {
  const { firebaseUser, user, isLoading, isInitializing, error } = useAuth()
  return { firebaseUser, user, isLoading, isInitializing, error }
}

// Custom hook for auth actions only
export const useAuthActions = () => {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUser,
    clearError,
  } = useAuth()
  
  return {
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
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