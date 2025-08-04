import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Copy, 
  Heart, 
  MoreHorizontal, 
  Eye,
  EyeOff,
  TrendingUp,
  Brain,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import type { HookObject } from '@/types/shared'
import { cn, getPlatformColor, formatPlatformName } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import { useAnalytics } from '../../lib/analytics'

interface MobileHookCardProps {
  hook: HookObject
  platform?: string
  objective?: string
  index: number
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  onCopy?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

const MobileHookCard: React.FC<MobileHookCardProps> = ({
  hook,
  platform,
  objective: _objective,
  index,
  isFavorite = false,
  onFavoriteToggle,
  onCopy,
  onSwipeLeft,
  onSwipeRight,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [dragX, setDragX] = useState(0)
  const { toast } = useToast()
  const { track } = useAnalytics()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.verbalHook)
      
      // Track mobile copy action
      track('mobile_hook_card_copied', {
        hookScore: hook.score,
        hookFramework: hook.framework,
        platform: platform,
        psychologicalDriver: hook.psychologicalDriver,
        riskFactor: hook.riskFactor,
        index: index
      })
      
      toast({
        title: "Copied!",
        description: "Hook copied to clipboard",
        variant: "success"
      })
      onCopy?.()
    } catch (error) {
      track('mobile_hook_card_copy_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        index: index
      })
      
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPsychologyColor = (driver: string) => {
    const colors = {
      'curiosity-gap': 'bg-purple-100 text-purple-800',
      'pain-point': 'bg-red-100 text-red-800',
      'value-hit': 'bg-green-100 text-green-800',
      'surprise-shock': 'bg-orange-100 text-orange-800',
      'social-proof': 'bg-blue-100 text-blue-800',
      'urgency-fomo': 'bg-yellow-100 text-yellow-800',
      'authority-credibility': 'bg-indigo-100 text-indigo-800',
      'emotional-connection': 'bg-pink-100 text-pink-800',
    }
    return colors[driver as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const scorePercentage = (hook.score / 5) * 100

  return (
    <motion.div
      className={cn("relative", className)}
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.2}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={(_, info) => {
        if (info.offset.x > 50) {
          track('mobile_hook_card_swipe_right', {
            hookScore: hook.score,
            platform: platform,
            index: index
          })
          onSwipeRight?.()
        } else if (info.offset.x < -50) {
          track('mobile_hook_card_swipe_left', {
            hookScore: hook.score,
            platform: platform,
            index: index
          })
          onSwipeLeft?.()
        }
        setDragX(0)
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-lg">
        <div className={cn(
          "flex items-center justify-center w-16 h-16 rounded-full transition-all",
          dragX > 25 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        )}>
          <Heart className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center justify-center w-16 h-16 rounded-full transition-all",
          dragX < -25 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
        )}>
          <Copy className="w-6 h-6" />
        </div>
      </div>

      <Card className="relative z-10 touch-pan-y">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="text-xs font-medium">#{index + 1}</Badge>
              {platform && (
                <Badge className={getPlatformColor(platform)} variant="secondary">
                  {formatPlatformName(platform)}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium">{hook.score.toFixed(1)}</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Hook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  track('mobile_hook_card_favorite_toggled', {
                    isFavorite: !isFavorite,
                    hookScore: hook.score,
                    platform: platform,
                    index: index
                  })
                  onFavoriteToggle?.()
                }}>
                  <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                  {isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  track('mobile_hook_card_details_toggled', {
                    showDetails: !showDetails,
                    hookScore: hook.score,
                    framework: hook.framework,
                    index: index
                  })
                  setShowDetails(!showDetails)
                }}>
                  {showDetails ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Hook Text */}
          <div className="space-y-2">
            <p className="text-base font-medium leading-relaxed text-foreground">
              {hook.verbalHook}
            </p>
            <div className="text-xs text-muted-foreground">
              {hook.wordCount} words
            </div>
          </div>

          {/* Quality Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Quality</span>
              <span className="font-medium">{hook.score.toFixed(1)}/5.0</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          {/* Psychology Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getPsychologyColor(hook.psychologicalDriver)} variant="secondary">
              <Brain className="w-3 h-3 mr-1" />
              <span className="text-xs">
                {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </Badge>
            <Badge className={getRiskColor(hook.riskFactor)} variant="secondary">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span className="text-xs">{hook.riskFactor.toUpperCase()}</span>
            </Badge>
          </div>

          {/* Expandable Details */}
          <div className="border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                track('mobile_hook_card_expand_details', {
                  showDetails: !showDetails,
                  hookScore: hook.score,
                  framework: hook.framework,
                  index: index
                })
                setShowDetails(!showDetails)
              }}
              className="w-full flex items-center justify-center gap-2 text-muted-foreground"
            >
              <span className="text-xs">
                {showDetails ? 'Hide Details' : 'Show Analysis'}
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3 text-sm"
              >
                {/* Tri-Modal Components */}
                {(hook.visualHook || hook.textualHook) && (
                  <div className="space-y-2">
                    {hook.visualHook && (
                      <div className="p-2 bg-green-50 dark:bg-green-950/10 rounded border border-green-200 dark:border-green-800">
                        <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                          Visual Cue
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {hook.visualHook}
                        </p>
                      </div>
                    )}
                    {hook.textualHook && (
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/10 rounded border border-purple-200 dark:border-purple-800">
                        <div className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1">
                          Text Overlay
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          {hook.textualHook}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Framework */}
                <div>
                  <div className="text-xs font-medium text-foreground mb-1">Framework</div>
                  <p className="text-xs text-muted-foreground">{hook.framework}</p>
                </div>

                {/* Strategy */}
                <div>
                  <div className="text-xs font-medium text-foreground mb-1">Strategy</div>
                  <p className="text-xs text-muted-foreground">{hook.rationale}</p>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-sm font-bold text-foreground">
                      {Math.round(hook.specificityScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Specific</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="text-sm font-bold text-foreground">
                      {Math.round(hook.freshnessScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Original</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant={isFavorite ? "default" : "outline"} 
              size="sm" 
              onClick={() => {
                track('mobile_hook_card_favorite_button_clicked', {
                  isFavorite: !isFavorite,
                  hookScore: hook.score,
                  platform: platform,
                  index: index,
                  psychologicalDriver: hook.psychologicalDriver
                })
                onFavoriteToggle?.()
              }}
              className={cn(
                "px-3",
                isFavorite && "bg-red-500 hover:bg-red-600"
              )}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Swipe Hint */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>Swipe right</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Swipe left</span>
              <Copy className="w-3 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default MobileHookCard