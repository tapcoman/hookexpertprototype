import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  SortAsc, 
  SortDesc, 
  Grid, 
  List,
  Download,
  Share,
  Zap
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/Tabs'
import HookCard from './HookCard'
import TriModalHookResults from './TriModalHookResults'
import type { HookObject } from '@/types/shared'
import { cn } from '../../lib/utils'

interface HookResultsProps {
  hooks: HookObject[]
  platform?: string
  objective?: string
  topic?: string
  isLoading?: boolean
  onFavoriteToggle?: (hookIndex: number) => void
  onCopyHook?: (hook: HookObject) => void
  favoriteIds?: Set<string>
  className?: string
}

const HookResults: React.FC<HookResultsProps> = ({
  hooks,
  platform,
  objective,
  topic,
  isLoading = false,
  onFavoriteToggle,
  onCopyHook,
  favoriteIds = new Set(),
  className
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'wordCount' | 'riskFactor'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [viewMode, setViewMode] = useState<'feed' | 'compact'>('feed')

  // Filter and sort hooks
  const filteredAndSortedHooks = useMemo(() => {
    let filtered = hooks

    // Filter by risk level
    if (filterBy !== 'all') {
      filtered = filtered.filter(hook => hook.riskFactor === filterBy)
    }

    // Note: Category filtering removed for simplified 2025 UI

    // Sort hooks
    return filtered.sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sortBy) {
        case 'score':
          aValue = a.score
          bValue = b.score
          break
        case 'wordCount':
          aValue = a.wordCount
          bValue = b.wordCount
          break
        case 'riskFactor':
          const riskOrder = { low: 1, medium: 2, high: 3 }
          aValue = riskOrder[a.riskFactor as keyof typeof riskOrder]
          bValue = riskOrder[b.riskFactor as keyof typeof riskOrder]
          break
        default:
          return 0
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })
  }, [hooks, filterBy, sortBy, sortOrder])

  // Identify the highest scoring hook from all hooks (not just filtered)
  const highestScoringHook = useMemo(() => {
    if (hooks.length === 0) return null
    return hooks.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    )
  }, [hooks])

  // Note: Categories removed for simplified 2025 UI

  const handleExport = () => {
    const exportData = filteredAndSortedHooks.map(hook => ({
      hook: hook.verbalHook,
      score: hook.score,
      category: hook.hookCategory,
      psychology: hook.psychologicalDriver,
      risk: hook.riskFactor,
      wordCount: hook.wordCount
    }))

    const csv = [
      ['Hook', 'Score', 'Category', 'Psychology', 'Risk', 'Word Count'],
      ...exportData.map(row => [
        `"${row.hook.replace(/"/g, '""')}"`,
        row.score,
        row.category,
        row.psychology,
        row.risk,
        row.wordCount
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hooks-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 modern-surface rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (hooks.length === 0) {
    return (
      <div className={cn("text-center py-16", className)}>
        <div className="max-w-4xl mx-auto">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 modern-surface">
            <Zap className="w-10 h-10" style={{ color: 'hsl(var(--text-secondary))' }} />
          </div>
          <h3 className="text-xl font-medium mb-3" style={{ color: 'hsl(var(--text-primary))' }}>No hooks generated yet</h3>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>Generate some hooks to see them here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--text-primary))' }}>Hook Results</h2>
            <p className="text-base" style={{ color: 'hsl(var(--text-secondary))' }}>
              {filteredAndSortedHooks.length} of {hooks.length} generated
              {topic && (
                <span className="ml-2">
                  • <span className="font-medium">{topic}</span>  
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="modern-surface">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="modern-surface">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Modern Filter Bar */}
        <div className="modern-surface p-4 rounded-xl">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Simplified filters */}
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-32 modern-surface">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32 modern-surface">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="wordCount">Words</SelectItem>
                  <SelectItem value="riskFactor">Risk</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-sm" 
                style={{ color: 'hsl(var(--text-secondary))' }}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant={viewMode === 'feed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('feed')}
                className="text-sm"
              >
                <List className="w-4 h-4 mr-1" />
                Feed
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('compact')}
                className="text-sm"
              >
                <Grid className="w-4 h-4 mr-1" />
                Compact
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Feed Layout */}
      <div className="max-w-4xl mx-auto">
        <div className={cn(
          viewMode === 'feed' 
            ? "space-y-3"
            : "grid grid-cols-1 md:grid-cols-2 gap-4"
        )}>
          {filteredAndSortedHooks.map((hook, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <HookCard
                hook={hook}
                platform={platform || ''}
                objective={objective || ''}
                isFavorite={favoriteIds.has(`${index}`)}
                onFavoriteToggle={() => onFavoriteToggle?.(index)}
                onCopy={() => onCopyHook?.(hook)}
                isHighestScoring={highestScoringHook && hook.verbalHook === highestScoringHook.verbalHook && hook.score === highestScoringHook.score}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Optional Tri-Modal View Toggle */}
        <div className="mt-8 text-center">
          <Tabs defaultValue="standard" className="inline-flex">
            <TabsList className="modern-surface">
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="trimodal">Detailed</TabsTrigger>
            </TabsList>

            <TabsContent value="trimodal" className="mt-6">
              <TriModalHookResults
                hooks={filteredAndSortedHooks.slice(0, 3)}
                platform={platform || ''}
                objective={objective || ''}
                onFavoriteToggle={onFavoriteToggle || (() => {})}
                onCopyHook={onCopyHook || (() => {})}
                favoriteIds={favoriteIds}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Minimal Summary Stats */}
      {filteredAndSortedHooks.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="modern-surface p-4 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div>
                  <span style={{ color: 'hsl(var(--text-secondary))' }}>Avg Score: </span>
                  <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
                    {(filteredAndSortedHooks.reduce((sum, hook) => sum + hook.score, 0) / filteredAndSortedHooks.length).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-secondary))' }}>Avg Words: </span>
                  <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
                    {Math.round(filteredAndSortedHooks.reduce((sum, hook) => sum + hook.wordCount, 0) / filteredAndSortedHooks.length)}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Low Risk: </span>
                <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
                  {filteredAndSortedHooks.filter(hook => hook.riskFactor === 'low').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HookResults