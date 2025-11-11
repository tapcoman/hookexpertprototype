import React, { ReactNode } from 'react'
import { Redirect } from 'wouter'
import { useAuth as useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ==================== TYPES ====================

interface HybridProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireOnboarding?: boolean
  requireSubscription?: boolean
  redirectTo?: string
  fallback?: ReactNode
}

interface HybridPublicRouteProps {
  children: ReactNode
  redirectIfAuthenticated?: boolean
  redirectTo?: string
}

interface HybridOnboardingRouteProps {
  children: ReactNode
}

// ==================== HYBRID PROTECTED ROUTE ====================

/**
 * HybridProtectedRoute - Accepts EITHER SimpleAuth OR Clerk authentication
 * This allows both auth systems to work in parallel during migration
 */
export const HybridProtectedRoute: React.FC<HybridProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
  requireSubscription = false,
  redirectTo,
  fallback,
}) => {
  // SimpleAuth state
  const { user: simpleUser, isLoading: simpleLoading, isInitializing: simpleInitializing } = useSimpleAuth()

  // Clerk state
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth()

  // Check if either auth system is still loading
  const isLoading = simpleInitializing || simpleLoading || !clerkLoaded

  // Show loading state while initializing
  if (isLoading) {
    return fallback || <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Check if user is authenticated via EITHER system
  const isAuthenticated = !!simpleUser || clerkSignedIn

  console.log('[HybridProtectedRoute] Auth check:', {
    hasSimpleAuth: !!simpleUser,
    hasClerkAuth: clerkSignedIn,
    isAuthenticated,
    requireAuth,
    requireOnboarding
  })

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    console.log('[HybridProtectedRoute] Not authenticated, redirecting to /auth')
    return <Redirect to={redirectTo || '/auth'} />
  }

  // Check onboarding requirement - support both systems
  if (requireOnboarding && isAuthenticated) {
    // Check new localStorage-based onboarding (v0.dev interface)
    const isNewOnboardingComplete = localStorage.getItem('hle:onboarded')

    // Check legacy SimpleAuth database-based onboarding
    const isSimpleAuthOnboardingComplete = simpleUser?.company && simpleUser?.industry && simpleUser?.role

    // If user is authenticated via SimpleAuth and has legacy onboarding, they're good
    const hasOnboarding = isNewOnboardingComplete || isSimpleAuthOnboardingComplete

    if (!hasOnboarding) {
      console.log('[HybridProtectedRoute] User needs onboarding, redirecting to /onboarding', {
        hasNewOnboarding: !!isNewOnboardingComplete,
        hasSimpleAuthOnboarding: !!isSimpleAuthOnboardingComplete,
        authMethod: simpleUser ? 'SimpleAuth' : clerkSignedIn ? 'Clerk' : 'None'
      })
      return <Redirect to="/onboarding" />
    }
  }

  // Check subscription requirement (only for SimpleAuth users for now)
  if (requireSubscription && simpleUser && !hasActiveSubscription(simpleUser)) {
    return <Redirect to="/pricing" />
  }

  return <>{children}</>
}

// ==================== HYBRID PUBLIC ROUTE ====================

/**
 * HybridPublicRoute - Redirects if authenticated via EITHER system
 * Prevents "already signed in" errors by checking both auth states
 */
export const HybridPublicRoute: React.FC<HybridPublicRouteProps> = ({
  children,
  redirectIfAuthenticated = false,
  redirectTo = '/app',
}) => {
  // SimpleAuth state
  const { user: simpleUser, isInitializing: simpleInitializing } = useSimpleAuth()

  // Clerk state
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth()

  // Check if either auth system is still loading
  const isLoading = simpleInitializing || !clerkLoaded

  // Show loading state while initializing
  if (isLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Check if user is authenticated via EITHER system
  const isAuthenticated = !!simpleUser || clerkSignedIn

  console.log('[HybridPublicRoute] Auth check:', {
    hasSimpleAuth: !!simpleUser,
    hasClerkAuth: clerkSignedIn,
    isAuthenticated,
    redirectIfAuthenticated
  })

  // Redirect authenticated users if required
  if (redirectIfAuthenticated && isAuthenticated) {
    console.log('[HybridPublicRoute] User is authenticated, redirecting to', redirectTo)
    return <Redirect to={redirectTo} />
  }

  return <>{children}</>
}

// ==================== HYBRID ONBOARDING ROUTE ====================

/**
 * HybridOnboardingRoute - Requires auth from EITHER system but NOT onboarding
 * Redirects to /app if already onboarded
 */
export const HybridOnboardingRoute: React.FC<HybridOnboardingRouteProps> = ({ children }) => {
  // SimpleAuth state
  const { user: simpleUser, isLoading: simpleLoading, isInitializing: simpleInitializing } = useSimpleAuth()

  // Clerk state
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth()

  // Check if either auth system is still loading
  const isLoading = simpleInitializing || simpleLoading || !clerkLoaded

  // Show loading state while initializing
  if (isLoading) {
    console.log('[HybridOnboardingRoute] Loading auth state...')
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Check if user is authenticated via EITHER system
  const isAuthenticated = !!simpleUser || clerkSignedIn

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    console.log('[HybridOnboardingRoute] Not authenticated, redirecting to /auth')
    return <Redirect to="/auth" />
  }

  // Check onboarding status - support both new and legacy onboarding
  const hasNewOnboarding = localStorage.getItem('hle:onboarded')
  const hasLegacyOnboarding = simpleUser && simpleUser.company && simpleUser.industry && simpleUser.role
  const hasOnboarding = hasNewOnboarding || hasLegacyOnboarding

  console.log('[HybridOnboardingRoute] Checking onboarding status:', {
    hasNewOnboarding: !!hasNewOnboarding,
    hasLegacyOnboarding: !!hasLegacyOnboarding,
    hasOnboarding,
    authMethod: simpleUser ? 'SimpleAuth' : clerkSignedIn ? 'Clerk' : 'None'
  })

  // Redirect to app if already onboarded
  if (hasOnboarding) {
    console.log('[HybridOnboardingRoute] User already onboarded, redirecting to /app')
    return <Redirect to="/app" />
  }

  console.log('[HybridOnboardingRoute] User needs onboarding, showing onboarding page')
  return <>{children}</>
}

// ==================== UTILITY FUNCTIONS ====================

const hasActiveSubscription = (user: any): boolean => {
  return user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
}

// ==================== ROUTE GUARDS ====================

// Higher-order component for hybrid route protection
export const withHybridAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean
    requireOnboarding?: boolean
    requireSubscription?: boolean
    redirectTo?: string
  } = {}
) => {
  const GuardedComponent: React.FC<P> = (props) => (
    <HybridProtectedRoute {...options}>
      <Component {...props} />
    </HybridProtectedRoute>
  )

  GuardedComponent.displayName = `withHybridAuthGuard(${Component.displayName || Component.name})`
  return GuardedComponent
}

// Higher-order component for hybrid public routes
export const withHybridPublicGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    redirectIfAuthenticated?: boolean
    redirectTo?: string
  } = {}
) => {
  const GuardedComponent: React.FC<P> = (props) => (
    <HybridPublicRoute {...options}>
      <Component {...props} />
    </HybridPublicRoute>
  )

  GuardedComponent.displayName = `withHybridPublicGuard(${Component.displayName || Component.name})`
  return GuardedComponent
}
