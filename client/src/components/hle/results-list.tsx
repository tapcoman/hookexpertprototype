import * as React from 'react'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Copy, Heart, HeartOff, Mic, Clapperboard, TypeIcon, Eye } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { HookItem, Platform } from './types'

type Props = {
  hooks: HookItem[]
  platform: Platform
  streaming?: boolean
  isGenerating?: boolean
  onToggleFavorite: (id?: string) => void
  onCopySpoken: (id?: string) => void
  onCopyOverlay: (id?: string) => void
  onCopyAll: (id?: string) => void
  onShowSample?: () => void
}

const MAX = { curiosity: 2, brevity: 1, platformFit: 1, framework: 1 } as const

function friendlyLabel(key: keyof typeof MAX, platform: Platform) {
  switch (key) {
    case 'curiosity':
      return 'Makes you want to know more'
    case 'brevity':
      return 'Short and punchy'
    case 'platformFit':
      return `Right for ${platform === 'tiktok' ? 'TikTok' : platform === 'reels' ? 'Reels' : 'Shorts'}`
    case 'framework':
      return 'Formula used'
  }
}

function generateTip(
  breakdown: HookItem['breakdown'] | undefined,
  platform: Platform
): string {
  const b = breakdown || { curiosity: 0, brevity: 0, platformFit: 0, framework: 0 }
  const gaps = {
    curiosity: MAX.curiosity - b.curiosity,
    brevity: MAX.brevity - b.brevity,
    platformFit: MAX.platformFit - b.platformFit,
    framework: MAX.framework - b.framework,
  }
  const weakest = Object.entries(gaps).sort((a, b) => b[1] - a[1])[0]?.[0] as keyof typeof MAX
  switch (weakest) {
    case 'brevity':
      return 'A bit long — trim 2–3 words for a snappier open.'
    case 'platformFit':
      return `Add a platform cue (e.g., “before you scroll”, “tap save”, “subscribe”).`
    case 'framework':
      return 'Try a stronger formula like an Open Loop or PAS.'
    case 'curiosity':
    default:
      return 'Spark curiosity — lead with a question or a surprising number.'
  }
}

function Chip({
  color,
  label,
  points,
  help,
}: {
  color: 'emerald' | 'amber' | 'orange' | 'neutral'
  label: string
  points: number
  help: string
}) {
  const dot =
    color === 'emerald'
      ? 'bg-emerald-500'
      : color === 'amber'
      ? 'bg-amber-500'
      : color === 'orange'
      ? 'bg-orange-500'
      : 'bg-neutral-500'
  const ring =
    color === 'emerald'
      ? 'ring-emerald-500/30'
      : color === 'amber'
      ? 'ring-amber-500/30'
      : color === 'orange'
      ? 'ring-orange-500/30'
      : 'ring-neutral-500/30'

  const body = (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs',
        'bg-muted/40',
        'ring-1',
        ring
      )}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', dot)} aria-hidden="true" />
      <span className="font-medium tabular-nums">{'+' + points.toFixed(2)}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )

  return (
    <>
      {/* Mobile: tap to open popover */}
      <Popover>
        <PopoverTrigger className="md:hidden">{body}</PopoverTrigger>
        <PopoverContent className="w-72 text-sm">{help}</PopoverContent>
      </Popover>
      {/* Desktop: hover tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild className="hidden md:inline-flex">
            {body}
          </TooltipTrigger>
          <TooltipContent side="top">{help}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}

function ScoreDetails({
  h,
  platform,
  expanded,
  onToggle,
}: {
  h: HookItem
  platform: Platform
  expanded: boolean
  onToggle: () => void
}) {
  const b = h.breakdown || { curiosity: 0, brevity: 0, platformFit: 0, framework: 0 }
  const total = (b.curiosity + b.brevity + b.platformFit + b.framework).toFixed(2)
  const tip = useMemo(() => generateTip(h.breakdown, platform), [h.breakdown, platform])

  return (
    <div className="grid gap-2">
      {/* Simple view */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="text-sm">
          <span className="font-medium">Why this scored {total} / 5</span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span className="text-muted-foreground">{tip}</span>
        </div>
        <Button variant="link" className="px-0 h-6" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? 'Hide details' : 'Show details'}
        </Button>
      </div>

      {/* Details */}
      {expanded && (
        <div className="grid gap-3">
          {/* Contribution bar */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs uppercase text-muted-foreground">Score breakdown</span>
              <div className="hidden md:flex gap-2 text-[11px] text-muted-foreground">
                <span>Curiosity</span>
                <span>Brevity</span>
                <span>Fit</span>
                <span>Framework</span>
              </div>
            </div>
            <div
              className="h-2 w-full rounded-md bg-muted/40 overflow-hidden"
              aria-label="Score breakdown bar"
            >
              <div className="h-full flex">
                <span
                  className="h-full bg-emerald-500/80"
                  style={{ width: `${(((b.curiosity ?? 0) / 5) * 100).toFixed(2)}%` }}
                />
                <span
                  className="h-full bg-amber-500/80"
                  style={{ width: `${(((b.brevity ?? 0) / 5) * 100).toFixed(2)}%` }}
                />
                <span
                  className="h-full bg-orange-500/80"
                  style={{ width: `${(((b.platformFit ?? 0) / 5) * 100).toFixed(2)}%` }}
                />
                <span
                  className="h-full bg-neutral-500/80"
                  style={{ width: `${(((b.framework ?? 0) / 5) * 100).toFixed(2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Legend chips */}
          <div className="flex flex-wrap gap-2">
            <Chip
              color="emerald"
              label={friendlyLabel('curiosity', platform)}
              points={b.curiosity}
              help="Curiosity: Does it create a question or tease? Numbers and open loops boost this."
            />
            <Chip
              color="amber"
              label={friendlyLabel('brevity', platform)}
              points={b.brevity}
              help="Brevity: Closer to the platform’s ideal word count scores higher."
            />
            <Chip
              color="orange"
              label={friendlyLabel('platformFit', platform)}
              points={b.platformFit}
              help="Platform fit: Uses cues that work on this platform (CTA words, pacing, norms)."
            />
            <Chip
              color="neutral"
              label={friendlyLabel('framework', platform)}
              points={b.framework}
              help="Framework: Bonus from the copywriting formula (Open Loop &gt; PAS &gt; AIDA &gt; 4U’s)."
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function ResultsList({
  hooks,
  platform,
  streaming,
  onToggleFavorite,
  onCopySpoken,
  onCopyOverlay,
  onCopyAll,
  onShowSample,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (!hooks?.length) {
    return (
      <div className="flex items-center justify-between rounded-xl border p-6">
        <div className="text-sm text-muted-foreground">
          {streaming ? 'Streaming results… hooks will appear here as they arrive.' : 'No results yet.'}
        </div>
        {!streaming && onShowSample && (
          <Button size="sm" variant="outline" onClick={onShowSample}>
            <Eye className="mr-2 h-4 w-4" />
            Show sample hooks
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {hooks.map((h, idx) => {
        const id = h.id ?? `${h.framework}-${idx}`
        const isOpen = !!expanded[id]
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card className={cn('group relative overflow-hidden', h.isTop && 'ring-2 ring-emerald-500/60')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">
                  {h.framework} <span className="text-muted-foreground font-normal">framework</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {h.isTop && <Badge className="bg-emerald-600 hover:bg-emerald-600">Top pick</Badge>}
                  <Badge variant="secondary" className="tabular-nums">Score {h.score.toFixed(2)} / 5</Badge>
                  <div className="hidden sm:flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onCopyAll(h.id)} aria-label="Copy all">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn('h-8 w-8', h.favorite && 'text-red-600')}
                      onClick={() => onToggleFavorite(h.id)}
                      aria-label={h.favorite ? 'Unfavorite' : 'Favorite'}
                    >
                      {h.favorite ? <HeartOff className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-5">
                {/* Tri-modal emphasis */}
                <div className="grid gap-3 md:grid-cols-3">
                  {/* Spoken hook */}
                  <section
                    className="relative rounded-xl border bg-rose-500/5 border-rose-500/20 p-3 md:p-4 pl-4 md:pl-5"
                    aria-labelledby={`spoken-${id}`}
                  >
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-rose-500/60" />
                    <div className="mb-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 text-rose-700 dark:text-rose-300">
                        <Mic className="h-4 w-4" />
                        <span id={`spoken-${id}`} className="text-xs uppercase tracking-wide">
                          Spoken hook
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onCopySpoken(h.id)}
                        aria-label="Copy spoken hook"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[15px] md:text-base leading-relaxed font-medium">
                      {h.spokenHook}
                    </p>
                  </section>

                  {/* Visual cold-open */}
                  <section
                    className="relative rounded-xl border bg-amber-500/5 border-amber-500/20 p-3 md:p-4 pl-4 md:pl-5"
                    aria-labelledby={`visual-${id}`}
                  >
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-amber-500/60" />
                    <div className="mb-2 inline-flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Clapperboard className="h-4 w-4" />
                      <span id={`visual-${id}`} className="text-xs uppercase tracking-wide">
                        Visual cold-open
                      </span>
                    </div>
                    <p className="text-sm md:text-[15px] leading-relaxed">
                      {h.visualCue}
                    </p>
                  </section>

                  {/* Overlay text */}
                  <section
                    className="relative rounded-xl border bg-emerald-500/5 border-emerald-500/20 p-3 md:p-4 pl-4 md:pl-5"
                    aria-labelledby={`overlay-${id}`}
                  >
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-emerald-500/60" />
                    <div className="mb-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <TypeIcon className="h-4 w-4" />
                        <span id={`overlay-${id}`} className="text-xs uppercase tracking-wide">
                          Overlay text
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onCopyOverlay(h.id)}
                        aria-label="Copy overlay text"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm md:text-[15px] leading-relaxed font-semibold tracking-tight">
                      {h.overlayText}
                    </p>
                  </section>
                </div>

                {/* Simple/Details scoring */}
                <ScoreDetails
                  h={h}
                  platform={platform}
                  expanded={isOpen}
                  onToggle={() => setExpanded((m) => ({ ...m, [id]: !isOpen }))}
                />

                {/* Reasons */}
                {h.reasons?.length ? (
                  <div className="grid gap-1">
                    <div className="text-xs uppercase text-muted-foreground">Why it scores</div>
                    <ul className="text-sm leading-relaxed">
                      {h.reasons.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
