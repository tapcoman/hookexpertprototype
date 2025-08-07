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
        {/* Swiss-minimal icon */}
        <motion.div 
          className="w-20 h-20 mx-auto mb-8 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-full h-full bg-gray-900 rounded-3xl flex items-center justify-center relative overflow-hidden">
            <Sparkles className="w-10 h-10 text-white z-10" />
            
            {/* Subtle Swiss pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>

        {/* Swiss typography hierarchy */}
        <motion.h2 
          className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4 tracking-tight leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Ready to Create?
        </motion.h2>
        
        {/* Swiss-inspired subtitle */}
        <motion.p 
          className="text-lg text-gray-600 mb-4 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Generate viral hooks with our AI-powered psychology engine.
        </motion.p>
        
        <motion.p 
          className="text-sm text-gray-500 mb-12 font-medium tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Choose your platform • Describe your content • Get 10 optimized hooks in seconds
        </motion.p>

        {/* Swiss-minimal action buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <motion.button 
            onClick={onGenerateSample}
            className="group flex items-center space-x-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold transition-all duration-300 hover:bg-black hover:scale-[1.02] hover:-translate-y-1 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5" />
            <span>Try Sample Hook</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </motion.button>
          
          <motion.button 
            onClick={onWatchTutorial}
            className="group flex items-center space-x-3 px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold transition-all duration-300 hover:bg-gray-200 hover:scale-[1.02] hover:-translate-y-1 border border-gray-200"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-5 h-5" />
            <span>Watch Tutorial</span>
          </motion.button>
        </motion.div>
        
        {/* Swiss-minimal feature highlights */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-16 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-blue-500 rounded-lg" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1 tracking-wide uppercase">
              Platform Optimized
            </h4>
            <p className="text-sm text-gray-600">
              TikTok, Instagram, YouTube
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-emerald-500 rounded-lg" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1 tracking-wide uppercase">
              Psychology Based
            </h4>
            <p className="text-sm text-gray-600">
              Scientifically proven frameworks
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-amber-500 rounded-lg" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1 tracking-wide uppercase">
              30 Second Results
            </h4>
            <p className="text-sm text-gray-600">
              Lightning fast generation
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EmptyState