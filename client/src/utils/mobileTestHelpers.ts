// Mobile Testing Utilities for Hook Line Studio

export interface DeviceViewport {
  width: number
  height: number
  pixelRatio: number
  userAgent: string
  name: string
}

export const DEVICE_VIEWPORTS: Record<string, DeviceViewport> = {
  // iPhone devices
  'iPhone SE': {
    width: 375,
    height: 667,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    name: 'iPhone SE'
  },
  'iPhone 12': {
    width: 390,
    height: 844,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    name: 'iPhone 12'
  },
  'iPhone 12 Pro Max': {
    width: 428,
    height: 926,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    name: 'iPhone 12 Pro Max'
  },
  'iPhone 14 Pro': {
    width: 393,
    height: 852,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    name: 'iPhone 14 Pro'
  },
  
  // Android devices
  'Pixel 5': {
    width: 393,
    height: 851,
    pixelRatio: 2.75,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    name: 'Pixel 5'
  },
  'Pixel 7 Pro': {
    width: 412,
    height: 915,
    pixelRatio: 3.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36',
    name: 'Pixel 7 Pro'
  },
  'Galaxy S21': {
    width: 384,
    height: 854,
    pixelRatio: 2.75,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36',
    name: 'Galaxy S21'
  },
  
  // Tablets
  'iPad': {
    width: 768,
    height: 1024,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    name: 'iPad'
  },
  'iPad Pro 12.9': {
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    name: 'iPad Pro 12.9'
  }
}

export interface TouchSimulation {
  x: number
  y: number
  force?: number
  radiusX?: number
  radiusY?: number
}

export class MobileTestSimulator {
  private originalViewport: { width: number; height: number }
  private originalUserAgent: string

  constructor() {
    this.originalViewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    this.originalUserAgent = navigator.userAgent
  }

  // Simulate device viewport
  setDevice(deviceName: keyof typeof DEVICE_VIEWPORTS) {
    const device = DEVICE_VIEWPORTS[deviceName]
    if (!device) {
      throw new Error(`Device ${deviceName} not found`)
    }

    // Resize viewport
    window.resizeTo(device.width, device.height)
    
    // Set pixel ratio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: device.pixelRatio
    })

    // Mock user agent (for testing)
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: device.userAgent
    })

    return this
  }

  // Simulate touch events
  simulateTouch(element: Element, type: 'touchstart' | 'touchmove' | 'touchend', touches: TouchSimulation[]) {
    const touchList = touches.map((touch, index) => ({
      identifier: index,
      target: element,
      clientX: touch.x,
      clientY: touch.y,
      screenX: touch.x,
      screenY: touch.y,
      pageX: touch.x,
      pageY: touch.y,
      force: touch.force || 1,
      radiusX: touch.radiusX || 1,
      radiusY: touch.radiusY || 1,
      rotationAngle: 0
    }))

    const touchEvent = new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === 'touchend' ? [] : touchList,
      targetTouches: type === 'touchend' ? [] : touchList,
      changedTouches: touchList
    })

    element.dispatchEvent(touchEvent)
    return this
  }

  // Simulate swipe gesture
  simulateSwipe(
    element: Element, 
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100,
    duration: number = 300
  ) {
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    let startX = centerX
    let startY = centerY
    let endX = centerX
    let endY = centerY

    switch (direction) {
      case 'left':
        endX = startX - distance
        break
      case 'right':
        endX = startX + distance
        break
      case 'up':
        endY = startY - distance
        break
      case 'down':
        endY = startY + distance
        break
    }

    // Start touch
    this.simulateTouch(element, 'touchstart', [{ x: startX, y: startY }])

    // Simulate movement over time
    const steps = 10
    const stepDuration = duration / steps
    const stepX = (endX - startX) / steps
    const stepY = (endY - startY) / steps

    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        this.simulateTouch(element, 'touchmove', [{
          x: startX + stepX * i,
          y: startY + stepY * i
        }])

        if (i === steps) {
          this.simulateTouch(element, 'touchend', [{
            x: endX,
            y: endY
          }])
        }
      }, stepDuration * i)
    }

    return this
  }

  // Simulate pinch gesture
  simulatePinch(element: Element, scale: number, duration: number = 300) {
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const initialDistance = 100

    const touch1Start = { x: centerX - initialDistance / 2, y: centerY }
    const touch2Start = { x: centerX + initialDistance / 2, y: centerY }

    const finalDistance = initialDistance * scale
    const touch1End = { x: centerX - finalDistance / 2, y: centerY }
    const touch2End = { x: centerX + finalDistance / 2, y: centerY }

    // Start pinch
    this.simulateTouch(element, 'touchstart', [touch1Start, touch2Start])

    // Simulate pinch movement
    const steps = 10
    const stepDuration = duration / steps

    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        const progress = i / steps
        const touch1Current = {
          x: touch1Start.x + (touch1End.x - touch1Start.x) * progress,
          y: touch1Start.y + (touch1End.y - touch1Start.y) * progress
        }
        const touch2Current = {
          x: touch2Start.x + (touch2End.x - touch2Start.x) * progress,
          y: touch2Start.y + (touch2End.y - touch2Start.y) * progress
        }

        this.simulateTouch(element, 'touchmove', [touch1Current, touch2Current])

        if (i === steps) {
          this.simulateTouch(element, 'touchend', [touch1End, touch2End])
        }
      }, stepDuration * i)
    }

    return this
  }

  // Test orientation change
  simulateOrientationChange(orientation: 'portrait' | 'landscape') {
    const device = DEVICE_VIEWPORTS['iPhone 12'] // Default device for testing
    
    if (orientation === 'landscape') {
      window.resizeTo(device.height, device.width)
    } else {
      window.resizeTo(device.width, device.height)
    }

    // Dispatch orientation change event
    window.dispatchEvent(new Event('orientationchange'))
    
    return this
  }

  // Test network conditions
  simulateNetworkCondition(condition: 'offline' | 'slow-3g' | '4g' | 'wifi') {
    // Mock navigator.connection if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const conditionMap = {
        'offline': { effectiveType: 'offline', downlink: 0 },
        'slow-3g': { effectiveType: 'slow-2g', downlink: 0.05 },
        '4g': { effectiveType: '4g', downlink: 10 },
        'wifi': { effectiveType: '4g', downlink: 50 }
      }

      Object.assign(connection, conditionMap[condition])
      connection.dispatchEvent(new Event('change'))
    }

    // Simulate offline/online events
    if (condition === 'offline') {
      window.dispatchEvent(new Event('offline'))
    } else {
      window.dispatchEvent(new Event('online'))
    }

    return this
  }

  // Restore original state
  restore() {
    window.resizeTo(this.originalViewport.width, this.originalViewport.height)
    
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: this.originalUserAgent
    })

    return this
  }
}

// Utility functions for testing mobile UI
export const mobileTestUtils = {
  // Check if element is touch-friendly (44px minimum)
  isTouchFriendly: (element: Element): boolean => {
    const rect = element.getBoundingClientRect()
    return rect.width >= 44 && rect.height >= 44
  },

  // Check if text is readable on mobile
  isTextReadable: (element: Element): boolean => {
    const styles = window.getComputedStyle(element)
    const fontSize = parseInt(styles.fontSize)
    return fontSize >= 16 // iOS minimum for avoiding zoom
  },

  // Check if element is within safe area
  isInSafeArea: (element: Element): boolean => {
    const rect = element.getBoundingClientRect()
    const safeArea = {
      top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top').replace('px', '')) || 0,
      bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom').replace('px', '')) || 0,
      left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left').replace('px', '')) || 0,
      right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right').replace('px', '')) || 0
    }

    return (
      rect.top >= safeArea.top &&
      rect.bottom <= window.innerHeight - safeArea.bottom &&
      rect.left >= safeArea.left &&
      rect.right <= window.innerWidth - safeArea.right
    )
  },

  // Performance testing
  measureScrollPerformance: async (element: Element, scrollDistance: number): Promise<number> => {
    const startTime = performance.now()
    
    element.scrollTo({
      top: scrollDistance,
      behavior: 'smooth'
    })

    // Wait for scroll to complete
    await new Promise(resolve => {
      const checkScroll = () => {
        if (Math.abs(element.scrollTop - scrollDistance) < 1) {
          resolve(true)
        } else {
          requestAnimationFrame(checkScroll)
        }
      }
      checkScroll()
    })

    return performance.now() - startTime
  },

  // Check for accessibility issues
  checkMobileAccessibility: (element: Element): string[] => {
    const issues: string[] = []
    
    // Check touch target size
    if (!mobileTestUtils.isTouchFriendly(element)) {
      issues.push('Touch target too small (minimum 44px)')
    }

    // Check text size
    if (!mobileTestUtils.isTextReadable(element)) {
      issues.push('Text too small for mobile (minimum 16px)')
    }

    // Check contrast (simplified)
    const styles = window.getComputedStyle(element)
    const backgroundColor = styles.backgroundColor
    const color = styles.color
    
    if (backgroundColor === 'rgba(0, 0, 0, 0)' && color === 'rgb(0, 0, 0)') {
      issues.push('Insufficient color contrast')
    }

    return issues
  }
}

export default MobileTestSimulator