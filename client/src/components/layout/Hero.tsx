import React from 'react'
import { Link } from 'wouter'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Zap, TrendingUp, Users, Clock } from 'lucide-react'
import { Button } from '../ui/Button'
import Container from './Container'

interface HeroProps {
  className?: string
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  const stats = [
    { icon: TrendingUp, value: '10M+', label: 'Hooks Generated' },
    { icon: Users, value: '50K+', label: 'Content Creators' },
    { icon: Clock, value: '5 min', label: 'Average Time Saved' },
  ]

  const frameworks = [
    'Curiosity Gap',
    'Authority Pattern',
    'Social Proof',
    'FOMO Trigger',
    'Pain Point',
    'Value Hit'
  ]

  return (
    <section className={`relative py-32 lg:py-48 xl:py-56 overflow-hidden ${className}`}>
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-teal-bright/2 to-electric-blue/3" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/10 to-teal-bright/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-electric-blue/10 to-coral-red/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <Container>
        <div className="text-center">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/40 shadow-glass">
              <div className="w-2 h-2 bg-gradient-to-r from-primary to-teal-bright rounded-full mr-3 animate-pulse-glow" />
              <Zap className="w-5 h-5 mr-2 text-primary" />
              <span className="text-sm font-semibold text-gray-700">AI-Powered Hook Generation</span>
            </div>
          </motion.div>

          {/* Premium Headline */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-foreground leading-[0.9] tracking-tight">
              Create{' '}
              <span className="text-gradient-primary animate-gradient-flow bg-size-200">
                Viral Hooks
              </span>
              <br />
              <span className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl text-gray-600 font-bold">
                in Seconds
              </span>
            </h1>
          </motion.div>

          {/* Premium Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-medium">
              The world's most advanced{' '}
              <span className="text-gradient-primary font-semibold">
                AI psychology engine
              </span>
              {' '}transforms your content ideas into scroll-stopping hooks using proven psychological frameworks. 
              Perfect for TikTok, Instagram, YouTube, and emerging platforms.
            </p>
          </motion.div>

          {/* Premium CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <Link href="/auth">
              <Button variant="premium" size="xl" flowing className="px-12 py-6 text-lg font-semibold group">
                <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="px-12 py-6 text-lg font-semibold group border-white/30">
              <div className="w-8 h-8 mr-3 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              Watch Demo
            </Button>
          </motion.div>

          {/* Premium Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-20"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="flex flex-col items-center group cursor-pointer"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-teal-bright rounded-2xl flex items-center justify-center mb-4 shadow-premium group-hover:shadow-premium-lg transition-all duration-300">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-foreground mb-2 font-display">
                  {stat.value}
                </div>
                <div className="text-base text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Premium Framework Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <p className="text-base text-gray-600 mb-6 font-medium">
              Powered by 24+ proven psychological frameworks
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {frameworks.map((framework, index) => (
                <motion.div
                  key={framework}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 1.2 + index * 0.1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="cursor-pointer"
                >
                  <div className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors duration-300">
                      {framework}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Premium Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-base text-gray-600"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-teal-bright border-2 border-white shadow-sm" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-500 ml-2">50,000+ creators</span>
            </div>
            <div>
              Trusted by creators from{' '}
              <span className="font-semibold text-gradient-primary">
                Netflix, Disney, Nike
              </span>
              {' '}and thousands more
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Premium Floating Elements */}
      <motion.div 
        className="absolute top-20 left-10 w-3 h-3 bg-gradient-to-r from-primary to-teal-bright rounded-full shadow-glow"
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-40 right-20 w-4 h-4 bg-gradient-to-r from-electric-blue to-coral-red rounded-full shadow-glow"
        animate={{ 
          x: [0, 15, 0],
          y: [0, -10, 0],
          opacity: [0.2, 0.6, 0.2]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div 
        className="absolute bottom-40 left-20 w-5 h-5 bg-gradient-to-r from-teal-bright to-golden-yellow rounded-full shadow-glow"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </section>
  )
}

export default Hero