# 🚀 Quick Vercel Deployment Instructions

## Step 1: Deploy via Vercel Dashboard

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Login** with your GitHub account
3. **Click "New Project"**
4. **Import Repository**: 
   - Select `tapcoman/hookexpertprototype` from your GitHub repositories
   - Click "Import"

## Step 2: Configure Project Settings

**Framework Preset**: Other  
**Root Directory**: `./` (leave as default)  
**Build Command**: `npm run vercel-build`  
**Output Directory**: `client/dist`  
**Install Command**: `npm install`  

Click **"Deploy"** - this initial deployment will fail, but that's expected.

## Step 3: Add Environment Variables

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add these required variables:

### Database (Choose one service)
```
DATABASE_URL=postgresql://username:password@host:port/database
```

**Recommended Database Providers:**
- **Neon** (https://neon.tech) - Serverless PostgreSQL
- **Supabase** (https://supabase.com) - Free tier available
- **PlanetScale** (https://planetscale.com) - MySQL alternative

### OpenAI API
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```
Get your key from: https://platform.openai.com/api-keys

### Firebase Authentication
```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-base64-encoded-private-key
```

### Stripe Payments
```
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### App Configuration
```
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
JWT_SECRET=your-random-64-character-secret
```

## Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

## Step 5: Setup Database

After successful deployment, you need to run database migrations:

### Option A: Using a Database Client
1. Connect to your PostgreSQL database
2. Run the SQL files from the `migrations/` folder in order:
   - `0000_lovely_havok.sql`
   - `0001_luxuriant_silverclaw.sql` 
   - `0002_abandoned_steel_serpent.sql`

### Option B: Using Vercel CLI (if you have it setup)
```bash
vercel env pull .env.production
npm run db:migrate
npm run db:seed
```

## Step 6: Configure External Services

### Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-vercel-url.vercel.app/api/payments/webhooks/stripe`
3. Select events: `customer.subscription.*`, `invoice.payment_*`
4. Copy webhook secret to Vercel environment variables

### Firebase Setup
1. Add your Vercel domain to Firebase authorized domains
2. Update OAuth redirect URLs in Firebase console

## Step 7: Verify Deployment

### Health Check
Visit: `https://your-vercel-url.vercel.app/api/health`

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "services": {
    "database": "operational",
    "ai": "configured",
    "firebase": {
      "configured": true
    }
  }
}
```

### Frontend Test
Visit: `https://your-vercel-url.vercel.app`
- Landing page should load
- Sign up/login should work
- Hook generation should function

## 🎉 Your Hook Line Studio is Live!

Once deployed, your sophisticated AI-powered hook generation platform with psychological framework integration will be live and ready for users worldwide!

**Your platform includes:**
✅ 24+ psychological hook formulas  
✅ Tri-modal hook generation  
✅ Advanced AI quality scoring  
✅ User authentication & subscriptions  
✅ Mobile-optimized PWA  
✅ Comprehensive analytics  

## Troubleshooting

**Build Fails?** Check the build logs in Vercel dashboard  
**Database Issues?** Verify DATABASE_URL format and connection  
**API Errors?** Check function logs in Vercel dashboard  
**Auth Problems?** Verify Firebase configuration and domains  

For detailed troubleshooting, see `VERCEL_DEPLOYMENT_GUIDE.md`