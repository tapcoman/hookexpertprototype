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
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
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
    setFormData(prev => ({ ...prev, topic: value }))
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
            {/* Platform Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Choose Platform</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <motion.button
                    key={platform.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, platform: platform.value as Platform }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                      formData.platform === platform.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="font-medium">{platform.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Objective Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Optimization Goal</h3>
              <Select
                value={formData.objective}
                onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value as Objective }))}
              >
                <SelectTrigger className="w-full">
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
            </div>

            {/* Topic Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="topic" className="text-sm font-medium">
                  Video Topic
                </label>
                <Textarea
                  id="topic"
                  value={formData.topic}
                  onChange={handleTopicChange}
                  placeholder="Describe your video concept in detail... e.g., 'I tried eating only white foods for 30 days and the results shocked me'"
                  className={`min-h-[120px] resize-none ${errors.topic ? 'border-destructive' : ''}`}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Be specific and descriptive for best results
                  </p>
                  <span className={`text-sm ${
                    charCount < 10 ? 'text-destructive' : 
                    charCount > 800 ? 'text-yellow-600' : 
                    'text-muted-foreground'
                  }`}>
                    {charCount}/1000
                  </span>
                </div>
                {errors.topic && (
                  <motion.p 
                    className="text-sm text-destructive"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {errors.topic}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !canGenerate}
              className="w-full h-12"
              size="lg"
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
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 10 Hooks</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {!canGenerate && (
              <motion.p 
                className="text-center text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                No credits remaining.{' '}
                <a 
                  href="/pricing" 
                  className="font-medium text-primary hover:underline"
                >
                  Upgrade your plan
                </a>{' '}
                to continue.
              </motion.p>
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