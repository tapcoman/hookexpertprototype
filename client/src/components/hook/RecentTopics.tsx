import React from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface RecentTopic {
  id: string
  topic: string
  platform: 'tiktok' | 'instagram' | 'youtube'
  createdAt: Date
}

interface RecentTopicsProps {
  topics?: RecentTopic[]
  onTopicClick?: (topic: RecentTopic) => void
}

const RecentTopics: React.FC<RecentTopicsProps> = ({ 
  topics = [], 
  onTopicClick 
}) => {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'TikTok'
      case 'instagram': return 'Reels'
      case 'youtube': return 'Shorts'
      default: return platform
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'bg-black text-white'
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'youtube': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (topics.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
        <Clock className="w-4 h-4 mr-2" />
        Recent Topics
      </h3>
      
      <div className="space-y-3">
        {topics.slice(0, 5).map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
            onClick={() => onTopicClick?.(topic)}
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`px-2 py-1 rounded text-xs font-medium ${getPlatformColor(topic.platform)}`}>
                {getPlatformLabel(topic.platform)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 group-hover:text-gray-700 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {topic.topic}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(topic.createdAt)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default RecentTopics