import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useAuth } from './SimpleAuthContext'

// ==================== TYPES ====================

interface UIState {
  // Mobile navigation
  isMobileSidebarOpen: boolean
  
  // Modals and overlays
  isOnboardingModalOpen: boolean
  isUpgradeModalOpen: boolean
  isDeleteAccountModalOpen: boolean
  
  // Loading states
  isGeneratingHooks: boolean
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'system'
  
  // Notifications
  notifications: Notification[]
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface GenerationState {
  // Current generation in progress
  currentGeneration: any | null
  
  // Recent generations cache
  recentGenerations: any[]
  
  // Generation preferences
  defaultPlatform: string | null
  defaultObjective: string | null
}

interface AppContextValue {
  // UI State
  ui: UIState
  
  // Generation State  
  generation: GenerationState
  
  // UI Actions
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  openOnboardingModal: () => void
  closeOnboardingModal: () => void
  openUpgradeModal: () => void
  closeUpgradeModal: () => void
  openDeleteAccountModal: () => void
  closeDeleteAccountModal: () => void
  setGeneratingHooks: (loading: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Generation Actions
  setCurrentGeneration: (generation: any | null) => void
  addRecentGeneration: (generation: any) => void
  clearRecentGenerations: () => void
  setDefaultPlatform: (platform: string | null) => void
  setDefaultObjective: (objective: string | null) => void
  
  // Utility methods
  showSuccessNotification: (title: string, message: string) => void
  showErrorNotification: (title: string, message: string) => void
  showWarningNotification: (title: string, message: string) => void
  showInfoNotification: (title: string, message: string) => void
}

// ==================== CONTEXT ====================

const AppContext = createContext<AppContextValue | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// ==================== INITIAL STATES ====================

const initialUIState: UIState = {
  isMobileSidebarOpen: false,
  isOnboardingModalOpen: false,
  isUpgradeModalOpen: false,
  isDeleteAccountModalOpen: false,
  isGeneratingHooks: false,
  theme: 'system',
  notifications: [],
}

const initialGenerationState: GenerationState = {
  currentGeneration: null,
  recentGenerations: [],
  defaultPlatform: null,
  defaultObjective: null,
}

// ==================== PROVIDER ====================

interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [ui, setUI] = useState<UIState>(initialUIState)
  const [generation, setGeneration] = useState<GenerationState>(initialGenerationState)
  
  const { user } = useAuth()

  // ==================== PERSISTENCE ====================

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('hook-line-studio-theme') as 'light' | 'dark' | 'system'
      const savedDefaultPlatform = localStorage.getItem('hook-line-studio-default-platform')
      const savedDefaultObjective = localStorage.getItem('hook-line-studio-default-objective')
      
      if (savedTheme) {
        setUI(prev => ({ ...prev, theme: savedTheme }))
      }
      
      if (savedDefaultPlatform || savedDefaultObjective) {
        setGeneration(prev => ({
          ...prev,
          defaultPlatform: savedDefaultPlatform,
          defaultObjective: savedDefaultObjective,
        }))
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage:', error)
    }
  }, [])

  // Save theme to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('hook-line-studio-theme', ui.theme)
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error)
    }
  }, [ui.theme])

  // Save generation preferences to localStorage
  useEffect(() => {
    try {
      if (generation.defaultPlatform) {
        localStorage.setItem('hook-line-studio-default-platform', generation.defaultPlatform)
      }
      if (generation.defaultObjective) {
        localStorage.setItem('hook-line-studio-default-objective', generation.defaultObjective)
      }
    } catch (error) {
      console.error('Failed to save generation preferences to localStorage:', error)
    }
  }, [generation.defaultPlatform, generation.defaultObjective])

  // Clear recent generations when user changes
  useEffect(() => {
    if (!user) {
      setGeneration(prev => ({
        ...prev,
        recentGenerations: [],
        currentGeneration: null,
      }))
    }
  }, [user])

  // ==================== UI ACTIONS ====================

  const toggleMobileSidebar = () => {
    setUI(prev => ({ ...prev, isMobileSidebarOpen: !prev.isMobileSidebarOpen }))
  }

  const closeMobileSidebar = () => {
    setUI(prev => ({ ...prev, isMobileSidebarOpen: false }))
  }

  const openOnboardingModal = () => {
    setUI(prev => ({ ...prev, isOnboardingModalOpen: true }))
  }

  const closeOnboardingModal = () => {
    setUI(prev => ({ ...prev, isOnboardingModalOpen: false }))
  }

  const openUpgradeModal = () => {
    setUI(prev => ({ ...prev, isUpgradeModalOpen: true }))
  }

  const closeUpgradeModal = () => {
    setUI(prev => ({ ...prev, isUpgradeModalOpen: false }))
  }

  const openDeleteAccountModal = () => {
    setUI(prev => ({ ...prev, isDeleteAccountModalOpen: true }))
  }

  const closeDeleteAccountModal = () => {
    setUI(prev => ({ ...prev, isDeleteAccountModalOpen: false }))
  }

  const setGeneratingHooks = (loading: boolean) => {
    setUI(prev => ({ ...prev, isGeneratingHooks: loading }))
  }

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setUI(prev => ({ ...prev, theme }))
  }

  // ==================== NOTIFICATION ACTIONS ====================

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2)
    const newNotification: Notification = { ...notification, id }
    
    setUI(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification],
    }))

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id: string) => {
    setUI(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }))
  }

  const clearNotifications = () => {
    setUI(prev => ({ ...prev, notifications: [] }))
  }

  // ==================== GENERATION ACTIONS ====================

  const setCurrentGeneration = (generation: any | null) => {
    setGeneration(prev => ({ ...prev, currentGeneration: generation }))
  }

  const addRecentGeneration = (newGeneration: any) => {
    setGeneration(prev => ({
      ...prev,
      recentGenerations: [newGeneration, ...prev.recentGenerations.slice(0, 9)], // Keep last 10
    }))
  }

  const clearRecentGenerations = () => {
    setGeneration(prev => ({ ...prev, recentGenerations: [] }))
  }

  const setDefaultPlatform = (platform: string | null) => {
    setGeneration(prev => ({ ...prev, defaultPlatform: platform }))
  }

  const setDefaultObjective = (objective: string | null) => {
    setGeneration(prev => ({ ...prev, defaultObjective: objective }))
  }

  // ==================== UTILITY METHODS ====================

  const showSuccessNotification = (title: string, message: string) => {
    addNotification({ type: 'success', title, message })
  }

  const showErrorNotification = (title: string, message: string) => {
    addNotification({ type: 'error', title, message, duration: 8000 })
  }

  const showWarningNotification = (title: string, message: string) => {
    addNotification({ type: 'warning', title, message, duration: 6000 })
  }

  const showInfoNotification = (title: string, message: string) => {
    addNotification({ type: 'info', title, message })
  }

  // ==================== CONTEXT VALUE ====================

  const contextValue: AppContextValue = {
    ui,
    generation,
    
    // UI Actions
    toggleMobileSidebar,
    closeMobileSidebar,
    openOnboardingModal,
    closeOnboardingModal,
    openUpgradeModal,
    closeUpgradeModal,
    openDeleteAccountModal,
    closeDeleteAccountModal,
    setGeneratingHooks,
    setTheme,
    
    // Notification Actions
    addNotification,
    removeNotification,
    clearNotifications,
    
    // Generation Actions
    setCurrentGeneration,
    addRecentGeneration,
    clearRecentGenerations,
    setDefaultPlatform,
    setDefaultObjective,
    
    // Utility methods
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// ==================== HOOKS ====================

// Custom hook for UI state only
export const useUIState = () => {
  const { ui } = useApp()
  return ui
}

// Custom hook for UI actions only
export const useUIActions = () => {
  const {
    toggleMobileSidebar,
    closeMobileSidebar,
    openOnboardingModal,
    closeOnboardingModal,
    openUpgradeModal,
    closeUpgradeModal,
    openDeleteAccountModal,
    closeDeleteAccountModal,
    setGeneratingHooks,
    setTheme,
  } = useApp()
  
  return {
    toggleMobileSidebar,
    closeMobileSidebar,
    openOnboardingModal,
    closeOnboardingModal,
    openUpgradeModal,
    closeUpgradeModal,
    openDeleteAccountModal,
    closeDeleteAccountModal,
    setGeneratingHooks,
    setTheme,
  }
}

// Custom hook for notifications
export const useNotifications = () => {
  const {
    ui: { notifications },
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  } = useApp()
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  }
}

// Custom hook for generation state
export const useGenerationState = () => {
  const {
    generation,
    setCurrentGeneration,
    addRecentGeneration,
    clearRecentGenerations,
    setDefaultPlatform,
    setDefaultObjective,
  } = useApp()
  
  return {
    ...generation,
    setCurrentGeneration,
    addRecentGeneration,
    clearRecentGenerations,
    setDefaultPlatform,
    setDefaultObjective,
  }
}