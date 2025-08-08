'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Copy, Trash2 } from 'lucide-react'
import type { HookItem } from './types'

export function SavedList({
  hooks,
  onRemove,
  onCopyAll,
}: {
  hooks: HookItem[]
  onRemove: (id?: string) => void
  onCopyAll: (id?: string) => void
}) {
  if (!hooks.length) {
    return <div className="rounded-xl border p-6 text-sm text-muted-foreground">No saved hooks yet. Favorite any result to save it here.</div>
  }

  return (
    <div className="grid gap-3">
      {hooks.map((h) => (
        <Card key={h.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{h.framework} <span className="text-muted-foreground font-normal">framework</span></CardTitle>
            <Badge variant="secondary">{h.score.toFixed(2)} / 5</Badge>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1">
              <div className="text-xs uppercase text-muted-foreground">Spoken hook</div>
              <div className="text-base">{h.spokenHook}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs uppercase text-muted-foreground">Visual cold-open</div>
              <div className="text-sm">{h.visualCue}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs uppercase text-muted-foreground">Overlay text</div>
              <div className="text-sm font-medium">{h.overlayText}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onCopyAll(h.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onRemove(h.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
