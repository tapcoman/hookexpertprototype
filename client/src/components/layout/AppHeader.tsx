import React from 'react'
import { motion } from 'framer-motion'
import { Heart, History, User, Sparkles } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '../../contexts/SimpleAuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/Button'
import { Avatar, AvatarFallback } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { ThemeToggle } from '../ui/ThemeToggle'

const AppHeader: React.FC = () => {
  const { user } = useAuth()

  const creditsRemaining = user ? (user.freeCredits - user.usedCredits) : 0
  const displayName = user?.firstName || user?.displayName || 'User'
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()

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

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md bg-background/80 dark:bg-surface-primary/80 dark:border-border-subtle">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/app">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 dark:hover:bg-surface-tertiary rounded-lg p-2 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-electric/20 dark:bg-accent-electric/15 border border-accent-electric/30">
                <Sparkles className="w-4 h-4 text-accent-electric dark:text-accent-electric" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none text-text-primary dark:text-text-primary">
                  Hook Line Studio
                </span>
                <span className="text-xs leading-none text-text-secondary dark:text-text-secondary">
                  AI Hook Generator
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {/* Credits Display */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-text-primary dark:text-text-primary">
                  {displayName}
                </span>
                
                <div className="w-px h-4 bg-border-subtle dark:bg-border-subtle" />
                
                <Badge variant={getCreditVariant()} className="text-xs bg-surface-secondary/50 text-text-secondary border-border-subtle hover:bg-surface-tertiary/50">
                  {creditsRemaining} credits
                </Badge>
              </div>
            </div>

            {/* Theme Toggle and Navigation Icons */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link href="/favorites">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative hover:bg-surface-secondary dark:hover:bg-surface-tertiary text-text-secondary hover:text-text-primary"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className="w-4 h-4" />
                  </motion.button>
                </Button>
              </Link>
              
              <Link href="/history">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative hover:bg-surface-secondary dark:hover:bg-surface-tertiary text-text-secondary hover:text-text-primary"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <History className="w-4 h-4" />
                  </motion.button>
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-surface-secondary dark:hover:bg-surface-tertiary">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-accent-electric/20 text-accent-electric text-sm font-semibold border border-accent-electric/30">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-surface-secondary/95 backdrop-blur-md border-border-subtle">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium text-text-primary">
                      {displayName}
                    </p>
                    <Badge variant={getCreditVariant()} className="self-start text-xs bg-surface-tertiary text-text-secondary border-border-subtle">
                      {creditsRemaining} credits
                    </Badge>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer text-text-secondary hover:text-text-primary hover:bg-surface-tertiary">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  
                  <Link href="/billing">
                    <DropdownMenuItem className="cursor-pointer text-text-secondary hover:text-text-primary hover:bg-surface-tertiary">
                      <div className="w-4 h-4 mr-2 flex items-center justify-center">
                        <span className="text-xs font-bold">$</span>
                      </div>
                      Billing
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader