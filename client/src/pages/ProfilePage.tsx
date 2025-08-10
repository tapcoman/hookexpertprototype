import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { ProtectedRoute } from '@/components/routing/SimpleProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Separator } from '@/components/ui/separator'
import { User, Settings, Palette, Target, Shield, CreditCard, LogOut } from 'lucide-react'
import type { UserProfile } from '@/types/shared'
import type { Tone } from '@/components/hle/types'

const TONE_OPTIONS: Tone[] = [
  'friendly',
  'authoritative',
  'playful',
  'inspirational',
  'professional',
  'bold',
  'casual',
  'educational',
  'witty',
]

const ProfilePageContent: React.FC = () => {
  const { user, updateProfile, updatePassword, signOut } = useAuth()
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  
  // Basic profile data
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    company: user?.company || '',
    industry: user?.industry || '',
    role: user?.role || '',
    audience: user?.audience || '',
  })

  // Brand settings from localStorage and user profile
  const [brandSettings, setBrandSettings] = useState({
    brandVoice: '',
    audience: '',
    bannedTerms: [] as string[],
    tones: [] as Tone[],
  })

  const [bannedTermsInput, setBannedTermsInput] = useState('')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [activeTab, setActiveTab] = useState<'profile' | 'brand' | 'password' | 'account'>('profile')

  // Load brand settings from localStorage on mount
  useEffect(() => {
    const voice = localStorage.getItem('hle:brandVoice') || ''
    const aud = localStorage.getItem('hle:audience') || ''
    const banned = localStorage.getItem('hle:bannedTerms') || '[]'
    const tonesRaw = localStorage.getItem('hle:tones') || '[]'
    
    try {
      const bannedTerms = JSON.parse(banned)
      const tones = JSON.parse(tonesRaw)
      setBrandSettings({
        brandVoice: voice,
        audience: aud,
        bannedTerms,
        tones,
      })
      setBannedTermsInput(bannedTerms.join(', '))
    } catch (error) {
      console.error('Error loading brand settings:', error)
    }
  }, [])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      await updateProfile(data)
    },
    onSuccess: () => {
      showSuccessNotification('Profile Updated', 'Your profile has been updated successfully.')
    },
    onError: (error: any) => {
      showErrorNotification('Update Failed', error.message)
    },
  })

  const updateBrandMutation = useMutation({
    mutationFn: async (data: typeof brandSettings) => {
      // Save to localStorage first
      localStorage.setItem('hle:brandVoice', data.brandVoice)
      localStorage.setItem('hle:audience', data.audience)
      localStorage.setItem('hle:bannedTerms', JSON.stringify(data.bannedTerms))
      localStorage.setItem('hle:tones', JSON.stringify(data.tones))
      
      // Sync with backend if user is authenticated
      if (user) {
        await updateProfile({
          brandVoice: data.brandVoice,
          audience: data.audience,
          bannedTerms: data.bannedTerms,
          tones: data.tones
        })
      }
    },
    onSuccess: () => {
      showSuccessNotification('Brand Settings Updated', 'Your brand preferences have been saved.')
    },
    onError: (error: any) => {
      showErrorNotification('Update Failed', error.message)
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword:string, newPassword: string }) => {
      await updatePassword(currentPassword, newPassword)
    },
    onSuccess: () => {
      showSuccessNotification('Password Updated', 'Your password has been changed successfully.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error: any) => {
      showErrorNotification('Password Update Failed', error.message)
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileData)
  }

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const terms = bannedTermsInput
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    
    const updatedSettings = {
      ...brandSettings,
      bannedTerms: terms,
    }
    
    setBrandSettings(updatedSettings)
    updateBrandMutation.mutate(updatedSettings)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorNotification('Password Mismatch', 'New passwords do not match.')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showErrorNotification('Password Too Short', 'Password must be at least 6 characters long.')
      return
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })
  }

  const toggleTone = (tone: Tone) => {
    setBrandSettings(prev => ({
      ...prev,
      tones: prev.tones.includes(tone) 
        ? prev.tones.filter(t => t !== tone)
        : [...prev.tones, tone]
    }))
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'brand', label: 'Brand Settings', icon: Palette },
    { id: 'password', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account & Billing', icon: CreditCard },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your profile, brand voice, and account preferences</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Profile Information</h2>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <Separator className="my-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={profileData.industry}
                    onChange={(e) => setProfileData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={profileData.role}
                  onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Content Creator, Marketing Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Textarea
                  id="audience"
                  value={profileData.audience}
                  onChange={(e) => setProfileData(prev => ({ ...prev, audience: e.target.value }))}
                  rows={3}
                  placeholder="e.g., busy millennials trying to cut sugar"
                />
              </div>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full md:w-auto"
              >
                {updateProfileMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                Update Profile
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold">Brand Settings</h2>
                <p className="text-sm text-muted-foreground">Configure your brand voice and content preferences</p>
              </div>
            </div>
            
            <form onSubmit={handleBrandSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandVoice">Brand Voice</Label>
                <Input
                  id="brandVoice"
                  value={brandSettings.brandVoice}
                  onChange={(e) => setBrandSettings(prev => ({ ...prev, brandVoice: e.target.value }))}
                  placeholder="e.g., evidence-led, no fluff, practical"
                />
                <p className="text-xs text-muted-foreground">
                  Describe your brand's personality and communication style
                </p>
              </div>

              <div className="space-y-3">
                <Label>Tone of Voice</Label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => {
                    const isSelected = brandSettings.tones.includes(tone)
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => toggleTone(tone)}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                          isSelected
                            ? 'bg-foreground text-background'
                            : 'bg-muted/30 text-foreground hover:bg-muted'
                        }`}
                      >
                        {tone}
                      </button>
                    )
                  })}
                </div>
                {brandSettings.tones.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {brandSettings.tones.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandAudience">Target Audience</Label>
                <Input
                  id="brandAudience"
                  value={brandSettings.audience}
                  onChange={(e) => setBrandSettings(prev => ({ ...prev, audience: e.target.value }))}
                  placeholder="e.g., busy millennials trying to cut sugar"
                />
                <p className="text-xs text-muted-foreground">
                  Who are you creating content for?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannedTerms">Banned Terms</Label>
                <Textarea
                  id="bannedTerms"
                  value={bannedTermsInput}
                  onChange={(e) => setBannedTermsInput(e.target.value)}
                  rows={3}
                  placeholder="comma-separated list"
                />
                <p className="text-xs text-muted-foreground">
                  Terms to exclude from generated content. We'll avoid these in all outputs.
                </p>
                {bannedTermsInput && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bannedTermsInput
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .slice(0, 8)
                      .map((term, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={updateBrandMutation.isPending}
                className="w-full md:w-auto"
              >
                {updateBrandMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                Save Brand Settings
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold">Security</h2>
                <p className="text-sm text-muted-foreground">Update your password and security settings</p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="w-full md:w-auto"
              >
                {updatePasswordMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                Update Password
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold">Account & Billing</h2>
                <p className="text-sm text-muted-foreground">Manage your subscription and account details</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-3">Subscription</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan:</span>
                        <Badge variant="outline">{user?.subscriptionPlan || 'Free'}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                          {user?.subscriptionStatus || 'Free'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credits Used:</span>
                        <span>{user?.usedCredits || 0} / {user?.freeCredits || 5}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-3">Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Member since:</span>
                        <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account ID:</span>
                        <span className="font-mono text-xs">{user?.id?.slice(-8) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => window.location.href = '/billing'}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('brand')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Update Brand Settings
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Danger Zone</h3>
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    if (confirm('Are you sure you want to logout?')) {
                      await signOut()
                      window.location.href = '/auth'
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const ProfilePage: React.FC = () => {
  return (
    <PageErrorBoundary pageName="Profile">
      <ProtectedRoute requireAuth requireOnboarding>
        <ProfilePageContent />
      </ProtectedRoute>
    </PageErrorBoundary>
  )
}

export default ProfilePage