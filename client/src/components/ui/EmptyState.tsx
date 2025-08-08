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
    <div className="flex items-center justify-center py-20 lg:py-32">
      <motion.div 
        className="text-center max-w-4xl mx-auto px-8"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Premium Icon */}
        <motion.div 
          className="w-32 h-32 mx-auto mb-12 relative"
          initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-full h-full rounded-3xl flex items-center justify-center bg-gradient-to-br from-accent-electric/20 via-success-green/10 to-accent-electric/20 relative overflow-hidden backdrop-blur-sm border border-accent-electric/30 shadow-2xl">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
              className="absolute inset-2 rounded-2xl bg-gradient-to-br from-accent-electric/10 to-success-green/10"
            />
            
            <motion.div
              className="relative z-20"
              animate={{ 
                scale: [1, 1.1, 1],
                rotateZ: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <Sparkles className="w-16 h-16 text-accent-electric drop-shadow-lg" />
            </motion.div>
            
            {/* Premium gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.05, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            
            {/* Floating particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-accent-electric/60 rounded-full"
                style={{
                  top: `${20 + i * 20}%`,
                  left: `${15 + i * 25}%`
                }}
                animate={{
                  y: [-10, -20, -10],
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 3 + i,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Premium Typography */}
        <motion.div
          className="space-y-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-electric/10 to-success-green/10 border border-accent-electric/20">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-accent-electric" />
            </motion.div>
            <span className="font-semibold text-accent-electric text-lg">AI-Powered Hook Generation</span>
          </div>
          
          <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-text-primary via-accent-electric to-success-green bg-clip-text text-transparent tracking-tight leading-tight">
            Ready to Go Viral?
          </h1>
          
          <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Create compelling, platform-optimized hooks using advanced AI and proven psychological frameworks. 
            Transform your content ideas into viral sensations that capture attention and drive engagement.
          </p>
        </motion.div>

        {/* Premium Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
        >
          <Button 
            onClick={onGenerateSample}
            className="w-full sm:w-auto px-10 py-4 h-auto text-lg font-bold rounded-2xl professional-gradient-animated text-surface-primary shadow-2xl border-0"
            asChild
          >
            <motion.button 
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
              }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center space-x-3 relative overflow-hidden group"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <span>Try Sample Hook</span>
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              />
            </motion.button>
          </Button>
          
          <Button 
            onClick={onWatchTutorial}
            variant="ghost"
            className="w-full sm:w-auto px-8 py-4 h-auto text-base font-semibold rounded-2xl border-2 border-accent-electric/30 bg-surface-secondary/50 backdrop-blur-sm hover:bg-surface-tertiary/80 hover:border-accent-electric/60 text-text-primary hover:text-text-primary transition-all duration-300"
            asChild
          >
            <motion.button 
              whileHover={{ 
                scale: 1.03, 
                y: -2,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
              }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center space-x-3 group"
            >
              <motion.div
                className="group-hover:scale-110 transition-transform duration-200"
              >
                <Play className="w-5 h-5" />
              </motion.div>
              <span>Watch Tutorial</span>
            </motion.button>
          </Button>
        </motion.div>
        
        {/* Feature highlights */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          {[
            {
              icon: <Sparkles className="w-8 h-8 text-accent-electric" />,
              title: 'AI-Powered',
              description: 'Advanced algorithms analyze viral patterns'
            },
            {
              icon: <span className="text-3xl">🧠</span>,
              title: 'Psychology-Based',
              description: 'Built on proven engagement frameworks'
            },
            {
              icon: <span className="text-3xl">🎯</span>,
              title: 'Platform-Optimized',
              description: 'Tailored for TikTok, Instagram, and YouTube'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="text-center p-6 rounded-2xl bg-surface-secondary/30 backdrop-blur-sm border border-border-subtle hover:border-accent-electric/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EmptyState