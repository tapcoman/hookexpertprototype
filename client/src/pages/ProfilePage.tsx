import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/AppContext'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { UserProfile } from '../../shared/types'

const ProfilePageContent: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth()
  const { showSuccessNotification, showErrorNotification } = useNotifications()
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    company: user?.company || '',
    audience: user?.audience || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile')

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

  const tabs = [
    { id: 'profile', label: 'Profile Information' },
    { id: 'password', label: 'Change Password' },
    { id: 'preferences', label: 'Preferences' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-b border-border mb-6"
      >
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company
              </label>
              <input
                type="text"
                value={profileData.company}
                onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Audience
              </label>
              <textarea
                value={profileData.audience}
                onChange={(e) => setProfileData(prev => ({ ...prev, audience: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updateProfileMutation.isPending && <LoadingSpinner size="sm" />}
              Update Profile
            </button>
          </form>
        </motion.div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updatePasswordMutation.isPending && <LoadingSpinner size="sm" />}
              Update Password
            </button>
          </form>
        </motion.div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-foreground mb-2">Account Information</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Subscription: {user?.subscriptionPlan || 'Free'}</p>
                <p>Status: {user?.subscriptionStatus || 'Free'}</p>
                <p>Credits Used: {user?.usedCredits || 0} / {user?.freeCredits || 5}</p>
                <p>Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-2">Content Settings</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Industry: {user?.industry || 'Not specified'}</p>
                <p>Role: {user?.role || 'Not specified'}</p>
                <p>Voice: {user?.voice || 'Not specified'}</p>
                <p>Safety Mode: {user?.safety || 'Standard'}</p>
              </div>
            </div>

            <a
              href="/onboarding"
              className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
            >
              Update Content Preferences
            </a>
          </div>
        </motion.div>
      )}
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