import React from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  Target, 
  Zap, 
  Eye, 
  MessageSquare,
  BarChart3,
  Users,
  Play,
  ArrowRight,
  Check,
  Camera,
  Type,
  Mic
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import NavBar from '../components/layout/NavBar'
import {
  pageVariants,
  staggerVariants,
  itemVariants,
  getReducedMotionVariants
} from '../lib/animations'
import { cn } from '../lib/utils'

// Animated Feature Card Component
const FeatureCard: React.FC<{
  icon: React.ComponentType<any>
  title: string
  description: string
  features: string[]
  color: string
  gradient: string
}> = ({ icon: Icon, title, description, features, color, gradient }) => {
  return (
    <motion.div
      className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500"
      variants={itemVariants}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 25 } }}
    >
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-r", gradient, "shadow-lg")}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{title}</h3>
      <p className="text-gray-600 text-center mb-6 leading-relaxed">{description}</p>
      
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center">
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center mr-3", `bg-${color}-100`)}>
              <Check className={cn("w-3 h-3", `text-${color}-600`)} />
            </div>
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>
      
      {/* Card glow effect */}
      <div className={cn("absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-20 rounded-3xl blur-xl transition-all duration-500 -z-10", gradient)} />
    </motion.div>
  )
}

// Process Step Component
const ProcessStep: React.FC<{
  step: number
  title: string
  description: string
  icon: React.ComponentType<any>
}> = ({ step, title, description, icon: Icon }) => {
  return (
    <motion.div
      className="text-center"
      variants={itemVariants}
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {step}
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  )
}

const FeaturesPage: React.FC = () => {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50"
      variants={getReducedMotionVariants(pageVariants)}
      initial="initial"
      animate="animate"
    >
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            variants={staggerVariants}
            initial="initial"
            animate="animate"
          >
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
                Features That Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
                Content Creation
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Discover the advanced AI psychology engine and tri-modal technology that powers the world's most effective hook generation platform
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={itemVariants}
            >
              <Button
                variant="flow"
                size="xl"
                flowing
                className="text-white shadow-2xl hover:shadow-blue-500/25 text-lg px-12 py-4"
              >
                <Play className="w-6 h-6 mr-3" />
                Try It Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                flowing
                className="border-2 hover:border-blue-400 hover:text-blue-600 text-lg px-12 py-4"
              >
                <BarChart3 className="w-6 h-6 mr-3" />
                View Analytics
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tri-Modal Technology Section */}
      <section className="py-24 px-4 bg-white">
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
              Tri-Modal Hook Technology
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              The only platform that generates hooks optimized for verbal, visual, and textual content across all major platforms
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureCard
              icon={Mic}
              title="Verbal Hooks"
              description="Audio-first content optimized for TikTok, Instagram Reels, and podcasts"
              features={[
                "Rhythm and pacing optimization",
                "Emotional inflection suggestions",
                "Voice tone recommendations",
                "Audio engagement triggers"
              ]}
              color="blue"
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={Camera}
              title="Visual Hooks"
              description="Image and video hooks designed to stop the scroll and capture attention"
              features={[
                "Visual pattern recognition",
                "Color psychology integration",
                "Composition suggestions",
                "Thumbnail optimization"
              ]}
              color="purple"
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={Type}
              title="Textual Hooks"
              description="Written hooks optimized for Twitter, LinkedIn, and text-based platforms"
              features={[
                "Character limit optimization",
                "Readability scoring",
                "Engagement prediction",
                "Hashtag integration"
              ]}
              color="green"
              gradient="from-emerald-500 to-teal-500"
            />
          </motion.div>
        </div>
      </section>

      {/* AI Psychology Engine Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
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
              47 Psychological Frameworks
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-4xl mx-auto"
              variants={itemVariants}
            >
              Our AI is trained on proven psychological principles that drive human behavior and engagement
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: Brain,
                title: "Curiosity Gap",
                description: "Creates compelling questions that viewers must have answered",
                example: "\"This one trick changed everything...\"",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: "Social Proof",
                description: "Leverages crowd psychology and validation needs",
                example: "\"10,000 people can't be wrong...\"",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Target,
                title: "Loss Aversion",
                description: "Taps into fear of missing out and scarcity psychology",
                example: "\"Stop making these 5 mistakes...\"",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: Zap,
                title: "Pattern Interrupt",
                description: "Breaks expected patterns to capture attention",
                example: "\"Everyone thinks this, but...\"",
                color: "from-emerald-500 to-teal-500"
              },
              {
                icon: Eye,
                title: "Visual Anchoring",
                description: "Uses visual elements to reinforce psychological triggers",
                example: "Strong visual cues that support the hook",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: MessageSquare,
                title: "Story Framework",
                description: "Structures content using proven narrative psychology",
                example: "\"Here's what happened when...\"",
                color: "from-pink-500 to-rose-500"
              }
            ].map((framework) => (
              <motion.div
                key={framework.title}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-r", framework.color)}>
                  <framework.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{framework.title}</h3>
                <p className="text-gray-600 mb-3 text-sm">{framework.description}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 italic">"{framework.example}"</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
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
              How It Works
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              From idea to viral hook in seconds. Our AI does the heavy lifting so you can focus on creating great content.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-4 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <ProcessStep
              step={1}
              title="Input Your Topic"
              description="Simply describe your content idea or paste existing content you want to improve"
              icon={MessageSquare}
            />
            <ProcessStep
              step={2}
              title="AI Analysis"
              description="Our AI analyzes your topic using 47 psychological frameworks and platform data"
              icon={Brain}
            />
            <ProcessStep
              step={3}
              title="Hook Generation"
              description="Receive multiple tri-modal hooks optimized for your chosen platforms"
              icon={Sparkles}
            />
            <ProcessStep
              step={4}
              title="Performance Prediction"
              description="Get engagement scores and optimization suggestions for each hook"
              icon={BarChart3}
            />
          </motion.div>

          {/* Connecting Lines */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 bg-gradient-to-r from-blue-300 to-purple-300 h-0.5"
                style={{
                  left: `${25 * i - 12.5}%`,
                  width: '12.5%',
                  transform: 'translateY(-50%)'
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.2 }}
                viewport={{ once: true }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Platform Optimization Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
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
              Optimized for Every Platform
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-4xl mx-auto"
              variants={itemVariants}
            >
              Each platform has unique algorithms, audience behaviors, and content formats. Our AI understands them all.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                platform: "TikTok",
                audience: "Gen Z & Millennials",
                optimization: "Trend-aware, audio-first, 15-60 seconds",
                features: ["Algorithm timing", "Trending sounds", "Hashtag strategy", "Visual effects"]
              },
              {
                platform: "Instagram Reels",
                audience: "Visual-first creators",
                optimization: "Aesthetic-focused, story-driven, high-quality",
                features: ["Visual composition", "Story arcs", "Music sync", "Feed integration"]
              },
              {
                platform: "YouTube Shorts",
                audience: "Broad demographics",
                optimization: "Information-rich, searchable, retention-focused",
                features: ["SEO optimization", "Retention curves", "Thumbnail strategy", "Description hooks"]
              },
              {
                platform: "Twitter/X",
                audience: "News & trending topics",
                optimization: "Concise, timely, conversation-starting",
                features: ["Character limits", "Trending topics", "Thread structure", "Retweet optimization"]
              },
              {
                platform: "LinkedIn",
                audience: "Professionals & B2B",
                optimization: "Value-driven, authoritative, networking-focused",
                features: ["Professional tone", "Industry insights", "Engagement pods", "B2B psychology"]
              },
              {
                platform: "Emerging Platforms",
                audience: "Early adopters",
                optimization: "Adaptable algorithms, experimental formats",
                features: ["Rapid adaptation", "Format flexibility", "Trend prediction", "Pioneer advantage"]
              }
            ].map((platform) => (
              <motion.div
                key={platform.platform}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{platform.platform}</h3>
                <p className="text-blue-600 font-medium mb-3">{platform.audience}</p>
                <p className="text-gray-600 mb-4 text-sm">{platform.optimization}</p>
                
                <div className="space-y-2">
                  {platform.features.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500">
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
              Experience the Future of Content Creation
            </motion.h2>
            
            <motion.p
              className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Join 50,000+ creators who use our advanced AI psychology engine to create hooks that convert viewers into loyal followers.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
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
                <BarChart3 className="w-6 h-6 mr-3" />
                View Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer component would be imported and used here */}
    </motion.div>
  )
}

export default FeaturesPage