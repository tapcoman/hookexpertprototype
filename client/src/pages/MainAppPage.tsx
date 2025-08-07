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
import AppHeader from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { api } from '@/lib/api'
import { Sparkles, Target, TrendingUp, PlayCircle, Users, ChevronDown, Settings } from 'lucide-react'
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
    modelType: 'gpt-4o-mini',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [charCount, setCharCount] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Generate Viral Hooks</CardTitle>
          <CardDescription className="text-lg">
            Create platform-optimized hooks that drive engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Platform Selection - Accessible Radio Group */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium" id="platform-legend">
                  Choose Platform
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Use arrow keys to navigate, Enter or Space to select
                </p>
              </div>
              <div 
                role="radiogroup" 
                aria-labelledby="platform-legend"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
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
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[88px] ${
                      formData.platform === platform.value
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl" aria-hidden="true">{platform.icon}</span>
                      <span className="font-medium">{platform.label}</span>
                      {formData.platform === platform.value && (
                        <span className="sr-only">selected</span>
                      )}
                    </div>
                    <p 
                      className="text-sm text-muted-foreground" 
                      id={`platform-${platform.value}-desc`}
                    >
                      {platform.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Advanced Options - Collapsible */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-3 hover:bg-muted/50 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  type="button"
                  aria-expanded={showAdvanced}
                  aria-controls="advanced-options"
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Advanced Options</span>
                    <Badge variant="secondary" className="text-xs">
                      {formData.platform === 'tiktok' ? 'Watch Time' : 
                       formData.platform === 'instagram' ? 'Shares' : 'Click Rate'}
                    </Badge>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showAdvanced ? 'rotate-180' : ''
                    }`} 
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent 
                id="advanced-options"
                className="space-y-4 pt-4 border-t border-border/50 mt-4"
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="objective-select" className="text-sm font-medium">
                      Optimization Goal
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose what metric to optimize for (auto-selected based on platform)
                    </p>
                  </div>
                  <Select
                    value={formData.objective}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value as Objective }))}
                  >
                    <SelectTrigger 
                      className="w-full"
                      id="objective-select"
                      aria-describedby="objective-description"
                    >
                      <SelectValue placeholder="Select optimization goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives.map((objective) => {
                        const Icon = objective.icon
                        return (
                          <SelectItem key={objective.value} value={objective.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span>{objective.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <p id="objective-description" className="text-xs text-muted-foreground">
                    {formData.objective === 'watch_time' && 'Optimizes for longer viewing duration'}
                    {formData.objective === 'shares' && 'Optimizes for social sharing and virality'}  
                    {formData.objective === 'saves' && 'Optimizes for bookmark saves'}
                    {formData.objective === 'ctr' && 'Optimizes for click-through rates'}
                    {formData.objective === 'follows' && 'Optimizes for new followers'}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Topic Input - Enhanced Accessibility */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="topic" className="text-sm font-medium">
                  Video Topic
                </label>
                <p className="text-xs text-muted-foreground" id="topic-description">
                  Be specific and descriptive for best results. Include your angle, the outcome, or what makes it interesting.
                </p>
                <div className="relative">
                  <Textarea
                    id="topic"
                    value={formData.topic}
                    onChange={handleTopicChange}
                    placeholder="Example: 'I tried eating only white foods for 30 days - here's what happened to my energy levels and skin'"
                    className={`min-h-[120px] resize-none pr-12 ${
                      errors.topic 
                        ? 'border-destructive focus:ring-destructive' 
                        : charCount < 10 
                        ? 'border-yellow-300 focus:ring-yellow-500' 
                        : 'focus:ring-primary'
                    }`}
                    aria-describedby="topic-description topic-feedback topic-counter"
                    aria-invalid={!!errors.topic}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground pointer-events-none">
                    {charCount}
                  </div>
                </div>
                
                {/* Live Feedback and Counter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1"
                      role="status" 
                      aria-live="polite" 
                      id="topic-feedback"
                    >
                      {liveFeedback && (
                        <motion.p 
                          className={`text-sm ${
                            liveFeedback.includes('Great') ? 'text-green-600' :
                            liveFeedback.includes('Good') ? 'text-blue-600' :
                            liveFeedback.includes('Consider') ? 'text-yellow-600' :
                            'text-muted-foreground'
                          }`}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {liveFeedback}
                        </motion.p>
                      )}
                    </div>
                    <span 
                      className={`text-sm font-mono ${
                        charCount < 10 ? 'text-destructive' : 
                        charCount > 800 ? 'text-yellow-600' : 
                        charCount > 30 ? 'text-green-600' :
                        'text-muted-foreground'
                      }`}
                      id="topic-counter"
                      aria-label={`${charCount} of 1000 characters used`}
                    >
                      {charCount}/1000
                    </span>
                  </div>
                  
                  {/* Character count progress indicator */}
                  <div className="w-full bg-muted rounded-full h-1">
                    <motion.div 
                      className={`h-1 rounded-full transition-colors duration-300 ${
                        charCount < 10 ? 'bg-destructive' :
                        charCount > 800 ? 'bg-yellow-500' :
                        charCount > 30 ? 'bg-green-500' :
                        'bg-primary'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((charCount / 1000) * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
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

            {/* Submit Button - Enhanced Accessibility */}
            <Button
              type="submit"
              disabled={isLoading || !canGenerate}
              className="w-full min-h-[48px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              size="lg"
              aria-describedby={!canGenerate ? "no-credits-message" : undefined}
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <div 
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" 
                      aria-hidden="true"
                    />
                    <span>Generating...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="generate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Generate 10 Hooks</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

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
        </CardContent>
      </Card>
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
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Clean shadcn/ui Layout */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
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
      </main>
    </div>
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