import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setAuthToken } from '@/lib/api'

/**
 * ClerkAuthSync - Synchronizes Clerk session tokens with the API client
 *
 * This component bridges Clerk authentication with our legacy API client.
 * It retrieves the Clerk session token and passes it to setAuthToken() so
 * all API calls include the proper Authorization header.
 *
 * Must be placed inside ClerkProvider in the component tree.
 */
export function ClerkAuthSync() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    // Wait for Clerk to finish loading
    if (!isLoaded) {
      console.log('🔄 ClerkAuthSync: Waiting for Clerk to load...')
      return
    }

    // If user is not signed in, clear the token
    if (!isSignedIn) {
      console.log('🚪 ClerkAuthSync: User not signed in, clearing token')
      setAuthToken(null)
      return
    }

    // Sync the Clerk token with the API client
    const syncToken = async () => {
      try {
        console.log('🔐 ClerkAuthSync: Retrieving Clerk session token...')
        const token = await getToken()

        if (token) {
          setAuthToken(token)
          console.log('✅ ClerkAuthSync: Token synced successfully')
        } else {
          console.warn('⚠️ ClerkAuthSync: No token received from Clerk')
          setAuthToken(null)
        }
      } catch (error) {
        console.error('❌ ClerkAuthSync: Failed to retrieve token:', error)
        setAuthToken(null)
      }
    }

    syncToken()

    // Re-sync token every 5 minutes to ensure it stays fresh
    const interval = setInterval(syncToken, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [getToken, isLoaded, isSignedIn])

  // This component doesn't render anything
  return null
}
