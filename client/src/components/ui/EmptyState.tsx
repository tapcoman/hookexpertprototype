import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Play } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  onGenerateSample?: () => void
  onWatchTutorial?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onGenerateSample,
  onWatchTutorial
}) => {
  return (
    <div className="flex items-center justify-center py-16 lg:py-24">
      <motion.div 
        className="text-center max-w-2xl mx-auto px-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Icon */}
        <motion.div 
          className="w-20 h-20 mx-auto mb-8 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-full h-full rounded-2xl flex items-center justify-center bg-primary/10 relative overflow-hidden">
            <Sparkles className="w-10 h-10 text-primary z-10" />
            
            {/* Subtle gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-primary/5"
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>

        {/* Typography */}
        <motion.h1 
          className="text-4xl font-semibold mb-6 text-foreground tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          What would you like to create?
        </motion.h1>
        
        <motion.p 
          className="text-base mb-12 text-muted-foreground max-w-lg mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Generate viral hooks powered by AI and psychological frameworks. Perfect for TikTok, Instagram, and YouTube.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col gap-3 justify-center items-center max-w-xs mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Button 
            onClick={onGenerateSample}
            className="w-full h-12 text-base font-medium cosmic-button"
            asChild
          >
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Try Sample Hook</span>
            </motion.button>
          </Button>
          
          <Button 
            onClick={onWatchTutorial}
            variant="ghost"
            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
            asChild
          >
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Watch Tutorial</span>
            </motion.button>
          </Button>
        </motion.div>
        
      </motion.div>
    </div>
  )
}

export default EmptyState