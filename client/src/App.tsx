import { Router, Route, Switch } from 'wouter'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Providers
import { AppProvider } from '@/contexts/AppContext'
import { queryClient } from '@/lib/react-query'

// Components
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toaster } from '@/components/ui/Toaster'
import SimplifiedMobileNav from '@/components/mobile/SimplifiedMobileNav'
import {
  ClerkProtectedRoute,
  ClerkPublicRoute,
  ClerkOnboardingRoute,
  ClerkRootRedirect
} from '@/components/routing/ClerkProtectedRoute'

// Pages
import ClerkAuthPage from '@/pages/ClerkAuthPage'
import ClerkTestPage from '@/pages/ClerkTestPage'
import OnboardingPage from '@/pages/OnboardingPage'
import ProfilePage from '@/pages/ProfilePage'
import PricingPage from '@/pages/PricingPage'
import BillingPage from '@/pages/BillingPage'
import ExactApp from '@/components/hle/exact-app'
import NotFoundPage from '@/pages/NotFoundPage'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Router>
            <Switch>
              {/* Root Route - Smart redirect based on auth and onboarding */}
              <Route path="/" component={ClerkRootRedirect} />

              {/* Public Routes */}
              <Route path="/auth">
                <ClerkPublicRoute redirectIfAuthenticated={true} redirectTo="/app">
                  <ClerkAuthPage />
                </ClerkPublicRoute>
              </Route>

              {/* Clerk Test Page */}
              <Route path="/clerk-test">
                <ClerkTestPage />
              </Route>

              <Route path="/pricing">
                <ClerkPublicRoute>
                  <PricingPage />
                </ClerkPublicRoute>
              </Route>

              {/* Onboarding Route */}
              <Route path="/onboarding">
                <ClerkOnboardingRoute>
                  <OnboardingPage />
                </ClerkOnboardingRoute>
              </Route>

              {/* Protected App Routes */}
              <Route path="/app">
                <ClerkProtectedRoute>
                  <ExactApp />
                </ClerkProtectedRoute>
              </Route>

              <Route path="/profile">
                <ClerkProtectedRoute>
                  <ProfilePage />
                </ClerkProtectedRoute>
              </Route>

              <Route path="/billing">
                <ClerkProtectedRoute>
                  <BillingPage />
                </ClerkProtectedRoute>
              </Route>

              {/* Redirect old marketing URLs to root */}
              <Route path="/features" component={ClerkRootRedirect} />
              <Route path="/about" component={ClerkRootRedirect} />
              <Route path="/contact" component={ClerkRootRedirect} />

              {/* 404 Route */}
              <Route component={NotFoundPage} />
            </Switch>

            {/* Simplified Mobile Navigation */}
            <SimplifiedMobileNav />
          </Router>

          {/* React Query Devtools (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}

          {/* Toast Notifications */}
          <Toaster />
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App