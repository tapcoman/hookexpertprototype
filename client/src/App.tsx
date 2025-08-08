import { Router, Route, Switch } from 'wouter'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Providers
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext'
import { AppProvider } from '@/contexts/AppContext'
import { queryClient } from '@/lib/react-query'

// Components
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toaster } from '@/components/ui/Toaster'
import SimplifiedMobileNav from '@/components/mobile/SimplifiedMobileNav'
import { ProtectedRoute, PublicRoute, OnboardingRoute } from '@/components/routing/SimpleProtectedRoute'
import { RootRedirect } from '@/components/routing/RootRedirect'

// Pages
import SimpleAuthPage from '@/pages/SimpleAuthPage'
import OnboardingPage from '@/pages/OnboardingPage'
import MainAppPage from '@/pages/MainAppPage'
import FavoritesPage from '@/pages/FavoritesPage'
import HistoryPage from '@/pages/HistoryPage'
import ProfilePage from '@/pages/ProfilePage'
import PricingPage from '@/pages/PricingPage'
import BillingPage from '@/pages/BillingPage'
import TrendRadarPage from '@/pages/TrendRadarPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Marketing pages (kept for reference, not used in routing)
// import LandingPage from '@/pages/LandingPage'
// import FeaturesPage from '@/pages/FeaturesPage'
// import AboutPage from '@/pages/AboutPage'
// import ContactPage from '@/pages/ContactPage'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SimpleAuthProvider>
          <AppProvider>
            <Router>
              <Switch>
                  {/* Root Route - Redirects based on auth status */}
                  <Route path="/" component={RootRedirect} />
                  
                  {/* Public Routes */}
                  <Route path="/auth">
                    <PublicRoute redirectIfAuthenticated={true} redirectTo="/app">
                      <SimpleAuthPage />
                    </PublicRoute>
                  </Route>
                  
                  <Route path="/pricing">
                    <PublicRoute>
                      <PricingPage />
                    </PublicRoute>
                  </Route>
                  
                  {/* Onboarding Route */}
                  <Route path="/onboarding">
                    <OnboardingRoute>
                      <OnboardingPage />
                    </OnboardingRoute>
                  </Route>
                  
                  {/* Protected App Routes */}
                  <Route path="/app">
                    <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                      <MainAppPage />
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/favorites">
                    <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                      <FavoritesPage />
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/history">
                    <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                      <HistoryPage />
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/profile">
                    <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                      <ProfilePage />
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/billing">
                    <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                      <BillingPage />
                    </ProtectedRoute>
                  </Route>

                  <Route path="/trends">
                    <ProtectedRoute requireAuth={true} requireOnboarding={true}>
                      <TrendRadarPage />
                    </ProtectedRoute>
                  </Route>
                  
                  {/* Redirect old marketing URLs to auth */}
                  <Route path="/features" component={RootRedirect} />
                  <Route path="/about" component={RootRedirect} />
                  <Route path="/contact" component={RootRedirect} />
                  
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
        </SimpleAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App