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
  const { toast } = useToast()
  const { track } = useAnalytics()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.verbalHook)
      
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      
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

  const [copySuccess, setCopySuccess] = useState(false)

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
    >
      {/* Swiss-inspired minimal card */}
      <div className={cn(
        "relative bg-white rounded-2xl border border-gray-200 overflow-hidden",
        "shadow-sm hover:shadow-xl transition-all duration-500",
        "hover:border-gray-300"
      )}>
        {/* Premium quality indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
          <motion.div
            className={`h-full ${
              scorePercentage >= 85 ? 'bg-emerald-500' :
              scorePercentage >= 70 ? 'bg-amber-500' : 
              'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${scorePercentage}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        </div>

        {/* Card content */}
        <div className="p-6 lg:p-8">
          {/* Header section with Swiss typography */}
          <div className="flex items-start justify-between mb-6">
            {/* Platform badge */}
            {platform && (
              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase",
                  "bg-gray-900 text-white"
                )}>
                  <Target className="w-3 h-3 mr-1" />
                  {formatPlatformName(platform)}
                </div>
              </motion.div>
            )}

            {/* Quality score with Swiss precision */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="text-right">
                <div className={cn(
                  "text-2xl font-display font-bold tracking-tight",
                  scorePercentage >= 85 ? 'text-emerald-600' :
                  scorePercentage >= 70 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {hook.score.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                  Quality
                </div>
              </div>
              
              {/* Swiss-minimal quality indicator */}
              <div className="w-12 h-12 relative">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#f3f4f6"
                    strokeWidth="3"
                    fill="none"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke={scorePercentage >= 85 ? '#10b981' : scorePercentage >= 70 ? '#f59e0b' : '#ef4444'}
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
            </motion.div>
          </div>

          {/* Main hook content - Swiss clean typography */}
          <motion.div 
            className="space-y-4 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <p className="text-lg lg:text-xl leading-relaxed text-gray-900 font-medium">
              {hook.verbalHook}
            </p>
            <div className="text-sm text-gray-500 font-medium tracking-wide">
              {hook.wordCount} words
            </div>
          </motion.div>

          {/* Tri-Modal Components with Swiss styling */}
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
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-medium text-gray-600 mb-2 tracking-wide uppercase">
                      Visual Hook
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{hook.visualHook}</p>
                  </div>
                )}
                {hook.textualHook && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-medium text-gray-600 mb-2 tracking-wide uppercase">
                      Text Overlay
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{hook.textualHook}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Psychology indicators with Swiss precision */}
          <motion.div 
            className="flex flex-wrap gap-2 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
              "bg-blue-50 text-blue-700 border border-blue-200"
            )}>
              <Brain className="w-3 h-3 mr-1" />
              {hook.psychologicalDriver.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
              getRiskColor(hook.riskFactor)
            )}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {hook.riskFactor.toUpperCase()} Risk
            </div>
          </motion.div>

          {/* Swiss-minimal action buttons */}
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <motion.button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium transition-all duration-300 hover:bg-black hover:scale-[1.02] hover:-translate-y-0.5"
              whileHover={{ scale: 1.02, y: -2 }}
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
              className={cn(
                "px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5",
                isFavorite 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className={cn(
                "w-4 h-4",
                isFavorite ? 'fill-current' : ''
              )} />
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
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium transition-all duration-300 hover:bg-gray-200 hover:scale-[1.02] hover:-translate-y-0.5 border border-gray-200"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {showAnalysis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </motion.div>

          {/* Analysis section with Swiss clean layout */}
          <AnimatePresence>
            {showAnalysis && showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4 pt-6 mt-6 border-t border-gray-200"
              >
                {/* Framework */}
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2 tracking-wide uppercase">
                    Framework
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{hook.framework}</p>
                </div>

                {/* Psychology Analysis */}
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2 tracking-wide uppercase">
                    Psychology
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{hook.rationale}</p>
                </div>

                {/* Quality Metrics with Swiss precision */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="text-center">
                    <div className="text-xl font-display font-bold text-gray-900">
                      {Math.round(hook.specificityScore * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                      Specificity
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-display font-bold text-gray-900">
                      {Math.round(hook.freshnessScore * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                      Originality
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default HookCard