import React from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  Users, 
  Award,
  Heart,
  ArrowRight,
  TrendingUp,
  Shield,
  Globe,
  Rocket
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

// Team Member Component
const TeamMember: React.FC<{
  name: string
  role: string
  bio: string
  avatar: string
  expertise: string[]
}> = ({ name, role, bio, avatar, expertise }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
      variants={itemVariants}
      whileHover={{ y: -5 }}
    >
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
          {avatar}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-blue-600 font-medium">{role}</p>
      </div>
      
      <p className="text-gray-600 text-center mb-6 leading-relaxed">{bio}</p>
      
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">Expertise:</h4>
        <div className="flex flex-wrap gap-2">
          {expertise.map((skill) => (
            <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Value Card Component
const ValueCard: React.FC<{
  icon: React.ComponentType<any>
  title: string
  description: string
  gradient: string
}> = ({ icon: Icon, title, description, gradient }) => {
  return (
    <motion.div
      className="text-center"
      variants={itemVariants}
      whileHover={{ scale: 1.05 }}
    >
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-r", gradient, "shadow-lg")}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  )
}

const AboutPage: React.FC = () => {
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
                Revolutionizing Content
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
                with AI Psychology
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              We're on a mission to democratize viral content creation by combining cutting-edge AI with proven psychological frameworks, empowering every creator to build engaged audiences.
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
                <Rocket className="w-6 h-6 mr-3" />
                Join Our Mission
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                flowing
                className="border-2 hover:border-blue-400 hover:text-blue-600 text-lg px-12 py-4"
              >
                <TrendingUp className="w-6 h-6 mr-3" />
                Our Impact
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-16 items-center"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                To democratize viral content creation by making advanced psychological frameworks and AI technology accessible to every creator, regardless of their background or resources.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe that great ideas deserve great reach. That's why we've built the world's most sophisticated hook generation platform, powered by 47 psychological frameworks and optimized for every major social media platform.
              </p>
            </motion.div>
            
            <motion.div 
              className="relative"
              variants={itemVariants}
            >
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
                    <div className="text-gray-600 font-medium">Active Creators</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">2.5M+</div>
                    <div className="text-gray-600 font-medium">Hooks Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-600 mb-2">89%</div>
                    <div className="text-gray-600 font-medium">Engagement Increase</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600 mb-2">47</div>
                    <div className="text-gray-600 font-medium">AI Frameworks</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
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
              Our Core Values
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              The principles that guide everything we do and every decision we make
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <ValueCard
              icon={Brain}
              title="Science-Driven"
              description="Every feature is backed by psychological research and data-driven insights"
              gradient="from-blue-500 to-cyan-500"
            />
            <ValueCard
              icon={Users}
              title="Creator-Focused"
              description="We build for creators, with creators, ensuring every tool serves their success"
              gradient="from-purple-500 to-pink-500"
            />
            <ValueCard
              icon={Globe}
              title="Accessible Innovation"
              description="Advanced AI technology should be available to everyone, not just big corporations"
              gradient="from-emerald-500 to-teal-500"
            />
            <ValueCard
              icon={Shield}
              title="Ethical AI"
              description="Responsible AI development that empowers rather than replaces human creativity"
              gradient="from-orange-500 to-red-500"
            />
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-4 bg-white">
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
              Our Story
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600"
              variants={itemVariants}
            >
              How we discovered the science behind viral content
            </motion.p>
          </motion.div>

          <motion.div
            className="space-y-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100"
              variants={itemVariants}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">The Problem We Discovered</h3>
                  <p className="text-gray-600 leading-relaxed">
                    In 2023, we noticed that 99% of content creators were struggling with the same issue: creating compelling hooks that capture attention in an increasingly crowded digital landscape. Even talented creators with great ideas were failing to reach their audience because they lacked the psychological knowledge of what makes content truly engaging.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100"
              variants={itemVariants}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Deep Research Phase</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We spent months analyzing millions of viral posts, studying psychological research, and interviewing successful creators. We discovered 47 distinct psychological frameworks that consistently drive engagement across all platforms. The patterns were clear: viral content isn't random—it follows scientific principles.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-100"
              variants={itemVariants}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Building the Solution</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We assembled a team of AI researchers, psychologists, and successful content creators to build Hook Line Studio. Our tri-modal AI engine combines these psychological frameworks with platform-specific optimization, creating the world's most advanced hook generation platform.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100"
              variants={itemVariants}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Proven Results</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Today, over 50,000 creators use Hook Line Studio to generate 2.5+ million hooks monthly. Our users see an average 89% increase in engagement, with many achieving viral status within their first month. We're just getting started.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
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
              Meet Our Team
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              The brilliant minds behind the AI psychology revolution in content creation
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            <TeamMember
              name="Dr. Sarah Chen"
              role="Co-Founder & CEO"
              bio="Former Stanford AI researcher with 10+ years in machine learning and behavioral psychology. Led AI teams at Meta and Google."
              avatar="SC"
              expertise={["AI Strategy", "Psychology", "Product Vision", "Team Leadership"]}
            />
            <TeamMember
              name="Marcus Rodriguez"
              role="Co-Founder & CTO"
              bio="Ex-OpenAI engineer specializing in natural language processing and content optimization algorithms. Built viral prediction models."
              avatar="MR"
              expertise={["NLP", "Algorithm Design", "Scalable Systems", "AI Architecture"]}
            />
            <TeamMember
              name="Dr. Emma Thompson"
              role="Head of Psychology"
              bio="PhD in Behavioral Psychology from Harvard. 15+ years researching viral content patterns and social media engagement psychology."
              avatar="ET"
              expertise={["Behavioral Psychology", "Content Analysis", "Research", "Framework Development"]}
            />
            <TeamMember
              name="Alex Kim"
              role="Head of Engineering"
              bio="Former Netflix engineer who built recommendation systems for 200M+ users. Expert in large-scale AI deployments."
              avatar="AK"
              expertise={["System Architecture", "ML Engineering", "Performance", "Infrastructure"]}
            />
            <TeamMember
              name="Maya Patel"
              role="Head of Design"
              bio="Award-winning UX designer from Airbnb. Specialized in creator tools and making complex AI accessible to everyone."
              avatar="MP"
              expertise={["UX Design", "Creator Tools", "Accessibility", "User Research"]}
            />
            <TeamMember
              name="David Johnson"
              role="Head of Growth"
              bio="Former VP of Growth at TikTok. Helped scale creator monetization from 0 to 1B+ users. Expert in creator economics."
              avatar="DJ"
              expertise={["Growth Strategy", "Creator Economy", "Marketing", "Analytics"]}
            />
          </motion.div>
        </div>
      </section>

      {/* Recognition Section */}
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
              Recognition & Awards
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Industry recognition for our innovation in AI-powered content creation
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                award: "AI Innovation Award",
                organization: "TechCrunch Disrupt 2024",
                description: "Best AI Application for Creators"
              },
              {
                award: "Creator Tool of the Year",
                organization: "Creator Economy Report 2024",
                description: "Most Impactful Creator Platform"
              },
              {
                award: "Top 10 Startups",
                organization: "Forbes AI50 2024",
                description: "Revolutionary AI Technology"
              },
              {
                award: "Product Hunt #1",
                organization: "Product of the Day",
                description: "Highest Rated Creator Tool"
              }
            ].map((recognition, index) => (
              <motion.div
                key={index}
                className="text-center bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-100"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{recognition.award}</h3>
                <p className="text-blue-600 font-medium mb-2 text-sm">{recognition.organization}</p>
                <p className="text-gray-600 text-sm">{recognition.description}</p>
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
              Join the Content Revolution
            </motion.h2>
            
            <motion.p
              className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Be part of the movement that's democratizing viral content creation. Join 50,000+ creators who are transforming their content strategy with AI psychology.
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
                Start Creating Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                flowing
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-12 py-4"
              >
                <Heart className="w-6 h-6 mr-3" />
                Join Our Community
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}

export default AboutPage