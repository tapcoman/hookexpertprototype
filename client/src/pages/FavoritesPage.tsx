import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Heart, Copy, Trash2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import { queryKeys, queryClient } from '@/lib/react-query'
import { useNotifications } from '@/contexts/AppContext'

const FavoritesPageContent: React.FC = () => {
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: favorites, isLoading, error } = useQuery({
    queryKey: queryKeys.hookFavorites(),
    queryFn: async () => {
      const response = await api.hooks.getFavorites({ page, limit })
      return response.data
    },
  })

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      await api.hooks.removeFromFavorites(favoriteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hookFavorites() })
      showSuccessNotification('Removed!', 'Hook removed from favorites.')
    },
    onError: (error: any) => {
      showErrorNotification('Remove Failed', error.message)
    },
  })

  const handleCopy = (hook: string) => {
    navigator.clipboard.writeText(hook).then(() => {
      showSuccessNotification('Copied!', 'Hook copied to clipboard.')
    })
  }

  const handleRemoveFavorite = (favoriteId: string) => {
    removeFromFavoritesMutation.mutate(favoriteId)
  }

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

      {!favorites?.data || favorites.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Heart className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">No saved hooks yet</p>
          <a
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Generate Your First Hooks
          </a>
        </motion.div>
      ) : (
        <>
          <div className="grid gap-4">
            {favorites.data.map((favorite: any, index: number) => {
              // Extract hook data from either hookData field or legacy format
              const hookData = favorite.hookData || favorite
              const verbalHook = hookData.verbalHook || favorite.hook || 'N/A'
              
              return (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-foreground font-medium mb-2">{verbalHook}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>Score: {hookData.score || 'N/A'}/5</span>
                        <span>Framework: {favorite.framework}</span>
                        <span>Platform: {favorite.platform || 'N/A'}</span>
                        <span>Words: {hookData.wordCount || verbalHook.split(' ').length}</span>
                      </div>
                      {hookData.rationale && (
                        <p className="text-sm text-muted-foreground">{hookData.rationale}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span>Saved: {new Date(favorite.createdAt).toLocaleDateString()}</span>
                        {favorite.topic && (
                          <>
                            <span>•</span>
                            <span>Topic: {favorite.topic}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(verbalHook)}
                        className="p-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded transition-colors"
                        title="Copy hook"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        disabled={removeFromFavoritesMutation.isPending}
                        className="p-2 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination */}
          {favorites.pagination && favorites.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {favorites.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(favorites.pagination.totalPages, page + 1))}
                disabled={page === favorites.pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Next
              </button>
            </div>
          )}
        </>
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