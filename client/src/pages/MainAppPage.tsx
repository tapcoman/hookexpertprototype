import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useGenerationState, useNotifications } from '@/contexts/AppContext'
import { useAnalytics } from '@/lib/analytics'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { HookGenerationLoading, LoadingSpinner } from '@/components/ui/LoadingSpinner'
import HookCard from '@/components/hook/HookCard'
import { api } from '@/lib/api'
import type { GenerateHooksRequest, Platform, Objective } from '@/types/shared'

// ==================== HOOK GENERATION FORM ====================

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

  const platforms = [
    { value: 'tiktok', label: 'TikTok', description: 'Optimized for TikTok\'s algorithm' },
    { value: 'instagram', label: 'Instagram', description: 'Perfect for Reels and Stories' },
    { value: 'youtube', label: 'YouTube', description: 'Great for Shorts and videos' },
  ]

  const objectives = [
    { value: 'watch_time', label: 'Watch Time', description: 'Keep viewers engaged' },
    { value: 'shares', label: 'Shares', description: 'Encourage sharing' },
    { value: 'saves', label: 'Saves', description: 'Create saveable content' },
    { value: 'ctr', label: 'Click-Through', description: 'Drive clicks and traffic' },
    { value: 'follows', label: 'Followers', description: 'Grow your audience' },
  ]

  const canGenerate = user && (
    user.freeCredits > user.usedCredits || 
    user.subscriptionStatus === 'active' || 
    user.subscriptionStatus === 'trialing'
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg shadow-sm border p-6"
    >
      <h2 className="text-xl font-semibold text-foreground mb-4">Generate Viral Hooks</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Platform
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {platforms.map((platform) => (
              <label
                key={platform.value}
                className={`cursor-pointer border rounded-lg p-4 transition-colors ${
                  formData.platform === platform.value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="platform"
                  value={platform.value}
                  checked={formData.platform === platform.value}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, platform: e.target.value as Platform }))}
                  className="sr-only"
                />
                <div className="font-medium text-foreground mb-1">{platform.label}</div>
                <div className="text-sm text-muted-foreground">{platform.description}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Objective Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Primary Objective
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {objectives.map((objective) => (
              <label
                key={objective.value}
                className={`cursor-pointer border rounded-lg p-3 transition-colors ${
                  formData.objective === objective.value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="objective"
                  value={objective.value}
                  checked={formData.objective === objective.value}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, objective: e.target.value as Objective }))}
                  className="sr-only"
                />
                <div className="font-medium text-foreground text-sm mb-1">{objective.label}</div>
                <div className="text-xs text-muted-foreground">{objective.description}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Topic or Content Idea
          </label>
          <textarea
            value={formData.topic}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, topic: e.target.value }))}
            placeholder="Describe what your content is about... (e.g., 'How to increase productivity using AI tools for remote work')"
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.topic ? 'border-destructive' : 'border-input'
            }`}
          />
          {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic}</p>}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              Be specific for better results
            </p>
            <p className="text-xs text-muted-foreground">
              {formData.topic.length}/1000
            </p>
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            AI Model
          </label>
          <select
            value={formData.modelType}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, modelType: e.target.value as 'gpt-4o' | 'gpt-4o-mini' }))}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Fast & Efficient)</option>
            <option value="gpt-4o">GPT-4o (Premium Quality)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {formData.modelType === 'gpt-4o' ? 'Higher quality, uses pro credits' : 'Good quality, uses draft credits'}
          </p>
        </div>

        {/* Usage Info */}
        {user && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Available Credits:</span>
              <span className="font-medium">
                {user.freeCredits - user.usedCredits} free credits
                {user.subscriptionStatus === 'active' && ' + unlimited pro credits'}
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !canGenerate}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            'Generate Hooks'
          )}
        </button>

        {!canGenerate && (
          <p className="text-sm text-muted-foreground text-center">
            No credits remaining. <a href="/pricing" className="text-primary hover:underline">Upgrade your plan</a> to continue.
          </p>
        )}
      </form>
    </motion.div>
  )
}

// ==================== HOOK RESULTS ====================

interface HookResultsProps {
  generation: any
  onFavorite: (hookIndex: number) => void
  onCopy: (hook: string) => void
  favoriteHooks?: Set<string> // Set of "generationId-hookIndex" strings
}

const HookResults: React.FC<HookResultsProps> = ({ generation, onFavorite, onCopy, favoriteHooks }) => {
  if (!generation || !generation.hooks) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Generated Hooks</h3>
        <span className="text-sm text-muted-foreground">
          {generation.hooks.length} hooks generated
        </span>
      </div>

      <div className="grid gap-4">
        {generation.hooks.map((hook: any, index: number) => {
          const favoriteKey = `${generation.id}-${index}`
          const isFavorite = favoriteHooks?.has(favoriteKey) || false
          
          return (
            <HookCard
              key={index}
              hook={hook}
              platform={generation.platform}
              objective={generation.objective}
              isFavorite={isFavorite}
              onFavoriteToggle={() => onFavorite(index)}
              onCopy={() => onCopy(hook.verbalHook)}
              showDetails={true}
            />
          )
        })}
      </div>
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
      
      // Track successful generation
      track('hook_generation_completed', {
        hooksGenerated: data?.hooks?.length || 0,
        platform: data?.platform,
        objective: data?.objective,
        modelType: data?.modelType
      })
    },
    onError: (error: any) => {
      showErrorNotification('Generation Failed', error.message)
      
      // Track generation failure
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
      // Add to local state for immediate UI update
      const favoriteKey = `${variables.generationId || 'manual'}-${variables.hookData?.id || Date.now()}`
      setFavoriteHooks(prev => new Set([...prev, favoriteKey]))
      
      showSuccessNotification('Saved!', 'Hook added to your favorites.')
    },
    onError: (error: any) => {
      showErrorNotification('Save Failed', error.message)
    },
  })

  const handleGenerate = (data: GenerateHooksRequest) => {
    // Track hook generation event
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
      // Track favorite action
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
      // Track copy action
      track('hook_copied', {
        hookText: hook.substring(0, 50), // First 50 chars for privacy
        hookLength: hook.length
      })
      
      showSuccessNotification('Copied!', 'Hook copied to clipboard.')
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.firstName || 'Creator'}!
        </h1>
        <p className="text-muted-foreground">
          Ready to create some viral hooks? Let's get started.
        </p>
      </motion.div>

      {/* Generation Form */}
      <HookGenerationForm
        onGenerate={handleGenerate}
        isLoading={generateHooksMutation.isPending}
      />

      {/* Loading State */}
      {generateHooksMutation.isPending && (
        <HookGenerationLoading />
      )}

      {/* Results */}
      {currentGeneration && !generateHooksMutation.isPending && (
        <HookResults
          generation={currentGeneration}
          onFavorite={handleFavorite}
          onCopy={handleCopy}
          favoriteHooks={favoriteHooks}
        />
      )}

      {/* Getting Started Tips */}
      {!currentGeneration && !generateHooksMutation.isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Tips for Better Hooks</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">Be Specific</h4>
              <p className="text-muted-foreground">
                "5 AI tools that save me 10 hours per week" works better than "AI tools for productivity"
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Include Numbers</h4>
              <p className="text-muted-foreground">
                Numbers create curiosity and promise specific value to your audience
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Focus on Benefits</h4>
              <p className="text-muted-foreground">
                Explain what your audience will gain or how their life will improve
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Create Urgency</h4>
              <p className="text-muted-foreground">
                Use time-sensitive language to encourage immediate engagement
              </p>
            </div>
          </div>
        </motion.div>
      )}
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