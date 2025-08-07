import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, 
  Heart, 
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react'
import type { HookObject } from '@/types/shared'
import { cn } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import { useAnalytics } from '../../lib/analytics'
import { Button } from '@/components/ui/Button'

interface HookCardProps {
  hook: HookObject
  platform?: string
  objective?: string
  showDetails?: boolean
  isFavorite?: boolean
  isConnected?: boolean
  isHighestScoring?: boolean
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
  isHighestScoring = false,
  onFavoriteToggle,
  onCopy,
  className
}) => {
  const [showExpanded, setShowExpanded] = useState(isHighestScoring)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
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

  const getScoreBadgeColor = (score: number) => {
    if (score >= 4.5) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (score >= 3.5) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  return (
    <motion.article
      className={cn(
        "group relative",
        isHighestScoring ? "premium-hook-card" : "content-first-card",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="p-6">

        {/* Header with minimal metadata */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Premium Badge for Highest Scoring */}
            {isHighestScoring && (
              <div className="premium-badge flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Highest Scoring
              </div>
            )}
            
            {/* Quality Score Badge */}
            <div className={cn(
              "px-2.5 py-1 rounded-full text-sm font-medium border",
              isHighestScoring ? "golden-score-badge" : getScoreBadgeColor(hook.score)
            )}>
              {isHighestScoring && <Trophy className="w-3 h-3 mr-1 trophy-icon inline" />}
              {hook.score.toFixed(1)}
            </div>
            
            {/* Risk Indicator - only if high risk */}
            {hook.riskFactor === 'high' && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="font-medium">High Risk</span>
              </div>
            )}
          </div>

          {/* Actions - visible on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
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
                    "h-8 w-8 p-0 hover:text-white",
                    isFavorite ? "text-red-400" : "text-gray-400"
                  )}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExpanded(!showExpanded)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Hook Content - 80% of visual weight */}
        <div className="mb-4">
          <p className="text-lg font-normal leading-relaxed" style={{ color: 'hsl(var(--text-primary))' }}>
            {hook.verbalHook}
          </p>
        </div>

        {/* Minimal metadata - subtle and unobtrusive */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
            {hook.wordCount} words
          </span>
          {platform && (
            <span className="text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
          )}
          <span className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {hook.psychologicalDriver.replace('-', ' ')}
          </span>
        </div>

        {/* Expanded Analysis - hidden by default */}
        <AnimatePresence>
          {showExpanded && showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="border-t pt-4 space-y-3" 
              style={{ borderColor: 'hsl(var(--border-subtle))' }}
            >
              {/* Tri-Modal Components - if available */}
              {(hook.visualHook || hook.textualHook) && (
                <div className="space-y-2">
                  {hook.visualHook && (
                    <div className="text-sm">
                      <div className="font-medium mb-1" style={{ color: 'hsl(var(--text-secondary))' }}>Visual:</div>
                      <div style={{ color: 'hsl(var(--text-tertiary))' }}>{hook.visualHook}</div>
                    </div>
                  )}
                  {hook.textualHook && (
                    <div className="text-sm">
                      <div className="font-medium mb-1" style={{ color: 'hsl(var(--text-secondary))' }}>Text Overlay:</div>
                      <div style={{ color: 'hsl(var(--text-tertiary))' }}>{hook.textualHook}</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Framework and Analysis */}
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>Framework: </span>
                  <span style={{ color: 'hsl(var(--text-tertiary))' }}>{hook.framework}</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>Strategy: </span>
                  <span style={{ color: 'hsl(var(--text-tertiary))' }}>{hook.rationale}</span>
                </div>
              </div>
              
              {/* Quality Metrics */}
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>Specificity: </span>
                  <span style={{ color: 'hsl(var(--text-tertiary))' }}>{Math.round(hook.specificityScore * 100)}%</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>Originality: </span>
                  <span style={{ color: 'hsl(var(--text-tertiary))' }}>{Math.round(hook.freshnessScore * 100)}%</span>
                </div>
              </div>
              
              {/* Success Factors - Only for Highest Scoring Hook */}
              {isHighestScoring && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--premium-gold) / 0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--premium-gold))' }} />
                    <span className="font-medium text-sm" style={{ color: 'hsl(var(--premium-gold))' }}>
                      Why This Hook Scored Highest
                    </span>
                  </div>
                  <div className="success-factors-grid">
                    {hook.specificityScore > 0.8 && (
                      <div className="success-factor">
                        <Target className="success-factor-icon" />
                        <span style={{ color: 'hsl(var(--text-secondary))' }}>High Specificity</span>
                      </div>
                    )}
                    {hook.freshnessScore > 0.7 && (
                      <div className="success-factor">
                        <Sparkles className="success-factor-icon" />
                        <span style={{ color: 'hsl(var(--text-secondary))' }}>Original Approach</span>
                      </div>
                    )}
                    {hook.score >= 4.5 && (
                      <div className="success-factor">
                        <TrendingUp className="success-factor-icon" />
                        <span style={{ color: 'hsl(var(--text-secondary))' }}>Premium Quality</span>
                      </div>
                    )}
                    {hook.riskFactor === 'low' && (
                      <div className="success-factor">
                        <CheckCircle2 className="success-factor-icon" />
                        <span style={{ color: 'hsl(var(--text-secondary))' }}>Platform Safe</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </motion.article>
  )
}

export default HookCard