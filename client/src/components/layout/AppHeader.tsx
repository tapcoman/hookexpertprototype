import React from 'react'
import { motion } from 'framer-motion'
import { Heart, History, User, Sparkles, Menu } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '../../contexts/SimpleAuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import { Button } from '../ui/Button'
import { Avatar, AvatarFallback } from '../ui/Avatar'

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

  const getCreditColor = () => {
    const status = getCreditStatus()
    switch (status) {
      case 'high': return '#4caf50'
      case 'medium': return '#ff9800'
      case 'low': return '#f44336'
      default: return 'rgb(var(--md-sys-color-on-surface-variant))'
    }
  }

  return (
    <header 
      className="sticky top-0 z-50 border-b"
      style={{ 
        backgroundColor: 'rgb(var(--md-sys-color-surface))',
        borderColor: 'rgb(var(--md-sys-color-outline-variant))'
      }}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/app">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer md-state-layer rounded-lg p-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgb(var(--md-sys-color-primary))' }}
              >
                <Sparkles 
                  className="w-4 h-4" 
                  style={{ color: 'rgb(var(--md-sys-color-on-primary))' }}
                />
              </div>
              <div className="flex flex-col">
                <span 
                  className="md-title-medium font-medium leading-none"
                  style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}
                >
                  Hook Line Studio
                </span>
                <span 
                  className="md-label-small leading-none"
                  style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                >
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
                <span 
                  className="md-body-medium font-medium"
                  style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}
                >
                  {displayName}
                </span>
                
                <div 
                  className="w-px h-4"
                  style={{ backgroundColor: 'rgb(var(--md-sys-color-outline-variant))' }}
                />
                
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCreditColor() }}
                  />
                  <span 
                    className="md-body-medium font-medium"
                    style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}
                  >
                    {creditsRemaining}
                  </span>
                  <span 
                    className="md-body-small"
                    style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                  >
                    credits
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-1">
              <Link href="/favorites">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="md-state-layer w-10 h-10 rounded-full flex items-center justify-center"
                >
                  <Heart 
                    className="w-4 h-4" 
                    style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                  />
                </motion.div>
              </Link>
              
              <Link href="/history">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="md-state-layer w-10 h-10 rounded-full flex items-center justify-center"
                >
                  <History 
                    className="w-4 h-4" 
                    style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                  />
                </motion.div>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="w-10 h-10 rounded-full flex items-center justify-center md-state-layer"
                    style={{ 
                      backgroundColor: 'rgb(var(--md-sys-color-primary))',
                      color: 'rgb(var(--md-sys-color-on-primary))'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="md-label-medium font-bold">
                      {userInitials}
                    </span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div 
                    className="px-3 py-3 border-b"
                    style={{ borderColor: 'rgb(var(--md-sys-color-outline-variant))' }}
                  >
                    <p 
                      className="md-body-medium font-medium"
                      style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}
                    >
                      {displayName}
                    </p>
                    <p 
                      className="md-body-small"
                      style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                    >
                      {creditsRemaining} credits remaining
                    </p>
                  </div>
                  
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer py-3 md-state-layer">
                      <User 
                        className="w-4 h-4 mr-3" 
                        style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                      />
                      <span className="md-body-medium">Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  
                  <Link href="/billing">
                    <DropdownMenuItem className="cursor-pointer py-3 md-state-layer">
                      <div className="w-4 h-4 mr-3 flex items-center justify-center">
                        <span 
                          className="md-label-small font-bold"
                          style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
                        >
                          $
                        </span>
                      </div>
                      <span className="md-body-medium">Billing</span>
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