import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  Target, 
  Zap,
  TrendingUp,
  MessageSquare,
  Clock
} from 'lucide-react'
import { Progress } from '../ui/Progress'
import { Card, CardContent } from '../ui/Card'
import { cn } from '../../lib/utils'

interface MobileLoadingProps {
  message?: string
  submessage?: string
  progress?: number
  showSteps?: boolean
  estimatedTime?: number
  className?: string
}

const loadingSteps = [
  {
    icon: Brain,
    title: "Analyzing Psychology",
    description: "Understanding what makes content viral",
    duration: 2000,
    color: "text-purple-500"
  },
  {
    icon: Target,
    title: "Targeting Platform",
    description: "Optimizing for your chosen platform",
    duration: 1500,
    color: "text-blue-500"
  },
  {
    icon: Sparkles,
    title: "Generating Hooks",
    description: "Creating engaging opening lines",
    duration: 3000,
    color: "text-yellow-500"
  },
  {
    icon: TrendingUp,
    title: "Scoring Quality",
    description: "Ranking hooks by viral potential",
    duration: 1000,
    color: "text-green-500"
  }
]

const loadingMessages = [
  "Analyzing viral patterns...",
  "Crafting psychological triggers...",
  "Optimizing for engagement...",
  "Polishing your hooks...",
  "Almost ready...",
]

const MobileLoading: React.FC<MobileLoadingProps> = ({
  message = "Generating your viral hooks...",
  submessage = "This usually takes 10-15 seconds",
  progress: externalProgress,
  showSteps = true,
  estimatedTime = 15,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Auto-progress through steps
  useEffect(() => {
    if (!showSteps) return

    const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0)
    let currentTime = 0

    const interval = setInterval(() => {
      currentTime += 100
      
      // Calculate progress
      const newProgress = Math.min((currentTime / totalDuration) * 100, 100)
      setProgress(newProgress)
      
      // Update current step
      let accumulatedTime = 0
      let stepIndex = 0
      
      for (let i = 0; i < loadingSteps.length; i++) {
        accumulatedTime += loadingSteps[i].duration
        if (currentTime <= accumulatedTime) {
          stepIndex = i
          break
        }
        stepIndex = loadingSteps.length - 1
      }
      
      setCurrentStep(stepIndex)
      
      if (currentTime >= totalDuration) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [showSteps])

  // Use external progress if provided
  const displayProgress = externalProgress !== undefined ? externalProgress : progress

  // Cycle through loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const remainingTime = Math.max(0, estimatedTime - elapsedTime)

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 bg-background", className)}>
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-6">
          {/* Main Loading Animation */}
          <div className="relative">
            <motion.div
              className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            
            {/* Orbiting Icons */}
            <div className="absolute inset-0">
              {[Brain, Target, MessageSquare, TrendingUp].map((Icon, index) => (
                <motion.div
                  key={index}
                  className="absolute w-6 h-6 text-muted-foreground"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.5
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: `0px ${40 + index * 10}px`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {message}
            </h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-muted-foreground"
              >
                {loadingMessages[currentMessage]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={displayProgress} className="h-2" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{Math.round(displayProgress)}% complete</span>
              {remainingTime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>~{remainingTime}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading Steps */}
          {showSteps && (
            <div className="space-y-3">
              {loadingSteps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                  <motion.div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                      isActive && "bg-primary/10 border border-primary/20",
                      isCompleted && "opacity-60"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: isActive ? 1.02 : 1
                    }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isActive && "bg-primary/20",
                      isCompleted && "bg-green-100 dark:bg-green-900"
                    )}>
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                            <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                          </svg>
                        </motion.div>
                      ) : (
                        <StepIcon className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? step.color : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className={cn(
                        "text-sm font-medium transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                    
                    {isActive && (
                      <motion.div
                        className="w-4 h-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-full h-full border-2 border-primary/30 border-t-primary rounded-full" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Fun Fact or Tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30"
          >
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium text-foreground mb-1">Pro Tip</p>
                <p className="text-xs text-muted-foreground">
                  Hooks with numbers and specific details tend to perform 40% better than generic ones!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Taking too long? */}
          {elapsedTime > estimatedTime + 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
            >
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                This is taking longer than usual. Our AI is working extra hard to create the perfect hooks for you!
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MobileLoading