import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles,
  TrendingUp,
  History,
  Heart,
  CreditCard,
  User,
  Menu,
  X,
  Home,
  BarChart3
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/SimpleAuthContext'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const FloatingNav: React.FC = () => {
  const [location] = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems: NavItem[] = [
    {
      href: '/app',
      label: 'Generate',
      icon: Sparkles,
      description: 'Create hooks'
    },
    {
      href: '/trends',
      label: 'Trends',
      icon: TrendingUp,
      description: 'Viral insights'
    },
    {
      href: '/history',
      label: 'History',
      icon: History,
      description: 'Past hooks'
    },
    {
      href: '/favorites',
      label: 'Saved',
      icon: Heart,
      description: 'Favorites'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance'
    },
    {
      href: '/billing',
      label: 'Billing',
      icon: CreditCard,
      description: 'Subscription'
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      description: 'Settings'
    }
  ]

  const activeItem = navItems.find(item => location === item.href)

  return (
    <>
      {/* Desktop Floating Pill */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50",
          "px-2 py-2 rounded-full",
          "bg-white/80 dark:bg-gray-900/80",
          "backdrop-blur-xl backdrop-saturate-150",
          "border border-white/20 dark:border-white/10",
          "shadow-lg shadow-black/5 dark:shadow-black/20",
          scrolled && "shadow-xl shadow-black/10 dark:shadow-black/30"
        )}
      >
        <div className="flex items-center gap-1">
          {/* Logo/Home */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">HL</span>
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                Hook Line Expert
              </span>
            </motion.div>
          </Link>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-700/50 mx-1" />

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const IconComponent = item.icon
              const isActive = location === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative px-4 py-2 rounded-full transition-all duration-200",
                      "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                      isActive && "bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn(
                        "w-4 h-4 transition-colors",
                        isActive 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-600 dark:text-gray-400"
                      )} />
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        isActive 
                          ? "text-gray-900 dark:text-white" 
                          : "text-gray-700 dark:text-gray-300"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* User Avatar */}
          {user && (
            <>
              <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-700/50 mx-1" />
              <Link href="/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center ml-2"
                >
                  <span className="text-xs font-bold text-white">
                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                  </span>
                </motion.div>
              </Link>
            </>
          )}
        </div>
      </motion.nav>

      {/* Mobile Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "md:hidden fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-tr from-blue-500 to-purple-600",
          "shadow-lg shadow-purple-500/25",
          "flex items-center justify-center",
          "text-white"
        )}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeItem ? (
                <activeItem.icon className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Expanded Menu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "md:hidden fixed bottom-24 right-6 z-40",
              "bg-white/95 dark:bg-gray-900/95",
              "backdrop-blur-xl backdrop-saturate-150",
              "rounded-2xl p-2",
              "border border-white/20 dark:border-white/10",
              "shadow-xl shadow-black/10 dark:shadow-black/30",
              "min-w-[200px]"
            )}
          >
            {navItems.map((item, index) => {
              const IconComponent = item.icon
              const isActive = location === item.href
              
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={item.href}>
                    <div
                      onClick={() => setIsExpanded(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl",
                        "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                        "transition-all duration-200",
                        isActive && "bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"
                      )}
                    >
                      <IconComponent className={cn(
                        "w-5 h-5",
                        isActive 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-600 dark:text-gray-400"
                      )} />
                      <div className="flex-1">
                        <div className={cn(
                          "text-sm font-medium",
                          isActive 
                            ? "text-gray-900 dark:text-white" 
                            : "text-gray-700 dark:text-gray-300"
                        )}>
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {item.description}
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingNav