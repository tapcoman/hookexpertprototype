import React from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  MessageCircle, 
  Share2, 
  Heart, 
  Clock, 
  Users,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  MoreHorizontal
} from 'lucide-react'
import { Trend } from '../../types/trends'
import VelocityIndicator, { VelocityBadge } from './VelocityIndicator'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface TrendCardProps {
  trend: Trend
  onViewDetails?: (trend: Trend) => void
  onGenerateHooks?: (trend: Trend) => void
  onBookmark?: (trend: Trend) => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

const TrendCard: React.FC<TrendCardProps> = ({
  trend,
  onViewDetails,
  onGenerateHooks,
  onBookmark,
  variant = 'default',
  className = ''
}) => {
  const getPlatformConfig = () => {
    switch (trend.platform) {
      case 'tiktok':
        return {
          color: 'text-pink-500 dark:text-pink-400',
          bgColor: 'bg-pink-500/10',
          name: 'TikTok'
        }
      case 'instagram':
        return {
          color: 'text-purple-500 dark:text-purple-400',
          bgColor: 'bg-purple-500/10',
          name: 'Instagram'
        }
      case 'youtube':
        return {
          color: 'text-red-500 dark:text-red-400',
          bgColor: 'bg-red-500/10',
          name: 'YouTube'
        }
      case 'twitter':
        return {
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-500/10',
          name: 'Twitter'
        }
      default:
        return {
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-500/10',
          name: 'Platform'
        }
    }
  }

  const getMomentumBarColor = () => {
    if (trend.momentum >= 80) return 'bg-gradient-to-r from-purple-500 to-pink-500'
    if (trend.momentum >= 60) return 'bg-gradient-to-r from-emerald-500 to-teal-500'
    if (trend.momentum >= 40) return 'bg-gradient-to-r from-orange-500 to-yellow-500'
    return 'bg-gradient-to-r from-gray-400 to-gray-500'
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const platformConfig = getPlatformConfig()

  if (variant === 'compact') {
    return (
      <motion.div
        className={`
          group relative overflow-hidden rounded-xl
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
          border border-gray-200/50 dark:border-gray-800/50
          hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20
          transition-all duration-300 cursor-pointer
          ${className}
        `}
        whileHover={{ y: -2 }}
        onClick={() => onViewDetails?.(trend)}
        layout
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <VelocityBadge
                velocity={trend.velocity}
                momentum={trend.momentum}
                size="sm"
                animated={false}
              />
              <Badge
                variant="secondary"
                className={`text-xs ${platformConfig.bgColor} ${platformConfig.color} border-0`}
              >
                {platformConfig.name}
              </Badge>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {trend.timeframe}
            </span>
          </div>

          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {trend.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {formatNumber(trend.postCount)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {trend.engagementRate}%
              </span>
            </div>
            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getMomentumBarColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${trend.momentum}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === 'featured') {
    return (
      <motion.div
        className={`
          group relative overflow-hidden rounded-2xl
          bg-gradient-to-br from-white/90 via-white/80 to-gray-50/90
          dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-800/90
          backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60
          hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30
          transition-all duration-500 cursor-pointer
          ${className}
        `}
        whileHover={{ y: -4, scale: 1.02 }}
        onClick={() => onViewDetails?.(trend)}
        layout
      >
        {/* Trending particles effect for viral content */}
        {trend.velocity === 'viral' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-purple-400/40 rounded-full"
                initial={{ 
                  x: Math.random() * 400,
                  y: Math.random() * 300,
                  opacity: 0
                }}
                animate={{
                  x: Math.random() * 400,
                  y: Math.random() * 300,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        )}

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <VelocityIndicator
                velocity={trend.velocity}
                momentum={trend.momentum}
                size="lg"
                showLabel={false}
              />
              <div>
                <Badge
                  variant="secondary"
                  className={`${platformConfig.bgColor} ${platformConfig.color} border-0 mb-1`}
                >
                  {platformConfig.name}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  {trend.timeframe}
                  {trend.isVerified && (
                    <div className="flex items-center gap-1 text-blue-500">
                      <Sparkles className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onBookmark?.(trend)}>
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Bookmark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewDetails?.(trend)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {trend.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {trend.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {trend.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatNumber(trend.viewCount || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Views</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Heart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatNumber(trend.likeCount || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Likes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatNumber(trend.commentCount || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Comments</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatNumber(trend.shareCount || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Shares</div>
            </div>
          </div>

          {/* Momentum bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Momentum
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {trend.momentum}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getMomentumBarColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${trend.momentum}%` }}
                transition={{ duration: 1.5, delay: 0.3 }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={(e) => {
                e.stopPropagation()
                onGenerateHooks?.(trend)
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Hooks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails?.(trend)
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      className={`
        group relative overflow-hidden rounded-xl
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
        border border-gray-200/50 dark:border-gray-800/50
        hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20
        transition-all duration-300 cursor-pointer
        ${className}
      `}
      whileHover={{ y: -2 }}
      onClick={() => onViewDetails?.(trend)}
      layout
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <VelocityBadge
              velocity={trend.velocity}
              momentum={trend.momentum}
              size="sm"
            />
            <Badge
              variant="secondary"
              className={`text-xs ${platformConfig.bgColor} ${platformConfig.color} border-0`}
            >
              {platformConfig.name}
            </Badge>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full capitalize">
              {trend.category}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            {trend.timeframe}
          </div>
        </div>

        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {trend.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {trend.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {trend.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {formatNumber(trend.postCount)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {trend.engagementRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {trend.momentum}%
            </span>
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getMomentumBarColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${trend.momentum}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onGenerateHooks?.(trend)
            }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Generate Hooks
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onBookmark?.(trend)
            }}
          >
            <BookmarkPlus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default TrendCard