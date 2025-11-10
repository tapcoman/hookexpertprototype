import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import ClerkHeader from '@/components/clerk/ClerkHeader'

/**
 * Clerk Test Page
 * Simple page to verify Clerk authentication is working
 */
export default function ClerkTestPage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <ClerkHeader />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6">Clerk Authentication Test</h1>

          <SignedOut>
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-4">You are signed out</h2>
              <p className="text-gray-600 mb-6">
                Sign in to test Clerk authentication
              </p>
              <SignInButton mode="modal">
                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                  Sign In to Test
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-900">Authentication Working!</h3>
                  <p className="text-sm text-green-700">Clerk is successfully integrated</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">User Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Clerk ID:</dt>
                      <dd className="font-mono text-xs">{user?.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd>{user?.primaryEmailAddress?.emailAddress}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd>{user?.firstName} {user?.lastName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email Verified:</dt>
                      <dd>
                        {user?.primaryEmailAddress?.verification?.status === 'verified' ? (
                          <span className="text-green-600">✓ Verified</span>
                        ) : (
                          <span className="text-yellow-600">⚠ Pending</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Authentication Methods</h3>
                  <ul className="space-y-2 text-sm">
                    {user?.emailAddresses && user.emailAddresses.length > 0 && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span>Email/Password</span>
                      </li>
                    )}
                    {user?.externalAccounts?.map((account) => (
                      <li key={account.id} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{account.provider} OAuth</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-900">Next Steps</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>✓ Clerk Provider configured</li>
                    <li>✓ Authentication working</li>
                    <li>→ Integrate with backend API</li>
                    <li>→ Set up user sync webhooks</li>
                    <li>→ Migrate existing users</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-4">
                  Test the user menu in the header (top right corner)
                </p>
                <UserButton
                  afterSignOutUrl="/clerk-test"
                  appearance={{
                    elements: {
                      avatarBox: "w-12 h-12"
                    }
                  }}
                />
              </div>
            </div>
          </SignedIn>
        </div>
      </div>
    </div>
  )
}
