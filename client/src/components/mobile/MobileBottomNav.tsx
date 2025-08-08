import React from 'react'
import { Link, useLocation } from 'wouter'
import { motion } from 'framer-motion'
import { 
  History, 
  Heart, 
  User,
  Plus,
  Radar
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'

interface MobileBottomNavProps {
  creditsRemaining?: number
  className?: string
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  creditsRemaining,
  className
}) => {
  const [location] = useLocation()

  const navItems = [
    {
      href: '/trends',
      icon: Radar,
      label: 'Trends',
      isActive: location === '/trends'
    },
    {
      href: '/favorites',
      icon: Heart,
      label: 'Favorites',
      isActive: location === '/favorites'
    },
    {
      href: '/app',
      icon: Plus,
      label: 'Generate',
      isActive: location === '/app',
      isPrimary: true
    },
    {
      href: '/history',
      icon: History,
      label: 'History',
      isActive: location === '/history'
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      isActive: location === '/profile'
    }
  ]

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border",
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className="relative">
                <Button
                  variant={item.isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0",
                    item.isPrimary && !item.isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                    item.isPrimary && item.isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <IconComponent className={cn(
                    "w-5 h-5",
                    item.isPrimary && "w-6 h-6"
                  )} />
                  <span className="text-xs font-medium leading-none">
                    {item.label}
                  </span>
                </Button>

                {/* Credits Badge */}
                {item.isPrimary && creditsRemaining !== undefined && (
                  <Badge 
                    variant={creditsRemaining > 0 ? "default" : "destructive"}
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {creditsRemaining > 99 ? '99+' : creditsRemaining}
                  </Badge>
                )}

                {/* Active Indicator */}
                {item.isActive && (
                  <motion.div
                    layoutId="bottomNavActiveIndicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}

export default MobileBottomNav