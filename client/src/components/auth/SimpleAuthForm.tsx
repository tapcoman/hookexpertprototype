import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { validatePassword } from '@/lib/simpleAuth'
import { Eye, EyeOff } from 'lucide-react'

// ==================== VALIDATION SCHEMAS ====================

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignInFormData = z.infer<typeof signInSchema>
type SignUpFormData = z.infer<typeof signUpSchema>

// ==================== COMPONENT ====================

interface SimpleAuthFormProps {
  mode?: 'signin' | 'signup'
  onSuccess?: () => void
  className?: string
}

export const SimpleAuthForm: React.FC<SimpleAuthFormProps> = ({ 
  mode = 'signin',
  onSuccess,
  className = ''
}) => {
  const [formMode, setFormMode] = useState<'signin' | 'signup'>(mode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] })

  const { signIn, signUp, isLoading, error, clearError, getErrorMessage } = useAuth()

  // Form setup for sign in
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Form setup for sign up
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  // Handle mode switch
  const switchMode = () => {
    setFormMode(formMode === 'signin' ? 'signup' : 'signin')
    clearError()
    signInForm.reset()
    signUpForm.reset()
    setPasswordValidation({ isValid: true, errors: [] })
  }

  // Handle password validation for sign up
  const handlePasswordChange = (password: string) => {
    if (formMode === 'signup' && password) {
      const validation = validatePassword(password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation({ isValid: true, errors: [] })
    }
  }

  // Handle sign in submission
  const handleSignIn = async (data: SignInFormData) => {
    try {
      clearError()
      await signIn(data.email, data.password)
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the auth context
      console.error('Sign in error:', error)
    }
  }

  // Handle sign up submission
  const handleSignUp = async (data: SignUpFormData) => {
    try {
      clearError()
      await signUp(data.email, data.password, data.firstName, data.lastName)
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the auth context
      console.error('Sign up error:', error)
    }
  }

  const currentForm = formMode === 'signin' ? signInForm : signUpForm
  const isFormLoading = isLoading || currentForm.formState.isSubmitting

  return (
    <Card className={`p-6 w-full max-w-md mx-auto ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {formMode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formMode === 'signin' 
              ? 'Sign in to your Hook Line Studio account'
              : 'Get started with Hook Line Studio'
            }
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {getErrorMessage()}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Sign In Form */}
        {formMode === 'signin' && (
          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                {...signInForm.register('email')}
                disabled={isFormLoading}
              />
              {signInForm.formState.errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {signInForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...signInForm.register('password')}
                  disabled={isFormLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {signInForm.formState.errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {signInForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isFormLoading}
            >
              {isFormLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        )}

        {/* Sign Up Form */}
        {formMode === 'signup' && (
          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-firstname">First Name</Label>
                <Input
                  id="signup-firstname"
                  type="text"
                  placeholder="First name"
                  {...signUpForm.register('firstName')}
                  disabled={isFormLoading}
                />
                {signUpForm.formState.errors.firstName && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-lastname">Last Name</Label>
                <Input
                  id="signup-lastname"
                  type="text"
                  placeholder="Last name"
                  {...signUpForm.register('lastName')}
                  disabled={isFormLoading}
                />
                {signUpForm.formState.errors.lastName && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {signUpForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                {...signUpForm.register('email')}
                disabled={isFormLoading}
              />
              {signUpForm.formState.errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {signUpForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  {...signUpForm.register('password', {
                    onChange: (e) => handlePasswordChange(e.target.value)
                  })}
                  disabled={isFormLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {signUpForm.formState.errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {signUpForm.formState.errors.password.message}
                </p>
              )}

              {/* Password Requirements */}
              {!passwordValidation.isValid && passwordValidation.errors.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="font-medium">Password requirements:</p>
                  {passwordValidation.errors.map((error, index) => (
                    <p key={index} className="text-red-600 dark:text-red-400">• {error}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...signUpForm.register('confirmPassword')}
                  disabled={isFormLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isFormLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {signUpForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {signUpForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isFormLoading || !passwordValidation.isValid}
            >
              {isFormLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        )}

        {/* Mode Switch */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              disabled={isFormLoading}
            >
              {formMode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </Card>
  )
}

export default SimpleAuthForm