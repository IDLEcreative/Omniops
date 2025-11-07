# Analytics Security Implementation

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-07
**Verified For:** v0.1.0
**Dependencies:** [Authentication](../01-ARCHITECTURE/ARCHITECTURE_AUTH.md), [Rate Limiting](REFERENCE_RATE_LIMITING.md)
**Estimated Read Time:** 10 minutes

## Purpose
Complete reference for authentication, authorization, rate limiting, and security measures protecting analytics endpoints from unauthorized access and abuse.

## Quick Links
- [Authentication Middleware](/Users/jamesguy/Omniops/lib/middleware/auth.ts)
- [Rate Limiting](/Users/jamesguy/Omniops/lib/middleware/analytics-rate-limit.ts)
- [Security Test Suite](/Users/jamesguy/Omniops/scripts/tests/test-analytics-security.ts)

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Rate Limiting](#rate-limiting)
- [Multi-Tenant Security](#multi-tenant-security)
- [Security Headers](#security-headers)
- [Cache Invalidation](#cache-invalidation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

All analytics endpoints are protected with multiple security layers:

1. **Authentication** - Supabase session validation
2. **Authorization** - Role-based access control (admin vs member)
3. **Rate Limiting** - Redis-backed request throttling
4. **Multi-Tenant Isolation** - Organization-scoped data access
5. **Security Headers** - HTTP headers for defense-in-depth

### Protected Endpoints

| Endpoint | Auth Level | Rate Limit | Description |
|----------|-----------|------------|-------------|
| `/api/dashboard/analytics` | User | 20/min | Dashboard metrics (all users) |
| `/api/analytics/intelligence` | Admin | 10/min | Business intelligence (admin only) |
| `/api/analytics/cache/invalidate` | Admin | 5/min | Cache management (admin only) |

---

## Authentication

### Implementation

**Middleware:** `/lib/middleware/auth.ts`

```typescript
import { requireAuth, requireAdmin } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  // User authentication
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult; // Returns 401 if not authenticated
  }
  const { user, supabase } = authResult;

  // OR admin authentication
  const adminResult = await requireAdmin();
  if (adminResult instanceof NextResponse) {
    return adminResult; // Returns 401/403 if not admin
  }
  const { user, supabase, organizationId, role } = adminResult;
}
```

### Functions

#### `requireAuth()`
- **Purpose:** Validates user has active Supabase session
- **Returns:** `AuthResult` (user + supabase client) or `NextResponse` (401 error)
- **Use Case:** All authenticated endpoints (dashboard, settings, etc.)

```typescript
interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}
```

#### `requireAdmin()`
- **Purpose:** Validates user has admin/owner role
- **Returns:** `OrgMembershipResult` or `NextResponse` (401/403 error)
- **Use Case:** Admin-only endpoints (BI, cache management, etc.)

```typescript
interface OrgMembershipResult extends AuthResult {
  organizationId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}
```

#### `requireOrgAccess(organizationId: string)`
- **Purpose:** Validates user is member of specific organization
- **Returns:** `OrgMembershipResult` or `NextResponse` (403 error)
- **Use Case:** Organization-scoped resources

### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "message": "You must be logged in to access this resource"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "This resource requires administrator privileges"
}
```

---

## Authorization

### Role Hierarchy

1. **Owner** - Full access, can manage billing
2. **Admin** - Full access, cannot manage billing
3. **Member** - Read access to own organization data
4. **Viewer** - Read-only access (limited)

### Admin Roles

Business Intelligence and cache management require admin privileges:

```typescript
const ADMIN_ROLES = ['owner', 'admin'];
```

### Implementation Example

```typescript
// Check if user is admin in their organization
const { data: membership } = await supabase
  .from('organization_members')
  .select('organization_id, role')
  .eq('user_id', user.id)
  .in('role', ['owner', 'admin'])
  .single();

if (!membership) {
  return NextResponse.json(
    { error: 'Forbidden', message: 'Admin privileges required' },
    { status: 403 }
  );
}
```

---

## Rate Limiting

### Implementation

**Middleware:** `/lib/middleware/analytics-rate-limit.ts`

```typescript
import { checkAnalyticsRateLimit, addRateLimitHeaders } from '@/lib/middleware/analytics-rate-limit';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  // Check rate limit
  const rateLimitError = await checkAnalyticsRateLimit(user, 'dashboard');
  if (rateLimitError) {
    return rateLimitError; // Returns 429 Too Many Requests
  }

  // ... process request ...

  // Add rate limit headers to response
  const response = NextResponse.json(data);
  await addRateLimitHeaders(response, user, 'dashboard');
  return response;
}
```

### Rate Limit Configuration

```typescript
const RATE_LIMITS = {
  dashboard: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  intelligence: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  cacheInvalidation: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
};
```

### Rate Limit Response

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests to dashboard analytics. Please try again in 45 seconds.",
  "retryAfter": 45,
  "resetTime": "2025-11-07T20:30:00.000Z",
  "limit": 20,
  "window": "60s"
}
```

**Headers:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-11-07T20:30:00.000Z
Retry-After: 45
```

### Redis Backend

Rate limits use Redis for distributed consistency:
- **Key Pattern:** `analytics:{endpoint}:{userId}`
- **Expiry:** Automatic after window duration
- **Atomic Operations:** INCR + PEXPIRE in pipeline
- **Fail-Open:** Allows request if Redis unavailable

---

## Multi-Tenant Security

### Domain Filtering

Users can only access data from their organization's domains:

```typescript
// 1. Get user's organization
const { data: membership } = await supabase
  .from('organization_members')
  .select('organization_id, role')
  .eq('user_id', user.id)
  .single();

// 2. Get organization's domains
const { data: configs } = await supabase
  .from('customer_configs')
  .select('domain')
  .eq('organization_id', membership.organization_id);

const allowedDomains = configs?.map(c => c.domain) || [];

// 3. Validate requested domain
if (requestedDomain && !allowedDomains.includes(requestedDomain)) {
  return NextResponse.json(
    { error: 'Forbidden', message: 'You do not have access to data for this domain' },
    { status: 403 }
  );
}
```

### Query Filtering

Database queries automatically filter by allowed domains:

```typescript
let query = supabase
  .from('messages')
  .select('*, conversations!inner(domain)')
  .gte('created_at', startDate.toISOString());

// Multi-tenant filtering
if (allowedDomains.length > 0) {
  query = query.in('conversations.domain', allowedDomains);
}
```

### Cross-Tenant Access Prevention

**Scenario:** User A tries to access Organization B's data

1. **Request:** `GET /api/analytics/intelligence?domain=org-b.com`
2. **Check:** User A's allowedDomains = `['org-a.com']`
3. **Result:** 403 Forbidden
4. **Log:** Warning logged with user ID, requested domain, allowed domains

---

## Security Headers

### HTTP Headers

Configured in `/next.config.js`:

```javascript
headers: [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN' // Prevents clickjacking
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff' // Prevents MIME sniffing
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block' // XSS filter
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self' ..." // CSP
  }
]
```

### Purpose

| Header | Protection |
|--------|-----------|
| `X-Frame-Options` | Prevents embedding in iframes (clickjacking) |
| `X-Content-Type-Options` | Prevents MIME type confusion attacks |
| `X-XSS-Protection` | Enables browser XSS filter |
| `Content-Security-Policy` | Restricts resource loading |

---

## Cache Invalidation

### Endpoint

**POST** `/api/analytics/cache/invalidate`

**Authentication:** Admin only
**Rate Limit:** 5 requests/minute

### Usage

```bash
# Clear all caches
curl -X POST "http://localhost:3000/api/analytics/cache/invalidate?type=all" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear dashboard cache only
curl -X POST "http://localhost:3000/api/analytics/cache/invalidate?type=dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear BI cache for specific domain
curl -X POST "http://localhost:3000/api/analytics/cache/invalidate?type=bi&domain=example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response

```json
{
  "success": true,
  "message": "Cache invalidation completed",
  "type": "dashboard",
  "domain": "all",
  "deletedKeys": 42,
  "errors": 0
}
```

### Cache Patterns

| Type | Redis Pattern | Description |
|------|---------------|-------------|
| Dashboard | `analytics:dashboard:*` | Dashboard metrics cache |
| BI | `analytics:bi:*` | Business intelligence cache |
| Query | `cache:*` | Search query cache |

### Get Cache Stats

**GET** `/api/analytics/cache/invalidate?type=all`

```json
{
  "type": "all",
  "stats": {
    "dashboardCacheKeys": 18,
    "biCacheKeys": 24,
    "queryCacheKeys": 156
  },
  "timestamp": "2025-11-07T20:00:00.000Z"
}
```

---

## Testing

### Test Suite

**Script:** `/scripts/tests/test-analytics-security.ts`

```bash
# Set test credentials
export TEST_USER_EMAIL="user@example.com"
export TEST_USER_PASSWORD="password123"
export TEST_ADMIN_EMAIL="admin@example.com"
export TEST_ADMIN_PASSWORD="adminpass123"

# Run tests
npx tsx scripts/tests/test-analytics-security.ts
```

### Test Coverage

1. ✓ Unauthenticated access returns 401
2. ✓ Non-admin access to BI returns 403
3. ✓ Authenticated dashboard access succeeds
4. ✓ Admin BI access succeeds
5. ✓ Rate limiting enforced (429 after limit)
6. ✓ Cache invalidation admin-only
7. ✓ Security headers present

### Quick Curl Tests

```bash
# Basic security checks (no auth required)
bash scripts/tests/test-analytics-security-curl.sh
```

### Manual Testing

```bash
# Test 1: Unauthenticated (should return 401)
curl -i http://localhost:3000/api/dashboard/analytics

# Test 2: With auth token
curl -i http://localhost:3000/api/dashboard/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test 3: Rate limiting (run 21 times)
for i in {1..21}; do
  curl -s http://localhost:3000/api/dashboard/analytics \
    -H "Authorization: Bearer YOUR_TOKEN" \
    | jq -r '.error // "success"'
done
```

---

## Troubleshooting

### "Authentication required" (401)

**Cause:** No valid Supabase session

**Solutions:**
1. Ensure user is logged in
2. Check session cookie exists
3. Verify token in Authorization header

```bash
# Check if session exists
curl -i http://localhost:3000/api/dashboard/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### "Forbidden" (403)

**Cause 1:** Non-admin accessing BI endpoint

**Solution:** Use admin account or dashboard endpoint instead

**Cause 2:** Accessing unauthorized domain

**Solution:** Verify domain belongs to your organization

```bash
# Check your organization's domains
curl http://localhost:3000/api/organizations/domains \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### "Rate limit exceeded" (429)

**Cause:** Too many requests in time window

**Solutions:**
1. Wait for reset time (check `X-RateLimit-Reset` header)
2. Implement client-side rate limiting
3. Cache responses to reduce requests

```bash
# Check rate limit status
curl -i http://localhost:3000/api/dashboard/analytics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | grep -i "x-ratelimit"
```

### Redis Connection Errors

**Symptom:** Rate limiting not working, requests always succeed

**Cause:** Redis unavailable

**Solution:**
1. Check Redis is running: `docker-compose ps redis`
2. Verify connection: `redis-cli ping`
3. Check logs: `docker-compose logs redis`

**Note:** Rate limiting fails open - requests are allowed if Redis is down

### Multi-Tenant Isolation Issues

**Symptom:** User seeing data from other organizations

**Cause:** Missing domain filtering in query

**Solution:**
1. Verify `allowedDomains` check is present
2. Check query includes domain filter
3. Review logs for cross-tenant access attempts

```typescript
// Always filter by organization's domains
if (allowedDomains.length > 0) {
  query = query.in('conversations.domain', allowedDomains);
}
```

---

## Security Best Practices

1. **Never skip authentication** - All analytics endpoints must require auth
2. **Validate domain access** - Always check domain belongs to user's org
3. **Log security events** - Log failed auth, rate limits, cross-tenant attempts
4. **Use service role sparingly** - Prefer user-scoped client when possible
5. **Monitor rate limits** - Track 429 responses, adjust limits if needed
6. **Rotate tokens** - Implement token refresh, expire old sessions
7. **Test regularly** - Run security test suite in CI/CD

---

## API Reference

### Authentication Middleware

```typescript
// Require any authenticated user
const authResult = await requireAuth();
if (authResult instanceof NextResponse) return authResult;
const { user, supabase } = authResult;

// Require admin user
const adminResult = await requireAdmin();
if (adminResult instanceof NextResponse) return adminResult;
const { user, supabase, organizationId, role } = adminResult;

// Require org access
const orgResult = await requireOrgAccess(organizationId);
if (orgResult instanceof NextResponse) return orgResult;
const { user, supabase, organizationId, role } = orgResult;

// Get org with domains
const orgDomainsResult = await requireOrgWithDomains(optionalDomain);
if (orgDomainsResult instanceof NextResponse) return orgDomainsResult;
const { user, supabase, organizationId, role, allowedDomains } = orgDomainsResult;
```

### Rate Limiting

```typescript
// Check rate limit
const rateLimitError = await checkAnalyticsRateLimit(user, 'dashboard');
if (rateLimitError) return rateLimitError;

// Add headers to response
await addRateLimitHeaders(response, user, 'dashboard');

// Get client IP
const clientIP = getClientIP(request);

// Check IP whitelist
const isWhitelisted = isWhitelistedIP(clientIP);
```

---

## Change Log

- **2025-11-07:** Initial implementation with auth, rate limiting, multi-tenant security
- Security headers added to next.config.js
- Cache invalidation endpoint created
- Comprehensive test suite implemented

---

## Related Documentation

- [Authentication Architecture](../01-ARCHITECTURE/ARCHITECTURE_AUTH.md)
- [Rate Limiting Reference](REFERENCE_RATE_LIMITING.md)
- [Multi-Tenant Architecture](../01-ARCHITECTURE/ARCHITECTURE_MULTI_TENANT.md)
- [Business Intelligence](../01-ARCHITECTURE/ARCHITECTURE_BUSINESS_INTELLIGENCE.md)
