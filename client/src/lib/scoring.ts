import type { HookItem, Platform, ScoreBreakdown } from '@/components/hle/types'

const platformIdealWordRange: Record<Platform, { min: number; max: number }> = {
  tiktok: { min: 7, max: 11 },
  reels: { min: 7, max: 10 },
  shorts: { min: 6, max: 10 },
}

function wordCount(s: string) {
  return (s.match(/\b\w+\b/g) || []).length
}

// Gaussian length curve mapped to [0, 1]
function lengthScore(words: number, platform: Platform) {
  const { min, max } = platformIdealWordRange[platform]
  const mu = (min + max) / 2 // mid-point
  const sigma = (max - min) / 2.5 // spread
  const exponent = -Math.pow(words - mu, 2) / (2 * sigma * sigma)
  const g = Math.exp(exponent)
  return Math.max(0, Math.min(1, g))
}

// Heuristic curiosity detection mapped to [0, 2]
function curiosityPoints(text: string) {
  const t = text.toLowerCase()
  let pts = 0
  const cues = [
    '?',
    'secret',
    'what happens',
    'until',
    'before you',
    'the one thing',
    'no one told you',
    'you’re doing it wrong',
    'surprising',
    'never',
    'watch',
  ]
  for (const c of cues) {
    if (t.includes(c)) pts += 0.35
  }
  if (/^\d/.test(t)) pts += 0.4 // numbers upfront
  if (/\b(how|what|why)\b/.test(t)) pts += 0.3
  return Math.min(2, pts)
}

// Platform fit mapped to [0, 1]
function platformFitPoints(text: string, platform: Platform) {
  const t = text.toLowerCase()
  let pts = 0
  const general = ['you', 'watch', 'save', 'share', 'tap', 'swipe']
  general.forEach((g) => t.includes(g) && (pts += 0.15))
  if (platform === 'tiktok' && (t.includes('scroll') || t.includes('trend'))) pts += 0.25
  if (platform === 'reels' && (t.includes('save') || t.includes('aesthetic'))) pts += 0.25
  if (platform === 'shorts' && (t.includes('subscribe') || t.includes('channel'))) pts += 0.25
  return Math.min(1, pts)
}

// Framework bonus mapped to [0, 1]
function frameworkBonus(framework: string) {
  const f = framework.toLowerCase()
  if (/open\s*loop/.test(f)) return 1
  if (/(pas|problem\-agitate\-solve)/.test(f)) return 0.8
  if (/aida/.test(f)) return 0.7
  if (/4u/.test(f)) return 0.6
  return 0.3
}

export function scoreHook(h: Omit<HookItem, 'score' | 'reasons' | 'breakdown'>, platform: Platform): {
  score: number
  reasons: string[]
  breakdown: ScoreBreakdown
} {
  const wc = wordCount(h.spokenHook)
  const brevity = lengthScore(wc, platform) // 0..1
  const curiosity = curiosityPoints(h.spokenHook) // 0..2
  const fit = platformFitPoints(h.spokenHook, platform) // 0..1
  const fw = frameworkBonus(h.framework) // 0..1

  // Composite 0..5: +2 curiosity, +1 brevity, +1 platform fit, +1 framework
  const score = Math.max(0, Math.min(5, curiosity + brevity + fit + fw))
  const reasons: string[] = [
    `+${curiosity.toFixed(2)} curiosity`,
    `+${brevity.toFixed(2)} brevity`,
    `+${fit.toFixed(2)} platform fit`,
    `+${fw.toFixed(2)} framework`,
  ]
  return { score, reasons, breakdown: { curiosity, brevity, platformFit: fit, framework: fw } }
}

export function postProcessAndRank(items: HookItem[], platform: Platform): HookItem[] {
  const enriched = items.map((it) => {
    const { score, reasons, breakdown } = scoreHook(it, platform)
    return { ...it, score, reasons, breakdown }
  })
  enriched.sort((a, b) => b.score - a.score)
  if (enriched.length > 0) enriched[0].isTop = true
  return enriched
}
