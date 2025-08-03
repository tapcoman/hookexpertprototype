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
    'Analyzing your topic...',
    'Applying psychological frameworks...',
    'Crafting compelling hooks...',
    'Optimizing for your platform...',
  ]

  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <LoadingSpinner size="lg" />
      <motion.div
        className="mt-6 text-center"
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-medium">{steps[currentStep]}</h3>
        <p className="text-muted-foreground mt-1">
          This usually takes 10-30 seconds
        </p>
      </motion.div>
      
      {/* Progress indicator */}
      <div className="flex gap-2 mt-4">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              'w-2 h-2 rounded-full',
              index === currentStep ? 'bg-primary' : 'bg-muted'
            )}
            animate={{
              scale: index === currentStep ? 1.2 : 1,
            }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}