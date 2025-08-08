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
    <div className="max-w-2xl mx-auto">
      {/* AI-Native Floating Interface */}
      <div className="professional-glass-card rounded-2xl p-8 space-y-8">
        {/* Modern Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-text-primary professional-text-emphasis">
            Generate Viral Hooks
          </h1>
          <p className="text-lg text-text-secondary">
            Create platform-optimized hooks that drive engagement
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Modern Platform Selection - Pill Style */}
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-text-primary mb-2" id="platform-legend">
                  Choose Your Platform
                </h3>
                <p className="text-sm text-text-secondary">
                  Select where you'll share your content
                </p>
              </div>
              
              <div 
                role="radiogroup" 
                aria-labelledby="platform-legend"
                className="flex justify-center gap-3 flex-wrap"
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
                    className={`group relative px-6 py-4 rounded-2xl backdrop-blur-sm transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent-electric focus:ring-offset-2 focus:ring-offset-surface-primary min-w-[140px] ${
                      formData.platform === platform.value
                        ? 'bg-accent-electric text-surface-primary shadow-lg shadow-accent-electric/25 scale-105'
                        : 'bg-surface-secondary hover:bg-surface-tertiary border border-border-subtle hover:border-accent-electric/50 text-text-primary hover:shadow-lg hover:shadow-accent-electric/10'
                    }`}
                    whileHover={{ scale: formData.platform === platform.value ? 1.05 : 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
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
                    
                    <div className="relative flex flex-col items-center space-y-2">
                      <span className="text-2xl" aria-hidden="true">{platform.icon}</span>
                      <span className="font-semibold text-sm">{platform.label}</span>
                      <span 
                        className="text-xs opacity-75 text-center leading-tight" 
                        id={`platform-${platform.value}-desc`}
                      >
                        {platform.description}
                      </span>
                      {formData.platform === platform.value && (
                        <span className="sr-only">selected</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Smart Goal - Auto-optimized based on platform */}
            <div className="text-center p-6 bg-surface-secondary/50 rounded-xl border border-border-subtle">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-accent-electric" />
                <span className="font-semibold text-text-primary">Smart Optimization</span>
              </div>
              <p className="text-sm text-text-secondary">
                Automatically optimizing for{' '}
                <span className="font-medium text-accent-electric">
                  {formData.platform === 'tiktok' ? 'Watch Time' : 
                   formData.platform === 'instagram' ? 'Shares & Engagement' : 'Click-Through Rate'}
                </span>
                {' '}based on your platform selection
              </p>
            </div>

            {/* AI-Native Topic Input */}
            <div className="space-y-5">
              <div className="space-y-3">
                <label htmlFor="topic" className="text-lg font-semibold text-text-primary block text-center">
                  Describe Your Content Idea
                </label>
                <p className="text-sm text-text-secondary text-center max-w-lg mx-auto leading-relaxed" id="topic-description">
                  Share your topic, angle, or story. The more specific you are, the better your hooks will be.
                </p>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-electric/20 via-transparent to-accent-electric/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <textarea
                    id="topic"
                    value={formData.topic}
                    onChange={handleTopicChange}
                    placeholder="Example: I tried eating only white foods for 30 days and documented every single change to my energy levels, skin, and mood - the results completely shocked me..."
                    className={`professional-input w-full min-h-[140px] resize-none rounded-2xl px-6 py-5 text-text-primary placeholder-text-secondary/70 leading-relaxed focus:outline-none transition-all duration-300 ${
                      errors.topic 
                        ? 'border-destructive focus:ring-destructive' 
                        : charCount < 10 
                        ? 'border-yellow-400/50 focus:border-yellow-400' 
                        : 'focus:border-accent-electric'
                    }`}
                    aria-describedby="topic-description topic-feedback topic-counter"
                    aria-invalid={!!errors.topic}
                  />
                  <div className="absolute bottom-4 right-5 flex items-center space-x-2">
                    <span className={`text-xs font-mono transition-colors ${
                      charCount < 10 ? 'text-yellow-400' : 
                      charCount > 800 ? 'text-yellow-400' : 
                      charCount > 30 ? 'text-accent-electric' :
                      'text-text-secondary'
                    }`}>
                      {charCount}
                    </span>
                    <div className="w-1 h-4 bg-border-subtle rounded-full" />
                    <span className="text-xs text-text-secondary font-mono">1000</span>
                  </div>
                </div>
                
                {/* Smart Feedback */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1"
                      role="status" 
                      aria-live="polite" 
                      id="topic-feedback"
                    >
                      {liveFeedback && (
                        <motion.div
                          className="flex items-center space-x-2"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            liveFeedback.includes('Great') ? 'bg-success-green' :
                            liveFeedback.includes('Good') ? 'bg-accent-electric' :
                            liveFeedback.includes('Consider') ? 'bg-warning-amber' :
                            'bg-text-secondary'
                          }`} />
                          <p className={`text-sm font-medium ${
                            liveFeedback.includes('Great') ? 'text-success-green' :
                            liveFeedback.includes('Good') ? 'text-accent-electric' :
                            liveFeedback.includes('Consider') ? 'text-warning-amber' :
                            'text-text-secondary'
                          }`}>
                            {liveFeedback}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  {/* Elegant Progress Bar */}
                  <div className="relative">
                    <div className="w-full h-1 bg-surface-tertiary rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          charCount < 10 ? 'bg-gradient-to-r from-warning-amber/70 to-warning-amber' :
                          charCount > 800 ? 'bg-gradient-to-r from-warning-amber/70 to-warning-amber' :
                          charCount > 30 ? 'bg-gradient-to-r from-accent-electric/70 to-success-green' :
                          'bg-gradient-to-r from-accent-electric/50 to-accent-electric'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((charCount / 1000) * 100, 100)}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
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

            {/* AI-Native Generate Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !canGenerate}
              className={`relative w-full min-h-[56px] rounded-2xl font-semibold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-electric focus:ring-offset-4 focus:ring-offset-surface-primary overflow-hidden ${
                isLoading || !canGenerate
                  ? 'bg-surface-tertiary text-text-secondary cursor-not-allowed'
                  : 'professional-button text-surface-primary hover:scale-[1.02] active:scale-[0.98]'
              }`}
              whileHover={!isLoading && canGenerate ? { scale: 1.02 } : {}}
              whileTap={!isLoading && canGenerate ? { scale: 0.98 } : {}}
              aria-describedby={!canGenerate ? "no-credits-message" : undefined}
              aria-live="polite"
            >
              {/* Animated background */}
              {!isLoading && canGenerate && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-accent-electric via-accent-teal to-success-green opacity-90"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    ease: 'linear',
                    repeat: Infinity,
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                />
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
                      <span>Creating magic...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="generate"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center space-x-3"
                    >
                      <Sparkles className="w-5 h-5" aria-hidden="true" />
                      <span>Generate 10 Viral Hooks</span>
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
      </div>
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
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Your Viral Hooks</h2>
        <p className="text-muted-foreground">
          <span className="font-semibold">{generation.hooks.length}</span> hooks generated for{' '}
          <Badge variant="secondary" className="capitalize">{generation.platform}</Badge>
        </p>
      </div>

      {/* Hook Grid */}
      <motion.div 
        className="grid gap-6"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.3
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {generation.hooks.map((hook: any, index: number) => {
          const favoriteKey = `${generation.id}-${index}`
          const isFavorite = favoriteHooks?.has(favoriteKey) || false
          
          return (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
              }}
            >
              <HookCard
                hook={hook}
                platform={generation.platform}
                objective={generation.objective}
                isFavorite={isFavorite}
                onFavoriteToggle={() => onFavorite(index)}
                onCopy={() => onCopy(hook.verbalHook)}
                showDetails={true}
              />
            </motion.div>
          )
        })}
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
      {/* Page Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hook Generator</h1>
              <p className="text-sm text-muted-foreground">Create viral hooks for your content</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          
          {/* Generation Form */}
          <HookGenerationForm
            onGenerate={handleGenerate}
            isLoading={generateHooksMutation.isPending}
          />

          {/* Loading State */}
          {generateHooksMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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