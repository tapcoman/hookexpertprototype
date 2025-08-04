import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys, handleMutationError } from '@/lib/react-query'
import { useNotifications } from '@/contexts/AppContext'
import type {
  GenerateHooksRequest,
  OnboardingData,
  UserProfile,
  CreateCheckoutSession,
  BillingPortalSession
} from '@/types/shared'

// ==================== USER QUERIES ====================

export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: async () => {
      const response = await api.user.getProfile()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false
      return failureCount < 3
    },
  })
}

export const useUserUsage = () => {
  return useQuery({
    queryKey: queryKeys.userUsage(),
    queryFn: async () => {
      const response = await api.user.getUsage()
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useUserSubscription = () => {
  return useQuery({
    queryKey: queryKeys.userSubscription(),
    queryFn: async () => {
      const response = await api.payments.getSubscriptionOverview()
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ==================== USER MUTATIONS ====================

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.user.updateProfile(data)
      return response.data
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.userProfile(), updatedUser)
      showSuccessNotification('Profile Updated', 'Your profile has been updated successfully.')
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Update Failed', message)
    },
  })
}

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await api.user.completeOnboarding(data)
      return response.data
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.userProfile(), updatedUser)
      showSuccessNotification('Welcome to Hook Line Studio!', 'Your profile has been set up successfully.')
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Setup Failed', message)
    },
  })
}

// ==================== HOOK QUERIES ====================

export const useHookGeneration = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.hookGeneration(id),
    queryFn: async () => {
      const response = await api.hooks.getGeneration(id)
      return response.data
    },
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useHookHistory = (params?: {
  page?: number
  limit?: number
  platform?: string
  startDate?: string
  endDate?: string
}) => {
  return useQuery({
    queryKey: queryKeys.hookHistory(params),
    queryFn: async () => {
      const response = await api.hooks.getHistory(params)
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useHookFavorites = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.hookFavorites(),
    queryFn: async () => {
      const response = await api.hooks.getFavorites(params)
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ==================== HOOK MUTATIONS ====================

export const useGenerateHooks = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async (data: GenerateHooksRequest) => {
      const response = await api.hooks.generateHooks(data)
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate and refetch hook history
      queryClient.invalidateQueries({ queryKey: queryKeys.hookHistory() })
      // Invalidate user usage data
      queryClient.invalidateQueries({ queryKey: queryKeys.userUsage() })
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
      
      showSuccessNotification('Hooks Generated!', `Created ${data?.hooks?.length || 0} viral hooks for you.`)
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Generation Failed', message)
    },
  })
}

export const useAddToFavorites = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async ({ generationId, hookIndex }: { generationId: string; hookIndex: number }) => {
      await api.hooks.addToFavorites(generationId, hookIndex)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hookFavorites() })
      showSuccessNotification('Saved!', 'Hook added to your favorites.')
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Save Failed', message)
    },
  })
}

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async ({ generationId, hookIndex }: { generationId: string; hookIndex: number }) => {
      await api.hooks.removeFromFavorites(generationId, hookIndex)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hookFavorites() })
      showSuccessNotification('Removed', 'Hook removed from favorites.')
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Remove Failed', message)
    },
  })
}

export const useDeleteGeneration = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.hooks.deleteGeneration(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hookHistory() })
      showSuccessNotification('Deleted', 'Generation deleted successfully.')
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Delete Failed', message)
    },
  })
}

// ==================== PAYMENT QUERIES ====================

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans(),
    queryFn: async () => {
      const response = await api.payments.getPlans()
      return response.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export const usePaymentHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.paymentHistory(),
    queryFn: async () => {
      const response = await api.payments.getPaymentHistory(params)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ==================== PAYMENT MUTATIONS ====================

export const useCreateCheckoutSession = () => {
  const { showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async (data: CreateCheckoutSession) => {
      const response = await api.payments.createCheckoutSession(data)
      return response.data
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url
      }
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Checkout Failed', message)
    },
  })
}

export const useCreateBillingPortal = () => {
  const { showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async (data: BillingPortalSession) => {
      const response = await api.payments.createBillingPortal(data)
      return response.data
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url
      }
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Portal Access Failed', message)
    },
  })
}

export const useCancelSubscription = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async () => {
      await api.payments.cancelSubscription()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubscription() })
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
      showSuccessNotification('Subscription Canceled', 'Your subscription will end at the current billing period.')
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Cancellation Failed', message)
    },
  })
}

export const useResumeSubscription = () => {
  const queryClient = useQueryClient()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return useMutation({
    mutationFn: async () => {
      await api.payments.resumeSubscription()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubscription() })
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() })
      showSuccessNotification('Subscription Resumed', 'Your subscription has been reactivated.')
    },
    onError: (error: any) => {
      const message = handleMutationError(error)
      showErrorNotification('Resume Failed', message)
    },
  })
}

// ==================== ANALYTICS QUERIES ====================

export const useAnalyticsOverview = (period: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.analyticsOverview(period),
    queryFn: async () => {
      const response = await api.analytics.getOverview(period)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAnalyticsUsage = (period: string = '30d') => {
  return useQuery({
    queryKey: queryKeys.analyticsUsage(period),
    queryFn: async () => {
      const response = await api.analytics.getUsageAnalytics(period)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ==================== ANALYTICS MUTATIONS ====================

export const useTrackEvent = () => {
  return useMutation({
    mutationFn: async (eventData: any) => {
      await api.analytics.trackEvent(eventData)
    },
    // Silent mutations - don't show notifications for analytics
  })
}

// ==================== UTILITY HOOKS ====================

export const useCopyToClipboard = () => {
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  return (text: string, successMessage = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text).then(
      () => showSuccessNotification('Copied!', successMessage),
      () => showErrorNotification('Copy Failed', 'Failed to copy to clipboard')
    )
  }
}

// ==================== COMBINED HOOKS ====================

export const useUserData = () => {
  const profile = useUserProfile()
  const usage = useUserUsage()
  const subscription = useUserSubscription()

  return {
    profile,
    usage,
    subscription,
    isLoading: profile.isLoading || usage.isLoading || subscription.isLoading,
    error: profile.error || usage.error || subscription.error,
  }
}