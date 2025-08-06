import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, LogIn, Wifi, WifiOff, Clock, Server } from 'lucide-react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { AuthErrorType } from '@/lib/auth-errors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// ==================== AUTH ERROR DISPLAY COMPONENT ====================

interface AuthErrorDisplayProps {
  onRetry?: () => void
  onSignIn?: () => void
  className?: string
}

export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
  onRetry,
  onSignIn,
  className = ''
}) => {
  const { 
    error, 
    isOnline, 
    isRetrying,
    getErrorMessage, 
    getRecoverySteps, 
    shouldShowSignIn,
    retryAuth,
    clearError
  } = useAuth()

  if (!error) return null

  const errorMessage = getErrorMessage()
  const recoverySteps = getRecoverySteps()
  const needsSignIn = shouldShowSignIn()

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      retryAuth()
    }
  }

  const handleSignIn = () => {
    clearError()
    if (onSignIn) {
      onSignIn()
    } else {
      // Navigate to sign in page
      window.location.href = '/auth'
    }
  }

  const getErrorIcon = () => {
    if (!isOnline) return <WifiOff className="w-8 h-8 text-destructive" />
    
    switch (error.type) {
      case AuthErrorType.NETWORK_ERROR:
        return <Wifi className="w-8 h-8 text-destructive" />
      case AuthErrorType.TIMEOUT_ERROR:
        return <Clock className="w-8 h-8 text-destructive" />
      case AuthErrorType.SERVER_UNAVAILABLE:
      case AuthErrorType.DATABASE_CONNECTION:
        return <Server className="w-8 h-8 text-destructive" />
      case AuthErrorType.TOKEN_EXPIRED:
      case AuthErrorType.TOKEN_INVALID:
      case AuthErrorType.TOKEN_REVOKED:
        return <LogIn className="w-8 h-8 text-destructive" />
      default:
        return <AlertTriangle className="w-8 h-8 text-destructive" />
    }
  }

  const getErrorTitle = () => {
    if (!isOnline) return 'No Internet Connection'
    
    switch (error.type) {
      case AuthErrorType.TOKEN_EXPIRED:
        return 'Session Expired'
      case AuthErrorType.TOKEN_INVALID:
      case AuthErrorType.TOKEN_REVOKED:
        return 'Authentication Required'
      case AuthErrorType.NETWORK_ERROR:
        return 'Connection Problem'
      case AuthErrorType.TIMEOUT_ERROR:
        return 'Request Timed Out'
      case AuthErrorType.SERVER_UNAVAILABLE:
        return 'Service Unavailable'
      case AuthErrorType.DATABASE_CONNECTION:
        return 'Database Issue'
      case AuthErrorType.RATE_LIMITED:
        return 'Too Many Attempts'
      default:
        return 'Something Went Wrong'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${className}`}
    >
      <Card className="p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          {getErrorIcon()}
        </motion.div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          {getErrorTitle()}
        </h2>
        
        <p className="text-muted-foreground mb-6">
          {errorMessage}
        </p>

        {/* Action buttons */}
        <div className="space-y-3 mb-6">
          {needsSignIn ? (
            <Button 
              onClick={handleSignIn}
              className="w-full"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In Again
            </Button>
          ) : error.canRetry && (
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
              size="lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}
          
          {!needsSignIn && (
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
          )}
        </div>

        {/* Recovery steps */}
        {recoverySteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-left"
          >
            <h3 className="text-sm font-medium text-foreground mb-2">
              Try these steps:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {recoverySteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full mr-2 mt-2 flex-shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Retry countdown */}
        {error.retryAfter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Please wait {error.retryAfter} seconds before retrying
          </motion.div>
        )}

        {/* Technical details (development only) */}
        {process.env.NODE_ENV === 'development' && error.technicalDetails && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Technical Details (Development)
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs font-mono text-muted-foreground overflow-auto max-h-32">
              {JSON.stringify(error.technicalDetails, null, 2)}
            </pre>
          </details>
        )}
      </Card>
    </motion.div>
  )
}

// ==================== INLINE AUTH ERROR COMPONENT ====================

interface InlineAuthErrorProps {
  compact?: boolean
  showRetry?: boolean
  onRetry?: () => void
  className?: string
}

export const InlineAuthError: React.FC<InlineAuthErrorProps> = ({
  compact = false,
  showRetry = true,
  onRetry,
  className = ''
}) => {
  const { 
    error, 
    isRetrying,
    getErrorMessage,
    retryAuth,
    shouldShowSignIn
  } = useAuth()

  if (!error) return null

  const errorMessage = getErrorMessage()
  const needsSignIn = shouldShowSignIn()

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      retryAuth()
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-md ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-4 h-4 text-destructive mr-2" />
          <span className="text-sm text-destructive">{errorMessage}</span>
        </div>
        {showRetry && error.canRetry && !needsSignIn && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`p-4 bg-destructive/10 border border-destructive/20 rounded-md ${className}`}
    >
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-destructive font-medium mb-1">
            Authentication Error
          </p>
          <p className="text-sm text-destructive/80 mb-3">
            {errorMessage}
          </p>
          
          {showRetry && error.canRetry && !needsSignIn && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}
          
          {needsSignIn && (
            <Button
              size="sm"
              onClick={() => window.location.href = '/auth'}
            >
              <LogIn className="w-3 h-3 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ==================== AUTH ERROR BOUNDARY HOC ====================

interface WithAuthErrorBoundaryProps {
  fallback?: React.ComponentType<any>
  onError?: (error: any) => void
}

export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthErrorBoundaryProps = {}
) {
  const WrappedComponent: React.FC<P> = (props) => {
    const { error, isLoading } = useAuth()

    if (error && !isLoading) {
      const FallbackComponent = options.fallback || AuthErrorDisplay
      return <FallbackComponent {...props} />
    }

    return <Component {...props} />
  }

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}