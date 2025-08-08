import type { Project } from '../project-types'

const PROJECTS_KEY = 'hle:projects'
const ACTIVE_PROJECT_KEY = 'hle:activeProjectId'

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

export function getProjects(): Project[] {
  return readJson<Project[]>(PROJECTS_KEY, [])
}

export function getProject(id?: string | null): Project | null {
  if (!id) return null
  return getProjects().find((p) => p.id === id) || null
}

export function saveProject(p: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Project {
  const now = Date.now()
  const list = getProjects()
  if (p.id) {
    const idx = list.findIndex((x) => x.id === p.id)
    if (idx >= 0) {
      const updated = { ...list[idx], ...p, updatedAt: now }
      list[idx] = updated
      writeJson(PROJECTS_KEY, list)
      return updated
    }
  }
  const created: Project = {
    id: crypto.randomUUID?.() || String(now),
    name: p.name,
    client: p.client,
    brandVoice: p.brandVoice,
    audience: p.audience,
    bannedTerms: p.bannedTerms || [],
    tones: p.tones || [],
    defaultPlatform: p.defaultPlatform,
    defaultOutcome: p.defaultOutcome,
    createdAt: now,
    updatedAt: now,
  }
  writeJson(PROJECTS_KEY, [created, ...list].slice(0, 100))
  return created
}

export function deleteProject(id: string) {
  const list = getProjects().filter((p) => p.id !== id)
  writeJson(PROJECTS_KEY, list)
  const active = getActiveProjectId()
  if (active === id) setActiveProjectId(null)
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY)
}

export function setActiveProjectId(id: string | null) {
  if (id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id)
  } else {
    localStorage.removeItem(ACTIVE_PROJECT_KEY)
  }
}
