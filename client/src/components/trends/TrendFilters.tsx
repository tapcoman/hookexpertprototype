import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  X,
  Calendar,
  Tag,
  TrendingUp,
  Zap,
  Flame,
  Activity,
  TrendingDown,
  SlidersHorizontal
} from 'lucide-react'
import { Platform, TrendCategory, TimeRange, TrendVelocity, TrendFilters as TrendFiltersType } from '../../types/trends'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible'

interface TrendFiltersProps {
  filters: TrendFiltersType
  onFiltersChange: (filters: TrendFiltersType) => void
  className?: string
}

const TrendFilters: React.FC<TrendFiltersProps> = ({
  filters,
  onFiltersChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const platforms: Array<{ value: Platform; label: string; icon: string }> = [
    { value: 'all', label: 'All Platforms', icon: '🌐' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'youtube', label: 'YouTube', icon: '📹' },
    { value: 'twitter', label: 'Twitter', icon: '🐦' }
  ]

  const categories: Array<{ value: TrendCategory; label: string; icon: string }> = [
    { value: 'all', label: 'All Categories', icon: '📂' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎭' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'lifestyle', label: 'Lifestyle', icon: '🌟' },
    { value: 'tech', label: 'Technology', icon: '💻' },
    { value: 'fitness', label: 'Fitness', icon: '💪' },
    { value: 'food', label: 'Food & Cooking', icon: '🍳' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'fashion', label: 'Fashion', icon: '👗' },
    { value: 'music', label: 'Music', icon: '🎵' }
  ]

  const timeRanges: Array<{ value: TimeRange; label: string }> = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ]

  const velocityOptions: Array<{ value: TrendVelocity; label: string; icon: any; color: string }> = [
    { value: 'viral', label: 'Viral', icon: Zap, color: 'text-purple-500' },
    { value: 'rising', label: 'Rising', icon: TrendingUp, color: 'text-emerald-500' },
    { value: 'hot', label: 'Hot', icon: Flame, color: 'text-orange-500' },
    { value: 'stable', label: 'Stable', icon: Activity, color: 'text-blue-500' },
    { value: 'declining', label: 'Declining', icon: TrendingDown, color: 'text-gray-500' }
  ]

  const updateFilters = (updates: Partial<TrendFiltersType>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({
      platform: 'all',
      category: 'all',
      timeRange: '24h',
      search: '',
      velocity: undefined,
      minMomentum: undefined,
      sortBy: 'momentum',
      sortOrder: 'desc'
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.platform !== 'all') count++
    if (filters.category !== 'all') count++
    if (filters.timeRange !== '24h') count++
    if (filters.search) count++
    if (filters.velocity && filters.velocity.length > 0) count++
    if (filters.minMomentum && filters.minMomentum > 0) count++
    return count
  }

  const toggleVelocityFilter = (velocity: TrendVelocity) => {
    const currentVelocities = filters.velocity || []
    const newVelocities = currentVelocities.includes(velocity)
      ? currentVelocities.filter(v => v !== velocity)
      : [...currentVelocities, velocity]
    
    updateFilters({ velocity: newVelocities.length > 0 ? newVelocities : undefined })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search trends, topics, or hashtags..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50"
          />
        </div>

        {/* Platform Selector */}
        <Select
          value={filters.platform}
          onValueChange={(value: Platform) => updateFilters({ platform: value })}
        >
          <SelectTrigger className="w-full lg:w-48 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {platforms.map((platform) => (
              <SelectItem key={platform.value} value={platform.value}>
                <div className="flex items-center gap-2">
                  <span>{platform.icon}</span>
                  {platform.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Selector */}
        <Select
          value={filters.category}
          onValueChange={(value: TrendCategory) => updateFilters({ category: value })}
        >
          <SelectTrigger className="w-full lg:w-48 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Range */}
        <Select
          value={filters.timeRange}
          onValueChange={(value: TimeRange) => updateFilters({ timeRange: value })}
        >
          <SelectTrigger className="w-full lg:w-40 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2 bg-blue-500 text-white text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50"
          >
            <div className="space-y-4">
              {/* Velocity Filters */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Trend Velocity
                </label>
                <div className="flex flex-wrap gap-2">
                  {velocityOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = filters.velocity?.includes(option.value)
                    
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => toggleVelocityFilter(option.value)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${isSelected 
                            ? 'bg-blue-500 text-white shadow-lg' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : option.color}`} />
                        {option.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Momentum Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Minimum Momentum
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={filters.minMomentum || 0}
                    onChange={(e) => updateFilters({ minMomentum: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                    {filters.minMomentum || 0}%
                  </span>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Sort By
                  </label>
                  <Select
                    value={filters.sortBy || 'momentum'}
                    onValueChange={(value) => updateFilters({ sortBy: value as any })}
                  >
                    <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momentum">Momentum</SelectItem>
                      <SelectItem value="engagement">Engagement Rate</SelectItem>
                      <SelectItem value="posts">Post Count</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Order
                  </label>
                  <Select
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(value) => updateFilters({ sortOrder: value as 'asc' | 'desc' })}
                  >
                    <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">High to Low</SelectItem>
                      <SelectItem value="asc">Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filter Pills */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.platform !== 'all' && (
            <Badge 
              variant="secondary" 
              className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
            >
              {platforms.find(p => p.value === filters.platform)?.label}
              <button
                onClick={() => updateFilters({ platform: 'all' })}
                className="ml-1 hover:bg-blue-500/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {filters.category !== 'all' && (
            <Badge 
              variant="secondary" 
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
            >
              {categories.find(c => c.value === filters.category)?.label}
              <button
                onClick={() => updateFilters({ category: 'all' })}
                className="ml-1 hover:bg-emerald-500/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.velocity && filters.velocity.length > 0 && (
            filters.velocity.map((velocity) => (
              <Badge 
                key={velocity}
                variant="secondary" 
                className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
              >
                {velocityOptions.find(v => v.value === velocity)?.label}
                <button
                  onClick={() => toggleVelocityFilter(velocity)}
                  className="ml-1 hover:bg-purple-500/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}

          {filters.minMomentum && filters.minMomentum > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20"
            >
              Min {filters.minMomentum}% momentum
              <button
                onClick={() => updateFilters({ minMomentum: undefined })}
                className="ml-1 hover:bg-orange-500/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default TrendFilters