# 🎯 Stripe Payment Integration - Complete Activation Guide

Hook Line Studio comes with a **fully-built Stripe payment system** that just needs to be activated. This guide will walk you through the complete setup process.

## 🏗️ What's Already Built

✅ **Complete Backend Infrastructure**
- Stripe SDK integration with proper configuration
- Full subscription management (create, update, cancel, resume)
- Usage tracking and credit system enforcement
- Webhook handling for all subscription events
- Payment history and billing portal integration
- Comprehensive error handling and logging

✅ **Frontend Payment UI**
- Complete pricing page with plan comparison
- Billing page with subscription management
- Usage tracking display with progress bars
- Stripe checkout integration
- Subscription status and payment history

✅ **Database Schema**
- Subscription plans table with all plan configurations
- Payment history tracking
- Usage tracking with monthly limits
- Webhook event logging
- User subscription status management

✅ **Credit System Implementation**
- **Free Plan**: 10 hooks/month
- **Starter Plan**: 100 hooks/month ($9)
- **Creator Plan**: 300 hooks/month ($15)
- **Pro Plan**: 1000 hooks/month ($24)
- **Teams Plan**: Unlimited hooks ($59)

## 🚀 Quick Setup (2 Minutes)

### Step 1: Get Stripe Credentials
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from [Dashboard > API Keys](https://dashboard.stripe.com/apikeys)

### Step 2: Configure Environment
Add to your `.env` file:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
WEBHOOK_URL=https://your-domain.com/api/payments/webhooks/stripe
```

For the frontend, add to `client/.env`:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### Step 3: Run Activation Script
```bash
npm run activate:stripe
```

This single command will:
- ✅ Test your Stripe connection
- ✅ Create all 5 subscription plans in Stripe
- ✅ Set up webhook endpoints automatically
- ✅ Update your database with Stripe plan IDs
- ✅ Test the complete payment flow
- ✅ Display a complete setup summary

### Step 4: Deploy and Test
1. Deploy your app with the new environment variables
2. Visit `/pricing` to see your live subscription plans
3. Test checkout with Stripe test cards
4. Check `/billing` for subscription management

**That's it! Your payment system is now live! 🎉**

---

## 📋 Manual Setup (If You Prefer)

### Option A: Create Stripe Plans Manually
```bash
npm run setup:stripe-plans  # Creates products in Stripe
npm run db:seed             # Updates database with plan IDs
```

### Option B: Use Stripe Dashboard
1. Create products in [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Update `server/db/seed.ts` with your actual price IDs
3. Run `npm run db:seed`

---

## 🧪 Testing Your Payment System

### Test Cards (Development)
```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Requires SCA: 4000 0025 0000 3155
```

### Test Flow
1. **Pricing Page**: `/pricing` - See all plans with real Stripe checkout
2. **Subscribe**: Click any paid plan, complete checkout
3. **Billing Page**: `/billing` - Manage subscription, view usage
4. **Hook Generation**: Test credit limits and usage tracking
5. **Webhooks**: Monitor events in [Stripe Dashboard](https://dashboard.stripe.com/webhooks)

---

## 🔧 Advanced Configuration

### Webhook Events Handled
- `customer.subscription.created` - New subscription setup
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellations  
- `invoice.payment_succeeded` - Successful payments
- `invoice.payment_failed` - Failed payments
- `customer.updated` - Customer info changes
- `checkout.session.completed` - Checkout completion

### Usage Enforcement
The system automatically:
- ✅ Checks credit limits before each hook generation
- ✅ Blocks generation when limits are reached
- ✅ Resets usage counters monthly
- ✅ Handles plan upgrades/downgrades
- ✅ Manages free trial periods

### Error Handling
- ✅ Failed payments with retry logic
- ✅ Webhook signature verification
- ✅ Subscription status sync
- ✅ Usage tracking consistency
- ✅ Comprehensive logging

---

## 📊 Plan Configuration

| Plan | Price | Hooks/Month | Features |
|------|-------|-------------|----------|
| **Free** | $0 | 10 | Basic formulas, Community support |
| **Starter** | $9 | 100 | All formulas, Email support, 7-day trial |
| **Creator** | $15 | 300 | Priority support, Analytics, 7-day trial |
| **Pro** | $24 | 1,000 | Advanced analytics, Performance insights |
| **Teams** | $59 | Unlimited | 3 seats, Team collaboration, Priority support |

---

## 🛠️ Troubleshooting

### Common Issues

**❌ "Stripe not configured"**
- Check `STRIPE_SECRET_KEY` in environment
- Verify key starts with `sk_test_` or `sk_live_`

**❌ "Webhook signature verification failed"**
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Check webhook URL is publicly accessible

**❌ "Plans not loading"**
- Run `npm run db:seed` to populate plans
- Check database connection
- Verify plan IDs match Stripe dashboard

**❌ "Credit limits not working"**
- Check usage tracking in database
- Verify user subscription status
- Look for errors in application logs

### Health Check
Visit `/api/health` to verify all services:
```json
{
  "status": "healthy",
  "services": {
    "database": "operational",
    "stripe": {
      "configured": true,
      "initialized": true,
      "webhookSecret": true
    }
  }
}
```

### Database Verification
```sql
-- Check subscription plans
SELECT name, "displayName", price, "proGenerationsLimit" FROM subscription_plans;

-- Check user subscriptions  
SELECT email, "subscriptionPlan", "subscriptionStatus" FROM users;

-- Check usage tracking
SELECT "userId", "proGenerationsUsed", "proGenerationsLimit" FROM usage_tracking;
```

---

## 🚀 Going Live (Production)

### 1. Switch to Live Mode
Replace test keys with live keys:
```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
```

### 2. Production Webhook
- Create webhook in Stripe Dashboard for production domain
- Update `STRIPE_WEBHOOK_SECRET` with production secret

### 3. Verify Configuration
```bash
npm run activate:stripe  # Run again to verify production setup
```

### 4. Monitor & Scale
- Monitor webhooks in Stripe Dashboard
- Set up alerts for failed payments
- Monitor usage patterns and plan performance

---

## 💰 Revenue Tracking

Your app will automatically track:
- ✅ Monthly Recurring Revenue (MRR)
- ✅ Customer Lifetime Value (CLV)
- ✅ Churn rates by plan
- ✅ Usage patterns and limits
- ✅ Conversion funnel analytics

Access business intelligence at `/api/analytics/overview`

---

## 📞 Support

**Need Help?**
1. Check logs for detailed error messages
2. Verify environment variables
3. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe`
4. Monitor webhook events in Stripe Dashboard

**Your Hook Line Studio payment system is production-ready! 🎉**

Start generating revenue from your AI hook generation platform today!