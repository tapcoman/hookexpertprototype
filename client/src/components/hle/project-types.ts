import type { Outcome, Platform, Tone } from './types'

export type Project = {
  id: string
  name: string
  client?: string
  brandVoice?: string
  audience?: string
  bannedTerms?: string[]
  tones?: Tone[]
  defaultPlatform?: Platform
  defaultOutcome?: Outcome
  createdAt: number
  updatedAt: number
}
