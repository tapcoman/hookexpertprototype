import React from 'react'
import { Router, Route, Switch } from 'wouter'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Providers
import { AuthProvider } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'
import { queryClient } from '@/lib/react-query'

// Components
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toaster } from '@/components/ui/Toaster'
import { MobileLayout } from '@/components/mobile'

// Pages
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import OnboardingPage from '@/pages/OnboardingPage'
import MainAppPage from '@/pages/MainAppPage'
import FavoritesPage from '@/pages/FavoritesPage'
import HistoryPage from '@/pages/HistoryPage'
import ProfilePage from '@/pages/ProfilePage'
import PricingPage from '@/pages/PricingPage'
import BillingPage from '@/pages/BillingPage'
import NotFoundPage from '@/pages/NotFoundPage'

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <Router>
              <MobileLayout>
                <Switch>
                  {/* Public Routes */}
                  <Route path="/" component={LandingPage} />
                  <Route path="/pricing" component={PricingPage} />
                  
                  {/* Authentication Routes */}
                  <Route path="/auth" component={AuthPage} />
                  <Route path="/onboarding" component={OnboardingPage} />
                  
                  {/* Protected App Routes */}
                  <Route path="/app" component={MainAppPage} />
                  <Route path="/favorites" component={FavoritesPage} />
                  <Route path="/history" component={HistoryPage} />
                  <Route path="/profile" component={ProfilePage} />
                  <Route path="/billing" component={BillingPage} />
                  
                  {/* 404 Route */}
                  <Route component={NotFoundPage} />
                </Switch>
              </MobileLayout>
            </Router>
            
            {/* React Query Devtools (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
            
            {/* Toast Notifications */}
            <Toaster />
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
EOF < /dev/null