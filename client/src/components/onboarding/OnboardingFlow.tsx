import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Progress } from '../ui/Progress'
import OnboardingStep1 from './OnboardingStep1'
import OnboardingStep2 from './OnboardingStep2'
import OnboardingStep3 from './OnboardingStep3'
import { OnboardingDataSchema, type OnboardingData } from '@/types/shared'
import { cn } from '../../lib/utils'

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void
  isLoading?: boolean
  className?: string
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  isLoading = false,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const methods = useForm<OnboardingData>({
    resolver: zodResolver(OnboardingDataSchema),
    mode: 'onChange',
    defaultValues: {
      bannedTerms: [],
      safety: 'standard',
      primaryPlatforms: [],
      contentGoals: [],
      successfulHooks: []
    }
  })

  const { handleSubmit, trigger, formState: { isValid: _isValid, errors } } = methods

  const steps = [
    {
      number: 1,
      title: 'About Your Work',
      description: 'Tell us about your business and audience',
      component: OnboardingStep1
    },
    {
      number: 2,
      title: 'How You Sound',
      description: 'Define your brand voice and content guidelines',
      component: OnboardingStep2
    },
    {
      number: 3,
      title: 'What You Make',
      description: 'Share your content strategy and goals',
      component: OnboardingStep3
    }
  ]

  const currentStepData = steps[currentStep - 1]
  const StepComponent = currentStepData.component
  const progress = (currentStep / totalSteps) * 100

  const nextStep = async () => {
    const isStepValid = await trigger()
    if (isStepValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = (data: OnboardingData) => {
    onComplete(data)
  }

  const canProceed = () => {
    // Check if current step has required fields filled
    const formData = methods.getValues()
    
    switch (currentStep) {
      case 1:
        return formData.company && formData.industry && formData.role && formData.audience
      case 2:
        return formData.voice && formData.safety
      case 3:
        return formData.primaryPlatforms.length > 0 && formData.contentGoals.length > 0
      default:
        return false
    }
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <FormProvider {...methods}>
        <Card>
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-2xl">Welcome to Hook Line Studio</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Let's personalize your hook generation experience
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                {steps.map((step) => (
                  <div 
                    key={step.number}
                    className={cn(
                      "flex items-center",
                      currentStep >= step.number ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2",
                      currentStep > step.number 
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.number
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {currentStep > step.number ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className="hidden md:inline">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Step Header */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
                <p className="text-muted-foreground">{currentStepData.description}</p>
              </div>

              {/* Step Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[400px]"
              >
                <StepComponent />
              </motion.div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!canProceed() || isLoading}
                    className="flex items-center gap-2 min-w-[120px]"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Error Summary */}
              {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium mb-2">
                    Please fix the following errors:
                  </p>
                  <ul className="text-sm text-destructive space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-destructive rounded-full" />
                        {error?.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </FormProvider>
    </div>
  )
}

export default OnboardingFlow