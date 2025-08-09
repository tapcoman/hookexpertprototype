'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useAuth } from '@/contexts/SimpleAuthContext'
import type { Tone } from './types'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  brandVoice: string
  audience: string
  bannedTerms: string[]
  tones?: Tone[]
  onSave: (v: { 
    brandName: string
    industry: string
    platforms: string[]
    audience: string
    bannedTerms: string[]
    tones: Tone[]
  }) => void
}

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

const INDUSTRY_OPTIONS = [
  'agency',
  'creator',
  'ecommerce',
  'saas',
  'local-business',
  'education',
  'healthcare',
  'finance',
  'fitness',
  'beauty',
  'food',
  'technology',
  'real-estate',
  'consulting',
  'other'
]

const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram Reels' },
  { value: 'youtube', label: 'YouTube Shorts' }
]

export function OnboardingDialog({
  open,
  onOpenChange,
  brandVoice,
  audience,
  bannedTerms,
  tones = [],
  onSave,
}: Props) {
  const [brandName, setBrandName] = React.useState(brandVoice)
  const [industry, setIndustry] = React.useState('')
  const [platforms, setPlatforms] = React.useState<string[]>([])
  const [aud, setAud] = React.useState(audience)
  const [banned, setBanned] = React.useState(bannedTerms.join(', '))
  const [toneSelections, setToneSelections] = React.useState<Tone[]>(tones)
  const [saving, setSaving] = React.useState(false)
  
  const { user, updateProfile } = useAuth()

  React.useEffect(() => {
    setBrandName(brandVoice)
    setAud(audience)
    setBanned(bannedTerms.join(', '))
    setToneSelections(tones)
  }, [brandVoice, audience, bannedTerms, tones])

  function toggleTone(t: Tone) {
    setToneSelections((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  function togglePlatform(platform: string) {
    setPlatforms((prev) =>
      prev.includes(platform) 
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  async function save() {
    if (saving) return
    
    setSaving(true)
    try {
      const terms = banned
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      
      // Save to localStorage first for immediate use
      localStorage.setItem('hle:onboarded', '1')
      localStorage.setItem('hle:brandName', brandName)
      localStorage.setItem('hle:industry', industry)
      localStorage.setItem('hle:platforms', JSON.stringify(platforms))
      localStorage.setItem('hle:audience', aud)
      localStorage.setItem('hle:bannedTerms', JSON.stringify(terms))
      localStorage.setItem('hle:tones', JSON.stringify(toneSelections))
      
      // Sync with backend if user is authenticated
      if (user) {
        try {
          await updateProfile({
            company: brandName,
            industry: industry as any,
            audience: aud,
            bannedTerms: terms
          })
        } catch (error) {
          console.error('Failed to sync profile to backend:', error)
          // Continue anyway since localStorage is saved
        }
      }
      
      onSave({ 
        brandName, 
        industry, 
        platforms, 
        audience: aud, 
        bannedTerms: terms, 
        tones: toneSelections 
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Brand setup</DialogTitle>
          <DialogDescription>We’ll keep every hook on-brand across platforms.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              placeholder="e.g., Your Company Name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((ind) => (
                  <SelectItem key={ind} value={ind} className="capitalize">
                    {ind.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Priority Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((platform) => {
                const isSelected = platforms.includes(platform.value)
                return (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => togglePlatform(platform.value)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors ${
                      isSelected
                        ? 'bg-foreground text-background'
                        : 'bg-muted/30 text-foreground hover:bg-muted'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {platform.label}
                  </button>
                )
              })}
            </div>
            {platforms.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Selected: {platforms.map(p => PLATFORM_OPTIONS.find(opt => opt.value === p)?.label).join(', ')}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Tone of voice</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => {
                const active = toneSelections.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTone(t)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                      active
                        ? 'bg-foreground text-background'
                        : 'bg-muted/30 text-foreground hover:bg-muted'
                    }`}
                    aria-pressed={active}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
            {toneSelections.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Selected: {toneSelections.join(', ')}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aud">Audience</Label>
            <Input
              id="aud"
              placeholder="e.g., busy millennials trying to cut sugar"
              value={aud}
              onChange={(e) => setAud(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="banned">Banned terms</Label>
            <Textarea
              id="banned"
              placeholder="comma-separated list"
              value={banned}
              onChange={(e) => setBanned(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Tip: You can revisit brand settings anytime. We’ll exclude these terms from outputs.
            </div>
            <div className="flex flex-wrap gap-1">
              {banned
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 6)
                .map((t, i) => (
                  <Badge key={i} variant="secondary">
                    {t}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
