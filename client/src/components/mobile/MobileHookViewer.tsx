import React, { useState, useRef, useEffect } from 'react'
import { motion, PanInfo, useAnimation } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Heart, 
  Share2, 
  Eye,
  EyeOff,
  MoreVertical,
  RefreshCw,
  Zap
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { Card, CardContent } from '../ui/Card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../lib/utils'
import type { HookObject } from '../../../shared/types'

interface MobileHookViewerProps {
  hooks: HookObject[]
  platform?: string
  objective?: string
  onFavoriteToggle?: (index: number) => void
  onCopy?: (hook: string, index: number) => void
  onShare?: (hook: HookObject, index: number) => void
  onRegenerate?: () => void
  isRegenerating?: boolean
  favoriteStates?: boolean[]
  className?: string
}

const MobileHookViewer: React.FC<MobileHookViewerProps> = ({
  hooks,
  platform,
  objective,
  onFavoriteToggle,
  onCopy,
  onShare,
  onRegenerate,
  isRegenerating = false,
  favoriteStates = [],
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDetails, setShowDetails] = useState<{ [key: number]: boolean }>({})
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
  const { toast } = useToast()
  const controls = useAnimation()
  const constraintsRef = useRef<HTMLDivElement>(null)

  const currentHook = hooks[currentIndex]

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100
    const swipeVelocity = 500

    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > swipeVelocity) {
      if (info.offset.x > 0) {
        // Swiped right - previous hook
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
          setDragDirection('right')
        }
      } else {
        // Swiped left - next hook
        if (currentIndex < hooks.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setDragDirection('left')
        }
      }
    }
    
    // Reset animation
    controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } })
    setTimeout(() => setDragDirection(null), 300)
  }

  const handleCopy = async () => {
    if (currentHook) {
      try {
        await navigator.clipboard.writeText(currentHook.verbalHook)
        toast({
          title: "Copied!",
          description: "Hook copied to clipboard",
          variant: "default"
        })
        onCopy?.(currentHook.verbalHook, currentIndex)
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Please try again",
          variant: "destructive"
        })
      }
    }
  }

  const handleShare = async () => {
    if (currentHook && navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this viral hook!',
          text: currentHook.verbalHook,
          url: window.location.href
        })
        onShare?.(currentHook, currentIndex)
      } catch (error) {
        // Fallback to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const toggleDetails = () => {
    setShowDetails(prev => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }))
  }

  const goToNext = () => {
    if (currentIndex < hooks.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setDragDirection('left')
      setTimeout(() => setDragDirection(null), 300)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setDragDirection('right')
      setTimeout(() => setDragDirection(null), 300)
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
      'curiosity-gap': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'pain-point': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      'value-hit': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'surprise-shock': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'social-proof': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'urgency-fomo': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'authority-credibility': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      'emotional-connection': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
    }
    return colors[driver as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (!hooks.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hooks to display</p>
      </div>
    )
  }

  const scorePercentage = (currentHook.score / 5) * 100

  return (
    <div className={cn("relative h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Generated Hooks</h3>
          {platform && (
            <Badge variant="secondary" className="text-xs">
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {hooks.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="p-2 touch-target"
          >
            <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-4 py-2">
        <Progress value={(currentIndex + 1) / hooks.length * 100} className="h-1" />
      </div>

      {/* Hook Cards Container */}
      <div 
        ref={constraintsRef}
        className="relative flex-1 overflow-hidden"
      >
        <motion.div
          className="relative h-full"
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileDrag={{ scale: 0.95 }}
        >
          <Card className="mx-4 h-full max-h-[calc(100vh-300px)] overflow-y-auto scroll-smooth-mobile">
            <CardContent className="p-6 space-y-4">
              {/* Hook Text */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-medium leading-relaxed text-foreground flex-1">
                    {currentHook.verbalHook}
                  </p>
                  <Badge className="shrink-0 text-xs font-medium">
                    #{currentIndex + 1}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{currentHook.score.toFixed(1)}/5.0</span>
                  </div>
                  <span>{currentHook.wordCount} words</span>
                  <span>{currentHook.framework}</span>
                </div>
              </div>

              {/* Quality Score */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Quality Score</span>
                  <span className="font-medium">{currentHook.score.toFixed(1)}/5.0</span>
                </div>
                <Progress value={scorePercentage} className="h-2" />
              </div>

              {/* Psychology Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getPsychologyColor(currentHook.psychologicalDriver)} variant="secondary">
                  <span className="text-xs">
                    {currentHook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </Badge>
                <Badge className={getRiskColor(currentHook.riskFactor)} variant="secondary">
                  <span className="text-xs">{currentHook.riskFactor.toUpperCase()} Risk</span>
                </Badge>
              </div>

              {/* Expandable Details */}
              <div className="border-t border-border pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDetails}
                  className="w-full flex items-center justify-center gap-2 text-muted-foreground"
                >
                  <span className="text-sm">
                    {showDetails[currentIndex] ? 'Hide Analysis' : 'Show Analysis'}
                  </span>
                  {showDetails[currentIndex] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>

                {showDetails[currentIndex] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4 text-sm"
                  >
                    {/* Tri-Modal Components */}
                    {(currentHook.visualHook || currentHook.textualHook) && (
                      <div className="space-y-3">
                        {currentHook.visualHook && (
                          <div className="p-3 bg-green-50 dark:bg-green-950/10 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                              Visual Cue
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {currentHook.visualHook}
                            </p>
                          </div>
                        )}
                        {currentHook.textualHook && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/10 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                              Text Overlay
                            </div>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                              {currentHook.textualHook}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Strategy & Rationale */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">Strategy</div>
                        <p className="text-sm text-muted-foreground">{currentHook.rationale}</p>
                      </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round(currentHook.specificityScore * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Specific</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-foreground">
                          {Math.round(currentHook.freshnessScore * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Original</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Swipe Direction Indicators */}
        {dragDirection === 'left' && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-primary text-primary-foreground rounded-full p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        )}
        
        {dragDirection === 'right' && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-primary text-primary-foreground rounded-full p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
        )}
      </div>

      {/* Navigation & Actions */}
      <div className="p-4 border-t border-border bg-background">
        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {hooks.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all touch-target",
                currentIndex === index 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex-1 touch-target"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="touch-target"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onFavoriteToggle?.(currentIndex)}
              className={cn(
                "touch-target",
                favoriteStates[currentIndex] && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              )}
            >
              <Heart className={cn("w-4 h-4", favoriteStates[currentIndex] && "fill-current")} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="touch-target"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="touch-target">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleDetails}>
                  {showDetails[currentIndex] ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showDetails[currentIndex] ? 'Hide Details' : 'Show Details'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRegenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentIndex === hooks.length - 1}
            className="flex-1 touch-target"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Swipe Hint */}
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 animate-swipe-hint">
            <span>Swipe to navigate</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileHookViewer