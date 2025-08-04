import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Shield, 
  Check,
  ChevronDown,
  ArrowRight,
  Play,
  Infinity as InfinityIcon
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import {
  pageVariants,
  staggerVariants,
  itemVariants,
  floatVariants,
  easing,
  getReducedMotionVariants
} from '../lib/animations'
import { cn } from '../lib/utils'

// Animated logo component
const AnimatedLogo: React.FC = () => {
  return (
    <motion.div
      className="relative w-24 h-24 mx-auto mb-8"
      variants={floatVariants}
      animate="animate"
    >
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <motion.path
          d="M24,48 Q36,24 48,48 T72,48 Q60,72 48,48 T24,48"
          stroke="url(#logoGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 2,
            ease: easing.flow,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 3,
          }}
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 rounded-full blur-xl" />
    </motion.div>
  )
}

// Floating particles background
const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => i)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            ease: "easeInOut",
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}

const LandingPage: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden"
      variants={getReducedMotionVariants(pageVariants)}
      initial="initial"
      animate="animate"
    >
      <FloatingParticles />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-16">
        {/* Dynamic background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-purple-500/5"
          animate={{
            background: [
              "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(139, 92, 246, 0.05) 100%)",
              "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)",
              "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(59, 130, 246, 0.05) 100%)",
            ],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
        />
        
        {/* Parallax elements */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            x: mousePosition.x * 20,
            y: mousePosition.y * 20,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 50 }}
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
        </motion.div>
        
        <motion.div
          className="relative z-10 text-center max-w-5xl mx-auto"
          variants={staggerVariants}
          animate="animate"
        >
          <AnimatedLogo />
          
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
            variants={itemVariants}
          >
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
              Hook Line
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Studio
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Create viral hooks in seconds with{' '}
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-powered psychology
            </span>
          </motion.p>
          
          <motion.p
            className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Advanced psychological frameworks meet cutting-edge AI to transform your content strategy. 
            Perfect for TikTok, Instagram Reels, and YouTube Shorts.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            variants={itemVariants}
          >
            <Button
              variant="flow"
              size="xl"
              flowing
              className="group text-white shadow-2xl hover:shadow-blue-500/25"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start Creating Free
            </Button>
            <Button
              variant="outline"
              size="xl"
              flowing
              className="border-2 hover:border-blue-400 hover:text-blue-600"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              View Examples
            </Button>
          </motion.div>
          
          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>10,000+ creators trust us</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <span>Enterprise-grade security</span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-sm font-medium">Discover more</span>
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Powered by Advanced AI Psychology
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Our tri-modal approach combines verbal, visual, and textual elements with proven psychological frameworks
            </motion.p>
          </motion.div>
          
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: Target,
                title: "Tri-Modal Hooks",
                description: "Generate verbal, visual, and textual hook components for maximum engagement across all platforms",
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-50 to-cyan-50",
              },
              {
                icon: Brain,
                title: "Psychological Frameworks",
                description: "Built on proven psychological triggers like curiosity gaps, social proof, and emotional connection",
                gradient: "from-purple-500 to-pink-500",
                bgGradient: "from-purple-50 to-pink-50",
              },
              {
                icon: Zap,
                title: "Platform Optimized",
                description: "Tailored algorithms for TikTok, Instagram Reels, YouTube Shorts, and emerging platforms",
                gradient: "from-orange-500 to-red-500",
                bgGradient: "from-orange-50 to-red-50",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className={cn(
                  "relative group p-8 rounded-3xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500",
                  "bg-gradient-to-br", feature.bgGradient,
                  "backdrop-blur-sm hover:scale-105"
                )}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
              >
                <div className="relative z-10">
                  <motion.div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
                      "bg-gradient-to-r", feature.gradient,
                      "shadow-lg group-hover:shadow-xl transition-all duration-300"
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Connecting lines */}
                {index < 2 && (
                  <motion.div
                    className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 hidden md:block"
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: 2,
                      }}
                    />
                  </motion.div>
                )}
                
                {/* Card glow */}
                <div className={cn(
                  "absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-20 rounded-3xl blur transition-all duration-500 -z-10",
                  feature.gradient
                )} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="relative"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl" />
            
            <div className="relative bg-gradient-to-br from-white/80 via-white/90 to-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-12 shadow-2xl">
              <motion.div
                className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center"
                variants={itemVariants}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <InfinityIcon className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h2
                className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent"
                variants={itemVariants}
              >
                Ready to go viral?
              </motion.h2>
              
              <motion.p
                className="text-xl text-gray-600 mb-8 leading-relaxed"
                variants={itemVariants}
              >
                Join 10,000+ creators who trust Hook Line Studio to create content that converts. 
                Start your free trial today and see the difference AI psychology makes.
              </motion.p>
              
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                variants={itemVariants}
              >
                <Button
                  variant="flow"
                  size="xl"
                  flowing
                  className="group text-white shadow-2xl hover:shadow-blue-500/25"
                >
                  <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  flowing
                  className="border-2 hover:border-purple-400 hover:text-purple-600"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  View Success Stories
                </Button>
              </motion.div>
              
              {/* Stats */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-gray-200"
                variants={itemVariants}
              >
                {[
                  { number: "10K+", label: "Active Creators" },
                  { number: "1M+", label: "Hooks Generated" },
                  { number: "4.9/5", label: "User Rating" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center"
            variants={itemVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <InfinityIcon className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hook Line Studio
              </span>
            </div>
            <p className="text-gray-600 mb-6">
              Transforming content creation with AI-powered psychology
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span>© 2025 Hook Line Studio. All rights reserved.</span>
              <span>•</span>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
            </div>
          </motion.div>
        </div>
      </footer>
    </motion.div>
  )
}

export default LandingPage