import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ==================== TYPES ====================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

// ==================== COMPONENT ====================

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <motion.div
        className={cn(
          'border-2 border-current border-t-transparent rounded-full',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {text && (
        <motion.p
          className={cn('text-muted-foreground', textSizeClasses[size])}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// ==================== FULL PAGE LOADING ====================

interface FullPageLoadingProps {
  text?: string
  description?: string
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  text = 'Loading...',
  description,
}) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold">{text}</h2>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ==================== INLINE LOADING ====================

interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md'
  className?: string
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = 'Loading...',
  size = 'sm',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        className={cn(
          'border-2 border-current border-t-transparent rounded-full',
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <span className={cn(size === 'sm' ? 'text-sm' : 'text-base')}>
        {text}
      </span>
    </div>
  )
}

// ==================== HOOK GENERATION LOADING ====================

export const HookGenerationLoading: React.FC = () => {
  const steps = [
    {
      title: 'Analyzing Your Content',
      description: 'Understanding your topic and angle',
      icon: '🔍',
      color: 'from-accent-electric to-accent-teal'
    },
    {
      title: 'Applying Psychology',
      description: 'Using proven engagement frameworks',
      icon: '🧠',
      color: 'from-accent-teal to-success-green'
    },
    {
      title: 'Crafting Hooks',
      description: 'Creating compelling opening lines',
      icon: '✨',
      color: 'from-success-green to-premium-gold'
    },
    {
      title: 'Platform Optimization',
      description: 'Tailoring for maximum engagement',
      icon: '🎯',
      color: 'from-premium-gold to-accent-electric'
    },
  ]

  const [currentStep, setCurrentStep] = React.useState(0)
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2500)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + (100 / (steps.length * 25)) // Smooth progress over step duration
      })
    }, 100)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-12 max-w-2xl mx-auto">
      {/* Premium Loading Animation */}
      <motion.div
        className="relative w-32 h-32 mb-12"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-accent-electric/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-success-green/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
        />
        
        {/* Inner ring */}
        <motion.div
          className="absolute inset-4 rounded-full border-4 border-premium-gold/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-6xl"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
          >
            {steps[currentStep].icon}
          </motion.div>
        </div>
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-accent-electric to-success-green rounded-full"
            style={{
              top: `${20 + Math.sin((i * Math.PI) / 3) * 40}%`,
              left: `${50 + Math.cos((i * Math.PI) / 3) * 40}%`
            }}
            animate={{
              scale: [0.5, 1.2, 0.5],
              opacity: [0.3, 1, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3 + i * 0.2,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </motion.div>

      {/* Step Information */}
      <motion.div
        className="text-center space-y-6"
        key={currentStep}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="space-y-3">
          <h3 className="text-3xl font-bold text-text-primary">
            {steps[currentStep].title}
          </h3>
          <p className="text-lg text-text-secondary max-w-md mx-auto leading-relaxed">
            {steps[currentStep].description}
          </p>
        </div>
        
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface-secondary/50 backdrop-blur-sm border border-border-subtle">
          <motion.div
            className="w-2 h-2 bg-accent-electric rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
          />
          <span className="text-sm font-medium text-text-secondary">
            Usually takes 15-45 seconds
          </span>
        </div>
      </motion.div>
      
      {/* Enhanced Progress Bar */}
      <div className="w-full max-w-md mt-10 space-y-4">
        <div className="flex justify-between text-sm text-text-secondary">
          <span>Progress</span>
          <span>{Math.round((currentStep / (steps.length - 1)) * 100)}%</span>
        </div>
        
        <div className="relative h-3 bg-surface-tertiary rounded-full overflow-hidden border border-border-subtle">
          <motion.div
            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${steps[currentStep].color} rounded-full`}
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
            />
          </motion.div>
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center gap-2"
              animate={{
                scale: index === currentStep ? 1.1 : 1,
                opacity: index <= currentStep ? 1 : 0.4
              }}
              transition={{ duration: 0.3 }}
            >
              <div className={cn(
                'w-4 h-4 rounded-full border-2 transition-all duration-300',
                index <= currentStep 
                  ? 'bg-gradient-to-r from-accent-electric to-success-green border-accent-electric' 
                  : 'bg-surface-secondary border-border-subtle'
              )}>
                {index < currentStep && (
                  <motion.div
                    className="w-2 h-2 bg-surface-primary rounded-full m-auto mt-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
              <span className="text-xs text-center leading-tight max-w-[60px]">
                {step.title.split(' ')[0]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}