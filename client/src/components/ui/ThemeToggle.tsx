import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { Button } from './Button'

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      // Default to dark theme for the premium cosmic experience
      return localStorage.getItem('theme') !== 'light'
    }
    return true // Default to dark
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden group cosmic-glass rounded-lg border-0 hover:cosmic-glow-purple"
    >
      <motion.div
        className="relative w-5 h-5 flex items-center justify-center"
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-purple-300 cosmic-text-glow" />
        ) : (
          <Sun className="w-5 h-5 text-amber-300" />
        )}
      </motion.div>
      
      {/* Cosmic glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm -z-10" />
    </Button>
  )
}