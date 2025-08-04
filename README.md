# Hook Line Studio

AI-powered video hook generation platform with psychological framework integration. Generate engaging tri-modal hooks (verbal, visual, textual) optimized for TikTok, Instagram Reels, and YouTube Shorts.

## 🎯 Project Overview

Hook Line Studio is a sophisticated SaaS platform that combines advanced AI with proven psychological frameworks to generate platform-optimized opening "hooks" for short-form video content. The platform creates tri-modal hooks consisting of verbal content, visual suggestions, and text overlays.

### Key Features

- **Tri-Modal Hook Generation**: Verbal, visual, and textual components
- **Psychological Framework Integration**: 24+ proven hook formulas
- **Platform Optimization**: TikTok, Instagram, YouTube specific
- **Advanced AI**: GPT-4o/GPT-4o-mini integration
- **Quality Scoring**: AI-powered scoring with detailed breakdowns
- **User Personalization**: Voice, industry, and audience customization

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- Firebase project for authentication
- OpenAI API key
- Stripe account for payments

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd HookLineStudio
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

   - Client: http://localhost:5173
   - Server: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

## 📁 Project Structure

```
HookLineStudio/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Radix UI components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── hook/       # Hook-specific components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── onboarding/ # Onboarding flow
│   │   │   └── mobile/     # Mobile-specific components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── types/          # TypeScript definitions
├── server/                 # Express backend
│   ├── db/                 # Database schema & connection
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware
│   └── routes/             # API endpoints
├── shared/                 # Shared schemas and types
└── migrations/            # Database migrations
```

## 🛠 Technology Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Vite** build system
- **Tailwind CSS** + **Radix UI** components
- **Wouter** for routing
- **TanStack React Query** for state management
- **Framer Motion** for animations

### Backend
- **Node.js/Express** server
- **PostgreSQL** with **Drizzle ORM**
- **Firebase Authentication**
- **OpenAI GPT-4o/GPT-4o-mini** integration
- **Stripe** payment processing

### Infrastructure
- **Railway** deployment platform
- **TypeScript** throughout
- **ESLint** + **Prettier** for code quality

## 🧠 Psychological Framework Architecture

The platform implements a comprehensive taxonomy of proven hook formulas:

### Hook Categories
- **Question-Based**: Direct questions, rhetorical questions, "what if" scenarios
- **Statement-Based**: Direct promises, startling facts, contrarian opinions
- **Narrative**: In medias res, personal confessions, before/after teasers
- **Urgency/Exclusivity**: Direct callouts, FOMO triggers, secret reveals
- **Efficiency**: Quick solutions, numbered lists, life hacks

### Psychological Triggers
- Curiosity gaps and open loops
- Pain point identification
- Value hits and instant gratification
- Social proof and authority
- Urgency and FOMO
- Emotional connections

## 📊 Database Schema

### Core Tables
- `users` - User profiles and subscription data
- `hook_generations` - Generated hook sets with tri-modal data
- `favorite_hooks` - User's saved hooks
- `psychological_frameworks` - Hook taxonomy database
- `analytics_events` - User behavior tracking

### Enhanced Features
- JSONB storage for flexible hook data
- Full-text search capabilities
- Analytics and A/B testing infrastructure
- GDPR compliance features

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Client only
npm run dev:server       # Server only

# Building
npm run build           # Build both client and server
npm run build:client    # Build client only
npm run build:server    # Build server only

# Database
npm run db:generate     # Generate migrations
npm run db:migrate      # Run migrations
npm run db:studio       # Open Drizzle Studio
npm run db:push         # Push schema changes

# Code Quality
npm run type-check      # TypeScript checking
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format with Prettier
```

## 🚀 Deployment

### Railway Deployment

1. **Connect Repository**
   ```bash
   # Railway will automatically detect the configuration
   ```

2. **Environment Variables**
   Set all required environment variables in Railway dashboard

3. **Database**
   Add PostgreSQL addon through Railway

4. **Deploy**
   ```bash
   npm run railway:build
   ```

### Manual Deployment

1. **Build Production**
   ```bash
   npm run build
   ```

2. **Start Server**
   ```bash
   npm start
   ```

## 🔐 Environment Variables

See `.env.example` for all required environment variables:

- Database connection (PostgreSQL)
- Firebase authentication credentials
- OpenAI API key
- Stripe payment keys
- App configuration settings

## 🎨 UI Components

Built with Radix UI primitives and Tailwind CSS:

- Accessible form components
- Modal dialogs and popovers
- Navigation menus
- Data tables and cards
- Loading states and animations

## 📱 Mobile Experience

Responsive design with mobile-first approach:

- Touch-friendly interactions
- Optimized layouts for small screens
- Bottom navigation bar
- Swipe gestures for hook browsing

## 🔍 API Documentation

### Core Endpoints

- `GET /api/health` - Health check
- `POST /api/hooks/generate` - Generate hooks
- `GET /api/hooks/history` - User's hook history
- `POST /api/hooks/favorite` - Save favorite hook
- `GET /api/user/profile` - User profile
- `POST /api/user/onboarding` - Complete onboarding

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📈 Performance Monitoring

- Core Web Vitals tracking
- Real-time performance insights
- Bundle size monitoring
- Database query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Hook Line Studio** - Transform your content strategy with AI-powered psychological frameworks.
EOF < /dev/null# Deployment Trigger - Mon  4 Aug 2025 22:26:58 BST
