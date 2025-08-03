import type { 
  APIResponse,
  PaginatedResponse,
  UserProfile,
  OnboardingData,
  GenerateHooksRequest,
  GenerateHooksResponse,
  SubscriptionPlanDetails,
  PaymentHistoryItem,
  UsageTrackingData,
  CreateCheckoutSession,
  BillingPortalSession,
  AnalyticsEvent
} from '@/shared/types'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Token management
let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
}

export const getAuthToken = () => authToken

// Base fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        status: response.status,
        message: errorData.error || response.statusText,
        ...errorData,
      }
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error)
    throw error
  }
}

// ==================== AUTHENTICATION API ====================

export const authApi = {
  // Verify Firebase token with backend
  verifyToken: (firebaseToken: string) =>
    apiFetch<{ user: UserProfile; token: string }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token: firebaseToken }),
    }),

  // Refresh auth token
  refreshToken: () =>
    apiFetch<{ token: string }>('/auth/refresh', {
      method: 'POST',
    }),

  // Sign out
  signOut: () =>
    apiFetch<void>('/auth/signout', {
      method: 'POST',
    }),
}

// ==================== USER API ====================

export const userApi = {
  // Get user profile
  getProfile: () =>
    apiFetch<UserProfile>('/users/profile'),

  // Update user profile
  updateProfile: (data: Partial<UserProfile>) =>
    apiFetch<UserProfile>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Complete onboarding
  completeOnboarding: (data: OnboardingData) =>
    apiFetch<UserProfile>('/users/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get usage data
  getUsage: () =>
    apiFetch<UsageTrackingData>('/users/usage'),

  // Delete account
  deleteAccount: () =>
    apiFetch<void>('/users/profile', {
      method: 'DELETE',
    }),
}

// ==================== HOOKS API ====================

export const hooksApi = {
  // Generate hooks
  generateHooks: (data: GenerateHooksRequest) =>
    apiFetch<GenerateHooksResponse>('/hooks/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get hook generation by ID
  getGeneration: (id: string) =>
    apiFetch<GenerateHooksResponse>(`/hooks/generations/${id}`),

  // Get hook history
  getHistory: (params?: {
    page?: number
    limit?: number
    platform?: string
    startDate?: string
    endDate?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.platform) searchParams.set('platform', params.platform)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    const queryString = searchParams.toString()
    return apiFetch<PaginatedResponse<GenerateHooksResponse>>(
      `/hooks/history${queryString ? `?${queryString}` : ''}`
    )
  },

  // Add to favorites
  addToFavorites: (generationId: string, hookIndex: number) =>
    apiFetch<void>('/hooks/favorites', {
      method: 'POST',
      body: JSON.stringify({ generationId, hookIndex }),
    }),

  // Remove from favorites
  removeFromFavorites: (generationId: string, hookIndex: number) =>
    apiFetch<void>('/hooks/favorites', {
      method: 'DELETE',
      body: JSON.stringify({ generationId, hookIndex }),
    }),

  // Get favorites
  getFavorites: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const queryString = searchParams.toString()
    return apiFetch<PaginatedResponse<any>>(
      `/hooks/favorites${queryString ? `?${queryString}` : ''}`
    )
  },

  // Delete generation
  deleteGeneration: (id: string) =>
    apiFetch<void>(`/hooks/generations/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== PAYMENTS API ====================

export const paymentsApi = {
  // Get subscription plans
  getPlans: () =>
    apiFetch<SubscriptionPlanDetails[]>('/payments/plans'),

  // Create checkout session
  createCheckoutSession: (data: CreateCheckoutSession) =>
    apiFetch<{ url: string }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create billing portal session
  createBillingPortal: (data: BillingPortalSession) =>
    apiFetch<{ url: string }>('/payments/billing-portal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get payment history
  getPaymentHistory: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const queryString = searchParams.toString()
    return apiFetch<PaginatedResponse<PaymentHistoryItem>>(
      `/payments/history${queryString ? `?${queryString}` : ''}`
    )
  },

  // Get subscription overview
  getSubscriptionOverview: () =>
    apiFetch<any>('/payments/subscription'),

  // Cancel subscription
  cancelSubscription: () =>
    apiFetch<void>('/payments/subscription/cancel', {
      method: 'POST',
    }),

  // Resume subscription
  resumeSubscription: () =>
    apiFetch<void>('/payments/subscription/resume', {
      method: 'POST',
    }),
}

// ==================== ANALYTICS API ====================

export const analyticsApi = {
  // Track event
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'createdAt'>) =>
    apiFetch<void>('/analytics/track', {
      method: 'POST',
      body: JSON.stringify(event),
    }),

  // Get analytics overview
  getOverview: (period: string = '30d') =>
    apiFetch<any>(`/analytics/overview?period=${period}`),

  // Get usage analytics
  getUsageAnalytics: (period: string = '30d') =>
    apiFetch<any>(`/analytics/usage?period=${period}`),

  // Get performance metrics
  getPerformanceMetrics: (period: string = '30d') =>
    apiFetch<any>(`/analytics/performance?period=${period}`),
}

// ==================== HEALTH CHECK ====================

export const healthApi = {
  // Check API health
  check: () => apiFetch<{ status: string; timestamp: string }>('/health'),
}

// Export all APIs
export const api = {
  auth: authApi,
  user: userApi,
  hooks: hooksApi,
  payments: paymentsApi,
  analytics: analyticsApi,
  health: healthApi,
}