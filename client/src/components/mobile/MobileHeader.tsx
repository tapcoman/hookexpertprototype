import React, { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Zap, 
  User, 
  Settings, 
  LogOut,
  Sparkles,
  Crown
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface MobileHeaderProps {
  title?: string
  showMenuButton?: boolean
  showBackButton?: boolean
  onBackClick?: () => void
  creditsRemaining?: number
  className?: string
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = 'Hook Line Studio',
  showMenuButton = true,
  showBackButton = false,
  onBackClick,
  creditsRemaining,
  className
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const [location] = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const menuItems = [
    {
      href: '/app',
      label: 'Generate Hooks',
      icon: Sparkles,
      description: 'Create viral content',
      isActive: location === '/app'
    },
    {
      href: '/favorites',
      label: 'Favorites',
      icon: Crown,
      description: 'Your saved hooks',
      isActive: location === '/favorites'
    },
    {
      href: '/history',
      label: 'History',
      icon: Zap,
      description: 'Past generations',
      isActive: location === '/history'
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      description: 'Account settings',
      isActive: location === '/profile'
    },
    {
      href: '/billing',
      label: 'Billing',
      icon: Settings,
      description: 'Manage subscription',
      isActive: location === '/billing'
    }
  ]

  return (
    <>
      {/* Main Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-padding-top",
        className
      )}>
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackClick}
                className="p-2 touch-target"
              >
                <X className="w-5 h-5" />
              </Button>
            ) : showMenuButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="p-2 touch-target"
              >
                <Menu className="w-5 h-5" />
              </Button>
            ) : null}
            
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground leading-none">
                {title}
              </h1>
              {user && (
                <span className="text-xs text-muted-foreground">
                  Welcome back, {user.firstName}
                </span>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Credits Badge */}
            {creditsRemaining !== undefined && (
              <Badge 
                variant={creditsRemaining > 0 ? "default" : "destructive"}
                className="text-xs font-medium"
              >
                <Zap className="w-3 h-3 mr-1" />
                {creditsRemaining > 99 ? '99+' : creditsRemaining}
              </Badge>
            )}

            {/* User Avatar */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="p-1 rounded-full touch-target"
              >
                <Avatar className="w-8 h-8">
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center rounded-full">
                    <span className="text-sm font-medium text-primary">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                </Avatar>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          >
            {/* Menu Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border shadow-xl safe-area-padding"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    {user && (
                      <Avatar className="w-10 h-10">
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center rounded-full">
                          <span className="text-lg font-medium text-primary">
                            {user.firstName?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                      </Avatar>
                    )}
                    <div>
                      <h2 className="font-semibold text-foreground">
                        {user?.firstName || 'User'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                      {user?.subscriptionStatus === 'active' && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          <Crown className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 touch-target"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Credits Display */}
                {user && (
                  <div className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Available Credits</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {user.freeCredits - user.usedCredits}
                        </span>
                      </div>
                    </div>
                    {user.subscriptionStatus === 'active' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        + Unlimited pro credits
                      </p>
                    )}
                  </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 py-2">
                  {menuItems.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors touch-target",
                            item.isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-foreground hover:bg-muted/50 active:bg-muted"
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <IconComponent className="w-5 h-5" />
                          <div className="flex-1">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                          {item.isActive && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </nav>

                {/* Footer */}
                <div className="border-t border-border p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MobileHeader