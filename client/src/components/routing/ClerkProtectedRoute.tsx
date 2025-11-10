import { useAuth, useUser } from '@clerk/clerk-react'
import { ReactNode } from 'react'
import { Redirect } from 'wouter'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

/**
 * Protected Route - Requires authentication
 * Redirects to /auth if not signed in
 */
export function ClerkProtectedRoute({ children, redirectTo = '/auth' }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Redirect to auth if not signed in
  if (!isSignedIn) {
    return <Redirect to={redirectTo} />
  }

  return <>{children}</>
}

/**
 * Public Route - Only accessible when NOT authenticated
 * Redirects to /app if already signed in
 */
export function ClerkPublicRoute({
  children,
  redirectIfAuthenticated = false,
  redirectTo = '/app'
}: ProtectedRouteProps & { redirectIfAuthenticated?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (redirectIfAuthenticated && isSignedIn) {
    return <Redirect to={redirectTo} />
  }

  return <>{children}</>
}

/**
 * Onboarding Route - Requires auth + checks if onboarding completed
 */
export function ClerkOnboardingRoute({ children, redirectTo = '/app' }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Redirect to="/auth" />
  }

  // Check if onboarding is completed (stored in Clerk metadata)
  const onboardingCompleted = user?.publicMetadata?.onboardingCompleted

  if (onboardingCompleted) {
    return <Redirect to={redirectTo} />
  }

  return <>{children}</>
}

/**
 * Root Redirect - Smart redirect based on auth state
 */
export function ClerkRootRedirect() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Redirect to="/auth" />
  }

  // Check if onboarding is completed
  const onboardingCompleted = user?.publicMetadata?.onboardingCompleted

  if (!onboardingCompleted) {
    return <Redirect to="/onboarding" />
  }

  return <Redirect to="/app" />
}
