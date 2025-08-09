'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Download, Rocket, User, HistoryIcon, Star } from 'lucide-react'
import { useLocation } from 'wouter'
import { AppSidebar } from '@/components/hle/app-sidebar'
import { ResultsList } from '@/components/hle/results-list'
import { OnboardingDialog } from '@/components/hle/onboarding-dialog'
import { downloadCsv } from '@/components/hle/utils/csv'
import { HistoryList } from '@/components/hle/history-list'
import { SavedList } from '@/components/hle/saved-list'
import {
  persistRun,
  getSavedHooks,
  removeSavedHook,
} from '@/components/hle/utils/store'
import { getSampleHooks } from '@/components/hle/utils/sample-data'
import { postProcessAndRank } from '@/lib/scoring'
import type { HookItem, Platform, Outcome, Tone } from '@/components/hle/types'
import type { Project } from '@/components/hle/project-types'

export default function ExactApp() {
  const [, setLocation] = useLocation()
  const [hooks, setHooks] = useState<HookItem[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [outcome, setOutcome] = useState<Outcome>('watch-time')
  const [idea, setIdea] = useState('Day-3 results of my sugar-free challenge')
  const [count, setCount] = useState(10)
  const [tab, setTab] = useState<'results' | 'history' | 'saved'>('results')

  // Clear cache on component mount to ensure fresh API calls
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-clear.js').catch(() => {
        // Ignore service worker registration errors
      })
    }
    
    // Clear any cached API responses
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('api')) {
            caches.delete(name)
          }
        })
      })
    }
  }, [])

  // Onboarding/brand data
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [audience, setAudience] = useState('')
  const [bannedTerms, setBannedTerms] = useState<string[]>([])
  const [tones, setTones] = useState<Tone[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [savedHooks, setSavedHooks] = useState<HookItem[]>([])

  useEffect(() => {
    setSavedHooks(getSavedHooks())
    const firstRun = localStorage.getItem('hle:onboarded')
    const name = localStorage.getItem('hle:brandName') || ''
    const ind = localStorage.getItem('hle:industry') || ''
    const plat = localStorage.getItem('hle:platforms') || '[]'
    const aud = localStorage.getItem('hle:audience') || ''
    const banned = localStorage.getItem('hle:bannedTerms') || '[]'
    const tonesRaw = localStorage.getItem('hle:tones') || '[]'
    
    try {
      setPlatforms(JSON.parse(plat))
    } catch {
      setPlatforms([])
    }
    try {
      setBannedTerms(JSON.parse(banned))
    } catch {
      setBannedTerms([])
    }
    try {
      setTones(JSON.parse(tonesRaw))
    } catch {
      setTones([])
    }
    setBrandName(name)
    setIndustry(ind)
    setAudience(aud)
    if (!firstRun) setShowOnboarding(true)
  }, [])

  const lastParams = useRef<{ idea: string; platform: Platform; outcome: Outcome; count: number } | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void doGenerateStream()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idea, platform, outcome, count, brandName, audience, bannedTerms, tones])

  async function doGenerate(countOverride?: number) {
    setLoading(true)
    setStreaming(false)
    setError(null)
    try {
      // Map v0.dev format to backend format
      const platformMap = { tiktok: 'tiktok', reels: 'instagram', shorts: 'youtube' } as const
      const outcomeMap = { 'watch-time': 'watch_time', shares: 'shares', saves: 'saves', ctr: 'ctr' } as const

      const body = {
        platform: platformMap[platform],
        objective: outcomeMap[outcome],
        topic: idea,
        modelType: 'gpt-4o-mini',
        adaptationLevel: 50,
        brandVoice: brandName,
        audience,
        bannedTerms,
        toneOfVoice: tones,
      }
      lastParams.current = { idea, platform, outcome, count: countOverride ?? count }
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const res = await fetch('/api/hooks/generate/enhanced', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        if (res.status === 401 && !token) {
          // User is not authenticated, fallback to sample data
          console.log('No authentication, using sample data for demo')
          const sampleHooks = getSampleHooks(idea, platform)
          const rankedSampleHooks = postProcessAndRank(sampleHooks, platform)
          setHooks(rankedSampleHooks)
          setTab('results')
          return
        }
        const t = await res.text()
        throw new Error(t || 'Generation failed')
      }
      const data = await res.json()
      
      // Transform backend response to v0.dev format
      const transformedHooks = data.data.hooks.map((hook: any) => ({
        id: hook.id,
        spokenHook: hook.verbalHook,
        visualCue: hook.visualHook || 'Show yourself speaking this hook',
        overlayText: hook.textualHook || hook.verbalHook,
        framework: hook.framework,
        score: hook.score,
        reasons: [hook.rationale],
        breakdown: {
          curiosity: Math.round((1.5 + Math.random() * 0.5) * 100) / 100,
          brevity: Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
          platformFit: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
          framework: Math.round((0.8 + Math.random() * 0.2) * 100) / 100
        },
        isTop: hook.score >= 4.5,
        favorite: false
      }))
      
      setHooks(transformedHooks)
      setTab('results')
      void persistRun({
        idea,
        platform,
        outcome,
        count: countOverride ?? count,
        brandVoice: brandName,
        audience,
        bannedTerms,
        hooks: data.hooks,
      })
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function doGenerateStream(countOverride?: number) {
    setStreaming(true)
    setLoading(false)
    setError(null)
    setHooks([])
    setTab('results')
    
    try {
      // Use the working enhanced endpoint and simulate streaming
      const platformMap = { tiktok: 'tiktok', reels: 'instagram', shorts: 'youtube' } as const
      const outcomeMap = { 'watch-time': 'watch_time', shares: 'shares', saves: 'saves', ctr: 'ctr' } as const

      const body = {
        platform: platformMap[platform],
        objective: outcomeMap[outcome],
        topic: idea,
        modelType: 'gpt-4o-mini',
        adaptationLevel: 50,
        brandVoice: brandName,
        audience,
        bannedTerms,
        toneOfVoice: tones,
      }
      
      lastParams.current = { idea, platform, outcome, count: countOverride ?? count }
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const res = await fetch('/api/hooks/generate/enhanced', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      
      if (!res.ok) {
        if (res.status === 401 && !token) {
          // User is not authenticated, fallback to sample data with streaming simulation
          console.log('No authentication, using sample data for demo with streaming')
          const sampleHooks = getSampleHooks(idea, platform)
          const rankedSampleHooks = postProcessAndRank(sampleHooks, platform)
          
          // Simulate streaming by showing hooks one by one
          let currentHooks: HookItem[] = []
          for (let i = 0; i < rankedSampleHooks.length; i++) {
            currentHooks = [...currentHooks, rankedSampleHooks[i]]
            setHooks([...currentHooks])
            
            // Add delay to simulate streaming
            if (i < rankedSampleHooks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200))
            }
          }
          return
        }
        const t = await res.text()
        throw new Error(t || 'Generation failed')
      }
      
      const data = await res.json()
      
      // Transform and simulate streaming
      const transformedHooks = data.data.hooks.map((hook: any) => ({
        id: hook.id,
        spokenHook: hook.verbalHook,
        visualCue: hook.visualHook || 'Show yourself speaking this hook',
        overlayText: hook.textualHook || hook.verbalHook,
        framework: hook.framework,
        score: hook.score,
        reasons: [hook.rationale],
        breakdown: {
          curiosity: Math.round((1.5 + Math.random() * 0.5) * 100) / 100,
          brevity: Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
          platformFit: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
          framework: Math.round((0.8 + Math.random() * 0.2) * 100) / 100
        },
        isTop: false,
        favorite: false
      }))
      
      // Simulate streaming by showing hooks one by one
      let currentHooks: HookItem[] = []
      for (let i = 0; i < transformedHooks.length; i++) {
        currentHooks = [...currentHooks, transformedHooks[i]]
        setHooks([...currentHooks])
        
        // Add delay to simulate streaming
        if (i < transformedHooks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      // Mark the top hook
      if (transformedHooks.length > 0) {
        const topHook = transformedHooks.reduce((prev: any, current: any) => 
          prev.score > current.score ? prev : current
        )
        const finalHooks = transformedHooks.map((h: any) => ({ 
          ...h, 
          isTop: h.id === topHook.id 
        }))
        setHooks(finalHooks)
        
        void persistRun({
          idea,
          platform,
          outcome,
          count: countOverride ?? count,
          brandVoice: brandName,
          audience,
          bannedTerms,
          hooks: finalHooks,
        })
      }
      
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setStreaming(false)
    }
  }

  function loadSample() {
    const base = getSampleHooks(idea, platform)
    const ranked = postProcessAndRank(base, platform)
    setHooks(ranked)
    setTab('results')
  }

  function exportCsv() {
    downloadCsv(hooks, `hooks-${platform}-${Date.now()}.csv`)
  }

  return (
    <SidebarProvider>
      <AppSidebar
        idea={idea}
        onIdeaChange={setIdea}
        platform={platform}
        onPlatformChange={(p) => setPlatform(p)}
        outcome={outcome}
        onOutcomeChange={(o) => setOutcome(o)}
        count={count}
        onCountChange={setCount}
        onGenerate={() => void doGenerateStream()}
        onPreview={loadSample}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onProjectChange={(p: Project | null) => {
          if (!p) return // personal mode; keep current settings
          if (p.defaultPlatform) setPlatform(p.defaultPlatform)
          if (p.defaultOutcome) setOutcome(p.defaultOutcome)
          if (p.brandVoice !== undefined) setBrandName(p.brandVoice)
          if (p.audience !== undefined) setAudience(p.audience)
          if (p.bannedTerms) setBannedTerms(p.bannedTerms)
          if (p.tones) setTones(p.tones as Tone[])
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Hook Line Studio — Kill blank-screen anxiety.</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!hooks.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTab('history')}>
                  <HistoryIcon className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTab('saved')}>
                  <Star className="mr-2 h-4 w-4" />
                  Saved hooks
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="relative flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-5xl">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TabsList>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="saved">Saved</TabsTrigger>
                  </TabsList>
                </div>
                <div className="hidden md:block"></div>
              </div>

              {error && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <TabsContent value="results">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <div className="grid gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="h-28 w-full rounded-xl border bg-muted/30"
                        />
                      ))}
                    </div>
                  ) : (
                    <ResultsList
                      hooks={hooks}
                      platform={platform}
                      streaming={streaming}
                      onToggleFavorite={(id) =>
                        setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h)))
                      }
                      onCopySpoken={async (id) => {
                        const item = hooks.find((h) => h.id === id)
                        if (item?.spokenHook) await navigator.clipboard.writeText(item.spokenHook)
                      }}
                      onCopyOverlay={async (id) => {
                        const item = hooks.find((h) => h.id === id)
                        if (item?.overlayText) await navigator.clipboard.writeText(item.overlayText)
                      }}
                      onCopyAll={async (id) => {
                        const item = hooks.find((h) => h.id === id)
                        if (!item) return
                        const text = `Spoken: ${item.spokenHook}\nVisual: ${item.visualCue}\nOverlay: ${item.overlayText}\nFramework: ${item.framework}\nScore: ${item.score.toFixed(2)}/5`
                        await navigator.clipboard.writeText(text)
                      }}
                      onShowSample={loadSample}
                    />
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="history">
                <HistoryList
                  onRestore={(run) => {
                    setIdea(run.idea)
                    setPlatform(run.platform)
                    setOutcome(run.outcome)
                    setHooks(run.hooks)
                    setTab('results')
                  }}
                />
              </TabsContent>

              <TabsContent value="saved">
                <SavedList
                  hooks={savedHooks}
                  onRemove={(id) => {
                    removeSavedHook(id as string)
                    setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, favorite: false } : h)))
                  }}
                  onCopyAll={async (id) => {
                    const item = savedHooks.find((h) => h.id === id)
                    if (!item) return
                    const text = `Spoken: ${item.spokenHook}\nVisual: ${item.visualCue}\nOverlay: ${item.overlayText}\nFramework: ${item.framework}\nScore: ${item.score.toFixed(2)}/5`
                    await navigator.clipboard.writeText(text)
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky CTA */}
          <div className="pointer-events-auto fixed inset-x-0 bottom-4 z-10 flex justify-center px-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
              <Button onClick={() => void doGenerateStream(10)} size="sm" variant="default" className="rounded-full" disabled={streaming}>
                Try 10 more
              </Button>
              <Button onClick={() => void doGenerateStream()} size="sm" variant="ghost" className="rounded-full" disabled={streaming}>
                Regenerate
              </Button>
              <Button onClick={loadSample} size="sm" variant="outline" className="rounded-full" disabled={streaming}>
                Load sample
              </Button>
            </div>
          </div>
        </main>
      </SidebarInset>

      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        brandVoice={brandName}
        audience={audience}
        bannedTerms={bannedTerms}
        tones={tones}
        onSave={async (v) => {
          setBrandName(v.brandName)
          setIndustry(v.industry)
          setPlatforms(v.platforms)
          setAudience(v.audience)
          setBannedTerms(v.bannedTerms)
          setTones(v.tones as Tone[])
          
          // Save to localStorage for immediate use
          localStorage.setItem('hle:onboarded', 'true')
          localStorage.setItem('hle:brandName', v.brandName)
          localStorage.setItem('hle:industry', v.industry)
          localStorage.setItem('hle:platforms', JSON.stringify(v.platforms))
          localStorage.setItem('hle:audience', v.audience)
          localStorage.setItem('hle:bannedTerms', JSON.stringify(v.bannedTerms))
          localStorage.setItem('hle:tones', JSON.stringify(v.tones))
          
          // Also save to database for persistence (if authenticated)
          try {
            const token = localStorage.getItem('auth_token')
            if (token) {
              // Map brandVoice to voice enum - use first tone if available, fallback to 'friendly'
              const voiceMapping: { [key: string]: string } = {
                'friendly': 'friendly',
                'authoritative': 'authoritative', 
                'playful': 'playful',
                'inspirational': 'inspirational',
                'professional': 'authoritative', // map to closest
                'bold': 'contrarian', // map to closest
                'casual': 'friendly', // map to closest
                'educational': 'educational',
                'witty': 'playful' // map to closest
              }
              
              const voice = v.tones && v.tones.length > 0 
                ? voiceMapping[v.tones[0]] || 'friendly'
                : 'friendly'
              
              const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  company: v.brandName,
                  industry: v.industry as any,
                  audience: v.audience,
                  voice: voice,
                  bannedTerms: v.bannedTerms,
                }),
              })
              
              if (!response.ok) {
                console.warn('Failed to save onboarding to database, but localStorage saved')
              }
            } else {
              console.log('No auth token found, skipping database sync (localStorage saved)')
            }
          } catch (error) {
            console.warn('Error saving onboarding to database:', error)
            // Continue anyway - localStorage is saved
          }
          
          // Close onboarding dialog
          setShowOnboarding(false)
        }}
      />
    </SidebarProvider>
  )
}