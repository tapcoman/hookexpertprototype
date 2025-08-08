import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'wouter'
import { 
  Sparkles,
  FolderPlus,
  Folder,
  TrendingUp,
  Radar,
  Heart,
  History,
  User,
  CreditCard,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  Trash2
} from 'lucide-react'
import { useAuth } from '../../contexts/SimpleAuthContext'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'

interface Project {
  id: string
  name: string
  description?: string
  hookCount: number
  createdAt: Date
  lastUsed: Date
  color: string
}

interface AppSidebarProps {
  className?: string
}

const AppSidebar: React.FC<AppSidebarProps> = ({ className }) => {
  const { user } = useAuth()
  const [location] = useLocation()
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  
  // Projects data - will be loaded from API
  const [projects] = useState<Project[]>([])

  const creditsRemaining = user ? (user.freeCredits - user.usedCredits) : 0
  const displayName = user?.firstName || user?.displayName || 'User'

  const getCreditStatus = () => {
    if (creditsRemaining > 10) return 'high'
    if (creditsRemaining > 5) return 'medium'
    return 'low'
  }

  const getCreditVariant = () => {
    const status = getCreditStatus()
    switch (status) {
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'destructive'
      default: return 'outline'
    }
  }

  const navigationSections = [
    {
      title: 'Generate',
      items: [
        {
          icon: Sparkles,
          label: 'Hook Generator',
          href: '/app',
          isActive: location === '/app'
        },
        {
          icon: Radar,
          label: 'Trend Radar',
          href: '/trends',
          isActive: location === '/trends'
        }
      ]
    },
    {
      title: 'Library',
      items: [
        {
          icon: Heart,
          label: 'Favorites',
          href: '/favorites',
          isActive: location === '/favorites'
        },
        {
          icon: History,
          label: 'History',
          href: '/history',
          isActive: location === '/history'
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          href: '/profile',
          isActive: location === '/profile'
        },
        {
          icon: CreditCard,
          label: 'Billing',
          href: '/billing',
          isActive: location === '/billing'
        },
        {
          icon: Settings,
          label: 'Settings',
          href: '/settings',
          isActive: location === '/settings'
        }
      ]
    }
  ]

  const handleNewProject = () => {
    // TODO: Implement project creation modal
    console.log('Create new project')
  }

  const handleProjectAction = (action: string, projectId: string) => {
    // TODO: Implement project actions
    console.log(`${action} project ${projectId}`)
  }

  return (
    <aside className={cn(
      "w-[260px] h-screen bg-white/10 backdrop-blur-md border-r border-white/10 flex flex-col overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link href="/app">
          <motion.div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 border border-primary/30">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">
                Hook Line Studio
              </span>
              <span className="text-xs leading-none text-muted-foreground">
                AI Hook Generator
              </span>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <Badge variant={getCreditVariant()} className="text-xs mt-1">
                {creditsRemaining} credits
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Projects Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {projectsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Projects</span>
              <Badge variant="secondary" className="text-xs">
                {projects.length}
              </Badge>
            </button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewProject}
              className="h-6 w-6 p-0 hover:bg-primary/10"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Projects List */}
          <AnimatePresence>
            {projectsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 mb-6"
              >
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.hookCount} hooks
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
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
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No projects yet</p>
                    <p className="text-xs mt-1">Create your first project to get started</p>
                  </div>
                )}
                
                {/* New Project Button */}
                <button
                  onClick={handleNewProject}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="text-sm">New Project</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Sections */}
          <div className="space-y-6">
            {navigationSections.map((section, index) => (
              <div key={section.title} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.div
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                            item.isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{item.label}</span>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default AppSidebar