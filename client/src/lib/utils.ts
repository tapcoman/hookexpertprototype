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
      return 'bg-pink-500'
    case 'instagram':
      return 'bg-purple-500'
    case 'youtube':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
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
EOF < /dev/null