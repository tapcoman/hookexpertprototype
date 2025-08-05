/**
 * Authentication Error Handling System
 * Provides specific, actionable error types and user-friendly messages
 */

// ==================== ERROR TYPES ====================

export enum AuthErrorType {
  // Firebase Token Errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  TOKEN_MISSING = 'TOKEN_MISSING',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  
  // Database Errors
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_SYNC_FAILED = 'USER_SYNC_FAILED',
  
  // Firebase Service Errors
  FIREBASE_UNAVAILABLE = 'FIREBASE_UNAVAILABLE',
  FIREBASE_CONFIG_ERROR = 'FIREBASE_CONFIG_ERROR',
  FIREBASE_QUOTA_EXCEEDED = 'FIREBASE_QUOTA_EXCEEDED',
  
  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  RATE_LIMITED = 'RATE_LIMITED'
}

export interface AuthError {
  type: AuthErrorType
  message: string
  userMessage: string
  canRetry: boolean
  retryAfter?: number // seconds
  actionRequired?: string[]
  technicalDetails?: any
}

// ==================== ERROR CLASSIFICATION ====================

export function classifyAuthError(error: any): AuthError {
  const errorMessage = error?.message || error?.error || 'Unknown error'
  const statusCode = error?.status || error?.statusCode

  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage: 'Unable to connect to our servers. Please check your internet connection.',
      canRetry: true,
      retryAfter: 5,
      actionRequired: ['Check your internet connection', 'Try again in a few moments']
    }
  }

  // Timeout errors
  if (error?.code === 'TIMEOUT' || errorMessage.includes('timeout')) {
    return {
      type: AuthErrorType.TIMEOUT_ERROR,
      message: errorMessage,
      userMessage: 'The request took too long to complete. Please try again.',
      canRetry: true,
      retryAfter: 10,
      actionRequired: ['Try again', 'Check your connection speed']
    }
  }

  // Server status codes
  switch (statusCode) {
    case 401:
      if (errorMessage.includes('expired') || errorMessage.includes('token')) {
        return {
          type: AuthErrorType.TOKEN_EXPIRED,
          message: errorMessage,
          userMessage: 'Your session has expired. Please sign in again.',
          canRetry: false,
          actionRequired: ['Sign in again']
        }
      }
      return {
        type: AuthErrorType.TOKEN_INVALID,
        message: errorMessage,
        userMessage: 'Authentication failed. Please sign in again.',
        canRetry: false,
        actionRequired: ['Sign in again']
      }

    case 429:
      return {
        type: AuthErrorType.RATE_LIMITED,
        message: errorMessage,
        userMessage: 'Too many attempts. Please wait before trying again.',
        canRetry: true,
        retryAfter: 60,
        actionRequired: ['Wait a moment', 'Try again later']
      }

    case 500:
      if (errorMessage.includes('database') || errorMessage.includes('connection')) {
        return {
          type: AuthErrorType.DATABASE_CONNECTION,
          message: errorMessage,
          userMessage: 'Our servers are experiencing issues. Please try again shortly.',
          canRetry: true,
          retryAfter: 30,
          actionRequired: ['Try again in a few minutes', 'Contact support if issue persists']
        }
      }
      return {
        type: AuthErrorType.SERVER_UNAVAILABLE,
        message: errorMessage,
        userMessage: 'Our servers are temporarily unavailable. Please try again shortly.',
        canRetry: true,
        retryAfter: 30,
        actionRequired: ['Try again in a few minutes']
      }

    case 502:
    case 503:
    case 504:
      return {
        type: AuthErrorType.SERVER_UNAVAILABLE,
        message: errorMessage,
        userMessage: 'Our services are temporarily unavailable. Please try again shortly.',
        canRetry: true,
        retryAfter: 60,
        actionRequired: ['Try again in a few minutes', 'Check our status page']
      }
  }

  // Firebase-specific errors
  if (error?.code) {
    switch (error.code) {
      case 'auth/id-token-expired':
        return {
          type: AuthErrorType.TOKEN_EXPIRED,
          message: errorMessage,
          userMessage: 'Your session has expired. Please sign in again.',
          canRetry: false,
          actionRequired: ['Sign in again']
        }

      case 'auth/id-token-revoked':
        return {
          type: AuthErrorType.TOKEN_REVOKED,
          message: errorMessage,
          userMessage: 'Your session has been revoked. Please sign in again.',
          canRetry: false,
          actionRequired: ['Sign in again']
        }

      case 'auth/invalid-id-token':
        return {
          type: AuthErrorType.TOKEN_INVALID,
          message: errorMessage,
          userMessage: 'Invalid authentication. Please sign in again.',
          canRetry: false,
          actionRequired: ['Sign in again']
        }

      case 'auth/project-not-found':
      case 'auth/app-not-authorized':
        return {
          type: AuthErrorType.FIREBASE_CONFIG_ERROR,
          message: errorMessage,
          userMessage: 'Authentication service configuration error. Please contact support.',
          canRetry: false,
          actionRequired: ['Contact support']
        }

      case 'auth/quota-exceeded':
        return {
          type: AuthErrorType.FIREBASE_QUOTA_EXCEEDED,
          message: errorMessage,
          userMessage: 'Authentication service is temporarily overloaded. Please try again later.',
          canRetry: true,
          retryAfter: 300,
          actionRequired: ['Try again in a few minutes']
        }
    }
  }

  // Default unknown error
  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    canRetry: true,
    retryAfter: 30,
    actionRequired: ['Try again', 'Contact support if issue persists'],
    technicalDetails: error
  }
}

// ==================== RETRY LOGIC ====================

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffFactor: number
  retryableErrors: AuthErrorType[]
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: [
    AuthErrorType.NETWORK_ERROR,
    AuthErrorType.TIMEOUT_ERROR,
    AuthErrorType.SERVER_UNAVAILABLE,
    AuthErrorType.DATABASE_CONNECTION,
    AuthErrorType.FIREBASE_QUOTA_EXCEEDED
  ]
}

export function shouldRetry(error: AuthError, attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  return (
    attempt < config.maxAttempts &&
    error.canRetry &&
    config.retryableErrors.includes(error.type)
  )
}

export function calculateRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
    config.maxDelay
  )
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay
  return Math.floor(delay + jitter)
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==================== ERROR RECOVERY UTILITIES ====================

export function getRecoveryInstructions(error: AuthError): string[] {
  const instructions = [...(error.actionRequired || [])]
  
  // Add general recovery steps based on error type
  switch (error.type) {
    case AuthErrorType.NETWORK_ERROR:
      instructions.push(
        'Refresh the page',
        'Check if other websites are working',
        'Try switching between WiFi and mobile data'
      )
      break
      
    case AuthErrorType.TOKEN_EXPIRED:
    case AuthErrorType.TOKEN_INVALID:
    case AuthErrorType.TOKEN_REVOKED:
      instructions.push(
        'Clear your browser cache',
        'Try signing in from a different device',
        'Contact support if you continue having issues'
      )
      break
      
    case AuthErrorType.SERVER_UNAVAILABLE:
      instructions.push(
        'Check our status page for updates',
        'Try again in a few minutes',
        'Follow us on social media for service updates'
      )
      break
  }
  
  return [...new Set(instructions)] // Remove duplicates
}

export function isAuthenticationError(error: AuthError): boolean {
  return [
    AuthErrorType.TOKEN_EXPIRED,
    AuthErrorType.TOKEN_INVALID,
    AuthErrorType.TOKEN_REVOKED,
    AuthErrorType.TOKEN_MISSING
  ].includes(error.type)
}

export function requiresSignIn(error: AuthError): boolean {
  return isAuthenticationError(error) && !error.canRetry
}

// ==================== ERROR LOGGING ====================

export function logAuthError(error: AuthError, context?: any): void {
  console.error('Authentication Error:', {
    type: error.type,
    message: error.message,
    userMessage: error.userMessage,
    canRetry: error.canRetry,
    retryAfter: error.retryAfter,
    context,
    timestamp: new Date().toISOString()
  })
}