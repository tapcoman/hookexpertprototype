import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setClerkTokenGetter } from '@/lib/api'

/**
 * ClerkAuthSync - Bridges Clerk authentication with the API client
 *
 * This component registers Clerk's getToken function with the API client.
 * Instead of caching tokens (which expire quickly), the API client will
 * fetch a fresh token from Clerk on every request.
 *
 * Must be placed inside ClerkProvider in the component tree.
 */
export function ClerkAuthSync() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    console.log('🔄 ClerkAuthSync: Component mounted', { isLoaded, isSignedIn })

    // Wait for Clerk to finish loading
    if (!isLoaded) {
      console.log('⏳ ClerkAuthSync: Waiting for Clerk to load...')
      return
    }

    console.log('✓ ClerkAuthSync: Clerk loaded', { isSignedIn })

    // If user is signed in, register the token getter
    if (isSignedIn) {
      console.log('✅ ClerkAuthSync: Registering Clerk token getter with API client')
      setClerkTokenGetter(getToken)
    } else {
      console.log('🚪 ClerkAuthSync: User not signed in, clearing token getter')
      setClerkTokenGetter(null)
    }

    // Cleanup: remove token getter when component unmounts or user signs out
    return () => {
      console.log('🛑 ClerkAuthSync: Component unmounting, clearing token getter')
      setClerkTokenGetter(null)
    }
  }, [getToken, isLoaded, isSignedIn])

  // This component doesn't render anything
  return null
}
