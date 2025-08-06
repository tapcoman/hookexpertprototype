import React, { ReactNode } from 'react'
import { Redirect } from 'wouter'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ==================== TYPES ====================

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireOnboarding?: boolean
  requireSubscription?: boolean
  redirectTo?: string
  fallback?: ReactNode
}

// ==================== COMPONENT ====================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
  requireSubscription = false,
  redirectTo,
  fallback,
}) => {
  const { firebaseUser, user, isLoading, isInitializing } = useAuth()

  // Show loading state while initializing
  if (isInitializing || isLoading) {
    return fallback || <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Check authentication requirement
  if (requireAuth && !firebaseUser) {
    return <Redirect to={redirectTo || '/auth'} />
  }

  // Check if user profile exists (for authenticated routes)
  if (requireAuth && firebaseUser && !user) {
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Check onboarding requirement
  if (requireOnboarding && user && (!user.company || !user.industry || !user.role)) {
    return <Redirect to="/onboarding" />
  }

  // Check subscription requirement
  if (requireSubscription && user && !hasActiveSubscription(user)) {
    return <Redirect to="/pricing" />
  }

  return <>{children}</>
}

// ==================== PUBLIC ROUTE ====================

interface PublicRouteProps {
  children: ReactNode
  redirectIfAuthenticated?: boolean
  redirectTo?: string
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = false,
  redirectTo = '/app',
}) => {
  const { firebaseUser, isInitializing } = useAuth()

  // Show loading state while initializing
  if (isInitializing) {
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Redirect authenticated users if required
  if (redirectIfAuthenticated && firebaseUser) {
    return <Redirect to={redirectTo} />
  }

  return <>{children}</>
}

// ==================== ONBOARDING ROUTE ====================

interface OnboardingRouteProps {
  children: ReactNode
}

export const OnboardingRoute: React.FC<OnboardingRouteProps> = ({ children }) => {
  const { firebaseUser, user, isLoading, isInitializing } = useAuth()

  // Show loading state while initializing
  if (isInitializing || isLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Redirect to auth if not authenticated
  if (!firebaseUser) {
    return <Redirect to="/auth" />
  }

  // Redirect to app if already onboarded
  if (user && user.company && user.industry && user.role) {
    return <Redirect to="/app" />
  }

  return <>{children}</>
}

// ==================== SUBSCRIPTION ROUTE ====================

interface SubscriptionRouteProps {
  children: ReactNode
  requiredPlan?: 'starter' | 'creator' | 'pro' | 'teams'
  fallbackComponent?: ReactNode
}

export const SubscriptionRoute: React.FC<SubscriptionRouteProps> = ({
  children,
  requiredPlan,
  fallbackComponent,
}) => {
  const { user, isLoading, isInitializing } = useAuth()

  // Show loading state while initializing
  if (isInitializing || isLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Check if user has required subscription
  if (user && requiredPlan && !hasRequiredPlan(user, requiredPlan)) {
    return fallbackComponent || <Redirect to="/pricing" />
  }

  return <>{children}</>
}

// ==================== UTILITY FUNCTIONS ====================

const hasActiveSubscription = (user: any): boolean => {
  return user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
}

const hasRequiredPlan = (user: any, requiredPlan: string): boolean => {
  if (!hasActiveSubscription(user)) return false
  
  const planHierarchy = ['free', 'starter', 'creator', 'pro', 'teams']
  const userPlanIndex = planHierarchy.indexOf(user.subscriptionPlan)
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan)
  
  return userPlanIndex >= requiredPlanIndex
}

// ==================== ROUTE GUARDS ====================

// Higher-order component for route protection
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean
    requireOnboarding?: boolean
    requireSubscription?: boolean
    redirectTo?: string
  } = {}
) => {
  const GuardedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  )
  
  GuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`
  return GuardedComponent
}

// Higher-order component for public routes
export const withPublicGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    redirectIfAuthenticated?: boolean
    redirectTo?: string
  } = {}
) => {
  const GuardedComponent: React.FC<P> = (props) => (
    <PublicRoute {...options}>
      <Component {...props} />
    </PublicRoute>
  )
  
  GuardedComponent.displayName = `withPublicGuard(${Component.displayName || Component.name})`
  return GuardedComponent
}