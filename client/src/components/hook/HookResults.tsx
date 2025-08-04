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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter and sort hooks
  const filteredAndSortedHooks = useMemo(() => {
    let filtered = hooks

    // Filter by risk level
    if (filterBy !== 'all') {
      filtered = filtered.filter(hook => hook.riskFactor === filterBy)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hook => hook.hookCategory === selectedCategory)
    }

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
  }, [hooks, filterBy, selectedCategory, sortBy, sortOrder])

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(hooks.map(hook => hook.hookCategory)))
    return uniqueCategories
  }, [hooks])

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
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (hooks.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No hooks generated yet</h3>
        <p className="text-muted-foreground">Generate some hooks to see them here.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Generated Hooks</h2>
            <p className="text-muted-foreground">
              {filteredAndSortedHooks.length} of {hooks.length} hooks
              {topic && (
                <span className="ml-2">
                  for "<span className="font-medium">{topic}</span>"  
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Risk Filter */}
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="wordCount">Word Count</SelectItem>
                <SelectItem value="riskFactor">Risk Level</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="standard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="standard">Standard View</TabsTrigger>
          <TabsTrigger value="trimodal">Tri-Modal View</TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-6">
          {/* Standard Hook Cards */}
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {filteredAndSortedHooks.map((hook, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <HookCard
                  hook={hook}
                  platform={platform || ''}
                  objective={objective || ''}
                  isFavorite={favoriteIds.has(`${index}`)}
                  onFavoriteToggle={() => onFavoriteToggle?.(index)}
                  onCopy={() => onCopyHook?.(hook)}
                  className={viewMode === 'list' ? "max-w-none" : ""}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trimodal" className="space-y-6">
          {/* Tri-Modal Hook Results */}
          <TriModalHookResults
            hooks={filteredAndSortedHooks}
            platform={platform || ''}
            objective={objective || ''}
            onFavoriteToggle={onFavoriteToggle || (() => {})}
            onCopyHook={onCopyHook || (() => {})}
            favoriteIds={favoriteIds}
          />
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      {filteredAndSortedHooks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {(filteredAndSortedHooks.reduce((sum, hook) => sum + hook.score, 0) / filteredAndSortedHooks.length).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {Math.round(filteredAndSortedHooks.reduce((sum, hook) => sum + hook.wordCount, 0) / filteredAndSortedHooks.length)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {filteredAndSortedHooks.filter(hook => hook.riskFactor === 'low').length}
            </div>
            <div className="text-sm text-muted-foreground">Low Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {Math.round((filteredAndSortedHooks.reduce((sum, hook) => sum + hook.specificityScore, 0) / filteredAndSortedHooks.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Specificity</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HookResults