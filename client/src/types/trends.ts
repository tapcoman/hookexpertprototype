export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'all'
export type TrendVelocity = 'viral' | 'rising' | 'hot' | 'stable' | 'declining'
export type TrendCategory = 'entertainment' | 'education' | 'lifestyle' | 'tech' | 'fitness' | 'food' | 'travel' | 'business' | 'fashion' | 'music' | 'all'
export type TimeRange = '24h' | '7d' | '30d'

export interface Trend {
  id: string
  title: string
  description: string
  platform: Platform
  category: TrendCategory
  velocity: TrendVelocity
  momentum: number // 0-100 scale
  engagementRate: number // percentage
  postCount: number
  timeframe: string
  tags: string[]
  createdAt: string
  updatedAt: string
  // Analytics data
  viewCount?: number
  shareCount?: number
  likeCount?: number
  commentCount?: number
  // Visual indicators
  isSponsored?: boolean
  isVerified?: boolean
  confidenceScore?: number // 0-100
}

export interface TrendFilters {
  platform: Platform
  category: TrendCategory
  timeRange: TimeRange
  search: string
  velocity?: TrendVelocity[]
  minMomentum?: number
  sortBy?: 'momentum' | 'engagement' | 'posts' | 'recent'
  sortOrder?: 'asc' | 'desc'
}

export interface TrendAnalytics {
  totalTrends: number
  viralTrends: number
  risingTrends: number
  hotTrends: number
  stableTrends: number
  decliningTrends: number
  averageMomentum: number
  averageEngagement: number
  topCategories: Array<{
    category: TrendCategory
    count: number
  }>
  topPlatforms: Array<{
    platform: Platform
    count: number
  }>
}

export interface PlatformOverview {
  platform: Platform
  totalTrends: number
  viralCount: number
  risingCount: number
  averageEngagement: number
  topCategory: TrendCategory
  growthRate: number // percentage change
}