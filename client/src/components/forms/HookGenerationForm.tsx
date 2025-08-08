import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Zap, 
  Target, 
  MessageSquare, 
  Sparkles,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import type { Platform, Objective, ModelType } from '@/types/shared'
import { cn, formatPlatformName, getObjectiveLabel, getPlatformGlow } from '../../lib/utils'

const formSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'youtube']),
  objective: z.enum(['watch_time', 'shares', 'saves', 'ctr', 'follows']),
  topic: z.string().min(10, 'Topic must be at least 10 characters').max(1000, 'Topic too long'),
  modelType: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-5-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-5', 'gpt-5-mini']).optional().default('gpt-5-mini-2025-08-07'),
})

type FormData = z.infer<typeof formSchema>

interface HookGenerationFormProps {
  onSubmit: (data: FormData) => void
  isLoading?: boolean
  creditsRemaining?: number
  className?: string
}

const HookGenerationForm: React.FC<HookGenerationFormProps> = ({
  onSubmit,
  isLoading = false,
  creditsRemaining,
  className
}) => {
  const [step, setStep] = useState(1)
  const [charCount, setCharCount] = useState(0)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      modelType: 'gpt-5-mini-2025-08-07'
    }
  })

  const watchedValues = watch()

  const platforms = [
    { 
      value: 'tiktok' as Platform, 
      label: 'TikTok', 
      icon: '🎵',
      description: 'Short-form vertical videos',
      color: 'bg-pink-500'
    },
    { 
      value: 'instagram' as Platform, 
      label: 'Instagram', 
      icon: '📸',
      description: 'Stories, Reels, and posts',
      color: 'bg-purple-500'
    },
    { 
      value: 'youtube' as Platform, 
      label: 'YouTube', 
      icon: '🎥',
      description: 'Long and short-form content',
      color: 'bg-red-500'
    },
  ]

  const objectives = [
    { 
      value: 'watch_time' as Objective, 
      label: 'Watch Time', 
      icon: Clock,
      description: 'Keep viewers engaged longer'
    },
    { 
      value: 'ctr' as Objective, 
      label: 'Click-Through Rate', 
      icon: Target,
      description: 'Increase clicks and engagement'
    },
    { 
      value: 'shares' as Objective, 
      label: 'Shares', 
      icon: TrendingUp,
      description: 'Encourage sharing and virality'
    },
    { 
      value: 'saves' as Objective, 
      label: 'Saves', 
      icon: MessageSquare,
      description: 'Get content bookmarked'
    },
    { 
      value: 'follows' as Objective, 
      label: 'Follows', 
      icon: Sparkles,
      description: 'Convert viewers to followers'
    },
  ]

  const modelTypes = [
    {
      value: 'gpt-4o-mini' as ModelType,
      label: 'GPT-4o Mini',
      description: 'Fast and efficient',
      credits: 1
    },
    {
      value: 'gpt-4o' as ModelType,
      label: 'GPT-4o',
      description: 'Premium quality',
      credits: 3
    },
    {
      value: 'gpt-4-turbo' as ModelType,
      label: 'GPT-4 Turbo',
      description: 'Enhanced performance',
      credits: 2
    },
    {
      value: 'gpt-5-mini-2025-08-07' as ModelType,
      label: 'ChatGPT-5 Mini',
      description: 'Latest AI - Fast & efficient (Recommended)',
      credits: 2,
      isNew: true
    },
    {
      value: 'gpt-5-2025-08-07' as ModelType,
      label: 'ChatGPT-5',
      description: 'Latest AI - Superior quality & reasoning',
      credits: 5,
      isNew: true
    }
  ]

  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setCharCount(value.length)
    setValue('topic', value, { shouldValidate: true })
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const canGenerate = creditsRemaining !== undefined && creditsRemaining > 0

  const onFormSubmit = (data: FormData) => {
    if (canGenerate) {
      onSubmit(data)
    }
  }

  const stepProgress = (step / 3) * 100

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Generate Viral Hooks
          </CardTitle>
          {creditsRemaining !== undefined && (
            <Badge variant={creditsRemaining > 0 ? "secondary" : "destructive"}>
              {creditsRemaining} credits remaining
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{Math.round(stepProgress)}% complete</span>
          </div>
          <Progress value={stepProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Step 1: Platform Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <Label className="text-base font-medium">Choose your platform</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select where you'll be posting your content
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => setValue('platform', platform.value, { shouldValidate: true })}
                    className={cn(
                      "p-4 border rounded-lg text-center transition-all hover:shadow-md",
                      watchedValues.platform === platform.value
                        ? "border-[hsl(var(--viral-pink))] bg-[hsl(var(--viral-pink)/0.05)] shadow-md viral-gradient-primary text-white"
                        : "border-border hover:border-[hsl(var(--viral-pink))/0.5] hover:bg-[hsl(var(--viral-pink)/0.02)]",
                      watchedValues.platform === platform.value && getPlatformGlow(platform.value)
                    )}
                  >
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <div className="font-medium">{platform.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {platform.description}
                    </div>
                  </button>
                ))}
              </div>
              
              {errors.platform && (
                <p className="text-sm text-destructive">{errors.platform.message}</p>
              )}
            </motion.div>
          )}

          {/* Step 2: Objective Selection */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <Label className="text-base font-medium">What's your goal?</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose your primary objective for this content
                </p>
              </div>
              
              <div className="space-y-3">
                {objectives.map((objective) => {
                  const IconComponent = objective.icon
                  return (
                    <button
                      key={objective.value}
                      type="button"
                      onClick={() => setValue('objective', objective.value, { shouldValidate: true })}
                      className={cn(
                        "w-full p-4 border rounded-lg text-left transition-all hover:shadow-md flex items-center gap-3",
                        watchedValues.objective === objective.value
                          ? "border-[hsl(var(--viral-purple))] bg-[hsl(var(--viral-purple)/0.05)] shadow-md"
                          : "border-border hover:border-[hsl(var(--viral-purple))/0.5] hover:bg-[hsl(var(--viral-purple)/0.02)]"
                      )}
                    >
                      <div className="w-10 h-10 bg-[hsl(var(--viral-purple)/0.15)] rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-[hsl(var(--viral-purple))]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{objective.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {objective.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {errors.objective && (
                <p className="text-sm text-destructive">{errors.objective.message}</p>
              )}
            </motion.div>
          )}

          {/* Step 3: Topic and Settings */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label className="text-base font-medium">Describe your content idea</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Be specific about your topic, product, or story
                </p>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  {...register('topic')}
                  placeholder="Example: I'm launching a new productivity app that helps remote workers stay focused during video calls by blocking distracting websites and notifications..."
                  className="min-h-[120px] resize-none"
                  onChange={handleTopicChange}
                />
                <div className="flex justify-between text-sm">
                  {errors.topic && (
                    <p className="text-destructive">{errors.topic.message}</p>
                  )}
                  <div className="ml-auto">
                    <span className={cn(
                      charCount < 10 ? "text-destructive" : 
                      charCount > 800 ? "text-yellow-600" : 
                      "text-muted-foreground"
                    )}>
                      {charCount}/1000
                    </span>
                  </div>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">AI Model</Label>
                <div className="space-y-2">
                  {modelTypes.map((model) => (
                    <button
                      key={model.value}
                      type="button"
                      onClick={() => setValue('modelType', model.value)}
                      className={cn(
                        "w-full p-3 border rounded-lg text-left transition-all hover:shadow-sm flex items-center justify-between",
                        watchedValues.modelType === model.value
                          ? "border-[hsl(var(--viral-gold))] bg-[hsl(var(--viral-gold)/0.05)] shadow-sm"
                          : "border-border hover:border-[hsl(var(--viral-gold))/0.5] hover:bg-[hsl(var(--viral-gold)/0.02)]"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.label}</span>
                          {(model as any).isPreview && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                              Preview
                            </Badge>
                          )}
                          {(model as any).isNew && (
                            <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {model.description}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {model.credits} credit{model.credits > 1 ? 's' : ''}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {watchedValues.platform && watchedValues.objective && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium">Generation Summary</h4>
                  <div className="text-sm space-y-1">
                    <div>Platform: <span className="font-medium">{formatPlatformName(watchedValues.platform)}</span></div>
                    <div>Objective: <span className="font-medium">{getObjectiveLabel(watchedValues.objective)}</span></div>
                    <div>Model: <span className="font-medium">{modelTypes.find(m => m.value === watchedValues.modelType)?.label}</span></div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  (step === 1 && !watchedValues.platform) ||
                  (step === 2 && !watchedValues.objective)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isValid || isLoading || !canGenerate}
                className="min-w-[120px] viral-gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                ) : !canGenerate ? (
                  'No Credits'
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Hooks
                  </>
                )}
              </Button>
            )}
          </div>

          {!canGenerate && creditsRemaining === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span>You've used all your credits. Upgrade your plan to continue generating hooks.</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export default HookGenerationForm