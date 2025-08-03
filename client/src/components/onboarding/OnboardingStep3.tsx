import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { 
  Target, 
  Zap, 
  Plus, 
  X, 
  Lightbulb,
  TrendingUp,
  Clock,
  Share,
  Bookmark,
  UserPlus
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'
import { Badge } from '../ui/Badge'
import type { OnboardingData, Platform, Objective } from '../../../shared/types'
import { cn, formatPlatformName, getObjectiveLabel } from '../../lib/utils'

const OnboardingStep3: React.FC = () => {
  const { setValue, watch, formState: { errors } } = useFormContext<OnboardingData>()
  const [newHook, setNewHook] = useState('')
  
  const watchedValues = watch()
  const primaryPlatforms = watchedValues.primaryPlatforms || []
  const contentGoals = watchedValues.contentGoals || []
  const successfulHooks = watchedValues.successfulHooks || []

  const platforms: { value: Platform; label: string; icon: string; description: string }[] = [
    { 
      value: 'tiktok', 
      label: 'TikTok', 
      icon: '🎵',
      description: 'Short-form vertical videos'
    },
    { 
      value: 'instagram', 
      label: 'Instagram', 
      icon: '📸',
      description: 'Stories, Reels, and posts'
    },
    { 
      value: 'youtube', 
      label: 'YouTube', 
      icon: '🎥',
      description: 'Long and short-form content'
    },
  ]

  const objectives: { value: Objective; label: string; icon: any; description: string }[] = [
    { 
      value: 'watch_time', 
      label: 'Watch Time', 
      icon: Clock,
      description: 'Keep viewers engaged longer'
    },
    { 
      value: 'ctr', 
      label: 'Click-Through Rate', 
      icon: Target,
      description: 'Increase clicks and engagement'
    },
    { 
      value: 'shares', 
      label: 'Shares', 
      icon: Share,
      description: 'Encourage sharing and virality'
    },
    { 
      value: 'saves', 
      label: 'Saves', 
      icon: Bookmark,
      description: 'Get content bookmarked'
    },
    { 
      value: 'follows', 
      label: 'Follows', 
      icon: UserPlus,
      description: 'Convert viewers to followers'
    },
  ]

  const togglePlatform = (platform: Platform) => {
    const updated = primaryPlatforms.includes(platform)
      ? primaryPlatforms.filter(p => p !== platform)
      : [...primaryPlatforms, platform]
    setValue('primaryPlatforms', updated, { shouldValidate: true })
  }

  const toggleObjective = (objective: Objective) => {
    const updated = contentGoals.includes(objective)
      ? contentGoals.filter(o => o !== objective)
      : contentGoals.length < 3 
        ? [...contentGoals, objective]
        : contentGoals // Don't add if already at max
    setValue('contentGoals', updated, { shouldValidate: true })
  }

  const addSuccessfulHook = () => {
    if (newHook.trim() && !successfulHooks.includes(newHook.trim())) {
      const updated = [...successfulHooks, newHook.trim()]
      setValue('successfulHooks', updated, { shouldValidate: true })
      setNewHook('')
    }
  }

  const removeSuccessfulHook = (hook: string) => {
    const updated = successfulHooks.filter(h => h !== hook)
    setValue('successfulHooks', updated, { shouldValidate: true })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      addSuccessfulHook()
    }
  }

  return (
    <div className="space-y-8">
      {/* Platform Selection */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4" />
            Primary Platforms
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select the platforms where you'll be posting content (at least one required)
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const isSelected = primaryPlatforms.includes(platform.value)
            return (
              <button
                key={platform.value}
                type="button"
                onClick={() => togglePlatform(platform.value)}
                className={cn(
                  "p-4 border rounded-lg text-center transition-all hover:shadow-sm",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-2xl mb-2">{platform.icon}</div>
                <div className="font-medium mb-1">{platform.label}</div>
                <div className="text-xs text-muted-foreground">{platform.description}</div>
                {isSelected && (
                  <Badge className="mt-2" variant="default">Selected</Badge>
                )}
              </button>
            )
          })}
        </div>
        
        {errors.primaryPlatforms && (
          <p className="text-sm text-destructive">{errors.primaryPlatforms.message}</p>
        )}
      </div>

      {/* Content Goals */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4" />
            Content Goals
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your primary objectives (select 1-3 goals)
          </p>
        </div>
        
        <div className="space-y-3">
          {objectives.map((objective) => {
            const isSelected = contentGoals.includes(objective.value)
            const canSelect = contentGoals.length < 3 || isSelected
            const IconComponent = objective.icon
            
            return (
              <button
                key={objective.value}
                type="button"
                onClick={() => canSelect && toggleObjective(objective.value)}
                className={cn(
                  "w-full p-4 border rounded-lg text-left transition-all hover:shadow-sm flex items-center gap-3",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : canSelect
                      ? "border-border hover:border-primary/50"
                      : "border-border opacity-50 cursor-not-allowed"
                )}
                disabled={!canSelect}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <IconComponent className={cn(
                    "w-5 h-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{objective.label}</div>
                  <div className="text-sm text-muted-foreground">{objective.description}</div>
                </div>
                {isSelected && (
                  <Badge variant="default">Selected</Badge>
                )}
              </button>
            )
          })}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {contentGoals.length}/3 goals selected
        </div>
        
        {errors.contentGoals && (
          <p className="text-sm text-destructive">{errors.contentGoals.message}</p>
        )}
      </div>

      {/* Successful Hooks */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base">
            <Lightbulb className="w-4 h-4" />
            Successful Hooks (Optional)
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Share examples of hooks that worked well for you. This helps us understand your style.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Textarea
              value={newHook}
              onChange={(e) => setNewHook(e.target.value)}
              placeholder="Example: 'POV: You just discovered the productivity hack that millionaires use...'"
              className="min-h-[80px] resize-none"
              onKeyPress={handleKeyPress}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to add, or click the button
              </p>
              <Button
                type="button"
                onClick={addSuccessfulHook}
                disabled={!newHook.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Hook
              </Button>
            </div>
          </div>
          
          {successfulHooks.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Your successful hooks:</div>
              <div className="space-y-2">
                {successfulHooks.map((hook, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 text-sm">{hook}</div>
                    <button
                      type="button"
                      onClick={() => removeSuccessfulHook(hook)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {primaryPlatforms.length > 0 && contentGoals.length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <h4 className="font-medium">Setup Summary</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Platforms:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {primaryPlatforms.map(platform => (
                  <Badge key={platform} variant="outline">
                    {formatPlatformName(platform)}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Goals:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {contentGoals.map(goal => (
                  <Badge key={goal} variant="outline">
                    {getObjectiveLabel(goal)}
                  </Badge>
                ))}
              </div>
            </div>
            {successfulHooks.length > 0 && (
              <div>
                <span className="text-muted-foreground">Example hooks:</span>
                <span className="ml-2 font-medium">{successfulHooks.length} provided</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Message */}
      <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
        <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
        <h4 className="font-medium text-foreground mb-2">You're All Set!</h4>
        <p className="text-sm text-muted-foreground">
          We'll use this information to create personalized hooks that match your brand voice, 
          target your audience, and optimize for your chosen platforms and goals.
        </p>
      </div>
    </div>
  )
}

export default OnboardingStep3