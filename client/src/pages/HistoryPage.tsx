import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Eye, History, Heart, Copy, Trash2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import { queryKeys, queryClient } from '@/lib/react-query'
import { useGenerationState, useNotifications } from '@/contexts/AppContext'

const HistoryPageContent: React.FC = () => {
  const { setCurrentGeneration } = useGenerationState()
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  const [page, setPage] = useState(1)
  const [expandedGeneration, setExpandedGeneration] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    platform: '',
    startDate: '',
    endDate: '',
  })

  const { data: history, isLoading, error } = useQuery({
    queryKey: queryKeys.hookHistory({ page, ...filters }),
    queryFn: async () => {
      const response = await api.hooks.getHistory({
        page,
        limit: 10,
        ...(filters.platform && { platform: filters.platform }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      })
      return response.data
    },
  })

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async ({ generation, hook }: { generation: any, hook: any }) => {
      await api.hooks.addToFavorites({
        generationId: generation.id,
        hookData: hook,
        framework: hook.framework || 'N/A',
        platformNotes: hook.platformNotes || `Generated for ${generation.platform} - ${generation.objective}`,
        topic: generation.topic,
        platform: generation.platform
      })
    },
    onSuccess: () => {
      showSuccessNotification('Saved!', 'Hook added to your favorites.')
    },
    onError: (error: any) => {
      showErrorNotification('Save Failed', error.message)
    },
  })

  // Delete generation mutation
  const deleteGenerationMutation = useMutation({
    mutationFn: async (generationId: string) => {
      await api.hooks.deleteGeneration(generationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hookHistory({ page, ...filters }) })
      showSuccessNotification('Deleted!', 'Generation removed from history.')
    },
    onError: (error: any) => {
      showErrorNotification('Delete Failed', error.message)
    },
  })

  const handleCopy = (hook: string) => {
    navigator.clipboard.writeText(hook).then(() => {
      showSuccessNotification('Copied!', 'Hook copied to clipboard.')
    })
  }

  const handleFavorite = (generation: any, hook: any) => {
    addToFavoritesMutation.mutate({ generation, hook })
  }

  const handleViewGeneration = (generation: any) => {
    setCurrentGeneration(generation)
    window.location.href = '/app'
  }

  const toggleExpanded = (generationId: string) => {
    setExpandedGeneration(expandedGeneration === generationId ? null : generationId)
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner text="Loading history..." />
        </div>
        <div className="h-20 lg:h-0" />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load history</p>
        </div>
        <div className="h-20 lg:h-0" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Page Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Generation History</h1>
              <p className="text-sm text-muted-foreground">All your hook generations in one place</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border rounded-lg p-4 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Platform</label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Platforms</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ platform: '', startDate: '', endDate: '' })}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* History List */}
      {!history?.data || history.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <History className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">No generations found</p>
          <a
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Generate Your First Hooks
          </a>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {history.data.map((generation: any, index: number) => {
            const isExpanded = expandedGeneration === generation.id
            const displayHooks = isExpanded ? generation.hooks : generation.hooks.slice(0, 2)
            
            return (
              <motion.div
                key={generation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{generation.topic}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Platform: {generation.platform}</span>
                      <span>Objective: {generation.objective}</span>
                      <span>Model: {generation.modelType}</span>
                      <span>Generated: {new Date(generation.createdAt).toLocaleDateString()}</span>
                      <span>{generation.hooks.length} hooks</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewGeneration(generation)}
                      className="p-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors"
                      title="View in app"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGenerationMutation.mutate(generation.id)}
                      disabled={deleteGenerationMutation.isPending}
                      className="p-2 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                      title="Delete generation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  {displayHooks.map((hook: any, hookIndex: number) => (
                    <div key={hookIndex} className="bg-muted/50 rounded p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-foreground font-medium mb-1">{hook.verbalHook}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Score: {hook.score}/5</span>
                            <span>Framework: {hook.framework}</span>
                            <span>Words: {hook.wordCount}</span>
                            <span>Risk: {hook.riskFactor}</span>
                          </div>
                          {hook.rationale && (
                            <p className="text-xs text-muted-foreground mt-1">{hook.rationale}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopy(hook.verbalHook)}
                            className="p-1 text-xs hover:bg-muted rounded transition-colors"
                            title="Copy hook"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFavorite(generation, hook)}
                            disabled={addToFavoritesMutation.isPending}
                            className="p-1 text-xs hover:bg-muted rounded transition-colors disabled:opacity-50"
                            title="Add to favorites"
                          >
                            <Heart className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {generation.hooks.length > 2 && (
                    <button
                      onClick={() => toggleExpanded(generation.id)}
                      className="text-sm text-primary hover:text-primary/80 text-center py-2 transition-colors"
                    >
                      {isExpanded 
                        ? 'Show Less' 
                        : `+${generation.hooks.length - 2} more hooks`
                      }
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {history?.pagination && history.pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-8"
        >
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-muted-foreground">
              Page {page} of {history.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(history.pagination.totalPages, page + 1))}
              disabled={page === history.pagination.totalPages}
              className="px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}
      </div>
      
      {/* Mobile bottom padding */}
      <div className="h-20 lg:h-0" />
    </AppShell>
  )
}

const HistoryPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="History">
      <ProtectedRoute requireAuth requireOnboarding>
        <HistoryPageContent />
      </ProtectedRoute>
    </PageErrorBoundary>
  )
}

export default HistoryPage