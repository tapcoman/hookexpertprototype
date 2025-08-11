import React from 'react'
import { motion } from 'framer-motion'
import { 
  X,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  Tag,
  ExternalLink,
  Sparkles,
  BookmarkPlus,
  Share,
  Copy,
  ChevronRight,
  ArrowUpRight,
  Activity
} from 'lucide-react'
import { Trend } from '../../types/trends'
import VelocityIndicator from './VelocityIndicator'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Progress } from '../ui/Progress'

interface TrendDetailProps {
  trend: Trend | null
  isOpen: boolean
  onClose: () => void
  onGenerateHooks?: (trend: Trend) => void
  onBookmark?: (trend: Trend) => void
}

const TrendDetail: React.FC<TrendDetailProps> = ({
  trend,
  isOpen,
  onClose,
  onGenerateHooks,
  onBookmark
}) => {
  if (!trend) return null

  const getPlatformConfig = () => {
    switch (trend.platform) {
      case 'tiktok':
        return {
          color: 'text-pink-500 dark:text-pink-400',
          bgColor: 'bg-pink-500/10',
          name: 'TikTok',
          icon: '🎵'
        }
      case 'instagram':
        return {
          color: 'text-purple-500 dark:text-purple-400',
          bgColor: 'bg-purple-500/10',
          name: 'Instagram',
          icon: '📷'
        }
      case 'youtube':
        return {
          color: 'text-red-500 dark:text-red-400',
          bgColor: 'bg-red-500/10',
          name: 'YouTube',
          icon: '📹'
        }
      case 'twitter':
        return {
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-500/10',
          name: 'Twitter',
          icon: '🐦'
        }
      default:
        return {
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-500/10',
          name: 'Platform',
          icon: '🌐'
        }
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getMomentumColor = () => {
    if (trend.momentum >= 80) return 'text-purple-500'
    if (trend.momentum >= 60) return 'text-emerald-500'
    if (trend.momentum >= 40) return 'text-orange-500'
    return 'text-gray-500'
  }

  const getEngagementLevel = () => {
    if (trend.engagementRate >= 10) return { level: 'Excellent', color: 'text-emerald-500' }
    if (trend.engagementRate >= 6) return { level: 'Good', color: 'text-blue-500' }
    if (trend.engagementRate >= 3) return { level: 'Average', color: 'text-orange-500' }
    return { level: 'Low', color: 'text-red-500' }
  }

  const platformConfig = getPlatformConfig()
  const engagementLevel = getEngagementLevel()

  // Mock related trends (in real app, this would come from API)
  const relatedTrends = [
    { id: '11', title: 'DIY Studio Setup on Budget', momentum: 67 },
    { id: '12', title: 'Music Theory for Beginners', momentum: 78 },
    { id: '13', title: 'Beat Making Tutorials', momentum: 82 }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${platformConfig.bgColor} flex items-center justify-center text-lg`}>
                {platformConfig.icon}
              </div>
              <span>Trend Analysis</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${platformConfig.bgColor} ${platformConfig.color} border-0`}
                  >
                    {platformConfig.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {trend.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {trend.timeframe}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {trend.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
                  {trend.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBookmark?.(trend)}
                >
                  <BookmarkPlus className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Velocity & Momentum */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <VelocityIndicator
                velocity={trend.velocity}
                momentum={trend.momentum}
                size="lg"
              />
              
              <div className="text-right">
                <div className={`text-3xl font-bold ${getMomentumColor()}`}>
                  {trend.momentum}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Momentum Score
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(trend.viewCount || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +12.5% today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Likes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(trend.likeCount || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +8.3% today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(trend.commentCount || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-500 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +15.7% today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Shares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(trend.shareCount || 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-500 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +22.1% today
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</span>
                    <span className={`text-sm font-medium ${engagementLevel.color}`}>
                      {trend.engagementRate}% - {engagementLevel.level}
                    </span>
                  </div>
                  <Progress value={Math.min(trend.engagementRate * 5, 100)} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Post Volume</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(trend.postCount)} posts
                    </span>
                  </div>
                  <Progress value={Math.min((trend.postCount / 20000) * 100, 100)} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Score</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {trend.confidenceScore || 85}%
                    </span>
                  </div>
                  <Progress value={trend.confidenceScore || 85} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Trend Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Initial spike detected</span>
                    <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Crossed viral threshold</span>
                    <span className="text-xs text-gray-500 ml-auto">1 hour ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Peak engagement reached</span>
                    <span className="text-xs text-gray-500 ml-auto">30 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400">Currently trending</span>
                    <span className="text-xs text-gray-500 ml-auto">Now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Popular Hashtags
            </h3>
            <div className="flex flex-wrap gap-2">
              {trend.tags.map((tag, index) => (
                <motion.button
                  key={index}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  #{tag}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Related Trends */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Related Trends
            </h3>
            <div className="space-y-2">
              {relatedTrends.map((relatedTrend) => (
                <div
                  key={relatedTrend.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {relatedTrend.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {relatedTrend.momentum}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              onClick={() => onGenerateHooks?.(trend)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Hooks for This Trend
            </Button>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Platform
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TrendDetail