import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useGenerationState, useNotifications } from '@/contexts/AppContext'
import { useAnalytics } from '@/lib/analytics'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { HookGenerationLoading, LoadingSpinner } from '@/components/ui/LoadingSpinner'
import HookCard from '@/components/hook/HookCard'
import EmptyState from '@/components/ui/EmptyState'
import RecentTopics from '@/components/hook/RecentTopics'
import AppHeader from '@/components/layout/AppHeader'
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
    { value: 'instagram', label: 'Reels', description: 'Perfect for Instagram Reels' },
    { value: 'youtube', label: 'Shorts', description: 'Great for YouTube Shorts' },
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Hooks</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Selection */}
        <div>
          <div className="grid grid-cols-3 gap-2">
            {platforms.map((platform) => (
              <button
                key={platform.value}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, platform: platform.value as Platform }))}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  formData.platform === platform.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>

        {/* Objective Selection */}
        <div>
          <select
            value={formData.objective}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, objective: e.target.value as Objective }))}
            className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {objectives.map((objective) => (
              <option key={objective.value} value={objective.value}>
                {objective.label}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Input */}
        <div>
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">Video Topic</span>
          </div>
          <textarea
            value={formData.topic}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, topic: e.target.value }))}
            placeholder="Describe your video idea... e.g., '7-day sugar-free experiment results'"
            rows={4}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              errors.topic ? 'border-red-300' : 'border-gray-200'
            }`}
          />
          {errors.topic && <p className="text-sm text-red-600 mt-1">{errors.topic}</p>}
          <p className="text-xs text-gray-500 mt-2">
            Be specific about what your video will cover
          </p>
        </div>



        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !canGenerate}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            'Generate 10 Hooks'
          )}
        </button>

        {!canGenerate && (
          <p className="text-sm text-gray-500 text-center">
            No credits remaining. <a href="/pricing" className="text-blue-600 hover:underline">Upgrade your plan</a> to continue.
          </p>
        )}
      </form>
    </div>
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
    // Open tutorial video or modal
    window.open('https://youtube.com/watch?v=tutorial', '_blank')
  }

  // Mock recent topics for demo
  const recentTopics = [
    {
      id: '1',
      topic: '5 morning habits that changed my productivity',
      platform: 'tiktok' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      id: '2', 
      topic: 'Why I quit my 6-figure job to become a creator',
      platform: 'instagram' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    },
    {
      id: '3',
      topic: 'The truth about passive income (reality check)',
      platform: 'youtube' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
    }
  ]

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <AppHeader />
        
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Sidebar - Form */}
          <div className="w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <HookGenerationForm
              onGenerate={handleGenerate}
              isLoading={generateHooksMutation.isPending}
            />
            
            <RecentTopics 
              topics={recentTopics}
              onTopicClick={(topic) => {
                // Auto-fill form with selected topic
                const formData: GenerateHooksRequest = {
                  platform: topic.platform,
                  objective: 'watch_time',
                  topic: topic.topic,
                  modelType: 'gpt-4o-mini'
                }
                handleGenerate(formData)
              }}
            />
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Loading State */}
            {generateHooksMutation.isPending && (
              <div className="flex-1 flex items-center justify-center">
                <HookGenerationLoading />
              </div>
            )}

            {/* Results */}
            {currentGeneration && !generateHooksMutation.isPending && (
              <div className="flex-1 p-6 overflow-y-auto">
                <HookResults
                  generation={currentGeneration}
                  onFavorite={handleFavorite}
                  onCopy={handleCopy}
                  favoriteHooks={favoriteHooks}
                />
              </div>
            )}

            {/* Empty State */}
            {!currentGeneration && !generateHooksMutation.isPending && (
              <EmptyState 
                onGenerateSample={handleGenerateSample}
                onWatchTutorial={handleWatchTutorial}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Falls back to original design */}
      <div className="lg:hidden">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg shadow-sm border p-6"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">Generate Viral Hooks</h2>
            <HookGenerationForm
              onGenerate={handleGenerate}
              isLoading={generateHooksMutation.isPending}
            />
          </motion.div>

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

          {/* Empty State */}
          {!currentGeneration && !generateHooksMutation.isPending && (
            <EmptyState 
              onGenerateSample={handleGenerateSample}
              onWatchTutorial={handleWatchTutorial}
            />
          )}
        </div>
      </div>
    </>
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