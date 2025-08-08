import { useCallback } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Info, Sliders } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { ProjectSelector } from './project-selector'
import type { Project } from './project-types'

type Props = {
  idea: string
  onIdeaChange: (v: string) => void
  platform: 'tiktok' | 'reels' | 'shorts'
  onPlatformChange: (v: 'tiktok' | 'reels' | 'shorts') => void
  outcome: 'watch-time' | 'shares' | 'saves' | 'ctr'
  onOutcomeChange: (v: 'watch-time' | 'shares' | 'ctr' | 'saves') => void
  count: number
  onCountChange: (v: number) => void
  onGenerate: () => void
  onPreview?: () => void
  onOpenOnboarding: () => void
  onProjectChange: (p: Project | null) => void
}

export function AppSidebar({
  idea,
  onIdeaChange,
  platform,
  onPlatformChange,
  outcome,
  onOutcomeChange,
  count,
  onCountChange,
  onGenerate,
  onPreview = () => {},
  onOpenOnboarding,
  onProjectChange,
}: Props) {
  const setPlatform = useCallback((v: string) => onPlatformChange(v as any), [onPlatformChange])
  const setOutcome = useCallback((v: string) => onOutcomeChange(v as any), [onOutcomeChange])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button type="button" className="justify-between group-data-[collapsible=icon]:justify-center">
                <span className="font-medium">Hook Line Studio </span>
                <Badge variant="secondary" className="ml-2 group-data-[collapsible=icon]:hidden">Beta</Badge>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Project selector */}
        <div className="mt-1">
          <ProjectSelector onChange={onProjectChange} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Input</SidebarGroupLabel>
          <SidebarGroupContent className="grid gap-3 group-data-[collapsible=icon]:hidden">
            <div className="grid gap-2">
              <Label htmlFor="idea">Your idea</Label>
              <Textarea
                id="idea"
                placeholder="e.g., Day-3 results of my sugar-free challenge"
                value={idea}
                onChange={(e) => onIdeaChange(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="reels">Instagram Reels</SelectItem>
                  <SelectItem value="shorts">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="watch-time">Watch-time</SelectItem>
                  <SelectItem value="shares">Shares</SelectItem>
                  <SelectItem value="saves">Saves</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced - collapsible */}
            <Collapsible>
              <div className="flex items-center justify-between">
                <Label className="inline-flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                  Advanced
                </Label>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2">Toggle</Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="count">Count</Label>
                    <SidebarInput
                      id="count"
                      type="number"
                      min={1}
                      max={20}
                      value={count}
                      onChange={(e) => onCountChange(Math.max(1, Math.min(20, Number(e.target.value || 10))))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="inline-flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      Tip
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Each hook includes framework, platform notes, and a transparent score.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" onClick={onOpenOnboarding} className="w-full">Brand settings</Button>
              </CollapsibleContent>
            </Collapsible>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={onGenerate} className="w-full justify-center">
                Generate
              </Button>
              <Button onClick={onPreview} variant="outline" className="w-full justify-center">
                
                <span>Preview sample</span>
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="text-xs text-muted-foreground px-2 pb-1">
          Uses shadcn sidebar + Collapsible for clean inputs.
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
