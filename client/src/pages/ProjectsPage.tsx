import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Folder, MoreHorizontal, Edit3, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu'

interface Project {
  id: string
  name: string
  description?: string
  hookCount: number
  createdAt: Date
  lastUsed: Date
  color: string
}

const ProjectsPage: React.FC = () => {
  const [projects] = useState<Project[]>([])

  const handleNewProject = () => {
    // TODO: Implement project creation modal
    console.log('Create new project')
  }

  const handleProjectAction = (action: string, projectId: string) => {
    // TODO: Implement project actions
    console.log(`${action} project ${projectId}`)
  }

  return (
    <AppShell>
      {/* Page Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Projects</h1>
              <p className="text-sm text-muted-foreground">Organize your hooks into projects</p>
            </div>
            <Button onClick={handleNewProject}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-8">
        {projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleProjectAction('edit', project.id)}
                            className="cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleProjectAction('delete', project.id)}
                            className="cursor-pointer text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {project.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {project.hookCount} hooks
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Last used {project.lastUsed.toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first project to organize your hooks and keep your content strategy focused.
            </p>
            <Button onClick={handleNewProject} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Mobile bottom padding */}
      <div className="h-20 lg:h-0" />
    </AppShell>
  )
}

export default ProjectsPage