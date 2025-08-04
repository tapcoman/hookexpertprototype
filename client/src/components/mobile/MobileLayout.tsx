import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
// import { useUserData } from '../../hooks/useQueries'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'
import { cn } from '../../lib/utils'

interface MobileLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showBottomNav?: boolean
  headerTitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
  className?: string
  contentClassName?: string
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showHeader = true,
  showBottomNav = true,
  headerTitle,
  showBackButton = false,
  onBackClick,
  className,
  contentClassName
}) => {
  const { user } = useAuth()
  const [location] = useLocation()
  // const _userData = useUserData()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // PWA install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const result = await installPrompt.userChoice
      if (result.outcome === 'accepted') {
        setInstallPrompt(null)
      }
    }
  }

  // Calculate available credits
  const creditsRemaining = user ? (user.freeCredits - user.usedCredits) : 0

  // Determine if we should show navigation
  const isPublicRoute = ['/', '/auth', '/pricing'].includes(location)
  const shouldShowNav = !isPublicRoute && user

  // Auto-hide header on scroll (for better mobile experience)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold
        setHeaderVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setHeaderVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground",
      "safe-area-padding touch-optimized",
      className
    )}>
      {/* Offline Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground text-center py-2 text-sm font-medium"
          >
            You're offline. Some features may not work.
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {installPrompt && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-40 bg-primary text-primary-foreground p-3 safe-area-padding-top"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Install Hook Line Studio</p>
                <p className="text-xs opacity-90">Get quick access from your home screen</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setInstallPrompt(null)}
                  className="text-xs px-3 py-1 rounded bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleInstallApp}
                  className="text-xs px-3 py-1 rounded bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition-colors"
                >
                  Install
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      {showHeader && shouldShowNav && (
        <motion.div
          initial={false}
          animate={{ 
            y: headerVisible ? 0 : -80,
            opacity: headerVisible ? 1 : 0 
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <MobileHeader
            title={headerTitle}
            showBackButton={showBackButton}
            onBackClick={onBackClick}
            creditsRemaining={creditsRemaining}
          />
        </motion.div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1",
        showHeader && shouldShowNav && "pt-14",
        showBottomNav && shouldShowNav && "pb-20",
        "ios-vh-fix",
        contentClassName
      )}>
        <div className="scroll-smooth-mobile">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && shouldShowNav && (
        <MobileBottomNav creditsRemaining={creditsRemaining} />
      )}

      {/* Mobile-specific scroll to top button */}
      <AnimatePresence>
        {lastScrollY > 500 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-4 z-30 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center touch-target"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileLayout