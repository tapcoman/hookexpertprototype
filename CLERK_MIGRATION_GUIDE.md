# Clerk Authentication Migration Guide

**Hook Line Studio - Complete Migration from Custom Auth to Clerk**

**Date**: 2025-01-10
**Current**: Custom email/password with JWT
**Target**: Clerk for professional auth management

---

## Why Migrate to Clerk?

### Current Issues with Custom Auth
- ❌ JWT in localStorage (XSS vulnerability)
- ❌ No token revocation on logout
- ❌ No password reset flow (users locked out permanently)
- ❌ No OAuth providers (Google, GitHub, etc.)
- ❌ No magic links or passwordless login
- ❌ Security burden on your team
- ❌ Maintenance overhead

### Benefits of Clerk
- ✅ Professional security team managing auth
- ✅ OAuth providers (Google, GitHub, Twitter, etc.)
- ✅ Magic links & passwordless
- ✅ MFA/2FA ready
- ✅ Pre-built UI components
- ✅ User management dashboard
- ✅ Webhooks for user events
- ✅ Next.js optimized
- ✅ httpOnly cookies (XSS protection)
- ✅ Automatic token refresh
- ✅ Free up to 10,000 MAU

### Cost Analysis
```
Clerk Pricing:
- Free: 10,000 MAU (Monthly Active Users)
- Pro: $25/month for 10K-50K MAU
- Enterprise: Custom pricing

Current Cost:
- $0 in fees
- High in developer time + security risk
- Missing features = lost conversions

ROI: If auth issues cause even 1 lost customer/month, Clerk pays for itself
```

---

## Migration Strategy: Zero-Downtime Approach

### Phase 1: Parallel System (Week 1)
Run both auth systems simultaneously:
- New users → Clerk
- Existing users → Legacy auth (until migration)
- No disruption to current users

### Phase 2: User Migration (Week 2)
Migrate existing users with email prompts:
- Email with migration link
- Auto-migrate on next login
- Grace period (30 days)

### Phase 3: Deprecate Legacy (Week 3)
- All traffic to Clerk
- Remove old auth code
- Clean up database

---

## Pre-Migration Checklist

### 1. Create Clerk Account
```bash
# 1. Go to https://clerk.com
# 2. Sign up with GitHub (recommended)
# 3. Create new application: "Hook Line Studio"
# 4. Choose authentication methods:
#    ✓ Email/Password
#    ✓ Google OAuth
#    ✓ GitHub OAuth (optional)
# 5. Get API keys from dashboard
```

### 2. Environment Variables Needed
```bash
# Add to .env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk redirect URLs (for OAuth callbacks)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### 3. Database Migration Plan
```sql
-- Add Clerk user ID to existing users table
ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255);
ALTER TABLE users ADD COLUMN migrated_to_clerk BOOLEAN DEFAULT FALSE;

-- Index for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);

-- Keep old auth fields temporarily for rollback
-- (password, firebase_uid will be removed after migration complete)
```

---

## Step-by-Step Implementation

### Step 1: Install Clerk Dependencies

```bash
cd /Users/jaydanbis/Documents/studiohookexpert/hooklinestudio
npm install @clerk/nextjs @clerk/clerk-sdk-node
```

**Dependencies:**
- `@clerk/nextjs`: React components & hooks for Next.js
- `@clerk/clerk-sdk-node`: Server-side SDK for backend

### Step 2: Configure Clerk Provider

**File**: `client/src/main.tsx` (or root app file)

```tsx
import { ClerkProvider } from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key')
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* Your existing app */}
      <RouterProvider router={router} />
    </ClerkProvider>
  )
}
```

**Note**: If using Vite (not Next.js), use `@clerk/clerk-react` instead of `@clerk/nextjs`

### Step 3: Replace Auth Components

**Before** (`client/src/components/auth/SimpleAuthForm.tsx`):
```tsx
// Custom email/password form
<form onSubmit={handleLogin}>
  <input type="email" />
  <input type="password" />
  <button>Sign In</button>
</form>
```

**After** (Clerk components):
```tsx
import { SignIn, SignUp } from '@clerk/clerk-react'

// Sign In Page
export function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/app"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg"
          }
        }}
      />
    </div>
  )
}

// Sign Up Page
export function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/onboarding"
      />
    </div>
  )
}
```

### Step 4: Update Auth Context

**File**: `client/src/contexts/ClerkAuthContext.tsx` (NEW)

```tsx
import { useUser, useAuth } from '@clerk/clerk-react'
import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  user: any
  isLoaded: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useAuth()

  return (
    <AuthContext.Provider value={{ user, isLoaded, isSignedIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useClerkAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useClerkAuth must be used within ClerkAuthProvider')
  return context
}
```

### Step 5: Protect Routes

**Before** (custom middleware):
```tsx
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" />
  return children
}
```

**After** (Clerk):
```tsx
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
```

### Step 6: Update Backend Middleware

**File**: `server/middleware/clerkAuth.ts` (NEW)

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node'
import { Request, Response, NextFunction } from 'express'

export async function verifyClerkToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No authentication token' })
    }

    // Verify token with Clerk
    const session = await clerkClient.sessions.verifySession(token, {
      jwtKey: process.env.CLERK_SECRET_KEY
    })

    // Get user from Clerk
    const user = await clerkClient.users.getUser(session.userId)

    // Attach to request
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' })
  }
}

// For backwards compatibility during migration
export async function verifyHybridAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  // Try Clerk first
  try {
    const session = await clerkClient.sessions.verifySession(token)
    const user = await clerkClient.users.getUser(session.userId)

    // Get internal user record by Clerk ID
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerk_id, user.id)
    })

    if (dbUser) {
      req.user = dbUser
      return next()
    }
  } catch (error) {
    // Fall through to legacy auth
  }

  // Fallback to legacy JWT auth
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId)
    })

    if (dbUser) {
      req.user = dbUser
      return next()
    }
  } catch (error) {
    // Neither auth worked
  }

  return res.status(401).json({ error: 'Authentication failed' })
}
```

### Step 7: Sync Users to Internal Database

**File**: `server/services/clerkUserSync.ts` (NEW)

```typescript
import { Webhook } from 'svix'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Webhook handler for Clerk user events
 * Called when users sign up, update, or delete
 */
export async function handleClerkWebhook(req: Request, res: Response) {
  // Verify webhook signature
  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  const payload = req.body
  const headers = req.headers

  let event
  try {
    event = webhook.verify(payload, {
      'svix-id': headers['svix-id'] as string,
      'svix-timestamp': headers['svix-timestamp'] as string,
      'svix-signature': headers['svix-signature'] as string
    })
  } catch (error) {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  // Handle different event types
  switch (event.type) {
    case 'user.created':
      await handleUserCreated(event.data)
      break
    case 'user.updated':
      await handleUserUpdated(event.data)
      break
    case 'user.deleted':
      await handleUserDeleted(event.data)
      break
  }

  return res.json({ success: true })
}

async function handleUserCreated(clerkUser: any) {
  // Create user in internal database
  await db.insert(users).values({
    clerk_id: clerkUser.id,
    email: clerkUser.email_addresses[0]?.email_address,
    first_name: clerkUser.first_name,
    last_name: clerkUser.last_name,
    email_verified: clerkUser.email_addresses[0]?.verification?.status === 'verified',
    migrated_to_clerk: true,
    subscription_plan: 'free',
    subscription_status: 'free'
  })
}

async function handleUserUpdated(clerkUser: any) {
  await db.update(users)
    .set({
      email: clerkUser.email_addresses[0]?.email_address,
      first_name: clerkUser.first_name,
      last_name: clerkUser.last_name,
      email_verified: clerkUser.email_addresses[0]?.verification?.status === 'verified'
    })
    .where(eq(users.clerk_id, clerkUser.id))
}

async function handleUserDeleted(clerkUser: any) {
  // Soft delete or anonymize
  await db.update(users)
    .set({
      email: `deleted-${clerkUser.id}@deleted.local`,
      first_name: null,
      last_name: null
    })
    .where(eq(users.clerk_id, clerkUser.id))
}
```

**Add webhook route** (`server/routes/webhooks.ts`):
```typescript
import express from 'express'
import { handleClerkWebhook } from '../services/clerkUserSync'

const router = express.Router()

router.post('/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook)

export default router
```

### Step 8: User Migration Script

**File**: `scripts/migrateUsersToClerk.ts` (NEW)

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node'
import { db } from '../server/db'
import { users } from '../server/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Migrate existing users to Clerk
 * Creates Clerk accounts for users without clerk_id
 */
async function migrateUsersToClerk() {
  console.log('Starting user migration to Clerk...')

  // Get all users without Clerk ID
  const unmigrated = await db.query.users.findMany({
    where: eq(users.migrated_to_clerk, false)
  })

  console.log(`Found ${unmigrated.length} users to migrate`)

  for (const user of unmigrated) {
    try {
      // Create user in Clerk (without password - they'll reset)
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [user.email],
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        skipPasswordChecks: true, // No password initially
        skipPasswordRequirement: true
      })

      // Update internal database with Clerk ID
      await db.update(users)
        .set({
          clerk_id: clerkUser.id,
          migrated_to_clerk: true
        })
        .where(eq(users.id, user.id))

      // Send password reset email via Clerk
      await clerkClient.users.updateUser(clerkUser.id, {
        password: undefined // This triggers password reset flow
      })

      console.log(`✅ Migrated user: ${user.email}`)
    } catch (error) {
      console.error(`❌ Failed to migrate ${user.email}:`, error)
    }
  }

  console.log('Migration complete!')
}

// Run migration
migrateUsersToClerk().catch(console.error)
```

**Run migration:**
```bash
npx tsx scripts/migrateUsersToClerk.ts
```

### Step 9: Update Routes

**Replace authentication routes:**

```typescript
// server/index.ts

// BEFORE: Custom auth routes
import authRoutes from './routes/simpleAuth'
app.use('/api/auth', authRoutes)

// AFTER: Clerk webhook + optional compatibility layer
import webhookRoutes from './routes/webhooks'
app.use('/api/webhooks', webhookRoutes)

// Optional: Keep legacy auth endpoints during migration
import { verifyHybridAuth } from './middleware/clerkAuth'
app.use('/api/hooks', verifyHybridAuth, hooksRoutes)
```

### Step 10: Update Frontend API Client

**File**: `client/src/lib/api.ts`

```typescript
// BEFORE: Manual token management
const token = localStorage.getItem('auth_token')
headers.Authorization = `Bearer ${token}`

// AFTER: Clerk token (automatic)
import { useAuth } from '@clerk/clerk-react'

export function useAuthenticatedFetch() {
  const { getToken } = useAuth()

  return async (url: string, options: RequestInit = {}) => {
    const token = await getToken()

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    })
  }
}
```

---

## Migration Timeline

### Week 1: Setup & Parallel System
**Monday-Tuesday**: Clerk setup
- [ ] Create Clerk account
- [ ] Install dependencies
- [ ] Add environment variables
- [ ] Configure Clerk provider

**Wednesday-Thursday**: Implement Clerk auth
- [ ] Replace auth components with Clerk UI
- [ ] Update auth context
- [ ] Implement backend middleware
- [ ] Set up webhooks

**Friday**: Testing
- [ ] Test new user registration with Clerk
- [ ] Test OAuth flows
- [ ] Verify database sync
- [ ] Test both auth systems in parallel

### Week 2: User Migration
**Monday**: Database migration
- [ ] Add clerk_id column to users table
- [ ] Test migration script with test users
- [ ] Run migration script on production
- [ ] Send migration emails to existing users

**Tuesday-Thursday**: Monitor migration
- [ ] Track migration success rate
- [ ] Handle edge cases
- [ ] Support users with issues
- [ ] Test hybrid auth middleware

**Friday**: Verification
- [ ] Verify all users migrated
- [ ] Test all features with Clerk auth
- [ ] Confirm no regressions

### Week 3: Deprecation
**Monday-Tuesday**: Remove legacy auth
- [ ] Remove old auth routes
- [ ] Remove SimpleAuthContext
- [ ] Remove JWT generation code
- [ ] Remove password hashing code

**Wednesday**: Cleanup database
- [ ] Archive old password hashes
- [ ] Remove temporary migration fields
- [ ] Clean up firebase_uid column

**Thursday-Friday**: Final testing
- [ ] Full regression test
- [ ] Security audit
- [ ] Performance testing
- [ ] Update documentation

---

## Rollback Plan

If critical issues arise:

### Emergency Rollback (< 24 hours)
```bash
# 1. Revert code deployment
git revert <commit-hash>
git push origin main

# 2. Users continue with legacy auth
# No data loss - old auth still works

# 3. Fix issues and retry migration
```

### Partial Rollback (Hybrid mode)
```typescript
// Keep both systems running longer
// Use verifyHybridAuth middleware
// Gradual cutover over 2-4 weeks
```

---

## Post-Migration Benefits

### Security Improvements
- ✅ httpOnly cookies (XSS protection)
- ✅ Automatic token refresh
- ✅ Token revocation on logout
- ✅ Password reset flow
- ✅ Breach password detection
- ✅ Professional security team

### Feature Additions
- ✅ OAuth providers (Google, GitHub)
- ✅ Magic links
- ✅ MFA/2FA
- ✅ User management dashboard
- ✅ Session management
- ✅ Device tracking

### Developer Experience
- ✅ Pre-built UI components
- ✅ No auth maintenance
- ✅ Comprehensive docs
- ✅ Active support community
- ✅ Regular updates

### Cost Savings
- ✅ No security incidents
- ✅ No auth-related dev time
- ✅ Better conversion (OAuth)
- ✅ Reduced support tickets

---

## Testing Checklist

### Pre-Migration Testing
- [ ] Test Clerk sign up flow
- [ ] Test OAuth providers (Google)
- [ ] Test magic link authentication
- [ ] Verify webhook endpoints working
- [ ] Test user sync to internal database

### Migration Testing
- [ ] Run migration script on test database
- [ ] Verify clerk_id assigned to all users
- [ ] Test legacy auth still works
- [ ] Test Clerk auth for migrated users
- [ ] Verify hybrid middleware switches correctly

### Post-Migration Testing
- [ ] All features work with Clerk auth
- [ ] Profile updates sync correctly
- [ ] Subscription status maintained
- [ ] Hook generation works
- [ ] Favorites/history accessible
- [ ] Logout/re-login works
- [ ] Password reset works
- [ ] MFA works (if enabled)

---

## Troubleshooting

### Issue: Users can't log in after migration
**Solution**: Check clerk_id mapping, verify webhook sync

### Issue: Subscription data lost
**Solution**: Subscription is in internal DB, not affected by Clerk migration

### Issue: OAuth redirect not working
**Solution**: Add redirect URLs to Clerk dashboard (Settings → Paths)

### Issue: Webhook signature verification fails
**Solution**: Verify CLERK_WEBHOOK_SECRET matches dashboard

### Issue: CORS errors
**Solution**: Add Clerk domains to ALLOWED_ORIGINS

---

## Next Steps

Ready to proceed? Let's:
1. Create Clerk account
2. Install dependencies
3. Start Phase 1 implementation

**Want me to start with Step 1 (Install Clerk dependencies)?**
