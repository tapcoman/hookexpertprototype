import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useGenerationState, useNotifications } from '@/contexts/AppContext'
import { useAnalytics } from '@/lib/analytics'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { HookGenerationLoading } from '@/components/ui/LoadingSpinner'
import HookCard from '@/components/hook/HookCard'
import EmptyState from '@/components/ui/EmptyState'
import AppShell from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { Sparkles, Target, TrendingUp, PlayCircle, Users } from 'lucide-react'
import type { GenerateHooksRequest, Platform, Objective } from '@/types/shared'

// ==================== SHADCN UI HOOK GENERATION FORM ====================

interface HookGenerationFormProps {
  onGenerate: (data: GenerateHooksRequest) => void
  isLoading: boolean
}

const HookGenerationForm: React.FC<HookGenerationFormProps> = ({ onGenerate, isLoading }) => {
  const { user } = useAuth()
  const { defaultPlatform, defaultObjective } = useGenerationState()
  
  const [formData, setFormData] = useState<GenerateHooksRequest>({
    platform: (defaultPlatform as Platform) || 'tiktok',
    objective: (defaultObjective as Objective) || 'watch_time',
    topic: '',
    modelType: 'gpt-5-mini-2025-08-07',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [charCount, setCharCount] = useState(0)
  const [liveFeedback, setLiveFeedback] = useState('')
  const [isFormFocused, setIsFormFocused] = useState(false)

  // Set initial focus and tabindex for platform buttons
  useEffect(() => {
    const selectedButton = document.querySelector(`[data-platform-button][aria-checked="true"]`) as HTMLElement
    if (selectedButton) {
      selectedButton.setAttribute('tabindex', '0')
    }
  }, [formData.platform])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.topic.trim()) {
      newErrors.topic = 'Please enter a topic'
    } else if (formData.topic.length < 10) {
      newErrors.topic = 'Topic must be at least 10 characters'
    } else if (formData.topic.length > 1000) {
      newErrors.topic = 'Topic must be less than 1000 characters'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onGenerate(formData)
    }
  }

  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setCharCount(value.length)
    setFormData(prev => ({ ...prev, topic: value }))
    
    // Live feedback for topic quality
    if (value.length < 10) {
      setLiveFeedback('Add more details for better results')
    } else if (value.length < 30) {
      setLiveFeedback('Good start! More details will help')
    } else if (value.length > 800) {
      setLiveFeedback('Consider shortening for better focus')
    } else {
      setLiveFeedback('Great! Your topic looks detailed')
    }
  }

  // Get default objective for platform
  const getDefaultObjective = (platform: Platform): Objective => {
    const defaults: Record<Platform, Objective> = {
      tiktok: 'watch_time',
      instagram: 'shares', 
      youtube: 'ctr'
    }
    return defaults[platform] || 'watch_time'
  }

  // Handle platform selection with keyboard
  const handlePlatformSelection = (platform: Platform) => {
    const newObjective = getDefaultObjective(platform)
    setFormData(prev => ({ 
      ...prev, 
      platform,
      objective: newObjective
    }))
  }

  // Keyboard navigation for platform buttons
  const handlePlatformKeyDown = (e: React.KeyboardEvent, platform: Platform, index: number) => {
    const platformElements = document.querySelectorAll('[data-platform-button]')
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handlePlatformSelection(platform)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        const nextIndex = (index + 1) % platformElements.length;
        (platformElements[nextIndex] as HTMLElement)?.focus()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        const prevIndex = (index - 1 + platformElements.length) % platformElements.length;
        (platformElements[prevIndex] as HTMLElement)?.focus()
        break
    }
  }

  const platforms = [
    { value: 'tiktok', label: 'TikTok', icon: '🎵', description: 'Short-form viral videos' },
    { value: 'instagram', label: 'Instagram', icon: '📸', description: 'Stories & Reels' },
    { value: 'youtube', label: 'YouTube', icon: '🎥', description: 'Long-form content' },
  ]

  const objectives = [
    { value: 'watch_time', label: 'Watch Time', icon: PlayCircle },
    { value: 'shares', label: 'Shares', icon: TrendingUp },
    { value: 'saves', label: 'Saves', icon: Target },
    { value: 'ctr', label: 'Click Rate', icon: Sparkles },
    { value: 'follows', label: 'Followers', icon: Users },
  ]

  const canGenerate = user && (
    user.freeCredits > user.usedCredits || 
    user.subscriptionStatus === 'active' || 
    user.subscriptionStatus === 'trialing'
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Premium AI Interface */}
      <motion.div 
        className="professional-glass-card rounded-2xl sm:rounded-3xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Modern Header with Gradient */}
        <div className="relative px-6 sm:px-10 py-6 sm:py-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-electric/10 via-transparent to-success-green/10 opacity-50" />
          <div className="relative space-y-3 sm:space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-electric/10 border border-accent-electric/20 text-accent-electric text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Hook Generation
            </motion.div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary bg-gradient-to-r from-text-primary via-accent-electric to-success-green bg-clip-text text-transparent">
              Create Viral Hooks
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto px-4">
              Generate platform-optimized hooks using advanced AI and psychological frameworks
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-10 pb-8 sm:pb-10 space-y-8 sm:space-y-10">
            {/* Premium Platform Selection */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text-primary mb-2 sm:mb-3" id="platform-legend">
                  Select Platform
                </h3>
                <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto px-4">
                  Choose your target platform to optimize hook performance
                </p>
              </div>
              
              <div 
                role="radiogroup" 
                aria-labelledby="platform-legend"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto"
              >
                {platforms.map((platform, index) => (
                  <motion.button
                    key={platform.value}
                    type="button"
                    role="radio"
                    aria-checked={formData.platform === platform.value}
                    aria-describedby={`platform-${platform.value}-desc`}
                    data-platform-button
                    tabIndex={formData.platform === platform.value ? 0 : -1}
                    onClick={() => handlePlatformSelection(platform.value as Platform)}
                    onKeyDown={(e) => handlePlatformKeyDown(e, platform.value as Platform, index)}
                    className={`group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all duration-500 ease-out focus:outline-none focus:ring-3 focus:ring-accent-electric/30 focus:ring-offset-2 focus:ring-offset-surface-primary ${
                      formData.platform === platform.value
                        ? 'bg-gradient-to-br from-accent-electric to-accent-electric/80 text-surface-primary shadow-xl shadow-accent-electric/25 border-2 border-accent-electric/50'
                        : 'bg-surface-secondary/80 hover:bg-surface-tertiary border-2 border-border-subtle hover:border-accent-electric/30 text-text-primary hover:shadow-xl hover:shadow-accent-electric/10'
                    }`}
                    whileHover={{ 
                      scale: formData.platform === platform.value ? 1.02 : 1.03, 
                      y: -3,
                      rotateY: 2
                    }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    {/* Selection indicator */}
                    {formData.platform === platform.value && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent-electric/20 via-transparent to-accent-electric/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="relative">
                        <span className="text-4xl" aria-hidden="true">{platform.icon}</span>
                        {formData.platform === platform.value && (
                          <motion.div
                            className="absolute -inset-2 rounded-full bg-surface-primary/20"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-base sm:text-lg block">{platform.label}</span>
                        <span 
                          className="text-xs sm:text-sm opacity-80 text-center leading-relaxed mt-1" 
                          id={`platform-${platform.value}-desc`}
                        >
                          {platform.description}
                        </span>
                      </div>
                      {formData.platform === platform.value && (
                        <>
                          <motion.div 
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success-green flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="text-xs text-surface-primary">✓</span>
                          </motion.div>
                          <span className="sr-only">selected</span>
                        </>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Smart Goal - Enhanced Design */}
            <motion.div 
              className="text-center p-6 sm:p-8 bg-gradient-to-br from-surface-secondary/80 to-surface-tertiary/60 rounded-xl sm:rounded-2xl border border-border-subtle backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-2 rounded-full bg-accent-electric/10">
                  <Target className="w-6 h-6 text-accent-electric" />
                </div>
                <span className="font-semibold text-lg text-text-primary">AI Optimization</span>
              </div>
              <p className="text-base text-text-secondary leading-relaxed">
                Automatically optimizing for{' '}
                <span className="font-semibold text-accent-electric px-2 py-1 rounded-md bg-accent-electric/10">
                  {formData.platform === 'tiktok' ? 'Watch Time & Retention' : 
                   formData.platform === 'instagram' ? 'Shares & Engagement' : 'Click-Through & Retention'}
                </span>
                {' '}based on {formData.platform} best practices
              </p>
            </motion.div>

            {/* Premium Topic Input */}
            <div className="space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <label htmlFor="topic" className="text-xl sm:text-2xl font-semibold text-text-primary block text-center">
                  Describe Your Content
                </label>
                <p className="text-sm sm:text-base text-text-secondary text-center max-w-2xl mx-auto leading-relaxed px-4" id="topic-description">
                  Share your topic, angle, or story. Be specific about your unique perspective, results, or insights for the best hooks.
                </p>
                <div className="relative group max-w-4xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-electric/10 via-success-green/5 to-accent-electric/10 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-electric/5 to-transparent rounded-3xl opacity-0 group-focus-within:opacity-100 transition-all duration-700 delay-100" />
                  <textarea
                    id="topic"
                    value={formData.topic}
                    onChange={handleTopicChange}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={() => setIsFormFocused(false)}
                    placeholder="Example: I tried eating only white foods for 30 days and documented every single change to my energy levels, skin, and mood - the results completely shocked me and my doctor..."
                    className={`professional-input w-full min-h-[120px] sm:min-h-[160px] resize-none rounded-2xl sm:rounded-3xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-base sm:text-lg text-text-primary placeholder-text-secondary/60 leading-relaxed focus:outline-none transition-all duration-500 relative z-10 ${
                      errors.topic 
                        ? 'border-2 border-destructive focus:ring-4 focus:ring-destructive/20' 
                        : charCount < 10 
                        ? 'border-2 border-warning-amber/50 focus:border-warning-amber focus:ring-4 focus:ring-warning-amber/20' 
                        : 'border-2 focus:border-accent-electric focus:ring-4 focus:ring-accent-electric/20'
                    }`}
                    aria-describedby="topic-description topic-feedback topic-counter"
                    aria-invalid={!!errors.topic}
                    rows={5}
                  />
                  <div className="absolute bottom-3 sm:bottom-6 right-4 sm:right-8 flex items-center space-x-2 sm:space-x-3 bg-surface-primary/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-border-subtle">
                    <motion.span 
                      className={`text-xs sm:text-sm font-semibold transition-colors ${
                        charCount < 10 ? 'text-warning-amber' : 
                        charCount > 800 ? 'text-warning-amber' : 
                        charCount > 30 ? 'text-success-green' :
                        'text-text-secondary'
                      }`}
                      animate={{
                        scale: charCount > 30 ? [1, 1.05, 1] : 1
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {charCount}
                    </motion.span>
                    <div className="w-1 h-5 bg-border-subtle rounded-full" />
                    <span className="text-sm text-text-secondary font-semibold">1000</span>
                  </div>
                </div>
                
                {/* Enhanced Smart Feedback */}
                <div className="space-y-6">
                  <div className="text-center">
                    <div 
                      className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300"
                      role="status" 
                      aria-live="polite" 
                      id="topic-feedback"
                    >
                      <AnimatePresence mode="wait">
                        {liveFeedback && (
                          <motion.div
                            key={liveFeedback}
                            className="flex items-center space-x-3"
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                          >
                            <motion.div 
                              className={`w-3 h-3 rounded-full ${
                                liveFeedback.includes('Great') ? 'bg-success-green' :
                                liveFeedback.includes('Good') ? 'bg-accent-electric' :
                                liveFeedback.includes('Consider') ? 'bg-warning-amber' :
                                'bg-text-secondary'
                              }`}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <p className={`text-base font-semibold ${
                              liveFeedback.includes('Great') ? 'text-success-green' :
                              liveFeedback.includes('Good') ? 'text-accent-electric' :
                              liveFeedback.includes('Consider') ? 'text-warning-amber' :
                              'text-text-secondary'
                            }`}>
                              {liveFeedback}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Premium Progress Bar */}
                  <div className="relative max-w-2xl mx-auto">
                    <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden border border-border-subtle">
                      <motion.div 
                        className={`h-full rounded-full transition-all duration-700 relative ${
                          charCount < 10 ? 'bg-gradient-to-r from-warning-amber/60 via-warning-amber to-warning-amber/80' :
                          charCount > 800 ? 'bg-gradient-to-r from-warning-amber/60 via-warning-amber to-warning-amber/80' :
                          charCount > 30 ? 'bg-gradient-to-r from-accent-electric via-accent-electric/80 to-success-green' :
                          'bg-gradient-to-r from-accent-electric/40 via-accent-electric/60 to-accent-electric'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((charCount / 1000) * 100, 100)}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {charCount > 30 && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {errors.topic && (
                  <motion.div 
                    className="flex items-start space-x-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    role="alert"
                    aria-live="assertive"
                  >
                    <span className="text-destructive mt-0.5">⚠</span>
                    <p className="text-sm text-destructive">
                      {errors.topic}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Premium Generate Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !canGenerate}
              className={`relative w-full min-h-[56px] sm:min-h-[68px] rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-accent-electric/30 focus:ring-offset-4 focus:ring-offset-surface-primary overflow-hidden group ${
                isLoading || !canGenerate
                  ? 'bg-surface-tertiary text-text-secondary cursor-not-allowed'
                  : 'professional-button text-surface-primary shadow-2xl hover:shadow-3xl'
              }`}
              whileHover={!isLoading && canGenerate ? { 
                scale: 1.02, 
                y: -2,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
              } : {}}
              whileTap={!isLoading && canGenerate ? { scale: 0.98 } : {}}
              aria-describedby={!canGenerate ? "no-credits-message" : undefined}
              aria-live="polite"
            >
              {/* Enhanced Animated background */}
              {!isLoading && canGenerate && (
                <>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent-electric via-success-green to-accent-teal opacity-90"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 4,
                      ease: 'linear',
                      repeat: Infinity,
                    }}
                    style={{ backgroundSize: '300% 300%' }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                </>
              )}
              
              <div className="relative z-10">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center space-x-3"
                    >
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-text-secondary rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-text-secondary rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-text-secondary rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-base sm:text-lg">Creating your viral hooks...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="generate"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center space-x-3"
                    >
                      <Sparkles className="w-6 h-6" aria-hidden="true" />
                      <span className="text-lg sm:text-xl">Generate Viral Hooks</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            {!canGenerate && (
              <motion.div 
                className="text-center text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                id="no-credits-message"
                role="status"
                aria-live="polite"
              >
                <p>
                  No credits remaining.{' '}
                  <a 
                    href="/pricing" 
                    className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Upgrade your plan to get more credits"
                  >
                    Upgrade your plan
                  </a>{' '}
                  to continue.
                </p>
              </motion.div>
            )}
          </form>
      </motion.div>
    </div>
  )
}

// ==================== SHADCN UI HOOK RESULTS ====================

interface HookResultsProps {
  generation: any
  onFavorite: (hookIndex: number) => void
  onCopy: (hook: string) => void
  favoriteHooks?: Set<string>
}

const HookResults: React.FC<HookResultsProps> = ({ generation, onFavorite, onCopy, favoriteHooks }) => {
  if (!generation || !generation.hooks) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      {/* Premium Header */}
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-success-green/10 to-accent-electric/10 border border-success-green/20">
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-success-green" />
            </motion.div>
            <span className="font-semibold text-success-green">Generation Complete</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-text-primary via-accent-electric to-success-green bg-clip-text text-transparent">
            Your Viral Hooks
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-base sm:text-lg">
            <span className="font-bold text-xl sm:text-2xl text-accent-electric">{generation.hooks.length}</span>
            <span className="text-text-secondary text-center">premium hooks generated for</span>
            <Badge 
              variant="secondary" 
              className="capitalize px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-semibold bg-gradient-to-r from-accent-electric/10 to-success-green/10 border-accent-electric/30 text-accent-electric"
            >
              {generation.platform}
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* Premium Hook Grid */}
      <motion.div 
        className="grid gap-6 sm:gap-8 max-w-7xl mx-auto px-4 sm:px-6"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.4
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {generation.hooks.map((hook: any, index: number) => {
          const favoriteKey = `${generation.id}-${index}`
          const isFavorite = favoriteHooks?.has(favoriteKey) || false
          const isTopPerformer = index < 3 // Mark top 3 as premium
          
          return (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1],
                    type: 'spring',
                    stiffness: 100,
                    damping: 15
                  } 
                }
              }}
              className="relative"
            >
              {/* Premium Badge for Top Performers */}
              {isTopPerformer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                  className="absolute -top-3 -right-3 z-10 bg-gradient-to-r from-premium-gold to-premium-gold-light text-surface-primary px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                >
                  {index === 0 ? '🏆 TOP' : `#${index + 1}`}
                </motion.div>
              )}
              
              <HookCard
                hook={hook}
                platform={generation.platform}
                objective={generation.objective}
                isFavorite={isFavorite}
                isHighestScoring={index === 0}
                onFavoriteToggle={() => onFavorite(index)}
                onCopy={() => onCopy(hook.verbalHook)}
                showDetails={true}
                className={isTopPerformer ? 'premium-hook-card' : ''}
              />
            </motion.div>
          )
        })}
      </motion.div>
      
      {/* Results Summary Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="text-center space-y-4 pt-8 border-t border-border-subtle"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-6 sm:px-8 py-4 sm:py-4 rounded-2xl bg-surface-secondary/50 backdrop-blur-sm border border-border-subtle">
          <div className="flex items-center gap-2">
            <Target className="w-4 sm:w-5 h-4 sm:h-5 text-accent-electric" />
            <span className="text-xs sm:text-sm text-text-secondary">Optimized for {generation.platform}</span>
          </div>
          <div className="hidden sm:block w-1 h-6 bg-border-subtle rounded-full" />
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-success-green" />
            <span className="text-xs sm:text-sm text-text-secondary">AI-analyzed for engagement</span>
          </div>
          <div className="hidden sm:block w-1 h-6 bg-border-subtle rounded-full" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-premium-gold" />
            <span className="text-xs sm:text-sm text-text-secondary">Ready to use</span>
          </div>
        </div>
        
        <p className="text-xs sm:text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed px-4 text-center">
          Each hook has been crafted using psychological frameworks and platform-specific optimization. 
          Click to copy your favorites and start creating viral content.
        </p>
      </motion.div>
    </motion.div>
  )
}

// ==================== MAIN COMPONENT ====================

const MainAppPageContent: React.FC = () => {
  const { user } = useAuth()
  const { currentGeneration, setCurrentGeneration, addRecentGeneration } = useGenerationState()
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  const { track } = useAnalytics(user?.id)
  const [favoriteHooks, setFavoriteHooks] = useState<Set<string>>(new Set())

  // Hook generation mutation
  const generateHooksMutation = useMutation({
    mutationFn: async (data: GenerateHooksRequest) => {
      const response = await api.hooks.generateHooks(data)
      return response.data
    },
    onSuccess: (data) => {
      setCurrentGeneration(data)
      addRecentGeneration(data)
      showSuccessNotification('Hooks Generated!', `Created ${data?.hooks?.length || 0} viral hooks for you.`)
      
      track('hook_generation_completed', {
        hooksGenerated: data?.hooks?.length || 0,
        platform: data?.platform,
        objective: data?.objective,
        modelType: data?.modelType
      })
    },
    onError: (error: any) => {
      showErrorNotification('Generation Failed', error.message)
      
      track('hook_generation_failed', {
        error: error.message,
        errorCode: error.status
      })
    },
  })

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async ({ generationId, hookData, framework, platformNotes, topic, platform }: { 
      generationId?: string, 
      hookData: any, 
      framework: string, 
      platformNotes: string, 
      topic?: string, 
      platform?: string 
    }) => {
      const apiData: any = {
        hookData,
        framework,
        platformNotes
      }
      if (generationId) apiData.generationId = generationId
      if (topic) apiData.topic = topic
      if (platform) apiData.platform = platform
      
      await api.hooks.addToFavorites(apiData)
    },
    onSuccess: (_, variables) => {
      const favoriteKey = `${variables.generationId || 'manual'}-${variables.hookData?.id || Date.now()}`
      setFavoriteHooks(prev => new Set([...prev, favoriteKey]))
      
      showSuccessNotification('Saved!', 'Hook added to your favorites.')
    },
    onError: (error: any) => {
      showErrorNotification('Save Failed', error.message)
    },
  })

  const handleGenerate = (data: GenerateHooksRequest) => {
    track('hook_generation_started', {
      platform: data.platform,
      objective: data.objective,
      modelType: data.modelType,
      topicLength: data.topic.length
    })
    
    generateHooksMutation.mutate(data)
  }

  const handleFavorite = (hookIndex: number) => {
    if (currentGeneration) {
      track('hook_favorited', {
        generationId: currentGeneration.id,
        hookIndex,
        platform: currentGeneration.platform,
        objective: currentGeneration.objective
      })
      
      addToFavoritesMutation.mutate({
        generationId: currentGeneration.id,
        hookData: currentGeneration.hooks[hookIndex],
        framework: currentGeneration.hooks[hookIndex]?.framework || 'unknown',
        platformNotes: `Generated for ${currentGeneration.platform}`,
        topic: currentGeneration.topic,
        platform: currentGeneration.platform,
      })
    }
  }

  const handleCopy = (hook: string) => {
    navigator.clipboard.writeText(hook).then(() => {
      track('hook_copied', {
        hookText: hook.substring(0, 50),
        hookLength: hook.length
      })
      
      showSuccessNotification('Copied!', 'Hook copied to clipboard.')
    })
  }

  const handleGenerateSample = () => {
    const sampleData: GenerateHooksRequest = {
      platform: 'tiktok',
      objective: 'watch_time',
      topic: '7-day sugar-free experiment results - what happened to my energy levels',
      modelType: 'gpt-4o-mini'
    }
    handleGenerate(sampleData)
  }

  const handleWatchTutorial = () => {
    window.open('https://youtube.com/watch?v=tutorial', '_blank')
  }

  return (
    <AppShell>
      {/* Premium Page Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-surface-primary/90 via-surface-secondary/80 to-surface-primary/90 backdrop-blur-xl sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-accent-electric to-success-green bg-clip-text text-transparent">
                AI Hook Generator
              </h1>
              <p className="text-sm sm:text-base text-text-secondary mt-1">Create viral hooks with advanced AI and psychology</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex items-center gap-4"
            >
              <div className="text-right">
                <p className="text-xs sm:text-sm text-text-secondary">Credits Remaining</p>
                <p className="text-base sm:text-lg font-bold text-accent-electric">
                  {user ? Math.max(0, user.freeCredits - user.usedCredits) : 0}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        <div className="space-y-8 sm:space-y-12">
          
          {/* Generation Form */}
          <HookGenerationForm
            onGenerate={handleGenerate}
            isLoading={generateHooksMutation.isPending}
          />

          {/* Premium Loading State */}
          {generateHooksMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="professional-glass-card rounded-3xl p-8 max-w-4xl mx-auto"
            >
              <HookGenerationLoading />
            </motion.div>
          )}

          {/* Results */}
          {currentGeneration && !generateHooksMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <HookResults
                generation={currentGeneration}
                onFavorite={handleFavorite}
                onCopy={handleCopy}
                favoriteHooks={favoriteHooks}
              />
            </motion.div>
          )}

          {/* Empty State */}
          {!currentGeneration && !generateHooksMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <EmptyState 
                onGenerateSample={handleGenerateSample}
                onWatchTutorial={handleWatchTutorial}
              />
            </motion.div>
          )}
          
        </div>
      </div>
      
      {/* Mobile bottom padding for simplified nav */}
      <div className="h-20 lg:h-0" />
    </AppShell>
  )
}

const MainAppPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Main App">
      <ProtectedRoute requireAuth requireOnboarding>
        <MainAppPageContent />
      </ProtectedRoute>
    </PageErrorBoundary>
  )
}

export default MainAppPage