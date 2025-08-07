import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Play, ArrowRight, Target, Brain, Zap } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'

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
        <motion.h2 
          className="text-3xl font-bold mb-4 text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Ready to Create Viral Hooks?
        </motion.h2>
        
        <motion.p 
          className="text-lg mb-4 text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Generate viral hooks with our AI-powered psychology engine.
        </motion.p>
        
        <motion.p 
          className="text-sm mb-8 text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Choose your platform • Describe your content • Get 10 optimized hooks in seconds
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Button 
            onClick={onGenerateSample}
            className="px-8 py-3"
            size="lg"
            asChild
          >
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Try Sample Hook</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Button>
          
          <Button 
            onClick={onWatchTutorial}
            variant="outline"
            className="px-8 py-3"
            size="lg"
            asChild
          >
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Watch Tutorial</span>
            </motion.button>
          </Button>
        </motion.div>
        
        {/* Feature highlights */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pt-12 border-t"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="text-center pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                Platform Optimized
              </h4>
              <p className="text-sm text-muted-foreground">
                TikTok, Instagram, YouTube
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="text-center pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                Psychology Based
              </h4>
              <p className="text-sm text-muted-foreground">
                Scientifically proven frameworks
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="text-center pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">
                Lightning Fast
              </h4>
              <p className="text-sm text-muted-foreground">
                Results in under 30 seconds
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EmptyState