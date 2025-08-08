export type Platform = 'tiktok' | 'reels' | 'shorts'
export type Outcome = 'watch-time' | 'shares' | 'saves' | 'ctr'

export type Tone =
  | 'friendly'
  | 'authoritative'
  | 'playful'
  | 'inspirational'
  | 'professional'
  | 'bold'
  | 'casual'
  | 'educational'
  | 'witty'

export type ScoreBreakdown = {
  curiosity: number // 0..2
  brevity: number // 0..1
  platformFit: number // 0..1
  framework: number // 0..1
}

export type HookItem = {
  id?: string
  spokenHook: string
  visualCue: string
  overlayText: string
  framework: string
  platformNotes?: {
    idealWordCount?: number
    proofCue?: string
  }
  score: number
  reasons: string[]
  breakdown?: ScoreBreakdown
  isTop?: boolean
  favorite?: boolean
}

export type GenerateRequestBody = {
  idea: string
  platform: Platform
  outcome: Outcome
  count?: number
  brandVoice?: string
  audience?: string
  bannedTerms?: string[]
  toneOfVoice?: Tone[]
}

export type GenerateResponseBody = {
  hooks: HookItem[]
}
