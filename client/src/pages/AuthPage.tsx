import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { PublicRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ==================== TYPES ====================

type AuthMode = 'signin' | 'signup' | 'reset'

// ==================== COMPONENT ====================

const AuthPageContent: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const [, setLocation] = useLocation()
  const { signIn, signUp, signInWithGoogle, resetPassword, clearError } = useAuth()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  // ==================== FORM HANDLERS ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    clearError()
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
        showSuccessNotification('Welcome back!', 'You have been signed in successfully.')
        setLocation('/app')
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          showErrorNotification('Password Mismatch', 'Passwords do not match.')
          return
        }
        await signUp(email, password)
        showSuccessNotification('Account Created!', 'Please check your email to verify your account.')
        setLocation('/onboarding')
      } else if (mode === 'reset') {
        await resetPassword(email)
        showSuccessNotification('Reset Email Sent', 'Check your email for password reset instructions.')
        setMode('signin')
      }
    } catch (error: any) {
      showErrorNotification('Authentication Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (isLoading) return

    clearError()
    setIsLoading(true)

    try {
      await signInWithGoogle()
      showSuccessNotification('Welcome!', 'You have been signed in with Google.')
      setLocation('/app')
    } catch (error: any) {
      showErrorNotification('Google Sign In Failed', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== RENDER HELPERS ====================

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome back'
      case 'signup':
        return 'Create your account'
      case 'reset':
        return 'Reset your password'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'signin':
        return 'Sign in to your Hook Line Studio account'
      case 'signup':
        return 'Start creating viral hooks today'
      case 'reset':
        return 'Enter your email to receive reset instructions'
    }
  }

  const getButtonText = () => {
    if (isLoading) return <LoadingSpinner size="sm" />
    
    switch (mode) {
      case 'signin':
        return 'Sign In'
      case 'signup':
        return 'Create Account'
      case 'reset':
        return 'Send Reset Email'
    }
  }

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-card rounded-lg shadow-lg border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              {getTitle()}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              {getSubtitle()}
            </motion.p>
          </div>

          {/* Google Sign In */}
          {mode !== 'reset' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-md font-medium flex items-center justify-center gap-3 transition-colors mb-6 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>
          )}

          {/* Divider */}
          {mode !== 'reset' && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>
          )}

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            )}

            {/* Confirm Password */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {getButtonText()}
            </button>
          </motion.form>

          {/* Mode Switcher */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center space-y-2"
          >
            {mode === 'signin' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-sm text-muted-foreground">
                  Forgot your password?{' '}
                  <button
                    onClick={() => setMode('reset')}
                    className="text-primary hover:underline font-medium"
                  >
                    Reset it
                  </button>
                </p>
              </>
            )}

            {mode === 'signup' && (
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================

const AuthPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Auth">
      <PublicRoute redirectIfAuthenticated redirectTo="/app">
        <AuthPageContent />
      </PublicRoute>
    </PageErrorBoundary>
  )
}

export default AuthPage