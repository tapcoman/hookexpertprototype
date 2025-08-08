'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Rocket, User, HistoryIcon, Star } from 'lucide-react'
import { AppSidebar } from '@/components/hle/app-sidebar'
import { ResultsList } from '@/components/hle/results-list'
import { OnboardingDialog } from '@/components/hle/onboarding-dialog'
import { downloadCsv } from '@/components/hle/utils/csv'
import { HistoryList } from '@/components/hle/history-list'
import { SavedList } from '@/components/hle/saved-list'
import {
  persistRun,
  toggleSavedHook,
  getSavedHooks,
  removeSavedHook,
  type RunRecord,
} from '@/components/hle/utils/store'
import { getSampleHooks } from '@/components/hle/utils/sample-data'
import { postProcessAndRank } from '@/lib/scoring'
import type { HookItem, GenerateRequestBody, GenerateResponseBody, Platform, Outcome, Tone } from '@/components/hle/types'
import type { Project } from '@/components/hle/project-types'

export default function ExactApp() {
  const [hooks, setHooks] = useState<HookItem[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [outcome, setOutcome] = useState<Outcome>('watch-time')
  const [idea, setIdea] = useState('Day-3 results of my sugar-free challenge')
  const [count, setCount] = useState(10)
  const [tab, setTab] = useState<'results' | 'history' | 'saved'>('results')

  // Onboarding/brand data
  const [brandVoice, setBrandVoice] = useState('')
  const [audience, setAudience] = useState('')
  const [bannedTerms, setBannedTerms] = useState<string[]>([])
  const [tones, setTones] = useState<Tone[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [savedHooks, setSavedHooks] = useState<HookItem[]>([])

  useEffect(() => {
    setSavedHooks(getSavedHooks())
    const firstRun = localStorage.getItem('hle:onboarded')
    const voice = localStorage.getItem('hle:brandVoice') || ''
    const aud = localStorage.getItem('hle:audience') || ''
    const banned = localStorage.getItem('hle:bannedTerms') || '[]'
    const tonesRaw = localStorage.getItem('hle:tones') || '[]'
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
    setBrandVoice(voice)
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
  }, [idea, platform, outcome, count, brandVoice, audience, bannedTerms, tones])

  async function doGenerate(countOverride?: number) {
    setLoading(true)
    setStreaming(false)
    setError(null)
    try {
      const body: GenerateRequestBody = {
        idea,
        platform,
        outcome,
        count: countOverride ?? count,
        brandVoice,
        audience,
        bannedTerms,
        toneOfVoice: tones,
      }
      lastParams.current = { idea, platform, outcome, count: countOverride ?? count }
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Generation failed')
      }
      const data = (await res.json()) as GenerateResponseBody
      setHooks(data.hooks)
      setTab('results')
      void persistRun({
        idea,
        platform,
        outcome,
        count: countOverride ?? count,
        brandVoice,
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
      const body: GenerateRequestBody = {
        idea,
        platform,
        outcome,
        count: countOverride ?? count,
        brandVoice,
        audience,
        bannedTerms,
        toneOfVoice: tones,
      }
      lastParams.current = { idea, platform, outcome, count: countOverride ?? count }
      const res = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok || !res.body) {
        const t = await res.text()
        throw new Error(t || 'Streaming request failed')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffered = ''
      let all: HookItem[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffered += decoder.decode(value, { stream: true })
        let idx: number
        while ((idx = buffered.indexOf('\n')) >= 0) {
          const line = buffered.slice(0, idx).trim()
          buffered = buffered.slice(idx + 1)
          if (!line) continue
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'item' && msg.hook) {
              all = [...all, msg.hook as HookItem]
              setHooks(all)
            } else if (msg.type === 'done') {
              const { topId } = msg
              if (topId) {
                all = all.map((h) => ({ ...h, isTop: h.id === topId }))
                setHooks(all)
              }
              void persistRun({
                idea,
                platform,
                outcome,
                count: countOverride ?? count,
                brandVoice,
                audience,
                bannedTerms,
                hooks: all,
              })
            }
          } catch {
            // ignore
          }
        }
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
    const { downloadCsv } = require('@/components/hle/utils/csv') // defer import to avoid ssr edge issues
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
          if (p.brandVoice !== undefined) setBrandVoice(p.brandVoice)
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
                <DropdownMenuItem asChild>
                  <a href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </a>
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
        brandVoice={brandVoice}
        audience={audience}
        bannedTerms={bannedTerms}
        tones={tones}
        onSave={(v) => {
          setBrandVoice(v.brandVoice)
          setAudience(v.audience)
          setBannedTerms(v.bannedTerms)
          setTones(v.tones as Tone[])
        }}
      />
    </SidebarProvider>
  )
}