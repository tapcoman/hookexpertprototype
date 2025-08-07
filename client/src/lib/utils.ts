import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Hook Line Studio specific utilities

export function formatCurrency(amount: number, currency = 'USD'): string {
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency,
  })
}

export function formatPlatformName(platform: string): string {
  switch (platform) {
    case 'tiktok':
      return 'TikTok'
    case 'instagram':
      return 'Instagram'
    case 'youtube':
      return 'YouTube'
    default:
      return capitalizeFirst(platform)
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'tiktok':
      return 'bg-[hsl(var(--tiktok-brand))] text-white'
    case 'instagram':
      return 'bg-[hsl(var(--instagram-brand))] text-white'
    case 'youtube':
      return 'bg-[hsl(var(--youtube-brand))] text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

export function getPlatformGradient(platform: string): string {
  switch (platform) {
    case 'tiktok':
      return 'viral-gradient-tiktok'
    case 'instagram':
      return 'viral-gradient-instagram'
    case 'youtube':
      return 'viral-gradient-youtube'
    default:
      return 'viral-gradient-primary'
  }
}

export function getPlatformGlow(platform: string): string {
  switch (platform) {
    case 'tiktok':
      return 'platform-glow-tiktok'
    case 'instagram':
      return 'platform-glow-instagram'
    case 'youtube':
      return 'platform-glow-youtube'
    default:
      return ''
  }
}

export function getViralScoreColor(score: number): { 
  background: string; 
  animation: string; 
  textColor: string;
  border: string;
} {
  if (score >= 4.5) {
    return {
      background: 'bg-[hsl(var(--score-high))]',
      animation: 'viral-glow-high',
      textColor: 'text-white',
      border: 'border-[hsl(var(--score-high))]'
    }
  } else if (score >= 3.0) {
    return {
      background: 'bg-[hsl(var(--score-medium))]',
      animation: 'viral-pulse-medium',
      textColor: 'text-white',
      border: 'border-[hsl(var(--score-medium))]'
    }
  } else {
    return {
      background: 'bg-[hsl(var(--score-low))]',
      animation: '',
      textColor: 'text-white',
      border: 'border-[hsl(var(--score-low))]'
    }
  }
}

export function getEmotionalStateColor(emotion: string): string {
  switch (emotion) {
    case 'excitement':
      return 'bg-[hsl(var(--excitement))] text-white'
    case 'curiosity':
      return 'bg-[hsl(var(--curiosity))] text-white'
    case 'satisfaction':
      return 'bg-[hsl(var(--satisfaction))] text-white'
    case 'anticipation':
      return 'bg-[hsl(var(--anticipation))] text-black'
    default:
      return 'bg-[hsl(var(--viral-purple))] text-white'
  }
}

export function getPsychologyDriverColor(driver: string): string {
  const colors = {
    'curiosity-gap': 'bg-[hsl(var(--curiosity))] text-white',
    'pain-point': 'bg-[hsl(var(--excitement))] text-white',
    'value-hit': 'bg-[hsl(var(--satisfaction))] text-white',
    'surprise-shock': 'bg-[hsl(var(--viral-orange))] text-white',
    'social-proof': 'bg-[hsl(var(--viral-cyan))] text-white',
    'urgency-fomo': 'bg-[hsl(var(--anticipation))] text-black',
    'authority-credibility': 'bg-[hsl(var(--viral-purple))] text-white',
    'emotional-connection': 'bg-[hsl(var(--viral-pink))] text-white',
  }
  return colors[driver as keyof typeof colors] || 'bg-[hsl(var(--viral-purple))] text-white'
}

export function getViralRiskColor(risk: string): string {
  switch (risk) {
    case 'low': 
      return 'bg-[hsl(var(--satisfaction))] text-white'
    case 'medium': 
      return 'bg-[hsl(var(--anticipation))] text-black'
    case 'high': 
      return 'bg-[hsl(var(--excitement))] text-white'
    default: 
      return 'bg-gray-500 text-white'
  }
}

export function getObjectiveLabel(objective: string): string {
  switch (objective) {
    case 'watch_time':
      return 'Watch Time'
    case 'ctr':
      return 'Click-Through Rate'
    default:
      return capitalizeFirst(objective.replace('_', ' '))
  }
}

export function getSubscriptionStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'trialing':
      return 'bg-blue-100 text-blue-800'
    case 'canceled':
      return 'bg-red-100 text-red-800'
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function calculateUsagePercentage(used: number, limit: number | null): number {
  if (limit === null) return 0 // Unlimited
  return Math.min((used / limit) * 100, 100)
}

export function isValidHookTopic(topic: string): boolean {
  return topic.length >= 10 && topic.length <= 1000
}