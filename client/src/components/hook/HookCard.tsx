import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, 
  Heart, 
  Eye,
  EyeOff,
  TrendingUp,
  Brain,
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  CheckCircle2
} from 'lucide-react'
import type { HookObject } from '@/types/shared'
import { cn, getPlatformColor, formatPlatformName } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import { useAnalytics } from '../../lib/analytics'

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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-amber-100 text-amber-800'
      case 'high': return 'bg-red-100 text-red-800'
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
      'urgency-fomo': 'bg-amber-100 text-amber-800',
      'authority-credibility': 'bg-indigo-100 text-indigo-800',
      'emotional-connection': 'bg-pink-100 text-pink-800',
    }
    return colors[driver as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getScoreColor = (score: number) => {
    const percentage = (score / 5) * 100
    if (percentage >= 85) return 'rgb(var(--md-sys-color-primary))'
    if (percentage >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const scorePercentage = (hook.score / 5) * 100

  return (
    <motion.div
      className={cn("group relative overflow-hidden", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
    >
      {/* Material Design 3 Card */}
      <div className="md-elevated-card">
        {/* Quality Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-xl">
          <motion.div
            className="h-full rounded-tl-xl"
            style={{ backgroundColor: getScoreColor(hook.score) }}
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 pt-2">
          {/* Platform Badge */}
          {platform && (
            <div className="md-assist-chip">
              <Target className="w-3 h-3 mr-2" />
              <span className="md-label-medium">{formatPlatformName(platform)}</span>
            </div>
          )}

          {/* Quality Score */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div 
                className="md-title-large font-bold"
                style={{ color: getScoreColor(hook.score) }}
              >
                {hook.score.toFixed(1)}
              </div>
              <div 
                className="md-label-small"
                style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
              >
                QUALITY
              </div>
            </div>
            
            {/* Circular Progress */}
            <div className="w-12 h-12 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="rgb(var(--md-sys-color-outline-variant))"
                  strokeWidth="3"
                  fill="none"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={getScoreColor(hook.score)}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${2 * Math.PI * 20}` }}
                  animate={{ 
                    strokeDasharray: `${(scorePercentage / 100) * 2 * Math.PI * 20} ${2 * Math.PI * 20}` 
                  }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Hook Content */}
        <div className="space-y-4 mb-6">
          <p className="md-body-large">
            {hook.verbalHook}
          </p>
          <div 
            className="md-label-medium"
            style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
          >
            {hook.wordCount} words
          </div>
        </div>

        {/* Tri-Modal Components */}
        <AnimatePresence>
          {(hook.visualHook || hook.textualHook) && (
            <motion.div 
              className="space-y-3 mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              {hook.visualHook && (
                <div className="md-filled-card">
                  <div className="md-label-small mb-2">VISUAL HOOK</div>
                  <p className="md-body-small">{hook.visualHook}</p>
                </div>
              )}
              {hook.textualHook && (
                <div className="md-filled-card">
                  <div className="md-label-small mb-2">TEXT OVERLAY</div>
                  <p className="md-body-small">{hook.textualHook}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Psychology Indicators */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="md-assist-chip">
            <Brain className="w-3 h-3 mr-2" />
            <span className="md-label-medium">
              {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          <div className={`md-assist-chip ${getRiskColor(hook.riskFactor)}`}>
            <AlertTriangle className="w-3 h-3 mr-2" />
            <span className="md-label-medium">{hook.riskFactor.toUpperCase()} Risk</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleCopy}
            className="flex-1 md-filled-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
          
          <motion.button
            onClick={() => {
              track('hook_card_favorite_button_clicked', {
                isFavorite: !isFavorite,
                hookScore: hook.score,
                platform: platform,
                psychologicalDriver: hook.psychologicalDriver
              })
              onFavoriteToggle?.()
            }}
            className={isFavorite ? "md-filled-button !bg-red-500" : "md-outlined-button"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={cn("w-4 h-4", isFavorite ? 'fill-current' : '')} />
          </motion.button>

          <motion.button
            onClick={() => {
              track('hook_card_analysis_toggled', {
                showAnalysis: !showAnalysis,
                hookScore: hook.score,
                framework: hook.framework
              })
              setShowAnalysis(!showAnalysis)
            }}
            className="md-outlined-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showAnalysis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Analysis Section */}
        <AnimatePresence>
          {showAnalysis && showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 pt-6 mt-6"
              style={{ borderTop: '1px solid rgb(var(--md-sys-color-outline-variant))' }}
            >
              {/* Framework */}
              <div>
                <div className="md-title-small mb-2">Framework</div>
                <p className="md-body-medium">{hook.framework}</p>
              </div>

              {/* Psychology Analysis */}
              <div>
                <div className="md-title-small mb-2">Psychology</div>
                <p className="md-body-medium">{hook.rationale}</p>
              </div>

              {/* Quality Metrics */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="text-center">
                  <div className="md-headline-small font-bold">
                    {Math.round(hook.specificityScore * 100)}%
                  </div>
                  <div 
                    className="md-label-small"
                    style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                  >
                    SPECIFICITY
                  </div>
                </div>
                <div className="text-center">
                  <div className="md-headline-small font-bold">
                    {Math.round(hook.freshnessScore * 100)}%
                  </div>
                  <div 
                    className="md-label-small"
                    style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                  >
                    ORIGINALITY
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default HookCard