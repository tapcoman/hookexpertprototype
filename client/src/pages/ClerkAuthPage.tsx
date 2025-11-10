import { SignIn, SignUp, useSignIn, useSignUp } from '@clerk/clerk-react'
import { useState } from 'react'

/**
 * Clerk Authentication Page
 * Handles both Sign In and Sign Up flows with Clerk components
 */
export default function ClerkAuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const { isLoaded: signInLoaded } = useSignIn()
  const { isLoaded: signUpLoaded } = useSignUp()

  const isLoaded = mode === 'signin' ? signInLoaded : signUpLoaded

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Hook Line Studio
          </h1>
          <p className="text-gray-600">
            {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Clerk Component */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {mode === 'signin' ? (
            <SignIn
              routing="path"
              path="/auth"
              signUpUrl="#"
              afterSignInUrl="/app"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none",
                  formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
                  footerActionLink: "text-purple-600 hover:text-purple-700"
                }
              }}
            />
          ) : (
            <SignUp
              routing="path"
              path="/auth"
              signInUrl="#"
              afterSignUpUrl="/onboarding"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none",
                  formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
                  footerActionLink: "text-purple-600 hover:text-purple-700"
                }
              }}
            />
          )}

          {/* Toggle between Sign In / Sign Up */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No Credit Card</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
