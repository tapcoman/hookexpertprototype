import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/react-query'

const FavoritesPageContent: React.FC = () => {
  const { data: favorites, isLoading, error } = useQuery({
    queryKey: queryKeys.hookFavorites(),
    queryFn: async () => {
      const response = await api.hooks.getFavorites()
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-96" text="Loading favorites..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load favorites</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Saved Hooks</h1>
        <p className="text-muted-foreground">Your collection of favorite viral hooks</p>
      </motion.div>

      {favorites?.data?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">No saved hooks yet</p>
          <a
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Generate Your First Hooks
          </a>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {favorites?.data?.map((favorite: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-lg p-4"
            >
              <p className="text-foreground font-medium mb-2">{favorite.hook}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Platform: {favorite.platform}</span>
                <span>Saved: {new Date(favorite.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const FavoritesPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Favorites">
      <ProtectedRoute requireAuth requireOnboarding>
        <FavoritesPageContent />
      </ProtectedRoute>
    </PageErrorBoundary>
  )
}

export default FavoritesPage