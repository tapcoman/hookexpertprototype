'use client'

import { useState, useCallback } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { ResultsList } from './results-list'
import { OnboardingDialog } from './onboarding-dialog'
import type { Platform, Outcome, HookItem, Tone } from './types'
import type { Project } from './project-types'
import { postProcessAndRank } from '@/lib/scoring'

// Real API integration
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/SimpleAuthContext'
import type { GenerateHooksRequest } from '@/types/shared'

async function generateHooks(params: {
  idea: string
  platform: Platform
  outcome: Outcome
  count: number
  brandVoice?: string
  audience?: string
  bannedTerms?: string[]
  tones?: Tone[]
}): Promise<HookItem[]> {
  // Map v0 types to your backend types
  const platformMap = { tiktok: 'tiktok', reels: 'instagram', shorts: 'youtube' } as const
  const outcomeMap = { 'watch-time': 'watch_time', shares: 'shares', saves: 'saves', ctr: 'ctr' } as const
  
  const request: GenerateHooksRequest = {
    platform: platformMap[params.platform],
    objective: outcomeMap[params.outcome],
    topic: params.idea
  }
  
  const response = await api.hooks.generateHooks(request)
  
  // Transform backend response to v0 format
  const transformedHooks: Omit<HookItem, 'score' | 'reasons' | 'breakdown'>[] = response.data!.hooks.map((hook, i) => ({
    id: `hook-${i}`,
    spokenHook: hook.verbalHook || '',
    visualCue: hook.visualHook || 'Show yourself speaking this hook',
    overlayText: hook.textualHook || hook.verbalHook || '',
    framework: hook.framework || 'Open Loop'
  }))
  
  return postProcessAndRank(transformedHooks as HookItem[], params.platform)
}

export default function App() {
  const [idea, setIdea] = useState('')
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [outcome, setOutcome] = useState<Outcome>('watch-time')
  const [count, setCount] = useState(10)
  const [hooks, setHooks] = useState<HookItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Auth integration
  const { user, canGenerateHooks } = useAuth()
  
  // Onboarding state
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [brandVoice, setBrandVoice] = useState(localStorage.getItem('hle:brandVoice') || '')
  const [audience, setAudience] = useState(localStorage.getItem('hle:audience') || '')
  const [bannedTerms, setBannedTerms] = useState<string[]>(
    JSON.parse(localStorage.getItem('hle:bannedTerms') || '[]')
  )
  const [tones, setTones] = useState<Tone[]>(
    JSON.parse(localStorage.getItem('hle:tones') || '[]')
  )

  const handleGenerate = useCallback(async () => {
    if (!idea.trim()) return
    
    // Check generation limits
    if (!canGenerateHooks()) {
      alert('You have reached your generation limit. Please upgrade your plan or wait for your limits to reset.')
      return
    }
    
    setIsGenerating(true)
    try {
      const generatedHooks = await generateHooks({
        idea,
        platform,
        outcome,
        count,
        brandVoice,
        audience,
        bannedTerms,
        tones
      })
      setHooks(generatedHooks)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [idea, platform, outcome, count, brandVoice, audience, bannedTerms, tones, canGenerateHooks])

  const handlePreview = useCallback(() => {
    console.log('Preview not implemented')
  }, [])

  const handleProjectChange = useCallback((project: Project | null) => {
    // Project handling logic can be added here if needed
  }, [])

  const handleOnboardingSave = useCallback((data: {
    brandVoice: string
    audience: string
    bannedTerms: string[]
    tones: Tone[]
  }) => {
    setBrandVoice(data.brandVoice)
    setAudience(data.audience)
    setBannedTerms(data.bannedTerms)
    setTones(data.tones)
    
    localStorage.setItem('hle:brandVoice', data.brandVoice)
    localStorage.setItem('hle:audience', data.audience)
    localStorage.setItem('hle:bannedTerms', JSON.stringify(data.bannedTerms))
    localStorage.setItem('hle:tones', JSON.stringify(data.tones))
    
    setOnboardingOpen(false)
  }, [])

  return (
    <div className="light min-h-screen bg-white font-sans">
      <SidebarProvider>
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
          onProjectChange={handleProjectChange}
        />
        <SidebarInset className="flex-1">
          <main className="flex-1 overflow-hidden">
            <ResultsList 
              hooks={hooks} 
              platform={platform}
              isGenerating={isGenerating}
              onToggleFavorite={() => {}}
              onCopySpoken={() => {}}
              onCopyOverlay={() => {}}
              onCopyAll={() => {}}
            />
            
            {/* Show upgrade message if user cannot generate */}
            {user && !canGenerateHooks() && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800">Generation Limit Reached</h3>
                <p className="text-yellow-600">
                  You've reached your generation limit. 
                  <a href="/billing" className="ml-1 text-yellow-800 underline">
                    Upgrade your plan
                  </a> or wait for your limits to reset.
                </p>
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      
      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        brandVoice={brandVoice}
        audience={audience}
        bannedTerms={bannedTerms}
        tones={tones}
        onSave={handleOnboardingSave}
      />
    </div>
  )
}