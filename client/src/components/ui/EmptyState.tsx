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
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div 
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Icon */}
        <motion.div 
          className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Sparkles className="w-8 h-8 text-gray-400" />
        </motion.div>

        {/* Main text */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No hooks yet—try your first idea.
        </h3>
        
        {/* Subtext */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Choose your platform, describe your video idea, and get 10 platform-ready hooks in 30 seconds.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={onGenerateSample}
            className="flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Sample Hooks
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onWatchTutorial}
            className="flex items-center justify-center text-blue-600 hover:text-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Tutorial
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default EmptyState