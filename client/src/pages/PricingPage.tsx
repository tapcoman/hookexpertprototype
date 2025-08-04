import React from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/react-query'
import { Check } from 'lucide-react'

const PricingPageContent: React.FC = () => {
  const { user } = useAuth()
  const { showErrorNotification } = useNotifications()

  const { data: plans, isLoading } = useQuery({
    queryKey: queryKeys.subscriptionPlans(),
    queryFn: async () => {
      const response = await api.payments.getPlans()
      return response.data
    },
  })

  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await api.payments.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      })
      return response.data
    },
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (error: any) => {
      showErrorNotification('Checkout Failed', error.message)
    },
  })

  const handleSubscribe = (priceId: string) => {
    if (!user) {
      window.location.href = '/auth'
      return
    }
    createCheckoutMutation.mutate(priceId)
  }

  if (isLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-96" text="Loading plans..." />
  }

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground">
          Create viral hooks that drive engagement and grow your audience
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans?.map((plan: any, index: number) => {
          const isCurrentPlan = user?.subscriptionPlan === plan.name
          const isPopular = plan.isPopular
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-card border rounded-lg p-6 ${
                isPopular ? 'border-primary shadow-lg' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.displayName}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {plan.proGenerationsLimit === null
                      ? 'Unlimited pro generations'
                      : `${plan.proGenerationsLimit} pro generations`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {plan.draftGenerationsLimit === null
                      ? 'Unlimited draft generations'
                      : `${plan.draftGenerationsLimit} draft generations`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {plan.teamSeats} team seat{plan.teamSeats > 1 ? 's' : ''}
                  </span>
                </div>
                {plan.hasAdvancedAnalytics && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Advanced analytics</span>
                  </div>
                )}
                {plan.hasPrioritySupport && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Priority support</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSubscribe(plan.stripePriceId)}
                disabled={createCheckoutMutation.isPending || isCurrentPlan}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCurrentPlan
                    ? 'bg-muted text-muted-foreground'
                    : isPopular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {createCheckoutMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : plan.name === 'free' ? (
                  'Get Started Free'
                ) : (
                  `Subscribe to ${plan.displayName}`
                )}
              </button>

              {plan.trialPeriodDays > 0 && !isCurrentPlan && plan.name !== 'free' && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {plan.trialPeriodDays} day free trial
                </p>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-16"
      >
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              What's the difference between pro and draft generations?
            </h3>
            <p className="text-sm text-muted-foreground">
              Pro generations use our most advanced AI model for higher quality hooks, 
              while draft generations use a faster model that's still very effective.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You'll continue to have 
              access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-sm text-muted-foreground">
              We offer a 30-day money-back guarantee if you're not satisfied with 
              your subscription.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              How do team seats work?
            </h3>
            <p className="text-sm text-muted-foreground">
              Team seats allow multiple users to access your account with shared 
              generation limits and unified billing.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const PricingPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Pricing">
      <PricingPageContent />
    </PageErrorBoundary>
  )
}

export default PricingPage