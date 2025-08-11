import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'wouter'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { OnboardingRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { api } from '@/lib/api'
import type { OnboardingData, UserRole, Industry, Voice, SafetyMode, Platform, Objective } from '@/types/shared'

// ==================== TYPES ====================

interface StepProps {
  data: Partial<OnboardingData>
  onChange: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onBack?: () => void
  isLoading?: boolean
}

// ==================== STEP 1: ABOUT YOUR WORK ====================

const Step1AboutWork: React.FC<StepProps> = ({ data, onChange, onNext }) => {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.company?.trim()) newErrors.company = 'Company name is required'
    if (!data.industry) newErrors.industry = 'Please select your industry'
    if (!data.role) newErrors.role = 'Please select your role'
    if (!data.audience?.trim() || data.audience.length < 10) {
      newErrors.audience = 'Please describe your audience (at least 10 characters)'
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onNext()
    }
  }

  const industries: { value: Industry; label: string }[] = [
    { value: 'agency', label: 'Marketing Agency' },
    { value: 'creator', label: 'Content Creator' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'saas', label: 'SaaS' },
    { value: 'local-business', label: 'Local Business' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'beauty', label: 'Beauty' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'technology', label: 'Technology' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' },
  ]

  const roles: { value: UserRole; label: string }[] = [
    { value: 'founder-ceo', label: 'Founder/CEO' },
    { value: 'marketing-manager', label: 'Marketing Manager' },
    { value: 'content-creator', label: 'Content Creator' },
    { value: 'social-media-manager', label: 'Social Media Manager' },
    { value: 'video-editor', label: 'Video Editor' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'agency-owner', label: 'Agency Owner' },
    { value: 'student', label: 'Student' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">About Your Work</h2>
        <p className="text-muted-foreground">Tell us about your business so we can personalize your experience.</p>
      </div>

      <div className="space-y-4">
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={data.company || ''}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Enter your company name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.company ? 'border-destructive' : 'border-input'
            }`}
          />
          {errors.company && <p className="text-sm text-destructive mt-1">{errors.company}</p>}
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Industry *
          </label>
          <select
            value={data.industry || ''}
            onChange={(e) => onChange({ industry: e.target.value as Industry })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.industry ? 'border-destructive' : 'border-input'
            }`}
          >
            <option value="">Select your industry</option>
            {industries.map((industry) => (
              <option key={industry.value} value={industry.value}>
                {industry.label}
              </option>
            ))}
          </select>
          {errors.industry && <p className="text-sm text-destructive mt-1">{errors.industry}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Your Role *
          </label>
          <select
            value={data.role || ''}
            onChange={(e) => onChange({ role: e.target.value as UserRole })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.role ? 'border-destructive' : 'border-input'
            }`}
          >
            <option value="">Select your role</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="text-sm text-destructive mt-1">{errors.role}</p>}
        </div>

        {/* Audience */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Describe Your Audience *
          </label>
          <textarea
            value={data.audience || ''}
            onChange={(e) => onChange({ audience: e.target.value })}
            placeholder="Who are you creating content for? (e.g., 'Tech-savvy millennials interested in productivity apps and side hustles')"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.audience ? 'border-destructive' : 'border-input'
            }`}
          />
          {errors.audience && <p className="text-sm text-destructive mt-1">{errors.audience}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {data.audience?.length || 0}/500 characters
          </p>
        </div>
      </div>

      <button
        onClick={validateAndNext}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-md font-medium transition-colors"
      >
        Continue
      </button>
    </motion.div>
  )
}

// ==================== STEP 2: HOW YOU SOUND ====================

const Step2HowYouSound: React.FC<StepProps> = ({ data, onChange, onNext, onBack }) => {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.voice) newErrors.voice = 'Please select your brand voice'
    if (!data.safety) newErrors.safety = 'Please select a safety mode'

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onNext()
    }
  }

  const voices: { value: Voice; label: string; description: string }[] = [
    { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident, and informative' },
    { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and conversational' },
    { value: 'playful', label: 'Playful', description: 'Fun, energetic, and entertaining' },
    { value: 'contrarian', label: 'Contrarian', description: 'Bold, challenging, and thought-provoking' },
    { value: 'luxury', label: 'Luxury', description: 'Premium, sophisticated, and exclusive' },
    { value: 'minimal', label: 'Minimal', description: 'Clean, simple, and straightforward' },
    { value: 'educational', label: 'Educational', description: 'Teaching, explaining, and informative' },
    { value: 'inspirational', label: 'Inspirational', description: 'Motivating, uplifting, and empowering' },
  ]

  const safetyModes: { value: SafetyMode; label: string; description: string }[] = [
    { value: 'family-friendly', label: 'Family Friendly', description: 'Safe for all audiences' },
    { value: 'standard', label: 'Standard', description: 'General audience appropriate' },
    { value: 'edgy', label: 'Edgy', description: 'More provocative and bold' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">How You Sound</h2>
        <p className="text-muted-foreground">Define your brand voice and content style.</p>
      </div>

      <div className="space-y-6">
        {/* Voice */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Brand Voice *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {voices.map((voice) => (
              <label
                key={voice.value}
                className={`cursor-pointer border rounded-lg p-4 transition-colors ${
                  data.voice === voice.value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="voice"
                  value={voice.value}
                  checked={data.voice === voice.value}
                  onChange={(e) => onChange({ voice: e.target.value as Voice })}
                  className="sr-only"
                />
                <div className="font-medium text-foreground mb-1">{voice.label}</div>
                <div className="text-sm text-muted-foreground">{voice.description}</div>
              </label>
            ))}
          </div>
          {errors.voice && <p className="text-sm text-destructive mt-1">{errors.voice}</p>}
        </div>

        {/* Safety Mode */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Content Safety *
          </label>
          <div className="space-y-3">
            {safetyModes.map((mode) => (
              <label
                key={mode.value}
                className={`cursor-pointer border rounded-lg p-4 transition-colors flex items-start gap-3 ${
                  data.safety === mode.value
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                }`}
              >
                <input
                  type="radio"
                  name="safety"
                  value={mode.value}
                  checked={data.safety === mode.value}
                  onChange={(e) => onChange({ safety: e.target.value as SafetyMode })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-foreground mb-1">{mode.label}</div>
                  <div className="text-sm text-muted-foreground">{mode.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.safety && <p className="text-sm text-destructive mt-1">{errors.safety}</p>}
        </div>

        {/* Banned Terms */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Banned Words/Phrases (Optional)
          </label>
          <textarea
            value={data.bannedTerms?.join(', ') || ''}
            onChange={(e) => onChange({ 
              bannedTerms: e.target.value.split(',').map(term => term.trim()).filter(Boolean)
            })}
            placeholder="Enter words or phrases to avoid, separated by commas"
            rows={2}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground mt-1">
            These words will be avoided in your generated hooks
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-3 rounded-md font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={validateAndNext}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-md font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </motion.div>
  )
}

// ==================== STEP 3: WHAT YOU MAKE ====================

const Step3WhatYouMake: React.FC<StepProps> = ({ data, onChange, onNext, onBack, isLoading }) => {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateAndSubmit = () => {
    const newErrors: Record<string, string> = {}
    
    if (!data.primaryPlatforms?.length) {
      newErrors.platforms = 'Please select at least one platform'
    }
    if (!data.contentGoals?.length) {
      newErrors.goals = 'Please select at least one content goal'
    }
    if (data.contentGoals && data.contentGoals.length > 3) {
      newErrors.goals = 'Please select up to 3 content goals'
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onNext()
    }
  }

  const platforms: { value: Platform; label: string; description: string }[] = [
    { value: 'tiktok', label: 'TikTok', description: 'Short-form vertical videos' },
    { value: 'instagram', label: 'Instagram', description: 'Reels and Stories' },
    { value: 'youtube', label: 'YouTube', description: 'Shorts and long-form content' },
  ]

  const objectives: { value: Objective; label: string; description: string }[] = [
    { value: 'watch_time', label: 'Watch Time', description: 'Keep viewers engaged longer' },
    { value: 'shares', label: 'Shares', description: 'Get people to share your content' },
    { value: 'saves', label: 'Saves', description: 'Create saveable, valuable content' },
    { value: 'ctr', label: 'Click-Through Rate', description: 'Drive traffic to your links' },
    { value: 'follows', label: 'Followers', description: 'Grow your audience' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">What You Make</h2>
        <p className="text-muted-foreground">Tell us about your content preferences and goals.</p>
      </div>

      <div className="space-y-6">
        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Primary Platforms *
          </label>
          <div className="space-y-3">
            {platforms.map((platform) => (
              <label
                key={platform.value}
                className={`cursor-pointer border rounded-lg p-4 transition-colors flex items-start gap-3 ${
                  data.primaryPlatforms?.includes(platform.value)
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={data.primaryPlatforms?.includes(platform.value) || false}
                  onChange={(e) => {
                    const platforms = data.primaryPlatforms || []
                    if (e.target.checked) {
                      onChange({ primaryPlatforms: [...platforms, platform.value] })
                    } else {
                      onChange({ primaryPlatforms: platforms.filter((p: any) => p !== platform.value) })
                    }
                  }}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-foreground mb-1">{platform.label}</div>
                  <div className="text-sm text-muted-foreground">{platform.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.platforms && <p className="text-sm text-destructive mt-1">{errors.platforms}</p>}
        </div>

        {/* Content Goals */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Content Goals * (Select up to 3)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objectives.map((objective) => (
              <label
                key={objective.value}
                className={`cursor-pointer border rounded-lg p-4 transition-colors ${
                  data.contentGoals?.includes(objective.value)
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                } ${
                  data.contentGoals && data.contentGoals.length >= 3 && !data.contentGoals.includes(objective.value)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={data.contentGoals?.includes(objective.value) || false}
                  onChange={(e) => {
                    const goals = data.contentGoals || []
                    if (e.target.checked && goals.length < 3) {
                      onChange({ contentGoals: [...goals, objective.value] })
                    } else if (!e.target.checked) {
                      onChange({ contentGoals: goals.filter((g: any) => g !== objective.value) })
                    }
                  }}
                  disabled={data.contentGoals && data.contentGoals.length >= 3 && !data.contentGoals.includes(objective.value)}
                  className="sr-only"
                />
                <div className="font-medium text-foreground mb-1">{objective.label}</div>
                <div className="text-sm text-muted-foreground">{objective.description}</div>
              </label>
            ))}
          </div>
          {errors.goals && <p className="text-sm text-destructive mt-1">{errors.goals}</p>}
        </div>

        {/* Successful Hooks */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Examples of Your Best Hooks (Optional)
          </label>
          <textarea
            value={data.successfulHooks?.join('\n') || ''}
            onChange={(e) => onChange({ 
              successfulHooks: e.target.value.split('\n').filter(Boolean)
            })}
            placeholder="Enter examples of hooks that worked well for you, one per line"
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This helps us understand what works for your audience
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={validateAndSubmit}
          disabled={isLoading}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <LoadingSpinner size="sm" />}
          {isLoading ? 'Setting up your profile...' : 'Complete Setup'}
        </button>
      </div>
    </motion.div>
  )
}

// ==================== MAIN COMPONENT ====================

const OnboardingPageContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    bannedTerms: [],
    safety: 'standard',
    primaryPlatforms: [],
    contentGoals: [],
  })

  const [, setLocation] = useLocation()
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  const { refreshUser } = useAuth()

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      console.log('🚀 Starting onboarding with data:', data)
      const response = await api.user.completeOnboarding(data)
      console.log('✅ Onboarding API response:', response.data)
      return response.data
    },
    onSuccess: async (data) => {
      console.log('🎉 Onboarding completed successfully, refreshing user context...')
      console.log('📋 Onboarding data saved:', {
        hasCompany: Boolean(data.company),
        hasIndustry: Boolean(data.industry),
        hasRole: Boolean(data.role),
        company: data.company,
        industry: data.industry,
        role: data.role
      })
      
      try {
        // Add a small delay to ensure database transaction is committed
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('⏳ Database settle delay completed')
        
        // Refresh user profile to get updated onboarding data
        await refreshUser()
        console.log('🔄 User context refreshed successfully')
        
        showSuccessNotification('Welcome to Hook Line Studio!', 'Your profile has been set up successfully.')
        
        // Small delay to ensure UI updates before navigation
        setTimeout(() => {
          console.log('🧭 Navigating to /app')
          setLocation('/app')
        }, 200)
      } catch (refreshError) {
        console.error('❌ Failed to refresh user context:', refreshError)
        showErrorNotification('Setup Warning', 'Your profile was saved but there was an issue refreshing the page. Please refresh manually.')
        // Still navigate to app even if refresh fails
        setTimeout(() => setLocation('/app'), 1000)
      }
    },
    onError: (error: any) => {
      console.error('❌ Onboarding failed:', error)
      showErrorNotification('Setup Failed', error.message || 'Failed to complete onboarding. Please try again.')
    },
  })

  const handleDataChange = (newData: Partial<OnboardingData>) => {
    setFormData((prev: any) => ({ ...prev, ...newData }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      console.log(`📝 Moving to step ${currentStep + 1}`)
      setCurrentStep(currentStep + 1)
    } else {
      // Submit onboarding data
      console.log('📋 Submitting onboarding data:', formData)
      onboardingMutation.mutate(formData as OnboardingData)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1AboutWork
            data={formData}
            onChange={handleDataChange}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <Step2HowYouSound
            data={formData}
            onChange={handleDataChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 3:
        return (
          <Step3WhatYouMake
            data={formData}
            onChange={handleDataChange}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={onboardingMutation.isPending}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of 3
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / 3) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-lg shadow-lg border p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}

const OnboardingPage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Onboarding">
      <OnboardingRoute>
        <OnboardingPageContent />
      </OnboardingRoute>
    </PageErrorBoundary>
  )
}

export default OnboardingPage