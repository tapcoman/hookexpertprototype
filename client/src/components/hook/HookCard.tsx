import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Copy, 
  Heart, 
  MoreVertical, 
  Eye,
  EyeOff,
  TrendingUp,
  Brain,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import type { HookObject } from '../../../shared/types'
import { cn, getPlatformColor, formatPlatformName } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'

interface HookCardProps {
  hook: HookObject
  platform?: string
  objective?: string
  showDetails?: boolean
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  onCopy?: () => void
  className?: string
}

const HookCard: React.FC<HookCardProps> = ({
  hook,
  platform,
  objective,
  showDetails = true,
  isFavorite = false,
  onFavoriteToggle,
  onCopy,
  className
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.verbalHook)
      toast({
        title: "Copied to clipboard",
        description: "Hook copied successfully!",
        variant: "success"
      })
      onCopy?.()
    } catch (error) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("group", className)}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              {platform && (
                <Badge className={getPlatformColor(platform)}>
                  {formatPlatformName(platform)}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {hook.hookCategory.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Quality Score */}
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">{hook.score.toFixed(1)}</span>
              </div>
              
              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Hook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onFavoriteToggle}>
                    <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAnalysis(!showAnalysis)}>
                    {showAnalysis ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Hook */}
          <div className="space-y-2">
            <p className="text-lg font-medium leading-relaxed text-foreground">
              {hook.verbalHook}
            </p>
            <div className="text-sm text-muted-foreground">
              {hook.wordCount} words
            </div>
          </div>

          {/* Tri-Modal Components */}
          {(hook.visualHook || hook.textualHook) && (
            <div className="space-y-2">
              {hook.visualHook && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Visual Hook</div>
                  <p className="text-sm">{hook.visualHook}</p>
                </div>
              )}
              {hook.textualHook && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Text Overlay</div>
                  <p className="text-sm">{hook.textualHook}</p>
                </div>
              )}
            </div>
          )}

          {/* Psychology & Risk */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getPsychologyColor(hook.psychologicalDriver)}>
              <Brain className="w-3 h-3 mr-1" />
              {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            <Badge className={getRiskColor(hook.riskFactor)}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {hook.riskFactor.toUpperCase()} Risk
            </Badge>
          </div>

          {/* Quality Score Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Quality Score</span>
              <span className="font-medium">{hook.score.toFixed(1)}/5.0</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          {/* Analysis Section */}
          {showAnalysis && showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-3 border-t border-border"
            >
              {/* Framework */}
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Framework Used</div>
                <p className="text-sm text-muted-foreground">{hook.framework}</p>
              </div>

              {/* Rationale */}
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Psychology Analysis</div>
                <p className="text-sm text-muted-foreground">{hook.rationale}</p>
              </div>

              {/* Score Breakdown */}
              {hook.scoreBreakdown && (
                <div>
                  <div className="text-sm font-medium text-foreground mb-1">Score Breakdown</div>
                  <p className="text-sm text-muted-foreground">{hook.scoreBreakdown}</p>
                </div>
              )}

              {/* Platform Notes */}
              {hook.platformNotes && (
                <div>
                  <div className="text-sm font-medium text-foreground mb-1">Platform Strategy</div>
                  <p className="text-sm text-muted-foreground">{hook.platformNotes}</p>
                </div>
              )}

              {/* Quality Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {Math.round(hook.specificityScore * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Specificity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {Math.round(hook.freshnessScore * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Originality</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant={isFavorite ? "default" : "outline"} 
              size="sm" 
              onClick={onFavoriteToggle}
              className={isFavorite ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default HookCard