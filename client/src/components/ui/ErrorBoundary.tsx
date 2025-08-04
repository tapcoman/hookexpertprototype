import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { analytics } from '@/lib/analytics'

// ==================== TYPES ====================

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ==================== ERROR BOUNDARY COMPONENT ====================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Report to analytics
    analytics.trackError({
      errorMessage: error.message,
      errorStack: error.stack || '',
      type: 'js_error',
      additionalContext: {
        componentStack: errorInfo.componentStack,
        location: window.location.href,
        userAgent: navigator.userAgent
      }
    })
    
    // Log to console for development
    console.error('Error reported:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  private handleRetry = () => {
    analytics.track('error_boundary_retry', {
      errorMessage: this.state.error?.message,
      location: window.location.href
    })
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center"
          >
            <div className="bg-card rounded-lg p-8 shadow-lg border">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </motion.div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              
              <p className="text-muted-foreground mb-6">
                We encountered an unexpected error. This has been reported and we'll look into it.
              </p>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleRetry}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleGoHome}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </motion.button>
              </div>

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// ==================== HOOK-BASED ERROR BOUNDARY ====================

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-card rounded-lg p-8 shadow-lg border">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>

          <button
            onClick={resetErrorBoundary}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ==================== QUERY ERROR BOUNDARY ====================

interface QueryErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  fallback,
}) => {
  return (
    <ErrorBoundary
      fallback={
        fallback ? (
          <ErrorFallbackWrapper fallback={fallback} />
        ) : undefined
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Helper component for custom fallback
const ErrorFallbackWrapper: React.FC<{
  fallback: (error: Error, reset: () => void) => ReactNode
}> = ({ fallback }) => {
  const [error] = React.useState(new Error('Query error'))
  const reset = () => window.location.reload()

  return <>{fallback(error, reset)}</>
}

// ==================== PAGE ERROR BOUNDARY ====================

interface PageErrorBoundaryProps {
  children: ReactNode
  pageName?: string
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({
  children,
  pageName = 'page',
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`Error in ${pageName}:`, error, errorInfo)
        // Report page-specific errors
      }}
    >
      {children}
    </ErrorBoundary>
  )
}