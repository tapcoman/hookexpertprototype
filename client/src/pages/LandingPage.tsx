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
      className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-blue-50/50 relative overflow-hidden"
      variants={getReducedMotionVariants(pageVariants)}
      initial="initial"
      animate="animate"
    >
      {/* Premium background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/5 to-teal-bright/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-electric-blue/5 to-coral-red/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      <FloatingParticles />
      
      {/* Premium Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 pt-32 lg:pt-40">
        {/* Sophisticated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/3 via-teal-bright/2 to-electric-blue/3"
          animate={{
            background: [
              "linear-gradient(135deg, rgba(5, 112, 222, 0.03) 0%, rgba(38, 210, 239, 0.02) 50%, rgba(0, 123, 255, 0.03) 100%)",
              "linear-gradient(135deg, rgba(0, 123, 255, 0.03) 0%, rgba(5, 112, 222, 0.02) 50%, rgba(38, 210, 239, 0.03) 100%)",
              "linear-gradient(135deg, rgba(38, 210, 239, 0.03) 0%, rgba(0, 123, 255, 0.02) 50%, rgba(5, 112, 222, 0.03) 100%)",
            ],
          }}
          transition={{
            duration: 30,
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
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
            variants={itemVariants}
          >
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
              Generate Viral Hooks
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
              in Seconds
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            The world's most advanced{' '}
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI psychology engine
            </span>
            {' '}creates hooks that convert viewers into engaged followers
          </motion.p>
          
          <motion.p
            className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Transform your content strategy with tri-modal hooks engineered for maximum engagement. 
            Proven psychological frameworks optimized for TikTok, Instagram Reels, YouTube Shorts, and emerging platforms.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            variants={itemVariants}
          >
            <Button
              variant="flow"
              size="xl"
              flowing
              className="group text-white shadow-2xl hover:shadow-blue-500/25 text-lg px-12 py-4"
            >
              <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              Start Creating Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              flowing
              className="border-2 hover:border-blue-400 hover:text-blue-600 text-lg px-12 py-4"
            >
              <Sparkles className="w-6 h-6 mr-3" />
              Watch Demo
            </Button>
          </motion.div>
          
          {/* Live Demo Preview */}
          <motion.div
            className="max-w-4xl mx-auto mb-16"
            variants={itemVariants}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">See Hook Line Studio in Action</h3>
                <p className="text-gray-600 text-lg">Watch how our AI transforms simple topics into viral content hooks</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Input Topic:</h4>
                    <p className="text-gray-700">"Morning productivity routine"</p>
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2">Viral Hook Generated:</h4>
                    <p className="text-blue-800 font-medium">"I tried waking up at 5 AM for 30 days and this ONE habit changed everything..."</p>
                    <div className="mt-3 flex items-center space-x-4 text-sm">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">97% Engagement Score</span>
                      <span className="text-gray-600">Curiosity Gap + Social Proof</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Trust indicators */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center"
            variants={itemVariants}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 block">Free to Start</span>
                <span className="text-sm text-gray-600">No credit card required</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 block">50,000+ Creators</span>
                <span className="text-sm text-gray-600">Trust our platform</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 block">Enterprise Security</span>
                <span className="text-sm text-gray-600">SOC 2 compliant</span>
              </div>
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

      {/* Premium Social Proof Section */}
      <section className="relative py-32 px-4 bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            className="text-center mb-20"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              className="font-display text-4xl md:text-5xl lg:text-6xl font-black mb-8 text-gradient-primary"
              variants={itemVariants}
            >
              Trusted by Leading Content Creators
            </motion.h2>
            
            {/* Premium Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
              variants={staggerVariants}
            >
              {[
                { number: "2.5M+", label: "Hooks Generated", icon: Sparkles },
                { number: "50K+", label: "Active Creators", icon: Users },
                { number: "89%", label: "Increase in Engagement", icon: TrendingUp },
                { number: "4.9/5", label: "User Rating", icon: InfinityIcon },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="glass-card text-center group cursor-pointer"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary to-teal-bright rounded-3xl flex items-center justify-center shadow-premium group-hover:shadow-premium-lg transition-all duration-300">
                    <stat.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-gray-900 mb-3 font-display">{stat.number}</div>
                  <div className="text-gray-600 font-semibold">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Premium Testimonials */}
            <motion.div
              className="grid md:grid-cols-3 gap-8"
              variants={staggerVariants}
            >
              {[
                {
                  quote: "Hook Line Studio transformed my content strategy. My engagement increased by 300% in just 2 weeks!",
                  author: "Sarah Chen",
                  role: "TikTok Creator (2.1M followers)",
                  avatar: "SC",
                  gradient: "from-primary to-teal-bright"
                },
                {
                  quote: "The psychological frameworks are game-changing. Every hook feels scientifically crafted to capture attention.",
                  author: "Marcus Rodriguez",
                  role: "YouTube Content Creator",
                  avatar: "MR",
                  gradient: "from-electric-blue to-coral-red"
                },
                {
                  quote: "From 10K to 500K followers in 6 months. This tool is the secret weapon every creator needs.",
                  author: "Emma Thompson",
                  role: "Instagram Influencer",
                  avatar: "ET",
                  gradient: "from-teal-bright to-golden-yellow"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="glass-card group relative overflow-hidden"
                  variants={itemVariants}
                  whileHover={{ 
                    y: -8, 
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                >
                  {/* Premium glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${testimonial.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />
                  
                  <div className="flex items-center mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-r ${testimonial.gradient} rounded-2xl flex items-center justify-center text-white font-bold mr-4 shadow-premium`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{testimonial.author}</div>
                      <div className="text-sm text-gray-600 font-medium">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base mb-6 font-medium">"{testimonial.quote}"</p>
                  <div className="flex text-golden-yellow">
                    {[...Array(5)].map((_, i) => (
                      <motion.svg 
                        key={i} 
                        className="w-5 h-5 fill-current" 
                        viewBox="0 0 20 20"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 1.5 + index * 0.2 + i * 0.1, type: "spring", stiffness: 200 }}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </motion.svg>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              The Most Advanced Hook Generator Ever Built
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-4xl mx-auto"
              variants={itemVariants}
            >
              Our proprietary tri-modal AI system combines cutting-edge psychology with platform-specific optimization to create hooks that don't just get views—they build loyal audiences.
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
                  "relative group p-10 rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500",
                  "bg-white backdrop-blur-sm hover:scale-105"
                )}
                variants={itemVariants}
                whileHover={{ 
                  y: -12,
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
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  {/* Feature benefits */}
                  <div className="space-y-2">
                    {feature.title === 'Tri-Modal Hooks' && [
                      '✓ Verbal hooks for audio-first platforms',
                      '✓ Visual hooks for image-based content',
                      '✓ Textual hooks for written posts'
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        {benefit.replace('✓ ', '')}
                      </div>
                    ))}
                    
                    {feature.title === 'Psychological Frameworks' && [
                      '✓ Curiosity gap triggers',
                      '✓ Social proof integration',
                      '✓ Emotional connection patterns'
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        {benefit.replace('✓ ', '')}
                      </div>
                    ))}
                    
                    {feature.title === 'Platform Optimized' && [
                      '✓ Algorithm-specific optimization',
                      '✓ Character limit awareness',
                      '✓ Trending format integration'
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        {benefit.replace('✓ ', '')}
                      </div>
                    ))}
                  </div>
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
                  "absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-30 rounded-3xl blur-xl transition-all duration-500 -z-10",
                  feature.gradient
                )} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
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
              Choose Your Growth Plan
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Start free and scale as you grow. Every plan includes our core AI psychology engine and platform optimization.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 mb-16"
            variants={staggerVariants}
          >
            {[
              {
                name: "Starter",
                price: "Free",
                period: "forever",
                description: "Perfect for getting started",
                features: [
                  "10 hooks per month",
                  "Basic psychology frameworks",
                  "TikTok & Instagram optimization",
                  "Community support"
                ],
                cta: "Start Free",
                popular: false
              },
              {
                name: "Creator",
                price: "$29",
                period: "per month",
                description: "For serious content creators",
                features: [
                  "500 hooks per month",
                  "All psychology frameworks",
                  "Multi-platform optimization",
                  "Advanced analytics",
                  "Priority support",
                  "A/B testing tools"
                ],
                cta: "Start 7-Day Free Trial",
                popular: true
              },
              {
                name: "Agency",
                price: "$99",
                period: "per month",
                description: "For teams and agencies",
                features: [
                  "Unlimited hooks",
                  "White-label options",
                  "Team collaboration",
                  "Custom frameworks",
                  "Dedicated support",
                  "API access"
                ],
                cta: "Contact Sales",
                popular: false
              }
            ].map((plan) => (
              <motion.div
                key={plan.name}
                className={cn(
                  "relative bg-white rounded-3xl border-2 p-8 shadow-lg transition-all duration-300",
                  plan.popular 
                    ? "border-blue-500 shadow-blue-500/20 scale-105" 
                    : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
                )}
                variants={itemVariants}
                whileHover={{ y: plan.popular ? 0 : -8 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  variant={plan.popular ? "flow" : "outline"}
                  flowing={plan.popular}
                  className={cn(
                    "w-full py-3 text-base font-semibold",
                    plan.popular ? "text-white shadow-lg" : ""
                  )}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
              variants={itemVariants}
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600"
              variants={itemVariants}
            >
              Everything you need to know about Hook Line Studio
            </motion.p>
          </motion.div>

          <motion.div
            className="space-y-6"
            variants={staggerVariants}
          >
            {[
              {
                question: "How does the AI psychology engine work?",
                answer: "Our AI combines 47 proven psychological frameworks with platform-specific optimization algorithms. It analyzes successful content patterns, emotional triggers, and engagement data to generate hooks that are scientifically designed to capture attention and drive action."
              },
              {
                question: "What makes your hooks different from generic AI content?",
                answer: "Unlike generic AI tools, we specialize exclusively in hook creation using tri-modal psychology (verbal, visual, textual). Each hook is optimized for specific platforms, includes psychological triggers, and is tested against engagement prediction models trained on millions of viral posts."
              },
              {
                question: "Can I use this for any social media platform?",
                answer: "Yes! Our AI is trained on TikTok, Instagram Reels, YouTube Shorts, Twitter, LinkedIn, and emerging platforms. Each hook is automatically optimized for your chosen platform's algorithm, character limits, and audience behavior patterns."
              },
              {
                question: "Do you offer a money-back guarantee?",
                answer: "Absolutely. We offer a 30-day money-back guarantee on all paid plans. If you're not seeing improved engagement within 30 days, we'll refund your subscription completely."
              },
              {
                question: "How quickly can I expect to see results?",
                answer: "Most creators see improved engagement within their first week of using our hooks. Our data shows an average 89% increase in engagement rates, with many creators achieving viral status within their first month."
              },
              {
                question: "Is there a limit to how many hooks I can generate?",
                answer: "It depends on your plan. Our Starter plan includes 10 hooks per month, Creator plan includes 500 per month, and Agency plan offers unlimited generation. All plans reset monthly."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
                variants={itemVariants}
                whileHover={{ shadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
              variants={itemVariants}
            >
              Ready to Transform Your Content?
            </motion.h2>
            
            <motion.p
              className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Join 50,000+ creators who use Hook Line Studio to generate viral content that builds loyal audiences and drives real business results.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              variants={itemVariants}
            >
              <Button
                variant="secondary"
                size="xl"
                flowing
                className="bg-white text-blue-600 hover:bg-gray-50 shadow-2xl text-lg px-12 py-4"
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                flowing
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-12 py-4"
              >
                <TrendingUp className="w-6 h-6 mr-3" />
                View Success Stories
              </Button>
            </motion.div>
            
            <motion.div
              className="flex flex-wrap items-center justify-center gap-8 text-blue-100"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>30-day money-back guarantee</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {/* Main Footer Content */}
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Brand Column */}
              <motion.div className="md:col-span-1" variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <InfinityIcon className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Hook Line Studio
                  </span>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  The world's most advanced AI psychology engine for creating viral content hooks that convert viewers into loyal followers.
                </p>
                <div className="flex space-x-4">
                  {/* Social Media Links */}
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.017 8.106L20 0h-1.885l-6.941 8.086L5.23 0H0l8.37 12.173L0 20h1.885l7.327-8.524L15.77 20H21l-8.983-11.894zM2.788 1.296h2.653l11.771 17.408h-2.653L2.788 1.296z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </motion.div>
              
              {/* Product Column */}
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-6">Product</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="/features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                </ul>
              </motion.div>
              
              {/* Company Column */}
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-6">Company</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </motion.div>
              
              {/* Support Column */}
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-6">Support</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </motion.div>
            </div>
            
            {/* Bottom Bar */}
            <motion.div 
              className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center"
              variants={itemVariants}
            >
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 Hook Line Studio. All rights reserved.
              </div>
              <div className="flex flex-wrap items-center gap-8 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                <a href="#" className="hover:text-white transition-colors">GDPR</a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </motion.div>
  )
}

export default LandingPage