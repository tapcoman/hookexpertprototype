import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Infinity as InfinityIcon, 
  User, 
  Settings, 
  LogOut, 
  History,
  Heart,
  CreditCard,
  Sparkles,
  Target,
  MessageCircle,
  Info
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'
import Container from './Container'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials, cn } from '../../lib/utils'

interface NavBarProps {
  className?: string
}

// Animated Logo Component
const AnimatedLogo: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 shadow-lg",
        size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
      )}
      whileHover={{ 
        scale: 1.05,
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.5, ease: "easeInOut" }
      }}
    >
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <InfinityIcon className={cn("text-white", size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
      </motion.div>
      
      {/* Flowing glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/40 via-cyan-400/40 to-purple-400/40 blur-md"
        animate={{
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}

const NavBar: React.FC<NavBarProps> = ({ className }) => {
  const [location] = useLocation()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll for backdrop blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Public navigation for non-authenticated users
  const publicNavigation = [
    { name: 'Features', href: '/features', icon: Sparkles },
    { name: 'Pricing', href: '/pricing', icon: Target },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: MessageCircle },
  ]

  // App navigation for authenticated users
  const appNavigation = [
    { name: 'Generate', href: '/app', icon: Sparkles },
    { name: 'History', href: '/history', icon: History },
    { name: 'Favorites', href: '/favorites', icon: Heart },
  ]

  const currentNavigation = user ? appNavigation : publicNavigation

  const handleSignOut = async () => {
    try {
      await signOut()
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const userInitials = user?.displayName 
    ? getInitials(user.displayName)
    : user?.email 
      ? getInitials(user.email)
      : 'U'

  return (
    <motion.nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg" 
          : "bg-transparent",
        className
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Container>
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatedLogo />
              <motion.span 
                className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent"
                whileHover={{ 
                  background: "linear-gradient(to right, #1e40af, #0891b2, #7c3aed)",
                  transition: { duration: 0.3 }
                }}
              >
                Hook Line Studio
              </motion.span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {currentNavigation.map((item) => {
              const isActive = location === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <motion.button
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? 'text-blue-600 bg-blue-50 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </motion.button>
                </Link>
              )
            })}
          </div>

          {/* CTA and User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-lg">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-gray-900">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full p-2 rounded-lg hover:bg-gray-50">
                      <User className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="flex items-center w-full p-2 rounded-lg hover:bg-gray-50">
                      <CreditCard className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center w-full p-2 rounded-lg hover:bg-gray-50">
                      <Settings className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="p-2 rounded-lg hover:bg-red-50 focus:bg-red-50">
                    <LogOut className="mr-3 h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth">
                  <Button variant="ghost" className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button 
                    variant="flow" 
                    flowing
                    className="text-white shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Creating
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden relative z-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 bg-white/95 backdrop-blur-lg lg:hidden z-40"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="px-4 pt-6 pb-4 space-y-2"
              >
                {currentNavigation.map((item, index) => {
                  const isActive = location === item.href
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <Link href={item.href}>
                        <button
                          className={cn(
                            "flex items-center space-x-3 w-full px-4 py-4 rounded-xl text-base font-medium transition-all duration-200",
                            isActive
                              ? 'text-blue-600 bg-blue-50 border border-blue-100'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </button>
                      </Link>
                    </motion.div>
                  )
                })}
                
                {!user && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: currentNavigation.length * 0.1 + 0.2 }}
                    className="pt-4 space-y-3"
                  >
                    <Link href="/auth">
                      <Button 
                        variant="outline" 
                        className="w-full justify-center py-3 text-base"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth">
                      <Button 
                        variant="flow" 
                        flowing
                        className="w-full justify-center py-3 text-base text-white shadow-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Creating
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </motion.nav>
  )
}

export default NavBar