import React from 'react'
import { Redirect, RouteComponentProps } from 'wouter'
import { useAuth as useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ==================== TYPES ====================

type RootRedirectProps = RouteComponentProps

// ==================== COMPONENT ====================

/**
 * RootRedirect component handles the default route (/) logic:
 * - Checks BOTH SimpleAuth AND Clerk for authentication
 * - If user is NOT authenticated via either: redirect to /auth
 * - If user IS authenticated via either: redirect to /app
 * - Shows loading state during authentication check
 */
export const RootRedirect: React.FC<RootRedirectProps> = () => {
  // SimpleAuth state
  const { user: simpleUser, isInitializing: simpleInitializing } = useSimpleAuth()

  // Clerk state
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth()

  // Check if either auth system is still loading
  const isLoading = simpleInitializing || !clerkLoaded

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Check if user is authenticated via EITHER system
  const isAuthenticated = !!simpleUser || clerkSignedIn

  console.log('[RootRedirect] Auth check:', {
    hasSimpleAuth: !!simpleUser,
    hasClerkAuth: clerkSignedIn,
    isAuthenticated
  })

  // Redirect based on authentication status
  if (isAuthenticated) {
    // User is authenticated via either system, redirect to main app
    console.log('[RootRedirect] User authenticated, redirecting to /app')
    return <Redirect to="/app" />
  } else {
    // User is not authenticated, redirect to auth page
    console.log('[RootRedirect] User not authenticated, redirecting to /auth')
    return <Redirect to="/auth" />
  }
}

export default RootRedirect