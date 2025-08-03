import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Volume2, Shield, Plus, X, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { Badge } from '../ui/Badge'
import type { OnboardingData, Voice, SafetyMode } from '../../../shared/types'
import { cn } from '../../lib/utils'

const OnboardingStep2: React.FC = () => {
  const { setValue, watch, formState: { errors } } = useFormContext<OnboardingData>()
  const [newBannedTerm, setNewBannedTerm] = useState('')
  
  const watchedValues = watch()
  const bannedTerms = watchedValues.bannedTerms || []

  const voices: { value: Voice; label: string; description: string; example: string }[] = [
    { 
      value: 'authoritative', 
      label: 'Authoritative', 
      description: 'Expert, confident, and commanding',
      example: '"This is the only strategy that actually works..."'
    },
    { 
      value: 'friendly', 
      label: 'Friendly', 
      description: 'Warm, approachable, and conversational',
      example: '"Hey there! Let me share something that changed my life..."'
    },
    { 
      value: 'playful', 
      label: 'Playful', 
      description: 'Fun, energetic, and entertaining',
      example: '"Plot twist: This weird trick actually works..."'
    },
    { 
      value: 'contrarian', 
      label: 'Contrarian', 
      description: 'Challenging, provocative, and thought-provoking',
      example: '"Everyone\'s doing this wrong. Here\'s why..."'
    },
    { 
      value: 'luxury', 
      label: 'Luxury', 
      description: 'Premium, sophisticated, and exclusive',
      example: '"What billionaires know that you don\'t..."'
    },
    { 
      value: 'minimal', 
      label: 'Minimal', 
      description: 'Simple, clean, and straightforward',
      example: '"Three words changed everything..."'
    },
    { 
      value: 'educational', 
      label: 'Educational', 
      description: 'Informative, helpful, and teaching-focused',
      example: '"Here\'s exactly how to..."'
    },
    { 
      value: 'inspirational', 
      label: 'Inspirational', 
      description: 'Motivating, uplifting, and empowering',
      example: '"You\'re capable of more than you think..."'
    },
  ]

  const safetyModes: { value: SafetyMode; label: string; description: string; icon: string }[] = [
    { 
      value: 'family-friendly', 
      label: 'Family Friendly', 
      description: 'Safe for all audiences, no controversial content',
      icon: '👨‍👩‍👧‍👦'
    },
    { 
      value: 'standard', 
      label: 'Standard', 
      description: 'Balanced approach, some edgy content allowed',
      icon: '⚖️'
    },
    { 
      value: 'edgy', 
      label: 'Edgy', 
      description: 'Bold and provocative, higher risk tolerance',
      icon: '🔥'
    },
  ]

  const addBannedTerm = () => {
    if (newBannedTerm.trim() && !bannedTerms.includes(newBannedTerm.trim().toLowerCase())) {
      const updatedTerms = [...bannedTerms, newBannedTerm.trim().toLowerCase()]
      setValue('bannedTerms', updatedTerms, { shouldValidate: true })
      setNewBannedTerm('')
    }
  }

  const removeBannedTerm = (term: string) => {
    const updatedTerms = bannedTerms.filter(t => t !== term)
    setValue('bannedTerms', updatedTerms, { shouldValidate: true })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addBannedTerm()
    }
  }

  return (
    <div className="space-y-8">
      {/* Voice Selection */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base">
            <Volume2 className="w-4 h-4" />
            Brand Voice
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the tone and personality for your hooks
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voices.map((voice) => (
            <button
              key={voice.value}
              type="button"
              onClick={() => setValue('voice', voice.value, { shouldValidate: true })}
              className={cn(
                "p-4 border rounded-lg text-left transition-all hover:shadow-sm",
                watchedValues.voice === voice.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="space-y-2">
                <div className="font-medium">{voice.label}</div>
                <div className="text-sm text-muted-foreground">{voice.description}</div>
                <div className="text-xs italic text-muted-foreground bg-muted/50 p-2 rounded">
                  {voice.example}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {errors.voice && (
          <p className="text-sm text-destructive">{errors.voice.message}</p>
        )}
      </div>

      {/* Safety Mode */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Content Safety
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Set your comfort level for controversial or edgy content
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safetyModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setValue('safety', mode.value, { shouldValidate: true })}
              className={cn(
                "p-4 border rounded-lg text-center transition-all hover:shadow-sm",
                watchedValues.safety === mode.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="text-2xl mb-2">{mode.icon}</div>
              <div className="font-medium mb-1">{mode.label}</div>
              <div className="text-xs text-muted-foreground">{mode.description}</div>
            </button>
          ))}
        </div>
        
        {errors.safety && (
          <p className="text-sm text-destructive">{errors.safety.message}</p>
        )}
      </div>

      {/* Banned Terms */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4" />
            Banned Terms (Optional)
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Words or phrases to avoid in your hooks (e.g., competitor names, inappropriate language)
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newBannedTerm}
              onChange={(e) => setNewBannedTerm(e.target.value)}
              placeholder="Enter a word or phrase to ban"
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addBannedTerm}
              disabled={!newBannedTerm.trim()}
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {bannedTerms.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Banned terms:</div>
              <div className="flex flex-wrap gap-2">
                {bannedTerms.map((term) => (
                  <Badge key={term} variant="secondary" className="flex items-center gap-1">
                    {term}
                    <button
                      type="button"
                      onClick={() => removeBannedTerm(term)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {watchedValues.voice && watchedValues.safety && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-medium">Voice Preview</h4>
          <div className="text-sm space-y-1">
            <div>Voice: <span className="font-medium capitalize">{watchedValues.voice.replace('-', ' ')}</span></div>
            <div>Safety: <span className="font-medium capitalize">{watchedValues.safety.replace('-', ' ')}</span></div>
            {bannedTerms.length > 0 && (
              <div>Banned Terms: <span className="font-medium">{bannedTerms.length} term{bannedTerms.length > 1 ? 's' : ''}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Perfect! Finally, let's set up your content strategy and platforms.
        </p>
      </div>
    </div>
  )
}

export default OnboardingStep2