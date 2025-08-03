import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

// ==================== AUTHENTICATION FUNCTIONS ====================

export const firebaseAuth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Firebase sign up error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Firebase sign in error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error: any) {
      console.error('Firebase Google sign in error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error('Firebase sign out error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  // Send password reset email
  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('Firebase password reset error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  // Confirm password reset
  confirmPasswordReset: async (oobCode: string, newPassword: string) => {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
    } catch (error: any) {
      console.error('Firebase confirm password reset error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        throw new Error('No authenticated user found')
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)
    } catch (error: any) {
      console.error('Firebase update password error:', error)
      throw new Error(getFirebaseErrorMessage(error.code))
    }
  },

  // Get current user token
  getCurrentUserToken: async (): Promise<string | null> => {
    try {
      const user = auth.currentUser
      if (!user) return null
      
      return await user.getIdToken()
    } catch (error: any) {
      console.error('Firebase get token error:', error)
      return null
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback)
  },
}

// ==================== ERROR HANDLING ====================

function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups and try again.'
    case 'auth/invalid-action-code':
      return 'Invalid or expired reset link.'
    case 'auth/expired-action-code':
      return 'Reset link has expired. Please request a new one.'
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.'
    default:
      return 'An error occurred. Please try again.'
  }
}

// ==================== UTILITY FUNCTIONS ====================

export const formatFirebaseUser = (user: User) => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  emailVerified: user.emailVerified,
  createdAt: user.metadata.creationTime,
  lastSignIn: user.metadata.lastSignInTime,
})

export const isFirebaseError = (error: any): boolean => {
  return error?.code?.startsWith('auth/')
}

// Export Firebase app and auth for direct use if needed
export { app as firebaseApp }
export default firebaseAuth