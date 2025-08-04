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
  Sparkles,
  Zap,
  Target,
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
import type { HookObject } from '@/types/shared'
import { cn, getPlatformColor, formatPlatformName } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import { useAnalytics } from '../../lib/analytics'
import { 
  cardVariants, 
  itemVariants, 
  confidenceVariants, 
  shimmerVariants, 
  sparkleVariants,
  duration,
  easing,
  getReducedMotionVariants
} from '../../lib/animations'

interface HookCardProps {
  hook: HookObject
  platform?: string
  objective?: string
  showDetails?: boolean
  isFavorite?: boolean
  isConnected?: boolean
  onFavoriteToggle?: () => void
  onCopy?: () => void
  className?: string
}

const HookCard: React.FC<HookCardProps> = ({
  hook,
  platform,
  objective: _objective,
  showDetails = true,
  isFavorite = false,
  isConnected = false,
  onFavoriteToggle,
  onCopy,
  className
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.verbalHook)
      
      // Track copy action
      track('hook_card_copied', {
        hookScore: hook.score,
        hookFramework: hook.framework,
        platform: platform,
        psychologicalDriver: hook.psychologicalDriver,
        riskFactor: hook.riskFactor
      })
      
      toast({
        title: "Copied to clipboard",
        description: "Hook copied successfully!",
        variant: "success"
      })
      onCopy?.()
    } catch (error) {
      track('hook_card_copy_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
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
      'curiosity-gap': 'bg-purple-100 text-purple-800 border-purple-200',
      'pain-point': 'bg-red-100 text-red-800 border-red-200',
      'value-hit': 'bg-green-100 text-green-800 border-green-200',
      'surprise-shock': 'bg-orange-100 text-orange-800 border-orange-200',
      'social-proof': 'bg-blue-100 text-blue-800 border-blue-200',
      'urgency-fomo': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'authority-credibility': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'emotional-connection': 'bg-pink-100 text-pink-800 border-pink-200',
    }
    return colors[driver as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getConfidenceColor = (score: number) => {
    const percentage = (score / 5) * 100
    if (percentage >= 85) return 'from-emerald-500 via-green-500 to-teal-500'
    if (percentage >= 70) return 'from-amber-500 via-orange-500 to-yellow-500'
    return 'from-red-500 via-pink-500 to-rose-500'
  }

  const getConfidenceGlow = (score: number) => {
    const percentage = (score / 5) * 100
    if (percentage >= 85) return 'shadow-emerald-500/25'
    if (percentage >= 70) return 'shadow-amber-500/25'
    return 'shadow-red-500/25'
  }

  const scorePercentage = (hook.score / 5) * 100

  return (
    <motion.div
      variants={getReducedMotionVariants(cardVariants)}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        "group relative", 
        "perspective-1000 transform-style-preserve-3d",
        className
      )}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Advanced Connection indicator with flowing animation */}
      {isConnected && (
        <>
          {/* Main connection line */}
          <motion.div
            className="absolute -left-8 top-1/2 w-16 h-1 rounded-full overflow-hidden"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: duration.slower, ease: easing.flow, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/40 to-indigo-500/20 rounded-full" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 rounded-full"
              animate={{
                x: ['-150%', '150%'],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                ease: easing.flow,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </motion.div>
          
          {/* Connection pulse */}
          <motion.div
            className="absolute -left-10 top-1/2 w-4 h-4 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              ease: easing.smooth,
              repeat: Infinity,
            }}
          />
          
          {/* Subtle glow effect */}
          <div className="absolute -left-10 top-1/2 w-6 h-6 -translate-y-1/2 rounded-full bg-blue-400/20 blur-md" />
        </>
      )}

      <Card className={cn(
        "h-full overflow-hidden relative border-0 backdrop-blur-sm",
        "bg-gradient-to-br from-white/95 via-gray-50/30 to-white/95",
        "shadow-lg hover:shadow-2xl transition-all duration-500",
        "group-hover:shadow-blue-500/10",
        getConfidenceGlow(hook.score)
      )}>
        {/* Enhanced confidence indicator with multiple layers */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-b-full overflow-hidden">
          {/* Base confidence bar */}
          <motion.div
            className={`h-full bg-gradient-to-r ${getConfidenceColor(hook.score)} relative overflow-hidden rounded-b-full`}
            variants={confidenceVariants}
            initial="initial"
            animate="animate"
            custom={scorePercentage}
          >
            {/* Flowing shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              variants={shimmerVariants}
              animate="animate"
              style={{ animationDelay: '1s' }}
            />
            
            {/* Pulse effect for high scores */}
            {scorePercentage >= 85 && (
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-b-full"
                animate={{
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  ease: easing.smooth,
                  repeat: Infinity,
                  delay: 2,
                }}
              />
            )}
          </motion.div>
          
          {/* Confidence level indicator */}
          <div className="absolute right-2 top-0 h-2 flex items-center">
            <motion.div
              className={cn(
                "w-1 h-1 rounded-full",
                scorePercentage >= 85 ? "bg-emerald-400" : 
                scorePercentage >= 70 ? "bg-amber-400" : "bg-red-400"
              )}
              animate={{
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 1.5,
                ease: easing.smooth,
                repeat: Infinity,
              }}
            />
          </div>
        </div>
        <CardHeader className="pb-3 pt-6">
          <div className="flex justify-between items-start">
            <motion.div 
              className="flex items-center space-x-2"
              variants={itemVariants}
              initial="initial"
              animate="animate"
            >
              {platform && (
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Badge className={cn(
                    getPlatformColor(platform), 
                    "border shadow-sm hover:shadow-md transition-all duration-300",
                    "bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm"
                  )}>
                    <Target className="w-3 h-3 mr-1" />
                    {formatPlatformName(platform)}
                  </Badge>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.05, rotate: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Badge className="text-xs border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 text-indigo-700 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md">
                  <Brain className="w-3 h-3 mr-1" />
                  {hook.hookCategory.replace('-', ' ').toUpperCase()}
                </Badge>
              </motion.div>
            </motion.div>
            
            <div className="flex items-center space-x-1">
              {/* Enhanced Quality Score with dynamic effects */}
              <motion.div 
                className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: duration.slow, delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  variants={hook.score >= 4 ? sparkleVariants : {}}
                  animate={hook.score >= 4 ? "animate" : ""}
                >
                  {hook.score >= 4.5 ? (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  ) : hook.score >= 4 ? (
                    <Zap className="w-4 h-4 text-blue-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                  )}
                </motion.div>
                <span className={cn(
                  "font-semibold text-sm",
                  scorePercentage >= 85 ? "text-emerald-600" :
                  scorePercentage >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {hook.score.toFixed(1)}
                </span>
                <div className="text-xs text-gray-400 font-medium">/ 5.0</div>
              </motion.div>
              
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
                  <DropdownMenuItem onClick={() => {
                    track('hook_card_favorite_toggled', {
                      isFavorite: !isFavorite,
                      hookScore: hook.score,
                      platform: platform
                    })
                    onFavoriteToggle?.()
                  }}>
                    <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    track('hook_card_analysis_toggled', {
                      showAnalysis: !showAnalysis,
                      hookScore: hook.score,
                      framework: hook.framework
                    })
                    setShowAnalysis(!showAnalysis)
                  }}>
                    {showAnalysis ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-50 via-transparent to-indigo-50 rounded-b-lg" />
          <div className="relative z-10 space-y-5">
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

          {/* Enhanced Psychology & Risk indicators */}
          <motion.div 
            className="flex flex-wrap gap-2"
            variants={itemVariants}
            initial="initial"
            animate="animate"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge className={cn(
                getPsychologyColor(hook.psychologicalDriver),
                "shadow-sm hover:shadow-md transition-all duration-300 border"
              )}>
                <Brain className="w-3 h-3 mr-1" />
                {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge className={cn(
                getRiskColor(hook.riskFactor),
                "shadow-sm hover:shadow-md transition-all duration-300 border"
              )}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {hook.riskFactor.toUpperCase()} Risk
              </Badge>
            </motion.div>
          </motion.div>

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

          {/* Enhanced Action Buttons */}
          <motion.div 
            className="flex gap-3 pt-4"
            variants={itemVariants}
            initial="initial"
            animate="animate"
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy} 
              className="flex-1 hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
              flowing
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Hook
            </Button>
            <Button 
              variant={isFavorite ? "default" : "outline"} 
              size="sm" 
              onClick={() => {
                track('hook_card_favorite_button_clicked', {
                  isFavorite: !isFavorite,
                  hookScore: hook.score,
                  platform: platform,
                  psychologicalDriver: hook.psychologicalDriver
                })
                onFavoriteToggle?.()
              }}
              className={cn(
                "px-4 transition-all duration-300",
                isFavorite ? 
                  "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg" :
                  "hover:border-red-300 hover:text-red-600"
              )}
              flowing
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </motion.div>
          </div>
        </CardContent>
        
        {/* Subtle card glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:via-indigo-500/10 group-hover:to-purple-500/10 rounded-xl blur-sm transition-all duration-500 -z-10" />
      </Card>
    </motion.div>
  )
}

export default HookCard