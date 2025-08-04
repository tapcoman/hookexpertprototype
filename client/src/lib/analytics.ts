import { v4 as uuidv4 } from 'uuid'

// ==================== ANALYTICS CONFIGURATION ====================

interface AnalyticsConfig {
  apiEndpoint: string
  sessionId: string
  userId?: string
  consentLevel: 'none' | 'essential' | 'analytics' | 'all'
}

class Analytics {
  private config: AnalyticsConfig
  private sessionId: string
  private userId?: string
  private queue: any[] = []
  private isInitialized = false

  constructor() {
    this.sessionId = uuidv4()
    this.config = {
      apiEndpoint: '/api/analytics',
      sessionId: this.sessionId,
      consentLevel: 'essential'
    }
  }

  // ==================== INITIALIZATION ====================

  init(userId?: string, consentLevel: 'none' | 'essential' | 'analytics' | 'all' = 'essential') {
    this.userId = userId
    this.config.userId = userId
    this.config.consentLevel = consentLevel
    this.isInitialized = true

    // Process queued events
    this.processQueue()

    // Start Web Vitals tracking if consent is given
    if (consentLevel === 'analytics' || consentLevel === 'all') {
      this.startWebVitalsTracking()
      this.startErrorTracking()
    }

    console.log('Analytics initialized', { userId, consentLevel, sessionId: this.sessionId })
  }

  updateConsent(consentLevel: 'none' | 'essential' | 'analytics' | 'all') {
    this.config.consentLevel = consentLevel
    
    if (consentLevel === 'analytics' || consentLevel === 'all') {
      this.startWebVitalsTracking()
      this.startErrorTracking()
    }
  }

  // ==================== EVENT TRACKING ====================

  track(eventType: string, eventData: Record<string, any> = {}, forceTrack = false) {
    if (!this.hasAnalyticsConsent() && !forceTrack) {
      return
    }

    const event = {
      sessionId: this.sessionId,
      eventType,
      eventData,
      deviceInfo: this.getDeviceInfo(),
      pageInfo: this.getPageInfo(),
      timestamp: new Date().toISOString()
    }

    if (!this.isInitialized) {
      this.queue.push(event)
      return
    }

    this.sendEvent('events', event)
  }

  // ==================== USER JOURNEY TRACKING ====================

  trackJourneyStep(
    stage: 'landing' | 'signup' | 'onboarding' | 'first_generation' | 'subscription',
    step: string,
    action: 'viewed' | 'clicked' | 'completed' | 'abandoned',
    metadata: Record<string, any> = {}
  ) {
    if (!this.hasAnalyticsConsent()) {
      return
    }

    const journeyData = {
      sessionId: this.sessionId,
      stage,
      step,
      action,
      metadata,
      timestamp: new Date().toISOString()
    }

    this.sendEvent('journey', journeyData)
  }

  // ==================== WEB VITALS TRACKING ====================

  private startWebVitalsTracking() {
    // Track Core Web Vitals using the web-vitals library approach
    this.trackLCP()
    this.trackFID()
    this.trackCLS()
    this.trackFCP()
    this.trackTTFB()
  }

  private trackLCP() {
    // Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.sendWebVital('lcp', Math.round(lastEntry.startTime))
    })

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (e) {
      // LCP not supported
    }
  }

  private trackFID() {
    // First Input Delay
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.sendWebVital('fid', Math.round(entry.processingStart - entry.startTime))
      })
    })

    try {
      observer.observe({ type: 'first-input', buffered: true })
    } catch (e) {
      // FID not supported
    }
  }

  private trackCLS() {
    // Cumulative Layout Shift
    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
    })

    try {
      observer.observe({ type: 'layout-shift', buffered: true })
      
      // Send CLS value when page becomes hidden
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.sendWebVital('cls', clsValue)
        }
      })
    } catch (e) {
      // CLS not supported
    }
  }

  private trackFCP() {
    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        this.sendWebVital('fcp', Math.round(entry.startTime))
      })
    })

    try {
      observer.observe({ type: 'paint', buffered: true })
    } catch (e) {
      // FCP not supported
    }
  }

  private trackTTFB() {
    // Time to First Byte
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart
      this.sendWebVital('ttfb', Math.round(ttfb))
    }
  }

  private sendWebVital(metric: string, value: number) {
    if (!this.hasPerformanceConsent()) {
      return
    }

    const vitalsData = {
      sessionId: this.sessionId,
      [metric]: value,
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      pathname: window.location.pathname,
      referrer: document.referrer
    }

    this.sendEvent('web-vitals', vitalsData)
  }

  // ==================== ERROR TRACKING ====================

  private startErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        errorMessage: event.message,
        errorStack: event.error?.stack,
        url: event.filename,
        type: 'js_error',
        additionalContext: {
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        errorMessage: event.reason?.toString() || 'Unhandled Promise Rejection',
        errorStack: event.reason?.stack,
        type: 'js_error'
      })
    })

    // Network errors (fetch/xhr failures)
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok) {
          this.trackError({
            errorMessage: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0]?.toString(),
            type: 'network_error'
          })
        }
        return response
      } catch (error) {
        this.trackError({
          errorMessage: error instanceof Error ? error.message : 'Network request failed',
          url: args[0]?.toString(),
          type: 'network_error'
        })
        throw error
      }
    }
  }

  trackError(errorData: {
    errorMessage: string
    errorStack?: string
    url?: string
    type: 'js_error' | 'network_error' | 'api_error'
    additionalContext?: Record<string, any>
  }) {
    if (!this.hasAnalyticsConsent()) {
      return
    }

    const errorEvent = {
      sessionId: this.sessionId,
      errorType: errorData.type,
      errorMessage: errorData.errorMessage,
      errorStack: errorData.errorStack,
      url: errorData.url || window.location.href,
      additionalContext: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        pathname: window.location.pathname,
        ...errorData.additionalContext
      }
    }

    this.sendEvent('error', errorEvent)
  }

  // ==================== CONSENT MANAGEMENT ====================

  async recordConsent(
    consentType: 'analytics' | 'marketing' | 'functional' | 'performance',
    consented: boolean
  ) {
    try {
      await fetch(`${this.config.apiEndpoint}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          consentType,
          consented,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to record consent:', error)
    }
  }

  private hasAnalyticsConsent(): boolean {
    return this.config.consentLevel === 'analytics' || this.config.consentLevel === 'all'
  }

  private hasPerformanceConsent(): boolean {
    return this.config.consentLevel === 'analytics' || this.config.consentLevel === 'all'
  }

  // ==================== UTILITY METHODS ====================

  private async sendEvent(endpoint: string, data: any) {
    try {
      await fetch(`${this.config.apiEndpoint}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
      
      // Track the analytics error itself (with minimal data to avoid loops)
      if (endpoint !== 'error') {
        this.trackError({
          errorMessage: 'Analytics tracking failed',
          type: 'api_error',
          additionalContext: { endpoint, originalError: error instanceof Error ? error.message : 'Unknown' }
        })
      }
    }
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift()
      this.sendEvent('events', event)
    }
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: this.getDeviceType(),
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    }
  }

  private getPageInfo() {
    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      title: document.title
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private getConnectionType(): string {
    // @ts-ignore - experimental API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    return connection?.effectiveType || 'unknown'
  }
}

// ==================== GLOBAL ANALYTICS INSTANCE ====================

export const analytics = new Analytics()

// ==================== REACT HOOKS ====================

import { useEffect } from 'react'

export function useAnalytics(userId?: string, consentLevel?: 'none' | 'essential' | 'analytics' | 'all') {
  useEffect(() => {
    if (userId || consentLevel) {
      analytics.init(userId, consentLevel)
    }
  }, [userId, consentLevel])

  return {
    track: analytics.track.bind(analytics),
    trackJourneyStep: analytics.trackJourneyStep.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    recordConsent: analytics.recordConsent.bind(analytics),
    updateConsent: analytics.updateConsent.bind(analytics)
  }
}

export function useJourneyTracking() {
  const trackJourneyStep = analytics.trackJourneyStep.bind(analytics)
  
  return {
    trackPageView: (stage: string, step: string, metadata?: Record<string, any>) => {
      trackJourneyStep(stage as any, step, 'viewed', metadata)
    },
    trackClick: (stage: string, step: string, metadata?: Record<string, any>) => {
      trackJourneyStep(stage as any, step, 'clicked', metadata)
    },
    trackCompletion: (stage: string, step: string, metadata?: Record<string, any>) => {
      trackJourneyStep(stage as any, step, 'completed', metadata)
    },
    trackAbandonment: (stage: string, step: string, metadata?: Record<string, any>) => {
      trackJourneyStep(stage as any, step, 'abandoned', metadata)
    }
  }
}

// ==================== PERFORMANCE BUDGETS ====================

export class PerformanceBudget {
  private static budgets = {
    lcp: 2500, // 2.5 seconds
    fid: 100,  // 100 milliseconds
    cls: 0.1,  // 0.1 score
    fcp: 1800, // 1.8 seconds
    ttfb: 800  // 800 milliseconds
  }

  static checkBudget(metric: keyof typeof PerformanceBudget.budgets, value: number): boolean {
    const budget = this.budgets[metric]
    const withinBudget = value <= budget
    
    if (!withinBudget) {
      analytics.track('performance_budget_exceeded', {
        metric,
        value,
        budget,
        exceedance: value - budget
      })
    }
    
    return withinBudget
  }

  static setBudget(metric: keyof typeof PerformanceBudget.budgets, value: number) {
    this.budgets[metric] = value
  }
}

export default analytics