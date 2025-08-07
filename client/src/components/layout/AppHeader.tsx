import React from 'react'
import { motion } from 'framer-motion'
import { Heart, History, User, Sparkles, Menu } from 'lucide-react'
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
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/Badge'

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
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/app">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none text-foreground">
                  Hook Line Studio
                </span>
                <span className="text-xs leading-none text-muted-foreground">
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
                <span className="text-sm font-medium text-foreground">
                  {displayName}
                </span>
                
                <div className="w-px h-4 bg-border" />
                
                <Badge variant={getCreditVariant()} className="text-xs">
                  {creditsRemaining} credits
                </Badge>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-2">
              <Link href="/favorites">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart className="w-4 h-4" />
                  </motion.button>
                </Button>
              </Link>
              
              <Link href="/history">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <History className="w-4 h-4" />
                  </motion.button>
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium text-foreground">
                      {displayName}
                    </p>
                    <Badge variant={getCreditVariant()} className="self-start text-xs">
                      {creditsRemaining} credits
                    </Badge>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  
                  <Link href="/billing">
                    <DropdownMenuItem className="cursor-pointer">
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