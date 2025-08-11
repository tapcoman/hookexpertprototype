import React from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  TrendingUp, 
  Flame, 
  Minus, 
  TrendingDown,
  Sparkles,
  Activity,
  BarChart3
} from 'lucide-react'
import { TrendVelocity } from '../../types/trends'

interface VelocityIndicatorProps {
  velocity: TrendVelocity
  momentum: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const VelocityIndicator: React.FC<VelocityIndicatorProps> = ({
  velocity,
  momentum,
  size = 'md',
  showLabel = true,
  animated = true,
  className = ''
}) => {
  const getVelocityConfig = () => {
    switch (velocity) {
      case 'viral':
        return {
          icon: Zap,
          label: 'Viral',
          color: 'text-purple-500 dark:text-purple-400',
          bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
          borderColor: 'border-purple-500/20 dark:border-purple-400/20',
          glowColor: 'shadow-purple-500/20',
          particles: true
        }
      case 'rising':
        return {
          icon: TrendingUp,
          label: 'Rising',
          color: 'text-emerald-500 dark:text-emerald-400',
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-400/10',
          borderColor: 'border-emerald-500/20 dark:border-emerald-400/20',
          glowColor: 'shadow-emerald-500/20',
          particles: false
        }
      case 'hot':
        return {
          icon: Flame,
          label: 'Hot',
          color: 'text-orange-500 dark:text-orange-400',
          bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
          borderColor: 'border-orange-500/20 dark:border-orange-400/20',
          glowColor: 'shadow-orange-500/20',
          particles: false
        }
      case 'stable':
        return {
          icon: Activity,
          label: 'Stable',
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
          borderColor: 'border-blue-500/20 dark:border-blue-400/20',
          glowColor: 'shadow-blue-500/20',
          particles: false
        }
      case 'declining':
        return {
          icon: TrendingDown,
          label: 'Declining',
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-500/10 dark:bg-gray-400/10',
          borderColor: 'border-gray-500/20 dark:border-gray-400/20',
          glowColor: 'shadow-gray-500/20',
          particles: false
        }
    }
  }

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-6 h-6',
          icon: 'w-3 h-3',
          text: 'text-xs',
          badge: 'px-2 py-0.5 text-xs'
        }
      case 'lg':
        return {
          container: 'w-12 h-12',
          icon: 'w-6 h-6',
          text: 'text-sm font-medium',
          badge: 'px-4 py-2 text-sm'
        }
      default:
        return {
          container: 'w-8 h-8',
          icon: 'w-4 h-4',
          text: 'text-sm',
          badge: 'px-3 py-1 text-sm'
        }
    }
  }

  const config = getVelocityConfig()
  const sizeConfig = getSizeConfig()
  const Icon = config.icon

  const getAnimationProps = () => {
    if (!animated) return {}
    
    switch (velocity) {
      case 'viral':
        return {
          animate: {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          },
          transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse' as const
          }
        }
      case 'rising':
        return {
          animate: {
            y: [0, -2, 0]
          },
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        }
      case 'hot':
        return {
          animate: {
            scale: [1, 1.05, 1]
          },
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        }
      case 'stable':
        return {
          animate: {
            opacity: [0.7, 1, 0.7]
          },
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        }
      default:
        return {}
    }
  }

  const renderParticles = () => {
    if (!config.particles || !animated) return null

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/60 rounded-full"
            initial={{ 
              x: Math.random() * 20 - 10,
              y: Math.random() * 20 - 10,
              opacity: 0
            }}
            animate={{
              x: Math.random() * 40 - 20,
              y: Math.random() * 40 - 20,
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'easeOut'
            }}
            style={{
              left: '50%',
              top: '50%'
            }}
          />
        ))}
      </div>
    )
  }

  if (!showLabel) {
    return (
      <div className={`relative ${className}`}>
        <motion.div
          className={`
            ${sizeConfig.container} 
            ${config.bgColor} 
            ${config.borderColor}
            border rounded-full flex items-center justify-center
            backdrop-blur-sm transition-all duration-300
            hover:${config.glowColor} hover:shadow-lg
          `}
          {...getAnimationProps()}
        >
          <Icon className={`${sizeConfig.icon} ${config.color}`} />
          {renderParticles()}
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative">
        <motion.div
          className={`
            ${sizeConfig.container} 
            ${config.bgColor} 
            ${config.borderColor}
            border rounded-full flex items-center justify-center
            backdrop-blur-sm transition-all duration-300
            hover:${config.glowColor} hover:shadow-lg
          `}
          {...getAnimationProps()}
        >
          <Icon className={`${sizeConfig.icon} ${config.color}`} />
          {renderParticles()}
        </motion.div>
      </div>
      
      <div className="flex flex-col">
        <span className={`${config.color} font-medium ${sizeConfig.text}`}>
          {config.label}
        </span>
        {size !== 'sm' && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {momentum}% momentum
          </span>
        )}
      </div>
    </div>
  )
}

// Compact badge version
export const VelocityBadge: React.FC<Omit<VelocityIndicatorProps, 'showLabel'>> = (props) => {
  const config = props.velocity === 'viral' ? {
    icon: Sparkles,
    label: 'Viral',
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
    borderColor: 'border-purple-500/30 dark:border-purple-400/30'
  } : props.velocity === 'rising' ? {
    icon: TrendingUp,
    label: 'Rising',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    borderColor: 'border-emerald-500/30 dark:border-emerald-400/30'
  } : props.velocity === 'hot' ? {
    icon: Flame,
    label: 'Hot',
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
    borderColor: 'border-orange-500/30 dark:border-orange-400/30'
  } : props.velocity === 'stable' ? {
    icon: BarChart3,
    label: 'Stable',
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    borderColor: 'border-blue-500/30 dark:border-blue-400/30'
  } : {
    icon: TrendingDown,
    label: 'Declining',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 dark:bg-gray-400/10',
    borderColor: 'border-gray-500/30 dark:border-gray-400/30'
  }

  const Icon = config.icon

  return (
    <motion.div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        ${config.bgColor} ${config.borderColor} border
        backdrop-blur-sm transition-all duration-200
        hover:shadow-md ${props.className || ''}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </motion.div>
  )
}

export default VelocityIndicator