import { useEffect, useState } from 'react'
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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  useEffect(() => {
    console.log('🔄 ClerkAuthSync: Component mounted', { isLoaded, isSignedIn })

    // Wait for Clerk to finish loading
    if (!isLoaded) {
      console.log('⏳ ClerkAuthSync: Waiting for Clerk to load...')
      setSyncStatus('idle')
      return
    }

    console.log('✓ ClerkAuthSync: Clerk loaded', { isSignedIn })

    // If user is not signed in, clear the token
    if (!isSignedIn) {
      console.log('🚪 ClerkAuthSync: User not signed in, clearing token')
      setAuthToken(null)
      setSyncStatus('idle')
      return
    }

    // Sync the Clerk token with the API client
    const syncToken = async () => {
      try {
        setSyncStatus('syncing')
        console.log('🔐 ClerkAuthSync: Retrieving Clerk session token...')

        const token = await getToken()
        console.log('📋 ClerkAuthSync: Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null')

        if (token) {
          setAuthToken(token)
          setSyncStatus('success')
          console.log('✅ ClerkAuthSync: Token synced successfully')
          console.log('📦 ClerkAuthSync: Token stored in localStorage and memory')
        } else {
          console.warn('⚠️ ClerkAuthSync: No token received from Clerk')
          setAuthToken(null)
          setSyncStatus('error')
        }
      } catch (error) {
        console.error('❌ ClerkAuthSync: Failed to retrieve token:', error)
        setAuthToken(null)
        setSyncStatus('error')
      }
    }

    console.log('🚀 ClerkAuthSync: Starting initial token sync...')
    syncToken()

    // Re-sync token every 5 minutes to ensure it stays fresh
    const interval = setInterval(() => {
      console.log('🔄 ClerkAuthSync: Refreshing token...')
      syncToken()
    }, 5 * 60 * 1000)

    return () => {
      console.log('🛑 ClerkAuthSync: Component unmounting, clearing interval')
      clearInterval(interval)
    }
  }, [getToken, isLoaded, isSignedIn])

  // This component doesn't render anything
  return null
}
