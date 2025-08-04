import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useGenerationState, useNotifications } from '@/contexts/AppContext'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { 
  MobileHookGenerationForm, 
  MobileHookViewer, 
  MobileLoading,
  MobileLayout
} from '@/components/mobile'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import type { GenerateHooksRequest } from '@/types/shared'

type ViewState = 'form' | 'loading' | 'results'

const MobileMainAppPageContent: React.FC = () => {
  const { } = useAuth()
  const { currentGeneration, setCurrentGeneration, addRecentGeneration } = useGenerationState()
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  const { toast } = useToast()
  
  const [viewState, setViewState] = useState<ViewState>('form')
  const [favoriteStates, setFavoriteStates] = useState<boolean[]>([])
  const [generationRequest, setGenerationRequest] = useState<GenerateHooksRequest | null>(null)

  // Hook generation mutation
  const generateHooksMutation = useMutation({
    mutationFn: async (data: GenerateHooksRequest) => {
      const response = await api.hooks.generateHooks(data)
      return response.data
    },
    onSuccess: (data) => {
      setCurrentGeneration(data)
      addRecentGeneration(data)
      setFavoriteStates(new Array(data.hooks.length).fill(false))
      setViewState('results')
      showSuccessNotification('Hooks Generated!', `Created ${data.hooks.length} viral hooks for you.`)
    },
    onError: (error: any) => {
      setViewState('form')
      showErrorNotification('Generation Failed', error.message)
    },
  })

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async ({ generationId, hookIndex }: { generationId: string, hookIndex: number }) => {
      await api.hooks.addToFavorites(generationId, hookIndex)
    },
    onSuccess: (_, { hookIndex }) => {
      setFavoriteStates(prev => {
        const newStates = [...prev]
        newStates[hookIndex] = !newStates[hookIndex]
        return newStates
      })
      toast({
        title: "Updated!",
        description: favoriteStates[hookIndex] ? "Removed from favorites" : "Added to favorites",
        variant: "default"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      })
    },
  })

  const handleGenerate = (data: GenerateHooksRequest) => {
    setGenerationRequest(data)
    setViewState('loading')
    generateHooksMutation.mutate(data)
  }

  const handleFavoriteToggle = (hookIndex: number) => {
    if (currentGeneration) {
      addToFavoritesMutation.mutate({
        generationId: currentGeneration.id,
        hookIndex,
      })
    }
  }

  const handleCopy = (_hook: string, _index: number) => {
    toast({
      title: "Copied!",
      description: "Hook copied to clipboard",
      variant: "default"
    })
  }

  const handleShare = async (hook: any, _index: number) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this viral hook!',
          text: hook.verbalHook,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(hook.verbalHook)
        toast({
          title: "Copied!",
          description: "Hook copied to clipboard for sharing",
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleRegenerate = () => {
    if (generationRequest) {
      setViewState('loading')
      generateHooksMutation.mutate(generationRequest)
    }
  }

  const handleBackToForm = () => {
    setViewState('form')
    setCurrentGeneration(null)
  }

  // Auto-show results if we have a current generation
  useEffect(() => {
    if (currentGeneration && viewState === 'form') {
      setViewState('results')
      setFavoriteStates(new Array(currentGeneration.hooks.length).fill(false))
    }
  }, [currentGeneration, viewState])

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {viewState === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full"
          >
            <MobileLayout
              headerTitle="Generate Hooks"
              showBackButton={false}
              showBottomNav={true}
            >
              <div className="max-w-lg mx-auto">
                {/* Welcome Header */}
                <div className="text-center px-4 py-6">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-foreground mb-2"
                  >
                    Create Viral Hooks
                  </motion.h1>
                  <p className="text-muted-foreground">
                    AI-powered hooks that stop the scroll
                  </p>
                </div>

                {/* Generation Form */}
                <MobileHookGenerationForm
                  onGenerate={handleGenerate}
                  isLoading={generateHooksMutation.isPending}
                />

                {/* Tips Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mx-4 mt-6 p-4 bg-muted/50 rounded-lg"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    💡 Tips for Better Hooks
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Be specific: "5 AI tools" &gt; "AI tools"</p>
                    <p>• Use numbers and timeframes</p>
                    <p>• Focus on benefits and outcomes</p>
                    <p>• Create curiosity and urgency</p>
                  </div>
                </motion.div>
              </div>
            </MobileLayout>
          </motion.div>
        )}

        {viewState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <MobileLoading
              message="Generating viral hooks..."
              submessage="Using AI to craft engaging content"
              showSteps={true}
              estimatedTime={15}
            />
          </motion.div>
        )}

        {viewState === 'results' && currentGeneration && (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            <MobileLayout
              headerTitle="Your Hooks"
              showBackButton={true}
              onBackClick={handleBackToForm}
              showBottomNav={true}
            >
              <div className="h-full">
                <MobileHookViewer
                  hooks={currentGeneration.hooks}
                  platform={generationRequest?.platform}
                  objective={generationRequest?.objective}
                  onFavoriteToggle={handleFavoriteToggle}
                  onCopy={handleCopy}
                  onShare={handleShare}
                  onRegenerate={handleRegenerate}
                  isRegenerating={generateHooksMutation.isPending}
                  favoriteStates={favoriteStates}
                />
              </div>
            </MobileLayout>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MobileMainAppPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Mobile Main App">
      <ProtectedRoute requireAuth requireOnboarding>
        <MobileMainAppPageContent />
      </ProtectedRoute>
    </PageErrorBoundary>
  )
}

export default MobileMainAppPage