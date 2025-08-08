import type { Outcome, Platform, HookItem } from '../types'

const RUNS_KEY = 'hle:runs'
const SAVED_KEY = 'hle:saved'

export type RunRecord = {
  id: string
  createdAt: number
  idea: string
  platform: Platform
  outcome: Outcome
  count: number
  brandVoice?: string
  audience?: string
  bannedTerms?: string[]
  hooks: HookItem[]
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export async function persistRun(run: Omit<RunRecord, 'id' | 'createdAt'>) {
  const record: RunRecord = {
    id: crypto.randomUUID?.() || String(Date.now()),
    createdAt: Date.now(),
    ...run,
  }
  const runs = readJson<RunRecord[]>(RUNS_KEY, [])
  runs.unshift(record)
  // keep last 50
  writeJson(RUNS_KEY, runs.slice(0, 50))
  return record
}

export function getRuns(): RunRecord[] {
  return readJson<RunRecord[]>(RUNS_KEY, [])
}

export function deleteRun(id: string) {
  const runs = getRuns().filter((r) => r.id !== id)
  writeJson(RUNS_KEY, runs)
}

export function clearRuns() {
  writeJson(RUNS_KEY, [])
}

export function getSavedHooks(): HookItem[] {
  return readJson<HookItem[]>(SAVED_KEY, [])
}

export function toggleSavedHook(h: HookItem) {
  const saved = getSavedHooks()
  const exists = saved.find((x) => x.id === h.id)
  let next: HookItem[]
  if (exists) {
    next = saved.filter((x) => x.id !== h.id)
  } else {
    next = [{ ...h, favorite: true }, ...saved].slice(0, 200)
  }
  writeJson(SAVED_KEY, next)
}

export function removeSavedHook(id: string) {
  const saved = getSavedHooks().filter((x) => x.id !== id)
  writeJson(SAVED_KEY, saved)
}
