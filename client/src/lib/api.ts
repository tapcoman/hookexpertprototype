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
} from '@/types/shared'
import { 
  classifyAuthError, 
  shouldRetry, 
  calculateRetryDelay, 
  sleep, 
  logAuthError,
  AuthError,
  DEFAULT_RETRY_CONFIG,
  RetryConfig
} from './auth-errors'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Token management
let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
}

export const getAuthToken = () => authToken

// Enhanced fetch wrapper with comprehensive error handling and retry logic
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<APIResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const finalRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(30000), // 30 second timeout
  }

  let lastError: AuthError | null = null
  
  for (let attempt = 1; attempt <= finalRetryConfig.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const rawError = {
          status: response.status,
          statusCode: response.status,
          message: errorData.error || response.statusText,
          ...errorData,
        }
        
        const classifiedError = classifyAuthError(rawError)
        lastError = classifiedError
        
        // Log error details
        logAuthError(classifiedError, {
          endpoint,
          attempt,
          statusCode: response.status,
          response: errorData
        })
        
        // Check if we should retry
        if (shouldRetry(classifiedError, attempt, finalRetryConfig)) {
          const delay = calculateRetryDelay(attempt, finalRetryConfig)
          console.warn(`API request failed, retrying in ${delay}ms (attempt ${attempt}/${finalRetryConfig.maxAttempts})`)
          await sleep(delay)
          continue
        }
        
        // No more retries, throw the error
        throw classifiedError
      }

      const data = await response.json()
      
      // Log successful retry if this wasn't the first attempt
      if (attempt > 1) {
        console.info(`API request succeeded on attempt ${attempt}`)
      }
      
      return data
      
    } catch (error: any) {
      // Handle network errors, timeouts, etc.
      if (error.name === 'AbortError') {
        const timeoutError = classifyAuthError({ message: 'Request timeout', code: 'TIMEOUT' })
        lastError = timeoutError
        logAuthError(timeoutError, { endpoint, attempt })
        
        if (shouldRetry(timeoutError, attempt, finalRetryConfig)) {
          const delay = calculateRetryDelay(attempt, finalRetryConfig)
          console.warn(`Request timeout, retrying in ${delay}ms (attempt ${attempt}/${finalRetryConfig.maxAttempts})`)
          await sleep(delay)
          continue
        }
        
        throw timeoutError
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = classifyAuthError({ message: 'Network connection failed', code: 'NETWORK_ERROR' })
        lastError = networkError
        logAuthError(networkError, { endpoint, attempt })
        
        if (shouldRetry(networkError, attempt, finalRetryConfig)) {
          const delay = calculateRetryDelay(attempt, finalRetryConfig)
          console.warn(`Network error, retrying in ${delay}ms (attempt ${attempt}/${finalRetryConfig.maxAttempts})`)
          await sleep(delay)
          continue
        }
        
        throw networkError
      }
      
      // If it's already a classified error, just check retry logic
      if (error.type && error.userMessage) {
        lastError = error as AuthError
        if (shouldRetry(error, attempt, finalRetryConfig)) {
          const delay = calculateRetryDelay(attempt, finalRetryConfig)
          console.warn(`Classified error, retrying in ${delay}ms (attempt ${attempt}/${finalRetryConfig.maxAttempts})`)
          await sleep(delay)
          continue
        }
        throw error
      }
      
      // Classify and handle unknown errors
      const classifiedError = classifyAuthError(error)
      lastError = classifiedError
      logAuthError(classifiedError, { endpoint, attempt, originalError: error })
      
      if (shouldRetry(classifiedError, attempt, finalRetryConfig)) {
        const delay = calculateRetryDelay(attempt, finalRetryConfig)
        console.warn(`Unknown error, retrying in ${delay}ms (attempt ${attempt}/${finalRetryConfig.maxAttempts})`)
        await sleep(delay)
        continue
      }
      
      throw classifiedError
    }
  }
  
  // This should never be reached, but throw last error if it happens
  throw lastError || classifyAuthError({ message: 'Max retries exceeded' })
}

// Auth-specific fetch with enhanced retry for critical auth operations
async function authApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  return apiFetch<T>(endpoint, options, {
    maxAttempts: 5, // More retries for auth operations
    baseDelay: 2000, // Longer initial delay
    maxDelay: 60000 // Up to 1 minute max delay
  })
}

// ==================== AUTHENTICATION API ====================

export const authApi = {
  // Verify Firebase token with backend (critical auth operation)
  verifyToken: (firebaseToken: string) =>
    authApiFetch<{ user: UserProfile; isAuthenticated: boolean }>('/auth/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${firebaseToken}`,
      },
    }),

  // Refresh auth token (critical auth operation)
  refreshToken: () =>
    authApiFetch<{ token: string }>('/auth/refresh', {
      method: 'POST',
    }),

  // Sign out (use regular retry logic)
  signOut: () =>
    apiFetch<void>('/auth/signout', {
      method: 'POST',
    }),

  // Check auth status (non-critical, fewer retries)
  checkStatus: (firebaseToken?: string) =>
    apiFetch<{ isAuthenticated: boolean; user?: UserProfile; error?: string }>('/auth/status', {
      method: 'GET',
      ...(firebaseToken && {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      }),
    }, {
      maxAttempts: 2, // Only retry once for status checks
      baseDelay: 1000
    }),
}

// ==================== USER API ====================

export const userApi = {
  // Get user profile (critical operation)
  getProfile: () =>
    authApiFetch<UserProfile>('/users/profile'),

  // Update user profile (critical operation)
  updateProfile: (data: Partial<UserProfile>) =>
    authApiFetch<UserProfile>('/users/profile', {
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
  // Generate hooks (enhanced)
  generateHooks: (data: GenerateHooksRequest) =>
    apiFetch<GenerateHooksResponse>('/hooks/generate/enhanced', {
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

  // Add to favorites - now takes full hook data
  addToFavorites: (data: {
    generationId?: string
    hookData: any
    framework: string
    platformNotes: string
    topic?: string
    platform?: string
  }) =>
    apiFetch<any>('/hooks/favorites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Remove from favorites by ID
  removeFromFavorites: (favoriteId: string) =>
    apiFetch<void>(`/hooks/favorites/${favoriteId}`, {
      method: 'DELETE',
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