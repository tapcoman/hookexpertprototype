# Hybrid Authentication System

## Overview

The Hook Line Studio backend now supports **both** legacy JWT authentication and Clerk authentication through a hybrid middleware system. This allows for gradual migration from custom JWT to Clerk without breaking existing functionality.

## Architecture

### Files

1. **`clerkAuth.ts`** - Clerk session token verification
2. **`hybridAuth.ts`** - Combined authentication middleware
3. **`simpleAuth.ts`** - Legacy JWT verification (unchanged)

### Flow

```
Client Request
    ↓
Extract Bearer Token
    ↓
Determine Token Type (heuristic: length > 200 chars = Clerk)
    ↓
    ├─→ Try Clerk Verification First (if looks like Clerk token)
    │       ↓
    │   Success? → Attach user to req.user → Continue
    │       ↓
    │   Fail? → Try JWT Fallback
    │
    ├─→ Try JWT Verification First (if looks like JWT token)
    │       ↓
    │   Success? → Attach user to req.user → Continue
    │       ↓
    │   Fail? → Try Clerk Fallback
    │
    ↓
Both Failed? → Return 401 Unauthorized
```

## Usage

### Protected Routes

Replace `verifyJWTToken` with `hybridAuth`:

```typescript
// Before
import { verifyJWTToken } from '../middleware/simpleAuth.js'
router.use(verifyJWTToken)

// After
import { hybridAuth } from '../middleware/hybridAuth.js'
router.use(hybridAuth)
```

### Optional Auth Routes

Replace `optionalAuth` with `optionalHybridAuth`:

```typescript
// Before
import { optionalAuth } from '../middleware/simpleAuth.js'
router.get('/public-data', optionalAuth, handler)

// After
import { optionalHybridAuth } from '../middleware/hybridAuth.js'
router.get('/public-data', optionalHybridAuth, handler)
```

### Route Files Updated

- ✅ `routes/hooks.ts`
- ✅ `routes/users.ts`
- ✅ `routes/projects.ts`
- ✅ `routes/v0-compat.ts`
- ✅ `routes/analytics.ts`
- ✅ `routes/payments.ts`

## Clerk Token Verification

### Process

1. Extract Bearer token from `Authorization` header
2. Verify token signature using `clerkClient.verifyToken()`
3. Extract `userId` from verified token
4. Fetch user details from Clerk API
5. Find/create user in local database by `clerkId` (stored in `firebaseUid` column)
6. Attach user to `req.user` with same shape as JWT auth

### Database Integration

When a Clerk user authenticates:
- Check if user exists by `firebaseUid` (repurposed as `clerkId`)
- If not found, check by email
- If found by email but no `clerkId`, link the accounts
- If not found at all, webhook should have created user (if not, return minimal user object)

### User Object Shape

Both auth methods attach the same shape to `req.user`:

```typescript
{
  id: string           // Internal database user ID
  email: string        // User's email
  subscriptionStatus: string  // 'free', 'active', etc.
  isPremium: boolean   // Premium subscription status
}
```

## Token Detection

### Heuristic

- **Clerk tokens**: Typically >200 characters, complex JWT structure
- **Legacy JWTs**: Shorter, simpler structure

### Example

```typescript
function isClerkToken(token: string): boolean {
  return token.length > 200
}
```

This heuristic determines which verification method to try first.

## Error Handling

### Clear Error Messages

All error responses follow the APIResponse format:

```typescript
{
  success: false,
  error: string           // Technical error
  errorCode: string       // Machine-readable code
  userMessage: string     // User-friendly message
  canRetry: boolean       // Whether user should retry
  actionRequired: string[] // Suggested actions
}
```

### Error Codes

- `TOKEN_MISSING` - No authorization token provided
- `CLERK_NOT_CONFIGURED` - Clerk secret key missing
- `CLERK_SESSION_INVALID` - Clerk token verification failed
- `AUTH_FAILED` - Both auth methods failed
- `TOKEN_INVALID` - Legacy JWT verification failed
- `TOKEN_EXPIRED` - Legacy JWT expired

## Security Features

### Logging

All authentication attempts are logged:

```typescript
logSecurityEvent('hybrid_auth_attempt', {
  endpoint: req.path,
  method: req.method,
  tokenType: 'clerk' | 'jwt',
  ipAddress: req.ip
})
```

Success and failure events are tracked separately.

### Rate Limiting

Existing rate limiting middleware still applies after authentication.

## Environment Variables

Required:

```env
CLERK_SECRET_KEY=sk_test_...  # Clerk secret key
JWT_SECRET=your-jwt-secret     # Legacy JWT secret
```

## Migration Strategy

### Phase 1: Hybrid Support (Current)

- Both JWT and Clerk tokens work
- No breaking changes for existing clients
- New clients can use Clerk immediately

### Phase 2: Clerk Primary (Future)

- Deprecation warnings for JWT
- Encourage migration to Clerk
- Monitor JWT usage metrics

### Phase 3: Clerk Only (Future)

- Remove legacy JWT support
- Clean up code
- Update documentation

## Testing

### Manual Testing

#### Test Clerk Auth

```bash
# Get Clerk session token from frontend
export CLERK_TOKEN="your-clerk-token"

curl -H "Authorization: Bearer $CLERK_TOKEN" \
  http://localhost:3000/api/users/profile
```

#### Test Legacy JWT Auth

```bash
# Get legacy JWT token
export JWT_TOKEN="your-jwt-token"

curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3000/api/users/profile
```

Both should work and return the same user data.

## Troubleshooting

### Clerk Authentication Fails

1. Check `CLERK_SECRET_KEY` is set correctly
2. Verify token is a valid Clerk session token
3. Check Clerk user exists and has email
4. Check database user record exists (webhook may need to sync)

### JWT Authentication Fails

1. Check `JWT_SECRET` is set correctly
2. Verify token hasn't expired (7 day TTL)
3. Check user exists in database

### Both Fail

1. Check token format (should start with "Bearer ")
2. Verify token is valid (not corrupted/truncated)
3. Check logs for detailed error messages

## Performance Considerations

### Optimization

- Token type heuristic reduces unnecessary verification attempts
- Clerk verification happens first for Clerk tokens (most common for new users)
- JWT verification happens first for JWT tokens (most common for existing users)
- Fallback only attempted if first method fails

### Latency

- Clerk verification: ~100-200ms (API call to Clerk)
- JWT verification: ~5-10ms (local crypto operation)
- Hybrid overhead: Negligible (just heuristic check)

## Future Enhancements

1. **Token Caching**: Cache Clerk user data to reduce API calls
2. **Metrics Dashboard**: Track auth method usage over time
3. **Automatic Migration**: Automatically migrate JWT users to Clerk
4. **Admin Controls**: Toggle between auth methods via admin panel
