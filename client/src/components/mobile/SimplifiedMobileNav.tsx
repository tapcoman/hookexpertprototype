import React from 'react'
import { Link, useLocation } from 'wouter'
import { motion } from 'framer-motion'
import { 
  FolderPlus,
  Sparkles, 
  Radar, 
  Heart, 
  User 
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SimplifiedMobileNavProps {
  className?: string
}

const SimplifiedMobileNav: React.FC<SimplifiedMobileNavProps> = ({ className }) => {
  const [location] = useLocation()

  const navItems = [
    {
      href: '/projects',
      icon: FolderPlus,
      label: 'Projects',
      isActive: location === '/projects'
    },
    {
      href: '/app',
      icon: Sparkles,
      label: 'Generate',
      isActive: location === '/app',
      isPrimary: true
    },
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
      href: '/profile',
      icon: User,
      label: 'Profile',
      isActive: location === '/profile'
    }
  ]

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden",
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className="relative">
                <motion.button
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors min-w-0",
                    item.isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground",
                    item.isPrimary && "bg-primary/10 text-primary"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent className={cn(
                    "w-5 h-5",
                    item.isPrimary && "w-6 h-6"
                  )} />
                  <span className="text-xs font-medium leading-none">
                    {item.label}
                  </span>
                </motion.button>

                {/* Active Indicator */}
                {item.isActive && (
                  <motion.div
                    layoutId="mobileNavActiveIndicator"
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

export default SimplifiedMobileNav