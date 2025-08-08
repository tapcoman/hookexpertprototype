import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { Project } from './project-types'
import type { Platform, Outcome, Tone } from './types'
import { saveProject } from './utils/projects-store'

const TONE_OPTIONS: Tone[] = [
  'friendly',
  'authoritative',
  'playful',
  'inspirational',
  'professional',
  'bold',
  'casual',
  'educational',
  'witty',
]

export function ProjectDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Project | null
  onSaved: (p: Project) => void
}) {
  const [name, setName] = React.useState(initial?.name || '')
  const [client, setClient] = React.useState(initial?.client || '')
  const [brandVoice, setBrandVoice] = React.useState(initial?.brandVoice || '')
  const [audience, setAudience] = React.useState(initial?.audience || '')
  const [banned, setBanned] = React.useState((initial?.bannedTerms || []).join(', '))
  const [tones, setTones] = React.useState<Tone[]>(initial?.tones || [])
  const [platform, setPlatform] = React.useState<Platform>(initial?.defaultPlatform || 'tiktok')
  const [outcome, setOutcome] = React.useState<Outcome>(initial?.defaultOutcome || 'watch-time')

  React.useEffect(() => {
    if (!open) return
    setName(initial?.name || '')
    setClient(initial?.client || '')
    setBrandVoice(initial?.brandVoice || '')
    setAudience(initial?.audience || '')
    setBanned((initial?.bannedTerms || []).join(', '))
    setTones(initial?.tones || [])
    setPlatform((initial?.defaultPlatform as Platform) || 'tiktok')
    setOutcome((initial?.defaultOutcome as Outcome) || 'watch-time')
  }, [open, initial])

  function toggleTone(t: Tone) {
    setTones((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function save() {
    if (!name.trim()) return
    const project = saveProject({
      id: initial?.id,
      name: name.trim(),
      client: client.trim() || undefined,
      brandVoice: brandVoice.trim() || undefined,
      audience: audience.trim() || undefined,
      bannedTerms: banned
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      tones,
      defaultPlatform: platform,
      defaultOutcome: outcome,
      createdAt: initial?.createdAt as any,
      updatedAt: initial?.updatedAt as any,
    } as any)
    onSaved(project)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit project' : 'New project'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pname">Project name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Snacks Q3" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g., Acme Snacks" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pvoice">Brand voice</Label>
            <Input id="pvoice" value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="e.g., friendly, evidence-led, no fluff" />
          </div>
          <div className="grid gap-2">
            <Label>Tone of voice</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => {
                const active = tones.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTone(t)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                      active ? 'bg-foreground text-background' : 'bg-muted/30 text-foreground hover:bg-muted'
                    }`}
                    aria-pressed={active}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paud">Audience</Label>
            <Input id="paud" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., busy millennials cutting sugar" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pbanned">Banned terms</Label>
            <Textarea id="pbanned" value={banned} onChange={(e) => setBanned(e.target.value)} placeholder="comma-separated" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Default platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
                <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="reels">Instagram Reels</SelectItem>
                  <SelectItem value="shorts">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Default outcome</Label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as any)}>
                <SelectTrigger><SelectValue placeholder="Outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="watch-time">Watch-time</SelectItem>
                  <SelectItem value="shares">Shares</SelectItem>
                  <SelectItem value="saves">Saves</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>{initial ? 'Save changes' : 'Create project'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
