import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Building, Users, Briefcase, MessageCircle } from 'lucide-react'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import type { OnboardingData, Industry, UserRole } from '../../../shared/types'
import { cn } from '../../lib/utils'

const OnboardingStep1: React.FC = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<OnboardingData>()
  
  const watchedValues = watch()

  const industries: { value: Industry; label: string; description: string }[] = [
    { value: 'agency', label: 'Marketing Agency', description: 'Digital marketing and advertising' },
    { value: 'creator', label: 'Content Creator', description: 'Individual content creation' },
    { value: 'ecommerce', label: 'E-commerce', description: 'Online retail and products' },
    { value: 'saas', label: 'SaaS/Technology', description: 'Software and tech products' },
    { value: 'local-business', label: 'Local Business', description: 'Local services and retail' },
    { value: 'education', label: 'Education', description: 'Learning and training' },
    { value: 'healthcare', label: 'Healthcare', description: 'Medical and wellness' },
    { value: 'finance', label: 'Finance', description: 'Financial services' },
    { value: 'fitness', label: 'Fitness', description: 'Health and fitness' },
    { value: 'beauty', label: 'Beauty', description: 'Cosmetics and skincare' },
    { value: 'food', label: 'Food & Beverage', description: 'Restaurants and food brands' },
    { value: 'technology', label: 'Technology', description: 'Tech hardware and services' },
    { value: 'real-estate', label: 'Real Estate', description: 'Property and real estate' },
    { value: 'consulting', label: 'Consulting', description: 'Business consulting' },
    { value: 'other', label: 'Other', description: 'Something else' },
  ]

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'founder-ceo', label: 'Founder/CEO', description: 'Business owner or executive' },
    { value: 'marketing-manager', label: 'Marketing Manager', description: 'Marketing strategy and campaigns' },
    { value: 'content-creator', label: 'Content Creator', description: 'Full-time content creation' },
    { value: 'social-media-manager', label: 'Social Media Manager', description: 'Social media strategy' },
    { value: 'video-editor', label: 'Video Editor', description: 'Video production and editing' },
    { value: 'freelancer', label: 'Freelancer', description: 'Independent contractor' },
    { value: 'agency-owner', label: 'Agency Owner', description: 'Marketing agency owner' },
    { value: 'student', label: 'Student', description: 'Learning and studying' },
    { value: 'other', label: 'Other', description: 'Different role' },
  ]

  return (
    <div className="space-y-8">
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="company" className="flex items-center gap-2 text-base">
          <Building className="w-4 h-4" />
          Company or Brand Name
        </Label>
        <Input
          id="company"
          {...register('company')}
          placeholder="Enter your company or personal brand name"
          className={cn(errors.company && "border-destructive")}
        />
        {errors.company && (
          <p className="text-sm text-destructive">{errors.company.message}</p>
        )}
      </div>

      {/* Industry Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base">
          <Briefcase className="w-4 h-4" />
          Industry
        </Label>
        <Select 
          value={watchedValues.industry} 
          onValueChange={(value: Industry) => setValue('industry', value, { shouldValidate: true })}
        >
          <SelectTrigger className={cn(errors.industry && "border-destructive")}>
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem key={industry.value} value={industry.value}>
                <div className="flex flex-col">
                  <span>{industry.label}</span>
                  <span className="text-xs text-muted-foreground">{industry.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.industry && (
          <p className="text-sm text-destructive">{errors.industry.message}</p>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          Your Role
        </Label>
        <Select 
          value={watchedValues.role} 
          onValueChange={(value: UserRole) => setValue('role', value, { shouldValidate: true })}
        >
          <SelectTrigger className={cn(errors.role && "border-destructive")}>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                <div className="flex flex-col">
                  <span>{role.label}</span>
                  <span className="text-xs text-muted-foreground">{role.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="audience" className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4" />
          Target Audience
        </Label>
        <Textarea
          id="audience"
          {...register('audience')}
          placeholder="Describe your target audience (e.g., millennials interested in productivity, small business owners, fitness enthusiasts aged 25-40...)"
          className={cn("min-h-[100px] resize-none", errors.audience && "border-destructive")}
        />
        {errors.audience && (
          <p className="text-sm text-destructive">{errors.audience.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Be specific about demographics, interests, and pain points. This helps us create more targeted hooks.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Great! Next we'll define your brand voice and content guidelines.
        </p>
      </div>
    </div>
  )
}

export default OnboardingStep1