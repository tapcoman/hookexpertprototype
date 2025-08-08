'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FolderPlus, FolderOpen, PlusCircle } from 'lucide-react'
import { ProjectDialog } from './project-dialog'
import type { Project } from './project-types'
import { getActiveProjectId, getProject, getProjects, setActiveProjectId } from './utils/projects-store'

export function ProjectSelector({
  onChange,
}: {
  onChange: (p: Project | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [active, setActive] = React.useState<Project | null>(null)

  React.useEffect(() => {
    const list = getProjects()
    setProjects(list)
    const aid = getActiveProjectId()
    const ap = getProject(aid)
    setActive(ap)
  }, [])

  function refresh() {
    const list = getProjects()
    setProjects(list)
    const aid = getActiveProjectId()
    setActive(getProject(aid))
  }

  function selectProject(p: Project | null) {
    setActiveProjectId(p?.id || null)
    setActive(p)
    setOpen(false)
    onChange(p)
  }

  return (
    <div className="w-full">
      <div className="mb-1 text-[11px] uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">Project</div>
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="inline-flex items-center gap-2">
                {active ? <FolderOpen className="h-4 w-4" /> : <FolderPlus className="h-4 w-4" />}
                <span className="truncate">{active ? active.name : 'No project (personal)'}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[--radix-popper-anchor-width]">
            <DropdownMenuLabel>Switch project</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => selectProject(null)}>No project (personal)</DropdownMenuItem>
            <DropdownMenuSeparator />
            {projects.length ? (
              projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => selectProject(p)}>
                  {p.name} {p.client ? `— ${p.client}` : ''}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No saved projects</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> New project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(p) => {
          refresh()
          selectProject(p)
        }}
      />
    </div>
  )
}
