import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, WifiOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthErrorDisplay, InlineAuthError } from './AuthErrorBoundary'
import { Button } from '@/components/ui/Button'

// ==================== AUTH STATUS INDICATOR ====================

interface AuthStatusProps {
  variant?: 'inline' | 'compact' | 'detailed'
  showRetry?: boolean
  className?: string
}

export const AuthStatus: React.FC<AuthStatusProps> = ({
  variant = 'inline',
  showRetry = true,
  className = ''
}) => {
  const { 
    firebaseUser, 
    user, 
    isLoading, 
    isInitializing, 
    isRetrying,
    error, 
    isOnline,
    retryAuth,
    getErrorMessage
  } = useAuth()

  // Show nothing during initial load
  if (isInitializing) return null

  // Offline indicator
  if (!isOnline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 p-2 bg-warning/10 border border-warning/20 rounded-md ${className}`}
      >
        <WifiOff className="w-4 h-4 text-warning" />
        <span className="text-sm text-warning">You're offline</span>
      </motion.div>
    )
  }

  // Error state
  if (error) {
    if (variant === 'detailed') {
      return <AuthErrorDisplay className={className} />
    }
    
    return (
      <InlineAuthError 
        compact={variant === 'compact'}
        showRetry={showRetry}
        className={className}
      />
    )
  }

  // Loading state
  if (isLoading || isRetrying) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 p-2 text-muted-foreground ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">
          {isRetrying ? 'Retrying authentication...' : 'Loading...'}
        </span>
      </motion.div>
    )
  }

  // Success state (authenticated)
  if (firebaseUser && user) {
    if (variant === 'compact') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 ${className}`}
        >
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-xs text-success">Authenticated</span>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 p-2 bg-success/10 border border-success/20 rounded-md ${className}`}
      >
        <CheckCircle className="w-4 h-4 text-success" />
        <div className="flex-1">
          <p className="text-sm text-success font-medium">Signed in</p>
          <p className="text-xs text-success/80">
            Welcome back, {user.firstName || user.email}
          </p>
        </div>
      </motion.div>
    )
  }

  // Not authenticated (should not normally show if auth is working properly)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-2 p-2 bg-muted/50 border border-muted rounded-md ${className}`}
    >
      <AlertCircle className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Not signed in</span>
    </motion.div>
  )
}

// ==================== CONNECTION STATUS MONITOR ====================

export const ConnectionStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, error, isRetrying } = useAuth()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-warning text-warning-foreground rounded-lg shadow-lg">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">No internet connection</span>
          </div>
        </motion.div>
      )}
      
      {isRetrying && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ==================== AUTH GUARD COMPONENT ====================

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  showLoading?: boolean
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
  showLoading = true
}) => {
  const { 
    firebaseUser, 
    user, 
    isLoading, 
    isInitializing, 
    error,
    shouldShowSignIn
  } = useAuth()

  // Show loading during initialization
  if (isInitializing && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    if (shouldShowSignIn() && requireAuth) {
      return fallback || (
        <div className="flex items-center justify-center min-h-[200px]">
          <AuthErrorDisplay />
        </div>
      )
    }
    
    return (
      <div className="p-4">
        <InlineAuthError />
        {children}
      </div>
    )
  }

  // Show loading state
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Check authentication requirement
  if (requireAuth && (!firebaseUser || !user)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to access this content.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}