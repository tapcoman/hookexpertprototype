import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Target, 
  MessageSquare, 
  Sparkles, 
  ChevronDown,
  ChevronUp,
  Info,
  Mic,
  MicOff
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import type { GenerateHooksRequest, Platform, Objective } from '../../../shared/types'

interface MobileHookGenerationFormProps {
  onGenerate: (data: GenerateHooksRequest) => void
  isLoading: boolean
  className?: string
}

const MobileHookGenerationForm: React.FC<MobileHookGenerationFormProps> = ({
  onGenerate,
  isLoading,
  className
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const [formData, setFormData] = useState<GenerateHooksRequest>({
    platform: 'tiktok',
    objective: 'watch_time',
    topic: '',
    modelType: 'gpt-4o-mini',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSection, setExpandedSection] = useState<string | null>('topic')
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setFormData(prev => ({ ...prev, topic: transcript }))
        setIsListening(false)
      }
      
      recognitionInstance.onerror = () => {
        setIsListening(false)
        toast({
          title: "Voice input failed",
          description: "Please try typing instead",
          variant: "destructive"
        })
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [toast])

  const platforms = [
    { 
      value: 'tiktok', 
      label: 'TikTok', 
      emoji: '🎵', 
      description: 'Short-form viral content',
      color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100'
    },
    { 
      value: 'instagram', 
      label: 'Instagram', 
      emoji: '📸', 
      description: 'Reels & Stories',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
    },
    { 
      value: 'youtube', 
      label: 'YouTube', 
      emoji: '🎬', 
      description: 'Shorts & Videos',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    },
  ]

  const objectives = [
    { 
      value: 'watch_time', 
      label: 'Watch Time', 
      icon: '⏰', 
      description: 'Keep viewers engaged longer'
    },
    { 
      value: 'shares', 
      label: 'Shares', 
      icon: '🚀', 
      description: 'Encourage content sharing'
    },
    { 
      value: 'saves', 
      label: 'Saves', 
      icon: '💾', 
      description: 'Create saveable content'
    },
    { 
      value: 'ctr', 
      label: 'Clicks', 
      icon: '👆', 
      description: 'Drive clicks and visits'
    },
    { 
      value: 'follows', 
      label: 'Follows', 
      icon: '👥', 
      description: 'Grow your audience'
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.topic.trim()) {
      newErrors.topic = 'Please enter a topic'
    } else if (formData.topic.length < 10) {
      newErrors.topic = 'Topic must be at least 10 characters'
    } else if (formData.topic.length > 1000) {
      newErrors.topic = 'Topic must be less than 1000 characters'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onGenerate(formData)
    } else {
      // Scroll to error
      if (textareaRef.current) {
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        textareaRef.current.focus()
      }
    }
  }

  const handleVoiceInput = () => {
    if (!recognition) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive"
      })
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  const canGenerate = user && (
    user.freeCredits > user.usedCredits || 
    user.subscriptionStatus === 'active' || 
    user.subscriptionStatus === 'trialing'
  )

  const creditsRemaining = user ? (user.freeCredits - user.usedCredits) : 0

  return (
    <div className={cn("space-y-4 pb-4", className)}>
      {/* Progress Indicator */}
      <div className="px-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Setup Progress</span>
          <span>3/3</span>
        </div>
        <Progress value={100} className="h-2" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Platform Selection */}
        <Card className="mx-4">
          <CardContent className="p-4">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'platform' ? null : 'platform')}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    {platforms.find(p => p.value === formData.platform)?.label}
                  </p>
                </div>
              </div>
              {expandedSection === 'platform' ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </button>

            <AnimatePresence>
              {expandedSection === 'platform' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-2 overflow-hidden"
                >
                  {platforms.map((platform) => (
                    <label
                      key={platform.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer touch-target",
                        formData.platform === platform.value
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:bg-muted/50 active:bg-muted/70"
                      )}
                    >
                      <input
                        type="radio"
                        name="platform"
                        value={platform.value}
                        checked={formData.platform === platform.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value as Platform }))}
                        className="sr-only"
                      />
                      <div className="text-xl">{platform.emoji}</div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{platform.label}</div>
                        <div className="text-sm text-muted-foreground">{platform.description}</div>
                      </div>
                      {formData.platform === platform.value && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                        </div>
                      )}
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Objective Selection */}
        <Card className="mx-4">
          <CardContent className="p-4">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'objective' ? null : 'objective')}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Objective</h3>
                  <p className="text-sm text-muted-foreground">
                    {objectives.find(o => o.value === formData.objective)?.label}
                  </p>
                </div>
              </div>
              {expandedSection === 'objective' ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </button>

            <AnimatePresence>
              {expandedSection === 'objective' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 grid grid-cols-2 gap-2 overflow-hidden"
                >
                  {objectives.map((objective) => (
                    <label
                      key={objective.value}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer touch-target",
                        formData.objective === objective.value
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:bg-muted/50 active:bg-muted/70"
                      )}
                    >
                      <input
                        type="radio"
                        name="objective"
                        value={objective.value}
                        checked={formData.objective === objective.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value as Objective }))}
                        className="sr-only"
                      />
                      <div className="text-xl">{objective.icon}</div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-foreground">{objective.label}</div>
                        <div className="text-xs text-muted-foreground">{objective.description}</div>
                      </div>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Topic Input */}
        <Card className="mx-4">
          <CardContent className="p-4">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'topic' ? null : 'topic')}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Content Topic</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.topic ? 'Topic provided' : 'Describe your content'}
                  </p>
                </div>
              </div>
              {expandedSection === 'topic' ? 
                <ChevronUp className="w-5 h-5 text-muted-foreground" /> : 
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              }
            </button>

            <AnimatePresence>
              {expandedSection === 'topic' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-3 overflow-hidden"
                >
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="E.g., '5 AI tools that save me 10 hours per week as a content creator'"
                      rows={4}
                      className={cn(
                        "w-full px-3 py-3 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base",
                        errors.topic ? 'border-destructive' : 'border-input bg-background'
                      )}
                    />
                    
                    {/* Voice Input Button */}
                    {recognition && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleVoiceInput}
                        className={cn(
                          "absolute top-3 right-3 p-2 touch-target",
                          isListening && "text-red-500 animate-pulse"
                        )}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  
                  {errors.topic && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <Info className="w-4 h-4" />
                      {errors.topic}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Be specific for better results</span>
                    <span className={cn(
                      formData.topic.length > 900 && "text-destructive"
                    )}>
                      {formData.topic.length}/1000
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Model Selection */}
        <Card className="mx-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">AI Model</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.modelType === 'gpt-4o' ? 'Premium Quality' : 'Fast & Efficient'}
                  </p>
                </div>
              </div>
              <select
                value={formData.modelType}
                onChange={(e) => setFormData(prev => ({ ...prev, modelType: e.target.value as 'gpt-4o' | 'gpt-4o-mini' }))}
                className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o Pro</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Credits Display */}
        {user && (
          <Card className="mx-4 bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Available Credits</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.modelType === 'gpt-4o' ? 'Uses pro credits' : 'Uses draft credits'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {creditsRemaining}
                    </span>
                  </div>
                  {user.subscriptionStatus === 'active' && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      + Unlimited Pro
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        <div className="px-4">
          <Button
            type="submit"
            disabled={isLoading || !canGenerate}
            className="w-full h-12 text-base font-medium touch-target"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating Hooks...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate Viral Hooks
              </div>
            )}
          </Button>

          {!canGenerate && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              No credits remaining. <span className="text-primary">Upgrade your plan</span> to continue.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export default MobileHookGenerationForm