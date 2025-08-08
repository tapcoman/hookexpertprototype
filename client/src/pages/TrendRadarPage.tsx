import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Trend } from '../types/trends'
import TrendDashboard from '../components/trends/TrendDashboard'
import TrendDetail from '../components/trends/TrendDetail'
import Container from '../components/layout/Container'

const TrendRadarPage: React.FC = () => {
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleTrendSelect = (trend: Trend) => {
    setSelectedTrend(trend)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedTrend(null)
  }

  const handleGenerateHooks = (trend: Trend) => {
    // Implementation would navigate to hook generation with trend context
    console.log('Generating hooks for trend:', trend.title)
    // Could use navigation to MainAppPage with pre-filled trend data
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950"
    >
      <Container className="py-6">
        <TrendDashboard
          onTrendSelect={handleTrendSelect}
          onGenerateHooks={handleGenerateHooks}
        />
      </Container>

      {/* Trend Detail Modal */}
      <TrendDetail
        trend={selectedTrend}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onGenerateHooks={handleGenerateHooks}
        onBookmark={(trend) => {
          // Implementation would save to favorites
          console.log('Bookmarked trend:', trend.title)
        }}
      />
    </motion.div>
  )
}

export default TrendRadarPage