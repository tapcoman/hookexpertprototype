import React from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/react-query'
import { CreditCard, Calendar, DollarSign, FileText } from 'lucide-react'

const BillingPageContent: React.FC = () => {
  const { user } = useAuth()
  const { showSuccessNotification, showErrorNotification } = useNotifications()

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: queryKeys.userSubscription(),
    queryFn: async () => {
      const response = await api.payments.getSubscriptionOverview()
      return response.data
    },
    enabled: !!user,
  })

  const { data: paymentHistory, isLoading: historyLoading } = useQuery({
    queryKey: queryKeys.paymentHistory(),
    queryFn: async () => {
      const response = await api.payments.getPaymentHistory()
      return response.data
    },
    enabled: !!user,
  })

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await api.payments.createBillingPortal({
        returnUrl: window.location.href,
      })
      return response.data
    },
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (error: any) => {
      showErrorNotification('Portal Access Failed', error.message)
    },
  })

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await api.payments.cancelSubscription()
    },
    onSuccess: () => {
      showSuccessNotification('Subscription Canceled', 'Your subscription will end at the current billing period.')
    },
    onError: (error: any) => {
      showErrorNotification('Cancellation Failed', error.message)
    },
  })

  const resumeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await api.payments.resumeSubscription()
    },
    onSuccess: () => {
      showSuccessNotification('Subscription Resumed', 'Your subscription has been reactivated.')
    },
    onError: (error: any) => {
      showErrorNotification('Resume Failed', error.message)
    },
  })

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (subscriptionLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-96" text="Loading billing information..." />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and view payment history</p>
      </motion.div>

      {/* Current Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border rounded-lg p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Current Subscription</h2>
        </div>

        {subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                <p className="font-medium text-foreground">
                  {subscription.plan?.displayName || 'Free'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : subscription.status === 'trialing'
                    ? 'bg-blue-100 text-blue-800'
                    : subscription.status === 'canceled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subscription.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'}
                </p>
                <p className="font-medium text-foreground">
                  {subscription.currentPeriodEnd
                    ? formatDate(subscription.currentPeriodEnd)
                    : 'N/A'}
                </p>
              </div>
            </div>

            {subscription.nextBillingAmount && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                <p className="font-medium text-foreground">
                  {formatPrice(subscription.nextBillingAmount)} on{' '}
                  {subscription.currentPeriodEnd && formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => billingPortalMutation.mutate()}
                disabled={billingPortalMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {billingPortalMutation.isPending && <LoadingSpinner size="sm" />}
                Manage Billing
              </button>

              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {cancelSubscriptionMutation.isPending && <LoadingSpinner size="sm" />}
                  Cancel Subscription
                </button>
              )}

              {subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => resumeSubscriptionMutation.mutate()}
                  disabled={resumeSubscriptionMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {resumeSubscriptionMutation.isPending && <LoadingSpinner size="sm" />}
                  Resume Subscription
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You're currently on the free plan</p>
            <a
              href="/pricing"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Upgrade to Pro
            </a>
          </div>
        )}
      </motion.div>

      {/* Usage Overview */}
      {subscription?.usage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-lg p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Usage This Period</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Pro Generations</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${subscription.usage.proGenerationsLimit
                        ? (subscription.usage.proGenerationsUsed / subscription.usage.proGenerationsLimit) * 100
                        : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {subscription.usage.proGenerationsUsed}
                  {subscription.usage.proGenerationsLimit && ` / ${subscription.usage.proGenerationsLimit}`}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Draft Generations</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-secondary h-2 rounded-full"
                    style={{
                      width: `${subscription.usage.draftGenerationsLimit
                        ? (subscription.usage.draftGenerationsUsed / subscription.usage.draftGenerationsLimit) * 100
                        : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {subscription.usage.draftGenerationsUsed}
                  {subscription.usage.draftGenerationsLimit && ` / ${subscription.usage.draftGenerationsLimit}`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Period: {formatDate(subscription.usage.periodStart)} - {formatDate(subscription.usage.periodEnd)}</p>
            <p>Next reset: {formatDate(subscription.usage.nextResetAt)}</p>
          </div>
        </motion.div>
      )}

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border rounded-lg p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Payment History</h2>
        </div>

        {historyLoading ? (
          <LoadingSpinner className="flex items-center justify-center py-8" />
        ) : paymentHistory?.data?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No payment history available</p>
        ) : (
          <div className="space-y-3">
            {paymentHistory?.data?.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">
                    {formatPrice(payment.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.description || payment.planName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'succeeded'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                  {payment.receiptUrl && (
                    <div className="mt-1">
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

const BillingPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Billing">
      <ProtectedRoute requireAuth requireOnboarding>
        <BillingPageContent />
      </ProtectedRoute>
    </PageErrorBoundary>
  )
}

export default BillingPage