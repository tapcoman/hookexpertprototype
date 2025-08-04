# 🚀 Hook Line Studio - Production Deployment Guide

Complete guide for deploying Hook Line Studio to Vercel with production-ready configuration.

## 📋 Prerequisites

### Required Services
- ✅ **Vercel Account** - For hosting and serverless functions
- ✅ **PostgreSQL Database** - Neon, Supabase, or PlanetScale (recommended)
- ✅ **Firebase Project** - For authentication
- ✅ **OpenAI API Key** - For AI hook generation
- ✅ **Stripe Account** - For payment processing
- ✅ **Domain Name** (optional) - For custom domain

### Development Environment
- ✅ **Node.js 18+** - Required for all operations
- ✅ **npm or yarn** - Package management
- ✅ **Git** - Version control
- ✅ **Vercel CLI** (optional) - For local testing

## 🛠️ Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [Neon Console](https://console.neon.tech)
2. Create new project: "hook-line-studio-prod"
3. Copy the connection string
4. Enable connection pooling for serverless

### Option B: Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string
5. Enable connection pooling

### Option C: PlanetScale
1. Go to [PlanetScale Dashboard](https://app.planetscale.com)
2. Create new database
3. Create production branch
4. Copy connection string

### Database Configuration
```env
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=15000
DB_SSL_REQUIRED=true
```

## 🔥 Step 2: Firebase Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "hook-line-studio-prod"
3. Enable Authentication
4. Add web app and copy config

### Authentication Configuration
1. Enable Email/Password authentication
2. Configure authorized domains (add your Vercel domain)
3. Generate service account key:
   ```bash
   # In Firebase Console
   Project Settings → Service Accounts → Generate new private key
   ```

### Environment Variables
```env
FIREBASE_PROJECT_ID=your-production-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_WEBHOOK_SECRET=your-webhook-secret-key
REQUIRE_EMAIL_VERIFICATION=true
```

## 💳 Step 3: Stripe Configuration

### Production Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to Live Mode
3. Get API keys from Developers → API Keys
4. Set up webhook endpoint: `https://your-domain.vercel.app/api/payments/webhooks/stripe`

### Webhook Events
Configure these webhook events in Stripe:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_live_your-production-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-production-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-production-publishable-key
```

## 🤖 Step 4: OpenAI Setup

### API Key Configuration
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create API key for production
3. Set usage limits and monitoring

### Environment Variables
```env
OPENAI_API_KEY=sk-your-production-openai-api-key
```

## 🔒 Step 5: Security Configuration

### JWT Secret Generation
Generate a secure JWT secret (64+ characters):
```bash
# Generate secure random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Environment Variables
```env
JWT_SECRET=your-super-secure-64-character-jwt-secret-here
HELMET_CSP_ENABLED=true
CORS_CREDENTIALS=true
TRUST_PROXY=1
SESSION_SECURE=true
```

## 🌐 Step 6: Vercel Deployment

### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the Hook Line Studio project

### 2. Configure Build Settings
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install --omit=dev`
- **Node.js Version**: `18.x`

### 3. Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables, add:

#### Required Variables
```env
# Database
DATABASE_URL=postgresql://...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_WEBHOOK_SECRET=your-webhook-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key

# Security
JWT_SECRET=your-64-character-jwt-secret

# Application
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.vercel.app
```

#### Optional but Recommended
```env
# Monitoring
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Analytics
ANALYTICS_RETENTION_DAYS=365
PERFORMANCE_TRACKING_ENABLED=true

# Features
FEATURE_PSYCHOLOGICAL_PROFILING=true
FEATURE_AB_TESTING=true
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_PREMIUM_MODELS=true

# Email (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@your-domain.com

# Cache (Optional)
REDIS_URL=rediss://your-redis-url
CACHE_TTL=7200
```

### 4. Deploy
1. Click "Deploy" in Vercel Dashboard
2. Wait for build to complete
3. Test the deployment

## 🗄️ Step 7: Database Migration

### Run Migrations
```bash
# Using Vercel CLI (recommended)
vercel env pull .env.local
npm run db:migrate

# Or using the deployment script
tsx scripts/deploy-production.ts
```

## 🔍 Step 8: Post-Deployment Verification

### Health Check
Visit: `https://your-domain.vercel.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "production",
  "version": "2.0.0",
  "serverless": true,
  "services": {
    "database": "operational",
    "ai": "configured",
    "firebase": {
      "configured": true,
      "initialized": true,
      "projectId": "your-project-id"
    },
    "stripe": {
      "configured": true,
      "initialized": true,
      "webhookSecret": true
    }
  }
}
```

### Test Key Functionality
1. ✅ **User Registration** - Create test account
2. ✅ **Authentication** - Login/logout flow
3. ✅ **Hook Generation** - Generate test hooks
4. ✅ **Payment Flow** - Test subscription (use Stripe test cards)
5. ✅ **Database Operations** - Check data persistence
6. ✅ **API Endpoints** - Test all major endpoints

## 🏁 Step 9: Custom Domain (Optional)

### Add Custom Domain
1. In Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update environment variables:
   ```env
   ALLOWED_ORIGINS=https://your-custom-domain.com
   ```

### SSL Certificate
Vercel automatically provisions SSL certificates for custom domains.

## 📊 Step 10: Monitoring Setup

### Error Tracking (Sentry)
1. Create [Sentry](https://sentry.io) account
2. Create new project
3. Copy DSN to environment variables

### Performance Monitoring
- Vercel provides built-in analytics
- Consider adding New Relic or DataDog for advanced monitoring

### Database Monitoring
- Set up alerts for connection limits
- Monitor query performance
- Configure backup schedules

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel Dashboard
# Common causes:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Dependency issues

# Solution: Run local build test
npm run build:production
```

#### Database Connection Issues
```bash
# Test database connection
tsx scripts/test-db-connection.ts

# Common causes:
# 1. Incorrect DATABASE_URL
# 2. SSL configuration
# 3. Connection limits exceeded
```

#### Serverless Function Timeout
```javascript
// Increase timeout in vercel.json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  }
}
```

#### Cold Start Issues
- Function warmup is implemented
- Consider using Vercel Pro for better performance
- Optimize database connections

## 🔧 Maintenance

### Regular Tasks
- [ ] Monitor error rates and performance
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Backup database regularly
- [ ] Monitor usage limits and costs

### Updates
```bash
# Update dependencies
npm update
npm audit fix

# Deploy updates
git push origin main  # Auto-deploys via Vercel
```

## 📈 Scaling Considerations

### Traffic Scaling
- Vercel automatically scales serverless functions
- Monitor database connection limits
- Consider read replicas for high traffic

### Cost Optimization
- Optimize bundle sizes
- Implement caching strategies
- Monitor Vercel function invocations
- Use database connection pooling

## 🛡️ Security Checklist

- [x] Environment variables secured
- [x] HTTPS enforced
- [x] CORS properly configured
- [x] Rate limiting enabled
- [x] Input validation implemented
- [x] Security headers configured
- [x] Database connections encrypted
- [x] JWT secrets rotated
- [x] Stripe webhooks verified
- [x] Firebase rules configured

## 📞 Support

### Resources
- **Vercel Documentation**: https://vercel.com/docs
- **PostgreSQL Guides**: Provider-specific documentation
- **Firebase Documentation**: https://firebase.google.com/docs
- **Stripe Integration**: https://stripe.com/docs

### Emergency Contacts
- Database provider support
- Vercel support (for Pro/Enterprise plans)
- Payment processor support

---

## ✅ Deployment Complete!

Your Hook Line Studio application is now running in production with:
- ⚡ **Optimized serverless architecture**
- 🛡️ **Production-grade security**
- 📊 **Comprehensive monitoring**
- 🔄 **Automatic scaling**
- 💳 **Payment processing**
- 🔐 **User authentication**

**Next Steps:**
1. Monitor the application for the first 24 hours
2. Set up alerts and monitoring dashboards
3. Prepare marketing and user onboarding
4. Plan regular maintenance schedule

---

*Generated with Hook Line Studio Production Deployment System v2.0*