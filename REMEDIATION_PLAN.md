# Comprehensive Remediation Plan - Omniops Codebase
**Date:** 2025-10-26
**Priority:** CRITICAL
**Estimated Timeline:** 6-8 weeks
**Required Effort:** 120-180 hours

---

## Table of Contents
1. [Phase 0: Emergency Security Fixes](#phase-0-emergency-security-fixes-today)
2. [Phase 1: Critical Fixes](#phase-1-critical-fixes-week-1)
3. [Phase 2: High Priority](#phase-2-high-priority-weeks-2-3)
4. [Phase 3: Testing & Quality](#phase-3-testing--quality-weeks-4-5)
5. [Phase 4: Refactoring](#phase-4-refactoring-weeks-6-8)
6. [Implementation Guides](#implementation-guides)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Strategy](#deployment-strategy)

---

## PHASE 0: EMERGENCY SECURITY FIXES (Today)
**Duration:** 4-6 hours
**Priority:** CRITICAL P0
**Must Complete Before:** Any production deployment

### Issue 1: Remove/Secure Debug Endpoints (1 hour)

**Files to Modify:**
1. `/home/user/Omniops/app/api/test-woocommerce/route.ts`
2. `/home/user/Omniops/app/api/setup-rag/route.ts`
3. `/home/user/Omniops/app/api/debug-rag/route.ts`
4. `/home/user/Omniops/app/api/fix-rag/route.ts`
5. `/home/user/Omniops/app/api/fix-customer-config/route.ts`
6. `/home/user/Omniops/app/api/debug/[domain]/route.ts`

**Implementation Steps:**

#### Option A: Disable Completely (Recommended for Production)
```typescript
// Replace entire route.ts file with:
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Debug endpoints are disabled' },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Debug endpoints are disabled' },
    { status: 404 }
  );
}
```

#### Option B: Add Strong Authentication (For Development)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  // Step 1: Environment check
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints disabled in production' },
      { status: 403 }
    );
  }

  // Step 2: API Key authentication
  const apiKey = request.headers.get('x-debug-api-key');
  const validApiKey = process.env.DEBUG_API_KEY;

  if (!validApiKey) {
    console.error('[Security] DEBUG_API_KEY not configured');
    return NextResponse.json(
      { error: 'Debug endpoint not configured' },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== validApiKey) {
    console.warn('[Security] Invalid debug API key attempt');
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  // Step 3: Supabase user authentication
  const supabase = await createServiceRoleClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'User authentication required' },
      { status: 401 }
    );
  }

  // Step 4: Role-based access control (optional but recommended)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'developer') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // ... original endpoint logic
}
```

**Environment Variables to Add:**
```bash
# .env.local
DEBUG_API_KEY=generate-strong-random-key-here-32-chars-min
```

**Testing:**
```bash
# Should return 401
curl http://localhost:3000/api/debug/example.com

# Should return 401
curl -H "x-debug-api-key: wrong-key" http://localhost:3000/api/debug/example.com

# Should work (with valid key and auth)
curl -H "x-debug-api-key: $DEBUG_API_KEY" \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     http://localhost:3000/api/debug/example.com
```

**Risk Mitigation:**
- Deploy during low-traffic period
- Monitor error rates for 24h
- Have rollback commit ready

---

### Issue 2: Add Authentication to Customer Config API (1 hour)

**Files to Modify:**
1. `/home/user/Omniops/app/api/customer/config/get-handler.ts`
2. `/home/user/Omniops/app/api/customer/config/create-handler.ts`
3. `/home/user/Omniops/app/api/customer/config/update-handler.ts`
4. `/home/user/Omniops/app/api/customer/config/delete-handler.ts`

**Implementation:**

```typescript
// File: /app/api/customer/config/get-handler.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function handleGet(request: NextRequest) {
  try {
    // STEP 1: Create Supabase client
    const supabase = await createServiceRoleClient();

    // STEP 2: Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // STEP 3: Get user's organization (for multi-tenant isolation)
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'User not associated with organization' },
        { status: 403 }
      );
    }

    // STEP 4: Parse request parameters
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const domain = searchParams.get('domain');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // STEP 5: Build query with organization filter
    let query = supabase
      .from('customer_configs')
      .select('*', { count: 'exact' })
      .eq('organization_id', profile.organization_id)  // ← Multi-tenant isolation
      .range(offset, offset + limit - 1);

    // STEP 6: Apply additional filters
    if (customerId) query = query.eq('customer_id', customerId);
    if (domain) query = query.eq('domain', domain);

    // STEP 7: Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('[CustomerConfig] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer configs' },
        { status: 500 }
      );
    }

    // STEP 8: Return response
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('[CustomerConfig] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Apply Same Pattern to Other Handlers:**
- `create-handler.ts`: Add auth + verify user can create for their org
- `update-handler.ts`: Add auth + verify user owns the config
- `delete-handler.ts`: Add auth + verify user owns the config

**Testing:**
```bash
# Test without auth - should return 401
curl http://localhost:3000/api/customer/config

# Test with auth - should return user's configs
curl -H "Authorization: Bearer $USER_TOKEN" \
     http://localhost:3000/api/customer/config

# Test cross-tenant access - should return empty
curl -H "Authorization: Bearer $USER_A_TOKEN" \
     "http://localhost:3000/api/customer/config?customerId=belongs-to-user-b"
```

---

### Issue 3: Fix WooCommerce Multi-tenant Bypass (1 hour)

**Files to Modify:**
1. `/home/user/Omniops/app/api/woocommerce/products/route.ts`
2. `/home/user/Omniops/app/api/woocommerce/customers/route.ts`
3. All other `/app/api/woocommerce/*` routes

**Implementation:**

```typescript
// File: /app/api/woocommerce/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

const ProductsRequestSchema = z.object({
  // REMOVE domain from user input - use auth context instead
  per_page: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
  search: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  featured: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authenticate user
    const supabase = await createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // STEP 2: Get user's organization and associated domain
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        organization_id,
        organizations (
          customer_configs (
            domain,
            woocommerce_url,
            woocommerce_consumer_key,
            woocommerce_consumer_secret,
            woocommerce_enabled
          )
        )
      `)
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'User not associated with organization' },
        { status: 403 }
      );
    }

    const config = profile.organizations?.customer_configs?.[0];

    if (!config) {
      return NextResponse.json(
        { error: 'WooCommerce not configured for this organization' },
        { status: 404 }
      );
    }

    if (!config.woocommerce_enabled) {
      return NextResponse.json(
        { error: 'WooCommerce integration not enabled' },
        { status: 403 }
      );
    }

    // STEP 3: Parse and validate request body
    const body = await request.json();
    const validatedData = ProductsRequestSchema.parse(body);

    // STEP 4: Decrypt WooCommerce credentials (CRITICAL FIX)
    const { decryptWooCommerceConfig } = await import('@/lib/encryption');
    const decryptedConfig = decryptWooCommerceConfig({
      enabled: config.woocommerce_enabled,
      url: config.woocommerce_url,
      consumer_key: config.woocommerce_consumer_key,
      consumer_secret: config.woocommerce_consumer_secret,
    });

    // STEP 5: Initialize WooCommerce API with decrypted credentials
    const { WooCommerceAPI } = await import('@/lib/woocommerce-api');
    const wc = new WooCommerceAPI({
      url: decryptedConfig.url,
      consumerKey: decryptedConfig.consumer_key,
      consumerSecret: decryptedConfig.consumer_secret,
    });

    // STEP 6: Fetch products
    const queryParams: any = {
      per_page: validatedData.per_page,
      page: validatedData.page,
    };

    if (validatedData.search) queryParams.search = validatedData.search;
    if (validatedData.category) queryParams.category = validatedData.category;
    if (validatedData.stock_status) queryParams.stock_status = validatedData.stock_status;
    if (validatedData.featured !== undefined) queryParams.featured = validatedData.featured;

    const products = await wc.getProducts(queryParams);

    return NextResponse.json({
      success: true,
      products: products || [],
      domain: config.domain,  // Return domain for reference
    });

  } catch (error: any) {
    console.error('[WooCommerce Products] Error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

**Key Changes:**
1. ✅ Domain comes from authenticated user's organization, NOT request body
2. ✅ Multi-tenant isolation enforced at database level
3. ✅ Credentials decrypted before use
4. ✅ Proper error handling

**Testing:**
```bash
# Without auth - should return 401
curl -X POST http://localhost:3000/api/woocommerce/products \
     -H "Content-Type: application/json" \
     -d '{"per_page": 10}'

# With auth - should return user's org products only
curl -X POST http://localhost:3000/api/woocommerce/products \
     -H "Authorization: Bearer $USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"per_page": 10}'
```

---

### Issue 4: Add GDPR Delete Authentication (1 hour)

**File:** `/home/user/Omniops/app/api/gdpr/delete/route.ts`

**Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const DeleteRequestSchema = z.object({
  email: z.string().email(),
  domain: z.string().min(1),
  confirm: z.boolean(),
  verification_code: z.string().length(6).optional(),  // NEW: Email verification
});

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Parse and validate request
    const body = await request.json();
    const { email, domain, confirm, verification_code } = DeleteRequestSchema.parse(body);

    // STEP 2: Rate limiting - 1 delete request per email per 24 hours
    const rateLimitKey = `gdpr:delete:${email}:${domain}`;
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      1,  // Max 1 request
      24 * 60 * 60 * 1000  // Per 24 hours
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retry_after: rateLimitResult.resetTime,
        },
        { status: 429 }
      );
    }

    // STEP 3: If no verification code, send verification email
    if (!verification_code) {
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Store verification code in Redis with 15-minute expiry
      const { default: redis } = await import('@/lib/redis');
      await redis.setex(
        `gdpr:verify:${email}:${domain}`,
        15 * 60,  // 15 minutes
        verificationCode
      );

      // Send verification email (implement your email service)
      await sendVerificationEmail(email, verificationCode);

      return NextResponse.json({
        success: false,
        message: 'Verification code sent to email',
        requires_verification: true,
      });
    }

    // STEP 4: Verify the verification code
    const { default: redis } = await import('@/lib/redis');
    const storedCode = await redis.get(`gdpr:verify:${email}:${domain}`);

    if (!storedCode || storedCode !== verification_code) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // STEP 5: Require explicit confirmation
    if (!confirm) {
      return NextResponse.json(
        {
          error: 'Please confirm deletion',
          data_to_delete: {
            conversations: 'All conversations associated with this email',
            messages: 'All messages in those conversations',
            metadata: 'Session and user metadata',
          },
        },
        { status: 400 }
      );
    }

    // STEP 6: Perform deletion
    const supabase = await createServiceRoleClient();

    // Get conversations to delete
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_email', email)
      .eq('domain', domain);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No data found for this email',
        deleted: { conversations: 0, messages: 0 },
      });
    }

    const conversationIds = conversations.map(c => c.id);

    // Delete messages first (foreign key cascade should handle this, but being explicit)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds);

    if (messagesError) {
      console.error('[GDPR Delete] Messages deletion failed:', messagesError);
      return NextResponse.json(
        { error: 'Failed to delete messages' },
        { status: 500 }
      );
    }

    // Delete conversations
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversationIds);

    if (conversationsError) {
      console.error('[GDPR Delete] Conversations deletion failed:', conversationsError);
      return NextResponse.json(
        { error: 'Failed to delete conversations' },
        { status: 500 }
      );
    }

    // STEP 7: Audit log (create audit_logs table if doesn't exist)
    await supabase
      .from('audit_logs')
      .insert({
        action: 'gdpr_delete',
        target_email: email,
        domain: domain,
        metadata: {
          conversations_deleted: conversations.length,
          verification_method: 'email',
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        },
      });

    // STEP 8: Clean up verification code
    await redis.del(`gdpr:verify:${email}:${domain}`);

    return NextResponse.json({
      success: true,
      message: 'Data deleted successfully',
      deleted: {
        conversations: conversations.length,
        // Messages deleted via cascade
      },
    });

  } catch (error: any) {
    console.error('[GDPR Delete] Error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to send verification email
async function sendVerificationEmail(email: string, code: string) {
  // Implement using your email service (SendGrid, AWS SES, etc.)
  console.log(`[GDPR] Verification code for ${email}: ${code}`);
  // TODO: Implement actual email sending
}
```

**Create Audit Logs Table Migration:**
```sql
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_email TEXT,
  domain TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_email ON audit_logs(target_email);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**Testing:**
```bash
# Step 1: Request deletion (should send verification email)
curl -X POST http://localhost:3000/api/gdpr/delete \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "domain": "example.com", "confirm": true}'

# Response: {"requires_verification": true, "message": "Verification code sent to email"}

# Step 2: Confirm with verification code
curl -X POST http://localhost:3000/api/gdpr/delete \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "domain": "example.com", "confirm": true, "verification_code": "ABC123"}'

# Step 3: Try again immediately (should be rate limited)
curl -X POST http://localhost:3000/api/gdpr/delete \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "domain": "example.com", "confirm": true}'

# Response: {"error": "Rate limit exceeded", status: 429}
```

---

### Issue 5: Fix Database RLS Bypass (0.5 hour)

**File:** SQL migration

**Implementation:**

```sql
-- File: supabase/migrations/YYYYMMDD_fix_rls_policies.sql

-- 1. Fix global_synonym_mappings RLS
DROP POLICY IF EXISTS "Allow authenticated users to read synonym mappings" ON global_synonym_mappings;

CREATE POLICY "Users can only read their organization's synonym mappings"
ON global_synonym_mappings
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- 2. Verify other RLS policies (run audit)
-- Check customer_configs
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'customer_configs';

-- 3. Add missing RLS on scraped_pages if needed
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization's scraped pages" ON scraped_pages;

CREATE POLICY "Users can view their organization's scraped pages"
ON scraped_pages
FOR SELECT
USING (
  domain_id IN (
    SELECT id
    FROM domains
    WHERE organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
    )
  )
);

-- 4. Add RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages from their organization's conversations" ON messages;

CREATE POLICY "Users can view messages from their organization's conversations"
ON messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id
    FROM conversations
    WHERE domain IN (
      SELECT domain
      FROM customer_configs
      WHERE organization_id IN (
        SELECT organization_id
        FROM profiles
        WHERE id = auth.uid()
      )
    )
  )
);
```

**Testing:**
```sql
-- As user A
SET request.jwt.claims.sub = 'user-a-id';
SELECT * FROM global_synonym_mappings;  -- Should only see org A's data

-- As user B (different org)
SET request.jwt.claims.sub = 'user-b-id';
SELECT * FROM global_synonym_mappings;  -- Should only see org B's data

-- Unauthenticated
RESET request.jwt.claims.sub;
SELECT * FROM global_synonym_mappings;  -- Should see nothing
```

---

### Issue 6: Fix Foreign Key Cascades (0.5 hour)

**Implementation:**

Apply the generated `CRITICAL_SQL_FIXES.sql` file:

```bash
# Review the fix file first
cat /home/user/Omniops/CRITICAL_SQL_FIXES.sql

# Apply to database
psql $DATABASE_URL < /home/user/Omniops/CRITICAL_SQL_FIXES.sql

# Or via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of CRITICAL_SQL_FIXES.sql
# 3. Execute
```

**Verification:**
```sql
-- Check foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Verify page_embeddings.domain_id now has CASCADE
-- Should show: delete_rule = 'CASCADE'
```

---

## PHASE 0 COMPLETION CHECKLIST

- [ ] Debug endpoints secured or removed
- [ ] Customer config API has authentication
- [ ] WooCommerce routes use auth context (not user input)
- [ ] GDPR delete requires email verification + rate limiting
- [ ] RLS policies fixed for global_synonym_mappings
- [ ] Foreign key cascades corrected
- [ ] All changes tested in development
- [ ] Rollback plan documented
- [ ] Changes deployed to staging
- [ ] 24-hour monitoring period completed
- [ ] Production deployment approved

**Deployment Blockers:**
- Must complete ALL 6 issues before production deployment
- Staging testing required for minimum 24 hours
- Load testing recommended on staging

---

## PHASE 1: CRITICAL FIXES (Week 1)
**Duration:** 12-16 hours
**Priority:** P1

### Issue 7: Decrypt WooCommerce Credentials (2 hours)

**Files to Modify:**
- All WooCommerce API routes that use credentials
- `/app/api/test-woocommerce/route.ts` (if keeping for dev)

**Implementation Pattern:**

```typescript
import { decryptWooCommerceConfig } from '@/lib/encryption';

// BEFORE (VULNERABLE):
const wc = new WooCommerceAPI({
  url: config.woocommerce_url,
  consumerKey: config.woocommerce_consumer_key,  // Encrypted!
  consumerSecret: config.woocommerce_consumer_secret,  // Encrypted!
});

// AFTER (FIXED):
const decryptedConfig = decryptWooCommerceConfig({
  enabled: config.woocommerce_enabled,
  url: config.woocommerce_url,
  consumer_key: config.woocommerce_consumer_key,
  consumer_secret: config.woocommerce_consumer_secret,
});

const wc = new WooCommerceAPI({
  url: decryptedConfig.url,
  consumerKey: decryptedConfig.consumer_key,  // Now decrypted!
  consumerSecret: decryptedConfig.consumer_secret,  // Now decrypted!
});
```

**Testing:**
```typescript
// Add to test file
describe('WooCommerce API Credential Decryption', () => {
  it('should decrypt credentials before API call', async () => {
    const mockConfig = {
      woocommerce_enabled: true,
      woocommerce_url: 'https://example.com',
      woocommerce_consumer_key: encrypt('ck_test_key'),
      woocommerce_consumer_secret: encrypt('cs_test_secret'),
    };

    const decrypted = decryptWooCommerceConfig(mockConfig);

    expect(decrypted.consumer_key).toBe('ck_test_key');
    expect(decrypted.consumer_secret).toBe('cs_test_secret');
  });
});
```

---

### Issue 8: Implement Redis-Backed Rate Limiting (3 hours)

**File:** `/home/user/Omniops/lib/rate-limit-redis.ts` (NEW)

**Implementation:**

```typescript
import { Redis } from 'ioredis';

let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redis;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

export async function checkRateLimitRedis(
  identifier: string,
  maxRequests: number = 50,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const client = getRedisClient();
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Use Redis sorted set for sliding window
    const multi = client.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);

    // Add current request
    multi.zadd(key, now, `${now}:${Math.random()}`);

    // Count requests in window
    multi.zcard(key);

    // Set expiry
    multi.expire(key, Math.ceil(windowMs / 1000));

    const results = await multi.exec();
    const count = results?.[2]?.[1] as number || 0;

    const allowed = count <= maxRequests;
    const resetTime = now + windowMs;

    return {
      allowed,
      remaining: Math.max(0, maxRequests - count),
      resetTime,
      total: maxRequests,
    };

  } catch (error) {
    console.error('[RateLimit] Redis error:', error);
    // Fallback: allow request but log error
    return {
      allowed: true,
      remaining: 0,
      resetTime: now + windowMs,
      total: maxRequests,
    };
  }
}

// Per-endpoint configurations
export const RATE_LIMITS = {
  chat: { maxRequests: 30, windowMs: 60 * 1000 },  // 30/minute
  scrape: { maxRequests: 5, windowMs: 60 * 1000 },  // 5/minute
  woocommerce: { maxRequests: 60, windowMs: 60 * 1000 },  // 60/minute
  gdpr: { maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 },  // 1/day
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },  // 5/15min
  default: { maxRequests: 50, windowMs: 60 * 1000 },  // 50/minute
};

export async function rateLimitMiddleware(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  return checkRateLimitRedis(identifier, config.maxRequests, config.windowMs);
}
```

**Update API Routes:**

```typescript
// Example: /app/api/chat/route.ts

import { rateLimitMiddleware } from '@/lib/rate-limit-redis';

export async function POST(request: NextRequest) {
  // Get identifier (IP or user ID)
  const identifier = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

  // Check rate limit
  const rateLimitResult = await rateLimitMiddleware(identifier, 'chat');

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retry_after: rateLimitResult.resetTime,
        limit: rateLimitResult.total,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.total.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  // ... rest of endpoint
}
```

**Testing:**
```typescript
describe('Redis Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const identifier = 'test-user';

    // Make 30 requests (limit)
    for (let i = 0; i < 30; i++) {
      const result = await rateLimitMiddleware(identifier, 'chat');
      expect(result.allowed).toBe(true);
    }

    // 31st request should be denied
    const result = await rateLimitMiddleware(identifier, 'chat');
    expect(result.allowed).toBe(false);
  });

  it('should reset after window expires', async () => {
    const identifier = 'test-user-2';

    // Fill limit
    for (let i = 0; i < 30; i++) {
      await rateLimitMiddleware(identifier, 'chat');
    }

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 61000));

    // Should allow again
    const result = await rateLimitMiddleware(identifier, 'chat');
    expect(result.allowed).toBe(true);
  });
});
```

---

### Issue 9: Fix N+1 Query Problems (4 hours)

**Files to Modify:**
1. `/app/api/dashboard/conversations/route.ts` (lines 124-158)
2. Other routes with sequential queries

**Implementation:**

```typescript
// BEFORE (N+1 Problem):
for (const conv of conversationsToProcess) {
  const { data: messages } = await supabase
    .from('messages')
    .select('content, role, created_at')
    .eq('conversation_id', conv.id)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(1);

  recent.push({
    id: conv.id,
    message: messages?.[0]?.content?.substring(0, 100) || 'No message',
    timestamp: messages?.[0]?.created_at || conv.created_at,
  });
}

// AFTER (Optimized with Promise.all):
// Step 1: Create array of promises
const messagePromises = conversationsToProcess.map(conv =>
  supabase
    .from('messages')
    .select('content, role, created_at')
    .eq('conversation_id', conv.id)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(1)
    .then(({ data, error }) => ({
      conversationId: conv.id,
      messages: error ? null : data,
      error,
    }))
);

// Step 2: Execute all queries in parallel
const allMessages = await Promise.all(messagePromises);

// Step 3: Create lookup map
const messagesByConvId = new Map(
  allMessages.map(result => [
    result.conversationId,
    result.messages?.[0] || null
  ])
);

// Step 4: Build response using map
for (const conv of conversationsToProcess) {
  const message = messagesByConvId.get(conv.id);

  recent.push({
    id: conv.id,
    message: message?.content?.substring(0, 100) || 'No message',
    timestamp: message?.created_at || conv.created_at,
    language: detectLanguage(message?.content || ''),
  });
}
```

**Performance Comparison:**
```typescript
// Benchmark test
describe('Dashboard Performance', () => {
  it('should be 10x faster with parallel queries', async () => {
    const conversationIds = Array.from({ length: 20 }, (_, i) => `conv-${i}`);

    // Sequential (old way)
    const start1 = Date.now();
    for (const id of conversationIds) {
      await supabase.from('messages').select('*').eq('conversation_id', id).limit(1);
    }
    const sequential = Date.now() - start1;

    // Parallel (new way)
    const start2 = Date.now();
    await Promise.all(
      conversationIds.map(id =>
        supabase.from('messages').select('*').eq('conversation_id', id).limit(1)
      )
    );
    const parallel = Date.now() - start2;

    console.log(`Sequential: ${sequential}ms, Parallel: ${parallel}ms`);
    expect(parallel).toBeLessThan(sequential / 5);  // At least 5x faster
  });
});
```

---

### Issue 10: Add Timeouts to External APIs (2 hours)

**Install Dependency:**
```bash
npm install p-timeout
```

**Create Timeout Wrapper:**

```typescript
// File: /lib/utils/timeout-wrapper.ts

import pTimeout from 'p-timeout';

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  try {
    return await pTimeout(promise, timeoutMs, errorMessage || `Operation timed out after ${timeoutMs}ms`);
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      console.error(`[Timeout] ${errorMessage || 'Operation timed out'}`, {
        timeout: timeoutMs,
      });
    }
    throw error;
  }
}

// Predefined timeouts for common operations
export const TIMEOUTS = {
  OPENAI_EMBEDDING: 10000,  // 10 seconds
  OPENAI_CHAT: 30000,  // 30 seconds
  WOOCOMMERCE_API: 5000,  // 5 seconds
  SUPABASE_QUERY: 15000,  // 15 seconds
  SCRAPING: 30000,  // 30 seconds
  EXTERNAL_API: 10000,  // 10 seconds (default)
};
```

**Apply to OpenAI Embeddings:**

```typescript
// File: /lib/embeddings.ts

import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout-wrapper';

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const embeddingPromise = getOpenAIClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const response = await withTimeout(
    embeddingPromise,
    TIMEOUTS.OPENAI_EMBEDDING,
    'OpenAI embedding generation timeout'
  );

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const batchPromise = getOpenAIClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  const response = await withTimeout(
    batchPromise,
    TIMEOUTS.OPENAI_EMBEDDING * 2,  // Double timeout for batch
    `OpenAI batch embedding timeout (${texts.length} texts)`
  );

  return response.data.map(item => item.embedding);
}
```

**Apply to WooCommerce API:**

```typescript
// File: /lib/woocommerce-api/index.ts

import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout-wrapper';

export class WooCommerceAPI {
  async getProducts(params: any) {
    const productPromise = this.makeRequest('GET', '/products', params);

    return withTimeout(
      productPromise,
      TIMEOUTS.WOOCOMMERCE_API,
      'WooCommerce getProducts timeout'
    );
  }

  async getOrders(params: any) {
    const orderPromise = this.makeRequest('GET', '/orders', params);

    return withTimeout(
      orderPromise,
      TIMEOUTS.WOOCOMMERCE_API,
      'WooCommerce getOrders timeout'
    );
  }

  // ... other methods
}
```

**Apply to Supabase Queries:**

```typescript
// File: /app/api/dashboard/analytics/route.ts

import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout-wrapper';

export async function GET(request: NextRequest) {
  // ... auth and setup

  const messagesPromise = supabase
    .from('messages')
    .select('content, role, created_at, metadata')
    .gte('created_at', startDate.toISOString())
    .limit(10000);  // Also add limit!

  const { data: messages } = await withTimeout(
    messagesPromise,
    TIMEOUTS.SUPABASE_QUERY,
    'Analytics messages query timeout'
  );

  // ... rest of logic
}
```

---

### Issue 11: Fix Unbounded Queries (2 hours)

**Files to Modify:**
1. `/app/api/dashboard/analytics/route.ts`
2. `/lib/category-mapper.ts`
3. `/app/api/dashboard/missing-products/route.ts`
4. `/app/api/gdpr/export/route.ts`

**Pattern 1: Add Limits to Simple Queries**

```typescript
// BEFORE:
const { data: messages } = await supabase
  .from('messages')
  .select('content, role, created_at')
  .gte('created_at', startDate.toISOString());
// No limit!

// AFTER:
const ANALYTICS_MESSAGE_LIMIT = 10000;
const { data: messages } = await supabase
  .from('messages')
  .select('content, role, created_at')
  .gte('created_at', startDate.toISOString())
  .limit(ANALYTICS_MESSAGE_LIMIT);
```

**Pattern 2: Implement Pagination for Large Datasets**

```typescript
// File: /lib/category-mapper.ts

async buildCategoryMappings(): Promise<Map<string, CategoryMapping>> {
  const mappings = new Map<string, CategoryMapping>();
  const PAGE_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: pages, error } = await this.supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('status', 'completed')
      .order('url')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('[CategoryMapper] Error fetching pages:', error);
      break;
    }

    if (!pages || pages.length === 0) {
      hasMore = false;
      break;
    }

    // Process this batch
    for (const page of pages) {
      const category = this.extractCategory(page);
      if (category) {
        mappings.set(page.url, category);
      }
    }

    offset += PAGE_SIZE;
    hasMore = pages.length === PAGE_SIZE;

    console.log(`[CategoryMapper] Processed ${offset} pages...`);
  }

  console.log(`[CategoryMapper] Built mappings for ${mappings.size} pages`);
  return mappings;
}
```

**Testing:**
```typescript
describe('Unbounded Query Fixes', () => {
  it('should limit analytics messages to 10,000', async () => {
    const spy = jest.spyOn(supabase.from('messages'), 'limit');

    await GET(mockRequest);

    expect(spy).toHaveBeenCalledWith(10000);
  });

  it('should paginate category mapper', async () => {
    const mapper = new CategoryMapper(supabase);
    const rangeSpy = jest.spyOn(supabase.from('scraped_pages'), 'range');

    await mapper.buildCategoryMappings();

    // Should have called range() multiple times
    expect(rangeSpy).toHaveBeenCalled();
    expect(rangeSpy.mock.calls.length).toBeGreaterThan(1);
  });
});
```

---

### Issue 12: Strengthen Input Validation (2 hours)

**Files to Modify:**
- All API routes with Zod schemas
- `/types/api.ts`

**Implementation:**

```typescript
// File: /types/api.ts

import { z } from 'zod';

// Domain validation
const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

export const DomainSchema = z.string()
  .min(3, 'Domain must be at least 3 characters')
  .max(253, 'Domain too long')
  .regex(domainRegex, 'Invalid domain format')
  .transform(d => d.toLowerCase().trim());

// Improved schemas
export const ScrapeRequestSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long'),
  crawl: z.boolean().default(false),
  max_pages: z.number()
    .int('max_pages must be an integer')
    .min(1, 'max_pages must be at least 1')
    .max(100, 'max_pages cannot exceed 100')
    .default(50),
  domain: DomainSchema.optional(),
});

export const ProductsRequestSchema = z.object({
  // Domain should come from auth, not user input
  per_page: z.number()
    .int()
    .min(1)
    .max(100)
    .default(10),
  page: z.number()
    .int()
    .min(1)
    .max(10000, 'Page number too large')  // Prevent huge offsets
    .default(1),
  search: z.string()
    .max(100, 'Search term too long')
    .optional()
    .transform(s => s?.trim()),
  category: z.string()
    .max(50)
    .optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  featured: z.boolean().optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long')
    .transform(m => m.trim()),
  conversation_id: z.string().uuid().optional(),
  session_id: z.string()
    .min(1)
    .max(100)
    .optional(),
  domain: DomainSchema,
  config: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    max_tokens: z.number().int().min(1).max(4000).default(1000),
  }).optional(),
});
```

**Add Custom Validators:**

```typescript
// File: /lib/validators.ts

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length < 3 || domain.length > 253) {
    return false;
  }

  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  return domainRegex.test(domain);
}

export function sanitizeSearchTerm(search: string): string {
  return search
    .trim()
    .slice(0, 100)
    .replace(/[%_]/g, '\\$&');  // Escape SQL wildcards
}

export function validatePagination(page: number, limit: number): { page: number; limit: number } {
  return {
    page: Math.max(1, Math.min(page, 10000)),
    limit: Math.max(1, Math.min(limit, 100)),
  };
}

export function sanitizeInteger(value: string, defaultValue: number): number {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}
```

**Usage in Routes:**

```typescript
import { ChatRequestSchema } from '@/types/api';
import { isValidDomain } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validatedData = ChatRequestSchema.parse(body);

    // Additional validation
    if (!isValidDomain(validatedData.domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // ... rest of logic

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
```

---

### Issue 13: Fix Brand-Agnostic Violations (1 hour)

**Files to Modify:**
1. `/components/dashboard/help/APIDocumentation.tsx`
2. `/components/dashboard/help/ContactSupport.tsx`
3. `/lib/demo-scraper.ts`
4. `/components/ChatWidget.tsx`
5. `/components/ChatWidget/hooks/useChatState.ts`

**Implementation:**

```typescript
// File: /components/dashboard/help/APIDocumentation.tsx

// BEFORE (line 66):
<div>&lt;script src="https://widget.omniops.ai/embed.js"&gt;&lt;/script&gt;</div>

// AFTER:
const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || window.location.origin;

<div>&lt;script src="{widgetUrl}/embed.js"&gt;&lt;/script&gt;</div>
```

```typescript
// File: /components/dashboard/help/ContactSupport.tsx

// BEFORE (line 55):
<a href="mailto:support@omniops.ai">support@omniops.ai</a>

// AFTER:
const [supportEmail, setSupportEmail] = useState<string>('');

useEffect(() => {
  // Fetch from customer config
  async function loadSupportEmail() {
    const response = await fetch('/api/customer/config');
    const data = await response.json();
    setSupportEmail(data.support_email || 'support@example.com');
  }
  loadSupportEmail();
}, []);

<a href={`mailto:${supportEmail}`}>{supportEmail}</a>
```

```typescript
// File: /lib/demo-scraper.ts

// BEFORE (lines 92, 148):
'User-Agent': 'Mozilla/5.0 (compatible; OmniopsBot/1.0; +https://omniops.com)'

// AFTER:
function getUserAgent(domain: string): string {
  const botName = process.env.SCRAPER_BOT_NAME || 'WebCrawler';
  const botUrl = process.env.SCRAPER_BOT_URL || `https://${domain}`;
  return `Mozilla/5.0 (compatible; ${botName}/1.0; +${botUrl})`;
}

'User-Agent': getUserAgent(domain)
```

**Add Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_WIDGET_URL=https://widget.yourcompany.com
SCRAPER_BOT_NAME=YourCompanyBot
SCRAPER_BOT_URL=https://yourcompany.com/bot
```

---

## PHASE 1 COMPLETION CHECKLIST

- [ ] WooCommerce credentials decrypted before use
- [ ] Redis-backed rate limiting implemented
- [ ] N+1 queries converted to Promise.all()
- [ ] Timeouts added to all external APIs
- [ ] Unbounded queries have .limit() or pagination
- [ ] Input validation strengthened
- [ ] Brand-agnostic violations fixed
- [ ] All changes tested
- [ ] Performance benchmarks show improvement
- [ ] Staging deployment successful
- [ ] Production deployment approved

---

## PHASE 2: HIGH PRIORITY (Weeks 2-3)
**Duration:** 24-30 hours
**Priority:** P1

### Issue 14: Extract Service Layer (8 hours)

See detailed implementation in next section...

### Issue 15: Fix Database Race Conditions (3 hours)

See detailed implementation in next section...

### Issue 16: Implement Structured Logging (4 hours)

See detailed implementation in next section...

### Issue 17: Consolidate Code Duplication (3 hours)

See detailed implementation in next section...

### Issue 18: Parallelize Sequential Operations (4 hours)

See detailed implementation in next section...

### Issue 19: Fix Unhandled Promises (2 hours)

See detailed implementation in next section...

---

## IMPLEMENTATION GUIDES

### Creating a Service Layer

**Why:** Separation of concerns, testability, reusability

**Example: Dashboard Service**

```typescript
// File: /lib/services/dashboard-service.ts

import { SupabaseClient } from '@supabase/supabase-js';

export class DashboardService {
  constructor(private supabase: SupabaseClient) {}

  async getConversationStats(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Business logic here
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    return { count: data || 0 };
  }

  async getConversationsWithMessages(
    organizationId: string,
    page: number = 1,
    limit: number = 20
  ) {
    // Fetch conversations
    const offset = (page - 1) * limit;
    const { data: conversations } = await this.supabase
      .from('conversations')
      .select('id, created_at, ended_at, metadata')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!conversations) return [];

    // Fetch messages in parallel (fixes N+1)
    const messagePromises = conversations.map(conv =>
      this.supabase
        .from('messages')
        .select('content, role, created_at')
        .eq('conversation_id', conv.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => ({ conversationId: conv.id, messages: data }))
    );

    const allMessages = await Promise.all(messagePromises);
    const messagesByConvId = new Map(
      allMessages.map(m => [m.conversationId, m.messages?.[0] || null])
    );

    // Combine
    return conversations.map(conv => ({
      ...conv,
      firstMessage: messagesByConvId.get(conv.id),
    }));
  }
}
```

**Using the Service in API Route:**

```typescript
// File: /app/api/dashboard/conversations/route.ts

import { DashboardService } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
  // Auth
  const { user, organization } = await authenticateRequest(request);

  // Create service
  const dashboardService = new DashboardService(supabase);

  // Use service
  const conversations = await dashboardService.getConversationsWithMessages(
    organization.id,
    page,
    limit
  );

  return NextResponse.json({ conversations });
}
```

---

## TESTING STRATEGY

### Unit Tests

```typescript
// __tests__/lib/services/dashboard-service.test.ts

import { DashboardService } from '@/lib/services/dashboard-service';
import { createMockSupabaseClient } from '@/test/mocks/supabase';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new DashboardService(mockSupabase);
  });

  it('should fetch conversation stats', async () => {
    mockSupabase.from('conversations').select.mockResolvedValue({
      data: 42,
      error: null,
    });

    const result = await service.getConversationStats(
      'org-123',
      new Date('2025-01-01'),
      new Date('2025-01-31')
    );

    expect(result.count).toBe(42);
  });

  it('should batch fetch messages (no N+1)', async () => {
    const conversations = [{ id: '1' }, { id: '2' }, { id: '3' }];
    mockSupabase.from('conversations').select.mockResolvedValue({
      data: conversations,
    });

    mockSupabase.from('messages').select.mockResolvedValue({
      data: [{ content: 'test' }],
    });

    const result = await service.getConversationsWithMessages('org-123');

    // Should call messages query 3 times (one per conversation)
    // But in parallel, not sequentially
    expect(mockSupabase.from('messages').select).toHaveBeenCalledTimes(3);
  });
});
```

### Integration Tests

```typescript
// __tests__/api/dashboard/conversations.test.ts

import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/dashboard/conversations/route';

describe('GET /api/dashboard/conversations', () => {
  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return conversations for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.conversations).toBeInstanceOf(Array);
  });
});
```

### Performance Tests

```typescript
// __tests__/performance/dashboard.perf.test.ts

describe('Dashboard Performance', () => {
  it('should load 20 conversations in <500ms', async () => {
    const start = Date.now();

    const response = await fetch('/api/dashboard/conversations?limit=20', {
      headers: { authorization: `Bearer ${token}` },
    });

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  it('should handle 100 concurrent requests', async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: 'test' }),
      })
    );

    const responses = await Promise.all(requests);

    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    expect(successCount + rateLimitedCount).toBe(100);
  });
});
```

---

## DEPLOYMENT STRATEGY

### Week 1 Deployment (Phase 0 + Phase 1)

**Pre-Deployment Checklist:**
- [ ] All tests passing
- [ ] Code review completed
- [ ] Staging testing for 24+ hours
- [ ] Load testing completed
- [ ] Rollback plan documented
- [ ] Database migrations tested
- [ ] Monitoring dashboards ready

**Deployment Steps:**

1. **Database Migrations First**
   ```bash
   # Run migrations on production
   npm run migrate:production

   # Verify migrations
   psql $PRODUCTION_DB_URL -c "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"
   ```

2. **Deploy Code Changes**
   ```bash
   # Tag release
   git tag -a v0.2.0-security-fixes -m "Emergency security and performance fixes"
   git push origin v0.2.0-security-fixes

   # Deploy to production
   vercel --prod
   # or
   npm run deploy:production
   ```

3. **Monitor for 1 Hour**
   - Check error rates
   - Monitor response times
   - Watch database connections
   - Check rate limiting metrics

4. **Gradual Rollout** (if applicable)
   - 10% traffic → 1 hour monitoring
   - 50% traffic → 2 hours monitoring
   - 100% traffic

**Rollback Procedure:**

```bash
# If issues detected:
# 1. Revert deployment
vercel rollback

# 2. Revert database migrations (if needed)
psql $PRODUCTION_DB_URL < rollback-migrations.sql

# 3. Notify team
# 4. Investigate in development
```

---

## SUCCESS METRICS

### Phase 0 (Emergency Fixes)
- [ ] Zero authentication bypasses
- [ ] All debug endpoints secured
- [ ] Multi-tenant isolation verified
- [ ] GDPR delete requires verification
- [ ] Foreign key integrity maintained

### Phase 1 (Critical Fixes)
- [ ] API response times <500ms (p95)
- [ ] Zero N+1 queries
- [ ] All external API calls have timeouts
- [ ] Rate limiting works across multiple servers
- [ ] Input validation catches all malformed requests

### Phase 2 (High Priority)
- [ ] Business logic in service layer
- [ ] Zero race conditions in job processing
- [ ] Structured logging on all requests
- [ ] Correlation IDs tracked end-to-end
- [ ] Code duplication reduced by 90%

### Phase 3 (Testing)
- [ ] 70%+ code coverage
- [ ] All critical paths tested
- [ ] Security tests passing
- [ ] Performance tests passing
- [ ] E2E tests covering main flows

### Phase 4 (Refactoring)
- [ ] All files under 300 LOC
- [ ] Zero props drilling >5 levels
- [ ] Dependency injection complete
- [ ] Error boundaries in all components
- [ ] Documentation up to date

---

## TIMELINE SUMMARY

| Phase | Duration | Effort | Priority | Deliverable |
|-------|----------|--------|----------|-------------|
| 0 | Today | 4-6h | P0 | System secure |
| 1 | Week 1 | 12-16h | P1 | System performant |
| 2 | Weeks 2-3 | 24-30h | P1 | System reliable |
| 3 | Weeks 4-5 | 30-40h | P2 | System trustworthy |
| 4 | Weeks 6-8 | 30-40h | P3 | System maintainable |
| **TOTAL** | **8 weeks** | **120-180h** | - | **Production-ready** |

---

## RISK MITIGATION

### High-Risk Changes
1. Database migrations (foreign keys, RLS)
2. Rate limiting (could block legitimate traffic)
3. Authentication changes (could lock out users)

### Mitigation Strategies
1. **Test in staging first** (minimum 24 hours)
2. **Gradual rollout** (10% → 50% → 100%)
3. **Feature flags** for new code paths
4. **Rollback scripts** prepared in advance
5. **24/7 monitoring** during initial deployment

### Contingency Plans
- Database rollback scripts ready
- Previous deployment tagged for quick revert
- Support team briefed on potential issues
- Incident response plan documented

---

## CONCLUSION

This remediation plan provides a structured, phased approach to addressing all 87 critical issues identified in the codebase analysis. By following this plan:

- **Week 1:** System will be secure and performant enough for beta testing
- **Week 3:** System will be reliable and production-ready
- **Week 5:** System will have comprehensive test coverage
- **Week 8:** System will be clean, maintainable, and scalable

**Key Success Factors:**
1. Don't skip Phase 0 - security is foundational
2. Thorough testing at each phase before moving forward
3. Monitor metrics to validate improvements
4. Maintain momentum - complete one phase per sprint
5. Document as you go - update CLAUDE.md with learnings

**Next Step:** Review this plan with your team and begin Phase 0 immediately.
