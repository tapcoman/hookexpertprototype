import React, { useState } from 'react'
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
import { api } from '@/lib/api'
import { Sparkles, Target, TrendingUp, PlayCircle, Users } from 'lucide-react'
import type { GenerateHooksRequest, Platform, Objective } from '@/types/shared'

// ==================== MATERIAL DESIGN HOOK GENERATION FORM ====================

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
    setFormData((prev: any) => ({ ...prev, topic: value }))
  }

  const platforms = [
    { value: 'tiktok', label: 'TikTok', icon: '🎵', description: 'Short-form viral videos' },
    { value: 'instagram', label: 'Instagram', icon: '📸', description: 'Stories & Reels' },
    { value: 'youtube', label: 'YouTube', icon: '🎥', description: 'Long-form content' },
  ]

  const objectives = [
    { value: 'watch_time', label: 'Watch Time', icon: PlayCircle, description: 'Keep viewers watching' },
    { value: 'shares', label: 'Shares', icon: TrendingUp, description: 'Drive viral sharing' },
    { value: 'saves', label: 'Saves', icon: Target, description: 'High save rates' },
    { value: 'ctr', label: 'Click Rate', icon: Sparkles, description: 'Increase clicks' },
    { value: 'follows', label: 'Followers', icon: Users, description: 'Grow audience' },
  ]

  const canGenerate = user && (
    user.freeCredits > user.usedCredits || 
    user.subscriptionStatus === 'active' || 
    user.subscriptionStatus === 'trialing'
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="md-elevated-card">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="md-headline-large mb-4">
            Generate Viral Hooks
          </h1>
          <p className="md-body-large" style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            Create platform-optimized hooks that drive engagement
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-4">
            <label className="md-title-small block">
              Choose Platform
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <motion.button
                  key={platform.value}
                  type="button"
                  onClick={() => setFormData((prev: any) => ({ ...prev, platform: platform.value as Platform }))}
                  className={`md-state-layer p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    formData.platform === platform.value
                      ? 'border-current'
                      : 'border-transparent'
                  }`}
                  style={{
                    backgroundColor: formData.platform === platform.value 
                      ? 'rgb(var(--md-sys-color-secondary-container))'
                      : 'rgb(var(--md-sys-color-surface-variant))',
                    color: formData.platform === platform.value
                      ? 'rgb(var(--md-sys-color-on-secondary-container))'
                      : 'rgb(var(--md-sys-color-on-surface-variant))',
                    borderColor: formData.platform === platform.value
                      ? 'rgb(var(--md-sys-color-primary))'
                      : 'rgb(var(--md-sys-color-outline-variant))'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="md-title-medium font-medium">{platform.label}</span>
                  </div>
                  <p className="md-body-small opacity-80">{platform.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Objective Selection */}
          <div className="space-y-4">
            <label className="md-title-small block">
              Optimization Goal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {objectives.map((objective) => {
                const Icon = objective.icon
                return (
                  <motion.button
                    key={objective.value}
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, objective: objective.value as Objective }))}
                    className={`md-filter-chip p-3 text-center ${
                      formData.objective === objective.value ? 'selected' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <div className="md-label-medium">{objective.label}</div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Topic Input */}
          <div className="space-y-4">
            <div className="md-outlined-text-field">
              <textarea
                value={formData.topic}
                onChange={handleTopicChange}
                placeholder=" "
                rows={4}
                className={errors.topic ? '!border-red-500' : ''}
                style={{ minHeight: '120px' }}
              />
              <label>Video Topic</label>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="md-body-small" style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
                Be specific and descriptive for best results
              </p>
              <span className={`md-body-small ${
                charCount < 10 ? 'text-red-500' : 
                charCount > 800 ? 'text-amber-500' : 
                'opacity-60'
              }`}>
                {charCount}/1000
              </span>
            </div>
            
            {errors.topic && (
              <motion.p 
                className="md-body-small text-red-500"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {errors.topic}
              </motion.p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !canGenerate}
            className={`w-full md-filled-button h-12 ${
              !canGenerate ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            whileHover={canGenerate ? { scale: 1.02 } : {}}
            whileTap={canGenerate ? { scale: 0.98 } : {}}
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
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  <Sparkles className="w-5 h-5" />
                  <span>Generate 10 Hooks</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {!canGenerate && (
            <motion.p 
              className="text-center md-body-small"
              style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              No credits remaining.{' '}
              <a 
                href="/pricing" 
                className="font-medium hover:underline transition-colors duration-200"
                style={{ color: 'rgb(var(--md-sys-color-primary))' }}
              >
                Upgrade your plan
              </a>{' '}
              to continue.
            </motion.p>
          )}
        </form>
      </div>
    </div>
  )
}

// ==================== MATERIAL DESIGN HOOK RESULTS ====================

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
      <div className="text-center space-y-3 pb-6 border-b border-gray-200">
        <h2 className="md-headline-medium">
          Your Viral Hooks
        </h2>
        <p className="md-body-medium" style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
          <span className="font-semibold">{generation.hooks.length}</span> hooks generated for{' '}
          <span className="font-medium capitalize">{generation.platform}</span>
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
    <div style={{ backgroundColor: 'rgb(var(--md-sys-color-background))' }}>
      <AppHeader />
      
      {/* Material Design Layout */}
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