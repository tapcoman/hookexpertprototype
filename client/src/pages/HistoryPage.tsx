import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/react-query'

const HistoryPageContent: React.FC = () => {
  const [page, setPage] = useState(1)
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

  if (isLoading) {
    return <LoadingSpinner className="flex items-center justify-center min-h-96" text="Loading history..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load history</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Generation History</h1>
        <p className="text-muted-foreground">All your hook generations in one place</p>
      </motion.div>

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
      {history?.data?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
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
          {history?.data?.map((generation: any, index: number) => (
            <motion.div
              key={generation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{generation.topic}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Platform: {generation.platform}</span>
                    <span>Objective: {generation.objective}</span>
                    <span>Generated: {new Date(generation.createdAt).toLocaleDateString()}</span>
                    <span>{generation.hooks.length} hooks</span>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors">
                  View Details
                </button>
              </div>
              
              <div className="grid gap-2">
                {generation.hooks.slice(0, 2).map((hook: any, hookIndex: number) => (
                  <div key={hookIndex} className="bg-muted/50 rounded p-3">
                    <p className="text-sm text-foreground">{hook.verbalHook}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score: {hook.score}/5 • {hook.framework}
                    </p>
                  </div>
                ))}
                {generation.hooks.length > 2 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    +{generation.hooks.length - 2} more hooks
                  </p>
                )}
              </div>
            </motion.div>
          ))}
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