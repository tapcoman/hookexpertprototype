import React from 'react'
import { motion } from 'framer-motion'
import { Heart, History, User } from 'lucide-react'
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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/app">
          <motion.div 
            className="flex items-center space-x-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Hook Line Studio
            </span>
          </motion.div>
        </Link>

        {/* Right side - User info and navigation */}
        <div className="flex items-center space-x-4">
          {/* User info */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium text-gray-700">{displayName}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{creditsRemaining} credits</span>
          </div>

          {/* Navigation icons */}
          <div className="flex items-center space-x-2">
            <Link href="/favorites">
              <Button variant="ghost" size="sm" className="p-2">
                <Heart className="w-4 h-4" />
              </Button>
            </Link>
            
            <Link href="/history">
              <Button variant="ghost" size="sm" className="p-2">
                <History className="w-4 h-4" />
              </Button>
            </Link>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/billing">
                  <DropdownMenuItem className="cursor-pointer">
                    <span className="w-4 h-4 mr-2 flex items-center justify-center text-xs">$</span>
                    Billing
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader