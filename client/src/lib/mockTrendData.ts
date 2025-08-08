import { Trend, TrendAnalytics, PlatformOverview } from '../types/trends'

// Mock trend data for development
export const mockTrends: Trend[] = [
  {
    id: '1',
    title: 'AI-Generated Art Challenges',
    description: 'Creators are using AI tools to create unique art pieces and challenging others to recreate them manually',
    platform: 'tiktok',
    category: 'entertainment',
    velocity: 'viral',
    momentum: 95,
    engagementRate: 12.8,
    postCount: 15420,
    timeframe: '2 hours ago',
    tags: ['ai', 'art', 'challenge', 'creativity'],
    createdAt: '2025-01-08T10:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 2840000,
    shareCount: 45600,
    likeCount: 182000,
    commentCount: 28900,
    isVerified: true,
    confidenceScore: 94
  },
  {
    id: '2',
    title: 'Micro-Learning Series',
    description: 'Bite-sized educational content covering complex topics in 60-second videos',
    platform: 'instagram',
    category: 'education',
    velocity: 'rising',
    momentum: 78,
    engagementRate: 8.4,
    postCount: 8750,
    timeframe: '6 hours ago',
    tags: ['education', 'learning', 'quick', 'knowledge'],
    createdAt: '2025-01-08T06:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 1250000,
    shareCount: 28400,
    likeCount: 95600,
    commentCount: 12800,
    isVerified: true,
    confidenceScore: 89
  },
  {
    id: '3',
    title: 'Morning Routine Optimization',
    description: 'Productivity enthusiasts sharing their optimized morning routines for peak performance',
    platform: 'youtube',
    category: 'lifestyle',
    velocity: 'hot',
    momentum: 86,
    engagementRate: 9.2,
    postCount: 12300,
    timeframe: '4 hours ago',
    tags: ['productivity', 'morning', 'routine', 'wellness'],
    createdAt: '2025-01-08T08:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 1980000,
    shareCount: 34500,
    likeCount: 156000,
    commentCount: 18400,
    isVerified: true,
    confidenceScore: 91
  },
  {
    id: '4',
    title: 'Quantum Computing Simplified',
    description: 'Breaking down quantum computing concepts into digestible explanations for general audiences',
    platform: 'youtube',
    category: 'tech',
    velocity: 'rising',
    momentum: 72,
    engagementRate: 7.1,
    postCount: 4560,
    timeframe: '8 hours ago',
    tags: ['quantum', 'computing', 'tech', 'science'],
    createdAt: '2025-01-08T04:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 890000,
    shareCount: 18900,
    likeCount: 67800,
    commentCount: 9200,
    isVerified: false,
    confidenceScore: 85
  },
  {
    id: '5',
    title: 'Sustainable Fashion Swaps',
    description: 'Fashion creators showing how to replace fast fashion with sustainable alternatives',
    platform: 'instagram',
    category: 'fashion',
    velocity: 'hot',
    momentum: 81,
    engagementRate: 10.3,
    postCount: 9870,
    timeframe: '3 hours ago',
    tags: ['sustainable', 'fashion', 'eco', 'style'],
    createdAt: '2025-01-08T09:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 1460000,
    shareCount: 31200,
    likeCount: 134500,
    commentCount: 15600,
    isVerified: true,
    confidenceScore: 88
  },
  {
    id: '6',
    title: 'Home Workout Equipment Hacks',
    description: 'Creative ways to use household items as workout equipment for effective home fitness',
    platform: 'tiktok',
    category: 'fitness',
    velocity: 'stable',
    momentum: 65,
    engagementRate: 6.8,
    postCount: 11200,
    timeframe: '12 hours ago',
    tags: ['fitness', 'home', 'workout', 'diy'],
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 1120000,
    shareCount: 22400,
    likeCount: 78900,
    commentCount: 11300,
    isVerified: false,
    confidenceScore: 82
  },
  {
    id: '7',
    title: '5-Minute Gourmet Meals',
    description: 'Quick but sophisticated recipes that can be prepared in under 5 minutes',
    platform: 'instagram',
    category: 'food',
    velocity: 'rising',
    momentum: 74,
    engagementRate: 8.9,
    postCount: 7890,
    timeframe: '5 hours ago',
    tags: ['cooking', 'quick', 'gourmet', 'recipes'],
    createdAt: '2025-01-08T07:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 1340000,
    shareCount: 28700,
    likeCount: 118000,
    commentCount: 14200,
    isVerified: true,
    confidenceScore: 87
  },
  {
    id: '8',
    title: 'Digital Nomad Budget Guides',
    description: 'Comprehensive guides on living as a digital nomad on different budget levels',
    platform: 'youtube',
    category: 'travel',
    velocity: 'declining',
    momentum: 42,
    engagementRate: 4.2,
    postCount: 3450,
    timeframe: '1 day ago',
    tags: ['travel', 'nomad', 'budget', 'remote'],
    createdAt: '2025-01-07T12:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 560000,
    shareCount: 8900,
    likeCount: 34500,
    commentCount: 5600,
    isVerified: false,
    confidenceScore: 76
  },
  {
    id: '9',
    title: 'Side Hustle Success Stories',
    description: 'Entrepreneurs sharing their journey from side hustle to full-time business',
    platform: 'twitter',
    category: 'business',
    velocity: 'hot',
    momentum: 83,
    engagementRate: 9.7,
    postCount: 6780,
    timeframe: '7 hours ago',
    tags: ['business', 'entrepreneur', 'sidehustle', 'success'],
    createdAt: '2025-01-08T05:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 890000,
    shareCount: 23400,
    likeCount: 78900,
    commentCount: 12100,
    isVerified: true,
    confidenceScore: 90
  },
  {
    id: '10',
    title: 'Music Production in Bedrooms',
    description: 'Young producers creating professional-quality music from their bedrooms with minimal equipment',
    platform: 'tiktok',
    category: 'music',
    velocity: 'viral',
    momentum: 92,
    engagementRate: 11.4,
    postCount: 18700,
    timeframe: '1 hour ago',
    tags: ['music', 'production', 'bedroom', 'diy'],
    createdAt: '2025-01-08T11:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    viewCount: 3200000,
    shareCount: 56800,
    likeCount: 289000,
    commentCount: 34500,
    isVerified: true,
    confidenceScore: 96
  }
]

export const mockAnalytics: TrendAnalytics = {
  totalTrends: 10,
  viralTrends: 2,
  risingTrends: 3,
  hotTrends: 3,
  stableTrends: 1,
  decliningTrends: 1,
  averageMomentum: 76.8,
  averageEngagement: 8.8,
  topCategories: [
    { category: 'entertainment', count: 2 },
    { category: 'education', count: 2 },
    { category: 'lifestyle', count: 1 },
    { category: 'tech', count: 1 },
    { category: 'fashion', count: 1 }
  ],
  topPlatforms: [
    { platform: 'tiktok', count: 3 },
    { platform: 'instagram', count: 3 },
    { platform: 'youtube', count: 3 },
    { platform: 'twitter', count: 1 }
  ]
}

export const mockPlatformOverviews: PlatformOverview[] = [
  {
    platform: 'tiktok',
    totalTrends: 3,
    viralCount: 2,
    risingCount: 0,
    averageEngagement: 10.3,
    topCategory: 'entertainment',
    growthRate: 24.5
  },
  {
    platform: 'instagram',
    totalTrends: 3,
    viralCount: 0,
    risingCount: 2,
    averageEngagement: 9.2,
    topCategory: 'fashion',
    growthRate: 18.7
  },
  {
    platform: 'youtube',
    totalTrends: 3,
    viralCount: 0,
    risingCount: 1,
    averageEngagement: 6.8,
    topCategory: 'education',
    growthRate: 12.3
  },
  {
    platform: 'twitter',
    totalTrends: 1,
    viralCount: 0,
    risingCount: 0,
    averageEngagement: 9.7,
    topCategory: 'business',
    growthRate: 15.2
  }
]

// Helper functions for filtering and sorting trends
export const filterTrends = (trends: Trend[], filters: Partial<{
  platform: string
  category: string
  velocity: string
  search: string
}>): Trend[] => {
  return trends.filter(trend => {
    if (filters.platform && filters.platform !== 'all' && trend.platform !== filters.platform) {
      return false
    }
    if (filters.category && filters.category !== 'all' && trend.category !== filters.category) {
      return false
    }
    if (filters.velocity && trend.velocity !== filters.velocity) {
      return false
    }
    if (filters.search && !trend.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !trend.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !trend.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))) {
      return false
    }
    return true
  })
}

export const sortTrends = (trends: Trend[], sortBy: string = 'momentum', sortOrder: string = 'desc'): Trend[] => {
  const sorted = [...trends].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string
    
    switch (sortBy) {
      case 'engagement':
        aValue = a.engagementRate
        bValue = b.engagementRate
        break
      case 'posts':
        aValue = a.postCount
        bValue = b.postCount
        break
      case 'recent':
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
        break
      default:
        aValue = a.momentum
        bValue = b.momentum
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
  
  return sorted
}