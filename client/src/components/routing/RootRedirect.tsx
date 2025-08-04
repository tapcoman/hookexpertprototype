import React from 'react'
import { Redirect, RouteComponentProps } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ==================== TYPES ====================

type RootRedirectProps = RouteComponentProps

// ==================== COMPONENT ====================

/**
 * RootRedirect component handles the default route (/) logic:
 * - If user is NOT authenticated: redirect to /auth
 * - If user IS authenticated: redirect to /app
 * - Shows loading state during authentication check
 */
export const RootRedirect: React.FC<RootRedirectProps> = () => {
  const { firebaseUser, isInitializing } = useAuth()

  // Show loading state while checking authentication
  if (isInitializing) {
    return <LoadingSpinner className="flex items-center justify-center min-h-screen" />
  }

  // Redirect based on authentication status
  if (firebaseUser) {
    // User is authenticated, redirect to main app
    return <Redirect to="/app" />
  } else {
    // User is not authenticated, redirect to auth page
    return <Redirect to="/auth" />
  }
}

export default RootRedirect