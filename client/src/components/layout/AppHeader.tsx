import React from 'react'
import { motion } from 'framer-motion'
import { Heart, History, User, Sparkles } from 'lucide-react'
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

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Swiss-minimal logo */}
          <Link href="/app">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center"
                whileHover={{ rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg font-display font-bold text-gray-900 tracking-tight leading-none">
                  Hook Line Studio
                </span>
                <span className="text-xs text-gray-500 font-medium tracking-widest uppercase">
                  AI Hook Generator
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Swiss-minimal navigation */}
          <div className="flex items-center space-x-6">
            {/* Credits display - Swiss typography */}
            <motion.div 
              className="hidden sm:flex items-center space-x-4 text-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="font-medium text-gray-900">{displayName}</span>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  creditsRemaining > 10 ? 'bg-emerald-500' : 
                  creditsRemaining > 5 ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="font-semibold text-gray-900">{creditsRemaining}</span>
                <span className="text-gray-600">credits</span>
              </div>
            </motion.div>

            {/* Navigation icons with Swiss precision */}
            <div className="flex items-center space-x-1">
              <Link href="/favorites">
                <motion.div
                  whileHover={{ scale: 1.1, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Heart className="w-4 h-4 text-gray-600" />
                  </Button>
                </motion.div>
              </Link>
              
              <Link href="/history">
                <motion.div
                  whileHover={{ scale: 1.1, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <History className="w-4 h-4 text-gray-600" />
                  </Button>
                </motion.div>
              </Link>

              {/* Swiss-minimal user menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center hover:bg-black transition-colors duration-200"
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-white font-bold text-sm tracking-wide">
                      {userInitials}
                    </span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{creditsRemaining} credits remaining</p>
                  </div>
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer py-3">
                      <User className="w-4 h-4 mr-3 text-gray-500" />
                      <span className="font-medium">Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/billing">
                    <DropdownMenuItem className="cursor-pointer py-3">
                      <div className="w-4 h-4 mr-3 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">$</span>
                      </div>
                      <span className="font-medium">Billing</span>
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