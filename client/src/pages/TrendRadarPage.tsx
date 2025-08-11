import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Trend } from '../types/trends'
import TrendDashboard from '../components/trends/TrendDashboard'
import TrendDetail from '../components/trends/TrendDetail'
import AppShell from '../components/layout/AppShell'

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
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="min-h-full"
      >
        <div className="py-6">
          <TrendDashboard
            onTrendSelect={handleTrendSelect}
            onGenerateHooks={handleGenerateHooks}
          />
        </div>
      </motion.div>

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
      
      {/* Mobile bottom padding */}
      <div className="h-20 lg:h-0" />
    </AppShell>
  )
}

export default TrendRadarPage