'use client'

import * as React from 'react'
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
    topic: params.idea,
    modelType: 'gpt-4o-mini'
  }
  
  const response = await api.hooks.generateHooks(request)
  
  // Transform backend response to v0 format
  const transformedHooks: Omit<HookItem, 'score' | 'reasons' | 'breakdown'>[] = response.data!.hooks.map((hook, i) => ({
    id: hook.id || `hook-${i}`,
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
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  
  // Onboarding state
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [brandVoice, setBrandVoice] = useState(localStorage.getItem('brandVoice') || '')
  const [audience, setAudience] = useState(localStorage.getItem('audience') || '')
  const [bannedTerms, setBannedTerms] = useState<string[]>(
    JSON.parse(localStorage.getItem('bannedTerms') || '[]')
  )
  const [tones, setTones] = useState<Tone[]>(
    JSON.parse(localStorage.getItem('tones') || '[]')
  )

  const handleGenerate = useCallback(async () => {
    if (!idea.trim()) return
    
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
  }, [idea, platform, outcome, count, brandVoice, audience, bannedTerms, tones])

  const handlePreview = useCallback(() => {
    console.log('Preview not implemented')
  }, [])

  const handleProjectChange = useCallback((project: Project | null) => {
    setCurrentProject(project)
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
    
    localStorage.setItem('brandVoice', data.brandVoice)
    localStorage.setItem('audience', data.audience)
    localStorage.setItem('bannedTerms', JSON.stringify(data.bannedTerms))
    localStorage.setItem('tones', JSON.stringify(data.tones))
    
    setOnboardingOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-background">
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
            />
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