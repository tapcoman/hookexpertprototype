import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, 
  Heart, 
  Eye,
  EyeOff,
  Brain,
  AlertTriangle,
  Target,
  CheckCircle2
} from 'lucide-react'
import type { HookObject } from '@/types/shared'
import { cn, formatPlatformName } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import { useAnalytics } from '../../lib/analytics'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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
  isConnected: _isConnected = false,
  onFavoriteToggle,
  onCopy,
  className
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.verbalHook)
      
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      
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

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default'
      case 'medium': return 'secondary'
      case 'high': return 'destructive'
      default: return 'outline'
    }
  }

  const getScoreColor = (score: number) => {
    const percentage = (score / 5) * 100
    if (percentage >= 85) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }


  const scorePercentage = (hook.score / 5) * 100

  return (
    <motion.div
      className={cn("group relative", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
    >
      <Card className="h-full transition-all duration-200 hover:shadow-lg">
        {/* Quality Indicator Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-lg overflow-hidden">
          <motion.div
            className={cn("h-full", getScoreColor(hook.score).replace('text-', 'bg-'))}
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        </div>

        <CardHeader className="pb-4 pt-6">
          <div className="flex items-start justify-between">
            {/* Badges - Limited to 2 maximum */}
            <div className="flex gap-2">
              {platform && (
                <Badge variant="outline" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  {formatPlatformName(platform)}
                </Badge>
              )}
              {/* Show highest priority badge - prefer high risk, then psychology */}
              {hook.riskFactor === 'high' ? (
                <Badge variant={getRiskVariant(hook.riskFactor)} className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  HIGH RISK
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              )}
            </div>

            {/* Simplified Quality Score */}
            <div className="text-right">
              <div className={cn("text-lg font-semibold", getScoreColor(hook.score))}>
                {hook.score.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Quality
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Hook Content - Enhanced Prominence */}
          <div className="space-y-3">
            <p className="text-xl font-medium leading-relaxed text-foreground">{hook.verbalHook}</p>
            <p className="text-sm text-muted-foreground">{hook.wordCount} words</p>
          </div>

          {/* Tri-Modal Components */}
          <AnimatePresence>
            {(hook.visualHook || hook.textualHook) && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
              >
                {hook.visualHook && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Visual Hook
                      </div>
                      <p className="text-sm">{hook.visualHook}</p>
                    </CardContent>
                  </Card>
                )}
                {hook.textualHook && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Text Overlay
                      </div>
                      <p className="text-sm">{hook.textualHook}</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reduced Psychology Indicators - Only show if not already shown in header */}
          {hook.riskFactor !== 'high' && (
            <div className="flex justify-end">
              <Badge variant={getRiskVariant(hook.riskFactor)} className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {hook.riskFactor.toUpperCase()} Risk
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              className="flex-1"
              size="sm"
            >
              <AnimatePresence mode="wait">
                {copySuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copied</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            
            <Button
              onClick={() => {
                track('hook_card_favorite_button_clicked', {
                  isFavorite: !isFavorite,
                  hookScore: hook.score,
                  platform: platform,
                  psychologicalDriver: hook.psychologicalDriver
                })
                onFavoriteToggle?.()
              }}
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              className={isFavorite ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={cn("w-4 h-4", isFavorite ? 'fill-current' : '')} />
            </Button>

            <Button
              onClick={() => {
                track('hook_card_analysis_toggled', {
                  showAnalysis: !showAnalysis,
                  hookScore: hook.score,
                  framework: hook.framework
                })
                setShowAnalysis(!showAnalysis)
              }}
              variant="outline"
              size="sm"
            >
              {showAnalysis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Analysis Section */}
          <AnimatePresence>
            {showAnalysis && showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4 pt-4 border-t"
              >
                {/* Framework */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Framework</h4>
                  <p className="text-sm text-muted-foreground">{hook.framework}</p>
                </div>

                {/* Psychology Analysis */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Psychology</h4>
                  <p className="text-sm text-muted-foreground">{hook.rationale}</p>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {Math.round(hook.specificityScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Specificity
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {Math.round(hook.freshnessScore * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Originality
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default HookCard