import React from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { SimpleAuthForm } from '@/components/auth/SimpleAuthForm'
import Container from '@/components/layout/Container'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'

// ==================== COMPONENT ====================

const SimpleAuthPageContent: React.FC = () => {
  const [, setLocation] = useLocation()
  const { user } = useAuth()
  const { showSuccessNotification } = useNotifications()

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      setLocation('/app')
    }
  }, [user, setLocation])

  const handleAuthSuccess = () => {
    showSuccessNotification('Welcome!', 'You have been signed in successfully.')
    setLocation('/app')
  }

  return (
    <Container className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 mx-0 max-w-none overflow-hidden">
          <div className="absolute left-1/2 top-0 ml-[-38rem] h-[25rem] w-[81.25rem] dark:[mask-image:linear-gradient(white,transparent)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#36b49f] to-[#DBFF75] opacity-40 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:opacity-100"></div>
            <svg
              viewBox="0 0 1113 440"
              aria-hidden="true"
              className="absolute left-1/2 top-0 ml-[-19rem] w-[69.5625rem] fill-white blur-[26px] dark:hidden"
            >
              <path d="m.016 439.5l1112.482-439.5-.016 439.5z" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Hook Line Studio
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              AI-powered video hooks that convert
            </p>
          </motion.div>
        </div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SimpleAuthForm 
            onSuccess={handleAuthSuccess}
            className="shadow-lg"
          />
        </motion.div>

        {/* Features highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>AI-Generated Hooks</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Psychology-Based</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Multi-Platform</span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400"
        >
          <p>
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </Container>
  )
}

// ==================== WRAPPED COMPONENT ====================

const SimpleAuthPage: React.FC = () => {
  return (
    <PageErrorBoundary>
      <SimpleAuthPageContent />
    </PageErrorBoundary>
  )
}

export default SimpleAuthPage