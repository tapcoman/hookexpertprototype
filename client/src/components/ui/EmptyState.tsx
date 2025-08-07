import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Play, ArrowRight } from 'lucide-react'

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
        {/* Material Design Icon */}
        <motion.div 
          className="w-24 h-24 mx-auto mb-8 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div 
            className="w-full h-full rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: 'rgb(var(--md-sys-color-primary-container))' }}
          >
            <Sparkles 
              className="w-12 h-12 z-10" 
              style={{ color: 'rgb(var(--md-sys-color-on-primary-container))' }}
            />
            
            {/* Subtle gradient overlay */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{ backgroundColor: 'rgb(var(--md-sys-color-primary))' }}
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
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

        {/* Material Design Typography */}
        <motion.h2 
          className="md-headline-large mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Ready to Create?
        </motion.h2>
        
        <motion.p 
          className="md-body-large mb-4"
          style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Generate viral hooks with our AI-powered psychology engine.
        </motion.p>
        
        <motion.p 
          className="md-body-medium mb-12"
          style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Choose your platform • Describe your content • Get 10 optimized hooks in seconds
        </motion.p>

        {/* Material Design Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <motion.button 
            onClick={onGenerateSample}
            className="md-filled-button flex items-center space-x-3 px-8 py-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5" />
            <span>Try Sample Hook</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          
          <motion.button 
            onClick={onWatchTutorial}
            className="md-outlined-button flex items-center space-x-3 px-8 py-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-5 h-5" />
            <span>Watch Tutorial</span>
          </motion.button>
        </motion.div>
        
        {/* Feature highlights with Material Design */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-16"
          style={{ borderTop: '1px solid rgb(var(--md-sys-color-outline-variant))' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'rgb(var(--md-sys-color-secondary-container))' }}
            >
              <div 
                className="w-6 h-6 rounded-lg" 
                style={{ backgroundColor: 'rgb(var(--md-sys-color-on-secondary-container))' }}
              />
            </div>
            <h4 
              className="md-title-small mb-1"
              style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}
            >
              Platform Optimized
            </h4>
            <p 
              className="md-body-small"
              style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
            >
              TikTok, Instagram, YouTube
            </p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'rgb(var(--md-sys-color-secondary-container))' }}
            >
              <div 
                className="w-6 h-6 rounded-lg" 
                style={{ backgroundColor: 'rgb(var(--md-sys-color-on-secondary-container))' }}
              />
            </div>
            <h4 
              className="md-title-small mb-1"
              style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}
            >
              Psychology Based
            </h4>
            <p 
              className="md-body-small"
              style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
            >
              Scientifically proven frameworks
            </p>
          </div>
          
          <div className="text-center">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'rgb(var(--md-sys-color-secondary-container))' }}
            >
              <div 
                className="w-6 h-6 rounded-lg" 
                style={{ backgroundColor: 'rgb(var(--md-sys-color-on-secondary-container))' }}
              />
            </div>
            <h4 
              className="md-title-small mb-1"
              style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}
            >
              30 Second Results
            </h4>
            <p 
              className="md-body-small"
              style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}
            >
              Lightning fast generation
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EmptyState