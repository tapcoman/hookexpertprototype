import { useEffect, useState, useCallback } from 'react'

interface MobileOptimizationState {
  isMobile: boolean
  isTablet: boolean
  isTouch: boolean
  orientation: 'portrait' | 'landscape'
  viewportHeight: number
  keyboardVisible: boolean
  safeAreaInsets: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export const useMobileOptimization = () => {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    orientation: 'portrait',
    viewportHeight: 0,
    keyboardVisible: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
  })

  // Detect device capabilities
  useEffect(() => {
    const updateDeviceInfo = () => {
      const isMobile = window.innerWidth <= 768
      const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      const viewportHeight = window.innerHeight

      // Detect virtual keyboard (heuristic)
      const keyboardVisible = isMobile && window.innerHeight < window.screen.height * 0.7

      // Safe area detection (simplified)
      const safeAreaInsets = {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top').replace('px', '')) || 0,
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom').replace('px', '')) || 0,
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left').replace('px', '')) || 0,
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right').replace('px', '')) || 0,
      }

      setState({
        isMobile,
        isTablet,
        isTouch,
        orientation,
        viewportHeight,
        keyboardVisible,
        safeAreaInsets
      })
    }

    updateDeviceInfo()

    // Listen for viewport changes
    const handleResize = () => updateDeviceInfo()
    const handleOrientationChange = () => setTimeout(updateDeviceInfo, 100)

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return state
}

export const useSwipeGestures = (handlers: SwipeHandlers, elementRef?: React.RefObject<HTMLElement>) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const threshold = handlers.threshold || 50

  const handleTouchStart = useCallback((e: Event) => {
    const touchEvent = e as TouchEvent
    const touch = touchEvent.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }, [])

  const handleTouchEnd = useCallback((e: Event) => {
    if (!touchStart) return

    const touchEvent = e as TouchEvent
    const touch = touchEvent.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Determine swipe direction
    if (absDeltaX > threshold || absDeltaY > threshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.()
        } else {
          handlers.onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.()
        } else {
          handlers.onSwipeUp?.()
        }
      }
    }

    setTouchStart(null)
  }, [touchStart, threshold, handlers])

  useEffect(() => {
    const element = elementRef?.current || document

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchEnd, elementRef])
}

export const useVirtualKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let initialViewportHeight = window.innerHeight

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDifference = initialViewportHeight - currentHeight

      if (heightDifference > 150) {
        // Keyboard is likely visible
        setKeyboardHeight(heightDifference)
        setIsVisible(true)
      } else {
        // Keyboard is likely hidden
        setKeyboardHeight(0)
        setIsVisible(false)
      }
    }

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height
        setKeyboardHeight(keyboardHeight)
        setIsVisible(keyboardHeight > 150)
      }
    }

    // Use Visual Viewport API if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange)
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
      } else {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return { keyboardHeight, isVisible }
}

export const usePullToRefresh = (onRefresh: () => Promise<void>, threshold = 100) => {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleTouchStart = useCallback((_e: TouchEvent) => {
    if (window.scrollY === 0) {
      setPullDistance(0)
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0]
      const startY = 0 // Simplified - you might want to track actual start position
      const currentY = touch.clientY
      const distance = Math.max(0, currentY - startY)
      
      setPullDistance(distance)

      if (distance > threshold) {
        e.preventDefault() // Prevent default scroll
      }
    }
  }, [isPulling, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (isPulling) {
      setIsPulling(false)
      
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min(100, (pullDistance / threshold) * 100)
  }
}

export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const lightImpact = useCallback(() => vibrate(10), [vibrate])
  const mediumImpact = useCallback(() => vibrate(20), [vibrate])
  const heavyImpact = useCallback(() => vibrate([30, 10, 30]), [vibrate])
  const selectionChanged = useCallback(() => vibrate(5), [vibrate])

  return {
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
    selectionChanged
  }
}

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Network Information API (experimental)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType || 'unknown')

      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown')
      }

      connection.addEventListener('change', handleConnectionChange)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, connectionType }
}