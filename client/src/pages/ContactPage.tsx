import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle,
  Send,
  Clock,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  HelpCircle,
  FileText,
  Zap
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Label } from '../components/ui/Label'
import { Select } from '../components/ui/Select'
import NavBar from '../components/layout/NavBar'
import {
  pageVariants,
  staggerVariants,
  itemVariants,
  getReducedMotionVariants
} from '../lib/animations'
import { cn } from '../lib/utils'

// Contact Info Card Component
const ContactInfoCard: React.FC<{
  icon: React.ComponentType<any>
  title: string
  description: string
  contact: string
  gradient: string
}> = ({ icon: Icon, title, description, contact, gradient }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
      variants={itemVariants}
      whileHover={{ y: -5 }}
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-r", gradient)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-3 text-sm">{description}</p>
      <p className="text-blue-600 font-medium">{contact}</p>
    </motion.div>
  )
}

// FAQ Item Component
const FAQItem: React.FC<{
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}> = ({ question, answer, isOpen, onClick }) => {
  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      variants={itemVariants}
    >
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-4">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: ''
  })
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setSubmitted(true)
  }

  const faqs = [
    {
      question: "How quickly can I expect a response?",
      answer: "We typically respond to all inquiries within 2-4 hours during business hours (9 AM - 6 PM PST, Monday-Friday). For urgent matters, please mark your subject as 'Urgent' and we'll prioritize your request."
    },
    {
      question: "Do you offer custom enterprise solutions?",
      answer: "Yes! We work with agencies, large creators, and enterprises to provide custom solutions including white-label options, API access, and dedicated support. Contact our sales team to discuss your specific needs."
    },
    {
      question: "Can I schedule a demo of the platform?",
      answer: "Absolutely! We offer personalized demos to show you exactly how Hook Line Studio can transform your content strategy. Schedule a demo and we'll walk you through our AI psychology engine and tri-modal technology."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer comprehensive support including live chat, email support, video tutorials, and a detailed knowledge base. Premium plan users also get priority support and access to one-on-one strategy sessions."
    },
    {
      question: "Do you have a bug bounty program?",
      answer: "Yes! We take security seriously and welcome responsible disclosure of vulnerabilities. Contact us with details about any security issues you discover and we'll work with you to resolve them promptly."
    }
  ]

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
                Get In Touch
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent">
                We're Here to Help
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Have questions about Hook Line Studio? Need support? Want to explore enterprise solutions? 
              We'd love to hear from you and help you succeed with AI-powered content creation.
            </motion.p>
            
            <motion.div
              className="flex flex-wrap items-center justify-center gap-8 text-sm"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>24/7 Support Available</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Enterprise-Grade Security</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5 text-purple-500" />
                <span>Dedicated Success Team</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              variants={staggerVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                  Send Us a Message
                </h2>
                <p className="text-xl text-gray-600">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </motion.div>

              {!submitted ? (
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  variants={staggerVariants}
                >
                  <motion.div className="grid md:grid-cols-2 gap-4" variants={itemVariants}>
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your full name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="mt-1"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="company">Company/Organization</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Your company name (optional)"
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => handleInputChange('subject', value)}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales & Enterprise</option>
                      <option value="partnership">Partnership Opportunities</option>
                      <option value="press">Press & Media</option>
                      <option value="careers">Careers</option>
                      <option value="bug">Bug Report</option>
                    </Select>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      required
                      className="mt-1"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      variant="flow"
                      size="lg"
                      flowing
                      disabled={isSubmitting}
                      className="w-full text-white shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              ) : (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We'll get back to you within 2-4 hours during business hours.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="border-2"
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Contact Information */}
            <motion.div
              variants={staggerVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                  Get In Touch
                </h2>
                <p className="text-xl text-gray-600">
                  Multiple ways to reach our team of experts
                </p>
              </motion.div>

              <motion.div className="space-y-6" variants={staggerVariants}>
                <ContactInfoCard
                  icon={Mail}
                  title="Email Support"
                  description="For general inquiries and support"
                  contact="hello@hooklinestudio.com"
                  gradient="from-blue-500 to-cyan-500"
                />
                <ContactInfoCard
                  icon={MessageCircle}
                  title="Live Chat"
                  description="Real-time support during business hours"
                  contact="Available 9 AM - 6 PM PST"
                  gradient="from-purple-500 to-pink-500"
                />
                <ContactInfoCard
                  icon={Phone}
                  title="Enterprise Sales"
                  description="For custom solutions and partnerships"
                  contact="sales@hooklinestudio.com"
                  gradient="from-emerald-500 to-teal-500"
                />
                <ContactInfoCard
                  icon={MapPin}
                  title="Office Location"
                  description="Our headquarters in Silicon Valley"
                  contact="San Francisco, CA, USA"
                  gradient="from-orange-500 to-red-500"
                />
              </motion.div>

              {/* Quick Links */}
              <motion.div variants={itemVariants} className="mt-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="/features"
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300"
                  >
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Features</div>
                      <div className="text-sm text-gray-600">Explore our platform</div>
                    </div>
                  </a>
                  <a
                    href="/pricing"
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300"
                  >
                    <Zap className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Pricing</div>
                      <div className="text-sm text-gray-600">View our plans</div>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-300"
                  >
                    <HelpCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Help Center</div>
                      <div className="text-sm text-gray-600">Find answers</div>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 hover:shadow-lg transition-all duration-300"
                  >
                    <FileText className="w-6 h-6 text-orange-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Documentation</div>
                      <div className="text-sm text-gray-600">API & guides</div>
                    </div>
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-gray-50">
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
              Quick answers to common questions about Hook Line Studio
            </motion.p>
          </motion.div>

          <motion.div
            className="space-y-4"
            variants={staggerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
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
              Ready to Transform Your Content?
            </motion.h2>
            
            <motion.p
              className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Don't wait for the perfect moment. Start creating viral hooks today with our AI psychology engine and join 50,000+ successful creators.
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
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                flowing
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-12 py-4"
              >
                <MessageCircle className="w-6 h-6 mr-3" />
                Schedule Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}

export default ContactPage