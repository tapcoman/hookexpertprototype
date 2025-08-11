import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Zap,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Filter,
  Grid3X3,
  List,
  LayoutGrid
} from 'lucide-react'
import { Trend, TrendFilters as TrendFiltersType, PlatformOverview } from '../../types/trends'
import { mockTrends, mockPlatformOverviews, filterTrends, sortTrends } from '../../lib/mockTrendData'
import TrendCard from './TrendCard'
import TrendFilters from './TrendFilters'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface TrendDashboardProps {
  onTrendSelect?: (trend: Trend) => void
  onGenerateHooks?: (trend: Trend) => void
  className?: string
}

type ViewMode = 'grid' | 'list' | 'compact'

const TrendDashboard: React.FC<TrendDashboardProps> = ({
  onTrendSelect,
  onGenerateHooks,
  className = ''
}) => {
  const [filters, setFilters] = useState<TrendFiltersType>({
    platform: 'all',
    category: 'all',
    timeRange: '24h',
    search: '',
    sortBy: 'momentum',
    sortOrder: 'desc'
  })
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [featuredTrends, setFeaturedTrends] = useState<string[]>([])

  // Filter and sort trends
  const filteredTrends = useMemo(() => {
    let trends = filterTrends(mockTrends, {
      platform: filters.platform === 'all' ? undefined : filters.platform,
      category: filters.category === 'all' ? undefined : filters.category,
      search: filters.search,
      velocity: filters.velocity?.[0] // Take first velocity filter
    })

    // Apply momentum filter
    if (filters.minMomentum && filters.minMomentum > 0) {
      trends = trends.filter(trend => trend.momentum >= filters.minMomentum!)
    }

    // Apply velocity filters
    if (filters.velocity && filters.velocity.length > 0) {
      trends = trends.filter(trend => filters.velocity!.includes(trend.velocity))
    }

    return sortTrends(trends, filters.sortBy, filters.sortOrder)
  }, [filters])

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalTrends = filteredTrends.length
    const viralTrends = filteredTrends.filter(t => t.velocity === 'viral').length
    const risingTrends = filteredTrends.filter(t => t.velocity === 'rising').length
    const hotTrends = filteredTrends.filter(t => t.velocity === 'hot').length
    const averageMomentum = totalTrends > 0 
      ? Math.round(filteredTrends.reduce((sum, t) => sum + t.momentum, 0) / totalTrends)
      : 0
    const averageEngagement = totalTrends > 0
      ? Math.round((filteredTrends.reduce((sum, t) => sum + t.engagementRate, 0) / totalTrends) * 10) / 10
      : 0

    return {
      totalTrends,
      viralTrends,
      risingTrends,
      hotTrends,
      averageMomentum,
      averageEngagement
    }
  }, [filteredTrends])

  const handleTrendBookmark = (trend: Trend) => {
    // Implementation would save to favorites
    console.log('Bookmarked trend:', trend.id)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getGridCols = () => {
    switch (viewMode) {
      case 'compact':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
      case 'list':
        return 'grid-cols-1'
      default:
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Analytics */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trend Radar
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discover what's trending across social platforms
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compact')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Platform Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {mockPlatformOverviews.map((overview) => {
            const getPlatformConfig = () => {
              switch (overview.platform) {
                case 'tiktok':
                  return { color: 'text-pink-500', bgColor: 'bg-pink-500/10', name: 'TikTok', icon: '🎵' }
                case 'instagram':
                  return { color: 'text-purple-500', bgColor: 'bg-purple-500/10', name: 'Instagram', icon: '📷' }
                case 'youtube':
                  return { color: 'text-red-500', bgColor: 'bg-red-500/10', name: 'YouTube', icon: '📹' }
                case 'twitter':
                  return { color: 'text-blue-500', bgColor: 'bg-blue-500/10', name: 'Twitter', icon: '🐦' }
                default:
                  return { color: 'text-gray-500', bgColor: 'bg-gray-500/10', name: 'All', icon: '🌐' }
              }
            }

            const config = getPlatformConfig()
            const isGrowthPositive = overview.growthRate >= 0

            return (
              <motion.div
                key={overview.platform}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center text-lg`}>
                          {config.icon}
                        </div>
                        <CardTitle className={`text-sm font-medium ${config.color}`}>
                          {config.name}
                        </CardTitle>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${isGrowthPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isGrowthPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(overview.growthRate)}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {overview.totalTrends}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Trends</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {overview.averageEngagement}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Engagement</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {overview.viralCount > 0 && (
                        <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          {overview.viralCount} Viral
                        </Badge>
                      )}
                      {overview.risingCount > 0 && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {overview.risingCount} Rising
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      Top: {overview.topCategory}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3 sm:gap-6 p-3 sm:p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.totalTrends} Trends
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Currently tracked
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.viralTrends} Viral
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Explosive growth
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.risingTrends} Rising
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Growing fast
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.averageMomentum}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Avg momentum
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-teal-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {analytics.averageEngagement}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Avg engagement
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TrendFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Results */}
      <div className="space-y-4">
        {filteredTrends.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredTrends.length} trend{filteredTrends.length !== 1 ? 's' : ''}
              </p>
            </div>

            <motion.div 
              className={`grid gap-4 ${getGridCols()}`}
              layout
            >
              {filteredTrends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <TrendCard
                    trend={trend}
                    variant={viewMode === 'compact' ? 'compact' : 
                            index < 2 && viewMode === 'grid' ? 'featured' : 'default'}
                    onViewDetails={onTrendSelect}
                    onGenerateHooks={onGenerateHooks}
                    onBookmark={handleTrendBookmark}
                  />
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No trends found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your filters to see more results
            </p>
            <Button
              variant="outline"
              onClick={() => setFilters({
                platform: 'all',
                category: 'all',
                timeRange: '24h',
                search: '',
                sortBy: 'momentum',
                sortOrder: 'desc'
              })}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendDashboard