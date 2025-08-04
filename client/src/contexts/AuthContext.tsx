import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { firebaseAuth } from '@/lib/firebase'
import { api, setAuthToken } from '@/lib/api'
import { queryKeys } from '@/lib/react-query'
import { analytics } from '@/lib/analytics'
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
  // Error state
  error: string | null
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
  canGenerateHooks: () => boolean
  hasActiveSubscription: () => boolean
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
  const [error, setError] = useState<string | null>(null)
  
  const queryClient = useQueryClient()

  // ==================== FIREBASE AUTH STATE ====================

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user)
      
      if (user) {
        try {
          // Get Firebase token and verify with backend
          const firebaseToken = await user.getIdToken()
          const response = await api.auth.verifyToken(firebaseToken)
          
          // Set auth token for API calls
          setAuthToken(response.data?.token || null)
          
          // Initialize analytics with user ID
          analytics.init(user.uid, 'analytics')
          
          // Clear any previous errors
          setError(null)
        } catch (error: any) {
          console.error('Failed to verify token:', error)
          setError('Authentication failed. Please sign in again.')
          setAuthToken(null)
        }
      } else {
        // Clear auth token when signed out
        setAuthToken(null)
        // Clear all cached data
        queryClient.clear()
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
  } = useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: async () => {
      const response = await api.user.getProfile()
      return response.data
    },
    enabled: !!firebaseUser && !error,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401) return false
      return failureCount < 3
    },
  })

  // ==================== AUTHENTICATION MUTATIONS ====================

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const user = await firebaseAuth.signIn(email, password)
      return user
    },
    onSuccess: () => {
      analytics.track('user_sign_in', { method: 'email' })
    },
    onError: (error: any) => {
      analytics.track('user_sign_in_failed', { method: 'email', error: error.message })
      setError(error.message)
    },
  })

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const user = await firebaseAuth.signUp(email, password)
      return user
    },
    onSuccess: () => {
      analytics.track('user_sign_up', { method: 'email' })
    },
    onError: (error: any) => {
      analytics.track('user_sign_up_failed', { method: 'email', error: error.message })
      setError(error.message)
    },
  })

  const signInWithGoogleMutation = useMutation({
    mutationFn: async () => {
      const user = await firebaseAuth.signInWithGoogle()
      return user
    },
    onSuccess: () => {
      analytics.track('user_sign_in', { method: 'google' })
    },
    onError: (error: any) => {
      analytics.track('user_sign_in_failed', { method: 'google', error: error.message })
      setError(error.message)
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
    },
    onError: (error: any) => {
      setError(error.message)
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      await firebaseAuth.resetPassword(email)
    },
    onError: (error: any) => {
      setError(error.message)
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { 
      currentPassword: string
      newPassword: string
    }) => {
      await firebaseAuth.updatePassword(currentPassword, newPassword)
    },
    onError: (error: any) => {
      setError(error.message)
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
    },
    onError: (error: any) => {
      setError(error.message)
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

  // ==================== CONTEXT VALUE ====================

  const contextValue: AuthContextValue = {
    // State
    firebaseUser,
    user: user || null,
    isLoading: isLoadingUser,
    isInitializing,
    error,

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
    canGenerateHooks,
    hasActiveSubscription,
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