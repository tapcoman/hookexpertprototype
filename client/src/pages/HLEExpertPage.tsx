import React, { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { useAnalytics } from '@/lib/analytics'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { api } from '@/lib/api'
import { postProcessAndRank } from '@/lib/scoring'
import { AppSidebar } from '@/components/hle/app-sidebar'
import { ResultsList } from '@/components/hle/results-list'
import { OnboardingDialog } from '@/components/hle/onboarding-dialog'
import { SidebarProvider } from '@/components/ui/sidebar'

// Import the HLE types and our existing types
import type { 
  Platform as HLEPlatform, 
  Outcome as HLEOutcome,
  HookItem as HLEHookItem,
  GenerateRequestBody 
} from '@/components/hle/types'
import type { 
  GenerateHooksRequest, 
  GenerateHooksResponse,
  Platform as ExistingPlatform,
  Objective as ExistingObjective 
} from '@/types/shared'
import type { Project } from '@/components/hle/project-types'

// Type mapping utilities
const mapPlatform = (hlePlatform: HLEPlatform): ExistingPlatform => {
  switch (hlePlatform) {
    case 'tiktok': return 'tiktok'
    case 'reels': return 'instagram' 
    case 'shorts': return 'youtube'
    default: return 'tiktok'
  }
}

const mapOutcome = (hleOutcome: HLEOutcome): ExistingObjective => {
  switch (hleOutcome) {
    case 'watch-time': return 'watch_time'
    case 'shares': return 'shares'
    case 'saves': return 'saves'
    case 'ctr': return 'ctr'
    default: return 'watch_time'
  }
}

const mapToHLEHooks = (response: GenerateHooksResponse, platform: HLEPlatform): HLEHookItem[] => {
  if (!response?.hooks) return []
  
  return response.hooks.map((hook, index) => ({
    id: `hook-${index}`,
    spokenHook: hook.verbalHook || '',
    visualCue: hook.visualHook || `Show yourself speaking this hook`,
    overlayText: hook.textualHook || hook.verbalHook || '',
    framework: hook.framework || 'Custom',
    platformNotes: {
      idealWordCount: platform === 'tiktok' ? 9 : platform === 'reels' ? 8 : 8,
      proofCue: hook.platformSpecific?.youtubeProofCue || 'Show evidence or results here'
    },
    score: hook.score || 3.5,
    reasons: [hook.rationale || `Uses ${hook.framework || 'proven'} framework`, 'Optimized for engagement'],
    breakdown: {
      curiosity: hook.score ? hook.score * 0.4 : 1.4,
      brevity: 0.8,
      platformFit: 0.9,
      framework: 0.8
    },
    isTop: index === 0,
    favorite: false
  }))
}

const HLEExpertPageContent: React.FC = () => {
  const { user } = useAuth()
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  const { track } = useAnalytics(user?.id)
  
  // Form state
  const [idea, setIdea] = useState('')
  const [platform, setPlatform] = useState<HLEPlatform>('tiktok')
  const [outcome, setOutcome] = useState<HLEOutcome>('watch-time')
  const [count, setCount] = useState(10)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  
  // Results state
  const [hooks, setHooks] = useState<HLEHookItem[]>([])
  const [favoriteHooks, setFavoriteHooks] = useState<Set<string>>(new Set())
  
  // UI state
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [streaming, setStreaming] = useState(false)
  
  // Brand settings state
  const [brandVoice, setBrandVoice] = useState('')
  const [audience, setAudience] = useState('')
  const [bannedTerms, setBannedTerms] = useState<string[]>([])
  const [tones, setTones] = useState<any[]>([])
  
  // Refs for scroll management
  const resultsRef = useRef<HTMLDivElement>(null)

  // Hook generation mutation
  const generateHooksMutation = useMutation({
    mutationFn: async (requestData: GenerateRequestBody) => {
      const mappedRequest: GenerateHooksRequest = {
        platform: mapPlatform(requestData.platform),
        objective: mapOutcome(requestData.outcome),
        topic: requestData.idea,
        modelType: 'gpt-4o-mini'
      }
      
      const response = await api.hooks.generateHooks(mappedRequest)
      return response.data!
    },
    onSuccess: (data: GenerateHooksResponse) => {
      // Transform the response to HLE format and apply scoring
      const transformedHooks = mapToHLEHooks(data, platform)
      const scoredAndRanked = postProcessAndRank(transformedHooks, platform)
      
      setHooks(scoredAndRanked)
      setStreaming(false)
      
      showSuccessNotification(
        'Hooks Generated!', 
        `Created ${scoredAndRanked.length} professional hooks for ${platform}.`
      )
      
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      
      track('hle_hook_generation_completed', {
        hooksGenerated: scoredAndRanked.length,
        platform,
        outcome,
        ideaLength: idea.length,
        projectId: currentProject?.id
      })
    },
    onError: (error: any) => {
      setStreaming(false)
      showErrorNotification('Generation Failed', error.message || 'Failed to generate hooks')
      
      track('hle_hook_generation_failed', {
        error: error.message,
        platform,
        outcome,
        ideaLength: idea.length
      })
    },
  })

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (hookId: string) => {
      const hook = hooks.find(h => h.id === hookId)
      if (!hook) throw new Error('Hook not found')
      
      await api.hooks.addToFavorites({
        hookData: hook,
        framework: hook.framework,
        platformNotes: `Generated for ${platform} - HLE Expert Interface`,
        topic: idea,
        platform: mapPlatform(platform)
      })
      
      return hookId
    },
    onSuccess: (hookId) => {
      setFavoriteHooks(prev => new Set([...prev, hookId]))
      
      // Update hook state
      setHooks(prev => prev.map(hook => 
        hook.id === hookId ? { ...hook, favorite: true } : hook
      ))
      
      showSuccessNotification('Saved!', 'Hook added to your favorites.')
      
      track('hle_hook_favorited', {
        hookId,
        platform,
        outcome
      })
    },
    onError: (error: any) => {
      showErrorNotification('Save Failed', error.message)
    },
  })

  // Handlers
  const handleGenerate = useCallback(() => {
    if (!idea.trim()) {
      showErrorNotification('Missing Content', 'Please describe your content idea first.')
      return
    }

    if (!user) {
      showErrorNotification('Authentication Required', 'Please sign in to generate hooks.')
      return
    }

    // Check credits
    const canGenerate = user && (
      user.freeCredits > user.usedCredits || 
      user.subscriptionStatus === 'active' || 
      user.subscriptionStatus === 'trialing'
    )

    if (!canGenerate) {
      showErrorNotification('No Credits', 'You need more credits to generate hooks.')
      return
    }

    setStreaming(true)
    setHooks([]) // Clear previous results
    
    const requestData: GenerateRequestBody = {
      idea: idea.trim(),
      platform,
      outcome,
      count,
      brandVoice: currentProject?.brandVoice,
      audience: currentProject?.audience
    }
    
    track('hle_hook_generation_started', {
      platform,
      outcome,
      ideaLength: idea.length,
      count,
      projectId: currentProject?.id
    })
    
    generateHooksMutation.mutate(requestData)
  }, [idea, platform, outcome, count, currentProject, user, generateHooksMutation, track, showErrorNotification])

  const handlePreview = useCallback(() => {
    // Set sample data for preview
    const sampleHooks: HLEHookItem[] = [
      {
        id: 'sample-1',
        spokenHook: 'I tried eating only white foods for 30 days and the results shocked my doctor',
        visualCue: 'Show before/after photos of yourself, then cut to doctor reaction',
        overlayText: '30-Day White Food Challenge Results',
        framework: 'Open Loop',
        platformNotes: {
          idealWordCount: 12,
          proofCue: 'Medical report or blood test results'
        },
        score: 4.2,
        reasons: ['Creates immediate curiosity', 'Medical authority adds credibility', 'Specific timeframe builds trust'],
        breakdown: {
          curiosity: 1.8,
          brevity: 0.9,
          platformFit: 0.7,
          framework: 0.8
        },
        isTop: true,
        favorite: false
      },
      {
        id: 'sample-2', 
        spokenHook: 'The white food diet mistake that almost landed me in the hospital',
        visualCue: 'Quick montage of white foods, then serious face talking to camera',
        overlayText: 'White Food Diet Gone Wrong',
        framework: 'Problem-Agitate-Solve',
        score: 3.9,
        reasons: ['Fear-based hook captures attention', 'Personal stakes make it relatable', 'Problem setup works well'],
        breakdown: {
          curiosity: 1.6,
          brevity: 0.8,
          platformFit: 0.8,
          framework: 0.7
        },
        isTop: false,
        favorite: false
      }
    ]
    
    setHooks(sampleHooks)
    setStreaming(false)
    
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    track('hle_preview_sample', { platform, outcome })
  }, [platform, outcome, track])

  const handleToggleFavorite = useCallback((hookId?: string) => {
    if (!hookId) return
    
    const hook = hooks.find(h => h.id === hookId)
    if (!hook) return

    if (hook.favorite) {
      // Remove from favorites (you'd need to implement this API call)
      setFavoriteHooks(prev => {
        const newSet = new Set(prev)
        newSet.delete(hookId)
        return newSet
      })
      
      setHooks(prev => prev.map(h => 
        h.id === hookId ? { ...h, favorite: false } : h
      ))
    } else {
      // Add to favorites
      addToFavoritesMutation.mutate(hookId)
    }
  }, [hooks, addToFavoritesMutation])

  const handleCopy = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccessNotification('Copied!', `${type} copied to clipboard.`)
      track('hle_hook_copied', { type, textLength: text.length })
    }).catch(() => {
      showErrorNotification('Copy Failed', 'Unable to copy to clipboard.')
    })
  }, [showSuccessNotification, showErrorNotification, track])

  const handleCopySpoken = useCallback((hookId?: string) => {
    const hook = hooks.find(h => h.id === hookId)
    if (hook) {
      handleCopy(hook.spokenHook, 'Spoken hook')
    }
  }, [hooks, handleCopy])

  const handleCopyOverlay = useCallback((hookId?: string) => {
    const hook = hooks.find(h => h.id === hookId)
    if (hook) {
      handleCopy(hook.overlayText, 'Overlay text')
    }
  }, [hooks, handleCopy])

  const handleCopyAll = useCallback((hookId?: string) => {
    const hook = hooks.find(h => h.id === hookId)
    if (hook) {
      const allText = `Spoken Hook: ${hook.spokenHook}\n\nVisual Cue: ${hook.visualCue}\n\nOverlay Text: ${hook.overlayText}\n\nFramework: ${hook.framework}`
      handleCopy(allText, 'Complete hook')
    }
  }, [hooks, handleCopy])

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-accent-electric/5 via-transparent to-success-green/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent-electric-rgb)_0%,_transparent_45%)] opacity-10 pointer-events-none" />
      
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <AppSidebar
            idea={idea}
            onIdeaChange={setIdea}
            platform={platform}
            onPlatformChange={setPlatform}
            outcome={outcome}
            onOutcomeChange={setOutcome}
            count={count}
            onCountChange={setCount}
            onGenerate={handleGenerate}
            onPreview={handlePreview}
            onOpenOnboarding={() => setOnboardingOpen(true)}
            onProjectChange={setCurrentProject}
          />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto relative">
            <div className="container mx-auto p-6 max-w-6xl">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-electric to-success-green bg-clip-text text-transparent">
                      Hook Line Studio Expert
                    </h1>
                    <p className="text-text-secondary mt-1">
                      Professional hook generation with transparent scoring and tri-modal output
                    </p>
                  </div>
                  
                  {user && (
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">Credits Remaining</p>
                      <p className="text-lg font-bold text-accent-electric">
                        {Math.max(0, user.freeCredits - user.usedCredits)}
                      </p>
                    </div>
                  )}
                </div>
                
                {currentProject && (
                  <div className="bg-surface-secondary/50 rounded-lg p-3 border border-border-subtle">
                    <p className="text-sm text-text-secondary">
                      Active Project: <span className="font-semibold text-text-primary">{currentProject.name}</span>
                    </p>
                  </div>
                )}
              </motion.div>
              
              {/* Results Section */}
              <motion.div
                ref={resultsRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Loading State */}
                {streaming && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-surface-secondary/80 border border-border-subtle">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-accent-electric rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-accent-electric rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-accent-electric rounded-full"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-text-primary font-medium">Generating professional hooks...</span>
                    </div>
                  </div>
                )}
                
                {/* Results List */}
                <ResultsList
                  hooks={hooks}
                  platform={platform}
                  streaming={streaming}
                  onToggleFavorite={handleToggleFavorite}
                  onCopySpoken={handleCopySpoken}
                  onCopyOverlay={handleCopyOverlay}
                  onCopyAll={handleCopyAll}
                  onShowSample={handlePreview}
                />
                
                {/* Empty State with Better Design */}
                {!hooks.length && !streaming && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16"
                  >
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent-electric/20 to-success-green/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary">Ready to Create Viral Hooks</h3>
                      <p className="text-text-secondary leading-relaxed">
                        Describe your content idea in the sidebar and click Generate to create professional hooks with transparent scoring and tri-modal output.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </main>
        </div>
      </SidebarProvider>
      
      {/* Onboarding Dialog */}
      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        brandVoice={brandVoice}
        audience={audience}
        bannedTerms={bannedTerms}
        tones={tones}
        onSave={(settings) => {
          setBrandVoice(settings.brandVoice)
          setAudience(settings.audience)
          setBannedTerms(settings.bannedTerms)
          setTones(settings.tones)
          setOnboardingOpen(false)
        }}
      />
    </div>
  )
}

const HLEExpertPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="HLE Expert">
      <ProtectedRoute requireAuth requireOnboarding>
        <HLEExpertPageContent />
      </ProtectedRoute>
    </PageErrorBoundary>
  )
}

export default HLEExpertPage