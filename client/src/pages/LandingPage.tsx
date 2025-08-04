import React from 'react'

const LandingPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Hook Line Studio
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          AI-powered video hook generation with psychological framework integration
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-primary text-lg px-8 py-3">
            Start Creating Hooks
          </button>
          <button className="btn-secondary text-lg px-8 py-3">
            Learn More
          </button>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6 border rounded-lg">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Tri-Modal Hooks</h3>
          <p className="text-muted-foreground">
            Generate verbal, visual, and textual hook components for maximum engagement
          </p>
        </div>

        <div className="text-center p-6 border rounded-lg">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🧠</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Psychological Frameworks</h3>
          <p className="text-muted-foreground">
            Built on proven psychological triggers and copywriting frameworks
          </p>
        </div>

        <div className="text-center p-6 border rounded-lg">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Platform Optimized</h3>
          <p className="text-muted-foreground">
            Tailored for TikTok, Instagram Reels, and YouTube Shorts
          </p>
        </div>
      </section>

      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Ready to transform your content strategy?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of creators who use Hook Line Studio to create viral content
        </p>
        <button className="btn-primary text-lg px-8 py-3">
          Get Started Free
        </button>
      </section>

      <footer className="text-center text-muted-foreground">
        <p>&copy; 2025 Hook Line Studio. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage