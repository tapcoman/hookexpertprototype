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
import { Sparkles, Zap, Target, Brain, Play } from 'lucide-react'
import type { GenerateHooksRequest, Platform, Objective } from '@/types/shared'

// ==================== SWISS-INSPIRED HOOK GENERATION FORM ====================

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
    { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'from-pink-500 to-red-500' },
    { value: 'instagram', label: 'Instagram', icon: '📸', color: 'from-purple-500 to-pink-500' },
    { value: 'youtube', label: 'YouTube', icon: '🎥', color: 'from-red-500 to-red-600' },
  ]

  const objectives = [
    { value: 'watch_time', label: 'Watch Time', icon: Target },
    { value: 'shares', label: 'Shares', icon: Zap },
    { value: 'saves', label: 'Saves', icon: Brain },
    { value: 'ctr', label: 'Click Rate', icon: Play },
    { value: 'follows', label: 'Followers', icon: Sparkles },
  ]

  const canGenerate = user && (
    user.freeCredits > user.usedCredits || 
    user.subscriptionStatus === 'active' || 
    user.subscriptionStatus === 'trialing'
  )

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">
            Generate Viral Hooks
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Create platform-optimized hooks that drive engagement
          </p>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Platform Selection */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <label className="text-sm font-medium text-gray-700 tracking-wide uppercase letter-spacing-wide">
              Platform
            </label>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map((platform, index) => (
                <motion.button
                  key={platform.value}
                  type="button"
                  onClick={() => setFormData((prev: any) => ({ ...prev, platform: platform.value as Platform }))}
                  className={`relative group px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 ${
                    formData.platform === platform.value
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-xl">{platform.icon}</span>
                    <span>{platform.label}</span>
                  </div>
                  {formData.platform === platform.value && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20"
                      style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.2 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Objective Selection */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label className="text-sm font-medium text-gray-700 tracking-wide uppercase letter-spacing-wide">
              Objective
            </label>
            <div className="relative">
              <select
                value={formData.objective}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, objective: e.target.value as Objective }))}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent hover:bg-gray-100 appearance-none cursor-pointer"
              >
                {objectives.map((objective) => (
                  <option key={objective.value} value={objective.value}>
                    {objective.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Topic Input */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <label className="text-sm font-medium text-gray-700 tracking-wide uppercase letter-spacing-wide">
              Video Topic
            </label>
            <div className="relative">
              <textarea
                value={formData.topic}
                onChange={handleTopicChange}
                placeholder="Describe your video concept in detail... e.g., 'I tried eating only white foods for 30 days and the results shocked me'"
                rows={5}
                className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl text-gray-900 leading-relaxed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white resize-none placeholder:text-gray-400 ${
                  errors.topic ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:bg-gray-100 focus:hover:bg-white'
                }`}
                style={{ minHeight: '120px' }}
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <span className={`text-xs font-medium ${
                  charCount < 10 ? 'text-red-500' : 
                  charCount > 800 ? 'text-amber-500' : 
                  'text-gray-400'
                }`}>
                  {charCount}/1000
                </span>
              </div>
            </div>
            {errors.topic && (
              <motion.p 
                className="text-sm text-red-600 font-medium"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {errors.topic}
              </motion.p>
            )}
            <p className="text-sm text-gray-500">
              Be specific and descriptive for best results
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.div 
            className="pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <motion.button
              type="submit"
              disabled={isLoading || !canGenerate}
              className={`relative w-full py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 transform ${
                canGenerate 
                  ? 'bg-gray-900 text-white hover:bg-black hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg hover:shadow-xl' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
              whileHover={canGenerate ? { scale: 1.02, y: -2 } : {}}
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
                className="text-sm text-gray-500 text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                No credits remaining.{' '}
                <a href="/pricing" className="text-gray-900 font-medium hover:underline transition-colors duration-200">
                  Upgrade your plan
                </a>{' '}
                to continue.
              </motion.p>
            )}
          </motion.div>
        </form>
      </div>
    </motion.div>
  )
}

// ==================== SWISS-INSPIRED HOOK RESULTS ====================

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
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Swiss-minimal header */}
      <motion.div 
        className="text-center space-y-3 pb-8 border-b border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 tracking-tight">
          Your Viral Hooks
        </h2>
        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">{generation.hooks.length}</span> hooks generated for{' '}
          <span className="font-medium text-gray-900 capitalize">{generation.platform}</span>
        </p>
      </motion.div>

      {/* Premium hook grid */}
      <motion.div 
        className="grid gap-6 lg:gap-8"
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-blue-50/10">
      <AppHeader />
      
      {/* Premium Swiss-inspired single column layout */}
      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        <AnimatePresence mode="wait">
          {/* Swiss-minimal centered layout */}
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] space-y-12">
            
            {/* Generation Form - Always visible */}
            <div className="w-full">
              <HookGenerationForm
                onGenerate={handleGenerate}
                isLoading={generateHooksMutation.isPending}
              />
            </div>

            {/* Loading State */}
            {generateHooksMutation.isPending && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl"
              >
                <HookGenerationLoading />
              </motion.div>
            )}

            {/* Results */}
            {currentGeneration && !generateHooksMutation.isPending && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl"
              >
                <HookResults
                  generation={currentGeneration}
                  onFavorite={handleFavorite}
                  onCopy={handleCopy}
                  favoriteHooks={favoriteHooks}
                />
              </motion.div>
            )}

            {/* Empty State - Swiss minimal design */}
            {!currentGeneration && !generateHooksMutation.isPending && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl"
              >
                <EmptyState 
                  onGenerateSample={handleGenerateSample}
                  onWatchTutorial={handleWatchTutorial}
                />
              </motion.div>
            )}
            
          </div>
        </AnimatePresence>
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