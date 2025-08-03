import React from 'react'
import { Link, useLocation } from 'wouter'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Sparkles, 
  History, 
  Heart, 
  User, 
  Settings, 
  CreditCard,
  HelpCircle,
  LogOut,
  Crown,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'
import { Progress } from '../ui/Progress'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  creditsRemaining?: number
  className?: string
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  creditsRemaining = 0,
  className
}) => {
  const { user, signOut } = useAuth()
  const [location] = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      onClose()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navigationItems = [
    {
      href: '/app',
      label: 'Generate Hooks',
      icon: Sparkles,
      description: 'Create new viral content',
      isActive: location === '/app',
      isPrimary: true
    },
    {
      href: '/history',
      label: 'History',
      icon: History,
      description: 'View past generations',
      isActive: location === '/history'
    },
    {
      href: '/favorites',
      label: 'Favorites',
      icon: Heart,
      description: 'Your saved hooks',
      isActive: location === '/favorites'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance insights',
      isActive: location === '/analytics',
      isPro: true
    }
  ]

  const accountItems = [
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
      icon: CreditCard,
      description: 'Manage subscription',
      isActive: location === '/billing'
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'App preferences',
      isActive: location === '/settings'
    },
    {
      href: '/help',
      label: 'Help & Support',
      icon: HelpCircle,
      description: 'Get assistance',
      isActive: location === '/help'
    }
  ]

  const usagePercentage = user ? ((user.usedCredits / user.freeCredits) * 100) : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border shadow-xl safe-area-padding overflow-y-auto scroll-smooth-mobile",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Hook Line Studio</h2>
                    <p className="text-xs text-muted-foreground">AI Hook Generator</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 touch-target"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User Profile */}
              {user && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center rounded-full">
                        <span className="text-lg font-medium text-primary">
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </span>
                      </div>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {user.firstName || 'User'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {user.subscriptionStatus === 'active' ? (
                          <Badge variant="default" className="text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro Member
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Free Plan
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Credits Usage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Credits</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {creditsRemaining}
                          {user.subscriptionStatus === 'active' && (
                            <span className="text-xs text-muted-foreground ml-1">
                              + ∞
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {user.subscriptionStatus !== 'active' && (
                      <div className="space-y-2">
                        <Progress 
                          value={Math.max(0, 100 - usagePercentage)} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{user.usedCredits} used</span>
                          <span>{user.freeCredits} total</span>
                        </div>
                        {creditsRemaining <= 5 && creditsRemaining > 0 && (
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                              You're running low on credits
                            </p>
                          </div>
                        )}
                        {creditsRemaining === 0 && (
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-800 dark:text-red-200">
                              No credits remaining
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upgrade CTA */}
                  {user.subscriptionStatus !== 'active' && (
                    <Link href="/billing">
                      <div
                        className="mt-3 p-3 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20 cursor-pointer hover:from-primary/20 hover:to-purple-500/20 transition-all"
                        onClick={onClose}
                      >
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            Upgrade to Pro
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlimited hooks + premium features
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              {/* Navigation */}
              <nav className="flex-1 py-2">
                {/* Main Navigation */}
                <div className="px-2 mb-6">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    Create
                  </h4>
                  {navigationItems.map((item) => {
                    const IconComponent = item.icon
                    const canAccess = !item.isPro || user?.subscriptionStatus === 'active'
                    
                    return (
                      <Link key={item.href} href={canAccess ? item.href : '/billing'}>
                        <motion.div
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 mx-1 rounded-lg transition-all cursor-pointer touch-target",
                            item.isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-foreground hover:bg-muted/50 active:bg-muted",
                            !canAccess && "opacity-60"
                          )}
                          onClick={onClose}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            item.isActive 
                              ? "bg-primary/20" 
                              : "bg-muted/50"
                          )}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.label}</span>
                              {item.isPrimary && (
                                <Badge variant="default" className="text-xs px-1.5 py-0.5">
                                  New
                                </Badge>
                              )}
                              {item.isPro && (
                                <Crown className="w-3 h-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                          
                          {item.isActive && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>

                {/* Account Section */}
                <div className="px-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    Account
                  </h4>
                  {accountItems.map((item) => {
                    const IconComponent = item.icon
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.div
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 mx-1 rounded-lg transition-all cursor-pointer touch-target",
                            item.isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-foreground hover:bg-muted/50 active:bg-muted"
                          )}
                          onClick={onClose}
                          whileTap={{ scale: 0.98 }}
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
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="border-t border-border p-4 space-y-3">
                {/* Quick Stats */}
                {user && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>This month</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {user.usedCredits} hooks created
                    </span>
                  </div>
                )}

                {/* Sign Out */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </Button>

                {/* App Version */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Hook Line Studio v1.0.0
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MobileSidebar