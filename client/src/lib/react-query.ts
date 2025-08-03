import { QueryClient } from '@tanstack/react-query'

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 2 times for server errors
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
})

// Query keys factory for consistency
export const queryKeys = {
  // User queries
  user: ['user'] as const,
  userProfile: () => [...queryKeys.user, 'profile'] as const,
  userUsage: () => [...queryKeys.user, 'usage'] as const,
  userSubscription: () => [...queryKeys.user, 'subscription'] as const,
  
  // Hook queries
  hooks: ['hooks'] as const,
  hookGeneration: (id: string) => [...queryKeys.hooks, 'generation', id] as const,
  hookHistory: (filters?: Record<string, any>) => [...queryKeys.hooks, 'history', filters] as const,
  hookFavorites: () => [...queryKeys.hooks, 'favorites'] as const,
  
  // Analytics queries
  analytics: ['analytics'] as const,
  analyticsOverview: (period: string) => [...queryKeys.analytics, 'overview', period] as const,
  analyticsUsage: (period: string) => [...queryKeys.analytics, 'usage', period] as const,
  
  // Payment queries
  payments: ['payments'] as const,
  paymentHistory: () => [...queryKeys.payments, 'history'] as const,
  subscriptionPlans: () => [...queryKeys.payments, 'plans'] as const,
  billingPortal: () => [...queryKeys.payments, 'portal'] as const,
} as const

// Error handling utilities
export const handleQueryError = (error: any) => {
  console.error('Query error:', error)
  
  // Handle different error types
  if (error?.status === 401) {
    // Handle unauthorized - redirect to login
    window.location.href = '/auth'
    return
  }
  
  if (error?.status === 403) {
    // Handle forbidden - show upgrade prompt
    return 'Access denied. Please check your subscription.'
  }
  
  if (error?.status >= 500) {
    return 'Server error. Please try again later.'
  }
  
  return error?.message || 'An unexpected error occurred'
}

// Mutation error handling
export const handleMutationError = (error: any) => {
  console.error('Mutation error:', error)
  
  if (error?.status === 401) {
    window.location.href = '/auth'
    return
  }
  
  if (error?.status === 402) {
    return 'Payment required. Please upgrade your subscription.'
  }
  
  if (error?.status === 403) {
    return 'Access denied. Please check your permissions.'
  }
  
  if (error?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  if (error?.status >= 500) {
    return 'Server error. Please try again later.'
  }
  
  return error?.message || 'An unexpected error occurred'
}

// Query invalidation helpers
export const invalidateUserQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.user })
}

export const invalidateHookQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.hooks })
}

export const invalidatePaymentQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.payments })
}