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
import { getAuthToken } from '@/lib/api'
import { AppSidebar } from '@/components/hle/app-sidebar'
import { ResultsList } from '@/components/hle/results-list'
// Removed OnboardingDialog - using signup onboarding flow instead
import { downloadCsv } from '@/components/hle/utils/csv'
import { HistoryList } from '@/components/hle/history-list'
import { SavedList } from '@/components/hle/saved-list'
import {
  persistRun,
  getSavedHooks,
  removeSavedHook,
  toggleSavedHook,
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

    // Auth status is handled by Clerk - no manual verification needed
    // ClerkAuthSync component manages token synchronization
    console.log('✅ Hook generation app mounted - auth managed by Clerk')
  }, [])

  // Onboarding/brand data
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [audience, setAudience] = useState('')
  const [bannedTerms, setBannedTerms] = useState<string[]>([])
  const [tones, setTones] = useState<Tone[]>([])
  // Removed showOnboarding - using signup onboarding flow instead

  const [savedHooks, setSavedHooks] = useState<HookItem[]>([])

  useEffect(() => {
    setSavedHooks(getSavedHooks())
    
    // Load onboarding data from user profile (database) first, then fallback to localStorage
    const loadUserProfile = async () => {
      const token = await getAuthToken()
      if (token) {
        try {
          const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const profileData = await response.json()
            const user = profileData.data?.user
            
            if (user) {
              console.log('✅ Loaded profile data from database:', user)
              
              // Set state from database
              setBrandName(user.company || '')
              setIndustry(user.industry || '')
              setAudience(user.audience || '')
              setBannedTerms(user.bannedTerms || [])
              // Note: platforms and tones aren't in the DB schema yet, use localStorage fallback
              
              // Sync database data to localStorage for consistency  
              localStorage.setItem('hle:brandName', user.company || '')
              localStorage.setItem('hle:industry', user.industry || '')
              localStorage.setItem('hle:audience', user.audience || '')
              localStorage.setItem('hle:bannedTerms', JSON.stringify(user.bannedTerms || []))
              
              console.log('🔄 Synced database profile to localStorage')
              return // Exit early if database load successful
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to load profile from database, using localStorage fallback:', error)
        }
      }
      
      // Fallback: Load from localStorage (for backwards compatibility)
      console.log('📂 Loading from localStorage fallback...')
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
      
      console.log('📋 Loaded from localStorage fallback:', {
        brandName: name, industry: ind, audience: aud
      })
    }
    
    loadUserProfile()
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
        adaptationLevel: 50,
        brandVoice: brandName,
        audience,
        bannedTerms,
        toneOfVoice: tones,
      }
      lastParams.current = { idea, platform, outcome, count: countOverride ?? count }

      // Get fresh auth token from Clerk
      const token = await getAuthToken()
      console.log('🔐 Hook Generation Auth Debug:')
      console.log('- Token exists:', !!token)
      console.log('- Token type:', typeof token)
      console.log('- Token length:', token?.length || 0)
      console.log('- Token preview:', token ? token.substring(0, 30) + '...' : 'null')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
        console.log('✅ Authorization header set with fresh Clerk token')
      } else {
        console.error('❌ No auth token available from Clerk')
        throw new Error('Authentication required. Please reload the page and try again.')
      }
      
      const res = await fetch('/api/hooks/generate/enhanced', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error(`Hook generation failed (${res.status}):`, errorText)
        if (res.status === 401) {
          throw new Error('Authentication required. Please sign in to generate hooks.')
        }
        throw new Error(errorText || 'Generation failed')
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
        adaptationLevel: 50,
        brandVoice: brandName,
        audience,
        bannedTerms,
        toneOfVoice: tones,
      }

      lastParams.current = { idea, platform, outcome, count: countOverride ?? count }

      // Get fresh auth token from Clerk
      const token = await getAuthToken()
      console.log('🔐 Hook Generation Auth Debug:')
      console.log('- Token exists:', !!token)
      console.log('- Token type:', typeof token)
      console.log('- Token length:', token?.length || 0)
      console.log('- Token preview:', token ? token.substring(0, 30) + '...' : 'null')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
        console.log('✅ Authorization header set with fresh Clerk token')
      } else {
        console.error('❌ No auth token available from Clerk')
        throw new Error('Authentication required. Please reload the page and try again.')
      }
      
      const res = await fetch('/api/hooks/generate/enhanced', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error(`Hook generation failed (${res.status}):`, errorText)
        if (res.status === 401) {
          throw new Error('Authentication required. Please sign in to generate hooks.')
        }
        throw new Error(errorText || 'Generation failed')
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
        onOpenOnboarding={() => {
          // Redirect to profile page for brand settings instead
          console.log('Redirecting to profile for brand settings')
        }}
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
                  {loading || streaming ? (
                    <div className="space-y-6">
                      {/* AI Thinking Animation */}
                      <div className="flex flex-col items-center justify-center py-12">
                        <motion.div
                          className="relative mb-6"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {/* Brain/AI Icon with Pulse */}
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                "0 0 0 0 rgba(59, 130, 246, 0)",
                                "0 0 0 10px rgba(59, 130, 246, 0.1)",
                                "0 0 0 0 rgba(59, 130, 246, 0)"
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <motion.svg
                              className="w-8 h-8 text-primary-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </motion.svg>
                          </motion.div>
                          
                          {/* Floating particles */}
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-primary/40 rounded-full"
                              style={{
                                top: "50%",
                                left: "50%",
                                translateX: "-50%",
                                translateY: "-50%"
                              }}
                              animate={{
                                x: [0, 20 * Math.cos(i * 120 * Math.PI / 180), 0],
                                y: [0, 20 * Math.sin(i * 120 * Math.PI / 180), 0],
                                opacity: [0, 1, 0]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </motion.div>
                        
                        <motion.h3 
                          className="text-xl font-semibold text-foreground mb-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {streaming ? "Generating your hooks..." : "AI is thinking..."}
                        </motion.h3>
                        
                        <motion.p 
                          className="text-muted-foreground text-center max-w-md"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {streaming 
                            ? "Creating viral hooks tailored to your brand and audience"
                            : "Analyzing your topic and crafting the perfect hooks"
                          }
                        </motion.p>
                        
                        {/* Progress dots */}
                        <div className="flex space-x-2 mt-4">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-primary/60 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Skeleton Cards - Show when streaming */}
                      {streaming && (
                        <div className="grid gap-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="relative h-32 w-full rounded-xl border bg-muted/20 overflow-hidden"
                            >
                              {/* Shimmer effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                animate={{ x: [-100, 400] }}
                                transition={{ 
                                  duration: 2, 
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                              />
                              
                              {/* Content skeleton */}
                              <div className="p-4 space-y-3">
                                <div className="h-4 bg-muted/40 rounded w-3/4"></div>
                                <div className="h-3 bg-muted/30 rounded w-full"></div>
                                <div className="h-3 bg-muted/30 rounded w-5/6"></div>
                                <div className="flex justify-between items-center mt-4">
                                  <div className="h-3 bg-muted/30 rounded w-16"></div>
                                  <div className="h-6 w-12 bg-muted/40 rounded-full"></div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <ResultsList
                      hooks={hooks}
                      platform={platform}
                      streaming={streaming}
                      onToggleFavorite={(id) => {
                        const hook = hooks.find((h) => h.id === id)
                        if (hook) {
                          toggleSavedHook(hook)
                          setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h)))
                          setSavedHooks(getSavedHooks())
                        }
                      }}
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
                    setSavedHooks(getSavedHooks())
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
    </SidebarProvider>
  )
}