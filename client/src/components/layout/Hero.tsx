import React from 'react'
import { Link } from 'wouter'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Zap, TrendingUp, Users, Clock } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
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
    <section className={`relative py-20 lg:py-32 overflow-hidden ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <Container>
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Hook Generation
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Create{' '}
              <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Viral Hooks
              </span>
              <br />
              in Seconds
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your content ideas into scroll-stopping hooks using our 
              advanced psychological framework. Perfect for TikTok, Instagram, and YouTube.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link href="/auth">
              <Button size="lg" className="px-8 py-4 text-lg">
                Start Creating Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16"
          >
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Framework Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Powered by 24+ proven psychological frameworks
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {frameworks.map((framework, index) => (
                <motion.div
                  key={framework}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                >
                  <Badge variant="outline" className="text-xs">
                    {framework}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-sm text-muted-foreground"
          >
            Trusted by creators from
            <span className="font-semibold text-foreground mx-1">
              Netflix, Disney, Nike
            </span>
            and thousands more
          </motion.div>
        </div>
      </Container>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-ping" />
      <div className="absolute top-40 right-20 w-3 h-3 bg-primary/20 rounded-full animate-pulse" />
      <div className="absolute bottom-40 left-20 w-4 h-4 bg-primary/10 rounded-full animate-bounce" />
    </section>
  )
}

export default Hero